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

export function renderToCanvas(
    { storyFn, showMain }: RenderContext<StencilRenderer<unknown>>,
    canvasElement: StencilRenderer<unknown>['canvasElement']
) {
    const vdom = storyFn()
    showMain()

    if (canvasElement.firstChild) {
        canvasElement.removeChild(canvasElement.firstChild)
    }

    const element = document.createElement('div')
    canvasElement.appendChild(element)
    renderStencil(vdom, element);
    simulatePageLoad(element)
}
