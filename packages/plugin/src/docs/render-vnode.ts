import { type VNode } from '@stencil/core';

type RenderMode = 'html' | 'jsx';

interface RenderOptions {
  mode: RenderMode;
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function vnodeToString(node: VNode, options: RenderOptions, indentLevel = 0): string {
  const LINE_WIDTH = 80;
  const indent = '  '.repeat(indentLevel);
  const { mode } = options;

  if (node.$text$ !== null) {
    return indent + node.$text$;
  }

  if (node.$tag$ === null) {
    return '';
  }

  // Convert tag name based on mode
  // Only convert to PascalCase if it's a custom element (has a dash)
  const tag =
    mode === 'jsx' && typeof node.$tag$ === 'string' && node.$tag$.includes('-')
      ? kebabToPascal(node.$tag$)
      : String(node.$tag$);

  // Process attributes as array (without leading spaces)
  const attrArray = node.$attrs$
    ? Object.entries(node.$attrs$)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Convert HTML attributes to JSX equivalents
          let attrName = key;
          if (mode === 'jsx') {
            // Common HTML to JSX attribute conversions
            const htmlToJsx: Record<string, string> = {
              class: 'className',
              for: 'htmlFor',
              tabindex: 'tabIndex',
            };
            attrName = htmlToJsx[key] || key;
          }

          if (typeof value === 'function') {
            // Hide event handlers from source code
            return '';
          }

          if (typeof value === 'boolean') {
            return value ? attrName : '';
          }

          if (typeof value === 'string') {
            return `${attrName}="${value}"`;
          }

          // For JSX, use curly braces for non-string values
          if (mode === 'jsx') {
            return `${attrName}={${JSON.stringify(value)}}`;
          }

          // For HTML, convert to string
          return `${attrName}="${value}"`;
        })
        .filter((attr) => attr.trim())
    : [];

  const children = node.$children$ ?? [];

  // Self-closing tags for JSX when no children
  if (children.length === 0) {
    const attrsStr = attrArray.length > 0 ? ' ' + attrArray.join(' ') : '';
    const singleLine = mode === 'jsx'
      ? `${indent}<${tag}${attrsStr} />`
      : `${indent}<${tag}${attrsStr}></${tag}>`;

    // If single line fits within LINE_WIDTH, use it
    if (singleLine.length <= LINE_WIDTH) {
      return singleLine;
    }

    // Otherwise, break attributes to multiple lines
    const attrIndent = indent + '  ';
    const formattedAttrs = attrArray.length > 0
      ? '\n' + attrArray.map((attr) => `${attrIndent}${attr}`).join('\n') + '\n' + indent
      : '';

    return mode === 'jsx'
      ? `${indent}<${tag}${formattedAttrs}/>`
      : `${indent}<${tag}${formattedAttrs}></${tag}>`;
  }

  // Tags with children
  const attrsStr = attrArray.length > 0 ? ' ' + attrArray.join(' ') : '';
  const openingTag = `${indent}<${tag}${attrsStr}>`;

  // Check if opening tag fits on one line
  if (openingTag.length <= LINE_WIDTH) {
    const childrenString = children
      .map((child) => vnodeToString(child, options, indentLevel + 1))
      .join('\n');
    return `${openingTag}\n${childrenString}\n${indent}</${tag}>`;
  }

  // Break opening tag to multiple lines
  const attrIndent = indent + '  ';
  const formattedAttrs = attrArray.length > 0
    ? '\n' + attrArray.map((attr) => `${attrIndent}${attr}`).join('\n') + '\n' + indent
    : '';
  const childrenString = children
    .map((child) => vnodeToString(child, options, indentLevel + 1))
    .join('\n');

  return `${indent}<${tag}${formattedAttrs}>\n${childrenString}\n${indent}</${tag}>`;
}

export const renderVNode = (vnode: VNode, mode: RenderMode) => {
  return vnodeToString(vnode, { mode });
};
