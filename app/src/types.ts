/**
 * @fileoverview TypeScript type definitions for Letta's .af (Agent File) format
 * 
 * The Agent File (.af) format is an open standard for serializing AI agents,
 * including their configuration, memory, tools, and conversation history.
 * This file provides TypeScript interfaces that match the .af specification.
 * 
 * @see https://github.com/letta-ai/agent-file - Official .af specification
 * @module @mastra/portability-af-letta
 */

/**
 * ISO 8601 date-time string format
 * @example "2024-01-01T00:00:00Z"
 */
export type ISO8601 = string;

/**
 * Supported message roles in conversations
 */
export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

/**
 * Supported tool implementation types
 */
export type ToolType = 'python' | 'javascript' | 'json_schema';

/**
 * Tool rule types for constraining tool usage
 */
export type ToolRuleType = 'max_use' | 'require_approval' | 'dependency' | 'custom';

/**
 * Main agent schema - represents a complete serialized agent
 * 
 * This is the root object of an .af file, containing all information
 * needed to reconstruct an agent's state and behavior.
 */
export interface AfAgentSchema {
  /**
   * Type identifier for the agent framework
   * @example "memgpt", "letta"
   */
  agent_type: string;

  /**
   * Human-readable name for the agent
   * @example "Customer Support Assistant"
   */
  name: string;

  /**
   * Optional description of the agent's purpose and capabilities
   */
  description?: string;

  /**
   * System prompt that defines the agent's behavior and personality
   * This is the core instruction set for the agent.
   */
  system: string;

  /**
   * Language model configuration
   */
  llm_config: AfLLMConfig;

  /**
   * Optional embedding model configuration for semantic memory
   */
  embedding_config?: AfEmbeddingConfig;

  /**
   * Core memory blocks that persist across conversations
   * These typically include personality traits and user information.
   */
  core_memory: AfCoreMemoryBlock[];

  /**
   * Complete message history for the agent
   */
  messages: AfMessage[];

  /**
   * Indices of messages currently in the agent's context window
   * This allows recreating the exact context state.
   */
  in_context_message_indices?: number[];

  /**
   * Tool definitions available to the agent
   */
  tools: AfTool[];

  /**
   * Optional rules constraining tool usage
   */
  tool_rules?: AfToolRule[];

  /**
   * Environment variables available during tool execution
   */
  tool_exec_environment_variables?: Record<string, string>;

  /**
   * Tags for categorizing and filtering agents
   */
  tags?: string[];

  /**
   * Additional metadata (the underscore suffix avoids conflicts)
   */
  metadata_?: Record<string, unknown>;

  /**
   * Schema version for migration support
   * @example "0.1.0"
   */
  version: string;

  /**
   * Timestamp when the agent was created
   */
  created_at: ISO8601;

  /**
   * Timestamp of last modification
   */
  updated_at: ISO8601;
}

/**
 * Language model configuration
 * 
 * Defines which LLM to use and its parameters. The configuration
 * is intentionally flexible to support various providers.
 */
export interface AfLLMConfig {
  /**
   * LLM provider identifier
   * @example "openai", "anthropic", "local"
   */
  provider: string;

  /**
   * Model identifier within the provider
   * @example "gpt-4", "claude-3-opus"
   */
  model: string;

  /**
   * Temperature for response randomness (0-2, typically 0-1)
   */
  temperature?: number;

  /**
   * Maximum tokens in response
   */
  max_tokens?: number;

  /**
   * Nucleus sampling parameter
   */
  top_p?: number;

  /**
   * Frequency penalty for reducing repetition
   */
  frequency_penalty?: number;

  /**
   * Presence penalty for encouraging topic diversity
   */
  presence_penalty?: number;

  /**
   * Provider-specific additional parameters
   */
  [key: string]: unknown;
}

/**
 * Embedding model configuration for semantic memory
 */
export interface AfEmbeddingConfig {
  /**
   * Embedding provider identifier
   */
  provider: string;

  /**
   * Embedding model identifier
   */
  model: string;

  /**
   * Embedding vector dimensions
   */
  dimensions?: number;

  /**
   * Provider-specific additional parameters
   */
  [key: string]: unknown;
}

/**
 * Core memory block - persistent agent state
 * 
 * Core memory represents information that should always be
 * available to the agent, like personality or user preferences.
 */
export interface AfCoreMemoryBlock {
  /**
   * Memory block identifier
   * @example "personality", "user_info"
   */
  label: string;

  /**
   * Content of the memory block
   */
  value: string;

  /**
   * Optional character limit for this block
   */
  character_limit?: number;

  /**
   * Additional metadata for the block
   */
  metadata?: Record<string, unknown>;
}

/**
 * Message in the conversation history
 */
export interface AfMessage {
  /**
   * Unique message identifier
   */
  id: string;

  /**
   * Role of the message sender
   */
  role: MessageRole;

  /**
   * Message content
   */
  text: string;

  /**
   * When the message was created
   */
  timestamp: ISO8601;

  /**
   * Tool invocations requested in this message
   */
  tool_calls?: AfToolCall[];

  /**
   * Results from tool executions
   */
  tool_results?: AfToolResult[];

  /**
   * Additional message metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Tool invocation request
 */
export interface AfToolCall {
  /**
   * Unique identifier for this tool call
   */
  id: string;

  /**
   * Name of the tool to invoke
   */
  name: string;

  /**
   * Arguments to pass to the tool
   */
  arguments: Record<string, unknown>;
}

/**
 * Result from a tool execution
 */
export interface AfToolResult {
  /**
   * ID of the tool call this result corresponds to
   */
  tool_call_id: string;

  /**
   * Result data from the tool
   */
  result: unknown;

  /**
   * Error message if the tool execution failed
   */
  error?: string;
}

/**
 * Tool definition
 * 
 * Tools extend the agent's capabilities beyond conversation.
 * They can be implemented in various languages or as schemas.
 */
export interface AfTool {
  /**
   * Unique tool identifier
   */
  name: string;

  /**
   * Human-readable description of what the tool does
   */
  description: string;

  /**
   * Implementation type of the tool
   */
  type: ToolType;

  /**
   * JSON Schema defining the tool's parameters
   */
  parameters: AfToolParameters;

  /**
   * Optional source code for the tool implementation
   * Required for 'python' and 'javascript' tool types.
   */
  source_code?: string;

  /**
   * Additional tool metadata
   * 
   * Can include Mastra-specific extensions like:
   * - `_mastra_tool`: MCP or URL-based tool configuration
   * - Custom provider-specific metadata
   */
  metadata?: Record<string, unknown> & {
    /**
     * Mastra tool extension for MCP and external tools
     */
    _mastra_tool?: MastraToolMetadata;
  };
}

/**
 * Tool parameter schema (JSON Schema format)
 */
export interface AfToolParameters {
  /**
   * Must be 'object' for tool parameters
   */
  type: 'object';

  /**
   * Property definitions
   */
  properties: Record<string, AfParameterProperty>;

  /**
   * List of required property names
   */
  required?: string[];

  /**
   * Whether additional properties are allowed
   */
  additionalProperties?: boolean;
}

/**
 * Individual parameter property definition
 * 
 * Follows JSON Schema specification for describing data structures.
 */
export interface AfParameterProperty {
  /**
   * JSON Schema type
   * @example "string", "number", "boolean", "array", "object"
   */
  type: string;

  /**
   * Human-readable description
   */
  description?: string;

  /**
   * Enumerated valid values
   */
  enum?: unknown[];

  /**
   * Array item schema (when type is "array")
   */
  items?: AfParameterProperty;

  /**
   * Object property schemas (when type is "object")
   */
  properties?: Record<string, AfParameterProperty>;

  /**
   * Additional JSON Schema properties
   */
  [key: string]: unknown;
}

/**
 * Tool usage rule
 * 
 * Rules constrain how and when tools can be used by the agent.
 */
export interface AfToolRule {
  /**
   * Name of the tool this rule applies to
   */
  tool_name: string;

  /**
   * Type of rule to apply
   */
  rule_type: ToolRuleType;

  /**
   * Rule-specific configuration
   * 
   * @example
   * For 'max_use': { "max_uses": 3 }
   * For 'dependency': { "requires": ["other_tool"] }
   */
  configuration: Record<string, unknown>;
}

/**
 * Mastra-specific tool metadata for external tools
 * 
 * This extension enables MCP (Model Context Protocol) and URL-based tools
 * while maintaining backward compatibility with the standard .af format.
 */
export interface MastraToolMetadata {
  /**
   * Tool type extension
   */
  type: 'mcp' | 'url' | 'reference';

  /**
   * MCP server configuration
   */
  server?: string;

  /**
   * Tool name on the MCP server
   */
  tool_name?: string;

  /**
   * MCP transport type
   */
  transport?: 'stdio' | 'http';

  /**
   * URL endpoint for HTTP-based tools
   */
  endpoint?: string;

  /**
   * HTTP method for URL-based tools
   */
  method?: 'GET' | 'POST';

  /**
   * Authentication reference (never store actual credentials)
   */
  auth_ref?: AuthReference;
}

/**
 * Authentication reference for secure credential management
 * 
 * Instead of embedding credentials, we reference where to find them.
 */
export interface AuthReference {
  /**
   * Authentication provider type
   */
  provider: 'env' | 'vault' | 'oauth2' | 'keychain' | 'dynamic';

  /**
   * Configuration identifier
   * 
   * @example
   * - For 'env': "GITHUB_TOKEN" (environment variable name)
   * - For 'vault': "secret/api-keys/github" (vault path)
   * - For 'oauth2': "github_oauth" (OAuth config name)
   */
  config_id: string;

  /**
   * Authentication metadata (non-secret information)
   */
  metadata?: {
    /**
     * Type of authentication to use
     */
    auth_type?: 'bearer' | 'api_key' | 'oauth2' | 'basic' | 'custom';

    /**
     * Required OAuth scopes
     */
    required_scopes?: string[];

    /**
     * Token expiration time in seconds
     */
    expires_in?: number;

    /**
     * Prompt to show when using dynamic auth
     */
    prompt?: string;

    /**
     * Whether to cache the credential
     */
    cache_duration?: number;
  };
}