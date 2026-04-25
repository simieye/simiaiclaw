/**
 * SIMIAICLAW 龙虾集群 · Promptsref AI 图像生成器面板
 * 直接嵌入 Promptsref 多模型 AI 图像生成平台
 * 支持: FLUX.2 Pro / Midjourney / Nano Banana Pro / Seedream / GPT Image 2 / Grok Imagine
 * 网址: https://promptsref.com/tool/AI-Image-Generator
 */

import React, { useState } from 'react';

const PROMPTSREF_URL = 'https://promptsref.com/tool/AI-Image-Generator';

const MODELS = [
  {
    id: 'flux2-pro',
    name: 'FLUX.2 [pro]',
    desc: '逼真电商产品图、商业摄影',
    color: '#6366f1',
    bg: 'from-indigo-900/40 to-violet-900/40',
    border: 'border-indigo-500/30',
  },
  {
    id: 'midjourney',
    name: 'Midjourney',
    desc: '艺术风格、概念艺术、创意图像',
    color: '#a855f7',
    bg: 'from-purple-900/40 to-fuchsia-900/40',
    border: 'border-purple-500/30',
  },
  {
    id: 'nano-banana-pro',
    name: 'Nano Banana Pro',
    desc: '角色一致性、迭代式设计、IP 资产',
    color: '#eab308',
    bg: 'from-yellow-900/40 to-amber-900/40',
    border: 'border-yellow-500/30',
  },
  {
    id: 'seedream',
    name: 'Seedream 4.5',
    desc: '海报广告、稳定文字排版',
    color: '#f97316',
    bg: 'from-orange-900/40 to-red-900/40',
    border: 'border-orange-500/30',
  },
  {
    id: 'gpt-image-2',
    name: 'GPT Image 2',
    desc: '高保真度、精确 prompt 遵循、清晰文字',
    color: '#22c55e',
    bg: 'from-emerald-900/40 to-green-900/40',
    border: 'border-emerald-500/30',
  },
  {
    id: 'grok-imagine',
    name: 'Grok Imagine',
    desc: '快速实验性生成、早期概念探索',
    color: '#ef4444',
    bg: 'from-red-900/40 to-rose-900/40',
    border: 'border-red-500/30',
  },
];

export function PromptsrefPanel() {
  const [activeView, setActiveView] = useState<'info' | 'iframe'>('info');
  const [iframeKey, setIframeKey] = useState(0);

  const handleOpenFull = () => {
    setActiveView('iframe');
  };

  const handleRefresh = () => {
    setIframeKey(k => k + 1);
  };

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          🎨
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>
            Promptsref AI 图像生成器
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            多模型并行生成 · 无水印下载 · 6 大顶级模型 · US$5/月（800 积分）
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 20,
            background: 'rgba(34,197,94,0.15)',
            border: '1px solid rgba(34,197,94,0.3)',
            fontSize: 11, color: '#4ade80',
          }}>
            🌐 iframe 嵌入模式
          </div>
          <a
            href={PROMPTSREF_URL}
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
            🌐 promptsref.com
          </a>
        </div>
      </div>

      {/* 平台介绍 Banner */}
      <div style={{
        padding: '12px 16px', borderRadius: 12, marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
        border: '1px solid rgba(124,58,237,0.2)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ fontSize: 28 }}>🚀</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 2 }}>
            Promptsref — 无水印多模型 AI 图像生成平台
          </div>
          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
            一键并行生成：FLUX.2 Pro / Midjourney / Nano Banana Pro / Seedream 4.5 / GPT Image 2 / Grok Imagine ·
            支持 16 张参考图 · 2 万字符 Prompt · 1K/2K/4K 分辨率 · 失败不扣积分
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleOpenFull}
            style={{
              padding: '8px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.3)',
            }}
          >
            🎨 打开生成器
          </button>
          <a
            href={PROMPTSREF_URL}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '8px 12px', borderRadius: 10,
              background: 'rgba(51,65,85,0.4)',
              border: '1px solid rgba(100,116,139,0.2)',
              color: '#94a3b8', fontSize: 13,
              textDecoration: 'none', cursor: 'pointer',
            }}
          >
            ↗ 新窗口
          </a>
        </div>
      </div>

      {/* 主视图切换 */}
      {activeView === 'info' ? (
        <>
          {/* 模型卡片 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>
              🤖 支持的 AI 模型
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 10,
            }}>
              {MODELS.map(model => (
                <div
                  key={model.id}
                  style={{
                    padding: '12px 14px', borderRadius: 12,
                    background: `linear-gradient(135deg, ${model.bg})`,
                    border: `1px solid ${model.border}`,
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: `${model.color}20`,
                    border: `1px solid ${model.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {model.id === 'flux2-pro' ? '⚡' :
                     model.id === 'midjourney' ? '🎭' :
                     model.id === 'nano-banana-pro' ? '🍌' :
                     model.id === 'seedream' ? '🏔️' :
                     model.id === 'gpt-image-2' ? '🖼️' : '✨'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                      {model.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
                      {model.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 功能特性 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 10, marginBottom: 16,
          }}>
            {[
              { icon: '⚡', title: '多模型并行', desc: '一次生成，6 个模型同时出图' },
              { icon: '💧', title: '无水印下载', desc: '所有图像一键下载，无任何水印' },
              { icon: '📷', title: '16 张参考图', desc: '最多支持 16 张参考图像' },
              { icon: '📝', title: '2 万字符 Prompt', desc: '超长描述，复杂场景轻松驾驭' },
              { icon: '📐', title: '多分辨率', desc: '1K / 2K / 4K 多种尺寸可选' },
              { icon: '🖼️', title: '批量生成', desc: '1-4 张批量生成，即时对比' },
              { icon: '🔄', title: '失败不扣费', desc: '生成失败或超时不收取积分' },
              { icon: '💰', title: 'US$5/月', desc: '800 积分，约 160 次图像生成' },
            ].map(f => (
              <div
                key={f.title}
                style={{
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(100,116,139,0.2)',
                }}
              >
                <div style={{ fontSize: 16, marginBottom: 4 }}>{f.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                  {f.title}
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* 定价方案 */}
          <div style={{
            padding: 16, borderRadius: 12, marginBottom: 16,
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 24 }}>💰</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#a78bfa' }}>
                  Promptsref 月度订阅
                </div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  50% OFF · 限时优惠
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#a78bfa' }}>US$5</span>
                  <span style={{ fontSize: 14, color: '#64748b', textDecoration: 'line-through' }}>US$10</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748b' }}>/月（800 积分）</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { label: '月积分', value: '800 积分', icon: '⚡' },
                { label: '图像生成', value: '约 160 次', icon: '🖼️' },
                { label: '单次成本', value: '$0.006', icon: '💸' },
              ].map(item => (
                <div key={item.label} style={{
                  padding: '8px 10px', borderRadius: 8,
                  background: 'rgba(124,58,237,0.1)',
                  border: '1px solid rgba(124,58,237,0.15)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 2 }}>{item.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#a78bfa' }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 使用步骤 */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: 'rgba(15,23,42,0.5)',
            border: '1px solid rgba(100,116,139,0.2)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>
              📋 使用步骤
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { step: '1', icon: '✍️', title: '编写 Prompt', desc: '中英文均可，最多 2 万字符' },
                { step: '2', icon: '⚙️', title: '配置参数', desc: '选择模型、尺寸、质量' },
                { step: '3', icon: '⚡', title: '秒级生成', desc: '并行生成，即时对比' },
                { step: '4', icon: '💾', title: '无水印下载', desc: '高分辨率，一键导出' },
              ].map(item => (
                <div key={item.step} style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: '50%', margin: '0 auto 6px',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.3))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18,
                  }}>
                    {item.icon}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', marginBottom: 2 }}>
                    第{item.step}步
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 2 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 打开完整界面按钮 */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={handleOpenFull}
              style={{
                padding: '14px 32px', borderRadius: 14, fontSize: 15, fontWeight: 700,
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
              }}
            >
              🎨 打开 Promptsref AI 图像生成器
            </button>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
              在下方 iframe 中直接使用，或{" "}
              <a
                href={PROMPTSREF_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a78bfa' }}
              >
                在新窗口打开
              </a>
            </div>
          </div>
        </>
      ) : (
        /* iframe 视图 */
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          }}>
            <button
              onClick={() => setActiveView('info')}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(51,65,85,0.4)',
                border: '1px solid rgba(100,116,139,0.2)',
                color: '#94a3b8', fontSize: 12, cursor: 'pointer',
              }}
            >
              ← 返回简介
            </button>
            <button
              onClick={handleRefresh}
              style={{
                padding: '6px 12px', borderRadius: 8,
                background: 'rgba(51,65,85,0.4)',
                border: '1px solid rgba(100,116,139,0.2)',
                color: '#94a3b8', fontSize: 12, cursor: 'pointer',
              }}
            >
              🔄 刷新
            </button>
            <div style={{ fontSize: 11, color: '#64748b', marginLeft: 'auto' }}>
              Promptsref AI Image Generator ·{" "}
              <a
                href={PROMPTSREF_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#a78bfa' }}
              >
                promptsref.com ↗
              </a>
            </div>
          </div>

          {/* iframe 容器 */}
          <div style={{
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(100,116,139,0.3)',
            background: '#0f172a',
            position: 'relative',
          }}>
            <iframe
              key={iframeKey}
              src={PROMPTSREF_URL}
              title="Promptsref AI Image Generator"
              style={{
                width: '100%',
                height: 'calc(100vh - 260px)',
                minHeight: 600,
                border: 'none',
                display: 'block',
              }}
              allow="accelerometer; camera; microphone"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>

          <div style={{
            padding: '10px 12px', borderRadius: '0 0 12px 12px',
            background: 'rgba(245,158,11,0.06)',
            border: '1px solid rgba(245,158,11,0.15)',
            borderTop: 'none',
            fontSize: 11, color: '#64748b', lineHeight: 1.6,
            marginTop: -1,
          }}>
            <div style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 4 }}>💡 使用提示</div>
            <div>• 使用完毕后请在 Promptsref 官网确认积分充足</div>
            <div>• 生成失败或超时不扣积分，可重试</div>
            <div>• 推荐配合浏览器开发者工具监控网络请求</div>
          </div>
        </div>
      )}
    </div>
  );
}
