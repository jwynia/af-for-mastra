/**
 * @fileoverview Zod schemas for validating Letta .af (Agent File) format
 * 
 * These schemas provide runtime validation with detailed error messages
 * to help users understand and fix issues with their .af files.
 * 
 * @module @mastra/portability-af-letta
 */

import { z } from 'zod';
import type {
  AfAgentSchema,
  AfLLMConfig,
  AfEmbeddingConfig,
  AfCoreMemoryBlock,
  AfMessage,
  AfTool,
  AfToolRule,
  AfToolCall,
  AfToolResult,
  AfToolParameters,
  AfParameterProperty,
  MastraToolMetadata,
  AuthReference,
} from './types';

/**
 * ISO 8601 date-time string validation
 * Ensures timestamps are in the correct format.
 */
const iso8601Schema = z
  .string()
  .datetime({ message: 'Timestamp must be in ISO 8601 format (e.g., 2024-01-01T00:00:00Z)' });

/**
 * Message role validation
 */
const messageRoleSchema = z.enum(['user', 'assistant', 'system', 'tool'], {
  errorMap: () => ({ message: 'Role must be one of: user, assistant, system, tool' }),
});

/**
 * Tool type validation
 */
const toolTypeSchema = z.enum(['python', 'javascript', 'json_schema'], {
  errorMap: () => ({ message: 'Tool type must be one of: python, javascript, json_schema' }),
});

/**
 * Tool rule type validation - flexible string for different frameworks
 */
const toolRuleTypeSchema = z.string().min(1, 'Rule type is required');

/**
 * LLM configuration schema
 * Validates language model settings with provider flexibility.
 */
export const llmConfigSchema = z
  .object({
    provider: z.string().min(1, 'Provider is required'),
    model: z.string().min(1, 'Model is required'),
    temperature: z
      .number()
      .min(0, 'Temperature must be >= 0')
      .max(2, 'Temperature must be <= 2')
      .optional(),
    max_tokens: z.number().positive('Max tokens must be positive').optional(),
    top_p: z
      .number()
      .min(0, 'Top-p must be >= 0')
      .max(1, 'Top-p must be <= 1')
      .optional(),
    frequency_penalty: z
      .number()
      .min(-2, 'Frequency penalty must be >= -2')
      .max(2, 'Frequency penalty must be <= 2')
      .optional(),
    presence_penalty: z
      .number()
      .min(-2, 'Presence penalty must be >= -2')
      .max(2, 'Presence penalty must be <= 2')
      .optional(),
  })
  .passthrough() // Allow provider-specific fields
  .describe('Language model configuration');

/**
 * Embedding configuration schema
 */
export const embeddingConfigSchema = z
  .object({
    provider: z.string().min(1, 'Provider is required'),
    model: z.string().min(1, 'Model is required'),
    dimensions: z.number().positive('Dimensions must be positive').optional(),
  })
  .passthrough()
  .describe('Embedding model configuration');

/**
 * Core memory block schema
 * Validates persistent memory segments.
 */
export const coreMemoryBlockSchema = z
  .object({
    label: z.string().min(1, 'Memory block label is required'),
    value: z.string(),
    character_limit: z.number().positive('Character limit must be positive').optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .describe('Core memory block');

/**
 * Tool call schema
 */
export const toolCallSchema = z
  .object({
    id: z.string().min(1, 'Tool call ID is required'),
    name: z.string().min(1, 'Tool name is required'),
    arguments: z.record(z.unknown()),
    metadata: z.record(z.unknown()).optional(),
  })
  .describe('Tool invocation request');

/**
 * Tool result schema
 */
export const toolResultSchema = z
  .object({
    id: z.string().min(1, 'Tool result ID is required'),
    name: z.string().min(1, 'Tool name is required'),
    result: z.unknown().optional(),
    error: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .describe('Tool execution result');

/**
 * Message schema
 * Validates conversation messages with all their components.
 */
export const messageSchema = z
  .object({
    id: z.string().min(1, 'Message ID is required'),
    role: messageRoleSchema,
    text: z.string(),
    timestamp: iso8601Schema,
    tool_calls: z.array(toolCallSchema).optional(),
    tool_results: z.array(toolResultSchema).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .describe('Conversation message');

/**
 * Recursive parameter property schema for JSON Schema validation
 * Supports nested object and array definitions.
 */
const parameterPropertySchema: z.ZodType<AfParameterProperty> = z.lazy(() =>
  z
    .object({
      type: z.string().min(1, 'Parameter type is required'),
      description: z.string().optional(),
      enum: z.array(z.unknown()).optional(),
      items: parameterPropertySchema.optional(),
      properties: z.record(parameterPropertySchema).optional(),
    })
    .passthrough()
    .describe('Parameter property definition')
);

/**
 * Tool parameters schema (JSON Schema format)
 */
export const toolParametersSchema = z
  .object({
    type: z.literal('object', {
      errorMap: () => ({ message: 'Tool parameters must have type "object"' }),
    }),
    properties: z.record(parameterPropertySchema),
    required: z.array(z.string()).optional(),
    additionalProperties: z.boolean().optional(),
  })
  .describe('Tool parameter schema');

/**
 * Authentication reference schema
 * Validates secure credential references without storing actual secrets.
 */
export const authReferenceSchema = z
  .object({
    provider: z.enum(['env', 'vault', 'oauth2', 'keychain', 'dynamic'], {
      errorMap: () => ({ message: 'Auth provider must be one of: env, vault, oauth2, keychain, dynamic' }),
    }),
    config_id: z.string().min(1, 'Configuration ID is required'),
    metadata: z
      .object({
        auth_type: z
          .enum(['bearer', 'api_key', 'oauth2', 'basic', 'custom'])
          .optional(),
        required_scopes: z.array(z.string()).optional(),
        expires_in: z.number().positive('Expiration must be positive').optional(),
        prompt: z.string().optional(),
        cache_duration: z.number().nonnegative('Cache duration must be non-negative').optional(),
      })
      .optional(),
  })
  .describe('Authentication reference');

/**
 * Mastra tool metadata schema
 * Validates MCP and external tool configurations.
 */
export const mastraToolMetadataSchema = z
  .object({
    type: z.enum(['mcp', 'url', 'reference'], {
      errorMap: () => ({ message: 'Mastra tool type must be one of: mcp, url, reference' }),
    }),
    server: z.string().url('Server must be a valid URL').optional(),
    tool_name: z.string().optional(),
    transport: z.enum(['stdio', 'http']).optional(),
    endpoint: z.string().url('Endpoint must be a valid URL').optional(),
    method: z.enum(['GET', 'POST']).optional(),
    auth_ref: authReferenceSchema.optional(),
  })
  .refine(
    (data) => {
      // Validate required fields based on type
      if (data.type === 'mcp') {
        return !!data.server && !!data.tool_name;
      }
      if (data.type === 'url') {
        return !!data.endpoint;
      }
      return true;
    },
    {
      message: 'MCP tools require server and tool_name, URL tools require endpoint',
    }
  )
  .describe('Mastra tool metadata');

/**
 * Tool schema
 * Validates tool definitions with appropriate constraints.
 */
export const toolSchema = z
  .object({
    name: z.string().min(1, 'Tool name is required'),
    description: z.string().min(1, 'Tool description is required'),
    type: toolTypeSchema,
    parameters: toolParametersSchema,
    source_code: z.string().optional(),
    metadata: z
      .record(z.unknown())
      .optional()
      .refine(
        (metadata) => {
          // If _mastra_tool exists, validate it
          if (metadata && '_mastra_tool' in metadata) {
            return mastraToolMetadataSchema.safeParse(metadata._mastra_tool).success;
          }
          return true;
        },
        {
          message: 'Invalid _mastra_tool metadata structure',
        }
      ),
  })
  .refine(
    (tool) => {
      // Source code is required for python and javascript tools
      if ((tool.type === 'python' || tool.type === 'javascript') && !tool.source_code) {
        return false;
      }
      return true;
    },
    {
      message: 'Source code is required for python and javascript tool types',
      path: ['source_code'],
    }
  )
  .describe('Tool definition');

/**
 * Tool rule schema
 */
export const toolRuleSchema = z
  .object({
    tool_name: z.string().min(1, 'Tool name is required'),
    rule_type: toolRuleTypeSchema,
    rule_content: z.string().min(1, 'Rule content is required'),
  })
  .describe('Tool usage rule');

/**
 * Main agent schema
 * Validates the complete .af file structure with all components.
 */
export const afAgentSchema = z
  .object({
    // Core identification
    agent_type: z.string().min(1, 'Agent type is required'),
    name: z.string().min(1, 'Agent name is required'),
    description: z.string().optional(),

    // System configuration
    system: z.string().min(1, 'System prompt is required'),

    // Model configuration
    llm_config: llmConfigSchema,
    embedding_config: embeddingConfigSchema.optional(),

    // Memory components - object with named memory blocks
    core_memory: z.record(coreMemoryBlockSchema).refine(
      (memory) => memory.persona && memory.human,
      'Core memory must contain at least persona and human blocks'
    ),
    messages: z.array(messageSchema),
    in_context_message_indices: z
      .array(z.number().nonnegative('Message index must be non-negative'))
      .optional(),

    // Tools
    tools: z.array(toolSchema),
    tool_rules: z.array(toolRuleSchema).optional(),
    tool_exec_environment_variables: z.record(z.string()).optional(),

    // Metadata
    tags: z.array(z.string()).optional(),
    metadata_: z.record(z.unknown()).optional(),

    // Versioning
    version: z.string().min(1, 'Version is required'),
    created_at: iso8601Schema,
    updated_at: iso8601Schema,
  })
  .refine(
    (agent) => {
      // Validate in_context_message_indices references
      if (agent.in_context_message_indices) {
        const maxIndex = agent.messages.length - 1;
        return agent.in_context_message_indices.every((idx) => idx <= maxIndex);
      }
      return true;
    },
    {
      message: 'in_context_message_indices contains out-of-range message references',
      path: ['in_context_message_indices'],
    }
  )
  .refine(
    (agent) => {
      // Validate tool_rules reference existing tools
      if (agent.tool_rules) {
        const toolNames = new Set(agent.tools.map((t) => t.name));
        return agent.tool_rules.every((rule) => toolNames.has(rule.tool_name));
      }
      return true;
    },
    {
      message: 'tool_rules references non-existent tools',
      path: ['tool_rules'],
    }
  )
  .describe('Complete agent file schema');

/**
 * Type guard to check if a value is a valid AfAgentSchema
 */
export function isValidAfSchema(value: unknown): value is AfAgentSchema {
  return afAgentSchema.safeParse(value).success;
}

/**
 * Parse and validate an agent file with detailed error reporting
 * 
 * @param data - The data to validate (usually from JSON.parse)
 * @returns Validated agent schema
 * @throws {ZodError} With detailed validation errors
 */
export function parseAfSchema(data: unknown): AfAgentSchema {
  try {
    return afAgentSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Enhance error messages for better debugging
      const enhancedError = new Error('Agent file validation failed');
      (enhancedError as any).validationErrors = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code,
      }));
      throw enhancedError;
    }
    throw error;
  }
}

/**
 * Safely parse and validate with a result object
 * 
 * @param data - The data to validate
 * @returns Result object with either data or error
 */
export function safeParseAfSchema(
  data: unknown
): { success: true; data: AfAgentSchema } | { success: false; error: z.ZodError } {
  return afAgentSchema.safeParse(data);
}