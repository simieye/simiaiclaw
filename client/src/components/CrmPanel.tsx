/**
 * 多渠道AI客户管理系统 CRM 面板
 * 集成：sonov.io邮件营销 / 谷歌广告 / 全球社媒 / simiaiclaw.com询盘
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

// ── 类型定义 ──────────────────────────────────────────────
type CustomerSource = 'website_inquiry' | 'google_ads' | 'social_media' | 'email' | 'organic' | 'referral' | 'event' | 'manual';
type CustomerStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'linkedin' | 'twitter' | 'youtube' | 'whatsapp' | 'wechat';
type CrmTab = 'dashboard' | 'customers' | 'channels' | 'email' | 'activity';

interface Customer {
  id: string; tenantId: string; name: string; email: string; phone?: string;
  company?: string; source: CustomerSource; sourceDetail?: string;
  status: CustomerStatus; tags: string[]; notes: string;
  socialProfiles: Partial<Record<SocialPlatform, string>>;
  assignedTo?: string; lastContactAt?: string; nextFollowUpAt?: string;
  estimatedValue?: number; utmSource?: string; utmMedium?: string; utmCampaign?: string;
  createdAt: string; updatedAt: string;
}
interface EmailAccount { id: string; name: string; email: string; provider: string; isDefault: boolean; }
interface ChannelSource { id: string; name: string; type: CustomerSource; platform?: string;
  adSpend?: number; impressions?: number; clicks?: number; leads?: number; cpl?: number; active: boolean; }
interface ActivityLogEntry { id: string; type: string; description: string; createdAt: string; }
interface EmailCampaign { id: string; name: string; subject: string; status: string;
  stats: { sent: number; opened: number; clicked: number; bounced: number; unsubscribed: number; }; fromEmail: string; createdAt: string; }
interface CRMDashboard { totalCustomers: number; bySource: Record<string, number>; byStatus: Record<string, number>;
  monthlyGrowth: number; totalValue: number; avgDealSize: number; recentActivity: ActivityLogEntry[]; }

// ── 辅助常量 ──────────────────────────────────────────────
const SOURCE_LABELS: Record<CustomerSource, string> = {
  website_inquiry: '🌐 simiaiclaw.com询盘', google_ads: '📊 谷歌广告',
  social_media: '📱 社媒获客', email: '📧 邮件营销', organic: '🔍 自然流量',
  referral: '🤝 口碑推荐', event: '🏛 展会活动', manual: '✏️ 手动录入',
};
const STATUS_LABELS: Record<CustomerStatus, { label: string; color: string }> = {
  new: { label: '🆕 新客户', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  contacted: { label: '📞 已联系', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  qualified: { label: '✅ 已筛选', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  proposal: { label: '📋 方案中', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  negotiation: { label: '🤝 谈判中', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  won: { label: '🎉 已成交', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  lost: { label: '❌ 已流失', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};
const SOURCE_COLORS: Record<string, string> = {
  website_inquiry: '#10b981', google_ads: '#3b82f6', social_media: '#8b5cf6',
  email: '#f59e0b', organic: '#6b7280', referral: '#ec4899', event: '#14b8a6', manual: '#64748b',
};
const TABS = [
  { id: 'dashboard' as CrmTab, label: '📊 仪表盘' },
  { id: 'customers' as CrmTab, label: '👥 客户管理' },
  { id: 'channels' as CrmTab, label: '📡 渠道来源' },
  { id: 'email' as CrmTab, label: '📧 邮件营销' },
  { id: 'activity' as CrmTab, label: '📝 活动日志' },
];

// ── API 客户端 ─────────────────────────────────────────────
async function safeFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const r = await fetch(url, options);
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      if (body?.error) console.warn(`[CRM API] ${url}: ${body.error}`);
      return null; // 非2xx → 静默返回 null，让组件显示空状态
    }
    return r.json() as Promise<T>;
  } catch {
    return null;
  }
}

const api = {
  getDashboard: () => safeFetch<CRMDashboard>('/api/crm/dashboard'),
  getCustomers: (filters?: Record<string, string>) => {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return safeFetch<Customer[]>('/api/crm/customers' + params);
  },
  addCustomer: (data: Partial<Customer>) => safeFetch<Customer>('/api/crm/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: Partial<Customer>) => safeFetch<Customer>(`/api/crm/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteCustomer: (id: string) => safeFetch<{ success: boolean }>(`/api/crm/customers/${id}`, { method: 'DELETE' }),
  getChannels: () => safeFetch<ChannelSource[]>('/api/crm/channels'),
  addChannel: (data: Partial<ChannelSource>) => safeFetch<ChannelSource>('/api/crm/channels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  updateChannel: (id: string, data: Partial<ChannelSource>) => safeFetch<ChannelSource>(`/api/crm/channels/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteChannel: (id: string) => safeFetch<{ success: boolean }>(`/api/crm/channels/${id}`, { method: 'DELETE' }),
  getEmailAccounts: () => safeFetch<EmailAccount[]>('/api/crm/email-accounts'),
  addEmailAccount: (data: Partial<EmailAccount>) => safeFetch<EmailAccount>('/api/crm/email-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  deleteEmailAccount: (id: string) => safeFetch<{ success: boolean }>(`/api/crm/email-accounts/${id}`, { method: 'DELETE' }),
  getCampaigns: () => safeFetch<EmailCampaign[]>('/api/crm/campaigns'),
  createCampaign: (data: Partial<EmailCampaign>) => safeFetch<EmailCampaign>('/api/crm/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  sendCampaign: (id: string) => safeFetch<{ success: boolean; sent: number }>(`/api/crm/campaigns/${id}/send`, { method: 'POST' }),
  getActivity: () => safeFetch<ActivityLogEntry[]>('/api/crm/activity'),
  initDemo: () => safeFetch<{ success: boolean }>('/api/crm/init-demo', { method: 'POST' }),
};

// ── 主组件 ──────────────────────────────────────────────
export function CrmPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<CrmTab>('dashboard');
  const [loading, setLoading] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-indigo-900/50 to-purple-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl">🎯</div>
            <div>
              <h2 className="text-lg font-bold text-white">多渠道AI客户管理系统 CRM</h2>
              <p className="text-xs text-slate-400">跨境龙虾社 · AI驱动客户运营 · sonov.io邮件营销 · 谷歌广告生态</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg">
              <span className="text-emerald-400">📧</span>
              <span>hmwhtm@gmail.com</span>
              <span className="text-slate-600">|</span>
              <span>hemingwang@simiai.top</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">✕</button>
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex gap-1 px-4 py-2 bg-slate-800/50 border-b border-slate-700">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`text-xs px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardView setTab={setActiveTab} />}
          {activeTab === 'customers' && <CustomersView setLoading={setLoading} />}
          {activeTab === 'channels' && <ChannelsView setLoading={setLoading} />}
          {activeTab === 'email' && <EmailView setLoading={setLoading} />}
          {activeTab === 'activity' && <ActivityView />}
        </div>
      </div>
    </div>
  );
}

// ── 仪表盘 ──────────────────────────────────────────────
function DashboardView({ setTab }: { setTab: (t: CrmTab) => void }) {
  const [dashboard, setDashboard] = useState<CRMDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setDashboard).catch(() => null).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-400">加载中...</div>;
  if (!dashboard) return <div className="p-8 text-center text-slate-400">暂无数据 · <button onClick={() => { api.initDemo(); location.reload(); }} className="text-indigo-400 underline">初始化示例数据</button></div>;

  const statCards = [
    { label: '客户总数', value: dashboard.totalCustomers, icon: '👥', color: 'from-blue-600 to-blue-700', trend: `+${dashboard.monthlyGrowth}%` },
    { label: '客户总价值', value: '$' + dashboard.totalValue.toLocaleString(), icon: '💰', color: 'from-emerald-600 to-emerald-700', trend: 'USD' },
    { label: '平均客单价', value: '$' + dashboard.avgDealSize.toLocaleString(), icon: '📊', color: 'from-purple-600 to-purple-700', trend: 'USD' },
    { label: '月度增长', value: `${dashboard.monthlyGrowth > 0 ? '+' : ''}${dashboard.monthlyGrowth}%`, icon: '📈', color: dashboard.monthlyGrowth >= 0 ? 'from-green-600 to-green-700' : 'from-red-600 to-red-700', trend: 'MoM' },
  ];

  const sourceList = Object.entries(dashboard.bySource).sort((a, b) => b[1] - a[1]);
  const statusList = Object.entries(dashboard.byStatus).sort((a, b) => b[1] - a[1]);
  const totalSource = sourceList.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="p-6 space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className={`bg-gradient-to-br ${card.color} rounded-xl p-4 shadow-lg`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">{card.trend}</span>
            </div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs text-white/70 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* 渠道来源分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">📡 客户来源渠道分布</h3>
            <button onClick={() => setTab('channels')} className="text-xs text-indigo-400 hover:text-indigo-300">管理渠道 →</button>
          </div>
          {sourceList.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">暂无渠道数据</p>
          ) : (
            <div className="space-y-3">
              {sourceList.map(([source, count]) => {
                const pct = totalSource > 0 ? (count / totalSource) * 100 : 0;
                return (
                  <div key={source}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-300">{SOURCE_LABELS[source as CustomerSource] || source}</span>
                      <span className="text-slate-400">{count}人 ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: SOURCE_COLORS[source] || '#64748b' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 客户状态漏斗 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">🔁 客户状态漏斗</h3>
            <button onClick={() => setTab('customers')} className="text-xs text-indigo-400 hover:text-indigo-300">管理客户 →</button>
          </div>
          {statusList.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">暂无状态数据</p>
          ) : (
            <div className="space-y-2">
              {statusList.map(([status, count]) => {
                const max = statusList[0]?.[1] || 1;
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-slate-400 truncate">{STATUS_LABELS[status as CustomerStatus]?.label || status}</div>
                    <div className="flex-1 h-6 bg-slate-700 rounded-lg overflow-hidden">
                      <div className={`h-full flex items-center px-2 transition-all ${STATUS_LABELS[status as CustomerStatus]?.color}`}
                        style={{ width: `${(count / max) * 100}%` }}>
                        <span className="text-xs font-medium text-white">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 快捷入口 + 近期活动 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 快捷入口 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-4">⚡ 快速操作</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '📝 添加客户', tab: 'customers', icon: '➕', desc: '录入新客户' },
              { label: '📧 发送邮件', tab: 'email', icon: '✉️', desc: '邮件营销' },
              { label: '📡 管理渠道', tab: 'channels', icon: '🔗', desc: '广告/社媒' },
              { label: '📊 查看活动', tab: 'activity', icon: '📋', desc: '操作记录' },
            ].map(item => (
              <button key={item.label} onClick={() => setTab(item.tab as CrmTab)}
                className="bg-slate-700/50 hover:bg-slate-600/50 rounded-lg p-3 text-left border border-slate-600/50 hover:border-indigo-500/30 transition-all">
                <div className="text-base mb-1">{item.icon}</div>
                <div className="text-xs font-medium text-white">{item.label}</div>
                <div className="text-[10px] text-slate-500">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 品牌矩阵 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-4">🏢 品牌矩阵 · 询盘入口</h3>
          <div className="space-y-2">
            {[
              { name: '🦞 simiaiclaw.com', desc: '品牌官网询盘', icon: '🌐', url: 'https://www.simiaiclaw.com' },
              { name: '📧 sonov.io 邮件营销', desc: 'hmwhtm@gmail.com / simiai.top', icon: '📧', url: 'https://sonov.io' },
              { name: '📊 Google Ads 生态', desc: 'AI工具广告系列', icon: '🔍', url: 'https://ads.google.com' },
              { name: '📱 LinkedIn B2B获客', desc: '精准B2B营销', icon: '💼', url: 'https://linkedin.com' },
            ].map(item => (
              <div key={item.name} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-2.5">
                <span className="text-lg">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{item.name}</div>
                  <div className="text-[10px] text-slate-500">{item.desc}</div>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 text-xs">访问 →</a>
              </div>
            ))}
          </div>
        </div>

        {/* 近期活动 */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 className="text-sm font-bold text-white mb-4">🕐 近期活动</h3>
          {dashboard.recentActivity.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">暂无活动记录</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {dashboard.recentActivity.slice(0, 8).map(log => (
                <div key={log.id} className="text-xs text-slate-300 pb-2 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">●</span>
                    <span className="flex-1">{log.description}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5 pl-4">{new Date(log.createdAt).toLocaleString('zh-CN')}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 客户管理 ──────────────────────────────────────────────
function CustomersView({ setLoading }: { setLoading: (v: boolean) => void }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLocalLoading(true);
    api.getCustomers({ search, source: sourceFilter, status: statusFilter })
      .then(d => { if (d) setCustomers(d); }).finally(() => setLocalLoading(false));
  }, [search, sourceFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: Partial<Customer>) => {
    try {
      await api.addCustomer(data);
      toast.success('客户添加成功！');
      setShowAdd(false);
      load();
    } catch { toast.error('添加失败'); }
  };

  const handleUpdate = async (id: string, data: Partial<Customer>) => {
    try {
      await api.updateCustomer(id, data);
      toast.success('客户更新成功！');
      setEditingId(null);
      load();
    } catch { toast.error('更新失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该客户？')) return;
    try {
      await api.deleteCustomer(id);
      toast.success('已删除');
      load();
    } catch { toast.error('删除失败'); }
  };

  return (
    <div className="p-6 space-y-4">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="text" placeholder="🔍 搜索客户姓名/邮箱/公司..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="">全部来源</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          ➕ 添加客户
        </button>
        <span className="text-xs text-slate-500">{customers.length} 位客户</span>
      </div>

      {/* 客户列表 */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">加载中...</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-400 mb-2">暂无客户数据</p>
          <p className="text-xs text-slate-600">点击上方「添加客户」录入，或来自各渠道自动汇入</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-400 border-b border-slate-700 text-xs">
                <th className="text-left py-2 px-3 font-medium">客户信息</th>
                <th className="text-left py-2 px-3 font-medium">来源</th>
                <th className="text-left py-2 px-3 font-medium">状态</th>
                <th className="text-left py-2 px-3 font-medium">预估价值</th>
                <th className="text-left py-2 px-3 font-medium">跟进</th>
                <th className="text-left py-2 px-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-medium text-white">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.email || '—'}{c.company ? ` · ${c.company}` : ''}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="text-xs text-slate-300">{SOURCE_LABELS[c.source] || c.source}</span>
                    {c.sourceDetail && <div className="text-[10px] text-slate-600 truncate max-w-32">{c.sourceDetail}</div>}
                  </td>
                  <td className="py-3 px-3">
                    <select value={c.status} onChange={e => handleUpdate(c.id, { status: e.target.value as CustomerStatus })}
                      className={`text-xs px-2 py-1 rounded-lg border ${STATUS_LABELS[c.status]?.color} cursor-pointer focus:outline-none`}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-3 text-emerald-400 font-medium">
                    {c.estimatedValue ? `$${c.estimatedValue.toLocaleString()}` : '—'}
                  </td>
                  <td className="py-3 px-3">
                    <div className="text-xs text-slate-400">{c.nextFollowUpAt ? `下次: ${new Date(c.nextFollowUpAt).toLocaleDateString('zh-CN')}` : '未设置'}</div>
                    {c.tags.length > 0 && (
                      <div className="flex gap-1 mt-0.5 flex-wrap">
                        {c.tags.slice(0, 2).map(tag => <span key={tag} className="text-[9px] bg-slate-700 text-slate-400 px-1 rounded">{tag}</span>)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(c.id)} className="text-xs text-indigo-400 hover:text-indigo-300">编辑</button>
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 添加/编辑客户弹窗 */}
      {(showAdd || editingId) && (
        <CustomerFormModal
          customer={editingId ? customers.find(c => c.id === editingId) : undefined}
          onSave={editingId ? (d) => handleUpdate(editingId, d) : handleAdd}
          onClose={() => { setShowAdd(false); setEditingId(null); }}
        />
      )}
    </div>
  );
}

function CustomerFormModal({ customer, onSave, onClose }: {
  customer?: Customer; onSave: (d: Partial<Customer>) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<Partial<Customer>>(customer || {
    name: '', email: '', phone: '', company: '', source: 'manual', status: 'new',
    tags: [], notes: '', estimatedValue: 0, sourceDetail: '',
  });

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-lg p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">{customer ? '✏️ 编辑客户' : '➕ 添加新客户'}</h3>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <FormField label="姓名 *">
            <input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="客户全名"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="邮箱">
            <input value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="客户邮箱"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="电话">
            <input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="国际电话"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="公司">
            <input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="公司名称"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="客户来源">
              <select value={form.source || 'manual'} onChange={e => setForm({ ...form, source: e.target.value as CustomerSource })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </FormField>
            <FormField label="当前状态">
              <select value={form.status || 'new'} onChange={e => setForm({ ...form, status: e.target.value as CustomerStatus })}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </FormField>
          </div>
          <FormField label="来源详情">
            <input value={form.sourceDetail || ''} onChange={e => setForm({ ...form, sourceDetail: e.target.value })} placeholder="如：Google Ads关键词、Facebook广告ID"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="预估价值 (USD)">
            <input type="number" value={form.estimatedValue || ''} onChange={e => setForm({ ...form, estimatedValue: Number(e.target.value) })} placeholder="预估成交金额"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="标签 (逗号分隔)">
            <input value={(form.tags || []).join(', ')} onChange={e => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="如: VIP, 美国, 电商"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
          </FormField>
          <FormField label="备注">
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="客户背景、需求、跟进记录..."
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none" />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => { if (!form.name) { toast.error('请填写姓名'); return; } onSave(form); }}
            className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">
            {customer ? '保存修改' : '添加客户'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 渠道来源 ──────────────────────────────────────────────
function ChannelsView({ setLoading }: { setLoading: (v: boolean) => void }) {
  const [channels, setChannels] = useState<ChannelSource[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(() => {
    setLocalLoading(true);
    api.getChannels().then(d => { if (d) setChannels(d); }).finally(() => setLocalLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (data: Partial<ChannelSource>) => {
    try { await api.addChannel(data); toast.success('渠道添加成功'); setShowAdd(false); load(); } catch { toast.error('添加失败'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除该渠道？')) return;
    try { await api.deleteChannel(id); toast.success('已删除'); load(); } catch { toast.error('删除失败'); }
  };

  const handleToggle = async (ch: ChannelSource) => {
    await api.updateChannel(ch.id, { active: !ch.active });
    load();
  };

  const totalAdSpend = channels.reduce((s, c) => s + (c.adSpend || 0), 0);
  const totalLeads = channels.reduce((s, c) => s + (c.leads || 0), 0);
  const avgCPL = totalLeads > 0 ? totalAdSpend / totalLeads : 0;

  return (
    <div className="p-6 space-y-4">
      {/* 汇总统计 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: '💰 总广告花费', value: `$${totalAdSpend.toLocaleString()}`, sub: '当月' },
          { label: '🎯 总线索数', value: totalLeads.toString(), sub: '各渠道汇总' },
          { label: '📊 平均CPL', value: `$${avgCPL.toFixed(2)}`, sub: '单线索成本' },
        ].map(card => (
          <div key={card.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="text-xs text-slate-400 mb-1">{card.label}</div>
            <div className="text-xl font-bold text-white">{card.value}</div>
            <div className="text-[10px] text-slate-600 mt-0.5">{card.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-300">已配置 <span className="text-indigo-400 font-bold">{channels.length}</span> 个获客渠道</div>
        <button onClick={() => setShowAdd(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors">
          ➕ 添加渠道
        </button>
      </div>

      {loading ? <div className="text-center text-slate-400 py-12">加载中...</div> : channels.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📡</div>
          <p className="text-slate-400">暂无渠道数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {channels.map(ch => (
            <div key={ch.id} className={`bg-slate-800 rounded-xl p-4 border ${ch.active ? 'border-slate-600' : 'border-slate-700 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{ch.active ? '🟢' : '⚪'}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{ch.name}</div>
                    <div className="text-xs text-slate-500">{ch.platform ? `平台: ${ch.platform}` : SOURCE_LABELS[ch.type]}</div>
                  </div>
                </div>
                <button onClick={() => handleToggle(ch)} className={`text-xs px-2 py-1 rounded ${ch.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {ch.active ? '启用中' : '已暂停'}
                </button>
              </div>
              {ch.adSpend ? (
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center"><div className="text-xs text-slate-400">花费</div><div className="text-sm font-medium text-white">${ch.adSpend.toLocaleString()}</div></div>
                  <div className="text-center"><div className="text-xs text-slate-400">展示</div><div className="text-sm font-medium text-white">{(ch.impressions || 0) >= 1000 ? ((ch.impressions || 0) / 1000).toFixed(0) + 'K' : ch.impressions || 0}</div></div>
                  <div className="text-center"><div className="text-xs text-slate-400">点击</div><div className="text-sm font-medium text-white">{(ch.clicks || 0) >= 1000 ? ((ch.clicks || 0) / 1000).toFixed(1) + 'K' : ch.clicks || 0}</div></div>
                  <div className="text-center"><div className="text-xs text-slate-400">CPL</div><div className="text-sm font-medium text-emerald-400">${ch.cpl?.toFixed(2) || '—'}</div></div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">该渠道暂无广告数据</div>
              )}
              <div className="flex justify-end mt-3">
                <button onClick={() => handleDelete(ch.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 渠道配置弹窗 */}
      {showAdd && <ChannelFormModal onSave={handleAdd} onClose={() => setShowAdd(false)} />}
    </div>
  );
}

function ChannelFormModal({ onSave, onClose }: { onSave: (d: Partial<ChannelSource>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<ChannelSource>>({ type: 'google_ads', name: '', platform: '', active: true, adSpend: 0, impressions: 0, clicks: 0, leads: 0 });
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">➕ 添加获客渠道</h3>
        <div className="space-y-4">
          <FormField label="渠道名称 *"><input value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <FormField label="渠道类型">
            <select value={form.type || 'google_ads'} onChange={e => setForm({ ...form, type: e.target.value as CustomerSource })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </FormField>
          <FormField label="平台"><input value={form.platform || ''} onChange={e => setForm({ ...form, platform: e.target.value })} placeholder="如: google_ads, linkedin, facebook" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="广告花费 (USD)"><input type="number" value={form.adSpend || ''} onChange={e => setForm({ ...form, adSpend: Number(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></FormField>
            <FormField label="线索数"><input type="number" value={form.leads || ''} onChange={e => setForm({ ...form, leads: Number(e.target.value) })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" /></FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => { if (!form.name) { toast.error('请填写渠道名称'); return; } onSave(form); }} className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">添加</button>
        </div>
      </div>
    </div>
  );
}

// ── 邮件营销 ──────────────────────────────────────────────
function EmailView({ setLoading }: { setLoading: (v: boolean) => void }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [loading, setLocalLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const load = useCallback(async () => {
    setLocalLoading(true);
    const [accts, camps] = await Promise.all([api.getEmailAccounts(), api.getCampaigns()]);
    if (accts) setAccounts(accts); if (camps) setCampaigns(camps); setLocalLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAddAccount = async (data: Partial<EmailAccount>) => {
    try { await api.addEmailAccount(data); toast.success('邮件账号添加成功'); setShowAddAccount(false); load(); } catch { toast.error('添加失败'); }
  };
  const handleDeleteAccount = async (id: string) => {
    if (!confirm('确定删除该邮件账号？')) return;
    try { await api.deleteEmailAccount(id); toast.success('已删除'); load(); } catch { toast.error('删除失败'); }
  };
  const handleSendCampaign = async (id: string) => {
    try {
      const result = await api.sendCampaign(id);
      toast.success(`邮件发送成功！已发送给 ${result?.sent ?? 0} 位客户`);
      load();
    } catch { toast.error('发送失败'); }
  };

  const defaultAccount = accounts.find(a => a.isDefault);

  return (
    <div className="p-6 space-y-6">
      {/* 邮件账号配置 */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">📧 邮件发送账号配置</h3>
          <button onClick={() => setShowAddAccount(true)} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg">➕ 添加账号</button>
        </div>
        {accounts.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">暂无邮件账号 · 请先配置发件邮箱</p>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => (
              <div key={acc.id} className="flex items-center justify-between bg-slate-700/40 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{acc.provider === 'gmail' ? '🔵' : acc.provider === 'sonov' ? '📧' : '📨'}</span>
                  <div>
                    <div className="text-sm font-medium text-white">{acc.name}</div>
                    <div className="text-xs text-slate-400">{acc.email}{acc.isDefault ? ' · 默认发件' : ''}</div>
                  </div>
                </div>
                <button onClick={() => handleDeleteAccount(acc.id)} className="text-xs text-red-400 hover:text-red-300">删除</button>
              </div>
            ))}
          </div>
        )}
        {defaultAccount && (
          <div className="mt-3 text-xs text-slate-500 bg-indigo-900/20 rounded-lg p-2.5 border border-indigo-500/20">
            📤 当前发件账号：<span className="text-indigo-400">{defaultAccount.name}</span> ({defaultAccount.email})
            · 通过 <span className="text-indigo-400">sonov.io</span> SMTP 代发，支持 hmwhtm@gmail.com / hemingwang@simiai.top
          </div>
        )}
      </div>

      {/* 邮件营销活动 */}
      <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white">📬 邮件营销活动</h3>
          <button onClick={() => setShowNewCampaign(true)} disabled={!defaultAccount}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-3 py-1.5 rounded-lg">
            ➕ 新建活动
          </button>
        </div>
        {!defaultAccount && <p className="text-xs text-amber-400 mb-3">⚠️ 请先配置发件邮箱后再创建营销活动</p>}
        {campaigns.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-6">暂无营销活动 · sonov.io邮件系统就绪</p>
        ) : (
          <div className="space-y-3">
            {campaigns.map(camp => (
              <div key={camp.id} className="bg-slate-700/40 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-white">{camp.name}</div>
                    <div className="text-xs text-slate-400">主题：{camp.subject} · 发件：{camp.fromEmail}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${camp.status === 'sent' ? 'bg-green-500/20 text-green-400' : camp.status === 'draft' ? 'bg-slate-600 text-slate-300' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {camp.status === 'sent' ? '✅ 已发送' : camp.status === 'draft' ? '📝 草稿' : camp.status === 'sending' ? '📤 发送中' : camp.status}
                    </span>
                    {(camp.status === 'draft' || camp.status === 'scheduled') && defaultAccount && (
                      <button onClick={() => handleSendCampaign(camp.id)} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg">📤 立即发送</button>
                    )}
                  </div>
                </div>
                {camp.stats.sent > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-2">
                    {[
                      { label: '已发送', value: camp.stats.sent, color: 'text-white' },
                      { label: '已打开', value: camp.stats.opened, color: 'text-blue-400' },
                      { label: '已点击', value: camp.stats.clicked, color: 'text-purple-400' },
                      { label: '退信', value: camp.stats.bounced, color: 'text-red-400' },
                      { label: '退订', value: camp.stats.unsubscribed, color: 'text-slate-400' },
                    ].map(stat => (
                      <div key={stat.label} className="text-center bg-slate-800/50 rounded-lg p-2">
                        <div className={`text-sm font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-[10px] text-slate-500">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* sonov.io集成说明 */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-xl p-5 border border-blue-500/20">
        <h3 className="text-sm font-bold text-white mb-3">🔗 sonov.io 邮件营销生态集成</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {[
            { icon: '📧', title: '企业邮箱', desc: 'hemingwang@simiai.top\nZoho SMTP 专业发件', sub: 'smtp.zoho.com:587' },
            { icon: '🔵', title: '个人邮箱', desc: 'hmwhtm@gmail.com\nGmail SMTP 安全发件', sub: 'smtp.gmail.com:587' },
            { icon: '🤖', title: 'sonov.io AI', desc: 'sonov.io 平台\n智能邮件营销自动化', sub: 'sonov.io/smtp' },
          ].map(item => (
            <div key={item.title} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-lg mb-1">{item.icon}</div>
              <div className="font-medium text-white mb-1">{item.title}</div>
              <div className="text-slate-400 whitespace-pre-line">{item.desc}</div>
              <div className="text-indigo-400 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {showAddAccount && <EmailAccountFormModal onSave={handleAddAccount} onClose={() => setShowAddAccount(false)} />}
      {showNewCampaign && <CampaignFormModal defaultAccount={defaultAccount} onSave={async (d) => {
        try { await api.createCampaign(d); toast.success('活动创建成功'); setShowNewCampaign(false); load(); } catch { toast.error('创建失败'); }
      }} onClose={() => setShowNewCampaign(false)} />}
    </div>
  );
}

function EmailAccountFormModal({ onSave, onClose }: { onSave: (d: Partial<EmailAccount>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', provider: 'smtp' as string, isDefault: true });
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">➕ 添加邮件发送账号</h3>
        <div className="space-y-4">
          <FormField label="账号名称"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：企业邮箱 / 个人Gmail" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <FormField label="邮箱地址"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="发件邮箱地址" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <FormField label="提供商">
            <select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="smtp">SMTP (sonov.io / Zoho / 其他)</option>
              <option value="gmail">Gmail</option>
              <option value="sonov">sonov.io</option>
            </select>
          </FormField>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={e => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
            设为默认发件账号
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => { if (!form.email) { toast.error('请填写邮箱'); return; } onSave(form); }} className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">保存</button>
        </div>
      </div>
    </div>
  );
}

function CampaignFormModal({ defaultAccount, onSave, onClose }: { defaultAccount?: EmailAccount; onSave: (d: Partial<EmailCampaign>) => void; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', subject: '', targetAudience: 'all' as string, template: '' });
  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-slate-600 w-full max-w-md p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white mb-4">📬 新建邮件营销活动</h3>
        <div className="space-y-4">
          <FormField label="活动名称 *"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="如：2025Q2新品推广" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <FormField label="邮件主题 *"><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="邮件标题，将显示在收件箱" className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" /></FormField>
          <FormField label="目标受众">
            <select value={form.targetAudience} onChange={e => setForm({ ...form, targetAudience: e.target.value })} className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none">
              <option value="all">全部客户</option>
              <option value="new">新客户 (状态=新客户)</option>
              <option value="qualified">已筛选客户</option>
              <option value="lost">已流失客户</option>
            </select>
          </FormField>
          {defaultAccount && <div className="text-xs text-indigo-400 bg-indigo-900/20 rounded-lg p-2 border border-indigo-500/20">📤 将通过 {defaultAccount.email} 发送</div>}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-700 rounded-lg">取消</button>
          <button onClick={() => { if (!form.name || !form.subject) { toast.error('请填写名称和主题'); return; } onSave({ ...form, fromEmail: defaultAccount?.email || '', status: 'draft' }); }} className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium">创建草稿</button>
        </div>
      </div>
    </div>
  );
}

// ── 活动日志 ──────────────────────────────────────────────
function ActivityView() {
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivity().then(d => { if (d) setActivities(d); }).finally(() => setLoading(false));
  }, []);

  const typeIcons: Record<string, string> = {
    customer_added: '🟢', status_changed: '🔄', email_sent: '📧', note_added: '📝',
    followup_set: '📅', value_updated: '💰',
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-white">📋 操作日志 · 完整记录</h3>
        <span className="text-xs text-slate-500">{activities.length} 条记录</span>
      </div>
      {loading ? (
        <div className="text-center text-slate-400 py-12">加载中...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-400">暂无活动记录</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {activities.map(log => (
            <div key={log.id} className="flex items-start gap-3 bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 hover:bg-slate-800 transition-colors">
              <span className="text-lg flex-shrink-0 mt-0.5">{typeIcons[log.type] || '📌'}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-slate-200">{log.description}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{new Date(log.createdAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 表单字段辅助组件 ────────────────────────────────────────
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
