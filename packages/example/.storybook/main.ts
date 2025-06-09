import type { StorybookConfig } from "@stencil/storybook-plugin";

const config: StorybookConfig = {
  framework: {
    name: "@stencil/storybook-plugin"
  },
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-docs"],
};

export default config;
