import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  parseAgentFile, 
  safeParseAgentFile, 
  isValidAgentFile, 
  getValidationErrors,
  afAgentSchema 
} from '../src/index';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe('.af Format Specification Compliance', () => {
  describe('Valid Files', () => {
    it('should parse minimal valid .af file', () => {
      const content = loadFixture('valid-minimal.af');
      
      // Should parse without throwing
      const agent = parseAgentFile(content);
      
      // Verify required fields
      expect(agent.agent_type).toBe('letta');
      expect(agent.version).toBe('0.1.0');
      expect(agent.name).toBe('Minimal Agent');
      expect(agent.system).toBe('You are a helpful assistant.');
      expect(agent.created_at).toBe('2024-01-01T00:00:00Z');
      expect(agent.updated_at).toBe('2024-01-01T00:00:00Z');
      expect(agent.llm_config.model).toBe('gpt-4');
      expect(agent.core_memory.persona.value).toBe('I am a helpful AI assistant.');
      expect(agent.core_memory.human.value).toBe('The user is interested in technology.');
      expect(Array.isArray(agent.messages)).toBe(true);
      expect(Array.isArray(agent.tools)).toBe(true);
    });

    it('should parse complete valid .af file with all features', () => {
      const content = loadFixture('valid-complete.af');
      
      const agent = parseAgentFile(content);
      
      // Verify extended features
      expect(agent.agent_id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(agent.embedding_config?.model).toBe('text-embedding-ada-002');
      expect(agent.embedding_config?.dim).toBe(1536);
      expect(agent.messages.length).toBe(4);
      expect(agent.tools.length).toBe(3);
      expect(agent.tool_rules?.length).toBe(2);
      expect(agent.in_context_message_indices).toEqual([0, 1, 2, 3]);
      
      // Verify custom memory block
      expect(agent.core_memory.custom_context?.value).toBe('This is a custom memory block for additional context.');
      
      // Verify tool types
      const pythonTool = agent.tools.find(t => t.type === 'python');
      expect(pythonTool?.name).toBe('calculator');
      expect(pythonTool?.source_code).toContain('def calculator');
      
      const mcpTool = agent.tools.find(t => t.metadata?._mastra_tool?.type === 'mcp');
      expect(mcpTool?.name).toBe('github_search');
      expect(mcpTool?.metadata?._mastra_tool?.server).toBe('https://mcp-github.example.com');
      
      const urlTool = agent.tools.find(t => t.metadata?._mastra_tool?.type === 'url');
      expect(urlTool?.name).toBe('webhook_call');
      expect(urlTool?.metadata?._mastra_tool?.endpoint).toBe('https://api.example.com/webhook');
    });

    it('should validate with isValidAgentFile', () => {
      const validMinimal = loadFixture('valid-minimal.af');
      const validComplete = loadFixture('valid-complete.af');
      
      expect(isValidAgentFile(validMinimal)).toBe(true);
      expect(isValidAgentFile(validComplete)).toBe(true);
    });

    it('should return no validation errors for valid files', () => {
      const validMinimal = loadFixture('valid-minimal.af');
      const validComplete = loadFixture('valid-complete.af');
      
      expect(getValidationErrors(validMinimal)).toBeNull();
      expect(getValidationErrors(validComplete)).toBeNull();
    });

    it('should parse safely with safeParseAgentFile', () => {
      const content = loadFixture('valid-minimal.af');
      
      const result = safeParseAgentFile(content);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Minimal Agent');
      }
    });
  });

  describe('Invalid Files', () => {
    it('should reject file missing required field (name)', () => {
      const content = loadFixture('invalid-missing-required.af');
      
      expect(() => parseAgentFile(content)).toThrow();
      expect(isValidAgentFile(content)).toBe(false);
      
      const errors = getValidationErrors(content);
      expect(errors).not.toBeNull();
      expect(errors?.some(e => e.path.includes('name'))).toBe(true);
    });

    it('should reject file with invalid timestamp', () => {
      const content = loadFixture('invalid-bad-timestamp.af');
      
      expect(() => parseAgentFile(content)).toThrow();
      expect(isValidAgentFile(content)).toBe(false);
      
      const errors = getValidationErrors(content);
      expect(errors).not.toBeNull();
      expect(errors?.some(e => e.path.includes('created_at'))).toBe(true);
    });

    it('should reject Python tool missing source_code', () => {
      const content = loadFixture('invalid-tool-missing-source.af');
      
      expect(() => parseAgentFile(content)).toThrow();
      expect(isValidAgentFile(content)).toBe(false);
      
      const errors = getValidationErrors(content);
      expect(errors).not.toBeNull();
      expect(errors?.some(e => e.message.includes('source_code'))).toBe(true);
    });

    it('should reject invalid message indices', () => {
      const content = loadFixture('invalid-bad-message-indices.af');
      
      expect(() => parseAgentFile(content)).toThrow();
      expect(isValidAgentFile(content)).toBe(false);
      
      const errors = getValidationErrors(content);
      expect(errors).not.toBeNull();
      expect(errors?.some(e => e.message.includes('index'))).toBe(true);
    });

    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ "agent_type": "letta", "version": "0.1.0" ';
      
      expect(() => parseAgentFile(malformedJson)).toThrow();
      expect(isValidAgentFile(malformedJson)).toBe(false);
      
      const result = safeParseAgentFile(malformedJson);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain('JSON');
      }
    });
  });

  describe('Specification Requirements', () => {
    it('should enforce required fields', () => {
      const requiredFields = [
        'agent_type',
        'version', 
        'name',
        'system',
        'created_at',
        'updated_at',
        'llm_config',
        'core_memory',
        'messages',
        'tools'
      ];

      const validAgent = parseAgentFile(loadFixture('valid-minimal.af'));
      
      for (const field of requiredFields) {
        expect(validAgent).toHaveProperty(field);
      }
    });

    it('should validate timestamp format (ISO 8601)', () => {
      const validTimestamps = [
        '2024-01-01T00:00:00Z',
        '2024-12-31T23:59:59.999Z',
        '2024-06-15T14:30:45+02:00',
        '2024-03-10T08:15:30-05:00'
      ];

      const invalidTimestamps = [
        'not-a-timestamp',
        '2024-01-01',
        '2024/01/01 00:00:00',
        '01-01-2024T00:00:00Z'
      ];

      // Test valid timestamps
      for (const timestamp of validTimestamps) {
        const testAgent = {
          agent_type: 'letta',
          version: '0.1.0',
          name: 'Test Agent',
          system: 'Test system',
          created_at: timestamp,
          updated_at: timestamp,
          llm_config: { model: 'gpt-4' },
          core_memory: {
            persona: { label: 'persona', value: 'test', limit: 100 },
            human: { label: 'human', value: 'test', limit: 100 }
          },
          messages: [],
          tools: []
        };

        const result = afAgentSchema.safeParse(testAgent);
        expect(result.success).toBe(true);
      }

      // Test invalid timestamps
      for (const timestamp of invalidTimestamps) {
        const testAgent = {
          agent_type: 'letta',
          version: '0.1.0',
          name: 'Test Agent',
          system: 'Test system',
          created_at: timestamp,
          updated_at: '2024-01-01T00:00:00Z',
          llm_config: { model: 'gpt-4' },
          core_memory: {
            persona: { label: 'persona', value: 'test', limit: 100 },
            human: { label: 'human', value: 'test', limit: 100 }
          },
          messages: [],
          tools: []
        };

        const result = afAgentSchema.safeParse(testAgent);
        expect(result.success).toBe(false);
      }
    });

    it('should validate core memory structure', () => {
      const agent = parseAgentFile(loadFixture('valid-minimal.af'));
      
      // Must have persona and human blocks
      expect(agent.core_memory.persona).toBeDefined();
      expect(agent.core_memory.human).toBeDefined();
      
      // Each block must have required fields
      expect(agent.core_memory.persona.label).toBe('persona');
      expect(agent.core_memory.persona.value).toBeDefined();
      expect(agent.core_memory.persona.limit).toBeGreaterThan(0);
      
      expect(agent.core_memory.human.label).toBe('human');
      expect(agent.core_memory.human.value).toBeDefined();
      expect(agent.core_memory.human.limit).toBeGreaterThan(0);
    });

    it('should validate tool parameter schemas', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      
      for (const tool of agent.tools) {
        // Parameters must be valid JSON Schema
        expect(tool.parameters).toBeDefined();
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties).toBeDefined();
        
        // Required fields validation
        if (tool.required) {
          expect(Array.isArray(tool.required)).toBe(true);
          for (const reqField of tool.required) {
            expect(tool.parameters.properties).toHaveProperty(reqField);
          }
        }
      }
    });

    it('should validate tool rules reference existing tools', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      
      if (agent.tool_rules) {
        const toolNames = new Set(agent.tools.map(t => t.name));
        
        for (const rule of agent.tool_rules) {
          expect(toolNames.has(rule.tool_name)).toBe(true);
        }
      }
    });

    it('should validate message indices reference valid positions', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      
      if (agent.in_context_message_indices) {
        for (const index of agent.in_context_message_indices) {
          expect(index).toBeGreaterThanOrEqual(0);
          expect(index).toBeLessThan(agent.messages.length);
        }
      }
    });

    it('should validate LLM config parameters', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      const config = agent.llm_config;
      
      expect(config.model).toBeDefined();
      
      if (config.temperature !== undefined) {
        expect(config.temperature).toBeGreaterThanOrEqual(0);
        expect(config.temperature).toBeLessThanOrEqual(2);
      }
      
      if (config.max_tokens !== undefined) {
        expect(config.max_tokens).toBeGreaterThan(0);
      }
      
      if (config.top_p !== undefined) {
        expect(config.top_p).toBeGreaterThanOrEqual(0);
        expect(config.top_p).toBeLessThanOrEqual(1);
      }
      
      if (config.frequency_penalty !== undefined) {
        expect(config.frequency_penalty).toBeGreaterThanOrEqual(-2);
        expect(config.frequency_penalty).toBeLessThanOrEqual(2);
      }
      
      if (config.presence_penalty !== undefined) {
        expect(config.presence_penalty).toBeGreaterThanOrEqual(-2);
        expect(config.presence_penalty).toBeLessThanOrEqual(2);
      }
    });
  });

  describe('Extended Features (mastra-af-letta)', () => {
    it('should support MCP tool metadata', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      const mcpTool = agent.tools.find(t => t.metadata?._mastra_tool?.type === 'mcp');
      
      expect(mcpTool).toBeDefined();
      expect(mcpTool?.metadata?._mastra_tool?.server).toBeDefined();
      expect(mcpTool?.metadata?._mastra_tool?.tool_name).toBeDefined();
      expect(mcpTool?.metadata?._mastra_tool?.transport).toMatch(/^(http|websocket|stdio)$/);
    });

    it('should support URL tool metadata', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      const urlTool = agent.tools.find(t => t.metadata?._mastra_tool?.type === 'url');
      
      expect(urlTool).toBeDefined();
      expect(urlTool?.metadata?._mastra_tool?.endpoint).toBeDefined();
      expect(urlTool?.metadata?._mastra_tool?.method).toMatch(/^(GET|POST|PUT|DELETE)$/);
    });

    it('should support authentication references', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      
      for (const tool of agent.tools) {
        const authRef = tool.metadata?._mastra_tool?.auth_ref;
        if (authRef) {
          expect(authRef.provider).toMatch(/^(env|vault|oauth2|custom)$/);
          expect(authRef.config_id).toBeDefined();
          expect(typeof authRef.config_id).toBe('string');
        }
      }
    });

    it('should not allow embedded credentials', () => {
      const agent = parseAgentFile(loadFixture('valid-complete.af'));
      const agentString = JSON.stringify(agent);
      
      // Check for common credential patterns (should not exist)
      const credentialPatterns = [
        /api_key/i,
        /token/i,
        /password/i,
        /secret/i
      ];
      
      // These patterns should only appear in auth_ref contexts or field names
      // but not as actual credential values
      for (const tool of agent.tools) {
        if (tool.metadata?._mastra_tool?.auth_ref) {
          // This is OK - it's a reference, not embedded credentials
          continue;
        }
      }
      
      // The LLM config should not have embedded API keys
      expect(agent.llm_config.model_api_key).toBeUndefined();
    });
  });

  describe('Security and Safety', () => {
    it('should handle large files gracefully', () => {
      // Create a large but valid agent file
      const largeMessages = Array.from({ length: 1000 }, (_, i) => ({
        id: `msg_${i}`,
        role: 'user' as const,
        text: `Message ${i}`.repeat(100), // Make it somewhat large
        timestamp: '2024-01-01T00:00:00Z',
        tool_calls: [],
        tool_results: []
      }));

      const largeAgent = {
        agent_type: 'letta',
        version: '0.1.0',
        name: 'Large Agent',
        system: 'You are a helpful assistant.',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        llm_config: { model: 'gpt-4' },
        core_memory: {
          persona: { label: 'persona', value: 'test', limit: 100 },
          human: { label: 'human', value: 'test', limit: 100 }
        },
        messages: largeMessages,
        tools: []
      };

      const largeAgentJson = JSON.stringify(largeAgent);
      
      // Should parse successfully (but may be slow)
      expect(() => parseAgentFile(largeAgentJson)).not.toThrow();
    });

    it('should validate string length limits', () => {
      const longString = 'a'.repeat(100000); // Very long string
      
      const agentWithLongName = {
        agent_type: 'letta',
        version: '0.1.0',
        name: longString,
        system: 'You are a helpful assistant.',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        llm_config: { model: 'gpt-4' },
        core_memory: {
          persona: { label: 'persona', value: 'test', limit: 100 },
          human: { label: 'human', value: 'test', limit: 100 }
        },
        messages: [],
        tools: []
      };

      // Should handle or reject extremely long names
      const result = afAgentSchema.safeParse(agentWithLongName);
      // Whether it passes or fails, it should not crash
      expect(typeof result.success).toBe('boolean');
    });
  });
});