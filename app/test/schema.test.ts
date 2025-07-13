/**
 * @fileoverview Tests for the agent file schema validation
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
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
  isValidAfSchema,
  parseAfSchema,
  safeParseAfSchema,
} from '../src/schema';

describe('llmConfigSchema', () => {
  it('should validate a complete LLM config', () => {
    const config = {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.3,
    };
    
    expect(() => llmConfigSchema.parse(config)).not.toThrow();
  });

  it('should require provider and model', () => {
    expect(() => llmConfigSchema.parse({})).toThrow();
    expect(() => llmConfigSchema.parse({ provider: 'openai' })).toThrow();
    expect(() => llmConfigSchema.parse({ model: 'gpt-4' })).toThrow();
  });

  it('should validate temperature range', () => {
    const validTemp = { provider: 'openai', model: 'gpt-4', temperature: 1.5 };
    expect(() => llmConfigSchema.parse(validTemp)).not.toThrow();
    
    const invalidTemp = { provider: 'openai', model: 'gpt-4', temperature: 3 };
    expect(() => llmConfigSchema.parse(invalidTemp)).toThrow(/must be <= 2/);
  });

  it('should allow provider-specific fields', () => {
    const config = {
      provider: 'custom',
      model: 'custom-model',
      custom_field: 'custom_value',
      nested: { field: 'value' },
    };
    
    const parsed = llmConfigSchema.parse(config);
    expect(parsed.custom_field).toBe('custom_value');
    expect(parsed.nested).toEqual({ field: 'value' });
  });
});

describe('coreMemoryBlockSchema', () => {
  it('should validate a complete memory block', () => {
    const block = {
      label: 'personality',
      value: 'I am helpful and friendly.',
      character_limit: 500,
      metadata: { category: 'personality' },
    };
    
    expect(() => coreMemoryBlockSchema.parse(block)).not.toThrow();
  });

  it('should require label and value', () => {
    expect(() => coreMemoryBlockSchema.parse({})).toThrow();
    expect(() => coreMemoryBlockSchema.parse({ label: 'test' })).toThrow();
    expect(() => coreMemoryBlockSchema.parse({ value: 'test' })).toThrow();
  });

  it('should validate character limit', () => {
    const invalid = {
      label: 'test',
      value: 'test',
      character_limit: -100,
    };
    
    expect(() => coreMemoryBlockSchema.parse(invalid)).toThrow(/must be positive/);
  });
});

describe('messageSchema', () => {
  it('should validate a complete message', () => {
    const message = {
      id: 'msg_123',
      role: 'assistant',
      text: 'Hello, how can I help?',
      timestamp: '2024-01-01T00:00:00Z',
      tool_calls: [
        {
          id: 'call_123',
          name: 'get_weather',
          arguments: { location: 'NYC' },
        },
      ],
      metadata: { source: 'test' },
    };
    
    expect(() => messageSchema.parse(message)).not.toThrow();
  });

  it('should validate role enum', () => {
    const invalidRole = {
      id: 'msg_123',
      role: 'invalid_role',
      text: 'Hello',
      timestamp: '2024-01-01T00:00:00Z',
    };
    
    expect(() => messageSchema.parse(invalidRole)).toThrow(/must be one of/);
  });

  it('should validate timestamp format', () => {
    const invalidTimestamp = {
      id: 'msg_123',
      role: 'user',
      text: 'Hello',
      timestamp: '2024-01-01 00:00:00', // Invalid format
    };
    
    expect(() => messageSchema.parse(invalidTimestamp)).toThrow(/ISO 8601 format/);
  });
});

describe('toolSchema', () => {
  it('should validate a JSON schema tool', () => {
    const tool = {
      name: 'get_weather',
      description: 'Get weather information',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'City name',
          },
        },
        required: ['location'],
      },
    };
    
    expect(() => toolSchema.parse(tool)).not.toThrow();
  });

  it('should validate a Python tool with source code', () => {
    const tool = {
      name: 'calculate',
      description: 'Perform calculations',
      type: 'python',
      parameters: {
        type: 'object',
        properties: {},
      },
      source_code: 'def calculate(x): return x * 2',
    };
    
    expect(() => toolSchema.parse(tool)).not.toThrow();
  });

  it('should require source code for Python tools', () => {
    const tool = {
      name: 'calculate',
      description: 'Perform calculations',
      type: 'python',
      parameters: {
        type: 'object',
        properties: {},
      },
      // Missing source_code
    };
    
    expect(() => toolSchema.parse(tool)).toThrow(/Source code is required/);
  });

  it('should validate nested parameter schemas', () => {
    const tool = {
      name: 'complex_tool',
      description: 'Complex tool',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {
          nested: {
            type: 'object',
            properties: {
              array_field: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['a', 'b', 'c'],
                },
              },
            },
          },
        },
      },
    };
    
    expect(() => toolSchema.parse(tool)).not.toThrow();
  });
});

describe('toolRuleSchema', () => {
  it('should validate tool rules', () => {
    const rules = [
      {
        tool_name: 'calculate',
        rule_type: 'max_use',
        configuration: { max_uses: 10 },
      },
      {
        tool_name: 'api_call',
        rule_type: 'require_approval',
        configuration: { message: 'This will make an API call' },
      },
      {
        tool_name: 'save_file',
        rule_type: 'dependency',
        configuration: { requires: ['get_permission'] },
      },
    ];
    
    rules.forEach(rule => {
      expect(() => toolRuleSchema.parse(rule)).not.toThrow();
    });
  });
});

describe('afAgentSchema', () => {
  const validAgent = {
    agent_type: 'letta',
    name: 'Test Agent',
    system: 'You are a helpful assistant.',
    llm_config: {
      provider: 'openai',
      model: 'gpt-4',
    },
    core_memory: [],
    messages: [],
    tools: [],
    version: '0.1.0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  it('should validate a minimal agent', () => {
    expect(() => afAgentSchema.parse(validAgent)).not.toThrow();
  });

  it('should validate a complete agent', () => {
    const completeAgent = {
      ...validAgent,
      description: 'A test agent',
      embedding_config: {
        provider: 'openai',
        model: 'text-embedding-3-small',
      },
      core_memory: [
        {
          label: 'personality',
          value: 'Helpful and friendly',
        },
      ],
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          text: 'Hello',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
      in_context_message_indices: [0],
      tools: [
        {
          name: 'test_tool',
          description: 'Test',
          type: 'json_schema',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      ],
      tool_rules: [
        {
          tool_name: 'test_tool',
          rule_type: 'max_use',
          configuration: { max: 5 },
        },
      ],
      tool_exec_environment_variables: {
        API_KEY: 'test_key',
      },
      tags: ['test', 'demo'],
      metadata_: {
        custom: 'value',
      },
    };
    
    expect(() => afAgentSchema.parse(completeAgent)).not.toThrow();
  });

  it('should validate message index references', () => {
    const invalidIndices = {
      ...validAgent,
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          text: 'Hello',
          timestamp: '2024-01-01T00:00:00Z',
        },
      ],
      in_context_message_indices: [0, 1], // Index 1 doesn't exist
    };
    
    expect(() => afAgentSchema.parse(invalidIndices)).toThrow(/out-of-range/);
  });

  it('should validate tool rule references', () => {
    const invalidRules = {
      ...validAgent,
      tools: [
        {
          name: 'tool_a',
          description: 'Tool A',
          type: 'json_schema',
          parameters: { type: 'object', properties: {} },
        },
      ],
      tool_rules: [
        {
          tool_name: 'tool_b', // Doesn't exist
          rule_type: 'max_use',
          configuration: { max: 5 },
        },
      ],
    };
    
    expect(() => afAgentSchema.parse(invalidRules)).toThrow(/non-existent tools/);
  });
});

describe('Type guards and helpers', () => {
  it('isValidAfSchema should work correctly', () => {
    const valid = {
      agent_type: 'letta',
      name: 'Test',
      system: 'Test system',
      llm_config: { provider: 'openai', model: 'gpt-4' },
      core_memory: [],
      messages: [],
      tools: [],
      version: '0.1.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    expect(isValidAfSchema(valid)).toBe(true);
    expect(isValidAfSchema({})).toBe(false);
    expect(isValidAfSchema(null)).toBe(false);
  });

  it('parseAfSchema should provide enhanced errors', () => {
    const invalid = { name: 'Test' };
    
    try {
      parseAfSchema(invalid);
      expect.fail('Should have thrown');
    } catch (error: any) {
      expect(error.message).toContain('validation failed');
      expect(error.validationErrors).toBeDefined();
      expect(error.validationErrors.length).toBeGreaterThan(0);
      expect(error.validationErrors[0]).toHaveProperty('path');
      expect(error.validationErrors[0]).toHaveProperty('message');
    }
  });

  it('safeParseAfSchema should return result object', () => {
    const valid = {
      agent_type: 'letta',
      name: 'Test',
      system: 'Test system',
      llm_config: { provider: 'openai', model: 'gpt-4' },
      core_memory: [],
      messages: [],
      tools: [],
      version: '0.1.0',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };
    
    const validResult = safeParseAfSchema(valid);
    expect(validResult.success).toBe(true);
    if (validResult.success) {
      expect(validResult.data.name).toBe('Test');
    }
    
    const invalidResult = safeParseAfSchema({});
    expect(invalidResult.success).toBe(false);
    if (!invalidResult.success) {
      expect(invalidResult.error).toBeInstanceOf(z.ZodError);
    }
  });
});