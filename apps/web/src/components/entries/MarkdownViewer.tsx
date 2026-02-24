import {LexicalComposer} from '@lexical/react/LexicalComposer';
import {RichTextPlugin} from '@lexical/react/LexicalRichTextPlugin';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import {LexicalErrorBoundary} from '@lexical/react/LexicalErrorBoundary';
import {ListPlugin} from '@lexical/react/LexicalListPlugin';
import {LinkPlugin} from '@lexical/react/LexicalLinkPlugin';
import {$convertFromMarkdownString} from '@lexical/markdown';
import {ALL_TRANSFORMERS, LEXICAL_NODES, lexicalTheme} from './lexicalConfig';

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({content}: MarkdownViewerProps) {
  const initialConfig = {
    namespace: 'CadernoViewer',
    editable: false,
    theme: lexicalTheme,
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
    editorState: () => {
      $convertFromMarkdownString(content, ALL_TRANSFORMERS);
    },
    nodes: LEXICAL_NODES,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable className="outline-none prose prose-slate dark:prose-invert max-w-none text-slate-900 dark:text-slate-100" />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <ListPlugin />
      <LinkPlugin />
    </LexicalComposer>
  );
}
