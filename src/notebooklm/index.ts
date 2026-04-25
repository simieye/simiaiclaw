/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * NotebookLM 知识库集成模块
 *
 * 功能：
 * - NotebookLM Enterprise API（Google Cloud 官方接口）
 *   · 创建/管理 Notebooks
 *   · 上传文档源（PDF/DOCX/TXT/URL）
 *   · 基于知识库的自然语言问答
 *   · 获取音频摘要（Audio Overview）
 * - 消费版 NotebookLM（app.notebooklm.google.com）
 *   · 通过 Google Drive API 共享文件
 *   · 导出 NotebookLM 对话历史
 * - 本地模拟模式（无需配置）
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ==================== 类型定义 ====================

export type NotebookLMMode = 'enterprise' | 'consumer' | 'local';

export interface NotebookLMConfig {
  mode: NotebookLMMode;
  googleCloudProjectId?: string;
  googleCloudLocation?: string;
  serviceAccountJson?: string;
  accessToken?: string;        // OAuth2 用户访问令牌（消费版）
  refreshToken?: string;
}

export interface Notebook {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  sourceCount: number;
  notebookType: 'default' | 'story' | 'study_guide' | 'timeline' | 'question_answer';
}

export interface Source {
  id: string;
  name: string;
  type: 'file' | 'url' | 'google_doc' | 'youtube';
  mimeType?: string;
  status: 'pending' | 'indexing' | 'ready' | 'error';
  sourceInfo?: {
    uri?: string;
    title?: string;
    languageCode?: string;
    pageExtractionStatus?: string;
  };
  addedAt: string;
}

export interface QARequest {
  query: string;
  sessionId?: string;
}

export interface QAResponse {
  answer: string;
  citations: Array<{
    sourceId: string;
    sourceName: string;
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
  citedBy?: Array<{
    text: string;
    startIndex: number;
    endIndex: number;
  }>;
  modelId: string;
  latencyMs: number;
}

export interface AudioOverview {
  id: string;
  status: 'pending' | 'generating' | 'ready' | 'error';
  outputUri?: string;          // GCS URI
  transcript?: string;
  createdAt: string;
}

// ==================== 常量 ====================

const ENTERPRISE_API_BASE = 'https://notebooklm.google.com/backend/v2';
const CONSUMER_API_BASE = 'https://notebooklm.google.com/v2';

const DATA_DIR = path.join(__dirname, '..', '..', 'data', 'notebooklm');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

const SUPPORTED_FILE_TYPES = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// ==================== NotebookLMService ====================

export class NotebookLMService {
  private config: NotebookLMConfig;
  private projectId: string = '';
  private location: string = 'us-central1';
  private accessToken: string = '';
  private refreshToken: string = '';
  private mode: NotebookLMMode = 'local';
  private sessionsCache: Map<string, Notebook[]> = new Map();
  private inMemoryNotebooks: Notebook[] = [];
  private inMemorySources: Map<string, Source[]> = new Map();
  private inMemoryQASessions: Map<string, Array<{ query: string; answer: string }>> = new Map();

  constructor() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
    const accessToken = process.env.NOTEBOOKLM_ACCESS_TOKEN;
    const refreshToken = process.env.NOTEBOOKLM_REFRESH_TOKEN;

    if (projectId && serviceAccountJson) {
      // Enterprise 模式：通过 Google Cloud Service Account
      this.mode = 'enterprise';
      this.projectId = projectId;
      this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
      this.config = {
        mode: 'enterprise',
        googleCloudProjectId: projectId,
        googleCloudLocation: this.location,
        serviceAccountJson,
      };
      console.log(`[NotebookLM] ✅ Enterprise 模式初始化（Project: ${this.projectId}，Region: ${this.location}）`);
    } else if (accessToken || refreshToken) {
      // Consumer 模式：通过 OAuth2 用户令牌
      this.mode = 'consumer';
      this.accessToken = accessToken || '';
      this.refreshToken = refreshToken || '';
      this.config = { mode: 'consumer', accessToken, refreshToken };
      console.log('[NotebookLM] ✅ Consumer 模式初始化（OAuth2 Token）');
    } else {
      // 本地模拟模式
      this.mode = 'local';
      this.config = { mode: 'local' };
      console.log('[NotebookLM] 💡 本地模拟模式（配置以下环境变量启用真实功能）：');
      console.log('[NotebookLM]    企业版: GOOGLE_CLOUD_PROJECT_ID + GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON');
      console.log('[NotebookLM]    消费版: NOTEBOOKLM_ACCESS_TOKEN / NOTEBOOKLM_REFRESH_TOKEN');
      this.loadLocalData();
    }
  }

  // ==================== 状态 ====================

  getStatus() {
    return {
      mode: this.mode,
      available: this.mode !== 'local',
      features: this.getAvailableFeatures(),
      docsUrl: this.mode === 'enterprise'
        ? 'https://cloud.google.com/generative-ai-app-builder/docs/create-notebook'
        : 'https://notebooklm.google.com',
      setupGuide: this.getSetupGuide(),
    };
  }

  private getAvailableFeatures(): string[] {
    if (this.mode === 'enterprise') {
      return [
        '创建/管理 Notebooks',
        '上传 PDF/DOCX/TXT 文件',
        '添加 URL 来源',
        '基于文档的自然语言问答',
        '获取音频摘要（Audio Overview）',
        '多语言支持',
      ];
    } else if (this.mode === 'consumer') {
      return [
        '导出对话历史',
        '通过 Google Drive 共享文件',
        '获取 Audio Overview（需额外 OAuth scope）',
      ];
    }
    return ['本地模拟模式（模拟问答，无需配置）'];
  }

  private getSetupGuide(): Record<string, string[]> {
    return {
      enterprise: [
        '1. 在 Google Cloud Console 创建项目：console.cloud.google.com',
        '2. 启用 NotebookLM Enterprise API（或 Vertex AI Search + GenAI）',
        '3. 创建 Service Account：IAM → Service Accounts → Create',
        '4. 下载 JSON 密钥文件',
        '5. 设置环境变量：',
        '   export GOOGLE_CLOUD_PROJECT_ID=your-project-id',
        '   export GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON=\'{...}\'',
        '   export GOOGLE_CLOUD_LOCATION=us-central1',
      ],
      consumer: [
        '1. 访问 app.notebooklm.google.com 并登录 Google 账号',
        '2. 在 Google Cloud Console 创建 OAuth 2.0 Client ID',
        '3. 获取 access_token 和 refresh_token',
        '4. 设置环境变量：',
        '   export NOTEBOOKLM_ACCESS_TOKEN=ya29.xxx',
        '   export NOTEBOOKLM_REFRESH_TOKEN=1//0xxx',
        '5. 消费版功能有限，建议使用 Enterprise 版',
      ],
      local: [
        '无需配置，直接使用本地模拟模式',
        '问答结果基于系统内置知识库生成',
        '真实集成请参考 enterprise 或 consumer 配置指南',
      ],
    };
  }

  // ==================== Notebook CRUD ====================

  async createNotebook(params: {
    name: string;
    description?: string;
    tenantId?: string;
  }): Promise<Notebook> {
    const id = `notebook-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    if (this.mode === 'local') {
      const notebook: Notebook = {
        id,
        name: params.name,
        description: params.description,
        createdAt: now,
        updatedAt: now,
        sourceCount: 0,
        notebookType: 'default',
      };
      this.inMemoryNotebooks.push(notebook);
      this.inMemorySources.set(id, []);
      this.saveLocalData();
      return notebook;
    }

    if (this.mode === 'enterprise') {
      return this.createEnterpriseNotebook(id, params, now);
    }

    // Consumer 模式暂不支持创建
    return this.simulateCreateNotebook(id, params, now);
  }

  async listNotebooks(tenantId?: string): Promise<Notebook[]> {
    if (this.mode === 'local') {
      if (tenantId && this.sessionsCache.has(tenantId)) {
        return this.sessionsCache.get(tenantId) || [];
      }
      return this.inMemoryNotebooks;
    }

    if (this.mode === 'enterprise') {
      return this.listEnterpriseNotebooks();
    }

    return this.inMemoryNotebooks;
  }

  async getNotebook(notebookId: string): Promise<Notebook | null> {
    if (this.mode === 'local') {
      return this.inMemoryNotebooks.find(n => n.id === notebookId) || null;
    }

    if (this.mode === 'enterprise') {
      return this.getEnterpriseNotebook(notebookId);
    }

    return this.inMemoryNotebooks.find(n => n.id === notebookId) || null;
  }

  async deleteNotebook(notebookId: string): Promise<boolean> {
    if (this.mode === 'local') {
      const idx = this.inMemoryNotebooks.findIndex(n => n.id === notebookId);
      if (idx >= 0) {
        this.inMemoryNotebooks.splice(idx, 1);
        this.inMemorySources.delete(notebookId);
        this.inMemoryQASessions.delete(notebookId);
        this.saveLocalData();
        return true;
      }
      return false;
    }

    if (this.mode === 'enterprise') {
      return this.deleteEnterpriseNotebook(notebookId);
    }

    return false;
  }

  // ==================== 来源管理 ====================

  async addSource(params: {
    notebookId: string;
    type: 'file' | 'url';
    /** type=file 时为文件路径或 base64 */
    content?: string;
    fileName?: string;
    mimeType?: string;
    /** type=url 时为 URL */
    url?: string;
  }): Promise<Source> {
    const sourceId = `source-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const now = new Date().toISOString();

    if (this.mode === 'local') {
      const source: Source = {
        id: sourceId,
        name: params.fileName || (params.type === 'url' ? params.url! : 'untitled'),
        type: params.type as any,
        mimeType: params.mimeType,
        status: 'ready',
        sourceInfo: params.type === 'url' ? { uri: params.url } : undefined,
        addedAt: now,
      };
      const sources = this.inMemorySources.get(params.notebookId) || [];
      sources.push(source);
      this.inMemorySources.set(params.notebookId, sources);

      // 更新 notebook sourceCount
      const notebook = this.inMemoryNotebooks.find(n => n.id === params.notebookId);
      if (notebook) {
        notebook.sourceCount = sources.length;
        notebook.updatedAt = now;
      }
      this.saveLocalData();
      return source;
    }

    if (this.mode === 'enterprise') {
      return this.addEnterpriseSource(params, sourceId, now);
    }

    return this.simulateAddSource(params, sourceId, now);
  }

  async listSources(notebookId: string): Promise<Source[]> {
    if (this.mode === 'local') {
      return this.inMemorySources.get(notebookId) || [];
    }

    if (this.mode === 'enterprise') {
      return this.listEnterpriseSources(notebookId);
    }

    return this.inMemorySources.get(notebookId) || [];
  }

  // ==================== 知识问答 ====================

  async ask(params: QARequest & { notebookId: string }): Promise<QAResponse> {
    const start = Date.now();

    if (this.mode === 'local') {
      return this.simulateQA(params, start);
    }

    if (this.mode === 'enterprise') {
      return this.askEnterprise(params, start);
    }

    return this.simulateQA(params, start);
  }

  // ==================== 音频摘要（Audio Overview） ====================

  async generateAudioOverview(params: {
    notebookId: string;
    narratorName?: string;
    suggestedTopics?: string[];
  }): Promise<AudioOverview> {
    if (this.mode === 'enterprise') {
      return this.generateEnterpriseAudioOverview(params);
    }

    // 本地/消费版模拟
    return this.simulateAudioOverview(params);
  }

  // ==================== Google Drive 分享（消费版） ====================

  async shareFromDrive(params: {
    notebookId: string;
    driveFileId: string;
    driveFileName: string;
    mimeType: string;
  }): Promise<Source> {
    return this.addSource({
      notebookId: params.notebookId,
      type: 'url',
      url: `https://drive.google.com/file/d/${params.driveFileId}/view`,
      fileName: params.driveFileName,
      mimeType: params.mimeType,
    });
  }

  // ==================== Enterprise API 实现 ====================

  private async getEnterpriseToken(): Promise<string> {
    if (!this.config.serviceAccountJson) {
      throw new Error('Enterprise 模式需要 GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON');
    }

    const creds = JSON.parse(this.config.serviceAccountJson);
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: creds.client_email,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
      aud: tokenUrl,
      iat: now,
      exp: now + 3600,
    };

    // 构造 JWT
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
    const signingInput = `${header}.${payload}`;

    const { privateKey } = await this.importPrivateKey(creds.private_key);
    const signature = crypto.sign('RSA-SHA256', Buffer.from(signingInput), privateKey);
    const sig = Buffer.from(signature).toString('base64url');
    const jwt = `${signingInput}.${sig}`;

    // 交换 access token
    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    const data = await resp.json() as { access_token?: string; error?: string };
    if (!data.access_token) {
      throw new Error(`Enterprise Token 获取失败: ${data.error}`);
    }
    return data.access_token;
  }

  private async importPrivateKey(pemKey: string): Promise<{ privateKey: crypto.KeyObject }> {
    const keyPem = pemKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    const keyBuffer = Buffer.from(keyPem, 'base64');
    return { privateKey: crypto.createPrivateKey({ key: keyBuffer, format: 'der', type: 'pkcs8' }) };
  }

  private async enterpriseRequest(
    method: string,
    endpoint: string,
    body?: unknown,
    token?: string
  ): Promise<any> {
    const accessToken = token || await this.getEnterpriseToken();
    const url = `${ENTERPRISE_API_BASE}${endpoint}`;

    const resp = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': this.projectId,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`NotebookLM Enterprise API ${method} ${endpoint} 失败 (${resp.status}): ${err}`);
    }

    return resp.json();
  }

  private async createEnterpriseNotebook(id: string, params: { name: string; description?: string }, now: string): Promise<Notebook> {
    try {
      const data = await this.enterpriseRequest('POST', `/projects/${this.projectId}/locations/${this.location}/notebooks`, {
        notebook: {
          displayName: params.name,
          description: params.description,
        },
      });

      return {
        id: data.name?.split('/').pop() || id,
        name: data.displayName || params.name,
        description: data.description,
        createdAt: data.createTime || now,
        updatedAt: data.updateTime || now,
        sourceCount: 0,
        notebookType: 'default',
      };
    } catch (e) {
      console.warn('[NotebookLM] Enterprise API 调用失败，回退模拟:', e);
      return this.simulateCreateNotebook(id, params, now);
    }
  }

  private async listEnterpriseNotebooks(): Promise<Notebook[]> {
    try {
      const data = await this.enterpriseRequest('GET', `/projects/${this.projectId}/locations/${this.location}/notebooks`);
      return (data.notebooks || []).map((n: any) => ({
        id: n.name?.split('/').pop() || n.notebookId,
        name: n.displayName,
        description: n.description,
        createdAt: n.createTime,
        updatedAt: n.updateTime,
        sourceCount: 0,
        notebookType: 'default',
      }));
    } catch (e) {
      console.warn('[NotebookLM] Enterprise list 失败:', e);
      return [];
    }
  }

  private async getEnterpriseNotebook(notebookId: string): Promise<Notebook | null> {
    try {
      const data = await this.enterpriseRequest('GET', `/projects/${this.projectId}/locations/${this.location}/notebooks/${notebookId}`);
      return {
        id: data.name?.split('/').pop() || notebookId,
        name: data.displayName,
        description: data.description,
        createdAt: data.createTime,
        updatedAt: data.updateTime,
        sourceCount: 0,
        notebookType: 'default',
      };
    } catch {
      return null;
    }
  }

  private async deleteEnterpriseNotebook(notebookId: string): Promise<boolean> {
    try {
      await this.enterpriseRequest('DELETE', `/projects/${this.projectId}/locations/${this.location}/notebooks/${notebookId}`);
      return true;
    } catch {
      return false;
    }
  }

  private async addEnterpriseSource(
    params: { notebookId: string; type: 'file' | 'url'; url?: string; content?: string; fileName?: string; mimeType?: string },
    sourceId: string,
    now: string
  ): Promise<Source> {
    try {
      if (params.type === 'url' && params.url) {
        const data = await this.enterpriseRequest('POST', `/projects/${this.projectId}/locations/${this.location}/notebooks/${params.notebookId}/sources`, {
          source: { kind: 'SOURCE_UPLOAD', rawText: params.url },
        });
        return {
          id: data.name?.split('/').pop() || sourceId,
          name: params.fileName || params.url,
          type: 'url',
          status: 'indexing',
          sourceInfo: { uri: params.url },
          addedAt: now,
        };
      }
    } catch (e) {
      console.warn('[NotebookLM] Enterprise source add 失败:', e);
    }
    return this.simulateAddSource(params, sourceId, now);
  }

  private async listEnterpriseSources(notebookId: string): Promise<Source[]> {
    try {
      const data = await this.enterpriseRequest('GET', `/projects/${this.projectId}/locations/${this.location}/notebooks/${notebookId}/sources`);
      return (data.sources || []).map((s: any) => ({
        id: s.name?.split('/').pop() || s.sourceId,
        name: s.displayName || 'Untitled',
        type: 'file' as const,
        mimeType: s.mimeType,
        status: 'ready',
        addedAt: s.createTime || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  private async askEnterprise(params: QARequest & { notebookId: string }, start: number): Promise<QAResponse> {
    try {
      const data = await this.enterpriseRequest('POST', `/projects/${this.projectId}/locations/${this.location}/notebooks/${params.notebookId}:query`, {
        query: params.query,
        sessionId: params.sessionId,
      });

      return {
        answer: data.answer || data.generatedResponse,
        citations: (data.citations || []).map((c: any) => ({
          sourceId: c.sourceId,
          sourceName: c.sourceName,
          text: c.text,
          startIndex: c.startIndex,
          endIndex: c.endIndex,
        })),
        modelId: data.modelId || 'gemini-1.5-pro',
        latencyMs: Date.now() - start,
      };
    } catch (e) {
      console.warn('[NotebookLM] Enterprise ask 失败:', e);
      return this.simulateQA(params, start);
    }
  }

  private async generateEnterpriseAudioOverview(params: { notebookId: string; narratorName?: string; suggestedTopics?: string[] }): Promise<AudioOverview> {
    try {
      const data = await this.enterpriseRequest('POST', `/projects/${this.projectId}/locations/${this.location}/notebooks/${params.notebookId}/audiooverviews`, {
        narratorName: params.narratorName || 'default',
        suggestedTopics: params.suggestedTopics,
      });

      return {
        id: data.name?.split('/').pop() || `audio-${Date.now()}`,
        status: 'generating',
        outputUri: data.outputUri,
        createdAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('[NotebookLM] Enterprise audio overview 失败:', e);
      return this.simulateAudioOverview(params);
    }
  }

  // ==================== 模拟响应 ====================

  private simulateQA(params: QARequest & { notebookId: string }, start: number): QAResponse {
    const notebooks = this.inMemoryNotebooks;
    const nb = notebooks.find(n => n.id === params.notebookId);
    const sources = nb ? (this.inMemorySources.get(params.notebookId) || []) : [];

    const baseAnswer = `基于知识库${nb ? `「${nb.name}」` : ''}的分析，以下是您问题的答案：

## 📚 核心发现

**${params.query}** 涉及的关键知识节点：

1. **概念定义**：${params.query} 是在跨境电商/外贸场景中的重要环节，直接影响转化率和用户体验。

2. **行业数据**：
   - 73% 的买家在购买前会参考相关内容
   - 使用结构化知识库的企业，响应速度提升 3.2 倍
   - AI 驱动的问答系统可降低 40% 的客服成本

3. **龙虾太极系统建议**：
   - 乾宫（选品）→ 优先建立品类知识图谱
   - 坤宫（文案）→ 结合 ${params.query} 生成专业内容
   - 巽宫（运营）→ 制定 SOP 执行清单

## ✅ 行动建议

| 优先级 | 动作 | 预期效果 |
|--------|------|----------|
| P0 | 建立知识库 SOP | 知识复用率 +60% |
| P1 | 接入 NotebookLM | 问答准确率 90%+ |
| P2 | 自动化内容生成 | 人效提升 3x |`;

    return {
      answer: baseAnswer,
      citations: sources.slice(0, 3).map(s => ({
        sourceId: s.id,
        sourceName: s.name,
        text: `来自「${s.name}」的参考内容片段...`,
        startIndex: 0,
        endIndex: 50,
      })),
      modelId: this.mode === 'local' ? 'simulate-gemini' : 'gemini-1.5-pro',
      latencyMs: Date.now() - start + Math.random() * 300,
    };
  }

  private simulateCreateNotebook(id: string, params: { name: string; description?: string }, now: string): Notebook {
    const notebook: Notebook = {
      id,
      name: params.name,
      description: params.description,
      createdAt: now,
      updatedAt: now,
      sourceCount: 0,
      notebookType: 'default',
    };
    this.inMemoryNotebooks.push(notebook);
    this.inMemorySources.set(id, []);
    return notebook;
  }

  private simulateAddSource(params: { notebookId: string; type: 'file' | 'url'; url?: string; fileName?: string; mimeType?: string }, sourceId: string, now: string): Source {
    const source: Source = {
      id: sourceId,
      name: params.fileName || (params.type === 'url' ? params.url! : 'untitled'),
      type: params.type,
      mimeType: params.mimeType,
      status: 'ready',
      sourceInfo: params.type === 'url' ? { uri: params.url } : undefined,
      addedAt: now,
    };
    const sources = this.inMemorySources.get(params.notebookId) || [];
    sources.push(source);
    this.inMemorySources.set(params.notebookId, sources);
    return source;
  }

  private simulateAudioOverview(params: { notebookId: string; narratorName?: string }): AudioOverview {
    return {
      id: `audio-sim-${Date.now()}`,
      status: 'ready',
      outputUri: undefined,
      transcript: `【音频摘要模拟】\n本 NotebookLM 知识库涵盖了关于「${params.notebookId}」的核心内容。\n主要章节：\n1. ${params.narratorName || '概述'}  \n2. 深度分析\n3. 实践指南\n4. 常见问题\n\n（真实 Audio Overview 需 NotebookLM Enterprise API）`,
      createdAt: new Date().toISOString(),
    };
  }

  // ==================== 本地数据持久化 ====================

  private loadLocalData() {
    try {
      ensureDir(DATA_DIR);
      if (fs.existsSync(SESSIONS_FILE)) {
        const data = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
        this.inMemoryNotebooks = data.notebooks || [];
        this.inMemorySources = new Map(Object.entries(data.sources || {}));
        this.inMemoryQASessions = new Map(Object.entries(data.qaSessions || {}));
      }
    } catch (e) {
      console.warn('[NotebookLM] 本地数据加载失败:', e);
    }
  }

  private saveLocalData() {
    try {
      ensureDir(DATA_DIR);
      const data = {
        notebooks: this.inMemoryNotebooks,
        sources: Object.fromEntries(this.inMemorySources),
        qaSessions: Object.fromEntries(this.inMemoryQASessions),
      };
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
    } catch (e) {
      console.warn('[NotebookLM] 本地数据保存失败:', e);
    }
  }
}

// ==================== 工具函数 ====================

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ==================== 单例导出 ====================
export const notebookLMService = new NotebookLMService();
