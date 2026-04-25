/**
 * SIMIAICLAW 龙虾集群 · Rexwit 本地 AI 面板
 * 巽宫·创意工具卦 · 本地免费 AI 图片 & 3D 生成软件
 * 集成: Qwen / Flux / Hunyuan 3D / Nano Banana Pro 等模型
 */

import React, { useState } from 'react';
import { toast } from 'sonner';

const REXWIT_URL = 'https://rexwit.com';
const REXWIT_DOC = 'https://rexwit.com/doc/1.0.0/rexwit/function.html';
const INVITE_CODE = '5555';

const FEATURES = [
  { icon: '🔒', title: '本地部署', desc: '数据不上传，隐私绝对安全' },
  { icon: '🧠', title: '顶级 3D 模型', desc: '集成 Qwen/Flux/Hunyuan 3D 等业内最好模型' },
  { icon: '🍌', title: 'Nano Banana Pro', desc: '集成最领先的 Nano Banana Pro 模型' },
  { icon: '💰', title: '完全免费', desc: '告别云端扣费、积分焦虑，想生成多少次就多少次' },
  { icon: '🎮', title: '无限生成', desc: '本地就能跑，无使用次数限制' },
  { icon: '🚀', title: '极速体验', desc: '本地 GPU 加速，无需排队等待' },
];

const INDUSTRIES = [
  { icon: '🎮', name: '游戏动画', color: 'bg-violet-950/40 border-violet-800/40' },
  { icon: '🛒', name: '电商广告', color: 'bg-cyan-950/40 border-cyan-800/40' },
  { icon: '🎬', name: '影视前期', color: 'bg-amber-950/40 border-amber-800/40' },
  { icon: '🏭', name: '产品设计', color: 'bg-emerald-950/40 border-emerald-800/40' },
  { icon: '🏗️', name: '建筑室内', color: 'bg-orange-950/40 border-orange-800/40' },
  { icon: '🎨', name: '平面设计', color: 'bg-pink-950/40 border-pink-800/40' },
];

const API_TEMPLATES = [
  { label: '图片生成 (Flux)', cmd: 'rexwit generate --model flux --prompt "a beautiful sunset over mountains"' },
  { label: '3D 模型生成', cmd: 'rexwit generate-3d --model hunyuan3d --prompt "a futuristic robot head"' },
  { label: 'Nano Banana Pro', cmd: 'rexwit generate --model nano-banana-pro --prompt "your prompt here"' },
];

interface Props {
  onClose?: () => void;
}

export function RexwitPanel({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState<'features' | 'api' | 'download'>('features');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      toast.success('已复制到剪贴板');
    });
  };

  return (
    <div style={{ padding: '16px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          🎨
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 700 }}>Rexwit · 本地免费 AI 生成</h3>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '12px' }}>
            本地 AI 图片 & 3D 生成 · 无隐私担忧 · 无限次使用
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a href={REXWIT_URL} target="_blank" rel="noreferrer" style={{ background: '#f97316', color: '#fff', padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            🌐 官网下载
          </a>
          <a href={REXWIT_DOC} target="_blank" rel="noreferrer" style={{ background: '#1e293b', color: '#94a3b8', padding: '6px 14px', borderRadius: 8, fontSize: '12px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #334155' }}>
            📖 功能文档
          </a>
        </div>
      </div>

      {/* Invite code banner */}
      <div style={{ background: 'linear-gradient(90deg, #7c2d12, #9a3412)', border: '1px solid #ea580c44', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 28 }}>🎁</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fed7aa' }}>公测邀请码</div>
          <div style={{ fontSize: '12px', color: '#fdba74' }}>填写邀请码 <strong style={{ fontFamily: 'monospace', fontSize: 15, color: '#fff' }}>{INVITE_CODE}</strong>，注册即赠 Banana 5 个消费点</div>
        </div>
        <button
          onClick={() => handleCopy(INVITE_CODE)}
          style={{ background: '#fff', color: '#9a3412', padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none' }}
        >
          {copied ? '✓ 已复制' : '📋 复制邀请码'}
        </button>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {[
          { id: 'features', label: '⚡ 核心亮点' },
          { id: 'api', label: '🔧 API / 命令行' },
          { id: 'download', label: '📥 下载安装' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            style={{
              padding: '6px 14px', borderRadius: 8, fontSize: '12px', fontWeight: 500, cursor: 'pointer',
              background: activeSection === tab.id ? '#3b82f6' : '#1e293b',
              color: activeSection === tab.id ? '#fff' : '#94a3b8',
              border: `1px solid ${activeSection === tab.id ? '#3b82f6' : '#334155'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Features section */}
      {activeSection === 'features' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 16 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{f.title}</div>
                <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', marginBottom: 10 }}>🎯 适用行业</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {INDUSTRIES.map((ind, i) => (
                <div key={i} style={{ background: '#0f172a', border: '1px solid', borderRadius: 8, padding: '6px 12px', fontSize: '12px', color: '#e2e8f0', ...ind as any }}>
                  <span style={{ marginRight: 4 }}>{ind.icon}</span>{ind.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* API section */}
      {activeSection === 'api' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16 }}>
          <h4 style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 12px' }}>🔧 Rexwit CLI 命令模板</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {API_TEMPLATES.map((t, i) => (
              <div key={i} style={{ background: '#0a0f1e', border: '1px solid #1e293b', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: '11px', color: '#3b82f6', marginBottom: 4 }}>{t.label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ fontSize: '11px', color: '#10b981', fontFamily: 'monospace', flex: 1, wordBreak: 'break-all' }}>{t.cmd}</code>
                  <button
                    onClick={() => handleCopy(t.cmd)}
                    style={{ background: '#1e293b', color: '#94a3b8', padding: '2px 8px', borderRadius: 4, fontSize: 10, cursor: 'pointer', border: '1px solid #334155', whiteSpace: 'nowrap' }}
                  >
                    📋
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, padding: '10px 12px', background: '#1e293b', borderRadius: 8, border: '1px solid #334155' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.6 }}>
              <strong style={{ color: '#f97316' }}>💡 与 SIMIAICLAW 集成：</strong>通过 OPC 工作台的 <strong style={{ color: '#60a5fa' }}>🦞</strong> 智能体调用 Rexwit CLI，
              可将生成的图片/3D 模型自动写入 <code style={{ color: '#10b981', fontSize: 10 }}>data/rexwit-outputs/</code> 目录，
              再经由知识库面板加载到 RAG 系统。
            </div>
          </div>
        </div>
      )}

      {/* Download section */}
      {activeSection === 'download' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ fontSize: 36 }}>💻</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Rexwit 公测版</div>
              <div style={{ fontSize: '11px', color: '#64748b', margin: '4px 0' }}>支持 Windows / macOS / Linux</div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>需要本地 GPU (NVIDIA 16GB+ 显存推荐)</div>
            </div>
            <a
              href={REXWIT_URL}
              target="_blank"
              rel="noreferrer"
              style={{ background: '#f97316', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: '13px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}
            >
              🌐 前往官网下载
            </a>
          </div>

          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16 }}>
            <h4 style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 10px' }}>📋 安装步骤</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { step: '1', text: '访问 rexwit.com，下载对应平台的安装包' },
                { step: '2', text: '注册账号，填写邀请码 ' + INVITE_CODE + ' 获得 Banana 消费点' },
                { step: '3', text: '运行 Rexwit，按提示配置本地 GPU 环境' },
                { step: '4', text: '开始生成！所有数据留在本地，无隐私风险' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>{item.step}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.5, paddingTop: 2 }}>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer note */}
      <div style={{ marginTop: 16, padding: '10px 12px', background: '#0f172a', borderRadius: 8, fontSize: '11px', color: '#475569' }}>
        💡 Rexwit 生成的文件可保存到 <code style={{ color: '#64748b' }}>data/rexwit-outputs/</code>，通过知识库页面导入 RAG 系统供 AI 分析。
        <a href={REXWIT_DOC} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', marginLeft: 8 }}>查看功能文档 →</a>
      </div>
    </div>
  );
}
