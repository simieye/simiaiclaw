/**
 * SIMIAICLAW 龙虾集群 · GPT Image 2 图像生成面板
 * 集成 OpenAI GPT Image 2 API — Arena 图像榜第一
 * 支持: 文生图 / 参考图 / mask 局部重绘 / 2K/4K 高清
 */

import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';

const API_BASE = '/api/gpt-image';

const SIZES = [
  { label: '1K · 1024×1024', value: '1024x1024', badge: null },
  { label: '1K · 1536×1024', value: '1536x1024', badge: '横版' },
  { label: '1K · 1024×1536', value: '1024x1536', badge: '竖版' },
  { label: '2K · 2048×2048', value: '2048x2048', badge: null },
  { label: '2K · 1792×1024', value: '1792x1024', badge: '16:9' },
  { label: '2K · 1024×1792', value: '1024x1792', badge: '9:16' },
  { label: '4K · 3840×2160', value: '3840x2160', badge: '16:9' },
  { label: '4K · 2160×3840', value: '2160x3840', badge: '9:16' },
];

const QUALITIES = [
  { label: '低 · 草稿预览', value: 'low', desc: '$0.005~0.006/张 · 约10-30秒', color: '#94a3b8' },
  { label: '中 · 一般场景', value: 'medium', desc: '$0.04~0.05/张 · 约30-60秒', color: '#60a5fa' },
  { label: '高 · 精细打印', value: 'high', desc: '$0.16~0.21/张 · 约60-120秒', color: '#f59e0b' },
];

const OUTPUT_FORMATS = [
  { label: 'PNG', value: 'png', desc: '无损 · 支持透明' },
  { label: 'JPEG', value: 'jpeg', desc: '体积小 · 有损' },
  { label: 'WebP', value: 'webp', desc: '现代格式 · 最佳压缩' },
];

const PRESET_PROMPTS = [
  { icon: '🏔️', label: '风景摄影', prompt: 'A breathtaking mountain landscape at golden hour, dramatic clouds, vibrant colors, professional photography, 8K ultra-detailed' },
  { icon: '🍔', label: '美食摄影', prompt: 'Gourmet food photography, beautifully plated dish with warm lighting, shallow depth of field, appetizing colors, editorial style' },
  { icon: '👤', label: '人物肖像', prompt: 'Professional portrait photography, soft studio lighting, detailed skin texture, natural makeup, fashion editorial' },
  { icon: '🏙️', label: '城市建筑', prompt: 'Modern city skyline at blue hour, reflections on glass facades, dramatic lighting, cinematic composition' },
  { icon: '🎨', label: '抽象艺术', prompt: 'Abstract digital art, fluid dynamics, vibrant color palette, organic shapes, high detail, 4K' },
  { icon: '🐱', label: '宠物摄影', prompt: 'Cute cat portrait, soft natural light, bokeh background, detailed fur texture, professional pet photography' },
];

interface GeneratedImage {
  index: number;
  b64_json: string | null;
  url: string | null;
  revised_prompt: string | null;
}

export function GPTImagePanel() {
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [quality, setQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [outputFormat, setOutputFormat] = useState('png');
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImageFormat, setInputImageFormat] = useState('png');
  const [maskImage, setMaskImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery' | 'pricing'>('generate');
  const [gallery, setGallery] = useState<Array<{ prompt: string; image: string; time: string }>>([]);
  const [apiStatus, setApiStatus] = useState<any>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const maskRef = useRef<HTMLInputElement>(null);

  const checkStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/status`);
      const data = await r.json();
      setApiStatus(data);
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => { checkStatus(); }, [checkStatus]);

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

  const handleInputImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('参考图不能超过 10MB'); return; }
    const { b64, format } = await fileToBase64(file);
    setInputImage(b64);
    setInputImageFormat(format);
    toast.success(`已加载参考图: ${(file.size / 1024).toFixed(0)}KB`);
  };

  const handleMaskImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('Mask 图不能超过 10MB'); return; }
    const { b64 } = await fileToBase64(file);
    setMaskImage(b64);
    toast.success('已加载 Mask 图（透明区域将重绘）');
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('请输入图像描述'); return; }
    if (!apiStatus?.configured) {
      toast.error('API Key 未配置，请检查环境变量 OPENAI_API_KEY');
      return;
    }

    setGenerating(true);
    setProgress('正在提交请求...');
    setImages([]);
    setProgress('GPT Image 2 处理中（可能需要 1-3 分钟）...');

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        model: 'gpt-image-2',
        size,
        quality,
        output_format: outputFormat,
        n: 1,
      };
      if (inputImage) {
        body.input_image = inputImage;
        body.input_image_format = inputImageFormat;
      }
      if (maskImage) body.mask = maskImage;

      const r = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(360_000),
      });

      const data = await r.json();

      if (!r.ok) {
        toast.error(data.error || '生成失败');
        if (data.hint) toast.info(data.hint);
        setGenerating(false);
        setProgress('');
        return;
      }

      setImages(data.images || []);
      setProgress('');

      if (data.images?.[0]) {
        const img = data.images[0];
        if (img.b64_json) {
          const dataUrl = `data:image/${outputFormat};base64,${img.b64_json}`;
          setGallery(prev => [{ prompt: prompt.trim(), image: dataUrl, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 19)]);
        }
        toast.success('图像生成成功！');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('abort') || msg.includes('timeout')) {
        toast.error('生成超时（>6分钟），请尝试降低画质或尺寸');
      } else {
        toast.error('生成失败: ' + msg);
      }
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const downloadImage = (img: GeneratedImage) => {
    if (!img.b64_json) return;
    const a = document.createElement('a');
    a.href = `data:image/${outputFormat};base64,${img.b64_json}`;
    a.download = `gpt-image-2-${Date.now()}.${outputFormat}`;
    a.click();
  };

  const tabs = [
    { id: 'generate', label: '图像生成', icon: '🎨' },
    { id: 'gallery', label: '历史记录', icon: '🖼️' },
    { id: 'pricing', label: '费用说明', icon: '💰' },
  ] as const;

  const currentQuality = QUALITIES.find(q => q.value === quality)!;

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          🖼️
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>GPT Image 2 图像生成</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            Arena 图像榜第一 · 2K/4K 高清 · 精确文字渲染 · 支持 mask 局部重绘
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: apiStatus?.configured ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            border: `1px solid ${apiStatus?.configured ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: 11, color: apiStatus?.configured ? '#4ade80' : '#f87171',
          }}>
            {apiStatus?.configured ? '✅ API 已配置' : '⚠️ API 未配置'}
          </div>
          <a
            href="https://platform.openai.com/docs/guides/images"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(51,65,85,0.4)',
              border: '1px solid rgba(100,116,139,0.2)',
              color: '#94a3b8', fontSize: 12,
              textDecoration: 'none',
            }}
          >
            📖 API 文档
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 12 }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              background: activeTab === t.id ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: activeTab === t.id ? '#a78bfa' : '#64748b',
              border: activeTab === t.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── 图像生成 ─────────────────────────────────────────── */}
      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Left: Prompt + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Prompt */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🖼️ 图像描述（支持中文）
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="描述你想要的图像，例如：一只穿着宇航服的猫在月球上，摄影风格，8K细节..."
                style={{
                  width: '100%', minHeight: 120, padding: '10px 14px',
                  borderRadius: 10, border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 13,
                  fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.3)'}
              />
            </div>

            {/* Reference image + mask */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {/* 参考图 */}
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                  🖼️ 参考图（可选）
                </div>
                <label
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: 80, borderRadius: 10, cursor: 'pointer',
                    border: inputImage ? '1px solid rgba(139,92,246,0.5)' : '1px dashed rgba(100,116,139,0.4)',
                    background: inputImage ? 'rgba(139,92,246,0.05)' : 'rgba(15,23,42,0.4)',
                    transition: 'all 0.2s', padding: 8,
                  }}
                >
                  {inputImage ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <img
                        src={`data:image/${inputImageFormat};base64,${inputImage}`}
                        alt="参考图"
                        style={{ width: '100%', borderRadius: 6, maxHeight: 80, objectFit: 'cover' }}
                      />
                      <button
                        onClick={e => { e.preventDefault(); setInputImage(null); }}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          background: 'rgba(0,0,0,0.6)', border: 'none',
                          color: '#fff', borderRadius: '50%',
                          width: 20, height: 20, cursor: 'pointer', fontSize: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>📷</div>
                      <div>点击上传 · ≤10MB</div>
                    </div>
                  )}
                  <input ref={inputRef} type="file" accept="image/*" onChange={handleInputImage} style={{ display: 'none' }} />
                </label>
                {inputImage && (
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
                    图生图模式 · AI 融合风格
                  </div>
                )}
              </div>

              {/* Mask */}
              <div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                  🎭 Mask 局部重绘（可选）
                </div>
                <label
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    minHeight: 80, borderRadius: 10, cursor: 'pointer',
                    border: maskImage ? '1px solid rgba(16,185,129,0.5)' : '1px dashed rgba(100,116,139,0.4)',
                    background: maskImage ? 'rgba(16,185,129,0.05)' : 'rgba(15,23,42,0.4)',
                    transition: 'all 0.2s', padding: 8,
                  }}
                >
                  {maskImage ? (
                    <div style={{ position: 'relative', width: '100%' }}>
                      <img
                        src={`data:image/png;base64,${maskImage}`}
                        alt="Mask"
                        style={{ width: '100%', borderRadius: 6, maxHeight: 80, objectFit: 'cover', opacity: 0.7 }}
                      />
                      <button
                        onClick={e => { e.preventDefault(); setMaskImage(null); }}
                        style={{
                          position: 'absolute', top: 2, right: 2,
                          background: 'rgba(0,0,0,0.6)', border: 'none',
                          color: '#fff', borderRadius: '50%',
                          width: 20, height: 20, cursor: 'pointer', fontSize: 10,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b', fontSize: 11 }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>🎭</div>
                      <div>透明区域重绘</div>
                    </div>
                  )}
                  <input ref={maskRef} type="file" accept="image/png" onChange={handleMaskImage} style={{ display: 'none' }} />
                </label>
                {maskImage && (
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 4, textAlign: 'center' }}>
                    PNG · 透明=重绘区
                  </div>
                )}
              </div>
            </div>

            {/* Preview */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                📺 生成结果 {images.length > 0 && <span style={{ color: '#4ade80' }}>· {images.length} 张</span>}
              </div>
              <div
                style={{
                  minHeight: 300, borderRadius: 12,
                  border: '1px solid rgba(100,116,139,0.2)',
                  background: 'rgba(15,23,42,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative',
                }}
              >
                {generating ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>🎨</div>
                    <div style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>GPT Image 2 生成中...</div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{progress}</div>
                    <div style={{ marginTop: 12, width: 200, height: 4, background: 'rgba(100,116,139,0.2)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                        width: '70%', animation: 'shimmer 1.5s infinite',
                      }} />
                    </div>
                  </div>
                ) : images.length > 0 && images[0].b64_json ? (
                  <div style={{ width: '100%', padding: 12 }}>
                    <img
                      key={Date.now()}
                      src={`data:image/${outputFormat};base64,${images[0].b64_json}`}
                      alt="生成结果"
                      style={{ width: '100%', borderRadius: 8, display: 'block' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center' }}>
                      <button
                        onClick={() => downloadImage(images[0])}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)',
                          color: '#a78bfa', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        💾 下载 PNG
                      </button>
                      <button
                        onClick={() => {
                          const w = window.open('', '_blank')!;
                          w.document.write(`<img src="data:image/${outputFormat};base64,${images[0].b64_json}" style="max-width:100%"/>`);
                          w.document.close();
                        }}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(100,116,139,0.3)',
                          color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        🔍 全屏预览
                      </button>
                    </div>
                    {images[0].revised_prompt && (
                      <div style={{
                        marginTop: 10, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                        fontSize: 11, color: '#60a5fa',
                      }}>
                        📝 AI 优化后的描述: {images[0].revised_prompt}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>输入描述，点击生成</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>支持文生图、图生图、mask 局部重绘</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Size */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>📐 尺寸</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {SIZES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setSize(s.value)}
                    style={{
                      padding: '6px 8px', borderRadius: 8, fontSize: 11, textAlign: 'center',
                      background: size === s.value ? 'rgba(139,92,246,0.2)' : 'rgba(51,65,85,0.3)',
                      border: size === s.value ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: size === s.value ? '#a78bfa' : '#94a3b8',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{s.label.split('·')[1]?.trim()}</div>
                    {s.badge && (
                      <div style={{ fontSize: 9, opacity: 0.6, marginTop: 2 }}>{s.badge}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                ⚡ 画质 · 当前: <span style={{ color: currentQuality.color }}>{currentQuality.label.split('·')[0]}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {QUALITIES.map(q => (
                  <button
                    key={q.value}
                    onClick={() => setQuality(q.value as typeof quality)}
                    style={{
                      padding: '8px 10px', borderRadius: 8, fontSize: 11, textAlign: 'left',
                      background: quality === q.value ? `${q.color}15` : 'rgba(51,65,85,0.3)',
                      border: quality === q.value ? `1px solid ${q.color}50` : '1px solid rgba(100,116,139,0.2)',
                      color: quality === q.value ? q.color : '#94a3b8',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{q.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 2 }}>{q.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Output Format */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>📁 输出格式</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {OUTPUT_FORMATS.map(f => (
                  <button
                    key={f.value}
                    onClick={() => setOutputFormat(f.value)}
                    style={{
                      flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11,
                      background: outputFormat === f.value ? 'rgba(139,92,246,0.2)' : 'rgba(51,65,85,0.3)',
                      border: outputFormat === f.value ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: outputFormat === f.value ? '#a78bfa' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{f.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.7, marginTop: 2 }}>{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preset Prompts */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>⚡ 快捷提示词</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {PRESET_PROMPTS.map(p => (
                  <button
                    key={p.label}
                    onClick={() => setPrompt(p.prompt)}
                    style={{
                      padding: '6px 10px', borderRadius: 8, fontSize: 11, textAlign: 'left',
                      background: 'rgba(51,65,85,0.3)',
                      border: '1px solid rgba(100,116,139,0.2)',
                      color: '#94a3b8', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <span>{p.icon}</span>
                    <span>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              style={{
                padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700,
                background: generating || !prompt.trim()
                  ? 'rgba(100,116,139,0.3)'
                  : 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                border: generating || !prompt.trim()
                  ? '1px solid rgba(100,116,139,0.2)'
                  : '1px solid rgba(139,92,246,0.5)',
                color: generating || !prompt.trim() ? '#64748b' : '#fff',
                cursor: generating || !prompt.trim() ? 'not-allowed' : 'pointer',
                boxShadow: generating || !prompt.trim() ? 'none' : '0 4px 20px rgba(124,58,237,0.3)',
                transition: 'all 0.2s',
              }}
            >
              {generating ? '🎨 生成中（1-3分钟）...' : '🎨 生成图像'}
            </button>

            {/* Tips */}
            <div style={{
              padding: '10px 12px', borderRadius: 10,
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              fontSize: 11, color: '#64748b', lineHeight: 1.6,
            }}>
              <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>💡 提示</div>
              <div>• 高画质 4K 可能需要 2 分钟+</div>
              <div>• 透明背景请用 PNG 格式</div>
              <div>• Mask 需要带 alpha 通道的 PNG</div>
              <div>• 最多支持 5 张参考图（图生图）</div>
            </div>
          </div>
        </div>
      )}

      {/* ── 历史记录 ─────────────────────────────────────────── */}
      {activeTab === 'gallery' && (
        <div>
          {gallery.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
              <div style={{ fontSize: 14 }}>暂无历史记录</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>生成的图像会显示在这里</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {gallery.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(30,41,59,0.6)',
                    border: '1px solid rgba(100,116,139,0.2)',
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.prompt}
                    style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }}
                  />
                  <div style={{ padding: 10 }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{item.time}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.prompt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 费用说明 ─────────────────────────────────────────── */}
      {activeTab === 'pricing' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa', marginBottom: 8 }}>
              💰 GPT Image 2 按张计费（每张输出）
            </div>
            <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(100,116,139,0.2)' }}>
                  {['尺寸', '低画质', '中画质', '高画质'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', color: '#64748b', textAlign: 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['1024×1024', '$0.006', '$0.053', '$0.211'],
                  ['1536×1024 (横)', '$0.005', '$0.041', '$0.165'],
                  ['1024×1536 (竖)', '$0.005', '$0.041', '$0.165'],
                  ['2K / 4K', '按 token 实计', '按 token 实计', '按 token 实计'],
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(100,116,139,0.1)' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{
                        padding: '8px', textAlign: 'center',
                        color: j === 0 ? '#e2e8f0' : j === 3 ? '#f59e0b' : '#94a3b8',
                        fontWeight: j === 0 ? 600 : 400,
                      }}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { icon: '⚠️', title: '注意事项', items: ['生成失败不计费', '2K/4K 按 token 计费', '建议 request timeout ≥ 360s', '不支持透明背景输出'] },
              { icon: '🔧', title: '优化建议', items: ['草稿用 low 画质', '终稿用 high 画质', '网页展示用 JPEG/WebP', '批量生成可申请企业折扣'] },
            ].map(section => (
              <div key={section.title} style={{
                padding: 14, borderRadius: 12,
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(100,116,139,0.2)',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 8 }}>
                  {section.icon} {section.title}
                </div>
                {section.items.map(item => (
                  <div key={item} style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    • {item}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
