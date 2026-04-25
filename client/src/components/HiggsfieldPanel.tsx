/**
 * SIMIAICLAW 龙虾集群 · Higgsfield × Seedance 2.0 视频生成面板
 * 集成 ByteDance Seedance 2.0 · Higgsfield 全球首发
 * 支持: 文字转视频 / 图片转视频 / 原生音频 / 多镜头叙事
 *
 * 最佳工作流程:
 * Step 1: GPT Image 2 → 生成基础图像（产品/角色/场景）
 * Step 2: Seedance 2.0 → 将图像转为视频（Image-to-Video）
 * Step 3: 添加商品旋转/场景动画等效果
 */

import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_BASE = '/api/higgsfield';

const ASPECT_RATIOS = [
  { label: '16:9  横版', value: '16:9', icon: '▬' },
  { label: '9:16  竖版', value: '9:16', icon: '▮' },
  { label: '1:1   方形', value: '1:1', icon: '◼' },
  { label: '4:3   标准', value: '4:3', icon: '▣' },
  { label: '21:9  电影', value: '21:9', icon: '▭' },
];

const RESOLUTIONS = [
  { label: '480p 预览', value: '480p', desc: '快速预览，节省积分', color: '#94a3b8' },
  { label: '720p 高清', value: '720p', desc: '生产级画质（推荐）', color: '#f59e0b' },
];

const DURATIONS = [
  { label: '4秒  快速', value: 4, color: '#94a3b8' },
  { label: '8秒  标准', value: 8, color: '#f59e0b' },
  { label: '12秒 长片', value: 12, color: '#f97316' },
];

interface GeneratedVideo {
  task_id: string;
  video_url: string;
  consumed_credits: number;
  estimated_credits: number;
  estimated_usd: number;
}

export function HiggsfieldPanel() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [duration, setDuration] = useState(8);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [fixedLens, setFixedLens] = useState(false);
  const [inputImage, setInputImage] = useState<string | null>(null);
  const [inputImageFormat, setInputImageFormat] = useState('png');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'pricing' | 'workflow'>('generate');
  const [history, setHistory] = useState<Array<{ prompt: string; videoUrl: string; time: string; thumb?: string }>>([]);
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [cost, setCost] = useState<any>(null);

  const inputRef = React.useRef<HTMLInputElement>(null);

  // 加载状态
  const checkStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/status`);
      const data = await r.json();
      setApiStatus(data);
      // 估算初始费用
      const cr = await fetch(`${API_BASE}/estimate?resolution=720p&duration=8&generate_audio=false`);
      const cd = await cr.json();
      setCost(cd);
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => { checkStatus(); }, [checkStatus]);

  // 估算费用变化时更新
  React.useEffect(() => {
    const formData = new FormData();
    fetch(`${API_BASE}/estimate?resolution=${resolution}&duration=${duration}&generate_audio=${generateAudio}`)
      .then(r => r.json())
      .then(d => setCost(d))
      .catch(() => {});
  }, [resolution, duration, generateAudio]);

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
    toast.success(`已加载参考图（${(file.size / 1024).toFixed(0)}KB），将作为视频首帧参考`);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('请输入视频描述'); return; }
    if (!apiStatus?.configured) {
      toast.error('API Key 未配置，请检查环境变量 SEEDANCE_API_KEY');
      return;
    }

    setGenerating(true);
    setProgress('🚀 提交生成任务...');
    setVideos([]);

    try {
      const body: Record<string, unknown> = {
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        resolution,
        duration,
        generate_audio: generateAudio,
        fixed_lens: fixedLens,
      };

      if (inputImage) {
        body.image_base64 = inputImage;
      }

      const r = await fetch(`${API_BASE}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await r.json();

      if (!r.ok) {
        toast.error(data.error || '生成失败');
        if (data.hint) toast.info(data.hint);
        setGenerating(false);
        setProgress('');
        return;
      }

      const generated: GeneratedVideo = {
        task_id: data.task_id,
        video_url: data.video_url,
        consumed_credits: data.consumed_credits || data.estimated_credits || 0,
        estimated_credits: data.estimated_credits || 0,
        estimated_usd: data.estimated_usd || 0,
      };

      setVideos([generated]);
      setProgress('');
      setHistory(prev => [
        { prompt: prompt.trim(), videoUrl: data.video_url, time: new Date().toLocaleTimeString() },
        ...prev.slice(0, 19),
      ]);
      toast.success(`视频生成完成！消耗 ${generated.consumed_credits || generated.estimated_credits} 积分`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('timeout')) {
        toast.error('生成超时，请重试或降低参数');
      } else {
        toast.error('生成失败: ' + msg);
      }
    } finally {
      setGenerating(false);
      setProgress('');
    }
  };

  const applyPreset = (presetPrompt: string) => {
    setPrompt(presetPrompt);
    toast.success('已应用预置提示词，请根据需要修改');
  };

  const tabs = [
    { id: 'generate', label: '视频生成', icon: '🎬' },
    { id: 'workflow', label: '工作流', icon: '🔗' },
    { id: 'history', label: '历史记录', icon: '📼' },
    { id: 'pricing', label: '费用说明', icon: '💰' },
  ] as const;

  const currentCost = cost?.cost;

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          🎬
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Seedance 2.0 × Higgsfield
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            字节跳动旗舰 · Arena 视频榜第一 · 文字/图片/音频/视频多模态 · 全球首发
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
            href="https://seedanceapi.org"
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
            📖 seedanceapi.org
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
              background: activeTab === t.id ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: activeTab === t.id ? '#fbbf24' : '#64748b',
              border: activeTab === t.id ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
              cursor: 'pointer',
            }}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── 视频生成 ─────────────────────────────────────────── */}
      {activeTab === 'generate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Left: Prompt + Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Prompt */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🎬 视频描述（支持英文，推荐详细描述动作、场景、光线）
              </div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="例如: A cinematic commercial product advertisement, smooth gimbal camera with minimal movement. A woman slowly brings food toward her mouth, lips parting, eyes closing briefly as she bites into it. Motion slow and deliberate. Camera stays almost completely still. Simultaneously the product container rotates slowly 360 degrees in lower left corner..."
                style={{
                  width: '100%', minHeight: 130, padding: '10px 14px',
                  borderRadius: 10, border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.8)', color: '#e2e8f0', fontSize: 13,
                  fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(100,116,139,0.3)'}
              />
            </div>

            {/* Reference Image (from GPT Image 2) */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                🖼️ 参考图（可选 · 强烈推荐 · 用于 Image-to-Video）
              </div>
              <label
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  minHeight: 80, borderRadius: 10, cursor: 'pointer',
                  border: inputImage ? '1px solid rgba(245,158,11,0.5)' : '1px dashed rgba(100,116,139,0.4)',
                  background: inputImage ? 'rgba(245,158,11,0.05)' : 'rgba(15,23,42,0.4)',
                  transition: 'all 0.2s', padding: 8,
                }}
              >
                {inputImage ? (
                  <div style={{ position: 'relative', width: '100%' }}>
                    <img
                      src={`data:image/${inputImageFormat};base64,${inputImage}`}
                      alt="参考图"
                      style={{ width: '100%', borderRadius: 6, maxHeight: 100, objectFit: 'cover' }}
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
                    <div>点击上传 GPT Image 2 生成的图像</div>
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>PNG/JPEG ≤ 10MB · Image-to-Video</div>
                  </div>
                )}
                <input ref={inputRef} type="file" accept="image/*" onChange={handleInputImage} style={{ display: 'none' }} />
              </label>
              {inputImage && (
                <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 4, textAlign: 'center', fontWeight: 600 }}>
                  ✅ Image-to-Video 模式 · 图像将作为视频首帧参考
                </div>
              )}
            </div>

            {/* Video Preview */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>
                📺 生成结果 {videos.length > 0 && <span style={{ color: '#4ade80' }}>· 生成成功</span>}
              </div>
              <div
                style={{
                  minHeight: 280, borderRadius: 12,
                  border: '1px solid rgba(100,116,139,0.2)',
                  background: 'rgba(15,23,42,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', position: 'relative',
                }}
              >
                {generating ? (
                  <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 40, marginBottom: 12, animation: 'pulse 1.5s infinite' }}>🎬</div>
                    <div style={{ color: '#fbbf24', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                      Seedance 2.0 生成中...
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12 }}>{progress}</div>
                    <div style={{ marginTop: 12, width: 200, height: 4, background: 'rgba(100,116,139,0.2)', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                        width: '65%', animation: 'shimmer 1.5s infinite',
                      }} />
                    </div>
                  </div>
                ) : videos.length > 0 && videos[0].video_url ? (
                  <div style={{ width: '100%', padding: 12 }}>
                    <video
                      key={videos[0].task_id}
                      src={videos[0].video_url}
                      controls
                      style={{ width: '100%', borderRadius: 8, display: 'block', maxHeight: 320 }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a
                        href={videos[0].video_url}
                        download={`seedance-${videos[0].task_id}.mp4`}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)',
                          color: '#fbbf24', fontSize: 12, cursor: 'pointer',
                          textDecoration: 'none',
                        }}
                      >
                        💾 下载视频
                      </a>
                      <button
                        onClick={() => window.open(videos[0].video_url, '_blank')}
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          background: 'rgba(51,65,85,0.4)', border: '1px solid rgba(100,116,139,0.3)',
                          color: '#94a3b8', fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        🔗 在新窗口打开
                      </button>
                    </div>
                    <div style={{
                      marginTop: 8, padding: '6px 12px', borderRadius: 8,
                      background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                      fontSize: 11, color: '#fbbf24', textAlign: 'center',
                    }}>
                      消耗 {videos[0].consumed_credits || videos[0].estimated_credits} 积分
                      {videos[0].estimated_usd > 0 && ` (≈ $${videos[0].estimated_usd.toFixed(3)})`}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>🎬</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>输入描述，点击生成</div>
                    <div style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>
                      支持文字转视频、参考图转视频、原生音频生成
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Aspect Ratio */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>📐 宽高比</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {ASPECT_RATIOS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => setAspectRatio(a.value)}
                    style={{
                      padding: '6px 8px', borderRadius: 8, fontSize: 11, textAlign: 'center',
                      background: aspectRatio === a.value ? 'rgba(245,158,11,0.2)' : 'rgba(51,65,85,0.3)',
                      border: aspectRatio === a.value ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: aspectRatio === a.value ? '#fbbf24' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <span>{a.icon}</span> {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>🎞️ 分辨率</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {RESOLUTIONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setResolution(r.value)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, fontSize: 12, textAlign: 'left',
                      background: resolution === r.value ? 'rgba(245,158,11,0.2)' : 'rgba(51,65,85,0.3)',
                      border: resolution === r.value ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: resolution === r.value ? '#fbbf24' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>⏱️ 时长</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {DURATIONS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDuration(d.value)}
                    style={{
                      flex: 1, padding: '8px 4px', borderRadius: 8, fontSize: 12, textAlign: 'center',
                      background: duration === d.value ? 'rgba(245,158,11,0.2)' : 'rgba(51,65,85,0.3)',
                      border: duration === d.value ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(100,116,139,0.2)',
                      color: duration === d.value ? '#fbbf24' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>⚙️ 选项</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={generateAudio}
                    onChange={e => setGenerateAudio(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#f59e0b' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: '#e2e8f0' }}>🔊 生成同步音频</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>消耗积分翻倍，效果更佳</div>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={fixedLens}
                    onChange={e => setFixedLens(e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#f59e0b' }}
                  />
                  <div>
                    <div style={{ fontSize: 12, color: '#e2e8f0' }}>🎥 锁定镜头（减少运动）</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>适合商品展示，减少模糊</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Cost Estimate */}
            {currentCost && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.2)',
              }}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>💡 预估消耗</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#fbbf24' }}>
                  {currentCost.credits} 积分
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  ≈ ${currentCost.usd.toFixed(3)} · {currentCost.label}
                </div>
              </div>
            )}

            {/* Preset Prompts */}
            <div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, fontWeight: 500 }}>📋 快捷提示词</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '🎬', label: '商品旋转', prompt: `A cinematic commercial product advertisement, smooth gimbal camera with minimal movement, professional kitchen setting. A woman slowly brings food toward her mouth, lips parting, eyes closing briefly as she bites. Motion slow and deliberate. Camera stays almost completely still. Simultaneously in lower left corner: the product container rotates slowly 360 degrees on its own axis — smooth, continuous, clockwise, one full revolution every 4 seconds. Key light upper left on product label. All UI text and layout elements remain fully visible and static on screen throughout the entire 10 seconds. The motion happens within the frame behind and around the static UI.` },
                  { icon: '🎥', label: '电影广告', prompt: `A cinematic commercial product advertisement, smooth dolly camera, clean sharp motion. [Product] being elegantly presented in a professional studio. Camera stays mostly still, letting the product be the hero. All brand text overlays stay perfectly locked and readable throughout.` },
                  { icon: '🌿', label: '生活场景', prompt: `A beautiful lifestyle video, natural lighting, bokeh background, smooth camera movement. A person enjoying the product in a cozy setting. Soft golden hour light. All text overlays stay perfectly still — headlines, product name, tagline, call-to-action button — while the background and people move naturally around them.` },
                  { icon: '💻', label: '科技产品', prompt: `A sleek tech product commercial, minimalist white studio background, dramatic product reveal. The product floats and rotates slowly, showing all angles. Studio lighting creates beautiful specular highlights on the metallic surface. Camera stays mostly still. All UI text and graphics stay locked on screen throughout.` },
                  { icon: '👗', label: '时尚走秀', prompt: `High-fashion runway show, professional studio lighting, 4K ultra-detailed. Models walking confidently down the runway in elegant evening wear. The camera stays locked on the model's face and upper body, capturing outfit details. Smooth, deliberate motion. All brand text and product details remain static and readable throughout.` },
                  { icon: '✨', label: '多镜头故事', prompt: `A cinematic multi-shot narrative, 24fps film quality. Shot 1: Wide establishing shot. Shot 2: Medium shot revealing the product. Shot 3: Close-up on product details. All shots connect seamlessly. Professional color grading, warm cinematic tones. All brand text and graphics stay locked on screen throughout all shots.` },
                ].map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p.prompt)}
                    style={{
                      padding: '7px 10px', borderRadius: 8, fontSize: 11, textAlign: 'left',
                      background: 'rgba(51,65,85,0.3)',
                      border: '1px solid rgba(100,116,139,0.2)',
                      color: '#94a3b8', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 8,
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
              disabled={generating}
              style={{
                padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                background: generating ? 'rgba(245,158,11,0.3)' : 'linear-gradient(135deg, #f59e0b, #ea580c)',
                border: 'none', color: '#fff', cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {generating ? '⏳ 生成中...' : '🎬 开始生成'}
            </button>
          </div>
        </div>
      )}

      {/* ── 工作流 ─────────────────────────────────────────── */}
      {activeTab === 'workflow' && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{
            padding: '20px 24px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.05))',
            border: '1px solid rgba(245,158,11,0.2)',
            marginBottom: 20,
          }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>
              🔗 GPT Image 2 × Seedance 2.0 完美工作流
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              这两个模型天然互补 — GPT Image 2 提供精确的文字渲染和构图，Seedance 2.0 将静态图像转化为流畅视频，实现真正的端到端内容创作。
            </div>
          </div>

          {/* Steps */}
          {[
            {
              step: 1,
              icon: '🖼️',
              title: 'GPT Image 2 — 生成基础图像',
              desc: '使用 GPT Image 2 创建高质量产品图、场景图或角色图。使用高质量模式（quality=high）确保细节丰富。',
              tip: '推荐 2K/4K 分辨率 + PNG 格式，确保 Seedance 2.0 有足够的图像质量参考',
              action: '前往 GPT Image 2 →',
              link: '#gptimage',
              color: '#a78bfa',
              borderColor: 'rgba(139,92,246,0.3)',
              bg: 'rgba(139,92,246,0.05)',
            },
            {
              step: 2,
              icon: '🎬',
              title: 'Seedance 2.0 — 图片转视频（Image-to-Video）',
              desc: '将 GPT Image 2 生成的图像上传到 Seedance 2.0。选择 16:9 或 9:16 比例，添加商品旋转或场景动画效果。',
              tip: '启用 fixed_lens（锁定镜头）减少运动模糊；关闭 audio 节省积分',
              color: '#fbbf24',
              borderColor: 'rgba(245,158,11,0.3)',
              bg: 'rgba(245,158,11,0.05)',
            },
            {
              step: 3,
              icon: '✂️',
              title: '后期处理 — 剪辑与导出',
              desc: '将生成的视频导入剪映、CapCut 或 Premiere Pro，进行二次剪辑、加字幕、背景音乐等处理，输出最终成片。',
              tip: 'Higgsfield 生成的视频支持商业用途，可直接用于电商广告',
              color: '#4ade80',
              borderColor: 'rgba(34,197,94,0.3)',
              bg: 'rgba(34,197,94,0.05)',
            },
          ].map(s => (
            <div
              key={s.step}
              style={{
                padding: '16px 20px', borderRadius: 12, marginBottom: 12,
                background: s.bg, border: `1px solid ${s.borderColor}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `${s.color}22`, border: `1px solid ${s.borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 700, color: s.color,
                }}>
                  {s.step}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                  <span style={{ marginRight: 8 }}>{s.icon}</span>
                  {s.title}
                </div>
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.6, paddingLeft: 44 }}>
                {s.desc}
              </div>
              <div style={{
                fontSize: 11, color: s.color, padding: '6px 10px', borderRadius: 8,
                background: `${s.color}11`, marginLeft: 44,
              }}>
                💡 {s.tip}
              </div>
            </div>
          ))}

          {/* Prompt Engineering Tips */}
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(100,116,139,0.2)',
            marginTop: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>
              📝 Seedance 2.0 提示词技巧
            </div>
            {[
              '使用具体动词描述动作：slowly brings, gently rotates, smoothly glides',
              '指定摄像机运动：camera stays still, slow dolly, smooth gimbal',
              '描述光线：golden hour light, key light upper left, specular highlight',
              '包含 UI 文字要求：All text elements stay locked and readable throughout',
              '商品旋转：product container rotates 360 degrees, one revolution every 4 seconds',
            ].map((tip, i) => (
              <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6, display: 'flex', gap: 8 }}>
                <span style={{ color: '#f59e0b' }}>▸</span>
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 历史记录 ─────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📼</div>
              <div style={{ fontSize: 14 }}>暂无生成记录</div>
              <div style={{ fontSize: 12, marginTop: 6, color: '#64748b' }}>生成视频后会显示在这里</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {history.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(100,116,139,0.2)',
                  }}
                >
                  <video
                    src={item.videoUrl}
                    controls
                    style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '8px 12px' }}>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      ⏰ {item.time}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }} title={item.prompt}>
                      📝 {item.prompt.length > 80 ? item.prompt.slice(0, 80) + '...' : item.prompt}
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
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          {/* Pricing Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              💰 Seedance 2.0 价格表
            </div>

            {/* 480p */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                padding: '6px 12px', borderRadius: 8, display: 'inline-block',
                background: 'rgba(148,163,184,0.1)', color: '#94a3b8', fontSize: 12, marginBottom: 8,
              }}>
                📱 480p 预览模式
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { dur: '4秒', noAudio: '$0.04', withAudio: '$0.07', credits: '8-14' },
                  { dur: '8秒', noAudio: '$0.07', withAudio: '$0.14', credits: '14-28' },
                  { dur: '12秒', noAudio: '$0.095', withAudio: '$0.19', credits: '19-38' },
                ].map(r => (
                  <div key={r.dur} style={{
                    padding: '12px', borderRadius: 10,
                    background: 'rgba(15,23,42,0.6)',
                    border: '1px solid rgba(100,116,139,0.2)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{r.dur}</div>
                    <div style={{ fontSize: 11, color: '#4ade80' }}>无音频: {r.noAudio}</div>
                    <div style={{ fontSize: 11, color: '#fbbf24' }}>有音频: {r.withAudio}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{r.credits}积分</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 720p */}
            <div>
              <div style={{
                padding: '6px 12px', borderRadius: 8, display: 'inline-block',
                background: 'rgba(245,158,11,0.1)', color: '#fbbf24', fontSize: 12, marginBottom: 8,
              }}>
                🎞️ 720p 高清模式（推荐）
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { dur: '4秒', noAudio: '$0.07', withAudio: '$0.14', credits: '14-28' },
                  { dur: '8秒', noAudio: '$0.14', withAudio: '$0.28', credits: '28-56' },
                  { dur: '12秒', noAudio: '$0.21', withAudio: '$0.42', credits: '42-84' },
                ].map(r => (
                  <div key={r.dur} style={{
                    padding: '12px', borderRadius: 10,
                    background: 'rgba(245,158,11,0.05)',
                    border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fbbf24', marginBottom: 8 }}>{r.dur}</div>
                    <div style={{ fontSize: 11, color: '#4ade80' }}>无音频: {r.noAudio}</div>
                    <div style={{ fontSize: 11, color: '#fbbf24' }}>有音频: {r.withAudio}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>{r.credits}积分</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tips */}
          <div style={{
            padding: '16px 20px', borderRadius: 12,
            background: 'rgba(15,23,42,0.6)',
            border: '1px solid rgba(100,116,139,0.2)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 10 }}>💡 优化建议</div>
            {[
              { tip: '预览阶段用 480p + 4秒 + 无音频，节省积分（$0.04/条）', icon: '💰' },
              { tip: '生产环境用 720p + 8秒 + 无音频（$0.14/条），性价比最高', icon: '⭐' },
              { tip: '音频消耗积分翻倍，按需开启（用于人物对话/旁白场景）', icon: '🔊' },
              { tip: '固定镜头（fixed_lens=true）减少运动模糊，适合产品展示', icon: '🎥' },
              { tip: '参考图(Image-to-Video)比纯文字效果更稳定，建议配合 GPT Image 2 使用', icon: '🖼️' },
              { tip: '避免过长的文字叠加描述，Seedance 对文字的处理不如 GPT Image 2 精确', icon: '📝' },
            ].map((item, i) => (
              <div key={i} style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: '#f59e0b', flexShrink: 0 }}>{item.icon}</span>
                <span>{item.tip}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <a
              href="https://seedanceapi.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 20px', borderRadius: 10,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#fbbf24', fontSize: 13,
                textDecoration: 'none',
              }}
            >
              🌐 访问 seedanceapi.org 获取 API Key
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
