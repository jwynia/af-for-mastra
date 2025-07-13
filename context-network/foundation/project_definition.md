# Project Definition - mastra-af-letta

## Purpose
This document defines the core purpose, goals, and scope of the mastra-af-letta npm package, which provides interoperability between Mastra.ai and Letta (formerly MemGPT) AI agent frameworks.

## Classification
- **Domain:** Core Concept
- **Stability:** Static
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### Project Overview

The mastra-af-letta package is a TypeScript library that enables seamless portability of AI agents between the Mastra.ai and Letta ecosystems through the .af (Agent File) format. It provides bidirectional conversion capabilities, allowing developers to import Letta agents into Mastra and export Mastra agents back to the .af format, complete with tool definitions, memory blocks, and conversation history.

### Vision Statement

To eliminate platform lock-in for AI agent development by creating a universal bridge between major agent frameworks, enabling developers to leverage the best features of both Mastra.ai (TypeScript ecosystem) and Letta (Python ecosystem) while maintaining agent portability and preserving agent state across platforms.

### Mission Statement

The mastra-af-letta package provides developers with a robust, type-safe solution for agent portability that preserves agent functionality, state, and configuration across framework boundaries, supports advanced features like MCP tools and multi-language tool definitions, and enables version-controlled, git-friendly agent definitions through the standardized .af format.

### Project Objectives

1. Provide complete bidirectional conversion between Mastra.ai agents and the .af format
2. Maintain full fidelity of agent state, including memory blocks, tools, and conversation history
3. Support advanced tool types including JSON Schema, MCP tools, and multi-language implementations
4. Ensure type safety through comprehensive TypeScript types and Zod validation schemas
5. Enable git-friendly agent version control through human-readable JSON format
6. Facilitate agent migration between Python (Letta) and TypeScript (Mastra) ecosystems
7. Provide auto-fix capabilities for common .af format issues

### Success Criteria

1. Zero data loss during import/export operations between formats
2. 100% compatibility with standard .af format specification
3. Successful round-trip conversion (Letta → Mastra → Letta) without degradation
4. Clear error messages for invalid .af files with actionable fixes
5. Support for all major Mastra.ai agent features in export
6. Comprehensive test coverage for all conversion scenarios
7. Published to npm with regular updates and semantic versioning
8. Active community adoption for agent portability use cases

### Project Scope

#### In Scope

- .af format parsing and validation using Zod schemas
- Conversion of Letta agents to Mastra AgentConfig format
- Export of Mastra agents to .af format
- Tool definition conversion (JSON Schema, MCP, Python/JS source)
- Memory block management (core_memory, recall_memory)
- Conversation history preservation with tool calls
- TypeScript type definitions for all data structures
- Auto-fix capabilities for common format issues
- Comprehensive error handling and validation
- Support for authentication references (non-embedded)
- Documentation of .af format specification
- Example usage patterns and migration guides

#### Out of Scope

- Direct API integration with Letta or Mastra platforms
- Agent execution or runtime capabilities
- Credential storage or management
- Automatic agent behavior translation
- GUI or CLI tools (library only)
- Agent performance optimization
- Platform-specific features not in .af format

### Stakeholders

| Role | Responsibilities | Representative(s) |
|------|-----------------|-------------------|
| Mastra.ai Developers | Use the package to import/export agents | Mastra.ai community |
| Letta Users | Export agents from Letta for use in other platforms | Letta/MemGPT community |
| Package Maintainer | Maintain compatibility with .af spec updates | Project maintainer |
| AI Agent Developers | Build portable agents across platforms | Cross-platform developers |
| Tool Developers | Ensure tool definitions convert properly | MCP/tool authors |
| Open Source Contributors | Submit fixes and feature enhancements | GitHub contributors |

### Timeline

- Initial release: v1.0.0 with core import/export functionality
- Future releases: Based on .af specification updates and community feedback
- Semantic versioning for predictable updates

### Constraints

- Must maintain compatibility with official .af format specification
- TypeScript-first implementation with full type safety
- No runtime dependencies on Letta or Mastra platforms
- Must handle large conversation histories efficiently
- Security: No credential storage in .af files
- Cross-platform compatibility (Node.js 18+)

### Assumptions

- .af format specification will remain stable with backward compatibility
- Both Mastra.ai and Letta will continue to support their respective APIs
- Developers need agent portability between platforms
- JSON remains the preferred format for agent serialization
- MCP tools will become increasingly important for agent capabilities

### Risks

- .af format specification changes could break compatibility
- Platform-specific features may not translate perfectly
- Large conversation histories could impact performance
- Tool implementation differences between platforms
- Authentication mechanism variations between frameworks

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** 
  - [foundation/structure.md] - implements - Structural implementation of project goals
  - [foundation/principles.md] - guides - Principles that guide project execution
- **Related Nodes:** 
  - [planning/roadmap.md] - details - Specific implementation plan for project goals
  - [planning/milestones.md] - schedules - Timeline for achieving project objectives

## Navigation Guidance
- **Access Context:** Use this document when needing to understand the fundamental purpose and scope of the project
- **Common Next Steps:** After reviewing this definition, typically explore structure.md or principles.md
- **Related Tasks:** Strategic planning, scope definition, stakeholder communication
- **Update Patterns:** This document should be updated when there are fundamental changes to project direction or scope

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Role/Agent]

## Change History
- [Date]: Initial creation of project definition template
