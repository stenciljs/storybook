import { type VNode } from '@stencil/core';

function vnodeToHtml(node: VNode, indentLevel = 0): string {
  const indent = '  '.repeat(indentLevel);

  if (node.$text$ !== null) {
    return indent + node.$text$;
  }

  if (node.$tag$ === null) {
    return '';
  }

  const tag = node.$tag$;

  const attrs = node.$attrs$
    ? Object.entries(node.$attrs$)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => ` ${key}="${value}"`)
        .join('')
    : '';

  const children = node.$children$ ?? [];

  if (children.length === 0) {
    return `${indent}<${tag}${attrs}></${tag}>`;
  }

  const childrenHtml = children.map((child) => vnodeToHtml(child, indentLevel + 1)).join('\n');

  return `${indent}<${tag}${attrs}>\n${childrenHtml}\n${indent}</${tag}>`;
}

export const renderHTML = (vnode: VNode) => {
  return vnodeToHtml(vnode);
};
