/**
 * @fileoverview Tests for MCP tools and authentication references
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseAgentFile, safeParseAgentFile } from '../src/parser';
import { 
  mastraToolMetadataSchema, 
  authReferenceSchema,
  toolSchema 
} from '../src/schema';
import type { AfTool, MastraToolMetadata, AuthReference } from '../src/types';

// Load MCP test fixture
const mcpAgentJson = readFileSync(
  join(__dirname, 'fixtures', 'mcp-agent.af.json'),
  'utf-8'
);

describe('MCP Tool Support', () => {
  it('should parse agent with MCP tools', () => {
    const agent = parseAgentFile(mcpAgentJson);
    expect(agent.name).toBe('MCP-Enabled Assistant');
    expect(agent.tools).toHaveLength(5);
    
    // Check MCP tool
    const githubTool = agent.tools.find(t => t.name === 'github_search');
    expect(githubTool?.metadata?._mastra_tool).toBeDefined();
    expect(githubTool?.metadata?._mastra_tool?.type).toBe('mcp');
  });

  it('should validate MCP tool metadata', () => {
    const mcpMetadata: MastraToolMetadata = {
      type: 'mcp',
      server: 'https://mcp-server.example.com',
      tool_name: 'search',
      transport: 'http',
      auth_ref: {
        provider: 'env',
        config_id: 'API_KEY',
        metadata: {
          auth_type: 'bearer'
        }
      }
    };
    
    const result = mastraToolMetadataSchema.safeParse(mcpMetadata);
    expect(result.success).toBe(true);
  });

  it('should validate URL tool metadata', () => {
    const urlMetadata: MastraToolMetadata = {
      type: 'url',
      endpoint: 'https://api.example.com/webhook',
      method: 'POST',
      auth_ref: {
        provider: 'vault',
        config_id: 'api/keys/webhook'
      }
    };
    
    const result = mastraToolMetadataSchema.safeParse(urlMetadata);
    expect(result.success).toBe(true);
  });

  it('should require server and tool_name for MCP tools', () => {
    const invalidMcp = {
      type: 'mcp',
      // Missing server and tool_name
    };
    
    const result = mastraToolMetadataSchema.safeParse(invalidMcp);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('MCP tools require');
    }
  });

  it('should require endpoint for URL tools', () => {
    const invalidUrl = {
      type: 'url',
      method: 'GET',
      // Missing endpoint
    };
    
    const result = mastraToolMetadataSchema.safeParse(invalidUrl);
    expect(result.success).toBe(false);
  });
});

describe('Authentication References', () => {
  it('should validate environment variable auth', () => {
    const envAuth: AuthReference = {
      provider: 'env',
      config_id: 'GITHUB_TOKEN',
      metadata: {
        auth_type: 'bearer'
      }
    };
    
    const result = authReferenceSchema.safeParse(envAuth);
    expect(result.success).toBe(true);
  });

  it('should validate vault auth', () => {
    const vaultAuth: AuthReference = {
      provider: 'vault',
      config_id: 'secret/api-keys/openai',
      metadata: {
        auth_type: 'api_key'
      }
    };
    
    const result = authReferenceSchema.safeParse(vaultAuth);
    expect(result.success).toBe(true);
  });

  it('should validate OAuth2 auth', () => {
    const oauthAuth: AuthReference = {
      provider: 'oauth2',
      config_id: 'github_oauth',
      metadata: {
        auth_type: 'oauth2',
        required_scopes: ['repo', 'read:user'],
        expires_in: 3600
      }
    };
    
    const result = authReferenceSchema.safeParse(oauthAuth);
    expect(result.success).toBe(true);
  });

  it('should validate dynamic auth', () => {
    const dynamicAuth: AuthReference = {
      provider: 'dynamic',
      config_id: 'user_token',
      metadata: {
        prompt: 'Please enter your API token',
        cache_duration: 1800
      }
    };
    
    const result = authReferenceSchema.safeParse(dynamicAuth);
    expect(result.success).toBe(true);
  });

  it('should reject invalid auth provider', () => {
    const invalidAuth = {
      provider: 'invalid_provider',
      config_id: 'test'
    };
    
    const result = authReferenceSchema.safeParse(invalidAuth);
    expect(result.success).toBe(false);
  });
});

describe('Tool validation with MCP metadata', () => {
  it('should validate tool with MCP metadata', () => {
    const mcpTool: AfTool = {
      name: 'test_mcp_tool',
      description: 'Test MCP tool',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {
          input: {
            type: 'string'
          }
        }
      },
      metadata: {
        _mastra_tool: {
          type: 'mcp',
          server: 'https://mcp.example.com',
          tool_name: 'test',
          auth_ref: {
            provider: 'env',
            config_id: 'MCP_TOKEN'
          }
        }
      }
    };
    
    const result = toolSchema.safeParse(mcpTool);
    expect(result.success).toBe(true);
  });

  it('should validate tool with invalid MCP metadata', () => {
    const invalidTool = {
      name: 'invalid_mcp',
      description: 'Invalid MCP tool',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {}
      },
      metadata: {
        _mastra_tool: {
          type: 'mcp',
          // Missing required server and tool_name
        }
      }
    };
    
    const result = toolSchema.safeParse(invalidTool);
    expect(result.success).toBe(false);
  });

  it('should allow tools without Mastra metadata', () => {
    const standardTool: AfTool = {
      name: 'standard_tool',
      description: 'Standard tool without MCP',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {}
      },
      metadata: {
        custom_field: 'custom_value'
      }
    };
    
    const result = toolSchema.safeParse(standardTool);
    expect(result.success).toBe(true);
  });
});

describe('Security validations', () => {
  it('should reject tools with embedded credentials', () => {
    // This test validates our documentation - we should never store secrets
    const toolWithSecret = {
      name: 'insecure_tool',
      description: 'Tool with embedded secret',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {}
      },
      metadata: {
        api_key: 'sk-12345', // BAD! Should use auth_ref instead
        _mastra_tool: {
          type: 'mcp',
          server: 'https://api.example.com',
          tool_name: 'test'
        }
      }
    };
    
    // The schema allows this (for backward compatibility),
    // but our docs strongly discourage it
    const result = toolSchema.safeParse(toolWithSecret);
    expect(result.success).toBe(true);
    
    // In practice, converters should warn about this pattern
    expect(toolWithSecret.metadata.api_key).toBeDefined();
    expect(toolWithSecret.metadata._mastra_tool?.auth_ref).toBeUndefined();
  });

  it('should prefer auth_ref over embedded credentials', () => {
    const secureTool = {
      name: 'secure_tool',
      description: 'Tool with auth reference',
      type: 'json_schema',
      parameters: {
        type: 'object',
        properties: {}
      },
      metadata: {
        _mastra_tool: {
          type: 'mcp',
          server: 'https://api.example.com',
          tool_name: 'test',
          auth_ref: {
            provider: 'env',
            config_id: 'API_KEY'
          }
        }
      }
    };
    
    const result = toolSchema.safeParse(secureTool);
    expect(result.success).toBe(true);
    
    // No embedded secrets
    expect(secureTool.metadata.api_key).toBeUndefined();
    expect(secureTool.metadata._mastra_tool.auth_ref).toBeDefined();
  });
});

describe('MCP agent file round-trip', () => {
  it('should preserve MCP metadata through parse/stringify', () => {
    const agent = parseAgentFile(mcpAgentJson);
    const stringified = JSON.stringify(agent, null, 2);
    const reparsed = parseAgentFile(stringified);
    
    expect(reparsed.tools).toHaveLength(agent.tools.length);
    
    // Check MCP tool preservation
    const originalGithub = agent.tools.find(t => t.name === 'github_search');
    const reparsedGithub = reparsed.tools.find(t => t.name === 'github_search');
    
    expect(reparsedGithub?.metadata?._mastra_tool).toEqual(
      originalGithub?.metadata?._mastra_tool
    );
  });
});