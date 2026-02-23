import {DecoratorNode, LexicalNode, NodeKey, SerializedLexicalNode, Spread} from 'lexical';
import type {TextMatchTransformer} from '@lexical/markdown';
import {type ReactElement, useEffect, useState} from 'react';
import {api} from '../../lib/api';

type SerializedImageNode = Spread<
    {src: string; alt: string; type: 'image'; version: 1},
    SerializedLexicalNode
>;

function ImageComponent({src, alt}: {src: string; alt: string}) {
    const isBlob = src.startsWith('blob:');
    const [blobUrl, setBlobUrl] = useState<string | null>(isBlob ? src : null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (isBlob) return;
        let objectUrl: string | null = null;
        api.fetchImageBlob(src)
            .then(blob => {
                objectUrl = URL.createObjectURL(blob);
                setBlobUrl(objectUrl);
            })
            .catch(() => setHasError(true));
        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [src, isBlob]);

    if (hasError) {
        return (
            <span className="text-slate-400 text-sm italic">
                [Image unavailable{alt ? `: ${alt}` : ''}]
            </span>
        );
    }

    if (!blobUrl) {
        return <span className="text-slate-400 text-sm italic">Loading image…</span>;
    }

    return (
        <img
            src={blobUrl}
            alt={alt}
            className="max-w-full h-auto rounded my-2 block"
        />
    );
}

export class ImageNode extends DecoratorNode<ReactElement> {
    __src: string;
    __alt: string;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__alt, node.__key);
    }

    constructor(src: string, alt: string, key?: NodeKey) {
        super(key);
        this.__src = src;
        this.__alt = alt;
    }

    static importJSON(serialized: SerializedImageNode): ImageNode {
        return new ImageNode(serialized.src, serialized.alt);
    }

    exportJSON(): SerializedImageNode {
        return {
            type: 'image',
            version: 1,
            src: this.__src,
            alt: this.__alt,
        };
    }

    createDOM(): HTMLElement {
        return document.createElement('span');
    }

    updateDOM(): false {
        return false;
    }

    isInline(): boolean {
        return true;
    }

    decorate(): ReactElement {
        return <ImageComponent src={this.__src} alt={this.__alt}/>;
    }
}

export function $createImageNode(src: string, alt: string): ImageNode {
    return new ImageNode(src, alt);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}

export const IMAGE_TRANSFORMER: TextMatchTransformer = {
    dependencies: [ImageNode],
    export: (node) => {
        if (!$isImageNode(node)) return null;
        return `![${node.__alt}](${node.__src})`;
    },
    importRegExp: /!\[([^\[\]]*)\]\(([^)]+)\)/,
    regExp: /!\[([^\[\]]*)\]\(([^)]+)\)$/,
    replace: (textNode, match) => {
        const [, alt, src] = match;
        textNode.replace($createImageNode(src, alt));
    },
    trigger: ')',
    type: 'text-match',
};
