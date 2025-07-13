# System Overview - mastra-af-letta

## Purpose
This document provides a high-level overview of the mastra-af-letta npm package, its purpose, key components, and how it enables agent portability between AI frameworks.

## Classification
- **Domain:** Foundation
- **Stability:** Semi-stable
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### System Purpose and Vision

The mastra-af-letta package solves the critical problem of AI agent portability between different frameworks. It enables developers to:
- Migrate agents between Letta (Python) and Mastra.ai (TypeScript) ecosystems
- Version control agent definitions in a git-friendly JSON format
- Share and distribute pre-configured agents across teams
- Preserve agent state, tools, and conversation history during transfers

The package targets AI developers who work with multiple agent frameworks and need seamless interoperability without data loss or manual translation.

### System Context

```mermaid
flowchart TD
    Letta[Letta/MemGPT<br/>Python Ecosystem] -->|Export| AF[.af File<br/>JSON Format]
    AF -->|Import| Package[mastra-af-letta<br/>NPM Package]
    Package -->|Convert| Mastra[Mastra.ai<br/>TypeScript Ecosystem]
    Mastra -->|Export| Package
    Package -->|Generate| AF2[.af File<br/>JSON Format]
    AF2 -->|Import| Letta
    
    Package -.->|Uses| Zod[Zod<br/>Validation]
    Package -.->|Supports| MCP[MCP Tools]
    Package -.->|Supports| JSONSchema[JSON Schema Tools]
```

### Key Capabilities

1. **Agent Import**
   - Parse and validate .af JSON files
   - Convert Letta agent configurations to Mastra format
   - Preserve memory blocks (core_memory, recall_memory)
   - Maintain conversation history with tool calls

2. **Agent Export**
   - Convert Mastra agents back to .af format
   - Generate valid JSON for Letta compatibility
   - Preserve all agent state and configuration
   - Support for custom metadata

3. **Tool Conversion**
   - JSON Schema tool definitions
   - MCP (Model Context Protocol) tools
   - Python and JavaScript source code preservation
   - Authentication reference handling (non-embedded)

4. **Validation & Auto-Fix**
   - Comprehensive Zod schema validation
   - Auto-fix common .af format issues
   - Detailed error reporting
   - Type-safe operations

### High-Level Architecture

```mermaid
flowchart TD
    Input[.af File Input] --> Parser[Parser Module]
    Parser --> Validator[Zod Validator]
    Validator --> Converter[Conversion Engine]
    
    Converter --> ImportPath[Import Path]
    ImportPath --> MastraAgent[Mastra Agent Config]
    ImportPath --> Memory[Memory State]
    
    MastraExport[Mastra Agent] --> ExportPath[Export Path]
    ExportPath --> Converter
    Converter --> Generator[.af Generator]
    Generator --> Output[.af File Output]
    
    Converter -.-> ToolConverter[Tool Converter]
    Converter -.-> MemoryConverter[Memory Converter]
    Converter -.-> HistoryConverter[History Converter]
```

#### Key Components

1. **Parser Module** (`src/parser.ts`)
   - Reads and parses .af JSON files
   - Handles malformed JSON gracefully
   - Provides initial structure validation

2. **Validation Layer** (`src/schemas/`)
   - Zod schemas for all data structures
   - Runtime type checking
   - Comprehensive error messages

3. **Conversion Engine** (`src/converters/`)
   - Core logic for bidirectional conversion
   - Handles format differences between platforms
   - Preserves semantic meaning across translations

4. **Type System** (`src/types/`)
   - TypeScript interfaces for all entities
   - Ensures compile-time type safety
   - Exports types for consumer applications

### Key Workflows

#### Import Workflow

```mermaid
sequenceDiagram
    actor Developer
    participant App as Application
    participant Parser as mastra-af-letta
    participant Mastra as Mastra.ai
    
    Developer->>App: Provide .af file
    App->>Parser: parseAgentFile(content)
    Parser->>Parser: Validate with Zod
    Parser-->>App: Parsed AfData
    App->>Parser: importAfAgent(afData)
    Parser->>Parser: Convert to Mastra format
    Parser-->>App: {agent, memory}
    App->>Mastra: Use imported agent
```

#### Export Workflow

```mermaid
sequenceDiagram
    actor Developer
    participant Mastra as Mastra.ai
    participant Exporter as mastra-af-letta
    participant Storage as File System
    
    Developer->>Mastra: Request agent export
    Mastra->>Exporter: exportMastraAgent(agent, memory)
    Exporter->>Exporter: Convert to .af format
    Exporter->>Exporter: Validate output
    Exporter-->>Mastra: {success, content}
    Mastra->>Storage: Write .af file
    Storage-->>Developer: agent.af
```

### Technology Stack

| Layer | Technologies | Justification |
|-------|--------------|---------------|
| Core Language | TypeScript 5.x | Type safety, modern JS features |
| Validation | Zod | Runtime validation with TypeScript inference |
| Build System | tsup | Fast, zero-config bundler |
| Testing | Vitest | Fast, TypeScript-native testing |
| Package Management | npm/pnpm | Standard Node.js ecosystem |
| Target Runtime | Node.js 18+ | LTS support, modern features |

### Deployment Model

```mermaid
flowchart LR
    Dev[Development] -->|Build| Package[NPM Package]
    Package -->|Publish| Registry[npm Registry]
    Registry -->|Install| Consumer[Consumer Apps]
    
    Consumer --> MastraApp[Mastra Applications]
    Consumer --> Migration[Migration Scripts]
    Consumer --> Tools[Developer Tools]
```

### Quality Attributes

#### Performance
- Efficient JSON parsing for large conversation histories
- Minimal dependencies for fast installation
- Streaming support for large .af files (future)

#### Reliability
- Comprehensive test coverage
- Graceful error handling
- No data loss guarantees

#### Security
- No credential storage in .af files
- Authentication via reference only
- Input validation against malicious payloads

#### Maintainability
- Clear module boundaries
- Extensive TypeScript types
- Comprehensive documentation

#### Compatibility
- Adherence to .af specification
- Backward compatibility policy
- Version detection and migration

### Future Evolution

1. **CLI Tool** - Command-line interface for easy conversion
2. **Web Interface** - Browser-based converter
3. **Streaming API** - Handle very large agent files
4. **Platform Extensions** - Support for additional AI frameworks
5. **Schema Evolution** - Automatic migration between .af versions

## Relationships
- **Parent Nodes:** [foundation/project_definition.md]
- **Child Nodes:** 
  - [architecture/component_map.md] - details - Component relationships
  - [architecture/conversion_architecture.md] - details - Conversion system design
- **Related Nodes:** 
  - [specs/af_format_specification.md] - implements - .af format details
  - [cross_cutting/typescript_configuration.md] - uses - TypeScript setup

## Navigation Guidance
- **Access Context:** Start here for understanding the package's purpose and architecture
- **Common Next Steps:** Explore component details or .af format specification
- **Related Tasks:** Package setup, integration planning, format understanding
- **Update Patterns:** Update when major architectural changes occur

## Metadata
- **Created:** 2025-07-13
- **Last Updated:** 2025-07-13
- **Updated By:** AI Assistant

## Change History
- 2025-07-13: Initial creation of system overview for mastra-af-letta