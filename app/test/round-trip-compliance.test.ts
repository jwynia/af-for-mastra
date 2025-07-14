import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { 
  parseAgentFile, 
  safeParseAgentFile
} from '../src/index';

// TODO: Re-enable when Mastra integration is available
// import { importAfAgent, exportMastraAgent } from '../src/index';

const FIXTURES_DIR = join(__dirname, 'fixtures');

function loadFixture(filename: string): string {
  return readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
}

describe.skip('Round-Trip Conversion Compliance', () => {
  describe('Lossless Conversion', () => {
    it('should preserve all data in minimal agent round-trip', () => {
      const originalContent = loadFixture('valid-minimal.af');
      const originalAgent = parseAgentFile(originalContent);
      
      // Import to Mastra format
      const importResult = importAfAgent(originalAgent);
      expect(importResult.agent).toBeDefined();
      expect(importResult.memory).toBeDefined();
      expect(importResult.warnings).toBeDefined();
      
      // Export back to .af format
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      expect(exportResult.success).toBe(true);
      
      // Parse the exported content
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Verify core fields are preserved
      expect(roundTripAgent.agent_type).toBe(originalAgent.agent_type);
      expect(roundTripAgent.version).toBe(originalAgent.version);
      expect(roundTripAgent.name).toBe(originalAgent.name);
      expect(roundTripAgent.system).toBe(originalAgent.system);
      expect(roundTripAgent.llm_config.model).toBe(originalAgent.llm_config.model);
      expect(roundTripAgent.llm_config.temperature).toBe(originalAgent.llm_config.temperature);
      
      // Memory should be preserved
      expect(roundTripAgent.core_memory.persona.value).toBe(originalAgent.core_memory.persona.value);
      expect(roundTripAgent.core_memory.human.value).toBe(originalAgent.core_memory.human.value);
      
      // Arrays should be preserved
      expect(roundTripAgent.messages).toEqual(originalAgent.messages);
      expect(roundTripAgent.tools).toEqual(originalAgent.tools);
    });

    it('should preserve all data in complete agent round-trip', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      // Import to Mastra format
      const importResult = importAfAgent(originalAgent);
      expect(importResult.warnings.length).toBeGreaterThanOrEqual(0); // May have warnings
      
      // Export back to .af format
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      expect(exportResult.success).toBe(true);
      
      // Parse the exported content
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Verify extended fields are preserved
      expect(roundTripAgent.agent_id).toBe(originalAgent.agent_id);
      expect(roundTripAgent.embedding_config?.model).toBe(originalAgent.embedding_config?.model);
      expect(roundTripAgent.embedding_config?.dim).toBe(originalAgent.embedding_config?.dim);
      
      // Tool preservation
      expect(roundTripAgent.tools.length).toBe(originalAgent.tools.length);
      
      for (let i = 0; i < originalAgent.tools.length; i++) {
        const originalTool = originalAgent.tools[i];
        const roundTripTool = roundTripAgent.tools[i];
        
        expect(roundTripTool.name).toBe(originalTool.name);
        expect(roundTripTool.description).toBe(originalTool.description);
        expect(roundTripTool.type).toBe(originalTool.type);
        expect(roundTripTool.parameters).toEqual(originalTool.parameters);
        
        // Source code for Python/JS tools
        if (originalTool.type === 'python' || originalTool.type === 'javascript') {
          expect(roundTripTool.source_code).toBe(originalTool.source_code);
        }
        
        // MCP metadata
        if (originalTool.metadata?._mastra_tool) {
          expect(roundTripTool.metadata?._mastra_tool).toEqual(originalTool.metadata._mastra_tool);
        }
      }
      
      // Message preservation
      expect(roundTripAgent.messages.length).toBe(originalAgent.messages.length);
      
      for (let i = 0; i < originalAgent.messages.length; i++) {
        const originalMsg = originalAgent.messages[i];
        const roundTripMsg = roundTripAgent.messages[i];
        
        expect(roundTripMsg.id).toBe(originalMsg.id);
        expect(roundTripMsg.role).toBe(originalMsg.role);
        expect(roundTripMsg.text).toBe(originalMsg.text);
        expect(roundTripMsg.timestamp).toBe(originalMsg.timestamp);
        expect(roundTripMsg.tool_calls).toEqual(originalMsg.tool_calls);
        expect(roundTripMsg.tool_results).toEqual(originalMsg.tool_results);
      }
      
      // Tool rules preservation
      if (originalAgent.tool_rules) {
        expect(roundTripAgent.tool_rules).toEqual(originalAgent.tool_rules);
      }
      
      // Message indices preservation
      if (originalAgent.in_context_message_indices) {
        expect(roundTripAgent.in_context_message_indices).toEqual(originalAgent.in_context_message_indices);
      }
    });

    it('should handle custom core memory blocks', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      // Verify original has custom memory block
      expect(originalAgent.core_memory.custom_context).toBeDefined();
      
      // Round-trip conversion
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Custom memory blocks should be preserved
      expect(roundTripAgent.core_memory.custom_context).toEqual(originalAgent.core_memory.custom_context);
    });
  });

  describe('Conversion Warnings', () => {
    it('should warn about features that may not translate perfectly', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      
      // Should have warnings about tool rules (not directly supported in Mastra)
      const toolRuleWarnings = importResult.warnings.filter(w => 
        w.type === 'unsupported_feature' && w.message.includes('tool_rules')
      );
      expect(toolRuleWarnings.length).toBeGreaterThan(0);
    });

    it('should warn about MCP tools requiring additional setup', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      
      // Should have warnings about MCP tools
      const mcpWarnings = importResult.warnings.filter(w => 
        w.type === 'requires_setup' && w.message.includes('MCP')
      );
      expect(mcpWarnings.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should maintain JSON validity through round-trip', () => {
      const originalContent = loadFixture('valid-minimal.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      
      // Exported content should be valid JSON
      expect(() => JSON.parse(exportResult.content)).not.toThrow();
      
      // And should be valid .af format
      expect(() => parseAgentFile(exportResult.content)).not.toThrow();
    });

    it('should preserve timestamp formats', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Timestamps should be in ISO 8601 format
      expect(roundTripAgent.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      expect(roundTripAgent.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      
      // Message timestamps should also be preserved
      for (const message of roundTripAgent.messages) {
        expect(message.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/);
      }
    });

    it('should preserve numeric precision', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // LLM config numeric values should be preserved exactly
      expect(roundTripAgent.llm_config.temperature).toBe(originalAgent.llm_config.temperature);
      expect(roundTripAgent.llm_config.max_tokens).toBe(originalAgent.llm_config.max_tokens);
      expect(roundTripAgent.llm_config.top_p).toBe(originalAgent.llm_config.top_p);
      expect(roundTripAgent.llm_config.frequency_penalty).toBe(originalAgent.llm_config.frequency_penalty);
      expect(roundTripAgent.llm_config.presence_penalty).toBe(originalAgent.llm_config.presence_penalty);
      
      // Embedding config
      if (originalAgent.embedding_config) {
        expect(roundTripAgent.embedding_config?.dim).toBe(originalAgent.embedding_config.dim);
      }
      
      // Memory limits
      expect(roundTripAgent.core_memory.persona.limit).toBe(originalAgent.core_memory.persona.limit);
      expect(roundTripAgent.core_memory.human.limit).toBe(originalAgent.core_memory.human.limit);
    });

    it('should handle special characters and unicode', () => {
      // Create an agent with special characters
      const specialAgent = {
        agent_type: 'letta',
        version: '0.1.0',
        name: 'Special Agent 🤖',
        system: 'You are a helpful assistant with émojis and spëcial characters!',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        llm_config: { model: 'gpt-4' },
        core_memory: {
          persona: { 
            label: 'persona', 
            value: 'I am an AI with 中文 and العربية support! 🌍', 
            limit: 2000 
          },
          human: { 
            label: 'human', 
            value: 'User likes unicode: ñáéíóú and symbols: ∑∆π', 
            limit: 2000 
          }
        },
        messages: [
          {
            id: 'msg_001',
            role: 'user' as const,
            text: 'Hello with special chars: "quotes", \'apostrophes\', and newlines\n\nLike this!',
            timestamp: '2024-01-01T00:00:00Z',
            tool_calls: [],
            tool_results: []
          }
        ],
        tools: []
      };
      
      const specialAgentJson = JSON.stringify(specialAgent);
      
      // Round-trip conversion
      const originalAgent = parseAgentFile(specialAgentJson);
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Special characters should be preserved
      expect(roundTripAgent.name).toBe(specialAgent.name);
      expect(roundTripAgent.system).toBe(specialAgent.system);
      expect(roundTripAgent.core_memory.persona.value).toBe(specialAgent.core_memory.persona.value);
      expect(roundTripAgent.core_memory.human.value).toBe(specialAgent.core_memory.human.value);
      expect(roundTripAgent.messages[0].text).toBe(specialAgent.messages[0].text);
    });
  });

  describe('Error Handling in Conversion', () => {
    it('should handle conversion of invalid agents gracefully', () => {
      // Try to convert an incomplete agent
      const incompleteAgent = {
        name: 'Incomplete Agent',
        system: 'Test'
        // Missing required fields
      };
      
      // This should fail validation before conversion
      const result = safeParseAgentFile(JSON.stringify(incompleteAgent));
      expect(result.success).toBe(false);
    });

    it('should preserve metadata during conversion', () => {
      const originalContent = loadFixture('valid-complete.af');
      const originalAgent = parseAgentFile(originalContent);
      
      const importResult = importAfAgent(originalAgent);
      const exportResult = exportMastraAgent(importResult.agent, importResult.memory);
      const roundTripAgent = parseAgentFile(exportResult.content);
      
      // Custom metadata should be preserved
      if (originalAgent.metadata) {
        expect(roundTripAgent.metadata).toBeDefined();
        // Some metadata may be added during conversion
        expect(roundTripAgent.metadata).toMatchObject(originalAgent.metadata);
      }
    });
  });
  
  describe('Version Compatibility', () => {
    it('should handle different .af versions', () => {
      // Test with explicit version
      const versionedAgent = {
        agent_type: 'letta',
        version: '0.1.0',
        name: 'Versioned Agent',
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
      
      const versionedJson = JSON.stringify(versionedAgent);
      
      // Should parse and convert successfully
      const agent = parseAgentFile(versionedJson);
      expect(agent.version).toBe('0.1.0');
      
      const importResult = importAfAgent(agent);
      expect(importResult.agent).toBeDefined();
    });
  });
});