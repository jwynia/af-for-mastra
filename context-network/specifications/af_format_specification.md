# .af (Agent File) Format Specification

## Purpose
This document provides the comprehensive specification for the .af (Agent File) format, an open standard for serializing AI agents into portable JSON files. This specification serves as the authoritative reference for the mastra-af-letta package implementation.

## Classification
- **Domain:** Specifications
- **Stability:** Semi-stable
- **Abstraction:** Technical
- **Confidence:** Authoritative

## Content

### Format Overview

The .af format is a JSON-based serialization format designed to capture the complete state of an AI agent, including:
- Agent configuration and metadata
- Language model settings
- Core memory blocks
- Conversation history with tool interactions
- Tool definitions and usage rules
- Authentication references (non-embedded)

### File Structure

An .af file is a valid JSON document with the following root structure:

```json
{
  "agent_type": "string",
  "version": "string",
  "name": "string",
  "agent_id": "string",
  "created_at": "ISO 8601 timestamp",
  "updated_at": "ISO 8601 timestamp",
  "system": "string",
  "llm_config": {},
  "embedding_config": {},
  "core_memory": {},
  "messages": [],
  "in_context_message_indices": [],
  "tools": [],
  "tool_rules": [],
  "metadata": {}
}
```

### Field Specifications

#### Root Fields

##### `agent_type` (required, string)
- **Description**: The type of agent, identifying the source framework
- **Format**: String identifier
- **Common values**: `"memgpt"`, `"letta"`, `"mastra"`
- **Example**: `"letta"`

##### `version` (required, string)
- **Description**: The version of the .af format specification
- **Format**: Semantic version string
- **Pattern**: `^\d+\.\d+\.\d+$`
- **Example**: `"0.1.0"`

##### `name` (required, string)
- **Description**: Human-readable name for the agent
- **Format**: UTF-8 string
- **Max length**: 256 characters
- **Example**: `"Customer Support Assistant"`

##### `agent_id` (optional, string)
- **Description**: Unique identifier for the agent
- **Format**: UUID v4 or framework-specific ID
- **Example**: `"550e8400-e29b-41d4-a716-446655440000"`

##### `created_at` (required, string)
- **Description**: Timestamp of agent creation
- **Format**: ISO 8601 timestamp with timezone
- **Example**: `"2024-01-15T09:30:00Z"`

##### `updated_at` (required, string)
- **Description**: Timestamp of last modification
- **Format**: ISO 8601 timestamp with timezone
- **Example**: `"2024-01-20T14:45:30Z"`

##### `system` (required, string)
- **Description**: System prompt defining agent behavior
- **Format**: UTF-8 string
- **Max length**: 32,768 characters
- **Example**: `"You are a helpful assistant..."`

#### LLM Configuration

##### `llm_config` (required, object)
```json
{
  "model": "string",
  "temperature": 0.0-2.0,
  "max_tokens": 1-1000000,
  "top_p": 0.0-1.0,
  "frequency_penalty": -2.0-2.0,
  "presence_penalty": -2.0-2.0,
  "provider": "string (optional)",
  "model_endpoint": "string (optional)",
  "model_api_key": "string (optional, deprecated)"
}
```

**Field Details**:
- `model`: Model identifier (e.g., `"gpt-4"`, `"claude-3-opus"`)
- `temperature`: Sampling temperature for randomness
- `max_tokens`: Maximum tokens in response
- `top_p`: Nucleus sampling parameter
- `frequency_penalty`: Repetition penalty
- `presence_penalty`: Topic diversity penalty
- `provider`: Service provider (e.g., `"openai"`, `"anthropic"`)
- `model_endpoint`: Custom API endpoint URL
- `model_api_key`: **DEPRECATED** - Use authentication references instead

#### Embedding Configuration

##### `embedding_config` (optional, object)
```json
{
  "model": "string",
  "dim": 1-8192,
  "provider": "string (optional)",
  "endpoint": "string (optional)"
}
```

**Field Details**:
- `model`: Embedding model identifier
- `dim`: Dimensionality of embeddings
- `provider`: Service provider
- `endpoint`: Custom API endpoint

#### Core Memory

##### `core_memory` (required, object)
```json
{
  "persona": {
    "label": "persona",
    "value": "string",
    "limit": 1-65536
  },
  "human": {
    "label": "human", 
    "value": "string",
    "limit": 1-65536
  }
}
```

**Requirements**:
- Must contain at least `persona` and `human` blocks
- Additional custom blocks are allowed
- Each block must have `label`, `value`, and `limit` fields

#### Messages

##### `messages` (required, array)
Array of message objects representing conversation history:

```json
{
  "id": "string",
  "role": "system|user|assistant|tool",
  "text": "string",
  "timestamp": "ISO 8601",
  "tool_calls": [],
  "tool_results": []
}
```

**Message Fields**:
- `id`: Unique message identifier
- `role`: Message sender role
- `text`: Message content (can be empty for tool-only messages)
- `timestamp`: When the message was created
- `tool_calls`: Array of tool invocations (assistant messages only)
- `tool_results`: Array of tool results (tool messages only)

##### `in_context_message_indices` (optional, array)
- **Description**: Indices of messages to include in context window
- **Format**: Array of non-negative integers
- **Constraints**: Each index must be valid for the messages array
- **Example**: `[0, 5, 10, 15]`

#### Tools

##### `tools` (required, array)
Array of tool definitions:

```json
{
  "name": "string",
  "description": "string",
  "type": "python|javascript|json_schema",
  "parameters": {},
  "required": [],
  "source_code": "string (conditional)",
  "metadata": {}
}
```

**Tool Types**:

1. **JSON Schema Tools** (`type: "json_schema"`)
   - `parameters`: Valid JSON Schema object
   - `required`: Array of required parameter names
   - `source_code`: Not used

2. **Python Tools** (`type: "python"`)
   - `parameters`: JSON Schema for function parameters
   - `source_code`: Python function implementation (required)

3. **JavaScript Tools** (`type: "javascript"`)
   - `parameters`: JSON Schema for function parameters
   - `source_code`: JavaScript function implementation (required)

**Extended Metadata** (mastra-af-letta extension):
```json
{
  "_mastra_tool": {
    "type": "mcp|url",
    "server": "string (MCP only)",
    "tool_name": "string (MCP only)",
    "transport": "http|websocket|stdio (MCP only)",
    "endpoint": "string (URL only)",
    "method": "GET|POST|PUT|DELETE (URL only)",
    "auth_ref": {}
  }
}
```

#### Tool Rules

##### `tool_rules` (optional, array)
Array of tool usage rules:

```json
{
  "tool_name": "string",
  "rule_type": "string",
  "rule_content": "string"
}
```

**Fields**:
- `tool_name`: Must reference an existing tool
- `rule_type`: Framework-specific rule type
- `rule_content`: Rule configuration

#### Authentication References

##### `auth_ref` (object)
Secure authentication reference (never embed credentials):

```json
{
  "provider": "env|vault|oauth2|custom",
  "config_id": "string",
  "metadata": {}
}
```

**Provider Types**:
1. `env`: Environment variable
2. `vault`: Secret management system
3. `oauth2`: OAuth2 flow
4. `custom`: Framework-specific

### Tool Calls and Results

#### Tool Call Structure
```json
{
  "id": "string",
  "name": "string",
  "arguments": {},
  "metadata": {}
}
```

#### Tool Result Structure
```json
{
  "id": "string",
  "name": "string",
  "result": "any",
  "error": "string (optional)",
  "metadata": {}
}
```

### Validation Rules

1. **Required Fields**: All fields marked as required must be present
2. **Timestamps**: Must be valid ISO 8601 format with timezone
3. **Message Indices**: Must reference valid positions in messages array
4. **Tool References**: Tool rules and calls must reference existing tools
5. **JSON Schema**: Parameter definitions must be valid JSON Schema
6. **Character Limits**: Respect maximum lengths for strings
7. **Numeric Ranges**: Respect min/max values for numbers

### Version Compatibility

- **0.1.0**: Initial specification
- **Future versions**: Must maintain backward compatibility
- **Version detection**: Based on `version` field
- **Migration**: Automatic upgrades for older versions

### Security Considerations

1. **No Embedded Credentials**: Never store API keys, tokens, or passwords
2. **Authentication References**: Use provider-based references only
3. **Input Validation**: Sanitize all user-provided content
4. **Size Limits**: Enforce reasonable file size limits (default: 50MB)

### Examples

#### Minimal Valid .af File
```json
{
  "agent_type": "letta",
  "version": "0.1.0",
  "name": "Simple Agent",
  "system": "You are a helpful assistant.",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "llm_config": {
    "model": "gpt-4",
    "temperature": 0.7
  },
  "core_memory": {
    "persona": {
      "label": "persona",
      "value": "I am a helpful AI assistant.",
      "limit": 2000
    },
    "human": {
      "label": "human",
      "value": "The user is interested in technology.",
      "limit": 2000
    }
  },
  "messages": [],
  "tools": []
}
```

## Relationships
- **Parent Nodes:** [foundation/system_overview.md]
- **Child Nodes:** 
  - [specifications/af_format_examples.md] - examples - Comprehensive examples
  - [specifications/af_format_extensions.md] - extends - Mastra-specific extensions
- **Related Nodes:** 
  - [architecture/conversion_architecture.md] - implements - Conversion logic
  - [testing/specification_compliance.md] - validates - Compliance tests

## Navigation Guidance
- **Access Context:** Reference this when implementing parsers or validators
- **Common Next Steps:** Review examples or implement compliance tests
- **Related Tasks:** Parser implementation, validator creation, test writing
- **Update Patterns:** Update when format specification evolves

## Metadata
- **Created:** 2025-07-13
- **Last Updated:** 2025-07-13
- **Updated By:** AI Assistant

## Change History
- 2025-07-13: Initial creation of .af format specification