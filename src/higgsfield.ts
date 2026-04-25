/**
 * Higgsfield × Seedance 2.0 视频生成 API
 * =============================================
 * 集成平台: Higgsfield (https://higgsfield.ai)
 * 模型: Seedance 2.0 by ByteDance
 * API 来源: seedanceapi.org (第三方兼容 API)
 *
 * 官方文档: https://higgsfield.ai/seedance/2.0
 * API 文档: https://seedanceapi.org
 *
 * 主要功能:
 * - 文字转视频 (Text-to-Video)
 * - 图片转视频 (Image-to-Video) — 完美承接 GPT Image 2
 * - 原生音频同步生成
 * - 多镜头叙事 (Multi-Shot)
 * - 角色一致性保持
 *
 * 工作流程:
 * Step 1: 用 GPT Image 2 生成基础图像
 * Step 2: 将图像注入 Seedance 2.0 转为视频
 * Step 3: 添加商品旋转/场景动画等效果
 */

import 'dotenv/config';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

export interface SeedanceGenerateOptions {
  prompt: string;
  aspect_ratio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '21:9' | '9:21';
  resolution?: '480p' | '720p';
  duration?: 4 | 8 | 12;
  generate_audio?: boolean;
  fixed_lens?: boolean;
  image_url?: string;   // 单张参考图（GPT Image 2 生成的图像 URL）
  image_base64?: string; // 或 base64 格式
  callback_url?: string;
}

export interface SeedanceTask {
  task_id: string;
  status: 'IN_PROGRESS' | 'SUCCESS' | 'FAILED';
  consumed_credits?: number;
  created_at?: string;
  request?: Partial<SeedanceGenerateOptions>;
  response?: string[];  // 视频 URL 数组
  error_message?: string | null;
}

export interface SeedanceApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

// ══════════════════════════════════════════════════════════════
// API 客户端
// ══════════════════════════════════════════════════════════════

const API_BASE = process.env.SEEDANCE_API_BASE || 'https://seedanceapi.org/v1';
const API_KEY = process.env.SEEDANCE_API_KEY || '';

// ── 价格表 ─────────────────────────────────────────────────
export const PRICING_TABLE = {
  '480p': {
    '4s':  { noAudio: { credits: 8,  usd: 0.04  }, withAudio: { credits: 14, usd: 0.07  } },
    '8s':  { noAudio: { credits: 14, usd: 0.07  }, withAudio: { credits: 28, usd: 0.14  } },
    '12s': { noAudio: { credits: 19, usd: 0.095 }, withAudio: { credits: 38, usd: 0.19  } },
  },
  '720p': {
    '4s':  { noAudio: { credits: 14, usd: 0.07  }, withAudio: { credits: 28, usd: 0.14  } },
    '8s':  { noAudio: { credits: 28, usd: 0.14  }, withAudio: { credits: 56, usd: 0.28  } },
    '12s': { noAudio: { credits: 42, usd: 0.21  }, withAudio: { credits: 84, usd: 0.42  } },
  },
};

// ── 预置提示词（电商/广告专用）────────────────────────────────
export const PRESET_PROMPTS = {
  productRotate: {
    icon: '🎬',
    label: '商品旋转',
    category: '电商广告',
    prompt: `A cinematic commercial product advertisement, smooth gimbal camera with minimal movement, clean sharp motion, professional kitchen setting. A woman with long blonde hair in white off-shoulder top slowly brings a piece of kimchi toward her mouth — lips parting, eyes closing briefly as she bites into it. The reaction: genuine, slow, savoring. Not dramatic, just real satisfaction crossing her face. A small strand of kimchi sauce catches the light on her lip. Her rings and long nails catching kitchen ambient light as her hand lowers. Motion slow and deliberate. Camera stays almost completely still.
Simultaneously in lower left corner: the red kimchi product container rotates slowly 360 degrees on its own axis — smooth, continuous, clockwise, one full revolution every 4 seconds. Key light upper left on red lid and label. Specular highlight rolling across lid surface as it rotates. Clean, premium.
Throughout the entire 10 seconds — all UI text and layout elements remain fully visible and static on screen: top navigation bar with KIMCHI logo, HOME ABOUT SHOP RECIPES SUBSCRIPTION links, SHOP NOW button top right. Left side large white text "REAL KIMCHI. REAL FLAVOR." with tagline below. Three feature icons and text at bottom left. SEOUL MADE badge lower right. Bottom product bar with Signature Napa Cabbage Kimchi card, star rating, and three column descriptions. All text elements stay locked in position, fully readable, never fading. The motion happens within the frame behind and around the static UI.`,
  },
  cinematicAd: {
    icon: '🎥',
    label: '电影广告',
    category: '品牌广告',
    prompt: `A cinematic commercial product advertisement, [CAMERA: smooth gimbal / static locked / slow dolly], [FPS: 24fps], clean sharp motion, [DETAIL 1: product being elegantly presented], [DETAIL 2: subtle light reflections on product surface]. Camera stays [CAMERA BEHAVIOR: almost completely still / pushes in slowly / orbits gently]. Background: [BACKGROUND: professional kitchen / bright studio white / outdoor bokeh / moody restaurant].
Simultaneously in [PRODUCT POSITION: lower left / lower right / center bottom / corner] corner: the [PRODUCT DESCRIPTION: branded product container] rotates slowly 360 degrees on its own axis — smooth, continuous, [DIRECTION: clockwise / counterclockwise], one full revolution every [SPEED: 4 seconds / 6 seconds / 8 seconds]. [LIGHTING: Key light upper left on lid and label. Specular highlight rolling across surface as it rotates.] [PRODUCT FEEL: Clean, premium / rustic, handmade / bold, graphic].
Throughout the entire [DURATION: 10 seconds] — all UI text and layout elements remain fully visible and static on screen: [UI ELEMENTS: top navigation bar with logo, nav links, CTA button / hero headline left side / feature icons bottom / badge lower right / product card bottom bar]. All text elements stay locked in position, fully readable, never fading.`,
  },
  lifestyleMotion: {
    icon: '🌿',
    label: '生活场景',
    category: '内容种草',
    prompt: `A beautiful lifestyle video, natural lighting, bokeh background, smooth camera movement. A person [ACTION: holding / using / enjoying] the product in a [SETTING: cozy home kitchen / outdoor cafe / modern living room]. The moment is [MOOD: relaxed / energetic / luxurious / wholesome]. Soft golden hour light. Camera gently moves to reveal the product details. All text overlays stay perfectly still — headlines, product name, tagline, call-to-action button — while the background and people move naturally around them.`,
  },
  fashionShow: {
    icon: '👗',
    label: '时尚走秀',
    category: '时尚服装',
    prompt: `High-fashion runway show, professional studio lighting, 4K ultra-detailed. Models walking confidently down the runway in [STYLE: elegant evening wear / streetwear / haute couture]. The camera stays locked on the model's face and upper body, capturing the outfit's details as she passes. Smooth, deliberate motion. Background: minimalist black/white runway with soft spotlights. All UI text for brand name and product details remain static and readable on screen.`,
  },
  techProduct: {
    icon: '💻',
    label: '科技产品',
    category: '3C电子',
    prompt: `A sleek tech product commercial, minimalist white studio background, dramatic product reveal. The [PRODUCT: laptop / phone / wearable] floats and rotates slowly, showing all angles. Studio lighting creates beautiful specular highlights on the metallic surface. Camera stays mostly still, letting the product be the hero. All text overlays — product name, tagline, features list, CTA button — stay perfectly locked and readable throughout. Clean, premium, Apple-style aesthetic.`,
  },
  beforeAfter: {
    icon: '✨',
    label: '前后对比',
    category: '效果展示',
    prompt: `A smooth transformation video showing before and after effect. The scene starts [STARTING STATE] then gradually transitions to [END STATE] with natural motion. Soft, clean background. Camera stays fixed. All text overlays — "BEFORE" label, "AFTER" label, transformation description, brand name — remain static and perfectly readable throughout. Subtle ambient music. Elegant and professional.`,
  },
  multiShotStory: {
    icon: '🎞️',
    label: '多镜头故事',
    category: '品牌叙事',
    prompt: `A cinematic multi-shot narrative, 24fps film quality. Shot 1: Wide establishing shot of [SCENE]. Shot 2: Medium shot revealing the product in context. Shot 3: Close-up on product details and human interaction. All shots connect seamlessly with natural camera movement. Each shot transitions smoothly into the next. Professional color grading, warm cinematic tones. All brand text and graphics stay locked on screen throughout all shots.`,
  },
};

// ══════════════════════════════════════════════════════════════
// 核心 API 函数
// ══════════════════════════════════════════════════════════════

/** 检查 API Key 是否配置 */
export function isConfigured(): boolean {
  return !!(API_KEY || process.env.HIGGSFIELD_API_KEY);
}

/** 获取 API Key（支持多个环境变量名） */
function getApiKey(): string {
  return API_KEY || process.env.HIGGSFIELD_API_KEY || '';
}

/** 统一请求头 */
function getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
  };
}

/**
 * 提交视频生成任务
 * @returns task_id（用于后续轮询状态）
 */
export async function generateVideo(
  options: SeedanceGenerateOptions
): Promise<{ task_id: string; status: string }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SEEDANCE_API_KEY / HIGGSFIELD_API_KEY 未配置，请在 .env 中设置');
  }

  const body: Record<string, unknown> = {
    prompt: options.prompt.trim(),
    aspect_ratio: options.aspect_ratio || '16:9',
    resolution: options.resolution || '720p',
    duration: options.duration || 8,
    generate_audio: options.generate_audio ?? false,
    fixed_lens: options.fixed_lens ?? false,
  };

  // 图片输入（支持 URL 或 base64）
  if (options.image_url) {
    body.image_urls = [options.image_url];
  } else if (options.image_base64) {
    // Seedance API 目前仅支持 URL，这里通过 data URI 转发
    body.image_urls = [`data:image/png;base64,${options.image_base64}`];
  }

  const response = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });

  const data = await response.json() as SeedanceApiResponse<{ task_id: string; status: string }>;

  if (!response.ok || data.code !== 200) {
    const errorMap: Record<number, string> = {
      400: '参数错误，请检查 prompt / aspect_ratio / resolution / duration',
      401: 'API Key 无效或未授权',
      402: '积分不足，请充值',
      429: '请求过于频繁，请稍后重试',
      500: '服务器内部错误',
    };
    const hint = errorMap[data.code] || errorMap[response.status] || `错误码 ${data.code}`;
    throw new Error(`Seedance API 错误: ${data.message} [${data.code}] | ${hint}`);
  }

  return {
    task_id: data.data.task_id,
    status: data.data.status,
  };
}

/**
 * 轮询任务状态（直到完成或失败）
 * @param taskId 任务 ID
 * @param onProgress 进度回调（可选）
 * @param maxWait 最大等待时间（秒），默认 300秒（5分钟）
 */
export async function pollTaskStatus(
  taskId: string,
  onProgress?: (status: string) => void,
  maxWait = 300
): Promise<SeedanceTask> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('SEEDANCE_API_KEY / HIGGSFIELD_API_KEY 未配置');
  }

  const startTime = Date.now();
  const poll = async (): Promise<SeedanceTask> => {
    if (Date.now() - startTime > maxWait * 1000) {
      throw new Error(`任务超时（>${maxWait}秒），请手动查询 task_id: ${taskId}`);
    }

    const response = await fetch(`${API_BASE}/status?task_id=${encodeURIComponent(taskId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(`状态查询失败 HTTP ${response.status}`);
    }

    const data = await response.json() as SeedanceApiResponse<SeedanceTask>;

    if (data.code !== 200) {
      throw new Error(`状态查询错误: ${data.message} [${data.code}]`);
    }

    const task = data.data;
    onProgress?.(`状态: ${task.status}`);

    if (task.status === 'SUCCESS') {
      return task;
    } else if (task.status === 'FAILED') {
      throw new Error(`生成失败: ${task.error_message || '未知错误'}`);
    }

    // IN_PROGRESS，继续轮询（指数退避）
    await new Promise(r => setTimeout(r, 5000)); // 每5秒轮询
    return poll();
  };

  return poll();
}

/**
 * 一站式生成（提交 + 轮询直到完成）
 * 适用于小任务；大任务建议分离调用
 */
export async function generateVideoUntilDone(
  options: SeedanceGenerateOptions,
  onProgress?: (msg: string) => void
): Promise<{ task_id: string; video_url: string; consumed_credits: number }> {
  onProgress?.('🚀 提交生成任务...');
  const { task_id } = await generateVideo(options);
  onProgress?.(`📋 任务已提交: ${task_id}，开始轮询...`);

  const task = await pollTaskStatus(task_id, onProgress);
  onProgress?.('✅ 视频生成完成！');

  const videoUrl = task.response?.[0];
  if (!videoUrl) {
    throw new Error('生成成功但未返回视频 URL，请联系支持');
  }

  return {
    task_id,
    video_url: videoUrl,
    consumed_credits: task.consumed_credits || 0,
  };
}

/**
 * 估算费用
 */
export function estimateCost(options: Pick<SeedanceGenerateOptions, 'resolution' | 'duration' | 'generate_audio'>): {
  credits: number;
  usd: number;
  label: string;
} {
  const res = options.resolution || '720p';
  const dur = String(options.duration || 8) as '4s' | '8s' | '12s';
  const tier = PRICING_TABLE[res as keyof typeof PRICING_TABLE]?.[dur];
  if (!tier) return { credits: 0, usd: 0, label: '未知' };

  const audioKey = options.generate_audio ? 'withAudio' : 'noAudio';
  const price = tier[audioKey];
  return {
    credits: price.credits,
    usd: price.usd,
    label: `${res} / ${dur} / ${options.generate_audio ? '有音频' : '无音频'}`,
  };
}

/**
 * 获取 API 配置状态
 */
export function getStatus() {
  const hasKey = !!(getApiKey());
  return {
    configured: hasKey,
    provider: 'seedanceapi.org (Higgsfield)',
    baseUrl: API_BASE,
    docsUrl: 'https://seedanceapi.org',
    platformUrl: 'https://higgsfield.ai/seedance/2.0',
    features: [
      'text-to-video',
      'image-to-video',
      'native-audio-sync',
      'multi-shot-narrative',
      'character-consistency',
      '720p / 480p resolution',
      '4s / 8s / 12s duration',
    ],
    workflow: {
      step1: 'GPT Image 2: 用 GPT Image 2 生成基础图像',
      step2: 'Seedance 2.0: 将图像注入转为视频（Image-to-Video）',
      step3: '精细调整: 添加商品旋转/场景动画等效果',
    },
    pricing: PRICING_TABLE,
  };
}
