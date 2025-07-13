# mastra-af-letta

A TypeScript npm package that enables seamless portability of AI agents between [Mastra.ai](https://mastra.ai) and [Letta](https://github.com/letta-ai/letta) (formerly MemGPT) through the .af (Agent File) format.

## Project Structure

This repository uses a context network for knowledge management and planning:

```
project-root/
├── .context-network.md          # Discovery file for context network
├── README.md                    # This file
├── .gitignore                   # Root-level git ignores
├── .devcontainer/               # Development container config
├── context-network/             # All planning & architecture docs
└── app/                         # The npm package source code
    ├── src/                     # TypeScript source files
    ├── test/                    # Test files
    ├── package.json             # Package configuration
    └── README.md                # Package documentation
```

## What is mastra-af-letta?

The mastra-af-letta package provides bidirectional conversion between Mastra.ai agents and the .af (Agent File) format used by Letta. This enables:

- **Agent Migration**: Move agents between Python (Letta) and TypeScript (Mastra) ecosystems
- **Version Control**: Store agent definitions in git-friendly JSON format
- **Team Sharing**: Distribute pre-configured agents across teams
- **State Preservation**: Maintain agent memory, tools, and conversation history

## Quick Start

### Installation

```bash
npm install mastra-af-letta
```

### Basic Usage

```typescript
import { parseAgentFile, importAfAgent, exportMastraAgent } from 'mastra-af-letta';
import { readFileSync, writeFileSync } from 'fs';

// Import a Letta agent
const afContent = readFileSync('./agent.af', 'utf-8');
const afData = parseAgentFile(afContent);
const { agent, memory } = importAfAgent(afData);

// Use with Mastra...

// Export back to .af format
const exportResult = exportMastraAgent(agent, memory);
writeFileSync('./exported.af', exportResult.content);
```

## Development

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/mastra-af-letta.git
cd mastra-af-letta

# Install dependencies
cd app
pnpm install

# Run tests
pnpm test

# Build the package
pnpm build
```

### Publishing

```bash
# Build and test
pnpm build
pnpm test

# Publish to npm
pnpm publish
```

## Context Network

This project uses a context network for managing project knowledge, architecture decisions, and planning. The context network is located in the `./context-network/` directory.

### Key Areas

- **Foundation**: Project definition, system overview, and core principles
- **Architecture**: System design, component relationships, and conversion logic
- **Specifications**: .af format documentation and Mastra integration details
- **Planning**: Roadmap and future enhancements

### Navigation

Start with `./context-network/discovery.md` for an overview of the context network structure and navigation paths.

## Contributing

Contributions are welcome! Please:

1. Check the context network for architectural guidelines
2. Follow the existing code style and TypeScript patterns
3. Add tests for new functionality
4. Update relevant documentation

## License

MIT - See [LICENSE](./app/LICENSE) for details.

## Related Projects

- [Mastra.ai](https://mastra.ai) - The TypeScript AI framework
- [Letta](https://github.com/letta-ai/letta) - The Python AI agent framework (formerly MemGPT)
- [.af Format Specification](https://github.com/letta-ai/letta/blob/main/docs/af-format.md) - Agent File format documentation

## Support

For issues and questions:
- Check the [package README](./app/README.md) for detailed API documentation
- Review the context network for architectural decisions
- Open an issue on GitHub for bugs or feature requests