/**
 * @fileoverview Export converter for Mastra Agent to .af (Agent File) format
 * 
 * This module handles the conversion of Mastra agents into .af format,
 * preserving MCP tools and other Mastra-specific features.
 * 
 * @module @mastra/portability-af-letta
 */

import type { 
  AgentConfig,
  ToolAction,
  ToolsInput,
  DynamicArgument,
} from '@mastra/core';
import type { 
  AfAgentSchema, 
  AfTool,
  AfCoreMemoryBlock,
  AfMessage,
  AfLLMConfig,
  MastraToolMetadata,
  AuthReference,
} from './types';
import type { MastraMemoryConfig } from './import';

/**
 * Export result with metadata
 */
export interface AfExportResult {
  content: string;
  metadata: {
    exportedAt: Date;
    mastraVersion?: string;
    omittedFeatures: string[];
    toolCount: number;
    messageCount: number;
  };
}

/**
 * Options for exporting agents
 */
export interface AfExportOptions {
  /**
   * Whether to pretty-print the JSON
   */
  pretty?: boolean;
  
  /**
   * Whether to include Mastra-specific metadata
   */
  includeMastraMetadata?: boolean;
  
  /**
   * Custom version string for the .af file
   */
  version?: string;
  
  /**
   * Whether to include message history
   */
  includeMessages?: boolean;
  
  /**
   * Maximum messages to include (most recent)
   */
  maxMessages?: number;
  
  /**
   * Agent type identifier
   */
  agentType?: string;
}

/**
 * Export a Mastra agent to .af format
 * 
 * @param agent - Mastra agent configuration
 * @param memory - Optional memory configuration
 * @param options - Export options
 * @returns Export result with .af JSON content
 * 
 * @example
 * ```typescript
 * const result = exportMastraAgent(agent, memory, {
 *   pretty: true,
 *   includeMessages: true
 * });
 * 
 * await fs.writeFile('agent.af', result.content);
 * console.log('Exported:', result.metadata);
 * ```
 */
export function exportMastraAgent(
  agent: AgentConfig,
  memory?: MastraMemoryConfig,
  options: AfExportOptions = {}
): AfExportResult {
  const {
    pretty = true,
    includeMastraMetadata = true,
    version = '0.1.0',
    includeMessages = true,
    maxMessages = 1000,
    agentType = 'mastra',
  } = options;

  const now = new Date().toISOString();
  const omittedFeatures: string[] = [];

  // Extract metadata
  const afMetadata = agent.metadata?.afMetadata as any;
  
  // Build core agent structure
  const afAgent: AfAgentSchema = {
    agent_type: afMetadata?.agentType || agentType,
    name: agent.name,
    description: afMetadata?.description || `Mastra agent: ${agent.name}`,
    // Handle DynamicArgument<string> for instructions
    system: typeof agent.instructions === 'string' 
      ? agent.instructions 
      : typeof agent.instructions === 'function'
      ? 'Dynamic instructions (function - see metadata)'
      : 'Dynamic instructions (see metadata)',
    // Handle DynamicArgument<MastraLanguageModel> for model
    llm_config: agent.model ? convertModelToLLMConfig(agent.model) : undefined,
    embedding_config: undefined, // TODO: Add if Mastra adds embedding config
    core_memory: [],
    messages: [],
    tools: [],
    version,
    created_at: afMetadata?.createdAt || now,
    updated_at: now,
  };

  // Add dynamic instructions note if needed
  if (typeof agent.instructions === 'function') {
    afAgent.metadata_ = {
      ...afAgent.metadata_,
      mastra_dynamic_instructions: true,
    };
    omittedFeatures.push('dynamic_instructions');
  }

  // Convert tools - handle DynamicArgument<ToolsInput>
  if (agent.tools) {
    const tools = typeof agent.tools === 'function' ? {} : agent.tools;
    if (typeof agent.tools === 'function') {
      omittedFeatures.push('dynamic_tools');
    }
    afAgent.tools = Object.entries(tools).map(([name, tool]) => 
      convertMastraToolToAf(name, tool)
    );
  }

  // Convert memory
  if (memory) {
    // Convert working memory to core memory
    if (memory.workingMemory) {
      afAgent.core_memory = convertWorkingMemoryToCore(memory.workingMemory);
    }

    // Convert messages
    if (includeMessages && memory.messages) {
      const messages = memory.messages.slice(-maxMessages);
      afAgent.messages = messages.map((msg, index) => 
        convertMastraMessageToAf(msg, index)
      );
    }
  }

  // Add Mastra metadata if requested
  if (includeMastraMetadata) {
    afAgent.metadata_ = {
      ...afAgent.metadata_,
      mastra_export: {
        version: process.env.MASTRA_VERSION || 'unknown',
        exportedAt: now,
        features: {
          dynamicInstructions: typeof agent.instructions === 'function',
          mcpTools: afAgent.tools.some(t => t.metadata?._mastra_tool),
        },
      },
    };
  }

  // Add tags from metadata
  if (afMetadata?.tags) {
    afAgent.tags = afMetadata.tags;
  }

  // Preserve other metadata
  if (agent.metadata) {
    const { afMetadata: _, ...otherMetadata } = agent.metadata;
    if (Object.keys(otherMetadata).length > 0) {
      afAgent.metadata_ = {
        ...afAgent.metadata_,
        ...otherMetadata,
      };
    }
  }

  // Generate JSON
  const content = pretty 
    ? JSON.stringify(afAgent, null, 2)
    : JSON.stringify(afAgent);

  return {
    content,
    metadata: {
      exportedAt: new Date(),
      mastraVersion: process.env.MASTRA_VERSION,
      omittedFeatures,
      toolCount: afAgent.tools.length,
      messageCount: afAgent.messages.length,
    },
  };
}

/**
 * Convert Mastra model config to .af LLM config
 */
function convertModelToLLMConfig(model: DynamicArgument<any>): AfLLMConfig | undefined {
  // Handle DynamicArgument - resolve if it's a function
  const resolvedModel = typeof model === 'function' ? undefined : model;
  
  if (!resolvedModel) {
    // Default config if none provided or it's a function
    return {
      provider: 'openai',
      model: 'gpt-4',
      _dynamic: typeof model === 'function' ? true : undefined,
    };
  }

  const { provider, name, ...params } = resolvedModel;
  
  return {
    provider: provider || 'unknown',
    model: name || 'unknown',
    ...params,
  };
}

/**
 * Convert Mastra tool to .af format
 */
function convertMastraToolToAf(name: string, tool: ToolAction<any, any, any>): AfTool {
  const afTool: AfTool = {
    name: name, // Use the name from the tools object key
    description: tool.description || '',
    type: 'json_schema', // Default to json_schema for compatibility
    parameters: tool.inputSchema ? convertZodToJsonSchema(tool.inputSchema) : { type: 'object', properties: {} },
  };

  // Check for MCP metadata that was added during import
  const mcpMetadata = (tool as any)._mcpMetadata;
  if (mcpMetadata) {
    afTool.metadata = {
      _mastra_tool: mcpMetadata,
    };
  }

  return afTool;
}

/**
 * Convert Zod schema to JSON Schema
 * This is a simplified version - a full implementation would handle all Zod types
 */
function convertZodToJsonSchema(zodSchema: any): any {
  // If it's already a plain object (not Zod), return as-is
  if (!zodSchema || !zodSchema._def) {
    return {
      type: 'object',
      properties: {},
    };
  }

  const def = zodSchema._def;
  
  // Handle different Zod types
  switch (def.typeName) {
    case 'ZodObject':
      const properties: Record<string, any> = {};
      const required: string[] = [];
      
      for (const [key, value] of Object.entries(def.shape() || {})) {
        properties[key] = convertZodToJsonSchema(value);
        // Check if required (not optional)
        if (!(value as any)._def.typeName?.includes('Optional')) {
          required.push(key);
        }
      }
      
      return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
      };
      
    case 'ZodString':
      return { type: 'string' };
      
    case 'ZodNumber':
      return { type: 'number' };
      
    case 'ZodBoolean':
      return { type: 'boolean' };
      
    case 'ZodArray':
      return {
        type: 'array',
        items: convertZodToJsonSchema(def.type),
      };
      
    case 'ZodEnum':
      return {
        type: 'string',
        enum: def.values,
      };
      
    case 'ZodOptional':
      return convertZodToJsonSchema(def.innerType);
      
    default:
      // Fallback for unknown types
      return { type: 'string' };
  }
}

/**
 * Convert working memory to core memory blocks
 */
function convertWorkingMemoryToCore(
  workingMemory: Record<string, any>
): AfCoreMemoryBlock[] {
  const blocks: AfCoreMemoryBlock[] = [];
  
  for (const [label, data] of Object.entries(workingMemory)) {
    if (typeof data === 'object' && data.value) {
      // Structured working memory entry
      blocks.push({
        label,
        value: String(data.value),
        character_limit: data.characterLimit,
        metadata: data.metadata,
      });
    } else {
      // Simple key-value
      blocks.push({
        label,
        value: String(data),
      });
    }
  }
  
  return blocks;
}

/**
 * Convert Mastra message to .af format
 */
function convertMastraMessageToAf(
  message: NonNullable<MastraMemoryConfig['messages']>[0],
  index: number
): AfMessage {
  const metadata = message.metadata || {};
  
  return {
    id: metadata.id as string || `msg_${index}`,
    role: message.role,
    text: message.content,
    timestamp: metadata.timestamp as string || new Date().toISOString(),
    tool_calls: metadata.toolCalls as any,
    tool_results: metadata.toolResults as any,
    metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
  };
}

/**
 * Quick export function for simple use cases
 * 
 * @param agent - Mastra agent to export
 * @param outputPath - Optional path to write the file
 * @returns The .af content as a string
 */
export async function quickExportAgent(
  agent: AgentConfig,
  outputPath?: string
): Promise<string> {
  const result = exportMastraAgent(agent, undefined, {
    pretty: true,
    includeMessages: false,
  });

  if (outputPath) {
    // In a real implementation, this would use fs.promises.writeFile
    console.log(`Would write to: ${outputPath}`);
  }

  return result.content;
}