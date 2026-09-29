import type { GeneratedComponentInfo, StencilWizardPlugin, WizardContext } from '@stencil/cli';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const STORYBOOK_MAIN = `import type { StorybookConfig } from '@stencil/storybook-plugin';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-docs'],
  framework: {
    name: '@stencil/storybook-plugin',
  },
};

export default config;
`;

const STORYBOOK_PREVIEW = `import type { Preview } from '@stencil/storybook-plugin';

export const parameters: Preview['parameters'] = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  docs: {
    source: {
      excludeDecorators: true,
    },
  },
};

export const tags: Preview['tags'] = ['autodocs'];
`;

const STORYBOOK_TSCONFIG = JSON.stringify(
  {
    extends: '../tsconfig.json',
    compilerOptions: {
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      resolveJsonModule: true,
      module: 'Preserve',
      rootDir: '../',
    },
    exclude: ['../**/*.spec.ts', '../**/*.test.ts', '../**/*.spec.tsx', '../**/*.test.tsx'],
    include: [
      '../src/**/*.stories.ts',
      '../src/**/*.stories.tsx',
      '../src/**/*.stories.mdx',
      '**/*.ts',
      '**/*.tsx',
      'main.js',
    ],
  },
  null,
  2,
);

function toPascalCase(tagName: string): string {
  return tagName.replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase());
}

// A CSS-only component is a `@component`-marked rule in a stylesheet - no JS class
const CSS_ONLY_STYLE_EXTENSIONS = ['css', 'scss', 'sass', 'less'];
// the tag a `@component` doc comment is attached to, e.g. `/** @component ... */ my-tag {`
const CSS_ONLY_TAG_RE = /@component\b[\s\S]*?\*\/\s*([a-z][a-z0-9]*-[a-z0-9-]*)\s*[{,]/;

/**
 * @param componentDir a component's directory
 * @param name the directory's name
 * @returns the component's tag name and whether it's CSS-only, or `undefined` if there's none
 */
async function findComponent(
  componentDir: string,
  name: string,
): Promise<{ tagName: string; cssOnly: boolean } | undefined> {
  const componentFile = join(componentDir, `${name}.tsx`);
  if (await fileExists(componentFile)) {
    const source = await readFile(componentFile, 'utf8');
    if (!source.includes('@Component')) return undefined;
    const tagMatch = source.match(/tag:\s*['"]([^'"]+)['"]/);
    return { tagName: tagMatch?.[1] ?? name, cssOnly: false };
  }
  for (const ext of CSS_ONLY_STYLE_EXTENSIONS) {
    const styleFile = join(componentDir, `${name}.${ext}`);
    if (!(await fileExists(styleFile))) continue;
    const source = await readFile(styleFile, 'utf8');
    if (!source.includes('@component')) continue;
    return { tagName: source.match(CSS_ONLY_TAG_RE)?.[1] ?? name, cssOnly: true };
  }
  return undefined;
}

export async function generateExampleStories(srcDir: string): Promise<void> {
  const componentsDir = join(srcDir, 'components');
  const entries = await readdir(componentsDir, { withFileTypes: true }).catch(() => []);

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const componentDir = join(componentsDir, entry.name);
    const component = await findComponent(componentDir, entry.name);
    if (!component) continue;

    const storiesFile = join(componentDir, `${component.tagName}.stories.tsx`);
    if (await fileExists(storiesFile)) continue;

    await writeFile(
      storiesFile,
      storiesTemplate(component.tagName, toPascalCase(component.tagName), { cssOnly: component.cssOnly }),
      'utf8',
    );
  }
}

async function updatePackageJsonScripts(rootDir: string): Promise<void> {
  const pkgPath = join(rootDir, 'package.json');
  const content = await readFile(pkgPath, 'utf8');
  const pkg = JSON.parse(content) as Record<string, any>;
  pkg['scripts'] ??= {};
  if (!pkg['scripts']['storybook']) pkg['scripts']['storybook'] = 'storybook dev -p 6006';
  if (!pkg['scripts']['build-storybook']) pkg['scripts']['build-storybook'] = 'storybook build';
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
}

/**
 * A story file for a component. Typed by tag name (`Meta<'my-tag'>`) - resolved from the project's
 * `components.d.ts` once it has the tag, and loosely typed until then.
 * @param tagName the component's tag name
 * @param className the PascalCase form of `tagName`
 * @param component what's being generated - a CSS-only component has no JS class to import, so
 * the story refers to it by tag name
 * @returns the story file's content
 */
function storiesTemplate(tagName: string, className: string, component?: GeneratedComponentInfo): string {
  const cssOnly = component?.cssOnly ?? false;
  const imports = cssOnly
    ? `import type { Meta, StoryObj } from '@stencil/storybook-plugin';`
    : `import type { Meta, StoryObj } from '@stencil/storybook-plugin';
import { ${className} } from './${tagName}';`;
  return `${imports}

const meta = {
  title: '${className}',
  component: ${cssOnly ? `'${tagName}'` : className},
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<'${tagName}'>;

export default meta;
type Story = StoryObj<'${tagName}'>;

export const Primary: Story = {
  args: {},
};
`;
}

export const wizard: StencilWizardPlugin = {
  init: {
    id: '@stencil/storybook-plugin',
    displayName: 'Storybook',
    description: 'Component development & documentation',

    async run({ config, isNewProject, prompts, nypm }: WizardContext): Promise<void> {
      const { intro, outro, confirm, isCancel, cancel, spinner } = prompts;
      const rootDir = config.rootDir;

      intro('Storybook - component development & documentation');

      const storybookDir = join(rootDir, '.storybook');

      if (await fileExists(storybookDir)) {
        const overwrite = await confirm({
          message: '.storybook/ already exists. Overwrite it?',
          initialValue: false,
        });
        if (isCancel(overwrite) || !overwrite) {
          cancel('Skipping Storybook setup - existing config kept.');
          return;
        }
      }

      const s = spinner();
      s.start('Installing dependencies');
      await nypm.addDependency(['storybook', '@storybook/addon-links', '@storybook/addon-docs'], {
        cwd: rootDir,
        dev: true,
      });
      s.stop('Dependencies installed');

      await mkdir(storybookDir, { recursive: true });
      await writeFile(join(storybookDir, 'main.ts'), STORYBOOK_MAIN, 'utf8');
      await writeFile(join(storybookDir, 'preview.tsx'), STORYBOOK_PREVIEW, 'utf8');
      await writeFile(join(storybookDir, 'tsconfig.json'), STORYBOOK_TSCONFIG + '\n', 'utf8');
      await updatePackageJsonScripts(rootDir);

      if (isNewProject) {
        await generateExampleStories(config.srcDir);
      }

      outro('Storybook configured! Run: npm run storybook');
    },
  },

  generate: {
    fileTemplates: [
      {
        label: 'Story (.stories.tsx)',
        extension: 'stories.tsx',
        selectedByDefault: true,
        template: storiesTemplate,
      },
    ],
  },
};
