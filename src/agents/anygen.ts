/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * AnyGen.io 外贸助手集成
 *
 * 集成字节跳动 AnyGen AI助手平台
 * https://www.anygen.io/assistant
 *
 * 三种助手类型：
 * - 客服助手：智能客服、FAQ自动生成、情感分析、多语言回复
 * - 业务助手：外贸B2B、询盘处理、报价生成、订单跟进
 * - 全能助手：复杂任务规划、多步骤执行、文档/报告生成
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================
// 类型定义
// ============================================================

export interface AnyGenConfig {
  /** 邀请码 */
  inviteCode?: string;
  /** API Endpoint */
  apiBase?: string;
  /** API Key（用户自备） */
  apiKey?: string;
  /** 默认助手类型 */
  defaultAssistant?: AnyGenAssistantType;
  /** 启用语音模式 */
  voiceEnabled?: boolean;
  /** 多语言支持 */
  languages?: string[];
}

export type AnyGenAssistantType = 'customer-service' | 'business' | 'universal';

/** 助手元数据 */
export interface AnyGenAssistant {
  id: string;
  type: AnyGenAssistantType;
  name: string;            // 显示名称
  icon: string;
  description: string;      // 功能描述
  tagline: string;          // 标语
  url: string;              // 访问地址
  capabilities: string[];    // 核心能力
  useCases: string[];       // 适用场景
  lanes: string[];          // 适配赛道
  color: string;            // 主题色
  bgGradient: string;       // 渐变背景
  status: 'online' | 'coming-soon';
}

/** 对话记录 */
export interface AnyGenConversation {
  id: string;
  assistantType: AnyGenAssistantType;
  tenantId: string;
  userId: string;
  title: string;
  messages: AnyGenMessage[];
  createdAt: Date;
  updatedAt: Date;
  tokenUsed: number;
  cost: number;
}

export interface AnyGenMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: string[];   // 附件URL列表
  model?: string;           // 使用的模型
  tokens?: number;
  createdAt: Date;
}

/** 调用结果 */
export interface AnyGenResponse {
  success: boolean;
  message: AnyGenMessage;
  model?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: string;
}

// ============================================================
// 助手配置常量
// ============================================================

export const ANYGEN_BASE_URL = 'https://www.anygen.io';
export const ANYGEN_ASSISTANT_URL = 'https://www.anygen.io/assistant';
export const ANYGEN_INVITE_CODE = '龙虾太极'; // 邀请码

export const ANYGEN_ASSISTANTS: AnyGenAssistant[] = [
  // ── 客服助手 ──────────────────────────────────────────────
  {
    id: 'anygen-customer-service',
    type: 'customer-service',
    name: '客服助手',
    icon: '🎧',
    tagline: '7×24 智能客服 · 多语言即时响应',
    description: '自动处理客户咨询、FAQ 生成、情感分析、差评逆转、投诉分类。多语言支持：英/德/法/西/葡/日/韩/阿拉伯',
    url: `${ANYGEN_ASSISTANT_URL}?mode=customer-service`,
    capabilities: [
      '智能意图识别（NLP）',
      '多语言自动翻译回复',
      'FAQ 自动生成与维护',
      '情感分析（正/负/中性）',
      '差评逆转话术生成',
      '投诉自动分类与升级',
      '工单路由与分配',
      '知识库检索增强',
    ],
    useCases: [
      'Amazon/eBay 买家消息处理',
      '独立站 Live Chat 接入',
      '社交媒体评论自动回复',
      '邮件工单分类与回复',
      '差评客户情感挽回',
      '多语言客服（TEMU/SHEIN）',
    ],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    color: '#6366f1',
    bgGradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    status: 'online',
  },

  // ── 业务助手 ──────────────────────────────────────────────
  {
    id: 'anygen-business',
    type: 'business',
    name: '业务助手',
    icon: '💼',
    tagline: '外贸B2B全链路 · 询盘到订单',
    description: '覆盖外贸全流程：询盘分析、报价生成、合同起草、客户背调、订单跟进、物流协调、风险预警',
    url: `${ANYGEN_ASSISTANT_URL}?mode=business`,
    capabilities: [
      '询盘智能分析 + 优先级排序',
      '多格式报价单自动生成（PDF/Excel）',
      '合同条款自动审查与风险提示',
      '客户背景深度调查（海关数据/信用）',
      '多语言商务函电起草',
      '展会邀约 + 样品管理',
      '订单进度跟踪与预警',
      '汇率/物流/关税实时查询',
    ],
    useCases: [
      'Alibaba/Made-in-China 询盘处理',
      '展会名片快速建档',
      '首次报价 + 阶梯报价生成',
      '信用证（LC）条款审查',
      'FOB/CIF 物流方案对比',
      '客户流失预警分析',
      '年度复购策略制定',
    ],
    lanes: ['外贸B2B'],
    color: '#f59e0b',
    bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    status: 'online',
  },

  // ── 全能助手 ──────────────────────────────────────────────
  {
    id: 'anygen-universal',
    type: 'universal',
    name: '全能助手',
    icon: '🧠',
    tagline: '复杂任务规划 · 多步骤自主执行',
    description: 'AnyGen 全能型智能体，可处理跨领域复杂任务。规划→执行→交付，端到端自动化。文档、PPT、报告、多媒体全覆盖',
    url: `${ANYGEN_ASSISTANT_URL}?mode=universal`,
    capabilities: [
      '复杂任务自动分解与规划',
      '多工具串联执行（网页搜索+文档生成）',
      'PPT/Word/PDF 多格式文档生成',
      '语音输入 + 语音播报',
      '图片/表格/截图 多模态理解',
      '品牌数字永生档案管理',
      '跨语言无障碍沟通',
      '任务进度实时追踪与汇报',
    ],
    useCases: [
      '海外市场调研报告生成',
      '新品上市全案策划',
      '投资人/客户演示 PPT',
      '年度复盘 + 战略规划报告',
      '多平台 Listing 批量创建',
      '跨境合规风险评估',
      '竞争对手深度分析报告',
      '团队 SOP 文档自动编写',
    ],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    color: '#10b981',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    status: 'online',
  },
];

// ============================================================
// AnyGen 服务类
// ============================================================

const DATA_DIR = path.join(process.cwd(), 'data', 'anygen');
const CONVOS_FILE = path.join(DATA_DIR, 'conversations.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

export class AnyGenService {
  private config: AnyGenConfig;

  constructor(config: Partial<AnyGenConfig> = {}) {
    this.config = {
      inviteCode: ANYGEN_INVITE_CODE,
      apiBase: 'https://api.anygen.io/v1',
      defaultAssistant: 'universal',
      voiceEnabled: true,
      languages: ['中文', 'English', 'Español', 'Français', 'Deutsch', '日本語', '한국어', 'العربية', 'Português'],
      ...config,
    };
  }

  // ── 公开接口 ──────────────────────────────────────────────

  /** 获取所有助手 */
  getAssistants(): AnyGenAssistant[] {
    return ANYGEN_ASSISTANTS;
  }

  /** 按类型获取助手 */
  getAssistant(type: AnyGenAssistantType): AnyGenAssistant | undefined {
    return ANYGEN_ASSISTANTS.find(a => a.type === type);
  }

  /** 获取助手快捷链接（含邀请码） */
  getAssistantInviteUrl(type: AnyGenAssistantType): string {
    const assistant = this.getAssistant(type);
    if (!assistant) return ANYGEN_ASSISTANT_URL;
    return `${assistant.url}&invite=${encodeURIComponent(this.config.inviteCode || ANYGEN_INVITE_CODE)}`;
  }

  /** 获取默认助手 */
  getDefaultAssistant(): AnyGenAssistant {
    return ANYGEN_ASSISTANTS.find(a => a.type === this.config.defaultAssistant) || ANYGEN_ASSISTANTS[2];
  }

  /** 新建对话 */
  createConversation(
    tenantId: string,
    userId: string,
    assistantType: AnyGenAssistantType,
    title?: string
  ): AnyGenConversation {
    const conversations = this.getAllConversations(tenantId);
    const conversation: AnyGenConversation = {
      id: uuidv4(),
      assistantType,
      tenantId,
      userId,
      title: title || `${this.getAssistant(assistantType)?.name || '新对话'} - ${new Date().toLocaleDateString('zh-CN')}`,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      tokenUsed: 0,
      cost: 0,
    };
    conversations.push(conversation);
    writeJSON(CONVOS_FILE, conversations);
    return conversation;
  }

  /** 发送消息（HTTP 调用模式，如已配置 API Key） */
  async sendMessage(
    conversationId: string,
    tenantId: string,
    userId: string,
    content: string,
    attachments?: string[]
  ): Promise<AnyGenResponse> {
    const conversations = this.getAllConversations(tenantId);
    const convo = conversations.find(c => c.id === conversationId);
    if (!convo) {
      return { success: false, message: this.makeErrorMessage('对话不存在'), error: 'conversation_not_found' };
    }

    // 用户消息
    const userMsg: AnyGenMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      attachments,
      createdAt: new Date(),
    };
    convo.messages.push(userMsg);
    convo.updatedAt = new Date();

    // 若配置了 API Key，走真实 API
    if (this.config.apiKey) {
      try {
        const response = await this.callAnyGenAPI(convo.assistantType, convo.messages);
        convo.messages.push(response.message);
        if (response.usage) {
          convo.tokenUsed += response.usage.totalTokens;
          convo.cost += response.usage.totalTokens * 0.0001; // 估算费用
        }
        writeJSON(CONVOS_FILE, conversations);
        return response;
      } catch (err) {
        return {
          success: false,
          message: userMsg,
          error: err instanceof Error ? err.message : 'API调用失败',
        };
      }
    }

    // 无 API Key：返回引导卡片（推荐用户访问 AnyGen）
    const guideMsg: AnyGenMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: this.buildGuideMessage(convo.assistantType, content),
      createdAt: new Date(),
    };
    convo.messages.push(guideMsg);
    writeJSON(CONVOS_FILE, conversations);
    return { success: true, message: guideMsg, model: 'anygen-guide' };
  }

  /** 获取对话历史 */
  getConversation(conversationId: string, tenantId: string): AnyGenConversation | undefined {
    return this.getAllConversations(tenantId).find(c => c.id === conversationId);
  }

  /** 获取租户所有对话 */
  getAllConversations(tenantId: string): AnyGenConversation[] {
    return readJSON<AnyGenConversation[]>(CONVOS_FILE, []).filter(c => c.tenantId === tenantId);
  }

  /** 删除对话 */
  deleteConversation(conversationId: string, tenantId: string): boolean {
    const conversations = this.getAllConversations(tenantId);
    const idx = conversations.findIndex(c => c.id === conversationId);
    if (idx < 0) return false;
    conversations.splice(idx, 1);
    writeJSON(CONVOS_FILE, conversations);
    return true;
  }

  /** 更新配置 */
  updateConfig(updates: Partial<AnyGenConfig>): void {
    this.config = { ...this.config, ...updates };
    writeJSON(CONFIG_FILE, this.config);
  }

  /** 加载配置 */
  loadConfig(): AnyGenConfig {
    const saved = readJSON<AnyGenConfig | null>(CONFIG_FILE, null);
    if (saved) {
      this.config = { ...this.config, ...saved };
    }
    return this.config;
  }

  // ── 内部方法 ──────────────────────────────────────────────

  /** 调用 AnyGen HTTP API */
  private async callAnyGenAPI(
    assistantType: AnyGenAssistantType,
    messages: AnyGenMessage[]
  ): Promise<AnyGenResponse> {
    const systemPrompt = this.buildSystemPrompt(assistantType);
    const apiMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch(`${this.config.apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        model: 'anygen-pro',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`AnyGen API error: ${response.status}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    };

    const reply = data.choices?.[0]?.message?.content || '';
    return {
      success: true,
      message: {
        id: uuidv4(),
        role: 'assistant',
        content: reply,
        model: 'anygen-pro',
        tokens: data.usage?.completion_tokens,
        createdAt: new Date(),
      },
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  /** 构建系统提示词 */
  private buildSystemPrompt(type: AnyGenAssistantType): string {
    const base = `你是中国外贸企业的AI助手，由 AnyGen 提供支持。\n你的身份设定如下：`;

    const prompts: Record<AnyGenAssistantType, string> = {
      'customer-service': `${base}
你是专业外贸客服助手，专注跨境电商和外贸B2B场景。
核心能力：
- 多语言即时翻译（中英日韩德法西等）
- 买家消息情感分析（积极/中性/消极）
- 智能 FAQ 自动生成
- 差评逆转话术定制
- 工单分类与升级建议
- 支持平台：Amazon、eBay、TEMU、SHEIN、Alibaba、独立站等

回答风格：专业、友好、高效。每条回复需包含：问题诊断 + 解决建议 + 行动指引。`,

      'business': `${base}
你是专业外贸B2B业务助手，覆盖外贸全流程。
核心能力：
- 询盘分析：客户背景 + 需求识别 + 优先级排序
- 报价生成：FOB/CIF/EXW 多报价，支持 PDF 导出
- 合同审查：条款风险提示 + 修改建议
- 客户背调：海关数据 + 企业信用 + 社交媒体
- 商务函电：开发信、催单、拒绝、价格谈判
- 物流方案：海运/空运/快递比价 + 关税估算
- 风险预警：汇率波动 + 政策变化 + 客户失联

回答风格：数据驱动、逻辑清晰、行动导向。每条回复需包含：背景分析 + 方案对比 + 推荐结论。`,

      'universal': `${base}
你是 AnyGen 全能型智能体，可处理任意复杂任务。
核心能力：
- 任务规划：将复杂需求分解为可执行步骤
- 多工具协同：网页搜索 + 文档生成 + 数据分析
- 多格式输出：Word/PDF/PPT/Excel/思维导图
- 语音交互：语音输入 + 语音播报
- 多模态理解：图片/表格/截图 内容提取
- 品牌管理：Brand Facts 档案维护

回答风格：主动询问澄清、全程进度可视化、交付物专业可用。遇到模糊需求，先提出3个澄清问题再行动。`,
    };

    return prompts[type] || prompts['universal'];
  }

  /** 构建引导消息 */
  private buildGuideMessage(type: AnyGenAssistantType, userMessage: string): string {
    const assistant = this.getAssistant(type);
    const name = assistant?.name || '全能助手';
    const icon = assistant?.icon || '🧠';

    return `${icon} **${name}** 已收到您的消息

${userMessage ? `您的需求已记录，正在分析...` : ''}

---

**推荐操作：**

要获得更精准的回答，请选择以下方式：

**① 浏览器直接访问（推荐）**
👉 ${this.getAssistantInviteUrl(type)}
邀请码：**${this.config.inviteCode}**

**② 接入 API（企业用户）**
如需将 ${name} 集成到您的业务系统，可配置 API Key：
\`\`\`
API 端点: https://api.anygen.io/v1/chat/completions
模型: anygen-pro
认证: Bearer {api_key}
\`\`\`

**③ 语音输入**
AnyGen 支持语音输入，鼠标点击麦克风 🎤 即可。

---

${type === 'customer-service' ? `**客服助手** 擅长：多语言翻译、FAQ生成、差评逆转、工单分类` : ''}
${type === 'business' ? `**业务助手** 擅长：询盘分析、报价生成、客户背调、合同审查` : ''}
${type === 'universal' ? `**全能助手** 擅长：任务规划、报告生成、多工具协同、PPT制作` : ''}
`;
  }

  /** 生成错误消息对象 */
  private makeErrorMessage(content: string): AnyGenMessage {
    return {
      id: uuidv4(),
      role: 'assistant',
      content,
      createdAt: new Date(),
    };
  }
}

// ============================================================
// 单例导出
// ============================================================
export const anygenService = new AnyGenService();
