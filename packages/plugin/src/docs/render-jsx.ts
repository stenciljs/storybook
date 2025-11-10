import { type VNode } from '@stencil/core';

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function vnodeToJsx(node: VNode, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);

  if (node.$text$ !== null) {
    return indent + node.$text$;
  }

  if (node.$tag$ === null) {
    return '';
  }

  const tag = typeof node.$tag$ === 'string' ? kebabToPascal(node.$tag$) : String(node.$tag$);
  const attrs = node.$attrs$
    ? Object.entries(node.$attrs$)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => {
          // Convert 'class' to 'className' for JSX
          const attrName = key === 'class' ? 'className' : key;

          if (typeof value === 'boolean') {
            return value ? ` ${attrName}` : '';
          }
          if (typeof value === 'string') {
            return ` ${attrName}="${value}"`;
          }
          // For other types (numbers, objects, etc.), use curly braces
          return ` ${attrName}={${JSON.stringify(value)}}`;
        })
        .join('')
    : '';

  const children = node.$children$ ?? [];

  if (children.length === 0) {
    return `${indent}<${tag}${attrs} />`;
  }

  const childrenJsx = children.map((child) => vnodeToJsx(child, indentLevel + 1)).join('\n');

  return `${indent}<${tag}${attrs}>\n${childrenJsx}\n${indent}</${tag}>`;
}

export const renderJSX = (vnode: VNode) => {
  return vnodeToJsx(vnode);
};
