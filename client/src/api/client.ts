/**
 * SIMIAICLAW 龙虾集群控制台
 * API 客户端 — 对接后端 Express API（含多租户认证）
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: 'owner' | 'admin' | 'member' | 'viewer';
  memberCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  tenants: TenantInfo[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface SystemStatus {
  timestamp: string;
  agents: { total: number; byPalace: Array<{ palace: string; count: number }> };
  tasks: { total: number; pending: number; running: number; completed: number; failed: number };
  heartbeat: {
    nodeCount: number;
    healthByPalace: Record<string, { up: number; down: number; total: number }>;
  };
  openspace: { total: number; byType: Record<string, number>; byLane: Record<string, number> };
  clawtip: { total: number; completed: number; pending: number; revenue: number };
  llm?: { simulateMode: boolean; totalRequests: number; costUSD: number };
  payments?: { total: number; completed: number; pending: number; revenue: number };
  tenant?: TenantInfo | null;
  user?: { id: string; displayName: string; email: string } | null;
}

export interface ExecuteResult {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  activeAgents: number;
  failedAgents: number;
  nodes: Array<{ palace: string; agentId: string; status: string; responseTime: number }>;
}

export interface LLMStats {
  totalInput: number;
  totalOutput: number;
  totalRequests: number;
  costUSD: number;
  byModel: Record<string, { input: number; output: number; requests: number }>;
}

// ==================== AuthStorage ====================

const AUTH_KEY = 'simiaiclaw_auth';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  activeTenant: TenantInfo;
  expiresAt: number;
}

function loadAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const auth: StoredAuth = JSON.parse(raw);
    if (auth.expiresAt < Date.now() && auth.expiresAt > 0) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    // 兼容旧格式：user.tenants 为 undefined 时用 activeTenant 兜底
    if (!auth.user.tenants || !auth.user.tenants.length) {
      auth.user.tenants = auth.activeTenant ? [auth.activeTenant] : [];
    }
    return auth;
  } catch { return null; }
}

function saveAuth(auth: StoredAuth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

// ==================== ApiClient ====================

class ApiClient {
  private base: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(base: string) {
    this.base = base;
    const stored = loadAuth();
    if (stored) {
      this.accessToken = stored.accessToken;
      this.refreshToken = stored.refreshToken;
    }
  }

  // ── Auth ────────────────────────────────────────────────

  isLoggedIn(): boolean {
    const stored = loadAuth();
    return !!stored && stored.expiresAt > Date.now();
  }

  getStoredAuth(): StoredAuth | null {
    return loadAuth();
  }

  async register(params: {
    email: string; password: string; displayName: string; tenantName?: string;
  }): Promise<{ user: AuthUser; tenant: TenantInfo; tokens: AuthTokens }> {
    const res = await fetch(`${this.base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '注册失败');
    const authUser = this.toAuthUser(data.user, data.tenant);
    this.setAuth({ user: authUser, tenant: data.tenant, tokens: data.tokens });
    return { user: authUser, tenant: data.tenant, tokens: data.tokens };
  }

  async login(params: { email: string; password: string; tenantId?: string }): Promise<{
    user: AuthUser; tenant: TenantInfo; tokens: AuthTokens;
  }> {
    const res = await fetch(`${this.base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');
    const authUser = this.toAuthUser(data.user, data.tenant);
    this.setAuth({ user: authUser, tenant: data.tenant, tokens: data.tokens });
    return { user: authUser, tenant: data.tenant, tokens: data.tokens };
  }

  async refresh(): Promise<void> {
    if (!this.refreshToken) throw new Error('无 refreshToken');
    const res = await fetch(`${this.base}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });
    const data = await res.json();
    if (!res.ok) {
      this.logout();
      throw new Error(data.error || '会话已过期，请重新登录');
    }
    const authUser = this.toAuthUser(data.user, data.tenant);
    this.setAuth({ user: authUser, tenant: data.tenant, tokens: data.tokens });
  }

  async switchTenant(tenantId: string): Promise<{ tenant: TenantInfo; tokens: AuthTokens }> {
    const res = await fetch(`${this.base}/auth/switch-tenant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader() },
      body: JSON.stringify({ tenantId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '切换失败');
    const stored = loadAuth();
    const currentUser = stored?.user;
    const authUser = currentUser
      ? this.toAuthUser(currentUser as unknown as Record<string, unknown>, data.tenant)
      : this.toAuthUser({}, data.tenant);
    this.setAuth({ user: authUser, tenant: data.tenant, tokens: data.tokens });
    return data;
  }

  async checkIsAdmin(): Promise<boolean> {
    const headers = this.authHeader();
    const res = await fetch(`${this.base}/auth/is-admin`, { headers });
    if (res.status === 401 && this.refreshToken) {
      try {
        await this.refresh();
        const retryRes = await fetch(`${this.base}/auth/is-admin`, { headers: this.authHeader() });
        if (!retryRes.ok) return false;
        const data = await retryRes.json() as { isAdmin: boolean };
        return data.isAdmin ?? false;
      } catch {
        return false;
      }
    }
    if (!res.ok) return false;
    const data = await res.json() as { isAdmin: boolean };
    return data.isAdmin ?? false;
  }

  async fetchMe(): Promise<{ user: AuthUser; activeTenant: TenantInfo | null }> {
    const res = await fetch(`${this.base}/auth/me`, { headers: this.authHeader() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    // 后端返回 PublicUser（含 tenantIds）→ 转为 AuthUser（含 tenants 完整对象）
    if (data.user && data.activeTenant) {
      const authUser = this.toAuthUser(data.user, data.activeTenant);
      return { user: authUser, activeTenant: data.activeTenant };
    }
    return data;
  }

  async updateProfile(updates: { displayName?: string; avatar?: string }): Promise<{ user: AuthUser }> {
    const res = await fetch(`${this.base}/auth/me`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeader() },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }

  logout() {
    this.accessToken = null;
    this.refreshToken = null;
    clearAuth();
  }

  private setAuth(data: { user: AuthUser; tenant: TenantInfo; tokens: AuthTokens }) {
    this.accessToken = data.tokens.accessToken;
    this.refreshToken = data.tokens.refreshToken;
    saveAuth({
      accessToken: data.tokens.accessToken,
      refreshToken: data.tokens.refreshToken,
      user: data.user,
      activeTenant: data.tenant,
      expiresAt: Date.now() + data.tokens.expiresIn * 1000,
    });
  }

  /** 将后端 PublicUser（含 tenantIds）转为前端 AuthUser（含 tenants 完整对象） */
  private toAuthUser(backendUser: Record<string, unknown>, activeTenant: TenantInfo): AuthUser {
    const tenantIds = (backendUser.tenantIds as string[]) || [];
    // 用 activeTenant 作为第一个租户，其余存 ID 占位（后续 fetchMe 会补全完整列表）
    const tenants: TenantInfo[] = [
      activeTenant,
      ...tenantIds
        .filter(id => id !== activeTenant.id)
        .map(id => ({ id, name: '', slug: '', plan: 'free' as const, role: 'member' as const, memberCount: 0 })),
    ];
    return {
      id: backendUser.id as string,
      email: backendUser.email as string,
      displayName: backendUser.displayName as string,
      avatar: backendUser.avatar as string | undefined,
      tenants,
    };
  }

  private authHeader(): Record<string, string> {
    return this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {};
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...this.authHeader(), ...(options.headers as Record<string, string> | undefined) },
    });
    if (res.status === 401 && this.refreshToken) {
      try {
        await this.refresh();
        return this.request(url, options);
      } catch {
        this.logout();
        window.location.reload();
        throw new Error('会话已过期，请重新登录');
      }
    }
    return res.json();
  }

  // ── System ───────────────────────────────────────────────

  async getStatus(): Promise<SystemStatus | null> {
    try {
      return await this.request<SystemStatus>(`${this.base}/status`);
    } catch { return null; }
  }

  async execute(command: string, lane?: string): Promise<ExecuteResult> {
    return this.request<ExecuteResult>(`${this.base}/execute`, {
      method: 'POST',
      body: JSON.stringify({ command, lane }),
    });
  }

  async getHealth(): Promise<HealthReport | null> {
    try {
      return await this.request<HealthReport>(`${this.base}/health`);
    } catch { return null; }
  }

  async getLLMStats(): Promise<LLMStats | null> {
    try {
      return await this.request<LLMStats>(`${this.base}/llm/stats`);
    } catch { return null; }
  }

  async getPaymentStats(): Promise<unknown | null> {
    try {
      return await this.request<unknown>(`${this.base}/payments/stats`);
    } catch { return null; }
  }

  async approvePayment(paymentId: string): Promise<boolean> {
    const res = await fetch(`${this.base}/payments/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader() },
      body: JSON.stringify({ paymentId }),
    });
    return res.ok;
  }

  async rejectPayment(paymentId: string, reason: string): Promise<boolean> {
    const res = await fetch(`${this.base}/payments/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeader() },
      body: JSON.stringify({ paymentId, reason }),
    });
    return res.ok;
  }

  // ── Skill 商店 ─────────────────────────────────────────────

  async getSkills(filters?: { source?: string; category?: string; search?: string }): Promise<{ skills: Skill[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.source) params.set('source', filters.source);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.search) params.set('search', filters.search);
    return this.request(`${this.base}/skills?${params}`);
  }

  async installSkill(skillId: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/skills/${skillId}/install`, { method: 'POST' });
  }

  async uninstallSkill(skillId: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/skills/${skillId}/install`, { method: 'DELETE' });
  }

  async rewardSkill(skillId: string, amount: number): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.base}/skills/${skillId}/reward`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  async createCustomSkill(input: {
    name: string; description: string; longDescription?: string;
    category: string; tags: string[]; instructions?: string; icon?: string;
  }): Promise<{ skill: Skill }> {
    return this.request(`${this.base}/skills`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ── 自定义 Agent ────────────────────────────────────────────

  async getCustomAgents(): Promise<{ agents: CustomAgent[]; total: number }> {
    return this.request(`${this.base}/agents/custom`);
  }

  async createAgentFromNaturalLanguage(naturalLanguage: string): Promise<{ agent: CustomAgent; message: string }> {
    return this.request(`${this.base}/agents/custom/from-text`, {
      method: 'POST',
      body: JSON.stringify({ naturalLanguage }),
    });
  }

  async updateCustomAgent(agentId: string, updates: Partial<CustomAgent>): Promise<{ agent: CustomAgent }> {
    return this.request(`${this.base}/agents/custom/${agentId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCustomAgent(agentId: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/agents/custom/${agentId}`, { method: 'DELETE' });
  }

  // ── MCP 连接器 ─────────────────────────────────────────────
  async getMCPTemplates(): Promise<{ templates: MCPServerTemplate[] }> {
    return this.request(`${this.base}/mcp/templates`);
  }

  async getMCPServers(): Promise<{ servers: MCPServer[] }> {
    return this.request(`${this.base}/mcp/servers`);
  }

  async createMCPServer(templateId: string, name: string, config: Record<string, string>): Promise<{ server: MCPServer }> {
    return this.request(`${this.base}/mcp/servers`, {
      method: 'POST',
      body: JSON.stringify({ templateId, name, config }),
    });
  }

  async updateMCPServer(id: string, updates: Partial<MCPServer>): Promise<{ server: MCPServer }> {
    return this.request(`${this.base}/mcp/servers/${id}`, { method: 'PATCH', body: JSON.stringify(updates) });
  }

  async deleteMCPServer(id: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/mcp/servers/${id}`, { method: 'DELETE' });
  }

  async testMCPConnection(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.base}/mcp/servers/${id}/test`, { method: 'POST' });
  }

  // ── AI 大模型市场 ─────────────────────────────────────────
  async getModels(filters?: { provider?: string; capability?: string; tier?: string; search?: string }): Promise<{ models: AIModel[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.provider) params.set('provider', filters.provider);
    if (filters?.capability) params.set('capability', filters.capability);
    if (filters?.tier) params.set('tier', filters.tier);
    if (filters?.search) params.set('search', filters.search);
    return this.request(`${this.base}/models?${params}`);
  }

  async getModelStats(): Promise<any> {
    return this.request(`${this.base}/models/stats`);
  }

  async getModelProviders(): Promise<any> {
    return this.request(`${this.base}/models/providers`);
  }

  async connectModel(id: string, apiKey: string): Promise<{ model: AIModel; message: string }> {
    return this.request(`${this.base}/models/${id}/connect`, {
      method: 'PATCH',
      body: JSON.stringify({ apiKey }),
    });
  }

  async disconnectModel(id: string): Promise<{ model: AIModel }> {
    return this.request(`${this.base}/models/${id}/disconnect`, { method: 'PATCH' });
  }

  // ── Ollama 本地大模型 ─────────────────────────────────────

  async getOllamaStatus(): Promise<{
    available: boolean;
    models: string[];
    endpoint: string;
    docsUrl?: string;
    installHint?: string | null;
  }> {
    return this.request(`${this.base}/ollama/status`);
  }

  async getOllamaModels(): Promise<{ available: boolean; models: string[]; endpoint: string }> {
    return this.request(`${this.base}/ollama/models`);
  }

  async startOllama(useDocker?: boolean): Promise<{ success: boolean; message: string }> {
    return this.request(`${this.base}/ollama/start`, {
      method: 'POST',
      body: JSON.stringify({ useDocker }),
    });
  }

  // ── 火豹 API 中转网关 ─────────────────────────────────────

  async getHuobaoStatus(): Promise<{
    available: boolean;
    apiKeyConfigured: boolean;
    endpoint: string;
    docsUrl?: string;
    signupUrl?: string;
  }> {
    return this.request(`${this.base}/huobao/status`);
  }

  async getHuobaoModels(): Promise<unknown> {
    return this.request(`${this.base}/huobao/models`);
  }

  // ── LLM 智能路由状态 ──────────────────────────────────────

  // ── 订阅系统 ──────────────────────────────────────────────

  async getSubscriptionPlans(): Promise<{ plans: SubscriptionPlan[]; company: CompanyInfo }> {
    return this.request(`${this.base}/subscription/plans`);
  }

  async getSubscriptionPlan(planId: string): Promise<{ plan: SubscriptionPlan; company: CompanyInfo }> {
    return this.request(`${this.base}/subscription/plans/${planId}`);
  }

  async getCurrentSubscription(): Promise<{ active: SubscriptionRecord | null; history: SubscriptionRecord[]; total: number }> {
    return this.request(`${this.base}/subscription/current`);
  }

  async createSubscriptionOrder(params: {
    planId: string;
    billingCycle: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
    paymentMethod: 'wechat' | 'alipay' | 'bank_transfer';
  }): Promise<{ order: SubscriptionOrder; company?: CompanyInfo }> {
    return this.request(`${this.base}/subscription/orders`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async cancelSubscriptionOrder(orderId: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/subscription/orders/${orderId}`, { method: 'DELETE' });
  }

  async getPendingSubscriptions(): Promise<{ orders: SubscriptionOrder[] }> {
    return this.request(`${this.base}/subscription/pending`);
  }

  async approveSubscription(orderId: string, note?: string): Promise<{ success: boolean; subscription: SubscriptionRecord }> {
    return this.request(`${this.base}/subscription/approve`, {
      method: 'POST',
      body: JSON.stringify({ orderId, note }),
    });
  }

  async rejectSubscription(orderId: string, reason: string): Promise<{ success: boolean }> {
    return this.request(`${this.base}/subscription/reject`, {
      method: 'POST',
      body: JSON.stringify({ orderId, reason }),
    });
  }

  async getSubscriptionStats(): Promise<SubscriptionStats> {
    return this.request(`${this.base}/subscription/stats`);
  }

  // ── LLM 智能路由状态 ──────────────────────────────────────

  async getLLMRouting(): Promise<{
    simulateMode: boolean;
    concurrentRequests: number;
    lowVolumeThreshold: number;
    primaryProvider: string;
    primaryModel: string;
    providers: Record<string, unknown>;
    routeStrategy: { description: string; rules: Array<{ condition: string; engine: string; cost: string; latency: string }> };
    huobaoSignupUrl?: string;
    ollamaInstallUrl?: string;
  }> {
    return this.request(`${this.base}/llm/routing`);
  }

  // ── Anthropic API Key 管理 ────────────────────────────────
  // 获取 API Key 详情
  async getAnthropicApiKey(apiKeyId: string): Promise<{
    success: boolean;
    data?: {
      id: string;
      created_at: string;
      created_by: { id: string; type: string };
      name: string;
      partial_key_hint: string;
      status: 'active' | 'inactive' | 'archived';
      type: 'api_key';
      workspace_id: string | null;
    };
    error?: string;
    hint?: string;
  }> {
    return this.request(`${this.base}/anthropic/api-key/${encodeURIComponent(apiKeyId)}`);
  }

  // 列出所有 API Keys
  async listAnthropicApiKeys(): Promise<{
    success: boolean;
    keys?: Array<{
      id: string;
      created_at: string;
      created_by: { id: string; type: string };
      name: string;
      partial_key_hint: string;
      status: 'active' | 'inactive' | 'archived';
      type: 'api_key';
      workspace_id: string | null;
    }>;
    error?: string;
    hint?: string;
  }> {
    return this.request(`${this.base}/anthropic/api-keys`);
  }

  // ══════════════════════════════════════════════════════════════
  // HeyGen LiveAvatar API
  // 实时数字人 WebRTC 流
  // ══════════════════════════════════════════════════════════════

  // 获取 LiveAvatar 状态
  async getLiveAvatarStatus(): Promise<{
    configured: boolean;
    apiBase: string;
    docsUrl: string;
    features: string[];
    pricing: string;
    models: string[];
  }> {
    return this.request(`${this.base}/liveavatar/status`);
  }

  // 创建 LiveAvatar 会话（获取 Embed URL）
  async createLiveAvatarSession(params: {
    avatarId?: string;
    isSandbox?: boolean;
    mode?: 'full' | 'lite';
  }): Promise<{
    success: boolean;
    sessionId: string;
    embedUrl: string;
    embedScript: string;
    mode: string;
    isSandbox: boolean;
    expiresIn: string;
    message: string;
  }> {
    return this.request(`${this.base}/liveavatar/session`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // 获取可用数字人列表
  async getLiveAvatarAvatars(): Promise<{
    avatars: Array<{
      id: string;
      name: string;
      thumbnail: string | null;
      is_available: boolean;
      type: string;
    }>;
    total: number;
    note?: string;
  }> {
    return this.request(`${this.base}/liveavatar/avatars`);
  }

  // ── AI 短剧工作室 ────────────────────────────────────────
  async getStudioScripts(): Promise<{ scripts: StudioScript[] }> {
    return this.request(`${this.base}/v1/studio/drama/scripts`);
  }

  async getStudioScript(id: string): Promise<StudioScript> {
    return this.request(`${this.base}/v1/studio/drama/scripts/${id}`);
  }

  async createStudioScript(params: {
    genre: string;
    template: string;
    title: string;
    synopsis?: string;
    characterCount?: number;
    shotCount?: number;
  }): Promise<StudioScript> {
    return this.request(`${this.base}/v1/studio/drama/scripts/generate`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async createTemplateScript(params: {
    template: string;
    title: string;
    genre: string;
    extraShots?: number;
  }): Promise<StudioScript> {
    return this.request(`${this.base}/v1/studio/drama/scripts/template`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async updateStudioScript(id: string, patch: Partial<StudioScript>): Promise<StudioScript> {
    return this.request(`${this.base}/v1/studio/drama/scripts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }

  async getStudioCharacters(): Promise<{ characters: StudioCharacter[] }> {
    return this.request(`${this.base}/v1/studio/drama/characters`);
  }

  async createStudioCharacter(data: Omit<StudioCharacter, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudioCharacter> {
    return this.request(`${this.base}/v1/studio/drama/characters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteStudioCharacter(id: string): Promise<void> {
    return this.request(`${this.base}/v1/studio/drama/characters/${id}`, { method: 'DELETE' });
  }

  async updateStudioShot(shotId: string, patch: Partial<StudioShot>): Promise<StudioShot> {
    return this.request(`${this.base}/v1/studio/drama/shots/${shotId}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  }
}

// ==================== Skill / Agent 类型 ====================

export interface Skill {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  source: 'official' | 'community' | 'custom';
  category: string;
  author?: { userId: string; displayName: string; avatar?: string };
  tags: string[];
  icon?: string;
  installCount: number;
  rating: number;
  reviewCount: number;
  rewardPool: number;
  rewardCount: number;
  isInstalled: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomAgent {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  instructions?: string;
  skills: string[];
  icon?: string;
  color?: string;
  isActive: boolean;
  stats: { totalChats: number; totalMessages: number; createdAt: string; lastUsed?: string };
  createdAt: string;
  updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// MCP 服务器 & AI 大模型市场
// ════════════════════════════════════════════════════════════════════

export interface MCPServerTemplate {
  id: string; name: string; description: string; category: string; icon: string;
  fields: Array<{ key: string; label: string; type: string; placeholder?: string; required: boolean; options?: string[]; helpText?: string }>;
  docsUrl?: string;
}

export interface MCPServer {
  id: string; name: string; description: string; category: string; icon: string;
  endpoint?: string; authToken?: string; apiKey?: string;
  status: 'connected' | 'disconnected' | 'connecting' | 'error';
  lastConnected?: string; errorMessage?: string;
  createdAt: string; updatedAt: string;
}

export interface AIModel {
  id: string; name: string; provider: string; providerName: string;
  capabilities: string[]; description: string;
  pricePer1KInput?: number; pricePer1KOutput?: number;
  contextWindow: number; latency?: string; quality?: string;
  isEnabled: boolean; isConnected: boolean; apiKeyConfigured: boolean;
  tier: 'free' | 'popular' | 'pro' | 'enterprise';
  usageCount: number; rating: number; tags: string[];
  createdAt: string; updatedAt: string;
}

// ════════════════════════════════════════════════════════════════════
// 订阅系统
// ════════════════════════════════════════════════════════════════════

export interface SubscriptionPlan {
  id: string;
  tier: 'personal' | 'team' | 'enterprise';
  name: string;
  nameEn: string;
  description: string;
  features: string[];
  tokenQuota: string;
  price: { monthly: number; quarterly: number; halfyearly: number; yearly: number };
  color: string;
  gradient: string;
  popular?: boolean;
  enterpriseMinMonthly?: number;
}

export interface CompanyInfo {
  name: string;
  bankAccount: string;
  bank: string;
  legalPerson: string;
  unifiedCode: string;
}

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  userId: string;
  planId: string;
  tier: 'personal' | 'team' | 'enterprise';
  billingCycle: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
  amount: number;
  currency: 'CNY';
  status: 'active' | 'expired' | 'cancelled' | 'trial' | 'pending';
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  paymentMethod: 'wechat' | 'alipay' | 'bank_transfer' | 'unknown';
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionOrder {
  id: string;
  orderNo: string;
  tenantId: string;
  userId: string;
  planId: string;
  tier: 'personal' | 'team' | 'enterprise';
  billingCycle: 'monthly' | 'quarterly' | 'halfyearly' | 'yearly';
  amount: number;
  currency: 'CNY';
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: 'wechat' | 'alipay' | 'bank_transfer';
  bankInfo?: CompanyInfo;
  expiresAt: string;
  createdAt: string;
  paidAt?: string;
}

export interface SubscriptionStats {
  total: number;
  active: number;
  expired: number;
  pending: number;
  revenue: number;
  byTier: Record<string, number>;
  byCycle: Record<string, number>;
}


// ── AI 短剧工作室 类型 ─────────────────────────────────────
export type DramaGenre = '霸总' | '甜宠' | '重生' | '逆袭' | '穿越' | '悬疑' | '复仇' | '职场' | '校园' | '玄幻' | '搞笑' | '科幻';
export type ScriptTemplateType = '爽文逆袭' | '霸总甜宠' | '复仇打脸' | '职场升职' | '穿越逆天' | '重生复仇' | '悬疑反转' | '搞笑段子';
export type VideoPlatform = '可灵' | '即梦' | 'Pika' | 'Seedance' | '即梦-图生视频' | '可灵-图生视频';

export interface StudioCharacter {
  id: string;
  name: string;
  age?: string;
  gender?: '男' | '女' | '中性';
  personality?: string;
  appearance?: string;
  role: '主角' | '配角' | '反派' | 'NPC';
  avatarPrompt?: string;
  negativePrompt?: string;
  voiceId?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudioShot {
  id: string;
  scriptId: string;
  seq: number;
  scene: string;
  camera: '特写' | '近景' | '中景' | '远景' | '航拍' | '手持跟拍' | '固定';
  angle: '平视' | '仰拍' | '俯拍' | '过肩' | '荷兰角';
  duration?: number;
  characterIds: string[];
  action: string;
  dialogue?: string;
  visualPrompt: string;
  negativePrompt?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoStatus: 'idle' | 'generating' | 'done' | 'failed';
  videoError?: string;
  model?: VideoPlatform;
  createdAt: string;
  updatedAt: string;
}

export interface StudioScript {
  id: string;
  title: string;
  genre: DramaGenre;
  template: ScriptTemplateType;
  totalShots: number;
  targetDuration?: number;
  synopsis?: string;
  tags: string[];
  characters: StudioCharacter[];
  shots: StudioShot[];
  status: 'draft' | 'scripting' | 'shooting' | 'done';
  createdAt: string;
  updatedAt: string;
}
export const api = new ApiClient(API_BASE);
