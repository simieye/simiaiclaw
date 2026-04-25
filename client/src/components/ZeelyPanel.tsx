/**
 * SIMIAICLAW 龙虾集群 · Zeely AI 广告智能体控制面板
 * 巽宫·创意工具卦专属执行层
 * 集成 Zeely.ai AI 广告创作平台 · 视频广告 · 静态广告 · 多平台投放
 * 实现 AI 驱动的广告创意生成与自动化投放管理
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const ZEELY_WEB = 'https://zeely.ai';
const ZEELY_PRICING = 'https://zeely.ai/pricing';

// ── 类型定义 ──────────────────────────────────────────────
interface AdCreative {
  id: string;
  name: string;
  type: 'video' | 'static' | 'avatar';
  platform: string[];
  status: 'draft' | 'generating' | 'ready' | 'published';
  createdAt: string;
  thumbnail?: string;
  roas?: number;
  ctr?: number;
  impressions?: number;
}

interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  roas: number;
  purchases: number;
  impressions: number;
  ctr: number;
  cpc: number;
  startDate: string;
}

interface ZeelyTemplate {
  id: string;
  name: string;
  category: string;
  style: string;
  icon: string;
  uses: number;
  roasBoost: number;
}

// ── 常量配置 ──────────────────────────────────────────────
const ZEELY_AVATARS = [
  { id: 'av-001', name: 'Emma', gender: 'female', style: 'Professional', uses: 12843 },
  { id: 'av-002', name: 'Marcus', gender: 'male', style: 'Casual', uses: 9742 },
  { id: 'av-003', name: 'Sophie', gender: 'female', style: 'Friendly', uses: 8431 },
  { id: 'av-004', name: 'James', gender: 'male', style: 'Executive', uses: 7204 },
  { id: 'av-005', name: 'Olivia', gender: 'female', style: 'Trendy', uses: 6812 },
  { id: 'av-006', name: 'David', gender: 'male', style: 'Tech-savvy', uses: 5341 },
];

const PLATFORM_ICONS: Record<string, string> = {
  facebook: '📘',
  instagram: '📷',
  google: '🔍',
  tiktok: '🎵',
};

const PLATFORM_COLORS: Record<string, string> = {
  facebook: 'from-blue-600/20 to-blue-600/10',
  instagram: 'from-pink-600/20 to-purple-600/10',
  google: 'from-red-500/20 to-yellow-500/10',
  tiktok: 'from-black/30 to-gray-600/20',
};

// ── 主组件 ────────────────────────────────────────────────
export function ZeelyPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'creatives' | 'campaigns' | 'avatars' | 'templates' | 'settings'>('dashboard');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState<'video' | 'static'>('video');
  const [generating, setGenerating] = useState<string | null>(null);
  const [logOutput, setLogOutput] = useState('');

  // 广告活动数据
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([
    { id: 'camp-001', name: '春季新品推广', platform: 'facebook', status: 'active', budget: 500, spent: 327.5, roas: 4.2, purchases: 142, impressions: 28340, ctr: 3.8, cpc: 0.92, startDate: '2026-04-15' },
    { id: 'camp-002', name: '母亲节促销', platform: 'instagram', status: 'active', budget: 800, spent: 612.3, roas: 5.1, purchases: 287, impressions: 52410, ctr: 4.2, cpc: 0.78, startDate: '2026-04-20' },
    { id: 'camp-003', name: '独立站引流', platform: 'google', status: 'paused', budget: 300, spent: 198.2, roas: 2.8, purchases: 63, impressions: 15820, ctr: 2.1, cpc: 1.45, startDate: '2026-04-10' },
    { id: 'camp-004', name: 'TikTok爆款测试', platform: 'tiktok', status: 'active', budget: 200, spent: 89.6, roas: 6.3, purchases: 198, impressions: 98450, ctr: 5.7, cpc: 0.34, startDate: '2026-04-22' },
    { id: 'camp-005', name: '品牌曝光活动', platform: 'facebook', status: 'completed', budget: 1000, spent: 998.5, roas: 3.9, purchases: 412, impressions: 152300, ctr: 3.2, cpc: 0.67, startDate: '2026-04-01' },
  ]);

  // 广告创意数据
  const [creatives, setCreatives] = useState<AdCreative[]>([
    { id: 'cr-001', name: '春季新品UGC视频广告', type: 'video', platform: ['facebook', 'instagram'], status: 'published', createdAt: '2026-04-24 09:00', roas: 4.8, ctr: 4.2, impressions: 45230 },
    { id: 'cr-002', name: 'Emma产品介绍视频', type: 'video', platform: ['facebook', 'tiktok'], status: 'published', createdAt: '2026-04-23 14:30', roas: 5.2, ctr: 5.1, impressions: 67800 },
    { id: 'cr-003', name: '母亲节促销横幅', type: 'static', platform: ['instagram', 'google'], status: 'ready', createdAt: '2026-04-25 08:00' },
    { id: 'cr-004', name: '品牌KV静态广告', type: 'static', platform: ['facebook'], status: 'draft', createdAt: '2026-04-25 10:00' },
    { id: 'cr-005', name: 'Marcus品牌故事视频', type: 'avatar', platform: ['tiktok', 'instagram'], status: 'generating', createdAt: '2026-04-25 11:00' },
  ]);

  // 模板数据
  const [templates] = useState<ZeelyTemplate[]>([
    { id: 'tmpl-001', name: 'AIDA 高转化视频', category: '视频广告', style: '销售导向', icon: '🎯', uses: 8934, roasBoost: 32 },
    { id: 'tmpl-002', name: 'PAS 问题-方案-解决', category: '视频广告', style: '说服力', icon: '💡', uses: 7421, roasBoost: 28 },
    { id: 'tmpl-003', name: 'Before-After-Bridge', category: '视频广告', style: '转型故事', icon: '🔄', uses: 6103, roasBoost: 35 },
    { id: 'tmpl-004', name: '4U 价值主张', category: '静态广告', style: '紧迫感', icon: '⚡', uses: 8921, roasBoost: 22 },
    { id: 'tmpl-005', name: 'FAB 特征-优势-收益', category: '静态广告', style: '产品展示', icon: '📦', uses: 5347, roasBoost: 19 },
    { id: 'tmpl-006', name: 'UGC 真实风格', category: '视频广告', style: '真实感', icon: '🤳', uses: 11204, roasBoost: 41 },
    { id: 'tmpl-007', name: '病毒式传播', category: '视频广告', style: '娱乐化', icon: '🔥', uses: 6820, roasBoost: 54 },
    { id: 'tmpl-008', name: '限时促销横幅', category: '静态广告', style: '紧迫感', icon: '⏰', uses: 9873, roasBoost: 27 },
  ]);

  // 连接 Zeely
  const handleConnect = async () => {
    if (!apiKey) {
      toast.error('请输入 Zeely API Key');
      return;
    }
    setIsConnecting(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      setIsConnected(true);
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ Zeely.ai 连接成功 · 广告智能体就绪\n`);
      toast.success('Zeely.ai 连接成功！');
    } catch (e) {
      toast.error(`连接失败: ${e}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 生成广告创意
  const handleGenerate = async (type: 'video' | 'static' | 'avatar', template?: string) => {
    const id = `cr-${Date.now()}`;
    const typeLabel = { video: '视频广告', static: '静态广告', avatar: 'AI虚拟形象广告' }[type];
    setGenerating(id);
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ⚡ 启动 ${typeLabel} 生成 · 模板: ${template || '默认'}\n`);
    toast.info(`正在生成 ${typeLabel}...`);

    // 模拟生成过程
    setCreatives(prev => [...prev, {
      id,
      name: `${typeLabel} #${id.slice(-4)}`,
      type,
      platform: ['facebook', 'instagram'],
      status: 'generating',
      createdAt: new Date().toISOString(),
    }]);

    setTimeout(() => {
      setGenerating(null);
      setCreatives(prev => prev.map(c => c.id === id ? { ...c, status: 'ready' } : c));
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ ${typeLabel} 生成完成 · 准备投放\n`);
      toast.success(`${typeLabel} 生成完成！`);
    }, 4000);
  };

  // 发布广告
  const handlePublish = async (creativeId: string, platforms: string[]) => {
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] 📤 发布广告至: ${platforms.join(', ')}\n`);
    toast.success(`广告已发布至 ${platforms.join(', ')}！`);
    setCreatives(prev => prev.map(c => c.id === creativeId ? { ...c, status: 'published' } : c));
  };

  // 计算关键指标
  const totalSpent = campaigns.reduce((s, c) => s + c.spent, 0);
  const totalPurchases = campaigns.reduce((s, c) => s + c.purchases, 0);
  const avgRoas = campaigns.filter(c => c.status === 'active').reduce((s, c, _, a) => s + c.roas / a.length, 0);
  const totalImpressions = campaigns.reduce((s, c) => s + c.impressions, 0);

  const statusColor = (status: string) => ({
    active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    paused: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    completed: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
    draft: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    generating: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    ready: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    published: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  }[status] || 'text-slate-400 bg-slate-500/10');

  return (
    <div className="space-y-5">
      {/* ── 顶部标题栏 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600/40 to-pink-600/40 border border-rose-500/30 flex items-center justify-center text-2xl shadow-lg shadow-rose-500/10">
            📣
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Zeely · AI 广告智能体</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI 广告创作平台 · UGC视频 · 静态广告 · 多平台投放 · 自动优化</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border ${isConnected ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
          <a href={ZEELY_PRICING} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
            💰 定价
          </a>
          <a href={ZEELY_WEB} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors">
            🌐 官网
          </a>
        </div>
      </div>

      {/* ── 导航标签 ── */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { key: 'dashboard', label: '控制台', icon: '🌀' },
          { key: 'creatives', label: '广告创意', icon: '🎨' },
          { key: 'campaigns', label: '投放管理', icon: '📊' },
          { key: 'avatars', label: 'AI虚拟形象', icon: '👤' },
          { key: 'templates', label: '模板库', icon: '📋' },
          { key: 'settings', label: '连接配置', icon: '🔌' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key as any)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${activeView === tab.key ? 'bg-rose-600/30 text-rose-300 ring-1 ring-rose-500/30' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'}`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── 控制台视图 ── */}
      {activeView === 'dashboard' && (
        <div className="space-y-4">
          {/* 关键指标卡片 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: '总花费', value: `$${totalSpent.toFixed(1)}`, sub: `预算: $${campaigns.reduce((s, c) => s + c.budget, 0)}`, color: 'text-rose-400', icon: '💰' },
              { label: '总购买量', value: totalPurchases.toString(), sub: '全部活动', color: 'text-emerald-400', icon: '🛒' },
              { label: '平均 ROAS', value: avgRoas.toFixed(1), sub: '活跃活动', color: 'text-cyan-400', icon: '📈' },
              { label: '总曝光量', value: `${(totalImpressions / 1000).toFixed(1)}K`, sub: '全部平台', color: 'text-violet-400', icon: '👁️' },
            ].map(card => (
              <div key={card.label} className="glass-card p-4 border border-slate-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">{card.icon}</span>
                  <span className="text-xs text-slate-400">{card.label}</span>
                </div>
                <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{card.sub}</div>
              </div>
            ))}
          </div>

          {/* 快速生成 + 活动概览 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* 快速生成 */}
            <div className="glass-card p-5 border border-rose-500/20">
              <span className="text-xs font-medium text-slate-300 mb-3 block">⚡ 快速生成广告</span>
              <div className="space-y-3">
                {[
                  { label: 'AI 视频广告', sub: '7分钟 · UGC风格 · 30+虚拟形象', icon: '🎬', type: 'video' as const },
                  { label: '静态横幅广告', sub: '100+模板 · 批量生成 · A/B测试', icon: '🖼️', type: 'static' as const },
                  { label: 'AI 虚拟形象广告', sub: '超逼真AI形象 · Talking Reels', icon: '👤', type: 'avatar' as const },
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleGenerate(item.type)}
                    disabled={generating !== null}
                    className="w-full flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-rose-600/10 rounded-xl border border-slate-700/50 hover:border-rose-500/30 transition-all group disabled:opacity-40"
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="text-left flex-1">
                      <div className="text-xs font-medium text-white group-hover:text-rose-300 transition-colors">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.sub}</div>
                    </div>
                    <span className="text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </button>
                ))}
              </div>
              {generating && (
                <div className="mt-3 text-xs text-cyan-400 animate-pulse">⚡ AI 正在生成中...</div>
              )}
            </div>

            {/* 活动概览 */}
            <div className="lg:col-span-2 glass-card p-5 border border-rose-500/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-medium text-slate-300">📊 活动概览</span>
                <button onClick={() => setActiveView('campaigns')} className="text-xs text-rose-400 hover:text-rose-300">查看全部 →</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-800">
                      <th className="text-left py-2 pr-4 font-medium">活动名称</th>
                      <th className="text-left py-2 pr-4 font-medium">平台</th>
                      <th className="text-left py-2 pr-4 font-medium">状态</th>
                      <th className="text-left py-2 pr-4 font-medium">ROAS</th>
                      <th className="text-left py-2 pr-4 font-medium">花费/预算</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.filter(c => c.status === 'active').slice(0, 4).map(camp => (
                      <tr key={camp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3 pr-4 text-slate-200">{camp.name}</td>
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-1">
                            {camp.platform && PLATFORM_ICONS[camp.platform]}
                            <span className="text-slate-400 capitalize">{camp.platform}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(camp.status)}`}>{camp.status}</span>
                        </td>
                        <td className="py-3 pr-4 text-emerald-400 font-medium">{camp.roas}x</td>
                        <td className="py-3 pr-4 text-slate-400">${camp.spent.toFixed(0)} / ${camp.budget}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 创意库预览 */}
          <div className="glass-card p-5 border border-rose-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">🎨 广告创意库</span>
              <button onClick={() => setActiveView('creatives')} className="text-xs text-rose-400 hover:text-rose-300">管理创意 →</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {creatives.slice(0, 3).map(cr => (
                <div key={cr.id} className="p-4 bg-slate-800/40 rounded-xl border border-slate-700/40">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(cr.status)}`}>{cr.status}</span>
                    <div className="flex items-center gap-1">
                      {cr.platform.map(p => <span key={p} className="text-xs">{PLATFORM_ICONS[p]}</span>)}
                    </div>
                  </div>
                  <div className="text-xs font-medium text-white truncate">{cr.name}</div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                    <span className="text-rose-400">{cr.type === 'video' ? '🎬' : cr.type === 'avatar' ? '👤' : '🖼️'}</span>
                    {cr.roas && <span className="text-emerald-400">ROAS {cr.roas}x</span>}
                    {cr.ctr && <span className="text-cyan-400">CTR {cr.ctr}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 日志输出区 */}
          {logOutput && (
            <div className="glass-card p-4 border border-rose-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">📜 执行日志</span>
                <button onClick={() => setLogOutput('')} className="text-[10px] text-slate-500 hover:text-slate-300">清空</button>
              </div>
              <pre className="text-[10px] text-emerald-400/80 font-mono bg-slate-900/50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">{logOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── 广告创意视图 ── */}
      {activeView === 'creatives' && (
        <div className="space-y-4">
          {/* 切换视频/静态 */}
          <div className="flex items-center gap-1">
            {[
              { key: 'video', label: '🎬 视频广告' },
              { key: 'static', label: '🖼️ 静态广告' },
              { key: 'avatar', label: '👤 AI虚拟形象' },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                className={`text-xs px-4 py-2 rounded-lg transition-all ${activeTab === tab.key ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                {tab.label}
              </button>
            ))}
            <div className="ml-auto">
              <button
                onClick={() => handleGenerate(activeTab as 'video' | 'static' | 'avatar')}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg border border-rose-500/20 transition-all"
              >
                + 新建广告
              </button>
            </div>
          </div>

          {/* 创意网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {creatives.filter(c => c.type === activeTab || activeTab === 'avatar' && c.type === 'avatar').map(cr => (
              <div key={cr.id} className="glass-card p-5 border border-rose-500/20 hover:border-rose-400/40 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(cr.status)}`}>{cr.status}</span>
                    <div className="flex items-center gap-0.5">
                      {cr.platform.map(p => <span key={p} className="text-sm">{PLATFORM_ICONS[p]}</span>)}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{cr.createdAt.slice(0, 10)}</span>
                </div>
                <div className="text-sm font-medium text-white mb-2">{cr.name}</div>
                <div className="flex items-center gap-3 text-[10px] text-slate-400">
                  {cr.roas && <span className="text-emerald-400">📈 ROAS {cr.roas}x</span>}
                  {cr.ctr && <span className="text-cyan-400">🖱 CTR {cr.ctr}%</span>}
                  {cr.impressions && <span className="text-violet-400">👁️ {(cr.impressions / 1000).toFixed(1)}K</span>}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  {cr.status === 'ready' && (
                    <button
                      onClick={() => handlePublish(cr.id, cr.platform)}
                      className="flex-1 text-xs bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition-all"
                    >
                      📤 发布
                    </button>
                  )}
                  {cr.status === 'published' && (
                    <span className="flex-1 text-center text-xs text-emerald-400 py-2">✓ 已发布</span>
                  )}
                  <button className="text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-lg transition-all">
                    编辑
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 投放管理视图 ── */}
      {activeView === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white">📊 广告活动管理</span>
            <button className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg border border-rose-500/20 transition-all">
              + 新建活动
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="text-left py-2 pr-4 font-medium">活动名称</th>
                  <th className="text-left py-2 pr-4 font-medium">平台</th>
                  <th className="text-left py-2 pr-4 font-medium">状态</th>
                  <th className="text-left py-2 pr-4 font-medium">花费/预算</th>
                  <th className="text-left py-2 pr-4 font-medium">ROAS</th>
                  <th className="text-left py-2 pr-4 font-medium">购买量</th>
                  <th className="text-left py-2 pr-4 font-medium">CPC</th>
                  <th className="text-left py-2 pr-4 font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(camp => (
                  <tr key={camp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                    <td className="py-3 pr-4 text-slate-200">{camp.name}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1">
                        <span className="text-base">{PLATFORM_ICONS[camp.platform]}</span>
                        <span className="text-slate-400 capitalize">{camp.platform}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(camp.status)}`}>{camp.status}</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">${camp.spent.toFixed(1)} / ${camp.budget}</td>
                    <td className="py-3 pr-4 text-emerald-400 font-medium">{camp.roas}x</td>
                    <td className="py-3 pr-4 text-white">{camp.purchases}</td>
                    <td className="py-3 pr-4 text-cyan-400">${camp.cpc.toFixed(2)}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        {camp.status === 'active' ? (
                          <button className="text-[10px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 px-2 py-1 rounded border border-amber-500/20">暂停</button>
                        ) : (
                          <button className="text-[10px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded border border-emerald-500/20">启动</button>
                        )}
                        <button className="text-[10px] bg-slate-700/50 text-slate-400 px-2 py-1 rounded">详情</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 平台分布 */}
          <div className="glass-card p-5 border border-rose-500/20">
            <h3 className="text-sm font-medium text-white mb-4">🌐 平台分布</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['facebook', 'instagram', 'google', 'tiktok'].map(pf => {
                const pfCampaigns = campaigns.filter(c => c.platform === pf);
                const pfSpent = pfCampaigns.reduce((s, c) => s + c.spent, 0);
                const totalPfSpent = campaigns.reduce((s, c) => s + c.spent, 0);
                return (
                  <div key={pf} className={`p-4 rounded-xl bg-gradient-to-br ${PLATFORM_COLORS[pf]} border border-slate-700/40`}>
                    <div className="text-2xl mb-1">{PLATFORM_ICONS[pf]}</div>
                    <div className="text-sm font-medium text-white capitalize">{pf}</div>
                    <div className="text-lg font-bold text-white mt-1">${pfSpent.toFixed(0)}</div>
                    <div className="text-[10px] text-slate-400">占总花费 {((pfSpent / totalPfSpent) * 100).toFixed(0)}%</div>
                    <div className="text-[10px] text-emerald-400 mt-1">活动 {pfCampaigns.length} 个</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── AI虚拟形象视图 ── */}
      {activeView === 'avatars' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">👤 AI 虚拟形象库</h3>
              <p className="text-xs text-slate-400 mt-0.5">30+ 超逼真 AI 虚拟形象，可用于视频广告和 Talking Reels</p>
            </div>
            <button
              onClick={() => handleGenerate('avatar')}
              className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg border border-rose-500/20 transition-all"
            >
              + 创建虚拟形象广告
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {ZEELY_AVATARS.map(av => (
              <div key={av.id} className="glass-card p-4 border border-rose-500/20 hover:border-rose-400/40 transition-all text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-rose-600/30 to-pink-600/30 border border-rose-500/30 flex items-center justify-center text-3xl mb-3">
                  {av.gender === 'female' ? '👩' : '👨'}
                </div>
                <div className="text-xs font-medium text-white">{av.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{av.style}</div>
                <div className="text-[10px] text-rose-400 mt-1">使用 {av.uses.toLocaleString()} 次</div>
                <button className="mt-2 w-full text-[10px] bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 py-1.5 rounded-lg border border-rose-500/20 transition-all">
                  使用
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 模板库视图 ── */}
      {activeView === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {templates.map(tmpl => (
            <div key={tmpl.id} className="glass-card p-5 border border-rose-500/20 hover:border-rose-400/40 transition-all">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-rose-600/20 border border-rose-500/20 flex items-center justify-center text-xl flex-shrink-0">
                  {tmpl.icon}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{tmpl.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{tmpl.category} · {tmpl.style}</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>使用 {tmpl.uses.toLocaleString()} 次</span>
                <span className="text-emerald-400">ROAS +{tmpl.roasBoost}%</span>
              </div>
              <button className="mt-3 w-full text-xs bg-rose-600 hover:bg-rose-500 text-white py-2 rounded-lg transition-all">
                使用此模板
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── 连接配置视图 ── */}
      {activeView === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5 border border-rose-500/20 space-y-4">
            <h3 className="text-sm font-medium text-white">🔌 Zeely 连接配置</h3>
            <p className="text-xs text-slate-400">连接 Zeely.ai API，获取 AI 广告创作能力。</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Zeely API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="从 zeely.ai/dashboard 获取 API Key"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {isConnecting ? '正在连接...' : isConnected ? '✓ 已连接 · 重新认证' : '连接 Zeely'}
            </button>
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 space-y-1">
                <div>1. 访问 <a href={ZEELY_WEB} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:underline">zeely.ai</a> 注册并登录</div>
                <div>2. 进入 Dashboard → API Keys → 创建新密钥</div>
                <div>3. 复制密钥并粘贴到上方输入框</div>
              </div>
            </div>
          </div>

          {/* 效果统计 */}
          <div className="glass-card p-5 border border-rose-500/20 space-y-4">
            <h3 className="text-sm font-medium text-white">📊 Zeely 效果数据</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'CTR 提升', value: '+54%', icon: '🖱' },
                { label: '销售增长', value: '+35%', icon: '📈' },
                { label: 'ROAS 提升', value: '+250%', icon: '💰' },
                { label: 'CPC 降低', value: '-27%', icon: '🔻' },
                { label: '创作成本', value: '-95%', icon: '🎨' },
                { label: '客户增长', value: '5x', icon: '👥' },
              ].map(item => (
                <div key={item.label} className="p-3 bg-slate-800/40 rounded-lg text-center">
                  <div className="text-lg mb-1">{item.icon}</div>
                  <div className="text-sm font-bold text-white">{item.value}</div>
                  <div className="text-[10px] text-slate-500">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-500">数据来源：zeely.ai 官方统计，涵盖 10,000+ 广告活动</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}