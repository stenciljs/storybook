import { ArgsStoryFn, RenderContext } from '@storybook/types'
import { simulatePageLoad } from '@storybook/preview-api'
import { render as renderStencil } from '@stencil/core'

import { componentToJSX } from './component-to-jsx'
import type { StencilRenderer } from './types'

export const render: ArgsStoryFn<StencilRenderer<unknown>> = (args, context) => {
    const { component } = context;

    if (Array.isArray(component)) {
        throw new Error('If your story does not contain a render function, you must provide a component property!')
    }

    const cmpName = customElements.getName(component)
    if (!cmpName) {
        throw new Error('Component is not registered!')
    }

    return componentToJSX(cmpName, args)
};

/**
 * Transforms the source code for display in Storybook's code panel
 */
export const transformSource = (source: string, storyContext: RenderContext<StencilRenderer<unknown>>['storyContext']) => {
    const { args, component } = storyContext;
    
    if (!component) {
        return source;
    }
    
    const cmpName = customElements.getName(component);
    if (!cmpName) {
        return source;
    }
    
    // Create a pretty version of the args for display
    const argEntries = Object.entries(args)
        .filter(([key]) => key !== 'children' && key !== 'ref')
        .map(([key, value]) => {
            if (typeof value === 'string') {
                return `${key}="${value}"`;
            }
            if (typeof value === 'number') {
                return `${key}={${value}}`;
            }
            if (typeof value === 'boolean' && value) {
                return key;
            }
            if (value != null) {
                return `${key}={${JSON.stringify(value)}}`;
            }
            return null;
        })
        .filter(Boolean);
    
    // Construct a clean HTML-like representation of the component
    return `<${cmpName}${argEntries.length ? ' ' + argEntries.join(' ') : ''}>${
        args.children ? `\n  ${args.children}\n` : ''
    }</${cmpName}>`;
};

export function renderToCanvas(
    { storyFn, showMain, storyContext }: RenderContext<StencilRenderer<unknown>>,
    canvasElement: StencilRenderer<unknown>['canvasElement']
) {
    const vdom = storyFn()
    showMain()

    /**
     * If the component is not automatically registered after import, register it here
     */
    if (storyContext.component && storyContext.component.is && !customElements.get(storyContext.component.is)) {
        customElements.define(storyContext.component.is, storyContext.component);
    }

    if (canvasElement.firstChild) {
        canvasElement.removeChild(canvasElement.firstChild)
    }

    const element = document.createElement('div')
    canvasElement.appendChild(element)
    renderStencil(vdom, element);
    simulatePageLoad(element)
}
