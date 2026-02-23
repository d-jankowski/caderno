import {useCallback, useRef} from 'react';
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
import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListItemNode, ListNode} from '@lexical/list';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {$convertToMarkdownString, $convertFromMarkdownString, TRANSFORMERS} from '@lexical/markdown';
import {$getSelection, $isRangeSelection, EditorState} from 'lexical';
import {ImageNode, IMAGE_TRANSFORMER, $createImageNode} from './ImageNode';

// IMAGE_TRANSFORMER must come before TRANSFORMERS so it takes precedence over the LINK transformer
const ALL_TRANSFORMERS = [IMAGE_TRANSFORMER, ...TRANSFORMERS];

interface EditorProps {
    initialContent?: string;
    onChange?: (content: string) => void;
    placeholder?: string;
    fontSize?: number;
    onImageQueued?: (blobUrl: string, file: File) => void;
    onLocationClick?: () => void;
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

// Toolbar plugin
function ToolbarPlugin({onImageQueued, onLocationClick}: {onImageQueued?: (blobUrl: string, file: File) => void; onLocationClick?: () => void}) {
    const [editor] = useLexicalComposerContext();
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center gap-0.5 p-2 border-b border-slate-200 dark:border-slate-700 transition-colors">
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Insert Image"
                className="p-1.5 rounded transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
            </button>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleImageUpload}
            />
            <button
                type="button"
                onClick={() => onLocationClick?.()}
                title="Set Location"
                className="p-1.5 rounded transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
            </button>
        </div>
    );
}

export function Editor({
                           initialContent,
                           onChange,
                           placeholder = 'Start writing...',
                           fontSize = 16,
                           onImageQueued,
                           onLocationClick,
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
                <ToolbarPlugin onImageQueued={onImageQueued} onLocationClick={onLocationClick}/>
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
