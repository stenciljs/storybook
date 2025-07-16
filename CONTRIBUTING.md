# Contributing to StencilJS Storybook

Thank you for your interest in contributing to the StencilJS Storybook project! This guide will help you understand how to contribute effectively to this monorepo.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)
- [Getting Help](#getting-help)

## Code of Conduct

This project follows the Contributor Covenant Code of Conduct. By participating, you are expected to uphold this code.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v22.13.1 (use the exact version specified in `.nvmrc`)
- **pnpm**: v10.10.0 (specified in `package.json` as `packageManager`)

### Installing Node.js

We recommend using a Node.js version manager:

```bash
# Using nvm
nvm install
nvm use

# Using volta (recommended)
volta install node@22.13.1
```

### Installing pnpm

```bash
npm install -g pnpm@10.10.0
```

## Development Setup

1. **Fork and Clone the Repository**

   ```bash
   git clone https://github.com/your-username/storybook.git
   cd storybook
   ```

2. **Install Dependencies**

   ```bash
   pnpm install
   ```

3. **Build the Project**

   ```bash
   pnpm build
   ```

4. **Start Development**

   ```bash
   # Start all development servers
   pnpm dev
   
   # Or start specific packages
   pnpm dev.plugin    # Watch mode for the plugin
   pnpm dev.example   # Start Storybook for the example package
   ```

## Project Structure

This is a monorepo containing the following packages:

```
packages/
├── plugin/           # @stencil/storybook-plugin - Core Storybook integration
├── example/          # example - Basic StencilJS project with Storybook
└── example-lazy/     # example-lazy - Lazy-loaded StencilJS components
```

### Key Files and Directories

- **`packages/plugin/`**: The main Storybook plugin for StencilJS
  - `src/`: TypeScript source code
  - `template/`: Component templates for Storybook CLI
  - `tsdown.config.ts`: Build configuration
- **`packages/example/`**: Reference implementation
- **`tests/`**: End-to-end tests using WebdriverIO
- **`.github/workflows/`**: CI/CD workflows for testing and releasing

## Development Workflow

### Working on the Plugin

1. **Make Changes** to the plugin source code in `packages/plugin/src/`

2. **Build in Watch Mode**:
   ```bash
   pnpm dev.plugin
   ```

3. **Test Your Changes** using the example projects:
   ```bash
   # In another terminal
   pnpm dev.example
   # or
   pnpm dev.example-lazy
   ```

4. **View Storybook** at `http://localhost:6006`

### Adding New Features

1. **Update the Plugin** in `packages/plugin/src/`
2. **Add Examples** in the example packages
3. **Write Tests** (see Testing section)
4. **Update Documentation** as needed

### Code Style

We use Prettier for code formatting:

```bash
# Format code
pnpm prettier

# Check formatting
pnpm prettier.dry-run
```

**Prettier Configuration**: Uses `@ionic/prettier-config`

## Testing

### Running Tests

```bash
# Run all tests
pnpm test-all

# Run specific test suites
pnpm test              # Standard example tests
pnpm test.example-lazy # Lazy-loaded example tests
```

### Test Structure

- **End-to-End Tests**: Located in `tests/` directory
- **Component Tests**: Individual component tests in each package
- **Framework**: Uses WebdriverIO with Mocha

### Writing Tests

1. **Component Tests**: Add tests alongside your components using Jest
2. **E2E Tests**: Add new test files in `tests/` directory
3. **Test Configuration**: Modify `wdio.conf.ts` if needed

Example test structure:
```typescript
// tests/your-feature.e2e.ts
import { browser } from '@wdio/globals';

describe('Your Feature', () => {
  it('should work correctly', async () => {
    await browser.url('/iframe.html?args=&id=mycomponent--primary');
    // Your test assertions
  });
});
```

### Build Testing

Build Storybook for production testing:

```bash
pnpm build-storybook
```

## Submitting Changes

### Before Submitting

1. **Ensure all tests pass**: `pnpm test-all`
2. **Format your code**: `pnpm prettier`
3. **Build successfully**: `pnpm build`
4. **Test in example projects**: Verify your changes work in both example packages

### Pull Request Process

1. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes** following the development workflow above

3. **Commit Your Changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request** on GitHub with:
   - Clear description of changes
   - Reference to any related issues
   - Screenshots/examples if applicable

### Commit Message Guidelines

Follow conventional commit format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Release Process

> **Note**: Only maintainers can perform releases.

### Release Types

The project supports two types of releases:

#### 1. Production Release

Triggered manually via GitHub Actions:

1. Go to [**Actions** → **Release Stencil Storybook Plugin**](https://github.com/stenciljs/storybook/actions/workflows/release.yml)
2. Select release type: `patch`, `minor`, or `major`
3. Set "devRelease" to `no`
4. Run workflow

This will:
- Build the plugin
- Update version in `package.json`
- Create a Git tag
- Publish to npm with `latest` tag
- Create a GitHub release

#### 2. Development Release

For testing pre-release versions:

1. Use the same workflow but set "devRelease" to `yes`
2. Publishes with format: `version-dev.timestamp.githash`
3. Published with `dev` tag on npm

### Version Management

- **Plugin**: `packages/plugin/package.json` - Published to npm
- **Examples**: Private packages, not published
- **Root**: Monorepo version, not published

### Release Checklist

Before releasing:

- [ ] All tests pass on CI
- [ ] Plugin builds successfully
- [ ] Example projects work correctly
- [ ] Documentation is updated

## Development Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm build.plugin` | Build only the plugin |
| `pnpm dev` | Start all development servers |
| `pnpm dev.plugin` | Watch mode for plugin development |
| `pnpm dev.example` | Start example Storybook |
| `pnpm test-all` | Run all tests |
| `pnpm prettier` | Format all code |
| `pnpm build-storybook` | Build Storybook for production |

## Getting Help

- **Documentation**: [StencilJS Storybook Docs](https://stenciljs.com/docs/storybook)
- **Issues**: [GitHub Issues](https://github.com/stenciljs/storybook/issues)
- **Community**: [StencilJS Discord](https://chat.stenciljs.com)

---

Thank you for contributing to StencilJS Storybook! 🚀 