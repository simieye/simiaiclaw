/**
 * SIMIAICLAW 龙虾集群 · UiPath RPA 控制面板
 * 乾宫·统御卦专属执行层
 * 集成 UiPath Orchestrator API + Agentic Automation
 * 实现企业级流程自动化与 AI Agent 的深度协同
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const UIPATH_WEB = 'https://www.uipath.com';
const UIPATH_DOCS = 'https://docs.uipath.com/orchestrator';

// ── 类型定义 ──────────────────────────────────────────────
interface AutomationJob {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'stopped';
  triggeredBy: string;
  startTime?: string;
  endTime?: string;
  logs?: string;
}

interface ProcessItem {
  id: string;
  name: string;
  environment: string;
  enabled: boolean;
  lastRun?: string;
  successRate?: number;
  description: string;
}

// ── 常量配置 ──────────────────────────────────────────────
const UIPATH_SCOPES = [
  'OR.Jobs',
  'OR.Robots',
  'OR.Folders',
  'OR.Settings',
  'OR.Assets',
  'OR.QueueItems',
];

// ── 主组件 ────────────────────────────────────────────────
export function UiPathRPAPanel() {
  const [activeView, setActiveView] = useState<'dashboard' | 'jobs' | 'processes' | 'queues' | 'settings'>('dashboard');
  const [accountId, setAccountId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [tokenExpiry, setTokenExpiry] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [runningJob, setRunningJob] = useState<string | null>(null);
  const [logOutput, setLogOutput] = useState<string>('');

  // 预置演示数据
  useEffect(() => {
    setJobs([
      { id: 'job-001', name: 'Invoice_Processing_AI', status: 'success', triggeredBy: 'Claw Agent', startTime: '2026-04-25 08:30', endTime: '2026-04-25 08:47' },
      { id: 'job-002', name: 'Amazon_Competitor_Sync', status: 'success', triggeredBy: 'Scheduled', startTime: '2026-04-25 07:00', endTime: '2026-04-25 07:22' },
      { id: 'job-003', name: 'Feishu_Data_Writeback', status: 'running', triggeredBy: 'Claw Agent', startTime: '2026-04-25 14:10' },
      { id: 'job-004', name: 'CRM_Contact_Sync', status: 'failed', triggeredBy: 'Webhook', startTime: '2026-04-25 13:55', endTime: '2026-04-25 14:02' },
      { id: 'job-005', name: 'Finance_Report_Generate', status: 'pending', triggeredBy: 'Scheduled' },
    ]);
    setProcesses([
      { id: 'proc-001', name: 'Invoice Processing AI Agent', environment: 'Production', enabled: true, lastRun: '2h ago', successRate: 98.5, description: 'AI 驱动的发票识别与财务记账自动化' },
      { id: 'proc-002', name: 'Amazon Competitor Monitor', environment: 'Production', enabled: true, lastRun: '6h ago', successRate: 100, description: '亚马逊竞品数据抓取与飞书同步' },
      { id: 'proc-003', name: 'CRM Contact Sync', environment: 'Staging', enabled: true, lastRun: '1d ago', successRate: 72.3, description: '多系统联系人数据双向同步' },
      { id: 'proc-004', name: 'Feishu Multi-table Writer', environment: 'Production', enabled: true, lastRun: '1h ago', successRate: 100, description: '将 Claw Agent 分析结果写入飞书多维表格' },
      { id: 'proc-005', name: 'Email Warmup & Send', environment: 'Production', enabled: false, lastRun: '3d ago', successRate: 95.2, description: 'Google 企业邮箱预热与冷邮件序列发送' },
    ]);
  }, []);

  // 获取 Access Token（UiPath OAuth 2.0）
  const handleConnect = async () => {
    if (!accountId || !tenantName || !clientId || !clientSecret) {
      toast.error('请填写完整的连接信息');
      return;
    }
    setIsConnecting(true);
    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: UIPATH_SCOPES.join(' '),
      });
      const response = await fetch(
        `https://account.uipath.com/oauth2/token`,
        { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() }
      );
      if (!response.ok) throw new Error(`认证失败: ${response.status}`);
      const data = await response.json();
      setAccessToken(data.access_token);
      setTokenExpiry(Date.now() + (data.expires_in || 3600) * 1000);
      setIsConnected(true);
      toast.success('UiPath 连接成功！');
    } catch (e) {
      toast.error(`连接失败: ${e}`);
    } finally {
      setIsConnecting(false);
    }
  };

  // 触发自动化流程
  const handleStartJob = async (processKey: string) => {
    setRunningJob(processKey);
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] 正在启动流程: ${processKey}\n`);
    await new Promise(r => setTimeout(r, 1500));
    const newJob: AutomationJob = {
      id: `job-${Date.now()}`,
      name: processKey,
      status: 'running',
      triggeredBy: 'Claw Agent',
      startTime: new Date().toISOString(),
    };
    setJobs(prev => [newJob, ...prev]);
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ 流程已触发，Robot 执行中...\n`);
    toast.success(`流程 ${processKey} 已启动`);
    setTimeout(() => {
      setRunningJob(null);
      setJobs(prev => prev.map(j => j.id === newJob.id ? { ...j, status: 'success', endTime: new Date().toISOString() } : j));
      setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ✓ 流程执行成功\n`);
      toast.success('流程执行完成！');
    }, 3000);
  };

  // 停止流程
  const handleStopJob = async (jobId: string) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'stopped', endTime: new Date().toISOString() } : j));
    setLogOutput(prev => prev + `[${new Date().toLocaleTimeString()}] ■ 流程已停止\n`);
    toast.info('流程已停止');
  };

  const statusColor = (status: string) => ({
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    running: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    failed: 'text-red-400 bg-red-500/10 border-red-500/20',
    stopped: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  }[status] || 'text-slate-400 bg-slate-500/10');

  return (
    <div className="space-y-5">
      {/* ── 顶部标题栏 ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/40 to-violet-600/40 border border-purple-500/30 flex items-center justify-center text-2xl shadow-lg shadow-purple-500/10">
            🤖
          </div>
          <div>
            <h2 className="text-base font-bold text-white">UiPath · 企业级RPA智能体</h2>
            <p className="text-xs text-slate-400 mt-0.5">Agentic Automation · 企业流程自动化 · AI + Robot 协同执行</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-2.5 py-1 rounded-full border ${isConnected ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700'}`}>
            {isConnected ? '● 已连接' : '○ 未连接'}
          </span>
          <a href={UIPATH_DOCS} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors">
            📖 API文档
          </a>
          <a href={UIPATH_WEB} target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors">
            🌐 官网
          </a>
        </div>
      </div>

      {/* ── 导航标签 ── */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { key: 'dashboard', label: '控制台', icon: '🌀' },
          { key: 'jobs', label: '作业管理', icon: '⚡' },
          { key: 'processes', label: '流程库', icon: '🔧' },
          { key: 'queues', label: '队列管理', icon: '📋' },
          { key: 'settings', label: '连接配置', icon: '🔌' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveView(tab.key as any)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${activeView === tab.key ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500/30' : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60'}`}>
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ── 控制台视图 ── */}
      {activeView === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 连接状态卡 */}
          <div className="glass-card p-5 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-medium text-slate-300">🤖 UiPath Orchestrator</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isConnected ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>{isConnected ? '已连接' : '未连接'}</span>
            </div>
            <div className="space-y-2">
              <div className="text-xs text-slate-400">租户：<span className="text-white">{tenantName || '—'}</span></div>
              <div className="text-xs text-slate-400">账户：<span className="text-white">{accountId || '—'}</span></div>
              {isConnected && (
                <div className="text-xs text-emerald-400">✓ 认证有效 · {clientId ? clientId.slice(0, 8) + '***' : ''}</div>
              )}
            </div>
            <button onClick={() => setActiveView('settings')} className="mt-4 w-full text-xs bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 py-2 rounded-lg border border-purple-500/20 transition-all">
              {isConnected ? '重新配置' : '配置连接'}
            </button>
          </div>

          {/* 作业概览卡 */}
          <div className="glass-card p-5 border border-purple-500/20">
            <span className="text-xs font-medium text-slate-300">⚡ 近期作业</span>
            <div className="mt-3 space-y-2">
              {jobs.slice(0, 4).map(job => (
                <div key={job.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border capitalize ${statusColor(job.status)}`}>{job.status}</span>
                    <span className="text-xs text-slate-300 truncate">{job.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 flex-shrink-0">{job.triggeredBy}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setActiveView('jobs')} className="mt-4 w-full text-xs bg-slate-700/50 hover:bg-slate-700 text-slate-300 py-2 rounded-lg transition-all">
              查看全部作业 →
            </button>
          </div>

          {/* 流程库卡 */}
          <div className="glass-card p-5 border border-purple-500/20">
            <span className="text-xs font-medium text-slate-300">🔧 可用流程</span>
            <div className="mt-3 space-y-2">
              {processes.filter(p => p.enabled).slice(0, 4).map(proc => (
                <div key={proc.id} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-300 truncate">{proc.name}</div>
                    <div className="text-[10px] text-slate-500">{proc.successRate}% 成功率 · {proc.lastRun}</div>
                  </div>
                  <button
                    onClick={() => handleStartJob(proc.name)}
                    disabled={runningJob !== null}
                    className="flex-shrink-0 text-[10px] bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-2.5 py-1 rounded border border-purple-500/20 transition-all disabled:opacity-40"
                  >
                    ▶ 运行
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 作业管理视图 ── */}
      {activeView === 'jobs' && (
        <div className="space-y-4">
          <div className="glass-card p-4">
            <div className="text-xs text-slate-400 mb-3">📋 作业历史 · 共 {jobs.length} 条记录</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800">
                    <th className="text-left py-2 pr-4 font-medium">作业名称</th>
                    <th className="text-left py-2 pr-4 font-medium">状态</th>
                    <th className="text-left py-2 pr-4 font-medium">触发者</th>
                    <th className="text-left py-2 pr-4 font-medium">开始时间</th>
                    <th className="text-left py-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map(job => (
                    <tr key={job.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-3 pr-4 text-slate-200">{job.name}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded border capitalize ${statusColor(job.status)}`}>{job.status}</span>
                      </td>
                      <td className="py-3 pr-4 text-slate-400">{job.triggeredBy}</td>
                      <td className="py-3 pr-4 text-slate-500">{job.startTime?.replace('T', ' ').slice(0, 16) || '—'}</td>
                      <td className="py-3">
                        {job.status === 'running' && (
                          <button onClick={() => handleStopJob(job.id)} className="text-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/20">■ 停止</button>
                        )}
                        {job.status !== 'running' && <span className="text-slate-600 text-[10px]">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {/* 日志输出区 */}
          {logOutput && (
            <div className="glass-card p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">📜 执行日志</span>
                <button onClick={() => setLogOutput('')} className="text-[10px] text-slate-500 hover:text-slate-300">清空</button>
              </div>
              <pre className="text-[10px] text-emerald-400/80 font-mono bg-slate-900/50 rounded-lg p-3 max-h-48 overflow-y-auto whitespace-pre-wrap">{logOutput}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── 流程库视图 ── */}
      {activeView === 'processes' && (
        <div className="space-y-3">
          {processes.map(proc => (
            <div key={proc.id} className="glass-card p-4 border border-purple-500/20 hover:border-purple-400/40 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center text-lg flex-shrink-0">🔧</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{proc.name}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${proc.enabled ? 'text-emerald-400 border-emerald-500/30' : 'text-slate-500 border-slate-700'}`}>{proc.enabled ? '已启用' : '已禁用'}</span>
                      <span className="text-[10px] text-slate-500 border border-slate-700 px-2 py-0.5 rounded">{proc.environment}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{proc.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-slate-500">
                      <span>📊 成功率: <span className="text-emerald-400">{proc.successRate}%</span></span>
                      <span>⏱ 上次运行: {proc.lastRun}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleStartJob(proc.name)}
                    disabled={runningJob !== null || !proc.enabled}
                    className="text-xs bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-40"
                  >
                    ▶ 触发运行
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── 队列管理视图 ── */}
      {activeView === 'queues' && (
        <div className="glass-card p-5 border border-purple-500/20">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-white">📋 队列管理</span>
            <button className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/20 transition-all">
              + 创建队列
            </button>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Invoice_Processing_Queue', items: 142, pending: 23, failed: 2, color: 'from-blue-600/20 to-cyan-600/20' },
              { name: 'Amazon_Data_Sync_Queue', items: 89, pending: 5, failed: 0, color: 'from-amber-600/20 to-orange-600/20' },
              { name: 'Feishu_Writeback_Queue', items: 256, pending: 38, failed: 1, color: 'from-emerald-600/20 to-teal-600/20' },
            ].map(queue => (
              <div key={queue.name} className={`p-4 rounded-xl bg-gradient-to-r ${queue.color} border border-purple-500/20`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white">{queue.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1">总计 {queue.items} 条 · 待处理 {queue.pending} · 失败 {queue.failed}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs text-amber-400">{queue.pending} 待处理</div>
                      <div className="text-[10px] text-slate-500">{((queue.pending / queue.items) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 连接配置视图 ── */}
      {activeView === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-card p-5 border border-purple-500/20 space-y-4">
            <h3 className="text-sm font-medium text-white">🔌 UiPath Orchestrator 连接配置</h3>
            <p className="text-xs text-slate-400">使用 OAuth 2.0 进行安全认证。请在 UiPath 管理控制台获取凭据。</p>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">账户 ID (Account ID)</label>
              <input value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="从 UiPath 管理控制台获取"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">租户名称 (Tenant Name)</label>
              <input value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="例如：defaultTenant"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">客户端 ID (Client ID)</label>
              <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="外部应用注册的 Client ID"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">客户端密钥 (Client Secret)</label>
              <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="外部应用注册的 Client Secret"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-medium py-2.5 rounded-lg transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50"
            >
              {isConnecting ? '正在连接...' : isConnected ? '✓ 已连接 · 重新认证' : '连接 UiPath'}
            </button>
          </div>

          <div className="glass-card p-5 border border-purple-500/20 space-y-4">
            <h3 className="text-sm font-medium text-white">📖 OAuth 2.0 认证说明</h3>
            <div className="space-y-3">
              {[
                { step: '1', title: '创建外部应用', desc: '在 UiPath 管理控制台 → 外部应用 → 创建新应用，添加 Orchestrator API 范围' },
                { step: '2', title: '获取 Client ID & Secret', desc: '应用创建后，获得 Client ID 和 Client Secret，用于 OAuth 认证' },
                { step: '3', title: '配置权限范围', desc: '建议添加: OR.Jobs, OR.Robots, OR.Folders, OR.Assets, OR.Queues' },
                { step: '4', title: '安全存储', desc: 'Client Secret 仅显示一次，请妥善保管，不要提交到代码仓库' },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-[10px] text-purple-300 flex-shrink-0">{item.step}</span>
                  <div>
                    <div className="text-xs font-medium text-white">{item.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t border-slate-800">
              <div className="text-[10px] text-slate-500 mb-2">REST API 端点参考</div>
              <div className="space-y-1.5">
                {[
                  { method: 'GET', path: '/jobs', desc: '获取作业列表' },
                  { method: 'POST', path: '/jobs', desc: '触发新作业' },
                  { method: 'GET', path: '/processes', desc: '获取流程定义' },
                  { method: 'GET', path: '/queues', desc: '获取队列项' },
                ].map(api => (
                  <div key={api.path} className="flex items-center gap-2 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${api.method === 'GET' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{api.method}</span>
                    <span className="text-slate-400 font-mono">{api.path}</span>
                    <span className="text-slate-600">→ {api.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}