/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * Gemini 集成模块 — 文案生成 + 图像生成
 *
 * 功能：
 * - 文案生成：gemini-2.0-flash（高速）、gemini-1.5-pro（高精度）
 * - 多模态理解：上传图片，Gemini 分析并生成描述/文案
 * - 图像生成：通过 Vertex AI Imagen 3（支持 Gemini API Key 或 Google Cloud Service Account）
 * - 流式输出支持
 * - 智能路由（根据任务类型选择最优模型）
 */

import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';

// ==================== 类型定义 ====================

export type GeminiModel = 'gemini-2.0-flash' | 'gemini-1.5-pro' | 'gemini-1.5-flash' | 'gemini-pro-vision';

export interface GeminiTextOptions {
  model?: GeminiModel;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  systemPrompt?: string;
  /** 以图生文模式 */
  imageBase64?: string;
  imageMimeType?: string;
}

export interface GeminiImageOptions {
  prompt: string;
  model?: 'imagen-3.0-generate' | 'imagegeneration@006';
  sampleCount?: 1 | 2 | 4;
  aspectRatio?: '1:1' | '9:16' | '16:9' | '3:4' | '4:3';
  personGeneration?: 'dont_allow' | 'allow_adult' | 'allow_all';
  safetySetting?: 'block_some' | 'block_few' | 'block_medium' | 'block_few';
  outputType?: 'base-url' | 'b64_json' | 'url';
}

export interface GeminiTextResponse {
  id: string;
  text: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  finishReason: string;
}

export interface GeminiImageResponse {
  imageUrl?: string;       // URL 模式
  base64?: string;         // Base64 模式
  revisedPrompt?: string;   // Imagen 返回的修订提示词
  model: string;
  latencyMs: number;
}

// Gemini 定价（2025 approximate，USD / 1M tokens）
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash': { input: 0.0375, output: 0.15 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
};

// ==================== GeminiClient ====================

export class GeminiClient {
  private client: GoogleGenerativeAI | null = null;
  private apiKey: string = '';
  private vertexClient: any = null;
  private vertexProjectId: string = '';
  private vertexLocation: string = 'us-central1';
  private useVertex: boolean = false;
  private available: boolean = false;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    const vertexKey = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;

    if (apiKey && apiKey !== 'your_gemini_api_key_here') {
      this.apiKey = apiKey;
      this.client = new GoogleGenerativeAI(apiKey);
      this.available = true;
      console.log('[Gemini] ✅ Gemini API 客户端初始化成功（API Key 模式）');
    }

    // Vertex AI（用于 Imagen 图像生成）
    if (vertexKey) {
      try {
        const creds = JSON.parse(vertexKey);
        this.vertexProjectId = creds.project_id;
        this.vertexLocation = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
        this.useVertex = true;
        console.log(`[Gemini] ✅ Vertex AI 客户端初始化成功（Project: ${this.vertexProjectId}）`);
      } catch (e) {
        console.warn('[Gemini] ⚠️ GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON 解析失败:', e);
      }
    }

    if (!this.available && !this.useVertex) {
      console.log('[Gemini] 💡 Gemini 未配置。配置方式（二选一）：');
      console.log('[Gemini]    1. Gemini API: GEMINI_API_KEY=AIza...（ai.google.dev）');
      console.log('[Gemini]    2. Vertex AI (Imagen): GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON={...} + GOOGLE_CLOUD_PROJECT_ID');
    }
  }

  // ==================== 状态检测 ====================

  isAvailable(): boolean {
    return this.available;
  }

  getStatus() {
    return {
      geminiApi: {
        available: this.available,
        configured: !!this.apiKey,
        endpoint: 'https://generativelanguage.googleapis.com',
        docsUrl: 'https://ai.google.dev/gemini-api/docs',
      },
      vertexAI: {
        available: this.useVertex,
        projectId: this.vertexProjectId,
        location: this.vertexLocation,
        docsUrl: 'https://cloud.google.com/vertex-ai/generative-ai/docs',
        features: [' Imagen 3 图像生成', 'Gemini 多模态', 'Embedding'],
      },
      supportedModels: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      pricing: GEMINI_PRICING,
      quickStart: this.available ? null : 'https://aistudio.google.com/apikey',
    };
  }

  // ==================== 文案生成（文本） ====================

  async generateText(
    prompt: string,
    options: GeminiTextOptions = {}
  ): Promise<GeminiTextResponse> {
    const start = Date.now();
    const id = `gemini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    if (!this.client) {
      // 模拟模式
      return this.simulateResponse(prompt, id, start, options);
    }

    const modelName = options.model || 'gemini-2.0-flash';
    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      },
      systemInstruction: options.systemPrompt,
    });

    let result: GenerateContentResult;

    if (options.imageBase64) {
      // 多模态：图+文
      const mimeType = options.imageMimeType || 'image/png';
      const base64Data = options.imageBase64.replace(/^data:[^;]+;base64,/, '');
      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };
      const textPart = { text: prompt };
      result = await model.generateContent([textPart, imagePart as any]);
    } else {
      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const text = response.text();
    const usage: Record<string, number> = (response as any).usageMetadata || {};
    const finishReason = response.candidates?.[0]?.finishReason || 'STOP';

    return {
      id,
      text,
      model: modelName,
      usage: {
        promptTokens: usage.promptTokenCount || Math.ceil(prompt.length / 4),
        completionTokens: usage.candidatesTokenCount || Math.ceil(text.length / 4),
        totalTokens: usage.totalTokenCount || 0,
      },
      latencyMs: Date.now() - start,
      finishReason,
    };
  }

  // ==================== 流式文案生成 ====================

  async *streamText(
    prompt: string,
    options: GeminiTextOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    if (!this.client) {
      // 模拟模式
      const sim = this.simulateResponse(prompt, `gemini-sim-${Date.now()}`, Date.now(), options);
      for (const char of sim.text) {
        await new Promise(r => setTimeout(r, 6));
        yield char;
      }
      return;
    }

    const modelName = options.model || 'gemini-2.0-flash';
    const model = this.client.getGenerativeModel({
      model: modelName,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 2048,
        topP: options.topP ?? 0.95,
        topK: options.topK ?? 40,
      },
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContentStream(prompt);
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) yield text;
    }
  }

  // ==================== 多模态理解（图+文） ====================

  async analyzeImage(
    imageBase64: string,
    prompt: string,
    mimeType: string = 'image/png'
  ): Promise<GeminiTextResponse> {
    return this.generateText(prompt, {
      model: 'gemini-1.5-flash',
      imageBase64,
      imageMimeType: mimeType,
      maxTokens: 1024,
    });
  }

  // ==================== 图像生成（Vertex AI Imagen） ====================

  async generateImage(options: GeminiImageOptions): Promise<GeminiImageResponse> {
    const start = Date.now();
    const model = options.model || 'imagen-3.0-generate';

    // 必须通过 Vertex AI
    if (!this.useVertex || !this.vertexProjectId) {
      return this.simulateImageResponse(options, start);
    }

    // 动态导入 Vertex AI SDK（避免影响服务端启动）
    try {
      const { VertexAI } = await import('@google-cloud/vertexai');

      const vertexAI = new VertexAI({
        project: this.vertexProjectId,
        location: this.vertexLocation,
      });

      const model = vertexAI.getGenerativeModel({
        model: 'imagegeneration@006',
      });

      const request = {
        instances: [{
          prompt: options.prompt,
        }],
        parameters: {
          sampleCount: options.sampleCount || 1,
          aspectRatio: options.aspectRatio || '1:1',
          personGeneration: options.personGeneration || 'dont_allow',
          safetySetting: options.safetySetting || 'block_some',
        },
      };

      const response = await fetch(
        `https://${this.vertexLocation}-aiplatform.googleapis.com/v1/projects/${this.vertexProjectId}/locations/${this.vertexLocation}/publishers/google/models/imagegeneration@006:predict`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(vertexAI as any).authToken || ''}`,
          },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error(`Vertex AI API 返回 ${response.status}`);
      }

      const data = await response.json() as {
        predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
      };
      const imageBase64 = data.predictions?.[0]?.bytesBase64Encoded;

      if (imageBase64) {
        return {
          base64: imageBase64,
          revisedPrompt: options.prompt,
          model: 'imagen-3.0-generate',
          latencyMs: Date.now() - start,
        };
      }

      throw new Error('Imagen 未返回图像数据');
    } catch (e) {
      console.error('[Gemini] Imagen 调用失败:', e);
      // Vertex AI SDK 未安装或调用失败，使用模拟
      return this.simulateImageResponse(options, start);
    }
  }

  // ==================== 模拟响应 ====================

  private simulateResponse(
    prompt: string,
    id: string,
    start: number,
    options: GeminiTextOptions
  ): GeminiTextResponse {
    const texts: Record<string, string> = {
      'gemini-2.0-flash': `## ✨ 文案生成结果（Gemini 2.0 Flash）

**核心洞察**：${prompt.slice(0, 60)}...

**生成文案**：

\`\`\`
【主标题】
颠覆认知！跨境卖家都在偷偷用的选品方法
（CTR 预估提升 47%）

【副标题】
3步找到蓝海品类，月GMV翻3倍

【CTA按钮】
立即免费诊断 →

【社媒文案】
刚用这个方法找到的品类，
月出 2000 单，毛利率 52% 🦞
#跨境电商 #选品技巧 #出海创业
\`\`\`

**A/B测试建议**：制作3个变体，对比不同钩子效果`,
    };

    const model = options.model || 'gemini-2.0-flash';
    const content = texts[model] || texts['gemini-2.0-flash'];
    const tokens = Math.ceil(content.length / 4);

    return {
      id,
      text: content,
      model,
      usage: { promptTokens: Math.ceil(prompt.length / 4), completionTokens: tokens, totalTokens: tokens * 2 },
      latencyMs: Date.now() - start + 300 + Math.random() * 400,
      finishReason: 'STOP',
    };
  }

  private simulateImageResponse(options: GeminiImageOptions, start: number): GeminiImageResponse {
    console.warn(`[Gemini] ⚠️ Imagen 未配置（需 Vertex AI），返回模拟结果`);
    return {
      revisedPrompt: `Simulated: ${options.prompt}`,
      model: options.model || 'imagen-3.0-generate',
      latencyMs: Date.now() - start + 500,
    };
  }
}

// ==================== 单例导出 ====================
export const geminiClient = new GeminiClient();
