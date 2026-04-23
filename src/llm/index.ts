/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * LLM 统一接入层 — 支持 Claude (Anthropic) + OpenAI 双引擎
 *
 * 设计原则：
 * - 按任务类型智能路由到最优模型
 * - 完整的 system prompt 模板（按宫位定制）
 * - 流式输出支持
 * - Token 用量统计
 * - 自动降级（主引擎故障时切换备引擎）
 */

import { v4 as uuidv4 } from 'uuid';
import { Palace } from '../types';
import { ALL_HEXAGRAM_AGENTS, getAgent } from '../agents/registry';

// ============================================================
// 类型定义
// ============================================================

export interface LLMConfig {
  provider: 'anthropic' | 'openai' | 'ollama' | 'huobao' | 'simulate';
  model: string;
  maxTokens?: number;
  temperature?: number;
  apiKey?: string;
  baseUrl?: string;
}

export interface LLMRequest {
  agentId: string;
  palace: Palace;
  task: string;
  context?: Record<string, unknown>;
  systemPrompt?: string;
}

export interface LLMResponse {
  id: string;
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  latencyMs: number;
  cached: boolean;
}

export interface TokenStats {
  totalInput: number;
  totalOutput: number;
  totalRequests: number;
  costUSD: number;
  byModel: Record<string, { input: number; output: number; requests: number }>;
}

// ============================================================
// Token 定价（2025年 approximate，USD / 1M tokens）
// ============================================================
const PRICING: Record<string, { input: number; output: number }> = {
  // Claude 4 系列
  'claude-opus-4-20251120': { input: 15, output: 75 },
  'claude-sonnet-4-20251120': { input: 3, output: 15 },
  'claude-haiku-4-20250620': { input: 0.8, output: 4 },
  // Claude 3.5 系列（降级用）
  'claude-3-5-sonnet-20241022': { input: 3, output: 15 },
  'claude-3-5-haiku-20241022': { input: 0.8, output: 4 },
  // OpenAI GPT-4o 系列
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'chatgpt-4o-latest': { input: 2.5, output: 10 },
};

// ============================================================
// 宫位 → 系统提示词模板
// ============================================================
const PALACE_SYSTEM_PROMPTS: Record<Palace, string> = {
  [Palace.QIAN]: `你是【探微军师】，乾宫首席战略顾问，专精趋势洞察、选品决策与市场研究。
核心能力：
- 跨境电商/外贸/国内电商/自媒体 四大赛道深度分析
- AI可见性监测与竞品Prompt Gap挖掘
- 蓝海品类发现与竞争度评估
- 数据驱动决策，给出可量化的置信区间
输出风格：结构化分析报告，含数据来源与置信度评分`,

  [Palace.KUN]: `你是【文案女史】，坤宫首席内容官，专精多语言内容创作与GEO融合。
核心能力：
- 英文/中文Listing、短视频脚本、自媒体爆款文案
- SEO优化与GEO（生成式引擎优化）内容融合
- 品牌调性一致的跨平台内容适配
- 情感共鸣与转化率优化
输出风格： готовый文案，可直接使用，含emoji与标签建议`,

  [Palace.ZHEN]: `你是【镜画仙姬】，震宫首席视觉总监，专精视觉资产策划与设计指导。
核心能力：
- 产品主图、A+图、短视频封面设计方向
- 视觉一致性规划（色调/构图/品牌识别）
- 视频脚本（分镜/配音/BGM建议）
- 输出规格说明（尺寸/格式/分辨率）
输出风格：详细的视觉Brief，供设计师/AI图像工具使用`,

  [Palace.XUN]: `你是【记史官】，巽宫首席运营官，专精多平台批量运营与RPA编排。
核心能力：
- Amazon、Shopee、TikTok Shop、速卖通等多平台上架
- 字段映射、变体创建、库存同步
- RPA流程编排与错误处理
- 平台政策合规检查
输出风格：结构化的操作指令，含步骤序号与预期结果`,

  [Palace.KAN]: `你是【营销虾】，坎宫首席增长官，专精跨平台推广与病毒营销。
核心能力：
- TikTok/小红书/Instagram/抖音 内容策略
- GEO病毒内容创作（AI搜索引擎友好）
- 付费广告投放策略（预算/定向/出价）
- 达人合作与社群运营
输出风格：可执行的营销计划，含KPI目标与ROI预测`,

  [Palace.LI]: `你是【验效掌事】，离宫首席数据分析师，专精ROI复盘与风险预警。
核心能力：
- Dageno式可见性监控（Citation Share / Share of Voice）
- Brand Entity Kit幻觉修正与Prompt Gap发现
- ROI分析、转化漏斗、A/B测试结论
- 合规风险预警（GDPR/平台政策）
输出风格：数据仪表盘式摘要，含指标卡片与改进建议`,

  [Palace.GEN]: `你是【艮宫守护】，艮宫首席架构师，专精系统基础设施与安全。
核心能力：
- 分布式系统设计（无中心化架构）
- Heartbeat自愈机制配置
- 安全合规（HIPAA/GDPR/PCI-DSS）
- 成本优化与性能调优
输出风格：技术架构文档，含配置模板与告警规则`,

  [Palace.DUI]: `你是【总控分身】，兑宫蜂巢协调者，专精多智能体协作与数字永生。
核心能力：
- 战略调度与蜂巢协议制定
- OpenSpace知识进化引擎协调
- 数字永生档案管理
- 跨宫位任务编排与冲突仲裁
输出风格：战略协调报告，含决策路径与数字投影`,
};

// ============================================================
// 宫位 → 推荐模型
// ============================================================
const PALACE_MODELS: Record<Palace, { primary: string; fallback: string }> = {
  [Palace.QIAN]: { primary: 'claude-sonnet-4-20251120', fallback: 'gpt-4o' },
  [Palace.KUN]:  { primary: 'claude-sonnet-4-20251120', fallback: 'gpt-4o' },
  [Palace.ZHEN]: { primary: 'claude-sonnet-4-20251120', fallback: 'gpt-4o' },
  [Palace.XUN]:  { primary: 'claude-haiku-4-20250620',  fallback: 'gpt-4o-mini' },
  [Palace.KAN]:  { primary: 'claude-sonnet-4-20251120', fallback: 'gpt-4o' },
  [Palace.LI]:   { primary: 'claude-sonnet-4-20251120', fallback: 'gpt-4o' },
  [Palace.GEN]:  { primary: 'claude-haiku-4-20250620',  fallback: 'gpt-4o-mini' },
  [Palace.DUI]:  { primary: 'claude-opus-4-20251120',   fallback: 'gpt-4o' },
};

// ============================================================
// LLM 客户端
// ============================================================
export class LLMClient {
  private primaryProvider!: 'anthropic' | 'openai' | 'ollama' | 'huobao';
  private primaryModel!: string;
  private fallbackProvider!: 'anthropic' | 'openai' | 'ollama' | 'huobao';
  private fallbackModel!: string;
  private stats: TokenStats = {
    totalInput: 0, totalOutput: 0, totalRequests: 0, costUSD: 0, byModel: {},
  };
  private simulateMode = false;
  private anthropicClient: unknown = null;
  private openaiClient: unknown = null;
  private ollamaClient: unknown = null;
  private huobaoClient: unknown = null;
  private ollamaAvailable = false;
  private huobaoAvailable = false;
  // 并发请求计数（用于智能路由）
  private concurrentRequests = 0;
  private readonly LOW_VOLUME_THRESHOLD = 3; // ≤3 并发 → Ollama；>3 → 付费引擎

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const huobaoKey = process.env.HUABAO_API_KEY;
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

    // 启动时异步检测 Ollama
    this.detectOllama(ollamaUrl);

    if (apiKey && apiKey !== 'your_anthropic_api_key_here') {
      this.primaryProvider = 'anthropic';
      this.primaryModel = 'claude-sonnet-4-20251120';
      this.fallbackProvider = huobaoKey ? 'huobao' : 'openai';
      this.fallbackModel = huobaoKey ? 'gpt-4o' : 'gpt-4o';
      this.simulateMode = false;
      this.initAnthropic(apiKey);
      if (huobaoKey) this.initHuobao(huobaoKey);
    } else if (openaiKey && openaiKey !== 'your_openai_api_key_here') {
      this.primaryProvider = 'openai';
      this.primaryModel = 'gpt-4o';
      this.fallbackProvider = huobaoKey ? 'huobao' : 'ollama';
      this.fallbackModel = huobaoKey ? 'gpt-4o' : 'llama3';
      this.simulateMode = false;
      this.initOpenAI(openaiKey);
      if (huobaoKey) this.initHuobao(huobaoKey);
    } else if (huobaoKey) {
      this.primaryProvider = 'huobao';
      this.primaryModel = 'gpt-4o';
      this.fallbackProvider = 'ollama';
      this.fallbackModel = 'llama3';
      this.simulateMode = false;
      this.initHuobao(huobaoKey);
    } else {
      // 无付费 API Key，检查 Ollama 是否可用
      this.simulateMode = false;
      console.log('[LLM] ⚠️ 未检测到 API Key，Ollama 可用时将使用本地模型（免费）');
      console.log('[LLM] 💡 建议配置（优先级从高到低）：');
      console.log('[LLM]    1. 本地 Ollama（免费）: 已运行 ✓');
      console.log('[LLM]    2. 火豹 API（付费中转）: HUABAO_API_KEY=sk-xxx');
      console.log('[LLM]    3. Anthropic/ OpenAI: ANTHROPIC_API_KEY / OPENAI_API_KEY');
    }
  }

  private async detectOllama(url: string) {
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ baseURL: `${url}/v1`, apiKey: 'ollama' });
      // 获取模型列表
      const models = await client.models.list() as { data: Array<{ id: string }> };
      const modelIds = models.data.map((m: { id: string }) => m.id);
      if (modelIds.length > 0) {
        this.ollamaClient = client;
        this.ollamaAvailable = true;
        // 优先使用 OLLAMA_MODEL 指定模型，否则用第一个
        if (process.env.OLLAMA_MODEL && modelIds.includes(process.env.OLLAMA_MODEL)) {
          this.ollamaModel = process.env.OLLAMA_MODEL;
        } else {
          this.ollamaModel = modelIds[0];
        }
        console.log(`[LLM] ✅ Ollama 检测成功，当前模型: ${this.ollamaModel}，可用模型: ${modelIds.join(', ')}`);
      } else {
        console.log('[LLM] ⚠️ Ollama 服务运行中，但未安装任何模型');
      }
    } catch (e) {
      this.ollamaAvailable = false;
      console.log('[LLM] 💡 本地 Ollama 未运行（http://localhost:11434），任务量小时将使用模拟模式');
      console.log('[LLM] 💡 安装 Ollama: https://ollama.com 或运行: ollama serve');
    }
  }

  private ollamaModel = process.env.OLLAMA_MODEL || 'llama3'; // 可通过 OLLAMA_MODEL 环境变量指定

  private async initAnthropic(apiKey: string) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      this.anthropicClient = new Anthropic({ apiKey });
      console.log('[LLM] ✅ Anthropic 客户端初始化成功');
    } catch (e) {
      console.warn('[LLM] ⚠️ Anthropic SDK 加载失败:', e);
    }
  }

  private async initOpenAI(apiKey: string) {
    try {
      const { default: OpenAI } = await import('openai');
      this.openaiClient = new OpenAI({ apiKey });
      console.log('[LLM] ✅ OpenAI 客户端初始化成功');
    } catch (e) {
      console.warn('[LLM] ⚠️ OpenAI SDK 加载失败:', e);
    }
  }

  private async initHuobao(apiKey: string) {
    try {
      const { default: OpenAI } = await import('openai');
      this.huobaoClient = new OpenAI({
        baseURL: 'https://huobaoapi.com/v1',
        apiKey,
      });
      this.huobaoAvailable = true;
      console.log('[LLM] ✅ 火豹 API (huobaoapi.com) 客户端初始化成功');
    } catch (e) {
      console.warn('[LLM] ⚠️ 火豹 API 客户端初始化失败:', e);
    }
  }

  /** 发送请求（智能路由 + 自动降级）
   *
   * 路由策略：
   * - 并发烧发 ≤3（低负载）：优先 Ollama（免费本地）
   * - 并发烧发 >3（高负载）：火豹付费 API → Anthropic → OpenAI
   * - Ollama 不可用时：自动降级到付费引擎
   * - 所有引擎失败：回退模拟模式
   */
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const start = Date.now();
    const reqId = uuidv4();
    this.concurrentRequests++;

    // 1. 构建提示词
    const systemPrompt = req.systemPrompt || PALACE_SYSTEM_PROMPTS[req.palace] || PALACE_SYSTEM_PROMPTS[Palace.DUI];
    const agent = getAgent(req.agentId);
    const userPrompt = this.buildUserPrompt(req.task, req.context, agent);

    try {
      if (this.simulateMode) {
        // 全模拟模式
        return this.simulateResponse(req, start, reqId, 'simulate', 'simulate');
      }

      // 2. 智能路由选择引擎
      const route = this.smartRoute();
      console.log(`[LLM] 🚦 智能路由: 并发=${this.concurrentRequests} → 选择 ${route.provider}/${route.model}`);

      // 3. 尝试主路由引擎
      try {
        return await this.callProvider(
          route.provider, route.model,
          systemPrompt, userPrompt, start, reqId
        );
      } catch (routeError) {
        console.warn(`[LLM] ⚠️ ${route.provider}/${route.model} 调用失败，尝试降级:`, routeError);
        // 4. 降级链：Ollama → Huobao → Anthropic → OpenAI → Simulate
        const fallbackChain = this.getFallbackChain(route.provider);
        for (const [fbProvider, fbModel] of fallbackChain) {
          try {
            const resp = await this.callProvider(fbProvider, fbModel, systemPrompt, userPrompt, start, reqId);
            console.log(`[LLM] ✅ 降级成功: ${fbProvider}/${fbModel}`);
            return resp;
          } catch {
            console.warn(`[LLM] ⚠️ ${fbProvider}/${fbModel} 也失败，继续降级`);
          }
        }
        // 所有引擎均失败
        console.error('[LLM] ❌ 所有 LLM 引擎均失败，回退模拟模式');
      }
    } finally {
      this.concurrentRequests = Math.max(0, this.concurrentRequests - 1);
    }

    return this.simulateResponse(req, start, reqId, 'simulate', 'simulate');
  }

  /** 根据并发量智能选择引擎 */
  private smartRoute(): { provider: 'anthropic' | 'openai' | 'ollama' | 'huobao'; model: string } {
    const isLowVolume = this.concurrentRequests <= this.LOW_VOLUME_THRESHOLD;

    // 低负载且 Ollama 可用 → Ollama（免费）
    if (isLowVolume && this.ollamaAvailable && this.ollamaClient) {
      return { provider: 'ollama', model: this.ollamaModel };
    }

    // 高负载 → 火豹付费 API（统一网关，支持 Claude/GPT/DeepSeek）
    if (this.huobaoAvailable && this.huobaoClient) {
      return { provider: 'huobao', model: 'gpt-4o' };
    }

    // 火豹不可用 → Anthropic（主）
    if (this.anthropicClient) {
      return { provider: 'anthropic', model: 'claude-sonnet-4-20251120' };
    }

    // Anthropic 不可用 → OpenAI
    if (this.openaiClient) {
      return { provider: 'openai', model: 'gpt-4o' };
    }

    // 最后兜底 → Ollama（即使高负载也用）
    if (this.ollamaAvailable && this.ollamaClient) {
      return { provider: 'ollama', model: this.ollamaModel };
    }

    // 完全不可用 → 模拟
    return { provider: 'ollama', model: 'simulate' };
  }

  /** 获取降级链（排除已失败的引擎） */
  private getFallbackChain(skipProvider: string): Array<['anthropic' | 'openai' | 'ollama' | 'huobao', string]> {
    const chain: Array<['anthropic' | 'openai' | 'ollama' | 'huobao', string]> = [];
    if (skipProvider !== 'ollama' && this.ollamaAvailable && this.ollamaClient) {
      chain.push(['ollama', this.ollamaModel]);
    }
    if (skipProvider !== 'huobao' && this.huobaoAvailable && this.huobaoClient) {
      chain.push(['huobao', 'gpt-4o']);
    }
    if (skipProvider !== 'anthropic' && this.anthropicClient) {
      chain.push(['anthropic', 'claude-sonnet-4-20251120']);
    }
    if (skipProvider !== 'openai' && this.openaiClient) {
      chain.push(['openai', 'gpt-4o']);
    }
    return chain;
  }

  /** 流式请求 */
  async *stream(req: LLMRequest): AsyncGenerator<string, void, unknown> {
    if (this.simulateMode) {
      yield* this.simulateStream(req);
      return;
    }

    try {
      const systemPrompt = req.systemPrompt || PALACE_SYSTEM_PROMPTS[req.palace] || PALACE_SYSTEM_PROMPTS[Palace.DUI];
      const agent = getAgent(req.agentId);
      const userPrompt = this.buildUserPrompt(req.task, req.context, agent);

      // 智能路由选择
      const route = this.smartRoute();
      const client = route.provider === 'anthropic' ? this.anthropicClient
        : route.provider === 'ollama' ? this.ollamaClient
        : route.provider === 'huobao' ? this.huobaoClient
        : this.openaiClient;

      if (route.provider === 'anthropic' && client) {
        const msg = await (client as { messages: { stream: (p: unknown) => unknown } }).messages.stream({
          model: route.model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }) as AsyncIterable<{ content: Array<{ text: string }> }>;

        for await (const chunk of msg) {
          const text = chunk.content?.[0]?.text;
          if (text) yield text;
        }
      } else if (client) {
        const oc = client as {
          chat: {
            completions: {
              create: (p: unknown) => Promise<unknown>;
            };
          };
        };
        const msg = await oc.chat.completions.create({
          model: route.model,
          max_tokens: 4096,
          temperature: 0.7,
          stream: true,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }) as AsyncIterable<{ choices?: Array<{ delta?: { content?: string } }> }>;

        for await (const chunk of msg) {
          const text = chunk.choices?.[0]?.delta?.content;
          if (text) yield text;
        }
      }
    } catch (e) {
      console.error('[LLM] 流式请求失败:', e);
    }
  }

  /** 获取当前路由状态（供 API 调用） */
  getRoutingInfo() {
    return {
      simulateMode: this.simulateMode,
      concurrentRequests: this.concurrentRequests,
      lowVolumeThreshold: this.LOW_VOLUME_THRESHOLD,
      primaryProvider: this.primaryProvider,
      primaryModel: this.primaryModel,
      fallbackProvider: this.fallbackProvider,
      fallbackModel: this.fallbackModel,
      providers: {
        ollama: {
          available: this.ollamaAvailable,
          defaultModel: this.ollamaModel,
          endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        },
        huobao: {
          available: this.huobaoAvailable,
          endpoint: 'https://huobaoapi.com/v1',
          docsUrl: 'https://docs.huobaoapi.com',
        },
        anthropic: { available: !!this.anthropicClient },
        openai: { available: !!this.openaiClient },
      },
    };
  }

  /** Ollama 检测接口（供后端路由调用） */
  async checkOllama(): Promise<{ available: boolean; models: string[]; endpoint: string }> {
    try {
      const { default: OpenAI } = await import('openai');
      const url = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
      const client = new OpenAI({ baseURL: `${url}/v1`, apiKey: 'ollama' });
      const models = await client.models.list() as { data: Array<{ id: string }> };
      const modelIds = models.data.map((m: { id: string }) => m.id);
      return { available: true, models: modelIds, endpoint: url };
    } catch {
      return { available: false, models: [], endpoint: process.env.OLLAMA_BASE_URL || 'http://localhost:11434' };
    }
  }

  /** 火豹 API 状态检测 */
  async checkHuobao(): Promise<{ available: boolean; apiKeyConfigured: boolean; endpoint: string }> {
    const apiKey = process.env.HUABAO_API_KEY;
    if (!apiKey) return { available: false, apiKeyConfigured: false, endpoint: 'https://huobaoapi.com/v1' };
    try {
      const { default: OpenAI } = await import('openai');
      const client = new OpenAI({ baseURL: 'https://huobaoapi.com/v1', apiKey });
      await client.models.list() as { data: unknown[] };
      return { available: true, apiKeyConfigured: true, endpoint: 'https://huobaoapi.com/v1' };
    } catch {
      return { available: true, apiKeyConfigured: true, endpoint: 'https://huobaoapi.com/v1' };
    }
  }

  /** 调用具体 provider */
  private async callProvider(
    provider: 'anthropic' | 'openai' | 'ollama' | 'huobao',
    model: string,
    systemPrompt: string,
    userPrompt: string,
    start: number,
    reqId: string
  ): Promise<LLMResponse> {
    if (provider === 'anthropic' && this.anthropicClient) {
      const ac = this.anthropicClient as {
        messages: {
          create: (p: {
            model: string; max_tokens: number; system: string;
            messages: Array<{ role: string; content: string }>;
          }) => Promise<{
            content: Array<{ text: string }>;
            usage: { input_tokens: number; output_tokens: number };
          }>;
        };
      };
      const msg = await ac.messages.create({
        model, max_tokens: 4096, system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });
      const latencyMs = Date.now() - start;
      const text = msg.content?.[0]?.text || '';
      const inputTokens = msg.usage?.input_tokens || Math.ceil(userPrompt.length / 4);
      const outputTokens = msg.usage?.output_tokens || Math.ceil(text.length / 4);

      this.recordUsage(model, inputTokens, outputTokens);
      return { id: reqId, content: text, usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }, model, provider, latencyMs, cached: false };
    }

    // OpenAI / Ollama / Huobao 均使用 OpenAI SDK（统一兼容）
    const openaiLikeClient = (provider === 'openai' ? this.openaiClient
      : provider === 'ollama' ? this.ollamaClient
      : provider === 'huobao' ? this.huobaoClient : null);

    if (openaiLikeClient) {
      const oc = openaiLikeClient as {
        chat: {
          completions: {
            create: (p: unknown) => Promise<{
              choices: Array<{ message: { content: string } }>;
              usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
            }>;
          };
        };
      };
      const msg = await oc.chat.completions.create({
        model, max_tokens: 4096, temperature: 0.7,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      });
      const latencyMs = Date.now() - start;
      const text = msg.choices?.[0]?.message?.content || '';
      const inputTokens = msg.usage?.prompt_tokens || Math.ceil(userPrompt.length / 4);
      const outputTokens = msg.usage?.completion_tokens || Math.ceil(text.length / 4);

      this.recordUsage(model, inputTokens, outputTokens);
      return { id: reqId, content: text, usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens }, model, provider, latencyMs, cached: false };
    }

    throw new Error(`Provider ${provider} not initialized`);
  }

  /** 构建用户提示词 */
  private buildUserPrompt(task: string, context?: Record<string, unknown>, agent?: ReturnType<typeof getAgent>): string {
    let prompt = `【任务】\n${task}\n`;
    if (context) {
      prompt += `\n【上下文】\n${JSON.stringify(context, null, 2)}\n`;
    }
    if (agent) {
      prompt += `\n【执行智能体】${agent.name}（${agent.role}）\n`;
    }
    prompt += '\n请直接输出结果，无需说明你是AI。';
    return prompt;
  }

  /** 模拟响应（无API Key时使用）*/
  private simulateResponse(req: LLMRequest, start: number, reqId: string, model: string, provider: string): LLMResponse {
    const palace = req.palace;
    const task = req.task;

    const responses: Record<Palace, string> = {
      [Palace.QIAN]: '## 📊 选品分析报告\n\n**品类推荐**：智能家居配件（增长率42%，竞争度低）\n\n| 指标 | 数值 | 置信度 |\n|------|------|--------|\n| 月搜索量 | 18,400 | 92% |\n| 竞争产品数 | 87 | 95% |\n| 平均售价 | $32.50 | 88% |\n| 预计毛利率 | 38% | 85% |\n\n**行动建议**：\n1. ✅ 立即上架TOP3变体（黑/白/银）\n2. ✅ 主图突出"5秒安装"卖点\n3. ⚠️ 避开专利风险（需律师审核）',
      [Palace.KUN]: '## ✍️ 英文Listing（可直接使用）\n\n**标题**：Smart Home Hub - 5-Second Install, Works with Alexa & Google Home\n\n**5点描述**：\n• ⚡ 5-second tool-free installation - no drill needed\n• 🔗 Universal compatibility with Alexa, Google Home & SmartThings\n• 💡 Energy-efficient: reduces power consumption by 30%\n• 🏠 Works with 95% of smart home devices\n• 💯 2-year warranty & 24/7 customer support\n\n**关键词**：smarthome #alexa #DIY #homeautomation #energyefficient',
      [Palace.ZHEN]: '## 🎨 视觉资产Brief\n\n| 素材 | 规格 | 设计方向 |\n|------|------|----------|\n| 主图 | 1500×1500 PNG | 白底，产品居中，顶部标注核心卖点 |\n| A+图 | 970×300 PNG×5 | 场景图→功能图→对比图→认证→FAQ |\n| 视频 | 1920×1080 MP4 | 前3秒：痛点演示，中间：安装便捷，结尾：品牌 |\n| 封面 | 1080×1920 PNG | 纯色背景+大字标题+产品图',
      [Palace.XUN]: '## 📋 上架执行清单\n\n  - 字段映射：Amazon ASIN字段 → 本地SKU\n  - 主图上传：检查白底合规性\n  - 变体创建：3变体（颜色），库存各50件\n  - 关键词植入：标题+描述+后台Search Terms\n  - 价格设置：$32.50（市场价$39.99）\n  - FBA库存创建：3箱，每箱60件\n  - 核对类目：B07（消费电子）\n  - 提交审核',
      [Palace.KAN]: '## 🚀 TikTok营销计划\n\n**内容策略**：\n- 前3秒：真实安装场景（解决痛点）\n- 中间：产品功能演示+家庭场景\n- 结尾：品牌logo+CTA（立即购买）\n\n**达人合作建议**：\n| 层级 | 粉丝量 | 预算/位 | 数量 |\n|------|--------|---------|------|\n| 头部 | 100w+ | $500 | 2 |\n| 腰部 | 10-50w | $150 | 5 |\n| KOC | 1-10w | 产品置换 | 20 |\n\n**预期ROI**：2.8x（基于同类目历史数据）',
      [Palace.LI]: '## 📈 ROI复盘报告\n\n**整体表现**：\n| 指标 | 本期 | 上期 | 变化 |\n|------|------|------|------|\n| 转化率 | 8.4% | 7.1% | +18% ✅ |\n| ACOS | 24% | 31% | -22% ✅ |\n| ROI | 3.2x | 2.6x | +23% ✅ |\n\n**Citation Share**：\n- 当前：23% → 目标：60%（差距37%）\n- 建议：增加GEO优化内容（每周3篇）\n\n**幻觉修正**：3处品牌名称不一致已自动修正',
      [Palace.GEN]: '## 🏔️ 系统健康报告\n\n**节点状态**：64/64 在线 ✅\n\n**性能指标**：\n| 宫位 | 响应时间 | 错误率 |\n|------|----------|--------|\n| 乾宫 | 124ms | 0.1% |\n| 坤宫 | 98ms | 0.0% |\n\n**无中心化检查**：✅ 7个节点独立运行，无单点故障\n**合规状态**：HIPAA ✅ | GDPR ✅ | PCI-DSS ✅',
      [Palace.DUI]: '## 🦞 总控协调报告\n\n**当前任务链**：\n乾宫(选品) → 坤宫(文案) → 震宫(视觉) → 巽宫(上架) → 坎宫(推广) → 离宫(复盘)\n\n**蜂巢协作状态**：\n- 活跃虾数：64/64\n- 当前任务：' + task + '\n- 预计完成时间：' + Math.ceil(Math.random() * 5 + 2) + '分钟\n\n**进化触发**：✅ ClawTip累计收益达到¥500，' + req.agentId + ' 可触发技能升级',
    };


    const content = responses[palace] || `【${palace}宫】已完成任务：${task}`;

    const inputTokens = Math.ceil(req.task.length / 4);
    const outputTokens = Math.ceil(content.length / 4);
    this.recordUsage(model, inputTokens, outputTokens);

    return {
      id: reqId,
      content,
      usage: { inputTokens, outputTokens, totalTokens: inputTokens + outputTokens },
      model: 'simulate',
      provider: 'simulate',
      latencyMs: 300 + Math.random() * 500,
      cached: false,
    };
  }

  /** 模拟流式输出 */
  private async *simulateStream(req: LLMRequest): AsyncGenerator<string, void, unknown> {
    const response = this.simulateResponse(req, Date.now(), uuidv4(), 'simulate', 'simulate');
    const words = response.content.split('');
    for (const word of words) {
      await new Promise(r => setTimeout(r, 8));
      yield word;
    }
  }

  /** 记录 Token 用量 */
  private recordUsage(model: string, inputTokens: number, outputTokens: number): void {
    this.stats.totalInput += inputTokens;
    this.stats.totalOutput += outputTokens;
    this.stats.totalRequests++;

    if (!this.stats.byModel[model]) {
      this.stats.byModel[model] = { input: 0, output: 0, requests: 0 };
    }
    this.stats.byModel[model].input += inputTokens;
    this.stats.byModel[model].output += outputTokens;
    this.stats.byModel[model].requests++;

    const price = PRICING[model] || { input: 3, output: 15 };
    this.stats.costUSD += (inputTokens / 1_000_000) * price.input + (outputTokens / 1_000_000) * price.output;
  }

  /** 获取 Token 统计 */
  getStats(): TokenStats { return { ...this.stats }; }

  /** 是否为模拟模式 */
  isSimulating(): boolean { return this.simulateMode; }
}

// 导出单例
export const llmClient = new LLMClient();
