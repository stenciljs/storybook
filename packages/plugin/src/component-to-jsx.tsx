import { h } from '@stencil/core';
import { Args } from "./types.js";

export const componentToJSX = (tagName: string, args: Args) => {
    const Component = `${tagName}`
    return <Component {...args} />;
};