/**
 * AnyGen.io API Service
 * SIMIAICLAW 龙虾集群太极64卦系统
 *
 * API Docs: https://api.anygen.io/v1/openapi/tasks
 * 注册获取 API Key: https://www.anygen.io/home
 */

const ANYGEN_API_BASE = 'https://api.anygen.io/v1';

// ── Types ──────────────────────────────────────────────────────────────────

export type AnyGenOperation =
  | 'slide'
  | 'doc'
  | 'smart_draw'
  | 'deep_research'
  | 'data_analysis'
  | 'finance'
  | 'storybook'
  | 'website'
  | 'ai_designer';

export interface AnyGenTask {
  id: string;
  operation: AnyGenOperation;
  status: 'pending' | 'running' | 'success' | 'failed';
  content_version?: number;
  result_url?: string;
  content?: unknown;
  error?: string;
}

export interface CreateTaskParams {
  operation: AnyGenOperation;
  prompt: string;
  file_tokens?: string[];
  export_format?: 'drawio' | 'excalidraw';
}

export interface BotKnowledgeContent {
  faqs: Array<{ q: string; a: string; category: string }>;
  responses: Array<{ intent: string; response: string; triggers: string[] }>;
  fallback: string;
  escalation_rules: string[];
  brandVoice: {
    tone: string;
    keywords: string[];
    prohibited: string[];
  };
}

// ── API Client ─────────────────────────────────────────────────────────────

function getApiKey(): string {
  // 优先使用 VITE 前缀（前端可见）
  const viteKey = import.meta.env.VITE_ANYGEN_API_KEY;
  if (viteKey) return viteKey;

  // 回退到 .env 中的 ANYGEN_API_KEY（通过 Vite 注入了 VITE_ 前缀）
  const envKey = (import.meta.env as Record<string, string | undefined>).VITE_ANYGEN_API_KEY;
  if (envKey) return envKey;

  return '';
}

async function request<T>(path: string, body?: unknown): Promise<T> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error(
      'AnyGen API Key 未配置。请在 .env 文件中添加：\nVITE_ANYGEN_API_KEY=sk-ag-...\n或访问 https://www.anygen.io/home 获取 API Key。'
    );
  }

  const res = await fetch(`${ANYGEN_API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `AnyGen API 错误: ${res.status}`);
  }

  return res.json();
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * 创建 AnyGen 内容生成任务
 */
export async function createTask(params: CreateTaskParams): Promise<{ id: string }> {
  const result = await request<{ id: string; content_version: number }>('/openapi/tasks', {
    operation: params.operation,
    prompt: params.prompt,
    ...(params.file_tokens?.length ? { file_tokens: params.file_tokens } : {}),
    ...(params.export_format ? { export_format: params.export_format } : {}),
  });
  return { id: result.id };
}

/**
 * 轮询任务状态（用于长任务）
 */
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (status: string) => void,
  maxWaitMs = 300_000 // 5 分钟超时
): Promise<AnyGenTask> {
  const start = Date.now();
  let lastStatus = '';

  while (Date.now() - start < maxWaitMs) {
    const result = await request<AnyGenTask>(`/openapi/tasks/${taskId}`);
    const status = result.status;

    if (status !== lastStatus) {
      lastStatus = status;
      onProgress?.(status);
    }

    if (status === 'success' || status === 'failed') {
      return result;
    }

    // 指数退避: 2s → 4s → 8s → 10s（最大）
    await new Promise(r => setTimeout(r, Math.min(10_000, (Date.now() - start) / 10)));
  }

  throw new Error('任务超时（5分钟），请稍后重试');
}

/**
 * 生成 AI 销售/客服机器人知识库
 * 使用 AnyGen doc operation 生成 FAQ、回复话术、品牌语调等
 */
export async function generateBotKnowledge(params: {
  botName: string;
  brandDesc: string;
  products: string[];
  botType: 'sales' | 'service';
  personality: string;
  language: string;
  websiteUrl?: string;
}): Promise<BotKnowledgeContent> {
  const { botName, brandDesc, products, botType, personality, language, websiteUrl } = params;

  const typeLabel = botType === 'sales' ? 'AI 销售机器人' : 'AI 客服机器人';
  const productsList = products.join('、') || '通用产品';
  const websiteInfo = websiteUrl ? `企业官网：${websiteUrl}` : '未提供官网';

  const prompt = `
你是 AnyGen.io 智能机器人训练引擎。请为以下企业 ${typeLabel} 生成完整的知识库配置。

## 企业信息
- 机器人名称：${botName}
- 品牌介绍：${brandDesc}
- 产品类别：${productsList}
- ${websiteInfo}
- 机器人性格：${personality}
- 服务语言：${language}

## 输出要求
请以 JSON 格式输出完整的机器人知识库，包含以下字段：

{
  "faqs": [
    {"q": "常见问题1", "a": "标准回答", "category": "产品咨询"}
  ],
  "responses": [
    {"intent": "意图名称", "response": "回复内容", "triggers": ["触发词1", "触发词2"]}
  ],
  "fallback": "无法识别时的默认回复",
  "escalation_rules": ["升级规则1", "升级规则2"],
  "brandVoice": {
    "tone": "语气风格",
    "keywords": ["品牌关键词1", "关键词2"],
    "prohibited": ["禁止使用的词汇"]
  }
}

要求：
- 生成 8-12 条 FAQ，覆盖产品介绍、价格咨询、售后服务等常见问题
- 生成 5-8 个意图识别配置，包含触发词
- fallback 回复应引导用户留下联系方式
- 语气风格与"${personality}"一致
- 语言使用"${language}"
- 产品知识与"${productsList}"相关

请直接输出 JSON，不要有其他说明文字。
`.trim();

  try {
    const { id } = await createTask({ operation: 'doc', prompt });
    const result = await pollTaskStatus(id);

    if (result.status === 'failed') {
      throw new Error(result.error || '知识库生成失败');
    }

    if (result.content) {
      const parsed = typeof result.content === 'string'
        ? JSON.parse(result.content)
        : result.content;
      return parsed as BotKnowledgeContent;
    }

    // 如果没有 content，提供默认知识库
    return generateDefaultKnowledge(params);
  } catch (err) {
    // API 不可用时返回默认知识库
    console.warn('[AnyGen] 知识库生成失败，使用默认模板:', err);
    return generateDefaultKnowledge(params);
  }
}

/**
 * 生成默认知识库（当 AnyGen API 不可用时）
 */
function generateDefaultKnowledge(params: {
  botName: string;
  brandDesc: string;
  products: string[];
  botType: 'sales' | 'service';
  personality: string;
  language: string;
}): BotKnowledgeContent {
  const { botName, brandDesc, products, botType, personality, language } = params;
  const typeLabel = botType === 'sales' ? '销售' : '客服';

  return {
    faqs: [
      { q: `介绍一下${botName}`, a: `${brandDesc}`, category: '品牌介绍' },
      { q: '有哪些产品/服务？', a: `我们提供：${products.join('、')}。欢迎了解详情！`, category: '产品咨询' },
      { q: '价格是多少？', a: '我们的价格方案灵活，请留下您的联系方式，我们的销售顾问将在24小时内与您联系。', category: '价格咨询' },
      { q: '如何购买/申请服务？', a: '您可以直接在官网提交申请，或添加客服微信，我们有专人为您办理。', category: '购买流程' },
      { q: '售后服务怎么样？', a: '我们提供7×24小时技术支持，不满意可在30天内申请退款。', category: '售后服务' },
      { q: '可以定制吗？', a: '当然可以！我们提供企业级定制服务，请描述您的需求，我们的团队将为您量身打造。', category: '定制服务' },
      { q: '有免费试用吗？', a: '是的，我们提供14天免费试用，无需绑定信用卡，欢迎体验！', category: '试用咨询' },
      { q: '你们的工作时间？', a: '我们的${typeLabel}团队全天候在线，人工服务时间为工作日9:00-18:00。', category: '服务时间' },
    ],
    responses: [
      {
        intent: 'greeting',
        response: `您好！欢迎来到${botName}！我是您的专属智能助手，请问有什么可以帮助您的？`,
        triggers: ['你好', 'hi', 'hello', '在吗', '您好', 'hey'],
      },
      {
        intent: 'product_inquiry',
        response: `我们提供以下产品/服务：${products.slice(0, 3).join('、')}。想了解更多，请告诉我您的具体需求！`,
        triggers: ['产品', '服务', '有什么', '详细介绍'],
      },
      {
        intent: 'price_inquiry',
        response: '我们的价格根据您的具体需求定制。请留下您的公司名称和联系方式，我们的销售顾问将在24小时内为您提供方案和报价。',
        triggers: ['价格', '多少钱', '费用', '报价', '收费'],
      },
      {
        intent: 'purchase_intent',
        response: '很高兴您对我们感兴趣！请填写以下信息，我们有专人为您提供一对一服务，确保您获得最适合的方案。',
        triggers: ['购买', '申请', '开通', '合作', '咨询'],
      },
      {
        intent: 'support_request',
        response: '请问您遇到了什么问题？我们的技术支持团队随时待命，请描述具体现象，我会尽快为您解决！',
        triggers: ['问题', '故障', '不行', '错误', '帮助', 'support'],
      },
    ],
    fallback: `抱歉，我暂时无法理解您的问题。请问您想了解${botName}的哪方面内容？您可以尝试询问：产品介绍、价格方案、如何购买、售后服务等。我会尽力为您解答！`,
    escalation_rules: [
      '当用户明确表示不满或投诉时，转人工客服',
      '当问题超过3轮对话仍未解决时，提示用户联系人工',
      '当用户询问技术细节或故障排查时，建议提交工单',
      '当用户询问具体报价时，收集联系方式转销售跟进',
    ],
    brandVoice: {
      tone: personality,
      keywords: [botName, ...products.slice(0, 5)],
      prohibited: ['诋毁竞品', '夸大宣传', '虚假承诺'],
    },
  };
}

/**
 * 获取账户余额（credits）
 */
export async function getCredits(): Promise<{ credits: number; plan: string }> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return { credits: 0, plan: '未配置' };

    const res = await fetch(`${ANYGEN_API_BASE}/user/credits`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) return { credits: -1, plan: '未知' };
    const data = await res.json();
    return { credits: data.credits ?? 0, plan: data.plan ?? '未知' };
  } catch {
    return { credits: -1, plan: '网络错误' };
  }
}

/**
 * 测试 API Key 是否有效
 */
export async function validateApiKey(): Promise<{ valid: boolean; credits?: number; error?: string }> {
  try {
    const { credits, plan } = await getCredits();
    if (credits < 0) return { valid: false, error: 'API Key 无效或无法连接' };
    return { valid: true, credits };
  } catch (err) {
    return { valid: false, error: String(err) };
  }
}
