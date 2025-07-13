/**
 * @fileoverview Import converter for .af (Agent File) to Mastra Agent format
 * 
 * This module handles the conversion of parsed .af files into Mastra-compatible
 * agent configurations, including tool conversion and memory mapping.
 * 
 * @module @mastra/portability-af-letta
 */

import { z } from 'zod';
import type { 
  AgentConfig,
  ToolAction,
  CoreTool,
  DynamicArgument,
  MastraMemory,
  ToolsInput,
  MastraLanguageModel,
} from '@mastra/core';
import type { 
  AfAgentSchema, 
  AfTool, 
  AfCoreMemoryBlock,
  AfMessage,
  MastraToolMetadata 
} from './types';

/**
 * Re-export Mastra types for convenience
 */
export type { AgentConfig as MastraAgentConfig } from '@mastra/core';
export type { ToolAction as MastraTool } from '@mastra/core';

/**
 * Memory configuration for Mastra
 * This is a simplified interface for memory import/export
 * The actual MastraMemory from @mastra/core is more complex
 */
export interface MastraMemoryConfig {
  threadId?: string;
  workingMemory?: Record<string, any>;
  messages?: Array<{
    role: 'user' | 'assistant' | 'system' | 'tool';
    content: string;
    metadata?: Record<string, unknown>;
  }>;
}

/**
 * Import result with warnings and metadata
 */
export interface AfImportResult {
  agent: Partial<AgentConfig>; // Partial because not all fields may be convertible
  memory?: MastraMemoryConfig;
  warnings: AfImportWarning[];
  metadata: {
    originalVersion: string;
    importedAt: Date;
    lossyConversions: string[];
    mcpTools: number;
    standardTools: number;
  };
}

/**
 * Import warning for tracking conversion issues
 */
export interface AfImportWarning {
  field: string;
  reason: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Options for importing agent files
 */
export interface AfImportOptions {
  /**
   * How to handle tools with source code
   * - 'skip': Ignore tools with source code
   * - 'stub': Create non-functional stub
   * - 'schema-only': Use schema without implementation
   */
  toolCodeStrategy?: 'skip' | 'stub' | 'schema-only';
  
  /**
   * Whether to import message history
   */
  includeMessages?: boolean;
  
  /**
   * Whether to validate MCP servers are accessible
   */
  validateMcpServers?: boolean;
  
  /**
   * Custom model provider mapping
   */
  modelMapping?: Record<string, (config: any) => any>;
}

/**
 * Import an .af agent schema to Mastra format
 * 
 * @param afAgent - Parsed .af agent schema
 * @param options - Import options
 * @returns Import result with agent config and metadata
 * 
 * @example
 * ```typescript
 * const afData = parseAgentFile(jsonString);
 * const result = importAfAgent(afData);
 * 
 * if (result.warnings.length > 0) {
 *   console.log('Import warnings:', result.warnings);
 * }
 * 
 * const agent = new Agent(result.agent);
 * ```
 */
export function importAfAgent(
  afAgent: AfAgentSchema,
  options: AfImportOptions = {}
): AfImportResult {
  const {
    toolCodeStrategy = 'schema-only',
    includeMessages = true,
    validateMcpServers = false,
  } = options;

  const warnings: AfImportWarning[] = [];
  const lossyConversions: string[] = [];

  // Convert basic fields
  // Note: AgentConfig from Mastra uses DynamicArgument for many fields
  // For simplicity, we're converting to static values
  const agentConfig: Partial<AgentConfig> = {
    name: afAgent.name,
    description: afAgent.description,
    instructions: afAgent.system, // Static string, not DynamicArgument
  };

  // Convert model configuration
  if (afAgent.llm_config) {
    agentConfig.model = convertLLMConfig(afAgent.llm_config, options.modelMapping);
  }

  // Convert tools
  const toolResults = convertTools(afAgent.tools, {
    strategy: toolCodeStrategy,
    validateMcp: validateMcpServers,
  });
  
  agentConfig.tools = toolResults.tools;
  warnings.push(...toolResults.warnings);

  // Handle tool rules (not directly supported in Mastra)
  if (afAgent.tool_rules && afAgent.tool_rules.length > 0) {
    warnings.push({
      field: 'tool_rules',
      reason: 'Tool rules are not directly supported in Mastra. Consider implementing custom logic.',
      severity: 'warning',
    });
    lossyConversions.push('tool_rules');
  }

  // Convert memory
  const memoryConfig: MastraMemoryConfig = {};
  
  // Convert core memory to working memory
  if (afAgent.core_memory && afAgent.core_memory.length > 0) {
    memoryConfig.workingMemory = convertCoreMemory(afAgent.core_memory);
  }

  // Convert messages if requested
  if (includeMessages && afAgent.messages && afAgent.messages.length > 0) {
    memoryConfig.messages = convertMessages(afAgent.messages);
    
    // Handle in_context_message_indices
    if (afAgent.in_context_message_indices) {
      warnings.push({
        field: 'in_context_message_indices',
        reason: 'Context window management is automatic in Mastra',
        severity: 'info',
      });
    }
  }

  // Count tool types
  const toolsArray = Object.values(convertedTools);
  const mcpTools = toolsArray.filter(t => (t as any)._mcpMetadata?.type === 'mcp').length;
  const standardTools = toolsArray.length - mcpTools;

  return {
    agent: agentConfig,
    memory: memoryConfig,
    warnings,
    metadata: {
      originalVersion: afAgent.version,
      importedAt: new Date(),
      lossyConversions,
      mcpTools,
      standardTools,
    },
  };
}

/**
 * Convert LLM configuration
 */
function convertLLMConfig(
  llmConfig: any,
  customMapping?: Record<string, (config: any) => any>
): DynamicArgument<MastraLanguageModel> | undefined {
  const { provider, model, ...params } = llmConfig;

  // Use custom mapping if provided
  if (customMapping && customMapping[provider]) {
    return customMapping[provider](llmConfig);
  }

  // Default mapping - return as static value
  // In a real implementation, this would need to map to a proper MastraLanguageModel
  return {
    provider,
    name: model,
    ...params,
  } as any; // Type assertion needed as we don't have the full MastraLanguageModel interface
}

/**
 * Convert tools with support for MCP metadata
 */
function convertTools(
  tools: AfTool[],
  options: {
    strategy: 'skip' | 'stub' | 'schema-only';
    validateMcp: boolean;
  }
): { tools: ToolsInput; warnings: AfImportWarning[] } {
  const convertedTools: ToolsInput = {};
  const warnings: AfImportWarning[] = [];

  for (const tool of tools) {
    try {
      // Check for MCP metadata
      const mcpMetadata = tool.metadata?._mastra_tool as MastraToolMetadata | undefined;
      
      if (mcpMetadata) {
        // Handle MCP tool
        const mcpTool = convertMcpTool(tool, mcpMetadata);
        convertedTools[tool.name] = mcpTool;
      } else if (tool.source_code) {
        // Handle tool with source code
        const result = handleSourceCodeTool(tool, options.strategy);
        if (result.tool) {
          convertedTools[tool.name] = result.tool;
        }
        if (result.warning) {
          warnings.push(result.warning);
        }
      } else {
        // Standard schema-only tool
        convertedTools[tool.name] = convertSchemaOnlyTool(tool);
      }
    } catch (error) {
      warnings.push({
        field: `tools.${tool.name}`,
        reason: error instanceof Error ? error.message : 'Unknown conversion error',
        severity: 'error',
      });
    }
  }

  return { tools: convertedTools, warnings };
}

/**
 * Convert MCP tool
 */
function convertMcpTool(tool: AfTool, metadata: MastraToolMetadata): ToolAction<any, any, any> {
  // Create a ToolAction that follows Mastra's interface
  const mastraTool: ToolAction<any, any, any> = {
    id: tool.name,
    description: tool.description,
    inputSchema: createZodSchemaFromJsonSchema(tool.parameters),
    // execute function will be undefined for MCP tools
    // as they're handled by MCP servers
  } as ToolAction<any, any, any>;

  // Store MCP metadata in a way that can be used by Mastra
  // Note: The actual MCP integration would need to be handled by Mastra's MCP support
  (mastraTool as any)._mcpMetadata = {
    type: metadata.type,
    server: metadata.server,
    toolName: metadata.tool_name,
    transport: metadata.transport,
    authRef: metadata.auth_ref,
    endpoint: metadata.endpoint,
    method: metadata.method,
  };

  return mastraTool;
}

/**
 * Handle tool with source code based on strategy
 */
function handleSourceCodeTool(
  tool: AfTool,
  strategy: 'skip' | 'stub' | 'schema-only'
): { tool?: ToolAction<any, any, any>; warning?: AfImportWarning } {
  switch (strategy) {
    case 'skip':
      return {
        warning: {
          field: `tools.${tool.name}`,
          reason: `Tool with ${tool.type} source code skipped`,
          severity: 'info',
        },
      };

    case 'stub':
      return {
        tool: {
          id: tool.name,
          description: `${tool.description} (stub - source code not imported)`,
          inputSchema: createZodSchemaFromJsonSchema(tool.parameters),
          execute: async () => {
            throw new Error(`Tool ${tool.name} is a stub - source code was not imported`);
          },
        },
        warning: {
          field: `tools.${tool.name}`,
          reason: `Created stub for ${tool.type} tool`,
          severity: 'warning',
        },
      };

    case 'schema-only':
    default:
      return {
        tool: convertSchemaOnlyTool(tool),
        warning: {
          field: `tools.${tool.name}`,
          reason: `Tool imported without ${tool.type} source code`,
          severity: 'info',
        },
      };
  }
}

/**
 * Convert schema-only tool
 */
function convertSchemaOnlyTool(tool: AfTool): ToolAction<any, any, any> {
  return {
    id: tool.name,
    description: tool.description,
    inputSchema: createZodSchemaFromJsonSchema(tool.parameters),
    // No execute function for schema-only tools
  } as ToolAction<any, any, any>;
}

/**
 * Create Zod schema from JSON Schema
 * This is a simplified version - a full implementation would handle all JSON Schema features
 */
function createZodSchemaFromJsonSchema(jsonSchema: any): z.ZodType<any> {
  if (jsonSchema.type === 'object') {
    const shape: Record<string, z.ZodType<any>> = {};
    
    for (const [key, prop] of Object.entries(jsonSchema.properties || {})) {
      shape[key] = createZodSchemaFromProperty(prop as any);
    }
    
    let schema = z.object(shape);
    
    // Handle required fields
    if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
      // Mark non-required fields as optional
      for (const key of Object.keys(shape)) {
        if (!jsonSchema.required.includes(key)) {
          shape[key] = shape[key].optional();
        }
      }
      schema = z.object(shape);
    }
    
    return schema;
  }
  
  return z.any();
}

/**
 * Create Zod schema from JSON Schema property
 */
function createZodSchemaFromProperty(prop: any): z.ZodType<any> {
  switch (prop.type) {
    case 'string':
      let stringSchema = z.string();
      if (prop.enum) {
        return z.enum(prop.enum as [string, ...string[]]);
      }
      if (prop.description) {
        stringSchema = stringSchema.describe(prop.description);
      }
      return stringSchema;
      
    case 'number':
      return z.number();
      
    case 'boolean':
      return z.boolean();
      
    case 'array':
      if (prop.items) {
        return z.array(createZodSchemaFromProperty(prop.items));
      }
      return z.array(z.any());
      
    case 'object':
      return createZodSchemaFromJsonSchema(prop);
      
    default:
      return z.any();
  }
}

/**
 * Convert core memory blocks to working memory
 */
function convertCoreMemory(blocks: AfCoreMemoryBlock[]): Record<string, any> {
  const workingMemory: Record<string, any> = {};
  
  for (const block of blocks) {
    workingMemory[block.label] = {
      value: block.value,
      characterLimit: block.character_limit,
      metadata: block.metadata,
    };
  }
  
  return workingMemory;
}

/**
 * Convert messages to Mastra format
 */
function convertMessages(messages: AfMessage[]): MastraMemoryConfig['messages'] {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.text,
    metadata: {
      id: msg.id,
      timestamp: msg.timestamp,
      toolCalls: msg.tool_calls,
      toolResults: msg.tool_results,
      ...msg.metadata,
    },
  }));
}