# Using mastra-af-letta Package with Mastra

## Overview

The `mastra-af-letta` package enables seamless portability of AI agents between [Mastra.ai](https://mastra.ai) and [Letta](https://github.com/letta-ai/letta) through the .af (Agent File) format. This guide explains how LLM agents can effectively use this package to work with agent files.

## Installation

```bash
npm install mastra-af-letta @mastra/core
```

The package requires `@mastra/core` as a peer dependency for full Mastra integration functionality.

## Core Capabilities

### 1. Parse and Validate .af Files

```typescript
import { parseAgentFile, isValidAgentFile, getValidationErrors } from 'mastra-af-letta';
import { readFileSync } from 'fs';

// Parse an agent file
const afContent = readFileSync('./agent.af', 'utf-8');
const agentData = parseAgentFile(afContent);

// Quick validation
if (isValidAgentFile(afContent)) {
  console.log('Valid agent file');
}

// Detailed error checking
const errors = getValidationErrors(afContent);
if (errors) {
  errors.forEach(err => console.error(`${err.path}: ${err.message}`));
}
```

### 2. Safe Parsing with Error Handling

```typescript
import { safeParseAgentFile } from 'mastra-af-letta';

const result = safeParseAgentFile(afContent);

if (result.success) {
  console.log(`Agent: ${result.data.name}`);
  console.log(`Tools: ${result.data.tools.map(t => t.name).join(', ')}`);
} else {
  console.error('Parse failed:', result.error.message);
  // Access detailed validation errors
  result.error.validationErrors?.forEach(err => {
    console.error(`  ${err.path}: ${err.message}`);
  });
}
```

### 3. Work with TypeScript Types

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

// Create type-safe messages
const message: AfMessage = {
  id: crypto.randomUUID(),
  role: 'user',
  text: 'Hello, assistant!',
  timestamp: new Date().toISOString(),
};
```

## MCP Tool Support

The package extends .af format with Model Context Protocol (MCP) support:

### Defining MCP Tools

```typescript
const mcpTool: AfTool = {
  name: 'github_search',
  description: 'Search GitHub repositories',
  type: 'json_schema',
  parameters: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' }
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
        metadata: { auth_type: 'bearer' }
      }
    }
  }
};
```

### Authentication References

Never store credentials in .af files. Use authentication references:

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

## Mastra Integration (Future)

> **Note**: Full Mastra import/export functionality will be available in a future version once Mastra interfaces are finalized.

The planned integration will support:

### Importing .af to Mastra

```typescript
// Future API
import { importAfAgent } from 'mastra-af-letta';

const afData = parseAgentFile(afContent);
const result = importAfAgent(afData, {
  toolCodeStrategy: 'schema-only',
  includeMessages: true
});

// Check for conversion warnings
if (result.warnings.length > 0) {
  console.log('Import warnings:', result.warnings);
}

// Use with Mastra
const agent = new Agent(result.agent);
```

### Exporting Mastra to .af

```typescript
// Future API
import { exportMastraAgent } from 'mastra-af-letta';

const result = exportMastraAgent(agent, memory, {
  pretty: true,
  includeMessages: true,
  maxMessages: 100
});

await fs.writeFile('exported-agent.af', result.content);
console.log('Export metadata:', result.metadata);
```

## Auto-Fix Features

The parser automatically fixes common issues:

- **Missing timestamps**: Adds current time for `created_at` and `updated_at`
- **Missing version**: Defaults to "0.1.0"
- **Empty arrays**: Initializes required arrays as empty
- **Message timestamps**: Generates reasonable timestamps
- **Tool parameters**: Ensures proper JSON Schema structure

Disable with `{ autoFix: false }` in parse options.

## Error Handling

```typescript
import { AgentFileParseError } from 'mastra-af-letta';

try {
  const agent = parseAgentFile(jsonContent);
} catch (error) {
  if (error instanceof AgentFileParseError) {
    console.error('Parse error:', error.message);
    
    // Access validation errors
    if (error.validationErrors) {
      error.validationErrors.forEach(err => {
        console.error(`  ${err.path}: ${err.message}`);
      });
    }
    
    // Access original cause
    if (error.cause) {
      console.error('Caused by:', error.cause.message);
    }
  }
}
```

## Validation Rules

The package enforces:

1. **Required fields**: `agent_type`, `name`, `system`, `llm_config`, `version`, timestamps
2. **Tool source code**: Required for `python` and `javascript` tool types
3. **Message indices**: `in_context_message_indices` must reference valid positions
4. **Tool rules**: Must reference existing tools
5. **Timestamps**: Must be in ISO 8601 format
6. **Parameter schemas**: Must follow JSON Schema specification

## Schema Exports

Access Zod schemas directly:

```typescript
import { 
  afAgentSchema, 
  toolSchema, 
  messageSchema,
  llmConfigSchema 
} from 'mastra-af-letta';

// Validate partial data
const toolResult = toolSchema.safeParse(toolData);
if (toolResult.success) {
  console.log('Valid tool:', toolResult.data.name);
}
```

## Example: Creating a Complete Agent File

```typescript
import { AfAgentSchema } from 'mastra-af-letta';

const agent: AfAgentSchema = {
  agent_type: 'mastra',
  name: 'Research Assistant',
  description: 'AI agent for research tasks',
  system: 'You are a helpful research assistant.',
  llm_config: {
    provider: 'openai',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2000
  },
  core_memory: [
    {
      label: 'user_preferences',
      value: 'Research focus: AI and machine learning',
      character_limit: 1000
    }
  ],
  messages: [],
  tools: [
    {
      name: 'web_search',
      description: 'Search the web for information',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          max_results: { type: 'number', default: 10 }
        },
        required: ['query']
      }
    }
  ],
  version: '0.1.0',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Validate and save
const result = afAgentSchema.safeParse(agent);
if (result.success) {
  const json = JSON.stringify(result.data, null, 2);
  await fs.writeFile('research-assistant.af', json);
}
```

## Best Practices for LLM Agents

1. **Always validate**: Use `isValidAgentFile()` before processing
2. **Handle errors gracefully**: Use `safeParseAgentFile()` for robust parsing
3. **Secure authentication**: Never embed credentials, use auth references
4. **MCP integration**: Leverage metadata for external tool connections
5. **Type safety**: Use TypeScript types for better development experience
6. **Auto-fix cautiously**: Review auto-fixed data before production use

## Package Limitations

- Dynamic instructions and tools (functions) convert to static values during export
- Some Mastra-specific features may not have direct .af equivalents  
- Tool rules from .af files are not directly supported in Mastra
- Full Mastra integration pending interface finalization

This package provides a solid foundation for agent portability between Mastra and Letta ecosystems, with robust validation and MCP support for modern AI agent workflows.