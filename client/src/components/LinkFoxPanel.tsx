/**
 * LinkFoxPanel — 跨境电商AI运营助手集成面板
 * 官网: https://www.linkfox.com/
 * 核心: AI选品 · AI作图 · AI分析，覆盖运营全链路
 */
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

const LINKFOX_URL = 'https://www.linkfox.com/';
const LINKFOX_LOGIN_URL = 'https://www.linkfox.com/#/login';

export function LinkFoxPanel() {
  const [view, setView] = useState<'welcome' | 'iframe'>('welcome');
  const [iframeKey, setIframeKey] = useState(0);

  const openInNewTab = useCallback(() => {
    window.open(LINKFOX_LOGIN_URL, '_blank', 'noopener,noreferrer');
  }, []);

  const iframeSrc = LINKFOX_LOGIN_URL;

  return (
    <div className="h-full flex flex-col bg-slate-950 overflow-hidden">

      {/* ── 顶部工具栏 ─────────────────────────────────────────── */}
      <div className="flex-none flex items-center justify-between px-5 py-3 border-b border-slate-800/60 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-sm font-black text-white shadow-lg shadow-violet-600/30">
            🦊
          </div>
          <div>
            <div className="text-sm font-bold text-white leading-none">LinkFox · 跨境电商AI运营助手</div>
            <div className="text-[10px] text-slate-500 mt-0.5">linkfox.com · AI选品 · AI作图 · AI分析</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 transition-all shadow-lg shadow-violet-600/20 border border-violet-500/40"
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
          <WelcomeView onStart={() => setView('iframe')} />
        ) : (
          <iframe
            key={iframeKey}
            src={iframeSrc}
            className="w-full h-full border-0"
            allow="camera; microphone; clipboard-write"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
            title="LinkFox · 跨境电商AI运营助手"
          />
        )}
      </div>
    </div>
  );
}

// ── 欢迎视图 ──────────────────────────────────────────────────────────────

function WelcomeView({ onStart }: { onStart: () => void }) {
  return (
    <div className="h-full overflow-y-auto">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 px-8 py-10">
        {/* 背景装饰 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-300 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative flex items-start justify-between gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5">
              <span className="text-yellow-300 text-sm">✨</span>
              <span className="text-white/90 text-xs font-bold">从0到1，覆盖跨境运营全链路</span>
            </div>

            <h1 className="text-3xl font-black text-white leading-tight mb-3">
              LinkFox<br />
              <span className="text-violet-300">跨境电商AI运营助手</span>
            </h1>
            <p className="text-white/80 text-sm leading-relaxed max-w-lg">
              AI选品 · AI作图 · AI分析 · AI运营自动化，四大引擎驱动增长。
              告别盲目测款，省下上万拍摄费，决策有依据。
            </p>

            {/* 三大引擎 */}
            <div className="flex items-center gap-4 mt-5">
              {[
                { label: 'AI 选品', desc: '挖掘潜力爆款', icon: '🔍' },
                { label: 'AI 作图', desc: '5分钟生成套图', icon: '🎨' },
                { label: 'AI 分析', desc: '自动生成报告', icon: '📊' },
              ].map((item, i) => (
                <div key={i} className="bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 text-center border border-white/20">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-xs font-bold text-white">{item.label}</div>
                  <div className="text-[10px] text-white/60">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 右侧品牌卡片 */}
          <div className="flex-none w-72 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-2xl">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">🦊</div>
              <div className="text-white font-bold text-sm">LinkFox</div>
              <div className="text-[10px] text-white/60 mt-1">linkfox.com</div>
            </div>

            <div className="space-y-2 mb-5">
              {[
                { icon: '🎯', text: 'AI选品 · 挖掘潜力爆款' },
                { icon: '🖼️', text: 'AI作图 · 省下拍摄费' },
                { icon: '📈', text: 'AI分析 · 决策有依据' },
                { icon: '🤖', text: 'AI运营 · 自动化提效' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs text-white/80">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={onStart}
              className="w-full bg-white text-violet-700 font-black text-sm py-3 rounded-xl hover:bg-white/90 transition-all shadow-lg"
            >
              🚀 免费体验 LinkFox
            </button>
            <button
              onClick={() => window.open('https://www.linkfox.com/', '_blank')}
              className="w-full mt-2 text-slate-300 text-xs py-2 hover:text-white transition-all text-center"
            >
              访问官网 →
            </button>
          </div>
        </div>
      </div>

      {/* 功能模块 */}
      <div className="px-8 py-8">
        <div className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">
          三大核心 AI 引擎
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            {
              icon: '🎨',
              title: 'LINKFOX AI 作图',
              color: 'violet',
              features: [
                '一键生成高转化商品标题',
                '全品类电商视觉素材',
                '商品套图 / 带货视频',
                'Listing 文案自动生成',
                'A+图 · 卖点图 · 场景图',
                '智能修图 · 场景裂变',
              ],
            },
            {
              icon: '📊',
              title: 'LINKFOX AGENT',
              color: 'blue',
              features: [
                '自动处理繁杂平台数据',
                '智能选品建议',
                '竞品拆解结论',
                '自动化运营分析报告',
                '数据驱动合规生成',
                'ABA关键词流量分析',
              ],
            },
            {
              icon: '🦊',
              title: 'LINKFOX CLAW',
              color: 'indigo',
              features: [
                '对话式指令下达',
                'AI自动拆解执行任务',
                '多平台Listing适配',
                '批量上架自动化',
                '深度集成跨境Skill',
                '多任务自动协同',
              ],
            },
          ].map((engine, i) => (
            <div key={i} className="glass-card p-5 border border-slate-700/50">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{engine.icon}</span>
                <div className={`text-sm font-bold text-${engine.color}-400`}>{engine.title}</div>
              </div>
              <div className="space-y-2">
                {engine.features.map((f, j) => (
                  <div key={j} className="flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5 text-[10px]">✓</span>
                    <span className="text-xs text-slate-400 leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 六大业务模块 */}
        <div className="text-xs text-slate-500 mb-4 font-semibold uppercase tracking-wider">
          六大核心业务模块
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: '🔭', title: '选品洞察', desc: '聚合全球主流电商数据，挖掘细分市场需求，识别流量词与趋势' },
            { icon: '📉', title: '竞品分析', desc: '高销低评蓝海品自动挖掘，竞品动态追踪与拆解' },
            { icon: '📦', title: '快速上架', desc: '批量 Listing 生成与上架，多平台自动适配' },
            { icon: '✍️', title: '文案优化', desc: '标题 · 五点描述 · A+内容智能生成，高转化率' },
            { icon: '⚙️', title: '自动化运营', desc: '定时任务 · 批量处理 · CLAW对话式指令执行' },
            { icon: '📢', title: '广告优化', desc: '关键词策略 · ABA分析 · 广告素材智能生成' },
          ].map((mod, i) => (
            <div key={i} className="glass-card p-4 border border-slate-700/50 hover:border-slate-600/70 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{mod.icon}</span>
                <div className="text-sm font-bold text-white">{mod.title}</div>
              </div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{mod.desc}</div>
            </div>
          ))}
        </div>

        {/* 快捷入口 */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-violet-600/30 border border-violet-500/40"
          >
            🚀 立即体验 AI 选品
          </button>
          <button
            onClick={onStart}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/30 border border-blue-500/40"
          >
            🎨 立即体验 AI 作图
          </button>
          <button
            onClick={() => window.open('https://www.linkfox.com/', '_blank')}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm font-bold px-5 py-3 rounded-xl border border-slate-700/60 hover:border-slate-600/80 bg-slate-800/40 transition-all"
          >
            ↗ 在新标签页打开
          </button>
        </div>
      </div>
    </div>
  );
}
