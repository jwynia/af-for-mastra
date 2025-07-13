/**
 * @fileoverview Parser for Letta .af (Agent File) format
 * 
 * Provides functions to parse .af files from various sources with
 * comprehensive error handling and validation.
 * 
 * @module @mastra/portability-af-letta
 */

import { z } from 'zod';
import { afAgentSchema, parseAfSchema, safeParseAfSchema } from './schema';
import type { AfAgentSchema } from './types';

/**
 * Custom error class for agent file parsing errors
 */
export class AgentFileParseError extends Error {
  /**
   * Validation errors if the parsing failed due to schema validation
   */
  public readonly validationErrors?: Array<{
    path: string;
    message: string;
    code: string;
  }>;

  /**
   * Original error that caused the parsing failure
   */
  public readonly cause?: Error;

  constructor(message: string, options?: { cause?: Error; validationErrors?: any[] }) {
    super(message);
    this.name = 'AgentFileParseError';
    this.cause = options?.cause;
    this.validationErrors = options?.validationErrors;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AgentFileParseError.prototype);
  }
}

/**
 * Result type for parsing operations
 */
export type ParseResult<T> = 
  | { success: true; data: T }
  | { success: false; error: AgentFileParseError };

/**
 * Options for parsing agent files
 */
export interface ParseOptions {
  /**
   * Whether to validate strictly (fail on unknown fields)
   * @default false
   */
  strict?: boolean;

  /**
   * Whether to attempt to fix common issues
   * @default true
   */
  autoFix?: boolean;

  /**
   * Maximum file size in bytes (default: 50MB)
   * @default 52428800
   */
  maxSize?: number;
}

/**
 * Parse a JSON string containing an agent file
 * 
 * @param jsonString - JSON string to parse
 * @param options - Parsing options
 * @returns Parsed and validated agent schema
 * @throws {AgentFileParseError} If parsing or validation fails
 * 
 * @example
 * ```typescript
 * const agentData = await fs.readFile('./agent.af', 'utf-8');
 * const agent = parseAgentFile(agentData);
 * console.log(`Loaded agent: ${agent.name}`);
 * ```
 */
export function parseAgentFile(
  jsonString: string,
  options: ParseOptions = {}
): AfAgentSchema {
  const { maxSize = 52428800, autoFix = true } = options;

  // Check file size
  const byteSize = new TextEncoder().encode(jsonString).length;
  if (byteSize > maxSize) {
    throw new AgentFileParseError(
      `Agent file too large: ${byteSize} bytes (max: ${maxSize} bytes)`
    );
  }

  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch (error) {
    throw new AgentFileParseError('Invalid JSON format', {
      cause: error as Error,
    });
  }

  // Apply auto-fixes if enabled
  if (autoFix) {
    data = applyAutoFixes(data);
  }

  // Validate schema
  try {
    return parseAfSchema(data);
  } catch (error) {
    if (error instanceof Error && 'validationErrors' in error) {
      throw new AgentFileParseError('Schema validation failed', {
        validationErrors: (error as any).validationErrors,
        cause: error,
      });
    }
    throw new AgentFileParseError('Unexpected validation error', {
      cause: error as Error,
    });
  }
}

/**
 * Safely parse an agent file with a result object
 * 
 * This function never throws, returning a result object instead.
 * 
 * @param jsonString - JSON string to parse
 * @param options - Parsing options
 * @returns Result object with either parsed data or error
 * 
 * @example
 * ```typescript
 * const result = safeParseAgentFile(jsonString);
 * if (result.success) {
 *   console.log(`Agent: ${result.data.name}`);
 * } else {
 *   console.error(`Parse failed: ${result.error.message}`);
 * }
 * ```
 */
export function safeParseAgentFile(
  jsonString: string,
  options: ParseOptions = {}
): ParseResult<AfAgentSchema> {
  try {
    const data = parseAgentFile(jsonString, options);
    return { success: true, data };
  } catch (error) {
    if (error instanceof AgentFileParseError) {
      return { success: false, error };
    }
    return {
      success: false,
      error: new AgentFileParseError('Unknown parsing error', {
        cause: error as Error,
      }),
    };
  }
}

/**
 * Parse an agent file from a plain object
 * 
 * Useful when the JSON has already been parsed.
 * 
 * @param data - Object to validate
 * @param options - Parsing options
 * @returns Validated agent schema
 * @throws {AgentFileParseError} If validation fails
 */
export function parseAgentFileObject(
  data: unknown,
  options: ParseOptions = {}
): AfAgentSchema {
  const { autoFix = true } = options;

  // Apply auto-fixes if enabled
  if (autoFix) {
    data = applyAutoFixes(data);
  }

  // Validate schema
  try {
    return parseAfSchema(data);
  } catch (error) {
    if (error instanceof Error && 'validationErrors' in error) {
      throw new AgentFileParseError('Schema validation failed', {
        validationErrors: (error as any).validationErrors,
        cause: error,
      });
    }
    throw new AgentFileParseError('Unexpected validation error', {
      cause: error as Error,
    });
  }
}

/**
 * Validate an agent file without fully parsing it
 * 
 * Useful for quick validation checks.
 * 
 * @param jsonString - JSON string to validate
 * @returns True if valid, false otherwise
 */
export function isValidAgentFile(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    return safeParseAfSchema(data).success;
  } catch {
    return false;
  }
}

/**
 * Get detailed validation errors for an agent file
 * 
 * @param jsonString - JSON string to validate
 * @returns Array of validation errors, or null if valid
 */
export function getValidationErrors(
  jsonString: string
): Array<{ path: string; message: string }> | null {
  try {
    const data = JSON.parse(jsonString);
    const result = safeParseAfSchema(data);
    
    if (result.success) {
      return null;
    }

    return result.error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
  } catch (error) {
    return [
      {
        path: '',
        message: error instanceof Error ? error.message : 'Invalid JSON',
      },
    ];
  }
}

/**
 * Apply automatic fixes for common issues
 * 
 * @param data - Data to fix
 * @returns Fixed data
 */
function applyAutoFixes(data: unknown): unknown {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const fixed = { ...data } as any;

  // Fix missing timestamps by using current time
  const now = new Date().toISOString();
  if (!fixed.created_at) {
    fixed.created_at = now;
  }
  if (!fixed.updated_at) {
    fixed.updated_at = now;
  }

  // Fix missing version
  if (!fixed.version) {
    fixed.version = '0.1.0';
  }

  // Ensure arrays exist
  if (!Array.isArray(fixed.core_memory)) {
    fixed.core_memory = [];
  }
  if (!Array.isArray(fixed.messages)) {
    fixed.messages = [];
  }
  if (!Array.isArray(fixed.tools)) {
    fixed.tools = [];
  }

  // Fix message timestamps
  if (Array.isArray(fixed.messages)) {
    fixed.messages = fixed.messages.map((msg: any, index: number) => {
      if (!msg.timestamp) {
        // Generate timestamp based on position
        const msgTime = new Date(now);
        msgTime.setMinutes(msgTime.getMinutes() - (fixed.messages.length - index));
        return { ...msg, timestamp: msgTime.toISOString() };
      }
      return msg;
    });
  }

  // Ensure tool parameters have correct structure
  if (Array.isArray(fixed.tools)) {
    fixed.tools = fixed.tools.map((tool: any) => {
      if (tool.parameters && typeof tool.parameters === 'object') {
        if (!tool.parameters.type) {
          tool.parameters.type = 'object';
        }
        if (!tool.parameters.properties) {
          tool.parameters.properties = {};
        }
      }
      return tool;
    });
  }

  return fixed;
}

/**
 * Extract metadata from an agent file without full validation
 * 
 * Useful for quick previews or listing agents.
 * 
 * @param jsonString - JSON string to extract from
 * @returns Basic agent metadata
 */
export function extractAgentMetadata(jsonString: string): {
  name?: string;
  description?: string;
  version?: string;
  agent_type?: string;
  created_at?: string;
  tags?: string[];
} | null {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return null;
    }

    return {
      name: data.name,
      description: data.description,
      version: data.version,
      agent_type: data.agent_type,
      created_at: data.created_at,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
    };
  } catch {
    return null;
  }
}