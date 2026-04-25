/**
 * SIMIAICLAW 龙虾集群 · 静态广告生成器
 * 基于 GPT Image 2 · 批量生成 Meta 广告 · 多用户画像变体
 * 工作流: 参考图 → 品牌工具包 → AI画像 → 批量生成 → 下载
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

// ─── 常量 ────────────────────────────────────────────────────────────────────
const AD_SIZE_OPTIONS = [
  { label: '1K · 1080×1080', value: '1080x1080', desc: '方形 · Meta广告主力尺寸' },
  { label: '1K · 1200×628', value: '1200x628', desc: '横版 · 链接广告' },
  { label: '1K · 1080×1920', value: '1080x1920', desc: '竖版 · Stories/Reels' },
  { label: '1K · 1200×1200', value: '1200x1200', desc: '大方形 · 产品目录' },
];

const PERSONA_EXAMPLES = [
  { emoji: '👩‍💼', title: '都市职场女性', age: '28-38岁', pain: '时间紧张，追求效率，愿意为品质付费', value: 0 },
  { emoji: '👨‍👩‍👧', title: '年轻家庭', age: '30-40岁', pain: '关注安全性与性价比，有孩子的家庭决策者', value: 1 },
  { emoji: '🧑‍💻', title: '科技爱好者', age: '22-32岁', pain: '追求新奇功能，注重数据对比，社交分享欲强', value: 2 },
  { emoji: '👵', title: '银发一族', age: '55-65岁', pain: '操作简便是大需求，对健康/便利类产品感兴趣', value: 3 },
  { emoji: '💰', title: '精打细算型', age: '25-45岁', pain: '对价格敏感，需要明显的促销信号和口碑背书', value: 4 },
  { emoji: '🌟', title: '品质生活派', age: '30-50岁', pain: '注重品牌调性，愿意为设计和体验溢价', value: 5 },
];

const CTA_OPTIONS = [
  'Shop Now', 'Learn More', 'Get Started', 'Sign Up Free', 'Book Now',
  'Limited Time Offer', 'Discover More', 'Try It Free', 'Get Yours Today', 'Join Now',
];

// ─── 跨境电商产品场景预设 Prompt（GPT Image 2）────────────────────────────────
// 预设来源: 飞象AI flyelep.cn · 邀请码 260109
export const PRODUCT_SCENE_PRESETS = [
  {
    id: 'fashion-eyewear',
    emoji: '🕶️',
    name: '时尚眼镜',
    category: '服饰配件',
    style: 'Avant-garde Fashion',
    promptFull: 'Avant-garde fashion advertisement, oversized futuristic sunglasses positioned like sculpture, model casually seated on the frame as if furniture, giant word "VISION" behind in bold white typography, powder blue studio background, reflective floor, luxury eyewear campaign aesthetic, ultra-clean layout, editorial magazine styling, ultra-clean composition, 1:1 aspect ratio',
  },
  {
    id: 'luxury-watch',
    emoji: '⌚',
    name: '奢华腕表',
    category: '奢侈品',
    style: 'Minimalist Luxury',
    promptFull: 'Minimalist luxury watch campaign, oversized wristwatch positioned like modern sculpture, model leaning against the dial, giant word "TIME" in bold typography behind, deep emerald studio background, reflective polished floor, Swiss luxury advertising aesthetic, cinematic editorial styling, ultra-clean composition, 1:1 aspect ratio',
  },
  {
    id: 'cosmetics-skincare',
    emoji: '💄',
    name: '美妆护肤',
    category: '美妆个护',
    style: 'Clean Beauty',
    promptFull: 'Clean beauty skincare advertisement, glass bottle product glowing with golden light in soft natural lighting, premium packaging design, soft pink and beige color palette, minimal background, healthy glowing skin texture, refined feminine lifestyle aesthetic, 1:1 aspect ratio',
  },
  {
    id: 'electronics-tech',
    emoji: '🎧',
    name: '消费电子',
    category: '数码科技',
    style: 'Tech Lifestyle',
    promptFull: 'Minimalist tech product advertisement, over-ear wireless headphones floating on pure white background, neon blue light glow, ice blue color palette, clean background, futuristic product photography, Apple-style minimalist aesthetic, high-end tech feel, 1:1 aspect ratio',
  },
  {
    id: 'home-decor',
    emoji: '🏠',
    name: '家居装饰',
    category: '家居生活',
    style: 'Scandinavian Lifestyle',
    promptFull: 'Scandinavian home decor advertisement, minimal white living room space, wooden furniture piece in natural light, soft grey color palette, Nordic lifestyle aesthetic, ethereal clean interior design magazine style, 1:1 aspect ratio',
  },
  {
    id: 'sportswear-activewear',
    emoji: '👟',
    name: '运动服饰',
    category: '运动户外',
    style: 'Athletic Energy',
    promptFull: 'High-performance activewear advertisement, professional running shoes in motion, dynamic composition, vivid orange and black contrast, athletic energy, fast-paced sporty fashion photography, Nike/Adidas bold typography style, 1:1 aspect ratio',
  },
  {
    id: 'food-beverage',
    emoji: '🍷',
    name: '食品饮料',
    category: '食品餐饮',
    style: 'Gourmet Editorial',
    promptFull: 'Gourmet editorial food advertisement, premium product on light marble background, golden color palette, magazine food photography style, upscale dining aesthetic, natural lighting, appetizing food presentation, 1:1 aspect ratio',
  },
  {
    id: 'jewelry-diamonds',
    emoji: '💎',
    name: '珠宝首饰',
    category: '珠宝钟表',
    style: 'Diamond Luxury',
    promptFull: 'Fine jewelry diamond advertisement, diamond engagement ring on black velvet background, dramatic side lighting, sparkling diamond light effects, luxurious black and gold color palette, high-end jewelry catalog photography, delicate and elegant presentation, 1:1 aspect ratio',
  },
  {
    id: 'pet-supplies',
    emoji: '🐾',
    name: '宠物用品',
    category: '宠物生活',
    style: 'Warm Pet Lifestyle',
    promptFull: 'Warm and inviting pet supplies advertisement, premium dog collar and accessories arranged artistically with soft natural light, cozy home environment background, warm earth tones and cream color palette, heartwarming lifestyle photography, pet-parent emotional appeal, clean modern aesthetic, 1:1 aspect ratio',
  },
  {
    id: 'baby-products',
    emoji: '🍼',
    name: '母婴用品',
    category: '母婴儿童',
    style: 'Soft Maternal Care',
    promptFull: 'Gentle and tender baby care products advertisement, premium baby bottle and essentials softly lit with diffused daylight, pastel mint and blush pink color palette, clean white studio background, nurturing maternal care aesthetic, emotional parent-child lifestyle feel, ultra-clean composition, 1:1 aspect ratio',
  },
  {
    id: 'luggage-bags',
    emoji: '🧳',
    name: '箱包皮具',
    category: '旅行户外',
    style: 'Premium Travel Lifestyle',
    promptFull: 'Premium travel luggage advertisement, luxury hardshell suitcase positioned as centerpiece in elegant airport lounge setting, rich navy blue and gold accents color palette, sophisticated travel lifestyle aesthetic, cinematic composition, professional studio lighting, editorial magazine quality, 1:1 aspect ratio',
  },
  {
    id: 'outdoor-gear',
    emoji: '🏕️',
    name: '户外装备',
    category: '运动户外',
    style: 'Adventure Outdoor',
    promptFull: 'Dynamic outdoor adventure gear advertisement, premium camping equipment arranged in dramatic mountain landscape, deep forest green and burnt orange color palette, misty mountain background, sense of adventure and exploration, bold outdoor lifestyle photography, high contrast professional lighting, 1:1 aspect ratio',
  },
  {
    id: 'fragrance-perfume',
    emoji: '🌸',
    name: '香氛香水',
    category: '美妆个护',
    style: 'Luxury Fragrance Editorial',
    promptFull: 'Luxury perfume fragrance advertisement, artisan perfume bottle as sculptural centerpiece floating in ethereal soft focus, muted rose gold and ivory color palette, dreamy atmospheric lighting, editorial fashion magazine aesthetic, delicate feminine elegance, ultra-minimal composition with maximum impact, 1:1 aspect ratio',
  },
  {
    id: 'tea-beverages',
    emoji: '🍵',
    name: '茶饮冲调',
    category: '食品餐饮',
    style: 'Oriental Wellness Tea',
    promptFull: 'Premium oriental wellness tea advertisement, artisan tea leaves and ceramic teacup in zen minimalist setting, natural wood and jade green color palette, soft natural diffused lighting, serene Asian wellness aesthetic, premium tea lifestyle photography, clean editorial composition, 1:1 aspect ratio',
  },
  {
    id: 'fitness-equipment',
    emoji: '🏋️',
    name: '健身器材',
    category: '运动户外',
    style: 'High-Performance Fitness',
    promptFull: 'High-performance fitness equipment advertisement, premium dumbbells and gym gear in modern gym environment, bold black and electric cyan color palette, energetic gym setting with dramatic lighting, motivational athletic aesthetic, powerful fitness lifestyle photography, bold typography accents, 1:1 aspect ratio',
  },
];

// ─── 类型 ────────────────────────────────────────────────────────────────────
interface Persona {
  id: number;
  emoji: string;
  title: string;
  age: string;
  pain: string;
  copy: string;
  selected: boolean;
}

interface GeneratedAd {
  personaId: number;
  personaTitle: string;
  image: string | null;
  b64_json: string | null;
  revised_prompt: string | null;
  status: 'pending' | 'generating' | 'done' | 'error';
  error?: string;
}

interface BrandKit {
  logo: string | null; // base64
  primaryColor: string;
  secondaryColor: string;
  brandVoice: string;
  fonts: string;
  tagline: string;
}

// ─── 组件 ────────────────────────────────────────────────────────────────────
export function StaticAdGeneratorPanel() {
  const [step, setStep] = useState(1);

  // 预设状态
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Step 1: 参考图
  const [refImage, setRefImage] = useState<string | null>(null);
  const [refImageFormat, setRefImageFormat] = useState('png');
  const [refImageName, setRefImageName] = useState('');
  const refInput = useRef<HTMLInputElement>(null);

  // Step 2: 品牌工具包
  const [brandKit, setBrandKit] = useState<BrandKit>({
    logo: null,
    primaryColor: '#FF6B35',
    secondaryColor: '#1A1A2E',
    brandVoice: '',
    fonts: '',
    tagline: '',
  });
  const logoInput = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Step 3: 品牌研究文本
  const [brandResearch, setBrandResearch] = useState('');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [generatingPersonas, setGeneratingPersonas] = useState(false);
  const [personaResult, setPersonaResult] = useState('');

  // Step 4: 生成参数
  const [adSize, setAdSize] = useState('1080x1080');
  const [adCount, setAdCount] = useState(10);
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<number[]>([0, 1, 2]);
  const [selectedCTA, setSelectedCTA] = useState('Shop Now');
  const [adSizeQuality] = useState<'low' | 'medium' | 'high'>('high');

  // Step 5: 生成结果
  const [generatedAds, setGeneratedAds] = useState<GeneratedAd[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [progressPct, setProgressPct] = useState(0);

  // API状态
  const [apiStatus, setApiStatus] = useState<any>(null);

  const checkApiStatus = useCallback(async () => {
    try {
      const r = await fetch('/api/gpt-image/status');
      const data = await r.json();
      setApiStatus(data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { checkApiStatus(); }, [checkApiStatus]);

  // ── 文件 → Base64 ──────────────────────────────────────────────────────────
  const fileToBase64 = (file: File): Promise<{ b64: string; format: string }> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const format = file.type.split('/')[1]?.replace('jpeg', 'jpeg') || 'png';
        const b64 = result.split(',')[1];
        resolve({ b64, format });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ── Step 1: 上传参考图 ──────────────────────────────────────────────────────
  const handleRefUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('参考图不能超过 10MB'); return; }
    const { b64, format } = await fileToBase64(file);
    setRefImage(b64);
    setRefImageFormat(format);
    setRefImageName(file.name);
    toast.success(`参考图已加载: ${(file.size / 1024).toFixed(0)}KB`);
  };

  // ── Step 2: 上传Logo ────────────────────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo不能超过 2MB'); return; }
    const { b64 } = await fileToBase64(file);
    setBrandKit(prev => ({ ...prev, logo: b64 }));
    setLogoPreview(`data:image/png;base64,${b64}`);
    toast.success('品牌Logo已上传');
  };

  // ── Step 3: 生成画像 ────────────────────────────────────────────────────────
  const handleGeneratePersonas = async () => {
    if (!brandResearch.trim()) { toast.error('请输入品牌研究内容'); return; }

    setGeneratingPersonas(true);
    setPersonas([]);
    setPersonaResult('');

    try {
      const r = await fetch('/api/ad-generator/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandResearch: brandResearch.trim(),
          productType: 'general product',
        }),
        signal: AbortSignal.timeout(60_000),
      });

      const data = await r.json();

      if (!r.ok) {
        toast.error(data.error || '画像生成失败');
        setGeneratingPersonas(false);
        return;
      }

      // 解析画像数据
      if (data.personas && Array.isArray(data.personas)) {
        const parsed: Persona[] = data.personas.map((p: any, i: number) => ({
          id: i,
          emoji: p.emoji || PERSONA_EXAMPLES[i % PERSONA_EXAMPLES.length].emoji,
          title: p.title || `画像 ${i + 1}`,
          age: p.age || '',
          pain: p.pain || '',
          copy: p.copy || '',
          selected: true,
        }));
        setPersonas(parsed);
        setPersonaResult(data.raw || '');
      } else {
        // 备用：使用示例画像
        const fallback: Persona[] = PERSONA_EXAMPLES.slice(0, 6).map((ex, i) => ({
          id: i,
          emoji: ex.emoji,
          title: ex.title,
          age: ex.age,
          pain: ex.pain,
          copy: `Perfect for ${ex.title}. ${brandResearch.slice(0, 50)}...`,
          selected: true,
        }));
        setPersonas(fallback);
        setPersonaResult(data.raw || data.content || '');
      }

      toast.success(`已生成 ${data.personas?.length || 6} 个客户画像`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('画像生成失败: ' + msg);
      // 使用默认画像兜底
      const fallback: Persona[] = PERSONA_EXAMPLES.map((ex, i) => ({
        id: i,
        emoji: ex.emoji,
        title: ex.title,
        age: ex.age,
        pain: ex.pain,
        copy: `Perfect for ${ex.title}. ${brandResearch.slice(0, 50)}...`,
        selected: true,
      }));
      setPersonas(fallback);
    } finally {
      setGeneratingPersonas(false);
    }
  };

  // ── 画像选择 ────────────────────────────────────────────────────────────────
  const togglePersona = (id: number) => {
    setPersonas(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p));
  };

  // ── Step 5: 批量生成广告 ───────────────────────────────────────────────────
  const buildPrompt = (persona: Persona, refB64: string | null): string => {
    // 选中的预设视觉方向
    const selectedPreset = PRODUCT_SCENE_PRESETS.find(p => p.id === selectedPresetId);

    const brandDesc = brandKit.brandVoice
      ? `Brand voice: ${brandKit.brandVoice}.`
      : '';
    const colorDesc = `Brand colors: primary ${brandKit.primaryColor}, secondary ${brandKit.secondaryColor}.`;
    const tagLine = brandKit.tagline ? `Include brand tagline: "${brandKit.tagline}".` : '';
    const ctaText = `Call to action text: "${selectedCTA}".`;
    const refNote = refB64
      ? 'Use the provided reference image as the creative style and composition template. Maintain the same visual aesthetic, layout structure, and advertising style while adapting the product and branding.'
      : '';
    const personaContext = `Target audience persona: ${persona.title} (${persona.age}). Key pain point: ${persona.pain}. Ad copy: ${persona.copy || selectedCTA}.`;

    // 预设视觉段落（有预设时优先，无预设用通用广告语）
    const presetStyle = selectedPreset
      ? `Visual direction: ${selectedPreset.promptFull}`
      : 'Professional Meta advertisement creative for social media. Clean modern advertising design, high contrast, professional lighting.';

    // 若有预设，移除通用广告语并在预设后补充品牌适配指令
    const brandAdapt = selectedPreset && brandKit.brandVoice
      ? `Adapt the above visual style to reflect brand personality: ${brandKit.brandVoice}.`
      : '';

    return [
      presetStyle,
      colorDesc,
      brandDesc,
      brandAdapt,
      tagLine,
      ctaText,
      personaContext,
      refNote,
      'Text must be clearly legible, high resolution, no watermarks.',
      'Aspect ratio suitable for social media feed placement.',
    ].filter(Boolean).join(' ');
  };

  const handleGenerateAds = async () => {
    const selectedPersonas = personas.filter(p => p.selected);
    if (selectedPersonas.length === 0) { toast.error('请至少选择 1 个客户画像'); return; }
    if (!apiStatus?.configured) { toast.error('GPT Image API 未配置'); return; }

    setGenerating(true);
    setStep(5);

    const total = Math.min(adCount, selectedPersonas.length * 3);
    const ads: GeneratedAd[] = [];
    let done = 0;

    // 初始化所有广告槽位
    for (let i = 0; i < total; i++) {
      const personaIdx = i % selectedPersonas.length;
      const persona = selectedPersonas[personaIdx];
      ads.push({
        personaId: persona.id,
        personaTitle: persona.title,
        image: null,
        b64_json: null,
        revised_prompt: null,
        status: 'pending',
      });
    }
    setGeneratedAds(ads);

    // 逐张生成
    for (let i = 0; i < total; i++) {
      const personaIdx = i % selectedPersonas.length;
      const persona = selectedPersonas[personaIdx];
      const currentPrompt = buildPrompt(persona, refImage);

      setGeneratedAds(prev => prev.map((a, idx) =>
        idx === i ? { ...a, status: 'generating' as const } : a
      ));

      setProgress(`[${i + 1}/${total}] 生成中: ${persona.title}...`);
      setProgressPct(Math.round(((i + 0.5) / total) * 100));

      try {
        const body: Record<string, unknown> = {
          prompt: currentPrompt,
          model: 'gpt-image-2',
          size: adSize,
          quality: adSizeQuality,
          output_format: 'png',
          n: 1,
        };

        if (refImage) {
          body.input_image = refImage;
          body.input_image_format = refImageFormat;
        }

        const r = await fetch('/api/gpt-image/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(360_000),
        });

        const data = await r.json();

        if (!r.ok) {
          throw new Error(data.error || '生成失败');
        }

        const img = data.images?.[0];

        setGeneratedAds(prev => prev.map((a, idx) =>
          idx === i ? {
            ...a,
            status: 'done' as const,
            image: img?.b64_json ? `data:image/png;base64,${img.b64_json}` : null,
            b64_json: img?.b64_json || null,
            revised_prompt: img?.revised_prompt || null,
          } : a
        ));

      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setGeneratedAds(prev => prev.map((a, idx) =>
          idx === i ? { ...a, status: 'error' as const, error: msg } : a
        ));
      }

      done++;
      setProgressPct(Math.round((done / total) * 100));
    }

    setProgress('');
    setGenerating(false);
    toast.success(`${total} 个广告变体生成完成！`);
  };

  // ── 下载 ────────────────────────────────────────────────────────────────────
  const downloadAll = () => {
    generatedAds.forEach((ad, i) => {
      if (ad.b64_json) {
        setTimeout(() => {
          const a = document.createElement('a');
          a.href = `data:image/png;base64,${ad.b64_json}`;
          a.download = `meta-ad-${ad.personaTitle.replace(/\s+/g, '-')}-${i + 1}.png`;
          a.click();
        }, i * 200);
      }
    });
  };

  const downloadSingle = (ad: GeneratedAd) => {
    if (!ad.b64_json) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${ad.b64_json}`;
    a.download = `meta-ad-${ad.personaTitle.replace(/\s+/g, '-')}-${Date.now()}.png`;
    a.click();
  };

  // ── 进度统计 ────────────────────────────────────────────────────────────────
  const doneCount = generatedAds.filter(a => a.status === 'done').length;
  const errorCount = generatedAds.filter(a => a.status === 'error').length;
  const successCount = generatedAds.filter(a => a.status === 'done' && a.b64_json).length;

  const canProceed = () => {
    if (step === 1) return !!refImage;
    if (step === 2) return true; // brand kit optional
    if (step === 3) return personas.length > 0;
    if (step === 4) return selectedPersonaIds.length > 0 || personas.filter(p => p.selected).length > 0;
    return false;
  };

  const selectedCount = () => personas.filter(p => p.selected).length;

  // ── 渲染 ────────────────────────────────────────────────────────────────────
  const STEPS = [
    { n: 1, icon: '🖼️', label: '参考图' },
    { n: 2, icon: '🎨', label: '品牌工具包' },
    { n: 3, icon: '👥', label: '客户画像' },
    { n: 4, icon: '⚙️', label: '生成参数' },
    { n: 5, icon: '🚀', label: '批量生成' },
  ];

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #f97316, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          📣
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>静态广告批量生成器</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            GPT Image 2 驱动 · 参考图 + 品牌包 + AI画像 = 数十个品牌变体
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: apiStatus?.configured ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${apiStatus?.configured ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 11, color: apiStatus?.configured ? '#4ade80' : '#f87171',
          }}>
            {apiStatus?.configured ? '✅ GPT Image Ready' : '⚠️ API 未配置'}
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24,
        overflowX: 'auto', paddingBottom: 4,
      }}>
        {STEPS.map(s => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {s.n > 1 && (
              <div style={{
                width: 24, height: 2,
                background: step > s.n - 1 ? '#f97316' : '#334155',
                marginRight: 8, flexShrink: 0,
              }} />
            )}
            <div
              onClick={() => !generating && (step > s.n ? setStep(s.n) : null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 20, fontSize: 12,
                cursor: step > s.n ? 'pointer' : 'default',
                background: step === s.n
                  ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.2))'
                  : step > s.n
                    ? 'rgba(34,197,94,0.1)'
                    : 'rgba(51,65,85,0.3)',
                border: step === s.n
                  ? '1px solid rgba(249,115,22,0.4)'
                  : step > s.n
                    ? '1px solid rgba(34,197,94,0.3)'
                    : '1px solid rgba(100,116,139,0.2)',
                color: step === s.n ? '#fb923c' : step > s.n ? '#4ade80' : '#64748b',
                fontWeight: step === s.n ? 700 : 500,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <span>{step > s.n ? '✅' : s.icon}</span>
              <span>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Step 1: 参考图上传 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 左侧说明 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 20, borderRadius: 14,
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fb923c', marginBottom: 10 }}>
                🖼️ Step 1: 上传竞争对手广告（参考模板）
              </div>
              <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
                <p>上传一个你认为设计出色的竞争对手广告，AI 将学习其构图风格、配色方案和视觉语言，并生成具有相同广告美感但融入你品牌的新广告。</p>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { icon: '✅', text: '突出构图和布局结构' },
                    { icon: '✅', text: '保持相同的视觉美学' },
                    { icon: '✅', text: '参考色调和字体风格' },
                    { icon: '💡', text: '也可以跳过，使用通用广告模板' },
                  ].map(item => (
                    <div key={item.text} style={{ fontSize: 12, color: '#64748b' }}>
                      <span style={{ marginRight: 6 }}>{item.icon}</span>
                      {item.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(100,116,139,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                💡 最佳实践
              </div>
              {[
                '选择转化率高的竞品广告作为参考',
                '避免选择文字过多或过杂的创意',
                '优先选择与你目标市场风格接近的素材',
                '支持 JPG/PNG/WebP，≤10MB',
              ].map(tip => (
                <div key={tip} style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                  • {tip}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!refImage}
              style={{
                padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: !refImage ? 'rgba(100,116,139,0.3)' : 'linear-gradient(135deg, #f97316, #ec4899)',
                border: !refImage ? '1px solid rgba(100,116,139,0.2)' : '1px solid rgba(249,115,22,0.5)',
                color: !refImage ? '#64748b' : '#fff',
                cursor: !refImage ? 'not-allowed' : 'pointer',
                boxShadow: !refImage ? 'none' : '0 4px 20px rgba(249,115,22,0.25)',
              }}
            >
              {refImage ? '✅ 已上传参考图 · 继续 →' : '请先上传参考图（可跳过）'}
            </button>
            <button
              onClick={() => { setRefImage(null); setStep(2); }}
              style={{
                padding: '8px', borderRadius: 10, fontSize: 12,
                background: 'rgba(51,65,85,0.3)',
                border: '1px solid rgba(100,116,139,0.2)',
                color: '#64748b', cursor: 'pointer',
              }}
            >
              💡 跳过此步，使用通用模板
            </button>
          </div>

          {/* 右侧上传区 */}
          <div>
            <input
              ref={refInput}
              type="file"
              accept="image/*"
              onChange={handleRefUpload}
              style={{ display: 'none' }}
            />
            <label
              onClick={() => refInput.current?.click()}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: 360, borderRadius: 14, cursor: 'pointer',
                border: refImage ? '2px solid rgba(249,115,22,0.5)' : '2px dashed rgba(249,115,22,0.4)',
                background: refImage ? 'rgba(249,115,22,0.05)' : 'rgba(15,23,42,0.6)',
                transition: 'all 0.2s',
              }}
            >
              {refImage ? (
                <div style={{ width: '100%', padding: 16, position: 'relative' }}>
                  <img
                    src={`data:image/${refImageFormat};base64,${refImage}`}
                    alt="参考图预览"
                    style={{ width: '100%', borderRadius: 10, maxHeight: 320, objectFit: 'contain' }}
                  />
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(0,0,0,0.6)', borderRadius: 8,
                    padding: '4px 10px', fontSize: 11, color: '#fff',
                  }}>
                    📷 {refImageName}
                  </div>
                  <div style={{
                    marginTop: 10, textAlign: 'center', fontSize: 12, color: '#fb923c',
                  }}>
                    ✏️ 点击更换参考图
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🖼️</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                    点击上传竞品广告
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    支持 JPG / PNG / WebP · 最大 10MB
                  </div>
                  <div style={{
                    marginTop: 16, padding: '6px 16px', borderRadius: 20,
                    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                    fontSize: 12, color: '#fb923c',
                  }}>
                    竞品广告 = AI 的创意方向参考
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Step 2: 品牌工具包 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Logo 上传 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fb923c', marginBottom: 6 }}>
                🎨 Step 2: 品牌工具包
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                上传你的 Logo 和品牌元素，AI 将把这些融入每个广告变体中。
              </div>
            </div>

            {/* Logo */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🏷️ 品牌 Logo（可选）
              </div>
              <input ref={logoInput} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
              <label
                onClick={() => logoInput.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: 12, borderRadius: 10, cursor: 'pointer',
                  border: logoPreview ? '1px solid rgba(249,115,22,0.4)' : '1px dashed rgba(100,116,139,0.4)',
                  background: logoPreview ? 'rgba(249,115,22,0.05)' : 'rgba(15,23,42,0.4)',
                }}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ width: 60, height: 60, objectFit: 'contain', borderRadius: 6 }} />
                ) : (
                  <div style={{ width: 60, height: 60, borderRadius: 6, background: 'rgba(51,65,85,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🏷️</div>
                )}
                <div>
                  <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>点击上传 Logo</div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>PNG 透明背景最佳 · ≤2MB</div>
                </div>
              </label>
            </div>

            {/* 品牌色调 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🎨 品牌主色调
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: '主色', key: 'primaryColor' as const },
                  { label: '辅色', key: 'secondaryColor' as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{label}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="color"
                        value={brandKit[key]}
                        onChange={e => setBrandKit(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{ width: 36, height: 36, border: 'none', background: 'none', cursor: 'pointer', borderRadius: 8 }}
                      />
                      <input
                        type="text"
                        value={brandKit[key]}
                        onChange={e => setBrandKit(prev => ({ ...prev, [key]: e.target.value }))}
                        style={{
                          flex: 1, padding: '6px 8px', borderRadius: 8,
                          background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(100,116,139,0.3)',
                          color: '#e2e8f0', fontSize: 12, fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 品牌语调 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🗣️ 品牌语调（可选）
              </div>
              <textarea
                value={brandKit.brandVoice}
                onChange={e => setBrandKit(prev => ({ ...prev, brandVoice: e.target.value }))}
                placeholder="例如: Premium, modern, friendly, bold, minimalist..."
                style={{
                  width: '100%', minHeight: 60, padding: '8px 12px',
                  borderRadius: 10, border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 12,
                  fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 品牌字体 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🔤 品牌字体（可选）
              </div>
              <input
                type="text"
                value={brandKit.fonts}
                onChange={e => setBrandKit(prev => ({ ...prev, fonts: e.target.value }))}
                placeholder="例如: Helvetica Neue, Montserrat, Playfair Display"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10,
                  border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* 品牌口号 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                📣 品牌口号（可选）
              </div>
              <input
                type="text"
                value={brandKit.tagline}
                onChange={e => setBrandKit(prev => ({ ...prev, tagline: e.target.value }))}
                placeholder="例如: Quality First, Customer Always"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 10,
                  border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 12, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              onClick={() => setStep(3)}
              style={{
                padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: 'linear-gradient(135deg, #f97316, #ec4899)',
                border: '1px solid rgba(249,115,22,0.5)',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(249,115,22,0.25)',
              }}
            >
              🎨 品牌工具包已设置 · 继续 →
            </button>
            <button onClick={() => setStep(1)} style={{
              padding: '8px', borderRadius: 10, fontSize: 12,
              background: 'rgba(51,65,85,0.3)', border: '1px solid rgba(100,116,139,0.2)',
              color: '#64748b', cursor: 'pointer',
            }}>
              ← 上一步
            </button>
          </div>

          {/* 右侧预览 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 20, borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(100,116,139,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 12 }}>
                📋 当前品牌配置预览
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: brandKit.primaryColor }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>主色</span>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace' }}>{brandKit.primaryColor}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: brandKit.secondaryColor }} />
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>辅色</span>
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontFamily: 'monospace' }}>{brandKit.secondaryColor}</span>
                </div>
                {logoPreview && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={logoPreview} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <span style={{ fontSize: 12, color: '#4ade80' }}>✅ Logo 已上传</span>
                  </div>
                )}
                {brandKit.tagline && (
                  <div style={{ fontSize: 12, color: '#e2e8f0' }}>
                    📣 "{brandKit.tagline}"
                  </div>
                )}
                {brandKit.brandVoice && (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    🗣️ {brandKit.brandVoice}
                  </div>
                )}
              </div>
            </div>

            {/* 色调预览 */}
            <div style={{ padding: 16, borderRadius: 12, overflow: 'hidden' }}
              className="brand-preview-card">
              <div style={{
                fontSize: 12, color: '#64748b', marginBottom: 8, fontWeight: 500,
              }}>广告预览色板</div>
              <div style={{
                height: 100, borderRadius: 10,
                background: `linear-gradient(135deg, ${brandKit.primaryColor}40, ${brandKit.secondaryColor}40)`,
                border: `1px solid ${brandKit.primaryColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, color: brandKit.primaryColor, fontWeight: 600,
              }}>
                YOUR BRAND HERE
              </div>
            </div>

            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              fontSize: 11, color: '#64748b', lineHeight: 1.7,
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>💡 提示</div>
              <div>• 所有品牌元素均为可选，AI 会根据提供的信息融入创意</div>
              <div>• 不提供则使用中性专业风格生成</div>
              <div>• 品牌色调会显著影响最终广告的视觉一致性</div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Step 3: 客户画像生成 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 左侧：研究文本 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fb923c', marginBottom: 6 }}>
                👥 Step 3: 品牌研究与客户画像生成
              </div>
              <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
                输入你的品牌研究、产品定位、目标市场描述，AI 将自动生成 6 个详细的客户画像，每个画像包含人口特征、核心痛点、以及针对性的广告文案。
              </div>
            </div>

            {/* 产品场景预设 Prompt（增强版 · 来自飞象AI · 邀请码 260109） */}
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>
              {/* 标题行 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                  }}>🎯</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>
                    选择视觉风格预设（GPT Image 2）
                  </div>
                  {selectedPresetId && (
                    <span style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 20,
                      background: 'rgba(124,58,237,0.3)', color: '#a78bfa',
                      border: '1px solid rgba(124,58,237,0.4)',
                    }}>
                      ✓ 已选择
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>flyelep.cn 邀请码 260109</div>
              </div>

              {/* 选中预设预览 */}
              {selectedPresetId && (() => {
                const sp = PRODUCT_SCENE_PRESETS.find(p => p.id === selectedPresetId);
                return sp ? (
                  <div style={{
                    padding: '10px 12px', borderRadius: 10, marginBottom: 10,
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.35)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 16 }}>{sp.emoji}</span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#c4b5fd' }}>{sp.name}</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>{sp.category} · {sp.style}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPresetId(null)}
                        style={{
                          marginLeft: 'auto', fontSize: 9, padding: '2px 8px',
                          borderRadius: 20, border: '1px solid rgba(124,58,237,0.3)',
                          background: 'rgba(124,58,237,0.1)', color: '#64748b', cursor: 'pointer',
                        }}
                      >✕ 清除</button>
                    </div>
                    <div style={{
                      fontSize: 9, color: '#a78bfa', lineHeight: 1.6,
                      background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: 6,
                      maxHeight: 72, overflowY: 'auto', fontFamily: 'monospace',
                    }}>
                      {sp.promptFull}
                    </div>
                  </div>
                ) : null;
              })()}

              {/* 预设网格（2列滚动） */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 6,
                maxHeight: 200,
                overflowY: 'auto',
              }}>
                {PRODUCT_SCENE_PRESETS.map(preset => {
                  const isSelected = selectedPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPresetId(isSelected ? null : preset.id);
                        if (!isSelected) {
                          toast.success(`已选择「${preset.name}」视觉风格`);
                        }
                      }}
                      title={preset.promptFull}
                      style={{
                        padding: '8px 10px', borderRadius: 10,
                        background: isSelected
                          ? 'rgba(124,58,237,0.25)'
                          : 'rgba(124,58,237,0.06)',
                        border: isSelected
                          ? '1.5px solid rgba(124,58,237,0.7)'
                          : '1px solid rgba(124,58,237,0.15)',
                        color: isSelected ? '#c4b5fd' : '#94a3b8',
                        fontSize: 10, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6,
                        transition: 'all 0.15s', textAlign: 'left',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.15)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.4)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,58,237,0.06)';
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(124,58,237,0.15)';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{preset.emoji}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, lineHeight: 1.3, color: isSelected ? '#c4b5fd' : '#e2e8f0' }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 8, color: '#64748b', marginTop: 1 }}>{preset.category}</div>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: 9, color: '#a78bfa', flexShrink: 0 }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div style={{ fontSize: 9, color: '#64748b', marginTop: 8 }}>
                💡 选择预设 → 将自动融入生成 Prompt（跳 Step 4/5 时生效） · 共 {PRODUCT_SCENE_PRESETS.length} 个预设
              </div>
            </div>

            <textarea
              value={brandResearch}
              onChange={e => setBrandResearch(e.target.value)}
              placeholder={`粘贴你的品牌研究内容，例如：

产品: Smart Home Security Camera
目标市场: 北美中产阶级家庭，DIY爱好者
产品特点: 2K夜视、PIR人形检测、Alexa兼容、简易安装
价格区间: $49-79
差异化: 30天免费云存 + 本地SD卡双存储
竞争对手: Ring, Arlo, Wyze
品牌定位: 家庭安全，简单可靠，性价比高

或者粘贴你已有的客户调研报告、用户访谈记录等...`}
              style={{
                width: '100%', minHeight: 240, padding: '12px 14px',
                borderRadius: 10, border: '1px solid rgba(100,116,139,0.3)',
                background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 12,
                fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                lineHeight: 1.7,
              }}
            />

            <button
              onClick={handleGeneratePersonas}
              disabled={generatingPersonas || !brandResearch.trim()}
              style={{
                padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: generatingPersonas || !brandResearch.trim()
                  ? 'rgba(100,116,139,0.3)'
                  : 'linear-gradient(135deg, #f97316, #ec4899)',
                border: generatingPersonas || !brandResearch.trim()
                  ? '1px solid rgba(100,116,139,0.2)'
                  : '1px solid rgba(249,115,22,0.5)',
                color: generatingPersonas || !brandResearch.trim() ? '#64748b' : '#fff',
                cursor: generatingPersonas || !brandResearch.trim() ? 'not-allowed' : 'pointer',
                boxShadow: generatingPersonas || !brandResearch.trim() ? 'none' : '0 4px 20px rgba(249,115,22,0.25)',
              }}
            >
              {generatingPersonas ? '🤖 AI 生成画像中...' : '🤖 使用 AI 生成客户画像'}
            </button>

            {personaResult && (
              <details style={{
                padding: 12, borderRadius: 10,
                background: 'rgba(51,65,85,0.3)',
                border: '1px solid rgba(100,116,139,0.2)',
                fontSize: 11, color: '#64748b',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                  📄 AI 原始输出
                </summary>
                <pre style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, maxHeight: 200, overflowY: 'auto' }}>
                  {personaResult}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep(2)}
                style={{ flex: 1, padding: '8px', borderRadius: 10, fontSize: 12, background: 'rgba(51,65,85,0.3)', border: '1px solid rgba(100,116,139,0.2)', color: '#64748b', cursor: 'pointer' }}
              >
                ← 上一步
              </button>
              <button
                onClick={() => setStep(personas.length > 0 ? 4 : 3)}
                disabled={personas.length === 0}
                style={{
                  flex: 2, padding: '8px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: personas.length === 0 ? 'rgba(100,116,139,0.3)' : 'rgba(34,197,94,0.15)',
                  border: personas.length === 0 ? '1px solid rgba(100,116,139,0.2)' : '1px solid rgba(34,197,94,0.3)',
                  color: personas.length === 0 ? '#64748b' : '#4ade80',
                  cursor: personas.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {personas.length === 0 ? '👥 请先生成画像' : `✅ ${personas.length} 个画像就绪 →`}
              </button>
            </div>
          </div>

          {/* 右侧：画像展示 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 600, overflowY: 'auto', paddingRight: 4 }}>
            {generatingPersonas && (
              <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                <div style={{ fontSize: 40, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>🤖</div>
                <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>AI 正在分析品牌...</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>基于品牌研究生成 6 个客户画像</div>
              </div>
            )}

            {!generatingPersonas && personas.length === 0 && (
              <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👥</div>
                <div style={{ fontSize: 13 }}>输入品牌研究文本</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>点击上方按钮，AI 自动生成 6 个详细客户画像</div>
              </div>
            )}

            {!generatingPersonas && personas.map(persona => (
              <div
                key={persona.id}
                onClick={() => togglePersona(persona.id)}
                style={{
                  padding: 14, borderRadius: 12, cursor: 'pointer',
                  background: persona.selected ? 'rgba(249,115,22,0.08)' : 'rgba(15,23,42,0.6)',
                  border: persona.selected
                    ? '2px solid rgba(249,115,22,0.4)'
                    : '1px solid rgba(100,116,139,0.2)',
                  transition: 'all 0.15s',
                  opacity: persona.selected ? 1 : 0.6,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 24 }}>{persona.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{persona.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{persona.age}</div>
                  </div>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', border: '2px solid',
                    borderColor: persona.selected ? '#f97316' : '#334155',
                    background: persona.selected ? '#f97316' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#fff',
                  }}>
                    {persona.selected ? '✓' : ''}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
                  <span style={{ color: '#f87171' }}>💔</span> {persona.pain}
                </div>
                {persona.copy && (
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, fontStyle: 'italic' }}>
                    ✍️ {persona.copy.slice(0, 80)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Step 4: 生成参数 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* 左侧：参数配置 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(249,115,22,0.06)',
              border: '1px solid rgba(249,115,22,0.2)',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#fb923c', marginBottom: 6 }}>
                ⚙️ Step 4: 生成参数配置
              </div>
              <div style={{ fontSize: 12, color: '#64748b' }}>
                配置广告尺寸、生成数量和 CTA 文案，然后开始批量生成。
              </div>
            </div>

            {/* 广告尺寸 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                📐 广告尺寸
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {AD_SIZE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setAdSize(opt.value)}
                    style={{
                      padding: '8px 10px', borderRadius: 10, fontSize: 11, textAlign: 'left',
                      background: adSize === opt.value ? 'rgba(249,115,22,0.15)' : 'rgba(51,65,85,0.3)',
                      border: adSize === opt.value ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: adSize === opt.value ? '#fb923c' : '#94a3b8',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 2 }}>{opt.label.split('·')[1]?.trim()}</div>
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 生成数量 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                🔢 生成数量（每个画像重复生成）
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[5, 10, 20, 30].map(n => (
                  <button
                    key={n}
                    onClick={() => setAdCount(n)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                      background: adCount === n ? 'rgba(249,115,22,0.2)' : 'rgba(51,65,85,0.3)',
                      border: adCount === n ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(100,116,139,0.2)',
                      color: adCount === n ? '#fb923c' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {n} 张
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>
                💡 总计约 {Math.min(adCount, selectedCount() * 3)} 张广告（{selectedCount()} 个画像 × 最多 3 次重复）
              </div>
            </div>

            {/* CTA 文案 */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>
                📣 主 CTA 文案
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CTA_OPTIONS.map(cta => (
                  <button
                    key={cta}
                    onClick={() => setSelectedCTA(cta)}
                    style={{
                      padding: '5px 10px', borderRadius: 16, fontSize: 11,
                      background: selectedCTA === cta ? 'rgba(249,115,22,0.2)' : 'rgba(51,65,85,0.3)',
                      border: selectedCTA === cta ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: selectedCTA === cta ? '#fb923c' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {cta}
                  </button>
                ))}
              </div>
            </div>

            {/* 成本估算 */}
            <div style={{
              padding: 14, borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              fontSize: 12, color: '#64748b',
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>💰 成本估算</div>
              <div>• 广告数量: {Math.min(adCount, selectedCount() * 3)} 张</div>
              <div>• 画质: {adSizeQuality} ({adSizeQuality === 'high' ? '~$0.16/张' : adSizeQuality === 'medium' ? '~$0.04/张' : '~$0.005/张'})</div>
              <div>• 预计成本: <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                ${(Math.min(adCount, selectedCount() * 3) * (adSizeQuality === 'high' ? 0.16 : adSizeQuality === 'medium' ? 0.04 : 0.005)).toFixed(2)}
              </span></div>
              <div style={{ fontSize: 11, marginTop: 4 }}>⚠️ 实际费用按 OpenAI 账单为准</div>
            </div>

            {/* 操作按钮 */}
            <button
              onClick={handleGenerateAds}
              style={{
                padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #f97316, #ec4899)',
                border: '1px solid rgba(249,115,22,0.5)',
                color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(249,115,22,0.3)',
              }}
            >
              🚀 开始批量生成 {Math.min(adCount, selectedCount() * 3)} 个广告
            </button>
            <button onClick={() => setStep(3)} style={{
              padding: '8px', borderRadius: 10, fontSize: 12,
              background: 'rgba(51,65,85,0.3)', border: '1px solid rgba(100,116,139,0.2)',
              color: '#64748b', cursor: 'pointer',
            }}>
              ← 上一步
            </button>
          </div>

          {/* 右侧：摘要 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 16, borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(100,116,139,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 }}>
                📋 生成配置摘要
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>参考图</span>
                  <span style={{ color: refImage ? '#4ade80' : '#64748b' }}>{refImage ? '✅ 已上传' : '❌ 未上传（通用模板）'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>Logo</span>
                  <span style={{ color: brandKit.logo ? '#4ade80' : '#64748b' }}>{brandKit.logo ? '✅ 已上传' : '❌ 未上传'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>客户画像</span>
                  <span style={{ color: '#4ade80' }}>{selectedCount()} 个已选</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>广告尺寸</span>
                  <span style={{ color: '#e2e8f0' }}>{adSize}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>目标数量</span>
                  <span style={{ color: '#fb923c', fontWeight: 700 }}>{Math.min(adCount, selectedCount() * 3)} 张</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: '#64748b' }}>CTA 文案</span>
                  <span style={{ color: '#e2e8f0' }}>"{selectedCTA}"</span>
                </div>
              </div>
            </div>

            {/* 已选画像 */}
            <div style={{
              padding: 14, borderRadius: 12,
              background: 'rgba(15,23,42,0.6)',
              border: '1px solid rgba(100,116,139,0.2)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 10 }}>
                👥 已选画像 ({selectedCount()})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {personas.filter(p => p.selected).map(p => (
                  <div key={p.id} style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11,
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.2)',
                    color: '#fb923c',
                  }}>
                    {p.emoji} {p.title}
                  </div>
                ))}
              </div>
            </div>

            {/* 品牌预览 */}
            {brandKit.tagline && (
              <div style={{
                padding: 14, borderRadius: 12,
                background: `linear-gradient(135deg, ${brandKit.primaryColor}15, ${brandKit.secondaryColor}15)`,
                border: `1px solid ${brandKit.primaryColor}30`,
              }}>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>品牌预览</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                  {brandKit.tagline}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* Step 5: 批量生成结果 */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 5 && (
        <div>
          {/* 进度条 */}
          {(generating || progress) && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                <span>🚀 批量生成中...</span>
                <span>{progressPct}% ({doneCount}/{generatedAds.length})</span>
              </div>
              <div style={{ height: 6, background: 'rgba(51,65,85,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: 'linear-gradient(90deg, #f97316, #ec4899)',
                  width: `${progressPct}%`, transition: 'width 0.3s',
                }} />
              </div>
              {progress && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>{progress}</div>
              )}
            </div>
          )}

          {/* 统计 */}
          {!generating && generatedAds.length > 0 && (
            <div style={{
              display: 'flex', gap: 12, marginBottom: 16,
              flexWrap: 'wrap',
            }}>
              {[
                { label: '总计', value: generatedAds.length, color: '#e2e8f0' },
                { label: '成功', value: successCount, color: '#4ade80' },
                { label: '失败', value: errorCount, color: '#f87171' },
              ].map(s => (
                <div key={s.label} style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(15,23,42,0.6)',
                  border: '1px solid rgba(100,116,139,0.2)',
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{s.label}</span>
                </div>
              ))}
              <button
                onClick={downloadAll}
                disabled={successCount === 0}
                style={{
                  padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700,
                  background: successCount === 0 ? 'rgba(100,116,139,0.3)' : 'rgba(34,197,94,0.15)',
                  border: successCount === 0 ? '1px solid rgba(100,116,139,0.2)' : '1px solid rgba(34,197,94,0.3)',
                  color: successCount === 0 ? '#64748b' : '#4ade80',
                  cursor: successCount === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                💾 下载全部 ({successCount})
              </button>
            </div>
          )}

          {/* 广告网格 */}
          {generatedAds.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {generatedAds.map((ad, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(30,41,59,0.6)',
                    border: ad.status === 'done'
                      ? '1px solid rgba(34,197,94,0.2)'
                      : ad.status === 'error'
                        ? '1px solid rgba(248,113,113,0.2)'
                        : '1px solid rgba(100,116,139,0.2)',
                  }}
                >
                  {/* 图片区 */}
                  <div style={{
                    height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(15,23,42,0.8)',
                    position: 'relative',
                  }}>
                    {ad.status === 'generating' && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, animation: 'pulse 1.5s infinite' }}>🎨</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>生成中...</div>
                      </div>
                    )}
                    {ad.status === 'done' && ad.image && (
                      <img
                        src={ad.image}
                        alt={`Ad ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    {ad.status === 'error' && (
                      <div style={{ textAlign: 'center', padding: 16 }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>❌</div>
                        <div style={{ fontSize: 11, color: '#f87171' }}>{ad.error}</div>
                      </div>
                    )}
                    {ad.status === 'pending' && (
                      <div style={{ textAlign: 'center', color: '#475569' }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                        <div style={{ fontSize: 11 }}>等待中...</div>
                      </div>
                    )}
                    {/* 画像标签 */}
                    <div style={{
                      position: 'absolute', top: 8, left: 8,
                      background: 'rgba(0,0,0,0.7)', borderRadius: 12,
                      padding: '2px 8px', fontSize: 10, color: '#fff',
                    }}>
                      {ad.personaTitle}
                    </div>
                    {/* 状态 */}
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      borderRadius: 12, padding: '2px 8px', fontSize: 10,
                      background: ad.status === 'done' ? 'rgba(34,197,94,0.8)' : 'rgba(100,116,139,0.6)',
                      color: '#fff',
                    }}>
                      {ad.status === 'done' ? '✅' : ad.status === 'generating' ? '🎨' : ad.status === 'error' ? '❌' : '⏳'}
                    </div>
                  </div>

                  {/* 底部 */}
                  <div style={{ padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      #{idx + 1} · {ad.personaTitle}
                    </div>
                    {ad.status === 'done' && (
                      <button
                        onClick={() => downloadSingle(ad)}
                        style={{
                          padding: '4px 10px', borderRadius: 8, fontSize: 11,
                          background: 'rgba(139,92,246,0.15)',
                          border: '1px solid rgba(139,92,246,0.3)',
                          color: '#a78bfa', cursor: 'pointer',
                        }}
                      >
                        💾 下载
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 80, color: '#475569' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🚀</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                配置完成，准备开始生成
              </div>
              <div style={{ fontSize: 13, color: '#475569' }}>
                点击「开始批量生成」按钮启动广告生成流程
              </div>
              <button
                onClick={() => setStep(4)}
                style={{
                  marginTop: 20, padding: '10px 24px', borderRadius: 10,
                  background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                  color: '#fb923c', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                ← 返回参数配置
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
