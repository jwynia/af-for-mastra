/**
 * @fileoverview Main entry point for @mastra/portability-af-letta
 * 
 * This package provides support for importing and exporting agents in
 * Letta's .af (Agent File) format, enabling portability between Letta
 * and Mastra frameworks.
 * 
 * @example
 * ```typescript
 * import { parseAgentFile, afAgentSchema } from '@mastra/portability-af-letta';
 * 
 * // Parse an agent file
 * const agentData = await fs.readFile('./agent.af', 'utf-8');
 * const agent = parseAgentFile(agentData);
 * 
 * // Validate agent data
 * const result = afAgentSchema.safeParse(someData);
 * if (result.success) {
 *   console.log('Valid agent:', result.data.name);
 * }
 * ```
 * 
 * @module @mastra/portability-af-letta
 */

// Export all types
export * from './types';

// Export schemas
export {
  afAgentSchema,
  llmConfigSchema,
  embeddingConfigSchema,
  coreMemoryBlockSchema,
  messageSchema,
  toolSchema,
  toolRuleSchema,
  toolCallSchema,
  toolResultSchema,
  toolParametersSchema,
  authReferenceSchema,
  mastraToolMetadataSchema,
  isValidAfSchema,
  parseAfSchema,
  safeParseAfSchema,
} from './schema';

// Export parser functions
export {
  parseAgentFile,
  safeParseAgentFile,
  parseAgentFileObject,
  isValidAgentFile,
  getValidationErrors,
  extractAgentMetadata,
  AgentFileParseError,
  type ParseResult,
  type ParseOptions,
} from './parser';

// TODO: Mastra integration will be enabled in a future version
// when the correct Mastra.ai interfaces are available

// Version of the .af format this package supports
export const SUPPORTED_AF_VERSION = '0.1.0';

// Package metadata
export const PACKAGE_NAME = 'mastra-af-letta';
export const PACKAGE_VERSION = '0.1.0'; // This should match package.json