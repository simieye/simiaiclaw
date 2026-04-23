/**
 * MCP 连接器 & AI 大模型市场 类型定义
 */

// ── MCP 服务器 ────────────────────────────────────────────────
export type MCPServerStatus = 'connected' | 'disconnected' | 'connecting' | 'error';
export type MCPServerCategory =
  | 'database' | 'devtools' | 'communication' | 'storage' | 'ai'
  | 'workflow' | 'ecommerce' | 'social' | 'payment' | 'other';

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  category: MCPServerCategory;
  icon: string;
  // 连接配置
  endpoint?: string;          // HTTP URL
  authToken?: string;         // Bearer Token
  apiKey?: string;            // API Key
  config?: Record<string, unknown>; // 其他自定义字段（如 projectId, workspace 等）
  // 元数据
  status: MCPServerStatus;
  lastConnected?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MCPServerTemplate {
  id: string;
  name: string;
  description: string;
  category: MCPServerCategory;
  icon: string;
  // 预置字段模板
  fields: Array<{
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    placeholder?: string;
    required: boolean;
    options?: string[]; // for select type
    helpText?: string;
  }>;
  docsUrl?: string;
  // MCP 多服务器支持（如 Base44 有多个 MCP 端点）
  mcpServers?: Array<{
    name: string;
    url: string;
    description?: string;
    auth: 'oauth' | 'apikey' | 'none';
  }>;
}

// ── AI 大模型 ─────────────────────────────────────────────────
export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'local' | 'ollama' | 'huobao' | 'other';
export type ModelCapability = 'chat' | 'image' | 'video' | 'audio' | 'embedding' | 'reasoning' | 'function';

export interface AIModel {
  id: string;
  name: string;
  provider: ModelProvider;
  providerName: string;
  capabilities: ModelCapability[];
  description: string;
  // 计费
  pricePer1KInput?: number;  // USD / 1K tokens
  pricePer1KOutput?: number;
  // 性能
  contextWindow: number;     // tokens
  latency?: string;          // e.g. "< 2s"
  quality?: string;           // e.g. "顶级", "优秀", "标准"
  // 状态
  isEnabled: boolean;
  isConnected: boolean;
  apiKeyConfigured: boolean;
  // 市场信息
  tier: 'free' | 'popular' | 'pro' | 'enterprise';
  usageCount: number;
  rating: number;
  thumbnail?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ModelProviderInfo {
  provider: ModelProvider;
  name: string;
  icon: string;
  description: string;
  website: string;
  apiKeyPlaceholder?: string;
  docsUrl?: string;
  models: AIModel[];
}

// ── 工作流 ─────────────────────────────────────────────────────
export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'active' | 'paused' | 'draft';
  triggerType: 'manual' | 'scheduled' | 'event';
  schedule?: string; // cron expression
  stats: { runs: number; successRate: number };
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  order: number;
  type: 'mcp' | 'model' | 'webhook' | 'condition';
  config: Record<string, unknown>;
}

// ── 连接配置（前端表单） ─────────────────────────────────────────
export interface MCPConnectionConfig {
  name: string;
  endpoint: string;
  authToken?: string;
  apiKey?: string;
  customFields?: Record<string, string>;
}
