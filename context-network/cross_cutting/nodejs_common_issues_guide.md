# Node.js TypeScript Common Issues & Solutions Guide

## Purpose
This document addresses the most common pain points and challenges developers face when working with Node.js TypeScript projects, providing practical solutions and workarounds for real-world issues.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Detailed
- **Confidence:** Established

## Content

### Overview of Common Pain Points

Node.js TypeScript development involves several recurring challenges that can significantly impact developer productivity and project stability. This guide addresses the most frequent issues and provides battle-tested solutions.

## 1. ES Modules vs CommonJS Integration Issues

### The Core Problem

The coexistence of ES Modules (ESM) and CommonJS (CJS) in the Node.js ecosystem creates significant interoperability challenges, especially in TypeScript projects.

#### Key Differences

| Feature | CommonJS (CJS) | ECMAScript Modules (ESM) |
|---------|----------------|--------------------------|
| Syntax | `require()`, `module.exports` | `import`, `export` |
| Loading | Synchronous | Asynchronous |
| Tree shaking | No | Yes |
| Browser support | Requires bundlers | Native |
| Top-level `await` | No | Yes |
| File extensions | `.js` assumed | `.mjs`, `.js`, `.cjs` explicit |
| Dynamic imports | Via `require()` | Via dynamic `import()` |

### Common Issues and Solutions

#### Issue 1: Cannot Import ESM from CommonJS

**Problem:**
```javascript
// This fails in CommonJS
const esmModule = require('./esm-module.mjs'); // Error!
```

**Solution:**
```javascript
// Use dynamic imports with async/await
const loadESMModule = async () => {
  const esmModule = await import('./esm-module.mjs');
  return esmModule;
};

// Or use top-level await in async context
(async () => {
  const esmModule = await import('./esm-module.mjs');
  // Use esmModule here
})();
```

#### Issue 2: Missing CommonJS Globals in ESM

**Problem:**
```javascript
// These don't exist in ESM
console.log(__dirname); // ReferenceError
console.log(__filename); // ReferenceError
```

**Solution:**
```javascript
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(__dirname);
console.log(__filename);
```

#### Issue 3: Importing CommonJS from ESM with Named Imports

**Problem:**
```javascript
// This often fails
import { specificFunction } from 'cjs-package'; // May not work
```

**Solution:**
```javascript
// Import default and destructure
import cjsPackage from 'cjs-package';
const { specificFunction } = cjsPackage;

// Or use createRequire
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { specificFunction } = require('cjs-package');
```

### TypeScript Configuration for Module Interop

#### Recommended tsconfig.json for Mixed Projects

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

#### Package.json Configuration

**For ESM Projects:**
```json
{
  "type": "module",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

**For CommonJS Projects:**
```json
{
  "type": "commonjs",
  "main": "./dist/index.js",
  "exports": {
    ".": {
      "require": "./dist/index.js",
      "import": "./dist/index.mjs"
    }
  }
}
```

### Migration Strategies

#### Gradual Migration from CommonJS to ESM

1. **Start with new files as ESM**
2. **Use file extensions explicitly** (`.mjs`, `.cjs`)
3. **Create bridge modules** for interop
4. **Update build tools** to handle both formats
5. **Migrate dependencies** one at a time

#### Bridge Module Pattern

```typescript
// bridge.ts - Handles interop between module systems
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// Re-export CommonJS modules for ESM consumption
export const legacyModule = require('legacy-cjs-package');

// Handle mixed imports
export async function loadMixedDependencies() {
  const [esmModule, cjsModule] = await Promise.all([
    import('modern-esm-package'),
    Promise.resolve(require('legacy-cjs-package'))
  ]);
  
  return { esmModule, cjsModule };
}
```

## 2. Package Version Management & Dependency Conflicts

### Common Package Management Issues

#### Issue 1: Dependency Version Conflicts

**Problem:**
```
npm ERR! peer dep missing: react@^18.0.0, required by some-package@1.0.0
```

**Solution:**
```bash
# Check dependency tree
npm ls --depth=0

# Install peer dependencies explicitly
npm install react@^18.0.0

# Use overrides in package.json (npm 8.3+)
{
  "overrides": {
    "some-package": {
      "react": "^18.0.0"
    }
  }
}
```

#### Issue 2: Security Vulnerabilities in Dependencies

**Problem:**
```
found 5 vulnerabilities (2 moderate, 3 high)
```

**Solution:**
```bash
# Audit and fix automatically
npm audit fix

# For manual review
npm audit

# Update specific packages
npm update package-name

# Use npm-check-updates for major version updates
npx npm-check-updates -u
npm install
```

### Package Manager Comparison and Selection

#### npm vs yarn vs pnpm Decision Matrix

| Criteria | npm | yarn | pnpm |
|----------|-----|------|------|
| **Performance** | Good | Good | Excellent |
| **Disk Usage** | High | High | Low (symlinks) |
| **Monorepo Support** | Basic | Excellent | Excellent |
| **Security** | Good | Good | Good |
| **Ecosystem** | Largest | Large | Growing |
| **Learning Curve** | Low | Medium | Medium |

#### Recommended Choice by Project Type

```typescript
// Decision logic for package manager selection
interface ProjectRequirements {
  isMonorepo: boolean;
  teamSize: number;
  diskSpaceConstrained: boolean;
  needsAdvancedWorkspaces: boolean;
}

function selectPackageManager(requirements: ProjectRequirements): string {
  if (requirements.diskSpaceConstrained || requirements.isMonorepo) {
    return 'pnpm';
  }
  
  if (requirements.needsAdvancedWorkspaces && requirements.teamSize > 5) {
    return 'yarn';
  }
  
  return 'npm'; // Default, most compatible
}
```

### Version Management Best Practices

#### Semantic Versioning Strategy

```json
{
  "dependencies": {
    "express": "4.18.2",           // Exact version for critical deps
    "lodash": "^4.17.21",          // Allow patch updates
    "react": "~18.2.0"             // Allow patch updates only
  },
  "devDependencies": {
    "typescript": "^5.0.0",        // Allow minor updates for dev tools
    "@types/node": "^20.0.0"       // Keep in sync with Node.js version
  }
}
```

#### Lock File Management

```bash
# Always commit lock files
git add package-lock.json yarn.lock pnpm-lock.yaml

# Regenerate lock file when needed
rm package-lock.json && npm install

# Verify lock file integrity
npm ci  # Uses exact versions from lock file
```

### Automated Dependency Management

#### GitHub Actions for Dependency Updates

```yaml
# .github/workflows/dependency-update.yml
name: Dependency Update Check
on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  workflow_dispatch:

jobs:
  update-dependencies:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Check for updates
        run: |
          npx npm-check-updates --doctor
          npm audit
          
      - name: Create PR if updates available
        uses: peter-evans/create-pull-request@v5
        with:
          title: 'chore: update dependencies'
          body: 'Automated dependency updates'
```

#### Package.json Scripts for Maintenance

```json
{
  "scripts": {
    "deps:check": "npm outdated",
    "deps:update": "npx npm-check-updates -u && npm install",
    "deps:audit": "npm audit",
    "deps:audit-fix": "npm audit fix",
    "deps:clean": "rm -rf node_modules package-lock.json && npm install"
  }
}
```

## 3. TypeScript and Node.js Version Compatibility

### Version Compatibility Matrix

#### Node.js and TypeScript Compatibility

| Node.js Version | TypeScript Version | Target ES Version | Notes |
|-----------------|-------------------|-------------------|-------|
| 18.x LTS | 4.9+ | ES2022 | Recommended for production |
| 20.x LTS | 5.0+ | ES2023 | Current LTS |
| 21.x | 5.2+ | ES2023 | Latest features |

#### @types/node Version Alignment

```typescript
// Check Node.js version compatibility
const nodeVersion = process.version;
console.log(`Node.js version: ${nodeVersion}`);

// Recommended @types/node versions
const typeVersionMap = {
  'v18': '@types/node@^18.0.0',
  'v20': '@types/node@^20.0.0',
  'v21': '@types/node@^21.0.0'
};
```

### Migration Strategies

#### TypeScript Version Upgrade Process

1. **Check breaking changes** in TypeScript release notes
2. **Update incrementally** (one minor version at a time)
3. **Run type checking** after each update
4. **Update related packages** (@types/*, ts-node, etc.)
5. **Test thoroughly** before deploying

#### Automated Compatibility Checking

```typescript
// scripts/check-compatibility.ts
import { execSync } from 'child_process';
import semver from 'semver';

interface CompatibilityCheck {
  nodeVersion: string;
  typescriptVersion: string;
  compatible: boolean;
  recommendations: string[];
}

function checkCompatibility(): CompatibilityCheck {
  const nodeVersion = process.version;
  const tsVersion = execSync('npx tsc --version', { encoding: 'utf8' })
    .replace('Version ', '').trim();
  
  const compatible = semver.satisfies(nodeVersion, '>=18.0.0') && 
                    semver.satisfies(tsVersion, '>=4.9.0');
  
  const recommendations: string[] = [];
  
  if (!compatible) {
    if (semver.lt(nodeVersion, '18.0.0')) {
      recommendations.push('Upgrade Node.js to version 18 or higher');
    }
    if (semver.lt(tsVersion, '4.9.0')) {
      recommendations.push('Upgrade TypeScript to version 4.9 or higher');
    }
  }
  
  return {
    nodeVersion,
    typescriptVersion: tsVersion,
    compatible,
    recommendations
  };
}
```

## 4. Build and Development Workflow Issues

### Common Build Problems

#### Issue 1: Slow TypeScript Compilation

**Problem:**
```
Compilation takes several minutes for small changes
```

**Solutions:**
```json
// tsconfig.json optimizations
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": "./.tsbuildinfo",
    "skipLibCheck": true,
    "assumeChangesOnlyAffectDirectDependencies": true
  },
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

#### Issue 2: Hot Reload Not Working

**Problem:**
```
Changes require manual restart of development server
```

**Solution:**
```typescript
// Use nodemon with ts-node
// package.json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "dev:esm": "nodemon --exec node --loader ts-node/esm src/index.ts"
  }
}

// nodemon.json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node src/index.ts"
}
```

### Development Environment Setup

#### VS Code Configuration

```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.suggest.autoImports": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  }
}
```

#### Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug TypeScript",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "sourceMaps": true,
      "restart": true,
      "protocol": "inspector",
      "console": "integratedTerminal"
    }
  ]
}
```

## 5. Testing Configuration Challenges

### Testing Framework Selection

#### Jest vs Vitest Comparison

| Feature | Jest | Vitest |
|---------|------|--------|
| **TypeScript Support** | Good (with ts-jest) | Excellent (native) |
| **ESM Support** | Complex setup | Native |
| **Performance** | Good | Excellent |
| **Ecosystem** | Mature | Growing |
| **Configuration** | Complex | Simple |

### Jest Configuration for TypeScript

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
  ],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
```

### Vitest Configuration for TypeScript

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### Testing Best Practices

#### Test Structure

```typescript
// src/services/__tests__/user.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserService } from '../user.service';

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('createUser', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      const result = await userService.createUser(userData);

      expect(result).toMatchObject({
        id: expect.any(String),
        email: userData.email,
        name: userData.name
      });
    });

    it('should throw error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        name: 'Test User'
      };

      await expect(userService.createUser(userData))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

## 6. Troubleshooting Checklist

### Quick Diagnostic Commands

```bash
# Check Node.js and npm versions
node --version
npm --version

# Check TypeScript version
npx tsc --version

# Check for TypeScript errors
npx tsc --noEmit

# Check for dependency issues
npm ls
npm audit

# Check for outdated packages
npm outdated

# Clean install
rm -rf node_modules package-lock.json
npm install

# Check module resolution
node -p "require.resolve('package-name')"
```

### Common Error Messages and Solutions

#### "Cannot find module" Errors

```bash
# Check if package is installed
npm ls package-name

# Install missing package
npm install package-name

# Check TypeScript module resolution
npx tsc --traceResolution
```

#### "Module not found" with Path Mapping

```typescript
// Ensure baseUrl and paths are set correctly in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"]
    }
  }
}

// For runtime, use module-alias or ts-node with path mapping
import 'module-alias/register';
```

### Performance Troubleshooting

#### Slow Builds

1. **Enable incremental compilation**
2. **Use skipLibCheck**
3. **Exclude unnecessary files**
4. **Use project references for monorepos**
5. **Consider using swc or esbuild for faster compilation**

#### Memory Issues

```bash
# Increase Node.js memory limit
node --max-old-space-size=4096 ./node_modules/.bin/tsc

# Use heap profiling
node --inspect --heap-prof ./node_modules/.bin/tsc
```

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [cross_cutting/typescript_configuration_guide.md] - complements - TypeScript configuration details
  - [cross_cutting/nodejs_security_guide.md] - complements - Security considerations
  - [processes/creation.md] - implements - Issue prevention in creation process
  - [evolution/technical_debt_registry.md] - tracks - Known issues and workarounds

## Navigation Guidance
- **Access Context:** Use this document when encountering common Node.js TypeScript issues or for troubleshooting
- **Common Next Steps:** After resolving issues, typically update configuration guides or creation processes
- **Related Tasks:** Troubleshooting, project setup, dependency management, build optimization
- **Update Patterns:** This document should be updated when new common issues emerge or solutions change

## Metadata
- **Created:** 2025-06-26
- **Last Updated:** 2025-06-26
- **Updated By:** Cline
- **Sources:** Node.js Official Documentation, TypeScript Documentation, Community Best Practices

## Change History
- 2025-06-26: Initial creation based on research of common Node.js TypeScript pain points and solutions
