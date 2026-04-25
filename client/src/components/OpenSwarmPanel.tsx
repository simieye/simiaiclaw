/**
 * SIMIAICLAW 龙虾集群 · OpenSwarm 多智能体编排平台集成面板
 * 整合 openswarm.com + docs.openswarm.com
 * 功能: 多 Agent 并行 · 无限画布 · MCP 工具(Gmail/Calendar/Drive/Reddit) · 人类审批
 */

import React, { useState } from 'react';
import { toast } from 'sonner';

const OPENSWARM_URL = 'https://openswarm.com';
const OPENSWARM_DOCS = 'https://docs.openswarm.com';
const OPENSWARM_GITHUB = 'https://github.com/openswarm-ai/openswarm';

const CAPABILITIES = [
  {
    icon: '🐝',
    title: '并行多智能体',
    desc: '多个 AI Agent 同时工作，互不阻塞，真正并行执行',
    color: 'amber',
  },
  {
    icon: '🗺️',
    title: '无限画布空间',
    desc: 'Spatial Canvas 可视化工作区，拖拽组织思维和任务流',
    color: 'orange',
  },
  {
    icon: '🔌',
    title: 'MCP 工具集成',
    desc: 'Gmail · Calendar · Drive · Twitter · Reddit · Browser Automation',
    color: 'blue',
  },
  {
    icon: '🛡️',
    title: '人类决策审批',
    desc: 'Human-in-the-Loop，Agent 提议 + 人工审批 = 安全可控',
    color: 'emerald',
  },
  {
    icon: '🧠',
    title: '知识飞轮',
    desc: 'Skills & Templates 积累复用，构建自定义 AI 应用',
    color: 'purple',
  },
  {
    icon: '🔒',
    title: '默认隔离',
    desc: '每个 Agent 独立运行环境，互不干扰，安全可靠',
    color: 'cyan',
  },
];

const MCP_TOOLS = [
  { name: 'Gmail', desc: '邮件读写、搜索、发送', icon: '📧', color: '#EA4335' },
  { name: 'Google Calendar', desc: '事件创建、查询、修改', icon: '📅', color: '#4285F4' },
  { name: 'Google Drive', desc: '文件上传、下载、分享', icon: '💾', color: '#FBBC04' },
  { name: 'Reddit', desc: '内容抓取、评论、发帖', icon: '🤖', color: '#FF4500' },
  { name: 'Twitter', desc: '推文发布、搜索、分析', icon: '🐦', color: '#1DA1F2' },
  { name: 'Browser Automation', desc: '网页操作、截图、数据提取', icon: '🌐', color: '#6366F1' },
];

const STEPS = [
  { step: 1, icon: '🔗', title: '连接工具', desc: '配置 Anthropic API Key 和 MCP 工具（选 Gmail/Reddit 等）' },
  { step: 2, icon: '🐝', title: '派发任务', desc: '用自然语言描述任务，OpenSwarm 分解并分配给多个 Agent' },
  { step: 3, icon: '🛡️', title: '审批执行', desc: 'Agent 提交提案，人类审批后执行实际操作' },
  { step: 4, icon: '🗂️', title: '查看结果', desc: '在画布上实时追踪所有 Agent 进展，汇总结果' },
];

const INSTALL_OPTIONS = [
  {
    id: 'macos',
    icon: '🍎',
    title: 'macOS 一键安装',
    desc: '下载 .dmg 安装包，最简单的方式（目前仅 macOS）',
    badge: '推荐',
    badgeColor: 'bg-emerald-600',
    command: null,
  },
  {
    id: 'clone',
    icon: '💻',
    title: '克隆仓库（开发者）',
    desc: 'Node.js 18+ · Python 3.11+ · 支持 macOS/Linux',
    badge: '开发者',
    badgeColor: 'bg-blue-600',
    command: `git clone https://github.com/openswarm/openswarm.git && cd openswarm && cp backend/.env.example backend/.env && bash run.sh`,
  },
];

interface Props {
  onClose?: () => void;
}

export function OpenSwarmPanel({ onClose }: Props) {
  const [activeSection, setActiveSection] = useState<'overview' | 'mcp' | 'install' | 'workflow'>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
      toast.success('已复制到剪贴板');
    });
  };

  const sections = [
    { id: 'overview', label: '功能概览', icon: '🐝' },
    { id: 'mcp', label: 'MCP 工具', icon: '🔌' },
    { id: 'install', label: '快速安装', icon: '📦' },
    { id: 'workflow', label: '工作流程', icon: '🔄' },
  ] as const;

  return (
    <div style={{ padding: '16px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
        }}>
          🐝
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>OpenSwarm 多智能体编排平台</div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
            真正并行 · 无限画布 · MCP 工具集成 · 人类决策审批
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <a
            href={OPENSWARM_DOCS}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 transition-colors"
          >
            📖 官方文档
          </a>
          <a
            href={OPENSWARM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-medium hover:from-amber-500 hover:to-orange-500 transition-all"
          >
            🐝 访问 OpenSwarm ↗
          </a>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, borderBottom: '1px solid #1e293b', paddingBottom: 12 }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 8, fontSize: 13,
              transition: 'all 0.2s',
              background: activeSection === s.id ? 'rgba(245,158,11,0.15)' : 'transparent',
              color: activeSection === s.id ? '#fbbf24' : '#64748b',
              border: activeSection === s.id ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
            }}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── 功能概览 ─────────────────────────────────────────── */}
      {activeSection === 'overview' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              <strong style={{ color: '#fbbf24' }}>OpenSwarm</strong> 是一个<strong style={{ color: '#fff' }}>多智能体并行编排平台</strong>，
              通过 Spatial Canvas 可视化工作空间，让多个 AI Agent 同时协作完成任务。
              区别于传统串行 Agent，OpenSwarm 实现了真正的并行执行，同时保留人类决策权，确保每一个关键操作都经过审批。
            </p>
          </div>

          {/* 核心特性网格 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
            {CAPABILITIES.map(cap => (
              <div
                key={cap.title}
                style={{
                  padding: 16, borderRadius: 12,
                  background: 'rgba(30,41,59,0.6)',
                  border: `1px solid rgba(100,116,139,0.2)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{cap.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{cap.title}</span>
                </div>
                <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{cap.desc}</p>
              </div>
            ))}
          </div>

          {/* 外部链接 */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: '🌐', label: 'openswarm.com', href: OPENSWARM_URL },
              { icon: '📖', label: 'docs.openswarm.com', href: OPENSWARM_DOCS },
              { icon: '💻', label: 'GitHub', href: OPENSWARM_GITHUB },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8,
                  background: 'rgba(51,65,85,0.4)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  color: '#94a3b8', fontSize: 12,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,116,139,0.5)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(100,116,139,0.2)'; }}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
                <span style={{ opacity: 0.5 }}>↗</span>
              </a>
            ))}
          </div>
        </>
      )}

      {/* ── MCP 工具 ─────────────────────────────────────────── */}
      {activeSection === 'mcp' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7 }}>
              OpenSwarm 支持丰富的 <strong style={{ color: '#fbbf24' }}>MCP (Model Context Protocol)</strong> 工具集成，
              通过 OAuth/API Key 认证连接外部平台，让 AI Agent 真正执行实际操作。
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {MCP_TOOLS.map(tool => (
              <div
                key={tool.name}
                style={{
                  padding: 16, borderRadius: 12,
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(100,116,139,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${tool.color}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>
                    {tool.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{tool.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{tool.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>MCP Connected · via OpenSwarm</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
            <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600, marginBottom: 6 }}>
              💡 配置 MCP 工具
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              在 Settings → MCP 连接器 → OpenSwarm 中配置 <code style={{ background: 'rgba(51,65,85,0.5)', padding: '1px 5px', borderRadius: 4 }}>Anthropic API Key</code> 和所需的 MCP 工具凭据。
              Gmail / Calendar / Drive 需要 Google OAuth 认证。
            </div>
          </div>
        </>
      )}

      {/* ── 快速安装 ─────────────────────────────────────────── */}
      {activeSection === 'install' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {INSTALL_OPTIONS.map(opt => (
              <div
                key={opt.id}
                style={{
                  padding: 20, borderRadius: 12,
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(100,116,139,0.2)',
                  position: 'relative',
                }}
              >
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <span className={`${opt.badgeColor} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}>
                    {opt.badge}
                  </span>
                </div>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{opt.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 6 }}>{opt.title}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: opt.command ? 12 : 0, lineHeight: 1.6 }}>{opt.desc}</div>
                {opt.command && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <code style={{
                      flex: 1, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(0,0,0,0.4)', fontSize: 11, color: '#a5f3fc',
                      fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {opt.command}
                    </code>
                    <button
                      onClick={() => handleCopy(opt.command!, opt.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8,
                        background: copied === opt.id ? '#22c55e' : 'rgba(51,65,85,0.6)',
                        border: 'none', color: '#fff', fontSize: 11, cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {copied === opt.id ? '✅' : '📋'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.2)',
          }}>
            <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 6 }}>📋 环境变量配置</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              克隆仓库后，在 <code style={{ background: 'rgba(51,65,85,0.5)', padding: '1px 5px', borderRadius: 4 }}>backend/.env</code> 中配置：
            </div>
            <div style={{ marginTop: 8, display: 'grid', gap: 6 }}>
              {[
                { key: 'ANTHROPIC_API_KEY', desc: 'Anthropic API Key（必填）' },
                { key: 'GOOGLE_CLIENT_ID', desc: 'Google OAuth Client ID（可选，用于 Gmail/Calendar/Drive）' },
                { key: 'OPENAI_API_KEY', desc: 'OpenAI API Key（可选，备用模型）' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <code style={{
                    minWidth: 180, padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(0,0,0,0.4)', fontSize: 11, color: '#a5f3fc',
                    fontFamily: 'monospace',
                  }}>
                    {item.key}
                  </code>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── 工作流程 ─────────────────────────────────────────── */}
      {activeSection === 'workflow' && (
        <>
          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>
            使用 OpenSwarm 完成一个典型任务的标准流程：
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 20 }}>
            {STEPS.map((s, idx) => (
              <div key={s.step} style={{ display: 'flex', gap: 16 }}>
                {/* 连接线 */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
                  }}>
                    {s.step}
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div style={{ width: 2, flex: 1, minHeight: 40, background: 'linear-gradient(to bottom, #f59e0b, #1e293b)' }} />
                  )}
                </div>
                {/* 内容 */}
                <div style={{
                  flex: 1, padding: '12px 16px', borderRadius: 12, marginBottom: idx < STEPS.length - 1 ? 12 : 0,
                  background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(100,116,139,0.2)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{s.title}</span>
                  </div>
                  <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: 14, borderRadius: 10,
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600, marginBottom: 6 }}>🚀 SIMIAICLAW × OpenSwarm</div>
            <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.7 }}>
              将 OpenSwarm 的多 Agent 并行能力与 SIMIAICLAW 的太极64卦分工体系结合，
              可实现：<strong style={{ color: '#fff' }}>任务分解 → 多 Agent 并行执行 → 结果汇总</strong> 的完整闭环。
              在 Settings → MCP 连接器中添加 OpenSwarm，即可在 SIMIAICLAW 中调用其 Agent 能力。
            </div>
          </div>
        </>
      )}
    </div>
  );
}
