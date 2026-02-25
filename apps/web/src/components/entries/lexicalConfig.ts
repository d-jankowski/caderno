import {HeadingNode, QuoteNode} from '@lexical/rich-text';
import {ListItemNode, ListNode} from '@lexical/list';
import {AutoLinkNode, LinkNode} from '@lexical/link';
import {CodeHighlightNode, CodeNode} from '@lexical/code';
import {TRANSFORMERS} from '@lexical/markdown';
import {ImageNode, IMAGE_TRANSFORMER} from './ImageNode';

// IMAGE_TRANSFORMER must come before TRANSFORMERS so it takes precedence over the LINK transformer
export const ALL_TRANSFORMERS = [IMAGE_TRANSFORMER, ...TRANSFORMERS];

export const LEXICAL_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  CodeNode,
  CodeHighlightNode,
  ImageNode,
];

export const lexicalTheme = {
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
  quote: 'border-l-4 border-paper-300 pl-4 italic text-ink-500 mb-2',
  code: 'bg-paper-200 rounded-sm px-1 py-0.5 font-mono text-sm',
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
  link: 'text-primary-600 hover:text-primary-700 underline transition-colors',
  text: {
    bold: 'font-bold',
    italic: 'italic',
    strikethrough: 'line-through',
    underline: 'underline',
    code: 'bg-paper-200 rounded-sm px-1 py-0.5 font-mono text-sm',
  },
};
