import {useCallback, useEffect, useRef, useState} from 'react';
import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {HistoryPlugin} from '@lexical/react/LexicalHistoryPlugin';
import {OnChangePlugin} from '@lexical/react/LexicalOnChangePlugin';
import {MarkdownShortcutPlugin} from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$createHeadingNode, $createQuoteNode, HeadingNode, QuoteNode} from '@lexical/rich-text';
import {INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND, ListItemNode, ListNode} from '@lexical/list';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {$convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS} from '@lexical/markdown';
import {$createParagraphNode, $getSelection, $isRangeSelection, EditorState, FORMAT_TEXT_COMMAND} from 'lexical';
import {ImageNode, IMAGE_TRANSFORMER, $createImageNode} from './ImageNode';
import {$setBlocksType} from '@lexical/selection';
import {mergeRegister} from '@lexical/utils';

// IMAGE_TRANSFORMER must come before TRANSFORMERS so it takes precedence over the LINK transformer
const ALL_TRANSFORMERS = [IMAGE_TRANSFORMER, ...TRANSFORMERS];

interface EditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    fontSize?: number;
    onImageQueued?: (blobUrl: string, file: File) => void;
}

const theme = {
    paragraph: 'mb-2',
    heading: {
        h1: 'text-3xl font-bold mb-4',
        h2: 'text-2xl font-bold mb-3',
        h3: 'text-xl font-bold mb-2',
        h4: 'text-lg font-bold mb-2',
        h5: 'text-base font-bold mb-1',
    },
    list: {
        ul: 'list-disc ml-6 mb-2',
        ol: 'list-decimal ml-6 mb-2',
        listitem: 'mb-1',
    },
    quote: 'border-l-4 border-slate-300 pl-4 italic text-slate-600 dark:border-slate-600 dark:text-slate-400 mb-2 transition-colors',
    code: 'bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 font-mono text-sm transition-colors',
    codeHighlight: {
        atrule: 'text-blue-500',
        attr: 'text-blue-500',
        boolean: 'text-purple-500',
        builtin: 'text-green-500',
        cdata: 'text-slate-500',
        char: 'text-green-500',
        class: 'text-yellow-500',
        'class-name': 'text-yellow-500',
        comment: 'text-slate-500',
        constant: 'text-purple-500',
        deleted: 'text-red-500',
        doctype: 'text-slate-500',
        entity: 'text-slate-500',
        function: 'text-blue-500',
        important: 'text-red-500',
        inserted: 'text-green-500',
        keyword: 'text-purple-500',
        namespace: 'text-slate-500',
        number: 'text-purple-500',
        operator: 'text-slate-500',
        prolog: 'text-slate-500',
        property: 'text-blue-500',
        punctuation: 'text-slate-500',
        regex: 'text-red-500',
        selector: 'text-green-500',
        string: 'text-green-500',
        symbol: 'text-purple-500',
        tag: 'text-red-500',
        url: 'text-blue-500',
        variable: 'text-red-500',
    },
    link: 'text-primary-600 hover:text-primary-700 underline dark:text-primary-400 transition-colors',
    text: {
        bold: 'font-bold',
        italic: 'italic',
        strikethrough: 'line-through',
        underline: 'underline',
        code: 'bg-slate-100 dark:bg-slate-800 rounded px-1 py-0.5 font-mono text-sm transition-colors',
    },
};

function Placeholder({text}: { text: string }) {
    return (
        <div className="editor-placeholder text-slate-400 dark:text-slate-500 transition-colors">
            {text}
        </div>
    );
}

// Toolbar button component
function ToolbarButton({
                           onClick,
                           isActive,
                           disabled,
                           children,
                           title,
                       }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            disabled={disabled}
            className={`p-1.5 rounded transition-colors ${
                disabled
                    ? 'opacity-40 cursor-not-allowed text-slate-400 dark:text-slate-600'
                    : isActive
                        ? 'bg-slate-200 dark:bg-slate-700 text-primary-600 dark:text-primary-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
        >
            {children}
        </button>
    );
}

// Toolbar divider
function ToolbarDivider() {
    return <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1 transition-colors"/>;
}

// Toolbar plugin
function ToolbarPlugin({onImageQueued}: {onImageQueued?: (blobUrl: string, file: File) => void}) {
    const [editor] = useLexicalComposerContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isCode, setIsCode] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
            setIsBold(selection.hasFormat('bold'));
            setIsItalic(selection.hasFormat('italic'));
            setIsUnderline(selection.hasFormat('underline'));
            setIsStrikethrough(selection.hasFormat('strikethrough'));
            setIsCode(selection.hasFormat('code'));
        }
    }, []);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({editorState}) => {
                editorState.read(() => {
                    updateToolbar();
                });
            })
        );
    }, [editor, updateToolbar]);

    const formatHeading = (headingSize: 'h1' | 'h2' | 'h3') => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createHeadingNode(headingSize));
            }
        });
    };

    const formatParagraph = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createParagraphNode());
            }
        });
    };

    const formatQuote = () => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                $setBlocksType(selection, () => $createQuoteNode());
            }
        });
    };

    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        const blobUrl = URL.createObjectURL(file);
        onImageQueued?.(blobUrl, file);
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                selection.insertNodes([$createImageNode(blobUrl, file.name)]);
            }
        });
    }, [editor, onImageQueued]);

    return (
        <div
            className="flex items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-700 flex-wrap transition-colors">
            {/* Text formatting */}
            <ToolbarButton
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
                isActive={isBold}
                title="Bold (Ctrl+B)"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                          d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
                isActive={isItalic}
                title="Italic (Ctrl+I)"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m0 0h4"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
                isActive={isUnderline}
                title="Underline (Ctrl+U)"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M7 4v7a5 5 0 0010 0V4M5 20h14"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
                isActive={isStrikethrough}
                title="Strikethrough"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 10H7m10 4H7m12-2H5"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
                isActive={isCode}
                title="Inline Code"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
                </svg>
            </ToolbarButton>

            <ToolbarDivider/>

            {/* Block formatting */}
            <ToolbarButton onClick={formatParagraph} title="Paragraph">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton onClick={() => formatHeading('h1')} title="Heading 1">
                <span className="text-xs font-bold">H1</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => formatHeading('h2')} title="Heading 2">
                <span className="text-xs font-bold">H2</span>
            </ToolbarButton>
            <ToolbarButton onClick={() => formatHeading('h3')} title="Heading 3">
                <span className="text-xs font-bold">H3</span>
            </ToolbarButton>

            <ToolbarDivider/>

            {/* Lists and quote */}
            <ToolbarButton
                onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
                title="Bullet List"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 6h.01M8 6h12M4 12h.01M8 12h12M4 18h.01M8 18h12"/>
                </svg>
            </ToolbarButton>
            <ToolbarButton
                onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
                title="Numbered List"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 6h.01M4 6v.01M8 6h12M4 11h.01v.01H4zm0 1h.01M8 12h12M4 17h.01v.01H4zm0 1h.01M8 18h12"/>
                    <text x="2" y="8" fontSize="6" fill="currentColor" fontWeight="bold">1</text>
                    <text x="2" y="14" fontSize="6" fill="currentColor" fontWeight="bold">2</text>
                    <text x="2" y="20" fontSize="6" fill="currentColor" fontWeight="bold">3</text>
                </svg>
            </ToolbarButton>
            <ToolbarButton onClick={formatQuote} title="Quote">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/>
                </svg>
            </ToolbarButton>

            <ToolbarDivider/>

            {/* Image upload */}
            <ToolbarButton
                onClick={() => fileInputRef.current?.click()}
                title="Insert Image"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </ToolbarButton>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
            />
        </div>
    );
}

// Plugin to load initial content - only runs once on mount
// function InitialContentPlugin({
//                                   initialContent,
//                               }: {
//     initialContent?: string;
// }) {
//     const [editor] = useLexicalComposerContext();
//     const isInitialized = useRef(false);
//
//     useEffect(() => {
//         // Only set initial content once, and only if it's valid
//         if (initialContent && !isInitialized.current) {
//             isInitialized.current = true;
//             try {
//                 const editorState = $convertFromMarkdownString(initialContent, TRANSFORMERS)
//                 editor.setEditorState(editorState);
//             } catch (error) {
//                 console.error('Failed to parse editor state:', error);
//             }
//         }
//     }, [editor, initialContent]);
//
//     return null;
// }

export function Editor({
                           initialContent,
                           onChange,
                           placeholder = 'Start writing...',
                           fontSize = 16,
                           onImageQueued,
                       }: EditorProps) {
    const initialConfig = {
        namespace: 'CadernoEditor',
        theme,
        onError: (error: Error) => {
            console.error('Lexical error:', error);
        },
        editorState: () => {
            $convertFromMarkdownString(initialContent || '', ALL_TRANSFORMERS);
        },
        nodes: [
            HeadingNode,
            QuoteNode,
            ListNode,
            ListItemNode,
            LinkNode,
            AutoLinkNode,
            CodeNode,
            CodeHighlightNode,
            ImageNode,
        ],
    };

    const handleChange = useCallback(
        (editorState: EditorState) => {
            if (onChange) {
                editorState.read(() => {
                    const content = $convertToMarkdownString(ALL_TRANSFORMERS);
                    onChange(content);
                });
            }
        },
        [onChange]
    );

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <div
                className="editor-container relative rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 transition-colors">
                <ToolbarPlugin onImageQueued={onImageQueued}/>
                <RichTextPlugin
                    contentEditable={
                        <ContentEditable
                            className="editor-input min-h-[300px] p-4 outline-none prose prose-slate dark:prose-dark max-w-none"
                            style={{fontSize: `${fontSize}px`}}
                        />
                    }
                    placeholder={<Placeholder text={placeholder}/>}
                    ErrorBoundary={LexicalErrorBoundary}
                />
                <HistoryPlugin/>
                <ListPlugin/>
                <LinkPlugin/>
                <MarkdownShortcutPlugin transformers={ALL_TRANSFORMERS}/>
                <OnChangePlugin onChange={handleChange}/>
            </div>
        </LexicalComposer>
    );
}
