# Node-TypeScript Project Directory

This directory is where your actual Node.js TypeScript project will live. It's intentionally kept minimal to avoid conflicts with framework-specific initialization tools.

## Getting Started

Choose one of the following initialization methods based on your project type:

### Basic Node-TypeScript Project
```bash
cd app
npm init -y
npm install -D typescript @types/node ts-node nodemon
npm install express
npm install -D @types/express
npx tsc --init
```

### Next.js (React Framework)
```bash
cd app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### Express.js API Server
```bash
cd app
npm init -y
npm install express cors helmet morgan
npm install -D typescript @types/node @types/express @types/cors @types/helmet @types/morgan ts-node nodemon
npx tsc --init
```

### Vite (Frontend Build Tool)
```bash
cd app
npx create-vite@latest . --template vanilla-ts
npm install
```

### NestJS (Enterprise Node.js Framework)
```bash
cd app
npx @nestjs/cli new . --package-manager npm
```

### CLI Application
```bash
cd app
npm init -y
npm install commander
npm install -D typescript @types/node ts-node
npx tsc --init
```

## After Initialization

1. **Review the Context Network**: Check `../context-network/` for architectural guidance and decision templates
2. **Document Your Choices**: Update the context network with your framework selection and configuration decisions
3. **Configure Development Environment**: Set up your IDE, linting, and testing based on context network guidance
4. **Start Development**: Begin building your Node-TypeScript application

## Project Structure

Once initialized, your app directory will typically contain:

```
app/
├── package.json              # Node.js project manifest
├── tsconfig.json            # TypeScript configuration
├── src/                     # Source code
├── dist/                    # Compiled output (gitignored)
├── tests/ or __tests__/     # Test files
├── node_modules/            # Dependencies (gitignored)
└── [framework-specific files]
```

## Important Notes

- **Keep Planning Separate**: All architectural decisions, design discussions, and planning documents belong in the `../context-network/` directory, not here
- **Implementation Only**: This directory should only contain files that are consumed by build systems, deployment tools, or end users
- **Context Network Integration**: Regularly reference and update the context network as your project evolves

## Need Help?

- Check the context network's foundation documents for architectural guidance
- Review decision templates for common Node-TypeScript choices
- Consult the process documentation for development workflows
