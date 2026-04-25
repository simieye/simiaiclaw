/**
 * FlyElepPanel — 飞象AI（flyelep.cn）PC端邀请链接集成面板
 * 邀请码: 260109 | 首次注册赠 300+200 算力值
 */
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

const FLYELEP_URL = 'https://www.flyelep.cn/#/login?inviteCode=260109';
const FLYELEP_HOME = 'https://www.flyelep.cn';
const INVITE_CODE = '260109';

export function FlyElepPanel() {
  const [view, setView] = useState<'welcome' | 'iframe'>('welcome');
  const [iframeKey, setIframeKey] = useState(0);
  const [showCopied, setShowCopied] = useState(false);

  const copyInviteCode = useCallback(() => {
    navigator.clipboard.writeText(INVITE_CODE).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  }, []);

  const openInNewTab = useCallback(() => {
    window.open(FLYELEP_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const iframeSrc = view === 'iframe' ? FLYELEP_URL : FLYELEP_URL;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* ── 顶部工具栏 ─────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-orange-500/30">
            🐘
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">飞象AI · 跨境电商智能体</div>
            <div className="text-[10px] text-slate-500 mt-0.5">flyelep.cn · 邀请码 {INVITE_CODE}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 邀请码徽章 */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500/20 to-rose-500/20 border border-orange-500/30 rounded-lg px-3 py-1.5 cursor-pointer hover:from-orange-500/30 hover:to-rose-500/30 transition-all"
               onClick={copyInviteCode} title="点击复制邀请码">
            <span className="text-[10px] text-slate-400">邀请码</span>
            <span className="text-xs font-black text-orange-400 tracking-wider">{INVITE_CODE}</span>
            {showCopied ? (
              <span className="text-[10px] text-green-400 font-bold">✓ 已复制</span>
            ) : (
              <span className="text-[10px] text-slate-500">📋</span>
            )}
          </div>

          {/* 刷新按钮 */}
          {view === 'iframe' && (
            <button
              onClick={() => setIframeKey(k => k + 1)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-600/80 bg-slate-800/50 transition-all"
            >
              🔄 刷新
            </button>
          )}

          {/* 切换视图 */}
          <button
            onClick={() => setView(v => v === 'welcome' ? 'iframe' : 'welcome')}
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 transition-all shadow-lg shadow-orange-500/20 border border-orange-500/40"
          >
            {view === 'welcome' ? '🚀 进入应用' : '← 返回概览'}
          </button>

          {/* 新标签页打开 */}
          <button
            onClick={openInNewTab}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/60 hover:border-slate-600/80 bg-slate-800/50 transition-all"
            title="在新标签页打开"
          >
            ↗
          </button>
        </div>
      </div>

      {/* ── 主内容区 ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {view === 'welcome' ? (
          <WelcomeView onStart={() => setView('iframe')} copyInviteCode={copyInviteCode} />
        ) : (
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            allow="camera; microphone; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="飞象AI · 跨境电商智能体"
          />
        )}
      </div>
    </div>
  );
}

// ── 欢迎视图 ──────────────────────────────────────────────────────────────

function WelcomeView({
  onStart,
  copyInviteCode,
}: {
  onStart: () => void;
  copyInviteCode: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-rose-600 to-purple-700 px-8 py-10">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-300 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
              <span className="text-yellow-300 text-sm">🎁</span>
              <span className="text-white/90 text-xs font-bold">首次注册赠 300+200 算力值（邀请码）</span>
            </div>

            <h1 className="text-3xl font-black text-white leading-tight mb-3">
              飞象AI<br />
              <span className="text-yellow-300">跨境电商智能体平台</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-lg">
              集成 GPT Image 2 · Midjourney · Claude · Stable Diffusion 等顶级 AI 模型，
              一站式生成产品场景图、广告创意、Listing 优化、SEO/GEO 策略。
            </p>

            {/* 算力值展示 */}
            <div className="flex items-center gap-4 mt-5">
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/20">
                <div className="text-2xl font-black text-yellow-300">300</div>
                <div className="text-[10px] text-white/70">注册赠送</div>
              </div>
              <div className="text-white/40 text-lg">+</div>
              <div className="bg-white/15 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/20">
                <div className="text-2xl font-black text-yellow-300">200</div>
                <div className="text-[10px] text-white/70">邀请奖励</div>
              </div>
              <div className="text-white/40 text-lg">=</div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-5 py-3 text-center border border-white/30">
                <div className="text-2xl font-black text-white">500</div>
                <div className="text-[10px] text-white/70">算力值</div>
              </div>
            </div>
          </div>

          {/* 右侧邀请码卡片 */}
          <div className="flex-none w-64 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🎁</div>
              <div className="text-white font-bold text-sm">专属邀请码</div>
            </div>
            <div
              className="bg-white/20 border-2 border-dashed border-white/40 rounded-xl py-5 text-center cursor-pointer hover:bg-white/30 transition-all mb-4"
              onClick={copyInviteCode}
            >
              <div className="text-3xl font-black text-white tracking-[0.3em] letter-spacing-wider">
                {INVITE_CODE}
              </div>
              <div className="text-[10px] text-white/60 mt-1">点击复制</div>
            </div>
            <button
              onClick={onStart}
              className="w-full bg-white text-rose-600 font-black text-sm py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg"
            >
              🚀 免费注册体验
            </button>
          </div>
        </div>
      </div>

      {/* 功能特色 */}
      <div className="px-8 py-8">
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              icon: '🖼️',
              title: 'GPT Image 2 生图',
              desc: '产品场景图·广告创意图·模特图',
              badge: 'GPT-4o Image Gen',
              badgeColor: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
            },
            {
              icon: '📰',
              title: 'SEO + GEO 双引擎',
              desc: 'Google SEO · 多语言GEO搜索优化',
              badge: '搜索可见性',
              badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            },
            {
              icon: '🎬',
              title: 'TikTok & 社媒矩阵',
              desc: '短视频脚本·标签策略·爆款文案',
              badge: '内容营销',
              badgeColor: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
            },
            {
              icon: '📊',
              title: '竞品智能监控',
              desc: '动态追踪·价格预警·评论洞察',
              badge: '市场情报',
              badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            },
            {
              icon: '🛒',
              title: 'Listing CRO 优化',
              desc: '标题·五点描述·A+内容·关键词',
              badge: '转化率优化',
              badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            },
            {
              icon: '🔬',
              title: 'Claude 深度研究',
              desc: '市场调研·竞品分析·品牌策略',
              badge: 'AI 分析',
              badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            },
          ].map((item, i) => (
            <div key={i} className="glass-card p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </div>
              </div>
              <span className={`inline-block text-[10px] px-2 py-1 rounded-full border ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          ))}
        </div>

        {/* 快捷入口 */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 border border-orange-500/40"
          >
            🚀 立即体验 GPT Image 2 生图
          </button>
          <button
            onClick={() => window.open(`https://www.flyelep.cn/#/login?inviteCode=${INVITE_CODE}`, '_blank')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold px-5 py-3 rounded-xl border border-slate-700/60 hover:border-slate-600/80 bg-slate-800/40 transition-all"
          >
            ↗ 在新标签页打开
          </button>
        </div>
      </div>
    </div>
  );
}
