/**
 * @fileoverview Tests for the agent file parser
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseAgentFile,
  safeParseAgentFile,
  parseAgentFileObject,
  isValidAgentFile,
  getValidationErrors,
  extractAgentMetadata,
  AgentFileParseError,
} from '../src/parser';

// Load test fixtures
const validAgentJson = readFileSync(
  join(__dirname, 'fixtures', 'valid-agent.af.json'),
  'utf-8'
);
const validAgent = JSON.parse(validAgentJson);

describe('parseAgentFile', () => {
  it('should parse a valid agent file', () => {
    const agent = parseAgentFile(validAgentJson);
    expect(agent.name).toBe('Test Assistant');
    expect(agent.agent_type).toBe('letta');
    expect(agent.messages).toHaveLength(4);
    expect(agent.tools).toHaveLength(2);
  });

  it('should throw on invalid JSON', () => {
    expect(() => parseAgentFile('{ invalid json')).toThrowError(
      AgentFileParseError
    );
  });

  it('should throw on missing required fields', () => {
    const invalid = JSON.stringify({ name: 'Test' });
    expect(() => parseAgentFile(invalid)).toThrowError(AgentFileParseError);
  });

  it('should apply auto-fixes for missing timestamps', () => {
    const missingTimestamps = {
      ...validAgent,
      created_at: undefined,
      updated_at: undefined,
    };
    const agent = parseAgentFile(JSON.stringify(missingTimestamps));
    expect(agent.created_at).toBeDefined();
    expect(agent.updated_at).toBeDefined();
  });

  it('should respect maxSize option', () => {
    const largeAgent = {
      ...validAgent,
      messages: Array(10000).fill(validAgent.messages[0]),
    };
    const largeJson = JSON.stringify(largeAgent);
    
    expect(() => 
      parseAgentFile(largeJson, { maxSize: 100 })
    ).toThrowError(/too large/);
  });

  it('should validate tool source code requirements', () => {
    const invalidTool = {
      ...validAgent,
      tools: [
        {
          name: 'python_tool',
          description: 'A Python tool',
          type: 'python',
          parameters: { type: 'object', properties: {} },
          // Missing source_code for python type
        },
      ],
    };
    
    expect(() => 
      parseAgentFile(JSON.stringify(invalidTool))
    ).toThrowError(AgentFileParseError);
  });

  it('should validate in_context_message_indices', () => {
    const invalidIndices = {
      ...validAgent,
      in_context_message_indices: [0, 1, 99], // 99 is out of range
    };
    
    expect(() => 
      parseAgentFile(JSON.stringify(invalidIndices))
    ).toThrowError(/out-of-range/);
  });

  it('should validate tool_rules reference existing tools', () => {
    const invalidRules = {
      ...validAgent,
      tool_rules: [
        {
          tool_name: 'non_existent_tool',
          rule_type: 'max_use',
          configuration: { max_uses: 5 },
        },
      ],
    };
    
    expect(() => 
      parseAgentFile(JSON.stringify(invalidRules))
    ).toThrowError(/non-existent tools/);
  });
});

describe('safeParseAgentFile', () => {
  it('should return success for valid agent file', () => {
    const result = safeParseAgentFile(validAgentJson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Test Assistant');
    }
  });

  it('should return error for invalid JSON', () => {
    const result = safeParseAgentFile('{ invalid json');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(AgentFileParseError);
      expect(result.error.message).toContain('Invalid JSON');
    }
  });

  it('should return error with validation details', () => {
    const invalid = JSON.stringify({ name: 'Test' });
    const result = safeParseAgentFile(invalid);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.validationErrors).toBeDefined();
      expect(result.error.validationErrors!.length).toBeGreaterThan(0);
    }
  });
});

describe('parseAgentFileObject', () => {
  it('should parse a valid agent object', () => {
    const agent = parseAgentFileObject(validAgent);
    expect(agent.name).toBe('Test Assistant');
  });

  it('should apply auto-fixes', () => {
    const missingVersion = { ...validAgent, version: undefined };
    const agent = parseAgentFileObject(missingVersion);
    expect(agent.version).toBe('0.1.0');
  });

  it('should handle arrays initialization', () => {
    const missingArrays = {
      ...validAgent,
      core_memory: undefined,
      messages: undefined,
      tools: undefined,
    };
    const agent = parseAgentFileObject(missingArrays);
    expect(agent.core_memory).toEqual([]);
    expect(agent.messages).toEqual([]);
    expect(agent.tools).toEqual([]);
  });
});

describe('isValidAgentFile', () => {
  it('should return true for valid agent file', () => {
    expect(isValidAgentFile(validAgentJson)).toBe(true);
  });

  it('should return false for invalid JSON', () => {
    expect(isValidAgentFile('{ invalid json')).toBe(false);
  });

  it('should return false for invalid schema', () => {
    expect(isValidAgentFile(JSON.stringify({ name: 'Test' }))).toBe(false);
  });
});

describe('getValidationErrors', () => {
  it('should return null for valid agent file', () => {
    const errors = getValidationErrors(validAgentJson);
    expect(errors).toBeNull();
  });

  it('should return JSON parse error', () => {
    const errors = getValidationErrors('{ invalid json');
    expect(errors).toBeDefined();
    expect(errors![0].message).toContain('Unexpected token');
  });

  it('should return schema validation errors', () => {
    const invalid = {
      name: 'Test',
      // Missing required fields
    };
    const errors = getValidationErrors(JSON.stringify(invalid));
    expect(errors).toBeDefined();
    expect(errors!.length).toBeGreaterThan(0);
    expect(errors!.some(e => e.path.includes('system'))).toBe(true);
  });

  it('should return detailed path information', () => {
    const invalid = {
      ...validAgent,
      llm_config: {
        // Missing required provider and model
        temperature: 0.7,
      },
    };
    const errors = getValidationErrors(JSON.stringify(invalid));
    expect(errors).toBeDefined();
    expect(errors!.some(e => e.path === 'llm_config.provider')).toBe(true);
    expect(errors!.some(e => e.path === 'llm_config.model')).toBe(true);
  });
});

describe('extractAgentMetadata', () => {
  it('should extract metadata from valid agent file', () => {
    const metadata = extractAgentMetadata(validAgentJson);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('Test Assistant');
    expect(metadata!.description).toBe('A test agent for validating the parser');
    expect(metadata!.version).toBe('0.1.0');
    expect(metadata!.agent_type).toBe('letta');
    expect(metadata!.tags).toEqual(['demo', 'weather', 'math']);
  });

  it('should return null for invalid JSON', () => {
    const metadata = extractAgentMetadata('{ invalid json');
    expect(metadata).toBeNull();
  });

  it('should handle missing fields gracefully', () => {
    const minimal = JSON.stringify({ name: 'Test' });
    const metadata = extractAgentMetadata(minimal);
    expect(metadata).toBeDefined();
    expect(metadata!.name).toBe('Test');
    expect(metadata!.description).toBeUndefined();
    expect(metadata!.tags).toBeUndefined();
  });

  it('should return null for non-object data', () => {
    expect(extractAgentMetadata('"string"')).toBeNull();
    expect(extractAgentMetadata('123')).toBeNull();
    expect(extractAgentMetadata('null')).toBeNull();
  });
});

describe('Auto-fix functionality', () => {
  it('should fix missing message timestamps', () => {
    const missingTimestamps = {
      ...validAgent,
      messages: validAgent.messages.map((msg: any) => ({
        ...msg,
        timestamp: undefined,
      })),
    };
    
    const agent = parseAgentFile(JSON.stringify(missingTimestamps));
    agent.messages.forEach((msg) => {
      expect(msg.timestamp).toBeDefined();
      expect(() => new Date(msg.timestamp)).not.toThrow();
    });
  });

  it('should fix tool parameter structure', () => {
    const invalidToolParams = {
      ...validAgent,
      tools: [
        {
          name: 'test_tool',
          description: 'Test',
          type: 'json_schema',
          parameters: {
            // Missing type and properties
          },
        },
      ],
    };
    
    const agent = parseAgentFile(JSON.stringify(invalidToolParams));
    expect(agent.tools[0].parameters.type).toBe('object');
    expect(agent.tools[0].parameters.properties).toBeDefined();
  });

  it('should preserve existing valid data during auto-fix', () => {
    const partiallyValid = {
      ...validAgent,
      version: undefined, // This will be fixed
      name: 'Keep This Name', // This should be preserved
    };
    
    const agent = parseAgentFile(JSON.stringify(partiallyValid));
    expect(agent.version).toBe('0.1.0'); // Fixed
    expect(agent.name).toBe('Keep This Name'); // Preserved
  });
});