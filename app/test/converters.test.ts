/**
 * @fileoverview Tests for import/export converters
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { parseAgentFile } from '../src/parser';
import { importAfAgent, exportMastraAgent } from '../src';
import type { MastraAgentConfig, AfImportResult } from '../src/import';

// Load test fixtures
const validAgentJson = readFileSync(
  join(__dirname, 'fixtures', 'valid-agent.af.json'),
  'utf-8'
);
const mcpAgentJson = readFileSync(
  join(__dirname, 'fixtures', 'mcp-agent.af.json'),
  'utf-8'
);

describe('Import Converter', () => {
  it('should import basic agent', () => {
    const afAgent = parseAgentFile(validAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.agent.name).toBe('Test Assistant');
    expect(result.agent.instructions).toBe(afAgent.system);
    expect(result.warnings.length).toBe(1); // tool_rules warning
  });

  it('should convert model configuration', () => {
    const afAgent = parseAgentFile(validAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.agent.model).toEqual({
      provider: 'openai',
      name: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2000,
    });
  });

  it('should convert tools to Mastra format', () => {
    const afAgent = parseAgentFile(validAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.agent.tools).toHaveLength(2);
    
    const weatherTool = result.agent.tools?.find(t => t.id === 'get_weather');
    expect(weatherTool).toBeDefined();
    expect(weatherTool?.type).toBe('function');
    expect(weatherTool?.inputSchema).toBeDefined();
  });

  it('should handle tools with source code', () => {
    const afAgent = parseAgentFile(validAgentJson);
    
    // Test different strategies
    const skipResult = importAfAgent(afAgent, { toolCodeStrategy: 'skip' });
    expect(skipResult.agent.tools).toHaveLength(1); // Only schema tool
    
    const stubResult = importAfAgent(afAgent, { toolCodeStrategy: 'stub' });
    expect(stubResult.agent.tools).toHaveLength(2);
    const stubTool = stubResult.agent.tools?.find(t => t.id === 'calculate');
    expect(stubTool?.execute).toBeDefined();
    
    const schemaResult = importAfAgent(afAgent, { toolCodeStrategy: 'schema-only' });
    expect(schemaResult.agent.tools).toHaveLength(2);
  });

  it('should convert core memory to working memory', () => {
    const afAgent = parseAgentFile(validAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.memory?.workingMemory).toBeDefined();
    expect(result.memory?.workingMemory?.personality).toEqual({
      value: afAgent.core_memory[0].value,
      characterLimit: afAgent.core_memory[0].character_limit,
      metadata: afAgent.core_memory[0].metadata,
    });
  });

  it('should convert messages', () => {
    const afAgent = parseAgentFile(validAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.memory?.messages).toHaveLength(4);
    expect(result.memory?.messages?.[0]).toEqual({
      role: 'system',
      content: afAgent.messages[0].text,
      metadata: {
        id: 'msg_001',
        timestamp: afAgent.messages[0].timestamp,
      },
    });
  });

  it('should import MCP tools correctly', () => {
    const afAgent = parseAgentFile(mcpAgentJson);
    const result = importAfAgent(afAgent);
    
    const githubTool = result.agent.tools?.find(t => t.id === 'github_search');
    expect(githubTool).toBeDefined();
    expect(githubTool?.type).toBe('mcp');
    expect(githubTool?.mcpServer).toBe('https://mcp-github.example.com');
    expect(githubTool?.mcpToolName).toBe('search');
    expect(githubTool?.authRef).toEqual({
      provider: 'env',
      config_id: 'GITHUB_TOKEN',
      metadata: {
        auth_type: 'bearer',
      },
    });
  });

  it('should track import metadata', () => {
    const afAgent = parseAgentFile(mcpAgentJson);
    const result = importAfAgent(afAgent);
    
    expect(result.metadata.originalVersion).toBe('0.1.0');
    expect(result.metadata.mcpTools).toBe(4); // 3 MCP + 1 URL tool
    expect(result.metadata.standardTools).toBe(1);
    expect(result.metadata.importedAt).toBeInstanceOf(Date);
  });

  it('should handle missing optional fields', () => {
    const minimalAgent = {
      agent_type: 'test',
      name: 'Minimal',
      system: 'Test system',
      llm_config: { provider: 'test', model: 'test' },
      core_memory: [],
      messages: [],
      tools: [],
      version: '0.1.0',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    const result = importAfAgent(minimalAgent);
    expect(result.agent.name).toBe('Minimal');
    expect(result.warnings).toHaveLength(0);
  });
});

describe('Export Converter', () => {
  it('should export basic agent', () => {
    const agent: MastraAgentConfig = {
      name: 'Test Agent',
      instructions: 'You are a test agent',
      model: {
        provider: 'openai',
        name: 'gpt-4',
        temperature: 0.5,
      },
    };
    
    const result = exportMastraAgent(agent);
    const exported = JSON.parse(result.content);
    
    expect(exported.name).toBe('Test Agent');
    expect(exported.system).toBe('You are a test agent');
    expect(exported.llm_config).toEqual({
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.5,
    });
  });

  it('should export tools with MCP metadata', () => {
    const agent: MastraAgentConfig = {
      name: 'MCP Agent',
      instructions: 'Test',
      tools: [
        {
          id: 'github_tool',
          description: 'GitHub search',
          inputSchema: z.object({
            query: z.string(),
          }),
          type: 'mcp',
          mcpServer: 'https://mcp.github.com',
          mcpToolName: 'search',
          mcpTransport: 'http',
          authRef: {
            provider: 'env',
            config_id: 'GH_TOKEN',
          },
        },
      ],
    };
    
    const result = exportMastraAgent(agent);
    const exported = JSON.parse(result.content);
    
    expect(exported.tools).toHaveLength(1);
    expect(exported.tools[0].metadata._mastra_tool).toEqual({
      type: 'mcp',
      server: 'https://mcp.github.com',
      tool_name: 'search',
      transport: 'http',
      auth_ref: {
        provider: 'env',
        config_id: 'GH_TOKEN',
      },
    });
  });

  it('should handle dynamic instructions', () => {
    const agent: MastraAgentConfig = {
      name: 'Dynamic Agent',
      instructions: async (context) => `Hello ${context.user}`,
    };
    
    const result = exportMastraAgent(agent);
    const exported = JSON.parse(result.content);
    
    expect(exported.system).toBe('Dynamic instructions (see metadata)');
    expect(exported.metadata_.mastra_dynamic_instructions).toBe(true);
    expect(result.metadata.omittedFeatures).toContain('dynamic_instructions');
  });

  it('should export memory configuration', () => {
    const agent: MastraAgentConfig = {
      name: 'Memory Agent',
      instructions: 'Test',
    };
    
    const memory = {
      workingMemory: {
        personality: {
          value: 'Helpful assistant',
          characterLimit: 500,
        },
        context: 'Test context',
      },
      messages: [
        {
          role: 'user' as const,
          content: 'Hello',
          metadata: {
            id: 'msg1',
            timestamp: '2024-01-01T00:00:00Z',
          },
        },
      ],
    };
    
    const result = exportMastraAgent(agent, memory);
    const exported = JSON.parse(result.content);
    
    expect(exported.core_memory).toHaveLength(2);
    expect(exported.core_memory[0]).toEqual({
      label: 'personality',
      value: 'Helpful assistant',
      character_limit: 500,
    });
    
    expect(exported.messages).toHaveLength(1);
    expect(exported.messages[0].text).toBe('Hello');
  });

  it('should preserve metadata through round-trip', () => {
    const afAgent = parseAgentFile(mcpAgentJson);
    const imported = importAfAgent(afAgent);
    const exported = exportMastraAgent(imported.agent, imported.memory);
    const reImported = importAfAgent(JSON.parse(exported.content));
    
    // Check key properties survived round-trip
    expect(reImported.agent.name).toBe(afAgent.name);
    expect(reImported.agent.tools?.length).toBe(afAgent.tools.length);
    
    // Check MCP metadata survived
    const originalGithub = afAgent.tools.find(t => t.name === 'github_search');
    const finalGithub = reImported.agent.tools?.find(t => t.id === 'github_search');
    expect(finalGithub?.authRef).toEqual(
      originalGithub?.metadata?._mastra_tool?.auth_ref
    );
  });

  it('should handle export options', () => {
    const agent: MastraAgentConfig = {
      name: 'Options Test',
      instructions: 'Test',
    };
    
    // Test pretty printing
    const prettyResult = exportMastraAgent(agent, undefined, { pretty: true });
    expect(prettyResult.content).toContain('\n');
    
    const compactResult = exportMastraAgent(agent, undefined, { pretty: false });
    expect(compactResult.content).not.toContain('\n');
    
    // Test version override
    const versionResult = exportMastraAgent(agent, undefined, { version: '2.0.0' });
    const exported = JSON.parse(versionResult.content);
    expect(exported.version).toBe('2.0.0');
  });

  it('should limit messages on export', () => {
    const agent: MastraAgentConfig = {
      name: 'Message Limit Test',
      instructions: 'Test',
    };
    
    const memory = {
      messages: Array(100).fill(null).map((_, i) => ({
        role: 'user' as const,
        content: `Message ${i}`,
      })),
    };
    
    const result = exportMastraAgent(agent, memory, { maxMessages: 10 });
    const exported = JSON.parse(result.content);
    
    expect(exported.messages).toHaveLength(10);
    expect(exported.messages[0].text).toBe('Message 90'); // Most recent
  });
});

describe('Round-trip conversions', () => {
  it('should preserve all data through import/export cycle', () => {
    const original = parseAgentFile(validAgentJson);
    const imported = importAfAgent(original);
    const exported = exportMastraAgent(imported.agent, imported.memory);
    const final = parseAgentFile(exported.content);
    
    expect(final.name).toBe(original.name);
    expect(final.system).toBe(original.system);
    expect(final.tools.length).toBe(original.tools.length);
    expect(final.core_memory.length).toBeGreaterThan(0);
    expect(final.messages.length).toBe(original.messages.length);
  });

  it('should handle MCP tools in round-trip', () => {
    const original = parseAgentFile(mcpAgentJson);
    const imported = importAfAgent(original);
    const exported = exportMastraAgent(imported.agent, imported.memory);
    const final = parseAgentFile(exported.content);
    
    const originalMcp = original.tools.find(t => t.name === 'github_search');
    const finalMcp = final.tools.find(t => t.name === 'github_search');
    
    expect(finalMcp?.metadata?._mastra_tool).toEqual(
      originalMcp?.metadata?._mastra_tool
    );
  });
});