# TypeScript Configuration Guide for Node.js Projects

## Purpose
This document provides comprehensive guidelines for configuring TypeScript in Node.js projects, including tsconfig.json best practices, compiler options, and project structure recommendations.

## Classification
- **Domain:** Cross-Cutting
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### TypeScript Configuration Principles

#### Core Configuration Goals

1. **Type Safety First**
   - Enable strict mode for maximum type safety
   - Catch errors at compile time rather than runtime
   - Provide excellent developer experience with IDE support

2. **Modern JavaScript Standards**
   - Target modern ECMAScript versions compatible with Node.js
   - Use latest module resolution strategies
   - Leverage modern JavaScript features

3. **Development Efficiency**
   - Fast compilation times
   - Excellent debugging support
   - Clear error messages and diagnostics

4. **Production Readiness**
   - Optimized output for deployment
   - Source maps for debugging
   - Declaration files for library publishing

### Recommended Base Configuration

#### Standard Node.js TypeScript Configuration

```json
{
  "compilerOptions": {
    // Language and Environment
    "target": "ES2022",                    // Modern JS features supported by Node.js 18+
    "module": "NodeNext",                  // Use NodeNext for ESM/CJS interop
    "moduleResolution": "NodeNext",        // Modern module resolution
    "lib": ["ES2022"],                     // Include standard library definitions
    
    // Type Checking
    "strict": true,                        // Enable all strict type-checking options
    "noImplicitAny": true,                 // Error on expressions with implied 'any' type
    "strictNullChecks": true,              // Enable strict null checks
    "strictFunctionTypes": true,           // Enable strict checking of function types
    "strictBindCallApply": true,           // Enable strict 'bind', 'call', and 'apply'
    "strictPropertyInitialization": true, // Enable strict checking of property initialization
    "noImplicitThis": true,                // Error on 'this' expressions with implied 'any'
    "alwaysStrict": true,                  // Parse in strict mode and emit "use strict"
    "noImplicitReturns": true,             // Error when not all code paths return a value
    "noFallthroughCasesInSwitch": true,    // Error on fallthrough cases in switch
    "noUncheckedIndexedAccess": true,      // Add 'undefined' to index signature results
    "noImplicitOverride": true,            // Ensure overriding members are marked with override
    "exactOptionalPropertyTypes": true,    // Interpret optional property types as written
    
    // Module Resolution
    "esModuleInterop": true,               // Enables emit interoperability between CommonJS and ES Modules
    "allowSyntheticDefaultImports": true,  // Allow default imports from modules with no default export
    "forceConsistentCasingInFileNames": true, // Ensure consistent casing in file names
    "resolveJsonModule": true,             // Include modules imported with '.json' extension
    
    // Emit
    "outDir": "./dist",                    // Redirect output structure to the directory
    "rootDir": "./src",                    // Specify the root directory of input files
    "sourceMap": true,                     // Generate corresponding '.map' file
    "declaration": true,                   // Generate corresponding '.d.ts' file
    "declarationMap": true,                // Generate a sourcemap for each corresponding '.d.ts' file
    "removeComments": false,               // Keep comments in output for better debugging
    "importHelpers": true,                 // Import emit helpers from 'tslib'
    "downlevelIteration": true,            // Provide full support for iterables in 'for-of', spread, and destructuring
    
    // Interop Constraints
    "isolatedModules": true,               // Ensure each file can be safely transpiled without relying on other imports
    "allowJs": false,                      // Don't allow JavaScript files to be compiled
    "checkJs": false,                      // Don't report errors in JavaScript files
    
    // Completeness
    "skipLibCheck": true,                  // Skip type checking of declaration files (improves performance)
    
    // Advanced
    "incremental": true,                   // Enable incremental compilation
    "tsBuildInfoFile": "./dist/.tsbuildinfo", // Specify file to store incremental compilation information
    "experimentalDecorators": true,        // Enable experimental support for decorators
    "emitDecoratorMetadata": true          // Enable experimental support for emitting type metadata for decorators
  },
  "include": [
    "src/**/*"                             // Include all files in src directory
  ],
  "exclude": [
    "node_modules",                        // Exclude node_modules
    "dist",                                // Exclude build output
    "**/*.test.ts",                        // Exclude test files from main build
    "**/*.spec.ts"                         // Exclude spec files from main build
  ],
  "ts-node": {
    "esm": true                            // Enable ESM support in ts-node
  }
}
```

#### Project-Specific Configurations

**Frontend Projects (React/Vue with Node.js backend):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",                    // For React projects
    "allowImportingTsExtensions": true,
    "noEmit": true,                        // Let bundler handle emission
    "strict": true,
    "skipLibCheck": true
  }
}
```

**Library/Package Development:**
```json
{
  "compilerOptions": {
    "target": "ES2018",                    // Broader compatibility
    "module": "CommonJS",                  // For npm package compatibility
    "declaration": true,
    "declarationMap": true,
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "composite": true                      // Enable project references
  }
}
```

**CLI Applications:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./bin",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]                      // Only include Node.js types
  }
}
```

### Configuration Strategies by Project Type

#### Express.js API Server

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "declaration": false,
    "types": ["node", "express"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### Next.js Application

```json
{
  "compilerOptions": {
    "target": "ES5",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

#### NestJS Application

```json
{
  "compilerOptions": {
    "module": "CommonJS",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
```

### Advanced Configuration Patterns

#### Monorepo Configuration

**Root tsconfig.json:**
```json
{
  "files": [],
  "references": [
    { "path": "./packages/api" },
    { "path": "./packages/web" },
    { "path": "./packages/shared" }
  ]
}
```

**Package-specific tsconfig.json:**
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"],
  "references": [
    { "path": "../shared" }
  ]
}
```

#### Testing Configuration

**tsconfig.test.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "noEmit": true
  },
  "include": [
    "src/**/*",
    "tests/**/*",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

#### Development vs Production

**tsconfig.dev.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": true,
    "removeComments": false,
    "incremental": true
  }
}
```

**tsconfig.prod.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "sourceMap": false,
    "removeComments": true,
    "incremental": false
  }
}
```

### Path Mapping and Module Resolution

#### Path Mapping Configuration

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@/*": ["*"],
      "@/components/*": ["components/*"],
      "@/services/*": ["services/*"],
      "@/utils/*": ["utils/*"],
      "@/types/*": ["types/*"],
      "@/config/*": ["config/*"]
    }
  }
}
```

#### Module Resolution Strategies

```typescript
// For different module systems
{
  "compilerOptions": {
    // For ESM projects
    "module": "ESNext",
    "moduleResolution": "bundler",
    
    // For CommonJS projects
    "module": "CommonJS",
    "moduleResolution": "node",
    
    // For hybrid projects
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

### Performance Optimization

#### Build Performance

```json
{
  "compilerOptions": {
    "skipLibCheck": true,                  // Skip type checking of declaration files
    "incremental": true,                   // Enable incremental compilation
    "tsBuildInfoFile": "./.tsbuildinfo",   // Store incremental info
    "assumeChangesOnlyAffectDirectDependencies": true
  },
  "exclude": [
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts",
    "coverage",
    "dist"
  ]
}
```

#### Memory Usage Optimization

```json
{
  "compilerOptions": {
    "preserveWatchOutput": true,
    "pretty": true
  },
  "watchOptions": {
    "watchFile": "useFsEvents",
    "watchDirectory": "useFsEvents",
    "fallbackPolling": "dynamicPriority",
    "synchronousWatchDirectory": true,
    "excludeDirectories": ["**/node_modules", "_build"]
  }
}
```

### Type Declaration Management

#### Custom Type Declarations

**types/global.d.ts:**
```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      JWT_SECRET: string;
      PORT?: string;
    }
  }
}

declare module '*.json' {
  const value: any;
  export default value;
}

export {};
```

#### Module Augmentation

```typescript
// types/express.d.ts
import { User } from '../src/types/user';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
```

### Configuration Validation

#### Runtime Configuration Validation

```typescript
// src/config/typescript.ts
import { z } from 'zod';

const TypeScriptConfigSchema = z.object({
  strict: z.boolean(),
  target: z.string(),
  module: z.string(),
  outDir: z.string(),
  rootDir: z.string()
});

export const validateTypeScriptConfig = (config: unknown) => {
  return TypeScriptConfigSchema.parse(config);
};
```

### Best Practices Checklist

#### Development Setup
- [ ] Enable strict mode for all new projects
- [ ] Use modern target (ES2020+) compatible with Node.js version
- [ ] Configure path mapping for cleaner imports
- [ ] Set up incremental compilation for faster builds
- [ ] Include source maps for debugging
- [ ] Configure proper include/exclude patterns

#### Type Safety
- [ ] Enable all strict type checking options
- [ ] Use `noUncheckedIndexedAccess` for safer array/object access
- [ ] Configure `exactOptionalPropertyTypes` for precise optional handling
- [ ] Set up proper type declarations for environment variables
- [ ] Use branded types for sensitive data

#### Performance
- [ ] Enable `skipLibCheck` for faster compilation
- [ ] Use incremental compilation
- [ ] Optimize watch options for development
- [ ] Exclude unnecessary files from compilation
- [ ] Use project references for monorepos

#### Production
- [ ] Generate declaration files for libraries
- [ ] Configure proper output directories
- [ ] Set up build optimization flags
- [ ] Enable tree shaking compatible settings
- [ ] Configure proper module resolution

### Common Configuration Issues and Solutions

#### Issue: Slow Compilation

**Solution:**
```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "incremental": true,
    "assumeChangesOnlyAffectDirectDependencies": true
  },
  "exclude": ["node_modules", "**/*.test.ts", "dist"]
}
```

#### Issue: Module Resolution Errors

**Solution:**
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true
  }
}
```

#### Issue: Decorator Errors

**Solution:**
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Tools and Integration

#### Package.json Scripts

```json
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "build:prod": "tsc --project tsconfig.prod.json",
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

#### IDE Configuration

**VS Code settings.json:**
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** None
- **Related Nodes:** 
  - [cross_cutting/nodejs_security_guide.md] - complements - TypeScript security considerations
  - [processes/creation.md] - implements - TypeScript setup in creation process
  - [meta/templates/node_framework_decision_template.md] - guides - Framework-specific TypeScript configuration

## Navigation Guidance
- **Access Context:** Use this document when setting up TypeScript configuration or optimizing existing setups
- **Common Next Steps:** After configuring TypeScript, typically set up linting, testing, and build processes
- **Related Tasks:** Project setup, build optimization, type safety implementation
- **Update Patterns:** This document should be updated when new TypeScript versions introduce breaking changes or new features

## Metadata
- **Created:** 2025-06-26
- **Last Updated:** 2025-06-26
- **Updated By:** Cline
- **Sources:** TypeScript Official Documentation, TSConfig Reference, Total TypeScript

## Change History
- 2025-06-26: Initial creation based on current TypeScript best practices and configuration recommendations
