import { SourceType } from 'storybook/internal/docs-tools';
import type { DecoratorFunction, ArgsStoryFn, StoryContext } from 'storybook/internal/types';
import { emitTransformCode, useEffect } from 'storybook/preview-api';
import { VNode } from '@stencil/core';

import type { StencilRenderer } from '../types';

interface SlotContent {
  [key: string]: any;
}

/**
 * Determines whether to skip source rendering based on story context
 */
function skipSourceRender(context: StoryContext<StencilRenderer<unknown>>) {
  const sourceParams = context?.parameters.docs?.source;
  const isArgsStory = context?.parameters.__isArgsStory;

  // Always render if the user forces it
  if (sourceParams?.type === SourceType.DYNAMIC) {
    return false;
  }

  // Never render if the user is forcing the block to render code, or
  // if the user provides code, or if it's not an args story.
  return !isArgsStory || sourceParams?.code || sourceParams?.type === SourceType.CODE;
}

/**
 * Format a value for display in source code
 */
function formatValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle functions
  if (typeof value === 'function') {
    return `{() => {}}`;
  }

  if (typeof value === 'string') {
    // Escape quotes in strings
    const escaped = value.replace(/"/g, '\\"');
    return `"${escaped}"`;
  }

  if (typeof value === 'boolean') {
    // For boolean values, return them as-is (true/false)
    return value.toString();
  }

  if (Array.isArray(value)) {
    // For arrays, stringify them with proper formatting
    try {
      return `[${value.map(v => formatValue(v)).join(', ')}]`;
    } catch (e) {
      return '[]';
    }
  }

  if (typeof value === 'object') {
    // For objects, stringify them with proper formatting
    try {
      if (Object.keys(value).length === 0) return '{}';
      const entries = Object.entries(value).map(([k, v]) =>
        `${k}: ${formatValue(v)}`
      ).join(', ');
      return `{${entries}}`;
    } catch (e) {
      return '{}';
    }
  }

  // For numbers and other primitives, return as string
  return String(value);
}

/**
 * Serializes a VNode to JSX string
 */
function serializeVNode(vnode: VNode): string {
  if (!vnode || typeof vnode !== 'object') {
    return String(vnode);
  }

  // Handle text nodes
  if (vnode.$text$ !== null) {
    return vnode.$text$;
  }

  // Handle element nodes
  const tag = vnode.$tag$ || 'div';
  const attrs = vnode.$attrs$ || {};
  const children = vnode.$children$ || [];

  // Format attributes
  const attrsStr = Object.entries(attrs)
    .filter(([key]) => key !== 'class' && key !== 'style' && key !== 'slot')
    .map(([key, value]) => {
      if (value === true) return key;
      if (value === false || value === null || value === undefined) return '';
      return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
    })
    .filter(Boolean)
    .join(' ');

  // Handle class
  const classAttr = attrs.class ? ` class="${attrs.class}"` : '';

  // Handle style object - output as JSX style object
  const styleAttr = attrs.style ? ` style={${JSON.stringify(attrs.style)}}` : '';

  // Combine all attributes
  const allAttrs = [attrsStr, classAttr, styleAttr].filter(Boolean).join(' ');
  const attrStr = allAttrs ? ` ${allAttrs}` : '';

  // Handle self-closing tags
  if (children.length === 0) {
    return `<${tag}${attrStr} />`;
  }

  // Recursively process children
  const childrenStr = children
    .map((child: any) => {
      if (child && typeof child === 'object') {
        return serializeVNode(child);
      }
      return String(child);
    })
    .join('\n');

  return `<${tag}${attrStr}>\n${childrenStr}\n</${tag}>`;
}

/**
 * Formats a value for display in source code
 */
function formatSlotValue(value: any): string {
  if (value === undefined || value === null) {
    return '';
  }

  // Handle VNode objects from Stencil's h() function
  if (value && typeof value === 'object' && '$tag$' in value) {
    return serializeVNode(value);
  }

  if (Array.isArray(value)) {
    return value.map(v => formatSlotValue(v)).join('\n');
  }

  if (typeof value === 'object') {
    if ('default' in value) {
      return formatSlotValue(value.default);
    }
    // For other objects, try to stringify them
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }

  return String(value);
}

/**
 * Generates slot content for a component
 */
function generateSlotContent(slotName: string, content: any): string {
  // Handle arrays of content for the same slot
  if (Array.isArray(content)) {
    return content
      .map(item => generateSlotContent(slotName, item))
      .filter(Boolean)
      .join('\n');
  }

  // Format the content, handling VNodes appropriately
  let formattedContent = formatSlotValue(content);
  if (!formattedContent) return '';

  // For default slot, return content directly without wrapping
  if (slotName === 'default') {
    return formattedContent;
  }

  // For VNodes, add the slot attribute to the root element
  if (content && typeof content === 'object' && '$tag$' in content) {
    // If it's a VNode, we'll add the slot attribute directly to the root element
    if (formattedContent.startsWith('<')) {
      // Add slot attribute to the first opening tag if it doesn't have one
      if (!formattedContent.includes(' slot=')) {
        return formattedContent.replace(/^(<[^>\s]+)/, `$1 slot="${slotName}"`);
      }
      return formattedContent;
    }
  }

  // For simple strings or other content, wrap in a span with the slot attribute
  return `<span slot="${slotName}">${formattedContent}</span>`;
}

/**
 * Checks if a prop should be included in the source output
 */
function shouldIncludeProp(
  key: string,
  value: any,
  slots?: Record<string, any>
): boolean {
  // Always include if value is not null/undefined
  if (value === undefined || value === null) {
    return false;
  }

  // Don't include internal Storybook props
  if (key.startsWith('__') || key === 'children') {
    return false;
  }

  // Don't include slot props if they're handled by slots
  if (slots && key in slots) {
    return false;
  }

  return true;
}

/**
 * Generates a JSX-like string representation of a component with its props and slots
 */
function generateComponentSource(
  tagName: string,
  args: VNode,
  slots?: Record<string, any>
): string {
  // Filter and format props
  const props = Object.entries(args)
    .filter(([key, value]) => shouldIncludeProp(key, value, slots))
    .map(([key, value]) => {
      // Handle function props
      if (typeof value === 'function') {
        return `${key}=${formatValue(value)}`;
      }

      // Handle string props with quotes
      if (typeof value === 'string') {
        return `${key}=${formatValue(value)}`;
      }

      // Handle boolean props (show just the name if true)
      if (typeof value === 'boolean') {
        return value ? key : `${key}={false}`;
      }

      // Handle objects, arrays, and other values
      return `${key}={${formatValue(value)}}`;
    })
    .join(' ');

  // Generate slot content if available
  let slotContent = '';
  if (slots) {
    slotContent = Object.entries(slots)
      .map(([name, content]) => generateSlotContent(name, content))
      .join('\n');
  }

  const hasSlots = slotContent.trim().length > 0;
  const hasProps = props.length > 0;
  const openingTag = hasProps ? `<${tagName} ${props}` : `<${tagName}`;

  if (!hasSlots) {
    return hasProps
      ? `${openingTag}></${tagName}>`
      : `<${tagName}></${tagName}>`;
  }

  return `${openingTag}>\n${slotContent}\n</${tagName}>`;
}

/**
 * Gets the tag name for a Stencil component
 */
function getComponentTagName(component: any): string | null {
  // First try to get the tag name from the custom elements registry
  if (component && customElements) {
    const tagName = customElements.getName(component);
    if (tagName) {
      return tagName;
    }
  }

  // If that fails, try to get it from the component definition
  if (component && component.is) {
    return component.is;
  }

  // If both methods fail, return null
  return null;
}

/**
 * Extracts slot content from story parameters
 */
function extractSlotsFromParameters(context: StoryContext<StencilRenderer<unknown>>) {
  const slots = context.parameters?.slots;
  if (!slots) return undefined;

  // Handle both direct slots and slots under the 'slots' property for backward compatibility
  return typeof slots === 'object' && !Array.isArray(slots) ? slots : undefined;
}

/**
 * Source decorator for Stencil components
 * Generates dynamic source code based on the component, its args, and slots
 */
export const sourceDecorator: DecoratorFunction<StencilRenderer<unknown>> = (storyFn, context) => {
  const story = storyFn();

  useEffect(() => {
    if (!skipSourceRender(context)) {
      const { component } = context;

      if (!component) {
        return;
      }

      // Get the component's tag name
      const tagName = getComponentTagName(component);

      if (!tagName) {
        console.warn('Could not determine tag name for component in story:', context.id);
        return;
      }

      // Extract slots from parameters
      const slots = extractSlotsFromParameters(context);

      // Generate source code with props and slots
      const source = generateComponentSource(tagName, context.args as VNode, slots);

      // Emit the source code for transformation
      emitTransformCode(source, context);
    }
  });

  return story;
};
