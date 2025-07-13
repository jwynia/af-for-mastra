# mastra-af-letta

An npm package that enables seamless portability of AI agents between [Mastra.ai](https://mastra.ai) and [Letta](https://github.com/letta-ai/letta) (formerly MemGPT) through the .af (Agent File) format.

## Overview

The Agent File (.af) format is an open standard introduced by [Letta](https://github.com/letta-ai/letta) (formerly MemGPT) for serializing AI agents into portable JSON files. This package provides:

- **Import**: Parse and validate .af files to create Mastra agents
- **Export**: Serialize Mastra agents to .af format
- **Type Safety**: Full TypeScript types and Zod schemas
- **Validation**: Comprehensive error messages for debugging
- **MCP Support**: Extended support for Model Context Protocol tools
- **Secure Auth**: Authentication references without embedded credentials

## Installation

```bash
npm install mastra-af-letta
# or
pnpm add mastra-af-letta
# or
yarn add mastra-af-letta
```

**Note**: This package requires `@mastra/core` as a peer dependency. Make sure you have Mastra installed:

```bash
npm install @mastra/core
```

## Quick Start

### Complete Import/Export Workflow

```typescript
import { parseAgentFile, importAfAgent, exportMastraAgent } from 'mastra-af-letta';
import { readFileSync, writeFileSync } from 'fs';

// 1. Parse an .af file
const afContent = readFileSync('./agent.af', 'utf-8');
const afData = parseAgentFile(afContent);

// 2. Import to Mastra format
const importResult = importAfAgent(afData);
const { agent, memory, warnings } = importResult;

// 3. Use the agent (with Mastra)
// const response = await agent.chat('Hello!');

// 4. Export back to .af format
const exportResult = exportMastraAgent(agent, memory);
writeFileSync('./exported.af', exportResult.content);
```

### Parsing an Agent File

```typescript
import { parseAgentFile } from 'mastra-af-letta';
import { readFileSync } from 'fs';

// Parse an .af file
const agentJson = readFileSync('./my-agent.af', 'utf-8');
const agentData = parseAgentFile(agentJson);

console.log(`Loaded agent: ${agentData.name}`);
console.log(`Tools: ${agentData.tools.map(t => t.name).join(', ')}`);
```

### Safe Parsing with Error Handling

```typescript
import { safeParseAgentFile } from 'mastra-af-letta';

const result = safeParseAgentFile(agentJson);

if (result.success) {
  console.log(`Agent: ${result.data.name}`);
} else {
  console.error('Parse failed:', result.error.message);
  if (result.error.validationErrors) {
    result.error.validationErrors.forEach(err => {
      console.error(`  ${err.path}: ${err.message}`);
    });
  }
}
```

### Validating Agent Files

```typescript
import { isValidAgentFile, getValidationErrors } from 'mastra-af-letta';

// Quick validation
if (isValidAgentFile(agentJson)) {
  console.log('Agent file is valid');
}

// Get detailed errors
const errors = getValidationErrors(agentJson);
if (errors) {
  errors.forEach(err => {
    console.error(`${err.path}: ${err.message}`);
  });
}
```

### Working with TypeScript Types

```typescript
import type { AfAgentSchema, AfTool, AfMessage } from 'mastra-af-letta';

// Type-safe agent manipulation
function addTool(agent: AfAgentSchema, tool: AfTool): AfAgentSchema {
  return {
    ...agent,
    tools: [...agent.tools, tool],
    updated_at: new Date().toISOString(),
  };
}

// Type-safe message creation
const message: AfMessage = {
  id: crypto.randomUUID(),
  role: 'user',
  text: 'Hello, assistant!',
  timestamp: new Date().toISOString(),
};
```

### Using Zod Schemas Directly

```typescript
import { afAgentSchema, toolSchema } from 'mastra-af-letta';

// Validate partial data
const toolResult = toolSchema.safeParse({
  name: 'calculator',
  description: 'Perform calculations',
  type: 'python',
  parameters: {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: 'Math expression to evaluate',
      },
    },
    required: ['expression'],
  },
  source_code: 'def calculate(expression: str): return eval(expression)',
});

if (toolResult.success) {
  console.log('Valid tool:', toolResult.data.name);
}
```

## MCP Tool Support

This package extends the .af format to support MCP (Model Context Protocol) tools and secure authentication through metadata fields.

### Defining MCP Tools

```typescript
const mcpTool: AfTool = {
  name: 'github_search',
  description: 'Search GitHub repositories',
  type: 'json_schema',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    },
    required: ['query']
  },
  metadata: {
    _mastra_tool: {
      type: 'mcp',
      server: 'https://mcp-github.example.com',
      tool_name: 'search',
      transport: 'http',
      auth_ref: {
        provider: 'env',
        config_id: 'GITHUB_TOKEN',
        metadata: {
          auth_type: 'bearer'
        }
      }
    }
  }
};
```

### Authentication References

Never store credentials in .af files. Instead, use authentication references:

```typescript
// Environment variable reference
auth_ref: {
  provider: 'env',
  config_id: 'API_KEY'
}

// Vault reference
auth_ref: {
  provider: 'vault',
  config_id: 'secret/api-keys/service'
}

// OAuth2 reference
auth_ref: {
  provider: 'oauth2',
  config_id: 'github_oauth',
  metadata: {
    required_scopes: ['repo', 'read:user']
  }
}
```

### URL-Based Tools

```typescript
const urlTool: AfTool = {
  name: 'webhook',
  type: 'json_schema',
  parameters: { /* ... */ },
  metadata: {
    _mastra_tool: {
      type: 'url',
      endpoint: 'https://api.example.com/webhook',
      method: 'POST',
      auth_ref: {
        provider: 'env',
        config_id: 'WEBHOOK_TOKEN'
      }
    }
  }
};
```

## API Reference

### Parser Functions

#### `parseAgentFile(jsonString, options?)`
Parse and validate an .af file from a JSON string.

- **Throws**: `AgentFileParseError` on invalid input
- **Options**:
  - `maxSize`: Maximum file size in bytes (default: 50MB)
  - `autoFix`: Apply automatic fixes for common issues (default: true)
  - `strict`: Strict validation mode (default: false)

#### `safeParseAgentFile(jsonString, options?)`
Parse an .af file with a result object (never throws).

- **Returns**: `{ success: true, data: AfAgentSchema } | { success: false, error: AgentFileParseError }`

#### `parseAgentFileObject(data, options?)`
Parse an already-parsed JSON object.

#### `isValidAgentFile(jsonString)`
Quick validation check.

- **Returns**: `boolean`

#### `getValidationErrors(jsonString)`
Get detailed validation errors.

- **Returns**: `Array<{ path: string, message: string }> | null`

#### `extractAgentMetadata(jsonString)`
Extract basic metadata without full validation.

- **Returns**: Partial agent metadata or null

### Schema Exports

All Zod schemas are exported for direct use:

- `afAgentSchema` - Complete agent file schema
- `llmConfigSchema` - Language model configuration
- `embeddingConfigSchema` - Embedding configuration
- `coreMemoryBlockSchema` - Core memory blocks
- `messageSchema` - Conversation messages
- `toolSchema` - Tool definitions
- `toolRuleSchema` - Tool usage rules
- `toolCallSchema` - Tool invocations
- `toolResultSchema` - Tool results
- `toolParametersSchema` - Tool parameter schemas

### Type Exports

All TypeScript interfaces are exported:

- `AfAgentSchema` - Main agent file structure
- `AfLLMConfig` - LLM configuration
- `AfEmbeddingConfig` - Embedding configuration
- `AfCoreMemoryBlock` - Core memory block
- `AfMessage` - Message with tool calls
- `AfTool` - Tool definition
- `AfToolRule` - Tool usage rule
- `AfToolCall` - Tool invocation
- `AfToolResult` - Tool execution result
- `AfToolParameters` - Tool parameter schema
- `AfParameterProperty` - Individual parameter
- `MastraToolMetadata` - MCP and external tool metadata
- `AuthReference` - Secure authentication reference

## Auto-Fix Features

The parser can automatically fix common issues:

1. **Missing timestamps**: Adds current time for `created_at` and `updated_at`
2. **Missing version**: Defaults to "0.1.0"
3. **Empty arrays**: Initializes `core_memory`, `messages`, and `tools` as empty arrays
4. **Message timestamps**: Generates reasonable timestamps for messages without them
5. **Tool parameters**: Ensures proper structure with `type: "object"` and `properties`

Disable auto-fix with `{ autoFix: false }` in parse options.

## Error Handling

The `AgentFileParseError` class provides detailed error information:

```typescript
try {
  const agent = parseAgentFile(json);
} catch (error) {
  if (error instanceof AgentFileParseError) {
    console.error('Parse error:', error.message);
    
    // Check for validation errors
    if (error.validationErrors) {
      error.validationErrors.forEach(err => {
        console.error(`  ${err.path}: ${err.message}`);
      });
    }
    
    // Access original error
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
  }
}
```

## Validation Rules

The parser enforces these validation rules:

1. **Required fields**: `agent_type`, `name`, `system`, `llm_config`, `version`, timestamps
2. **Tool source code**: Required for `python` and `javascript` tool types
3. **Message indices**: `in_context_message_indices` must reference valid message positions
4. **Tool rules**: Must reference existing tools
5. **Timestamps**: Must be in ISO 8601 format
6. **Parameter schemas**: Must follow JSON Schema specification

## Requirements

- Node.js 18+
- @mastra/core (peer dependency)
- TypeScript 5.0+ (for TypeScript projects)

## How It Works

This package acts as a bridge between Mastra's agent system and Letta's .af format:

1. **Import**: Converts .af files to Mastra's `AgentConfig` format
2. **Export**: Converts Mastra agents back to .af format
3. **Validation**: Ensures data integrity during conversion
4. **Type Safety**: Provides full TypeScript support

### Limitations

- Dynamic instructions and tools (functions) are converted to static values during export
- Some Mastra-specific features may not have direct .af equivalents
- Tool rules from .af files are not directly supported in Mastra

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT - See [LICENSE](./LICENSE) for details.

## Related Projects

- [Mastra](https://github.com/mastra-ai/mastra) - The AI framework this package extends
- [Letta](https://github.com/letta-ai/letta) - The source of the .af format