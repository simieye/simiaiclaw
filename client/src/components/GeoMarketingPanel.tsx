/**
 * SIMIAICLAW 龙虾集群 · GEO 营销系统深度集成面板
 * 深度集成 Dageno GEO/AEO · BotSight · Prompt Gap Radar
 * 功能: AI可见性监测 · Citation Share · Prompt Gap分析 · 全域曝光优化
 *
 * Dageno 文档: https://docs.dageno.ai
 * API Base: https://app.dageno.ai
 */

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

// ── 常量 ────────────────────────────────────────────────────────
const DAGENO_ORIGIN = 'https://app.dageno.ai';
const WORKSPACE_PATH = 'hmwhtm/simiai_top';

// ── 类型 ──────────────────────────────────────────────────────
interface GeoMetric {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon: string;
  color: string;
}

interface BotSightItem {
  engine: string;
  aiVisible: number;      // AI 可见性得分 0-100
  citationShare: number;   // 引用分享率 %
  lastChecked: string;
  status: 'healthy' | 'warning' | 'critical';
}

interface PromptGap {
  keyword: string;
  gapScore: number;   // 0-100, 越高差距越大
  opportunity: 'high' | 'medium' | 'low';
  competitorGap: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'done';
  progress: number;   // 0-100
  createdAt: string;
  engine: string;
}

interface DagenoStatus {
  configured: boolean;
  apiBase: string;
  docsUrl: string;
  features: string[];
  pricing: string;
  models: string[];
}

// ── 模拟数据（未连接 Dageno API 时的展示数据）───────────────────
const MOCK_BOTSIGHT: BotSightItem[] = [
  { engine: 'ChatGPT (GPT-4o)', aiVisible: 72, citationShare: 34, lastChecked: '2分钟前', status: 'healthy' },
  { engine: 'Perplexity', aiVisible: 61, citationShare: 28, lastChecked: '2分钟前', status: 'healthy' },
  { engine: 'Gemini (Google)', aiVisible: 58, citationShare: 22, lastChecked: '2分钟前', status: 'warning' },
  { engine: 'Claude (Anthropic)', aiVisible: 45, citationShare: 19, lastChecked: '3分钟前', status: 'warning' },
  { engine: 'DeepSeek', aiVisible: 33, citationShare: 12, lastChecked: '3分钟前', status: 'critical' },
];

const MOCK_GAPS: PromptGap[] = [
  { keyword: 'B2B sourcing China', gapScore: 82, opportunity: 'high', competitorGap: '竞品覆盖率 78%，你的覆盖率 41%' },
  { keyword: 'OEM manufacturing', gapScore: 74, opportunity: 'high', competitorGap: '竞品覆盖率 65%，你的覆盖率 28%' },
  { keyword: 'custom packaging', gapScore: 58, opportunity: 'medium', competitorGap: '竞品覆盖率 52%，你的覆盖率 31%' },
  { keyword: 'wholesale electronics', gapScore: 45, opportunity: 'medium', competitorGap: '竞品覆盖率 60%，你的覆盖率 48%' },
  { keyword: 'private label cosmetics', gapScore: 31, opportunity: 'low', competitorGap: '竞品覆盖率 44%，你的覆盖率 39%' },
];

const MOCK_CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: '北美 B2B 关键词攻势', status: 'active', progress: 68, createdAt: '2026-04-20', engine: 'ChatGPT/Perplexity' },
  { id: 'c2', name: '欧盟市场 SEO 覆盖', status: 'active', progress: 41, createdAt: '2026-04-22', engine: 'Gemini/DeepSeek' },
  { id: 'c3', name: 'Q1 品牌引用提升', status: 'done', progress: 100, createdAt: '2026-04-01', engine: 'All Engines' },
];

// ── 子组件: 指标卡片 ────────────────────────────────────────────
function MetricCard({ label, value, delta, positive, icon, color }: GeoMetric) {
  return (
    <div className="glass-card p-4 border border-emerald-500/20 hover:border-emerald-400/40 transition-all">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xl">{icon}</span>
        {delta && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${positive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {positive ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(Number(value) || 0, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── 子组件: BotSight 行 ────────────────────────────────────────
function BotSightRow({ item, index }: { item: BotSightItem; index: number }) {
  const statusColor = { healthy: 'bg-emerald-400', warning: 'bg-amber-400', critical: 'bg-red-400' }[item.status];
  const barColor = { healthy: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-red-500' }[item.status];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 rounded px-2 transition-colors">
      <div className={`w-2 h-2 rounded-full ${statusColor} animate-pulse shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white font-medium truncate">{item.engine}</div>
        <div className="text-[10px] text-slate-500">{item.lastChecked}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs text-emerald-400 font-bold">{item.aiVisible}</div>
        <div className="text-[10px] text-slate-500">AI可见</div>
      </div>
      <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.aiVisible}%` }} />
      </div>
      <div className="text-right shrink-0 w-14">
        <div className="text-xs text-cyan-400 font-bold">{item.citationShare}%</div>
        <div className="text-[10px] text-slate-500">引用率</div>
      </div>
    </div>
  );
}

// ── 子组件: Prompt Gap 行 ──────────────────────────────────────
function GapRow({ item, index }: { item: PromptGap; index: number }) {
  const oppColor = { high: 'text-emerald-400', medium: 'text-amber-400', low: 'text-slate-400' }[item.opportunity];
  const oppBg = { high: 'bg-emerald-500/20', medium: 'bg-amber-500/20', low: 'bg-slate-500/20' }[item.opportunity];
  const barColor = item.gapScore > 70 ? 'bg-emerald-500' : item.gapScore > 50 ? 'bg-amber-500' : 'bg-slate-500';
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-700/50 last:border-0 hover:bg-slate-800/30 rounded px-2 transition-colors">
      <div className="w-6 h-6 rounded bg-slate-700 flex items-center justify-center text-[10px] text-slate-400 shrink-0">
        #{index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white font-medium">{item.keyword}</div>
        <div className="text-[10px] text-slate-500 truncate">{item.competitorGap}</div>
      </div>
      <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${oppBg} ${oppColor} shrink-0`}>
        {item.opportunity === 'high' ? '🔥 高机会' : item.opportunity === 'medium' ? '⚡ 中机会' : '○ 低机会'}
      </div>
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden shrink-0">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.gapScore}%` }} />
      </div>
      <div className="text-xs text-slate-300 w-8 text-right shrink-0">{item.gapScore}</div>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────
export function GeoMarketingPanel() {
  const [activeTab, setActiveTab] = useState<'overview' | 'botsight' | 'gap' | 'campaigns' | 'dageno'>('overview');
  const [dagenoStatus, setDagenoStatus] = useState<DagenoStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [iframeReady, setIframeReady] = useState(false);
  const [campaignName, setCampaignName] = useState('');
  const [campaignKeywords, setCampaignKeywords] = useState('');
  const [targetEngines, setTargetEngines] = useState<string[]>(['ChatGPT (GPT-4o)', 'Perplexity']);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    loadDagenoStatus();
  }, []);

  const loadDagenoStatus = async () => {
    try {
      const res = await fetch('/api/dageno/status');
      if (res.ok) {
        const data = await res.json();
        setDagenoStatus(data);
      }
    } catch {
      // Dageno API 未配置时静默降级
    }
  };

  const handleOpenDagenoFull = () => {
    window.open(`${DAGENO_ORIGIN}/${WORKSPACE_PATH}/geo/overview`, '_blank', 'noopener,noreferrer');
  };

  const handleStartCampaign = () => {
    if (!campaignName.trim() || !campaignKeywords.trim()) {
      toast.error('请填写活动名称和目标关键词');
      return;
    }
    toast.success(`GEO 活动「${campaignName}」已创建，正在分配至坎宫·营销虾执行！`);
    setCampaignName('');
    setCampaignKeywords('');
  };

  const engineOptions = ['ChatGPT (GPT-4o)', 'Perplexity', 'Gemini (Google)', 'Claude (Anthropic)', 'DeepSeek'];

  const tabs = [
    { id: 'overview', label: '📊 总览', icon: '📊' },
    { id: 'botsight', label: '🔍 BotSight', icon: '🔍' },
    { id: 'gap', label: '🎯 Prompt Gap', icon: '🎯' },
    { id: 'campaigns', label: '🚀 活动管理', icon: '🚀' },
    { id: 'dageno', label: '🗺️ Dageno 全屏', icon: '🗺️' },
  ] as const;

  return (
    <div className="h-full flex flex-col bg-slate-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-xl">
            🌍
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Dageno GEO · AI可见性营销系统</h2>
            <p className="text-[10px] text-emerald-300/70">数据驱动生成式引擎优化 · BotSight · Prompt Gap Radar · Citation Share</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dagenoStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-xs text-slate-400">{dagenoStatus?.configured ? 'Dageno 已连接' : '本地模式'}</span>
          <button
            onClick={handleOpenDagenoFull}
            className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            ↗ 打开 Dageno
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-slate-700/40 bg-slate-900/50 shrink-0 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* 核心指标行 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="AI 综合可见性" value={54} delta="+12%" positive icon="🤖" color="linear-gradient(to right, #10b981, #059669)" />
              <MetricCard label="引用分享率" value="34%" delta="+5%" positive icon="📎" color="linear-gradient(to right, #06b6d4, #0891b2)" />
              <MetricCard label="关键词覆盖" value={247} delta="+38" positive icon="🔑" color="linear-gradient(to right, #8b5cf6, #7c3aed)" />
              <MetricCard label="竞品差距分" value={71} delta="-8%" positive={false} icon="📉" color="linear-gradient(to right, #f59e0b, #d97706)" />
            </div>

            {/* BotSight 快速视图 */}
            <div className="glass-card border border-emerald-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  🔍 BotSight · 各引擎可见性
                </h3>
                <button
                  onClick={() => setActiveTab('botsight')}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  查看全部 →
                </button>
              </div>
              <div>
                {MOCK_BOTSIGHT.slice(0, 3).map((item, i) => (
                  <BotSightRow key={item.engine} item={item} index={i} />
                ))}
              </div>
            </div>

            {/* Prompt Gap 快速视图 */}
            <div className="glass-card border border-cyan-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  🎯 Prompt Gap Radar · Top 机会关键词
                </h3>
                <button
                  onClick={() => setActiveTab('gap')}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  查看全部 →
                </button>
              </div>
              <div>
                {MOCK_GAPS.slice(0, 3).map((item, i) => (
                  <GapRow key={item.keyword} item={item} index={i} />
                ))}
              </div>
            </div>

            {/* 快速活动 */}
            <div className="glass-card border border-violet-500/20 p-4">
              <h3 className="text-sm font-semibold text-white mb-3">🚀 快速发起 GEO 活动</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  value={campaignName}
                  onChange={e => setCampaignName(e.target.value)}
                  placeholder="活动名称，例如：北美B2B关键词攻势"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <textarea
                  value={campaignKeywords}
                  onChange={e => setCampaignKeywords(e.target.value)}
                  placeholder="目标关键词（逗号分隔），例如：B2B sourcing china, OEM manufacturing, custom packaging"
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
                <div className="flex flex-wrap gap-1.5">
                  {engineOptions.map(engine => (
                    <button
                      key={engine}
                      onClick={() => setTargetEngines(prev =>
                        prev.includes(engine) ? prev.filter(e => e !== engine) : [...prev, engine]
                      )}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-all ${targetEngines.includes(engine) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-emerald-500'}`}
                    >
                      {engine}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleStartCampaign}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold py-2.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                >
                  ⚡ 立即创建 GEO 活动
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══ BOT SIGHT ═══ */}
        {activeTab === 'botsight' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">🔍 BotSight · 全引擎 AI 可见性监测</h3>
              <button
                onClick={loadDagenoStatus}
                className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 px-3 py-1 rounded-lg transition-colors"
              >
                🔄 刷新
              </button>
            </div>

            {/* 引擎总览条 */}
            <div className="glass-card border border-emerald-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">综合可见性</span>
                <span className="text-lg font-bold text-emerald-400">54 / 100</span>
              </div>
              <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: '54%' }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-slate-500">
                <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
              </div>
            </div>

            {/* 各引擎详情 */}
            <div className="glass-card border border-emerald-500/20 p-4">
              <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500 uppercase tracking-wide">
                <div className="w-2" />
                <div className="flex-1">搜索引擎</div>
                <div className="w-14 text-right">AI可见</div>
                <div className="w-20">可见趋势</div>
                <div className="w-14 text-right">引用率</div>
              </div>
              {MOCK_BOTSIGHT.map((item, i) => (
                <BotSightRow key={item.engine} item={item} index={i} />
              ))}
            </div>

            {/* 说明 */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-emerald-400 font-semibold">BotSight</span> 通过 Dageno AI 实时监测您的品牌在各大 AI 搜索引擎中的可见性表现。
                <span className="text-cyan-400 font-semibold ml-2">引用分享率</span> 衡量您的品牌在 AI 回答中被引用和分享的频率。
                建议将引用率提升至 <span className="text-white">40%+</span> 以获得更好的品牌曝光。
              </p>
            </div>
          </div>
        )}

        {/* ═══ PROMPT GAP ═══ */}
        {activeTab === 'gap' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">🎯 Prompt Gap Radar</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">发现你的品牌在 AI 搜索中的关键词机会差距</p>
              </div>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🔥 高机会</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">⚡ 中机会</span>
                <span className="text-[10px] px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">○ 低机会</span>
              </div>
            </div>

            <div className="glass-card border border-cyan-500/20 p-4">
              <div className="flex items-center gap-4 mb-3 text-[10px] text-slate-500 uppercase tracking-wide">
                <div className="w-6" />
                <div className="flex-1">关键词</div>
                <div className="w-16">机会等级</div>
                <div className="w-16">差距分</div>
                <div className="w-8 text-right">分值</div>
              </div>
              {MOCK_GAPS.map((item, i) => (
                <GapRow key={item.keyword} item={item} index={i} />
              ))}
            </div>

            {/* Gap 解释 */}
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
              <p className="text-[10px] text-slate-400 leading-relaxed">
                <span className="text-cyan-400 font-semibold">Prompt Gap Score</span> = 竞品覆盖率 - 你的覆盖率。
                分值越高表示你在该关键词上被 AI 提及的机会越大，应优先优化。
                <span className="text-white ml-2">Gap &gt; 70</span> 为高优先级，<span className="text-white">Gap 50-70</span> 为中优先级。
              </p>
            </div>

            {/* 优化建议 */}
            <div className="glass-card border border-emerald-500/20 p-4">
              <h4 className="text-xs font-semibold text-emerald-400 mb-3">💡 立即优化建议</h4>
              <div className="space-y-2">
                {MOCK_GAPS.filter(g => g.opportunity === 'high').map(gap => (
                  <div key={gap.keyword} className="flex items-start gap-2 p-2 bg-emerald-900/20 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-400 shrink-0 mt-0.5">🔥</span>
                    <div>
                      <span className="text-xs text-white font-medium">"{gap.keyword}"</span>
                      <span className="text-[10px] text-slate-400 ml-2">{gap.competitorGap}</span>
                      <div className="mt-1 text-[10px] text-emerald-300">
                        → 建议：创建 3-5 篇针对性 GEO 内容，覆盖 B2B 采购意图页面
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ CAMPAIGNS ═══ */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">🚀 GEO 活动管理</h3>
              <button
                onClick={() => setActiveTab('overview')}
                className="text-xs text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 px-3 py-1 rounded-lg transition-colors"
              >
                + 新建活动
              </button>
            </div>

            {/* 活动列表 */}
            <div className="space-y-3">
              {MOCK_CAMPAIGNS.map(campaign => (
                <div key={campaign.id} className="glass-card border border-slate-600/30 p-4 hover:border-slate-500/50 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${campaign.status === 'active' ? 'bg-emerald-400 animate-pulse' : campaign.status === 'paused' ? 'bg-amber-400' : 'bg-slate-500'}`} />
                        <span className="text-xs text-white font-semibold">{campaign.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${campaign.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : campaign.status === 'paused' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'}`}>
                          {campaign.status === 'active' ? '进行中' : campaign.status === 'paused' ? '已暂停' : '已完成'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">{campaign.engine} · 创建于 {campaign.createdAt}</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-white">{campaign.progress}%</div>
                      <div className="text-[10px] text-slate-500">完成度</div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${campaign.status === 'done' ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`}
                      style={{ width: `${campaign.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* 活动统计 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="glass-card border border-slate-600/30 p-3 text-center">
                <div className="text-lg font-bold text-emerald-400">2</div>
                <div className="text-[10px] text-slate-500">进行中</div>
              </div>
              <div className="glass-card border border-slate-600/30 p-3 text-center">
                <div className="text-lg font-bold text-white">247</div>
                <div className="text-[10px] text-slate-500">关键词覆盖</div>
              </div>
              <div className="glass-card border border-slate-600/30 p-3 text-center">
                <div className="text-lg font-bold text-cyan-400">+34%</div>
                <div className="text-[10px] text-slate-500">引用率提升</div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ DAGENO FULLSCREEN IFRAME ═══ */}
        {activeTab === 'dageno' && (
          <div className="h-full flex flex-col gap-3" style={{ height: 'calc(100vh - 200px)' }}>
            <div className="flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">🗺️ Dageno GEO 全屏视图</h3>
                <p className="text-[10px] text-slate-500">实时嵌入 app.dageno.ai · 完整功能</p>
              </div>
              <div className="flex items-center gap-2">
                {!iframeReady && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[10px] text-amber-400">加载中...</span>
                  </div>
                )}
                {iframeReady && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-[10px] text-emerald-400">已连接</span>
                  </div>
                )}
                <button
                  onClick={() => { setIframeReady(false); setTimeout(() => setIframeReady(true), 500); }}
                  className="text-[10px] text-slate-400 hover:text-white border border-slate-600 px-2 py-1 rounded transition-colors"
                >
                  🔄 刷新
                </button>
                <button
                  onClick={handleOpenDagenoFull}
                  className="text-[10px] text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 px-2 py-1 rounded transition-colors"
                >
                  ↗ 新窗口打开
                </button>
              </div>
            </div>

            {/* iframe 嵌入区 */}
            <div className="flex-1 glass-card border border-emerald-500/20 rounded-xl overflow-hidden">
              {iframeReady ? (
                <iframe
                  ref={iframeRef}
                  src={`${DAGENO_ORIGIN}/${WORKSPACE_PATH}/geo/overview`}
                  className="w-full h-full border-0"
                  title="Dageno GEO Overview"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
                  onLoad={() => setIframeReady(true)}
                  onError={() => {
                    setIframeReady(false);
                    toast.error('Dageno 加载失败，请检查网络或在新窗口中打开');
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-slate-900">
                  <div className="text-5xl animate-pulse">🌐</div>
                  <div className="text-center">
                    <p className="text-white font-medium mb-1">正在加载 Dageno GEO</p>
                    <p className="text-slate-400 text-sm">正在连接 app.dageno.ai...</p>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {/* 底部说明 */}
            <div className="flex items-center justify-between bg-slate-800/50 rounded-lg px-4 py-2 shrink-0">
              <div className="text-[10px] text-slate-500">
                🔗 嵌入来源: <span className="text-cyan-400">{DAGENO_ORIGIN}/{WORKSPACE_PATH}/geo/overview</span>
              </div>
              <div className="text-[10px] text-slate-500">
                数据由 Dageno 实时提供 · <a href="https://docs.dageno.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">API 文档</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
