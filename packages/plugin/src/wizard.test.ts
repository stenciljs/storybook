import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Meta, StoryObj } from './types';
import { generateExampleStories, wizard } from './wizard';

const storyTemplate = wizard.generate!.fileTemplates as { template: (...args: any[]) => string }[];
const template = storyTemplate[0].template;

describe('generated story files', () => {
  it('import a JS component and type the story by its tag name', () => {
    const story = template('my-button', 'MyButton', { cssOnly: false });

    expect(story).toContain(`import { MyButton } from './my-button';`);
    expect(story).toContain('component: MyButton,');
    expect(story).toContain(`satisfies Meta<'my-button'>;`);
    expect(story).toContain(`type Story = StoryObj<'my-button'>;`);
  });

  it('refer to a CSS-only component by tag name, with nothing to import', () => {
    const story = template('my-tag', 'MyTag', { cssOnly: true });

    expect(story).not.toContain(`from './my-tag'`);
    expect(story).toContain(`component: 'my-tag',`);
    expect(story).toContain(`satisfies Meta<'my-tag'>;`);
    expect(story).toContain(`type Story = StoryObj<'my-tag'>;`);
  });

  it('treat an older CLI that passes no component info as a JS component', () => {
    expect(template('my-button', 'MyButton')).toContain(`import { MyButton } from './my-button';`);
  });
});

describe('generateExampleStories', () => {
  let srcDir: string;
  const addFile = (path: string, content: string) => {
    mkdirSync(join(srcDir, 'components', path, '..'), { recursive: true });
    writeFileSync(join(srcDir, 'components', path), content);
  };
  const readStory = (path: string) => readFileSync(join(srcDir, 'components', path), 'utf8');

  beforeEach(() => {
    srcDir = mkdtempSync(join(tmpdir(), 'storybook-wizard-'));
  });

  afterEach(() => {
    rmSync(srcDir, { recursive: true, force: true });
  });

  it('writes stories for JS and CSS-only components, reading the CSS-only tag from its stylesheet', async () => {
    addFile('my-button/my-button.tsx', `@Component({ tag: 'my-button' })\nexport class MyButton {}`);
    addFile('badge/badge.css', `/**\n * @component\n * A badge.\n */\nmy-badge {\n  color: red;\n}\n`);
    addFile('plain/plain.css', `.not-a-component {}`);

    await generateExampleStories(srcDir);

    expect(readStory('my-button/my-button.stories.tsx')).toContain('component: MyButton,');
    expect(readStory('badge/my-badge.stories.tsx')).toContain(`component: 'my-badge',`);
    expect(() => readStory('plain/plain.stories.tsx')).toThrow();
  });
});

// Compile-time: a tag `components.d.ts` doesn't have yet is loosely typed rather than an error
({ component: 'not-yet-generated', args: { anything: 1 } }) satisfies Meta<'not-yet-generated'>;
({ args: { anything: 1, 'slot:default': 'x', '--x': 'red' } }) satisfies StoryObj<'not-yet-generated'>;
