/**
 * SIMIAICLAW 龙虾集群控制台
 * 主应用入口（含多租户登录系统）
 */
import React, { useEffect, useState, Component, ReactNode } from 'react';
import { api, type AuthUser, type TenantInfo } from './api/client';

// ── 错误边界 ──────────────────────────────────────────────────────
interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null }

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center max-w-md p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-red-400 mb-2">应用出错</h2>
            <p className="text-slate-400 text-sm mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg text-sm"
            >
              🔄 重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

import { PalaceStatus } from './components/PalaceStatus';
import { TaskQueue } from './components/TaskQueue';
import { CommandBar } from './components/CommandBar';
import { HexagramGrid } from './components/HexagramGrid';
import { LLMStatsPanel } from './components/LLMStatsPanel';
import { Toaster, toast } from 'sonner';
import { AgentSkillPanel } from './components/AgentSkillPanel';
import { MCPSettings } from './components/MCPSettings';
import { SkillHubSettings } from './components/SkillHubSettings';
import { ModelMarketplace } from './components/ModelMarketplace';
import { WorkflowEditor } from './components/WorkflowEditor';
import { NLAgentDialog } from './components/NLAgentDialog';
import { OpenSpacePanel } from './components/OpenSpacePanel';
import { SubscriptionPanel } from './components/SubscriptionPanel';
import { GlobalLoginPanel } from './components/GlobalLoginPanel';
import { OPCWorkbench } from './components/OPCWorkbench';
import { NewsLanding } from './components/NewsLanding';
import { KnowledgeBase } from './components/KnowledgeBase';
import { AgentKnowledgeGraph } from './components/AgentKnowledgeGraph';

type AppTab = 'dashboard' | 'agents' | 'opc' | 'knowledge' | 'graph' | 'logs' | 'settings';

// ── 类型声明 ──────────────────────────────────────────────────
interface SystemStatus {
  timestamp: string;
  agents: { total: number; byPalace: Array<{ palace: string; count: number }> };
  tasks: { total: number; pending: number; running: number; completed: number; failed: number };
  heartbeat: {
    nodeCount: number;
    healthByPalace: Record<string, { up: number; down: number; total: number }>;
  };
  openspace: { total: number; byType: Record<string, number>; byLane: Record<string, number> };
  clawtip: { total: number; completed: number; pending: number; revenue: number };
  llm?: { simulateMode: boolean; totalRequests: number; costUSD: number };
  payments?: { total: number; completed: number; pending: number; revenue: number };
  tenant?: TenantInfo | null;
  user?: { id: string; displayName: string; email: string } | null;
}

interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  activeAgents: number;
  failedAgents: number;
  nodes: Array<{ palace: string; agentId: string; status: string; responseTime: number }>;
}

// ── 主 App 组件 ───────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [activeTenant, setActiveTenant] = useState<TenantInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');

  // ── 初始化：检查登录状态 ──────────────────────────────────
  useEffect(() => {
    try {
      const stored = api.getStoredAuth();
      if (stored) {
        setAuthUser(stored.user);
        setActiveTenant(stored.activeTenant);
      }
    } catch (e) {
      console.error('[Auth] init error:', e);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // ── 登录成功后刷新状态 ────────────────────────────────────
  const handleAuthSuccess = (user: AuthUser, tenant: TenantInfo) => {
    setAuthUser(user);
    setActiveTenant(tenant);
  };

  const handleLogout = () => {
    api.logout();
    setAuthUser(null);
    setActiveTenant(null);
    toast.success('已退出登录');
  };

  const handleSwitchTenant = async (tenantId: string) => {
    try {
      const { tenant } = await api.switchTenant(tenantId);
      setActiveTenant(tenant);
      toast.success(`已切换至 ${tenant.name}`);
    } catch (e) {
      toast.error(String(e));
    }
  };

  if (authLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-pulse">🦞</div>
            <p className="text-slate-400">加载中...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // ── 未登录：显示登录/注册页面 ────────────────────────────
  if (!authUser) {
    return (
      <ErrorBoundary>
        <AuthPage onSuccess={handleAuthSuccess} />
        <Toaster position="bottom-right" theme="dark" richColors />
      </ErrorBoundary>
    );
  }

  // ── 已登录：显示主控制台 ─────────────────────────────────
  return (
    <ErrorBoundary>
      <MainConsole
        authUser={authUser}
        activeTenant={activeTenant}
        onLogout={handleLogout}
        onSwitchTenant={handleSwitchTenant}
        onTenantUpdated={setActiveTenant}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </ErrorBoundary>
  );
}

// ── 认证页面（登录/注册） ────────────────────────────────────
function AuthPage({ onSuccess }: { onSuccess: (user: AuthUser, tenant: TenantInfo) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);

  // 表单状态
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { user, tenant } = await api.login({ email, password });
        onSuccess(user, tenant);
      } else {
        const { user, tenant } = await api.register({ email, password, displayName, tenantName });
        onSuccess(user, tenant);
      }
    } catch (e: unknown) {
      setError(String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🦞</div>
          <h1 className="text-2xl font-bold taiji-gradient">SIMIAICLAW</h1>
          <p className="text-slate-500 text-sm mt-1">龙虾集群太极64卦 · 多租户智能体系统</p>
        </div>

        {/* Tab 切换 */}
        <div className="flex mb-8 bg-slate-800 rounded-xl p-1">
          {(['login', 'register'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === m ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {m === 'login' ? '🔐 登录' : '✨ 注册'}
            </button>
          ))}
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">邮箱地址</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">你的名字</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="张三"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">团队/企业名称 <span className="text-slate-600">(选填，创建新租户)</span></label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={e => setTenantName(e.target.value)}
                  placeholder="我的团队"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/30"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> {mode === 'login' ? '登录中...' : '创建账号...'}
              </span>
            ) : (
              mode === 'login' ? '🔐 进入控制台' : '✨ 创建账号 + 团队'
            )}
          </button>
        </form>

        {/* 演示提示 */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
          <p className="text-xs text-slate-500 text-center">
            💡 首次注册自动创建团队（Pro 试用），或联系管理员获取邀请链接加入已有团队
          </p>
        </div>
      </div>
    </div>
  );
}

// ── 多端下载 App 弹窗 ─────────────────────────────────────────
function AppDownloadModal({ onClose }: { onClose: () => void }) {
  const platforms = [
    {
      name: 'iOS',
      icon: '🍎',
      desc: 'iPhone / iPad',
      version: 'v2.4.1',
      size: '128 MB',
      color: 'from-slate-700 to-slate-800',
      badge: 'App Store',
      downloadUrl: 'https://apps.apple.com/app/simiaiclaw',
    },
    {
      name: 'Android',
      icon: '🤖',
      desc: 'Android 手机/平板',
      version: 'v2.4.1',
      size: '96 MB',
      color: 'from-green-700 to-green-800',
      badge: 'Google Play',
      downloadUrl: 'https://play.google.com/store/apps/details?id=ai.simai.claw',
    },
    {
      name: 'Windows',
      icon: '🪟',
      desc: 'Windows 10/11',
      version: 'v2.4.1',
      size: '210 MB',
      color: 'from-blue-700 to-blue-800',
      badge: 'exe 安装包',
      downloadUrl: 'https://download.simai.claw/client/simiaiclaw-win.exe',
    },
    {
      name: 'macOS',
      icon: '🍎',
      desc: 'macOS 12+ (Intel & Apple Silicon)',
      version: 'v2.4.1',
      size: '185 MB',
      color: 'from-gray-700 to-gray-800',
      badge: 'dmg 镜像',
      downloadUrl: 'https://download.simai.claw/client/simiaiclaw-mac.dmg',
    },
    {
      name: 'Linux',
      icon: '🐧',
      desc: 'Ubuntu / Debian / Fedora',
      version: 'v2.4.1',
      size: '142 MB',
      color: 'from-orange-700 to-orange-800',
      badge: 'AppImage / deb',
      downloadUrl: 'https://download.simai.claw/client/simiaiclaw-linux.tar.gz',
    },
    {
      name: 'Web',
      icon: '🌐',
      desc: '浏览器随时访问',
      version: '始终最新',
      size: '无需安装',
      color: 'from-cyan-700 to-cyan-800',
      badge: 'web.simai.claw',
      downloadUrl: 'https://web.simai.claw',
    },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">📥 下载 SIMIAICLAW 客户端</h2>
            <p className="text-xs text-emerald-200 mt-0.5">支持 iOS / Android / Windows / macOS / Linux / Web，随时随地掌控龙虾集群</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
            ✕
          </button>
        </div>

        {/* Platform grid */}
        <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto">
          {platforms.map(p => (
            <a
              key={p.name}
              href={p.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-gradient-to-br ${p.color} hover:scale-[1.02] transition-transform rounded-xl p-4 flex flex-col items-center text-center gap-2 border border-white/10 cursor-pointer`}
            >
              <div className="text-4xl">{p.icon}</div>
              <div>
                <div className="text-white font-semibold text-sm">{p.name}</div>
                <div className="text-white/60 text-xs mt-0.5">{p.desc}</div>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{p.badge}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                <span>{p.version}</span>
                {p.size !== '无需安装' && <span>· {p.size}</span>}
              </div>
            </a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between text-xs text-slate-500">
          <span>如遇下载问题，请联系 support@simai.claw</span>
          <div className="flex items-center gap-2">
            <span>当前版本: v2.4.1</span>
            <span>·</span>
            <button className="hover:text-emerald-400 transition-colors">检查更新 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主控制台 ─────────────────────────────────────────────────
function MainConsole({
  authUser, activeTenant, onLogout, onSwitchTenant, onTenantUpdated,
  activeTab, onTabChange,
}: {
  authUser: AuthUser; activeTenant: TenantInfo | null;
  onLogout: () => void; onSwitchTenant: (id: string) => void;
  onTenantUpdated: (t: TenantInfo) => void;
  activeTab: AppTab; onTabChange: (t: AppTab) => void;
}) {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantMenuOpen, setTenantMenuOpen] = useState(false);
  const [skillPanelOpen, setSkillPanelOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>('account');

  // 监听来自 HeyGen 按钮的导航事件
  useEffect(() => {
    const handler = () => {
      onTabChange('settings');
      setSettingsTab('openspace');
    };
    window.addEventListener('openspace-tab', handler);
    return () => window.removeEventListener('openspace-tab', handler);
  }, [onTabChange]);

  useEffect(() => {
    const fetchStatus = async () => {
      setIsLoading(true);
      const [s, h] = await Promise.all([api.getStatus(), api.getHealth()]);
      if (s) setStatus(s);
      if (h) setHealth(h);
      setIsLoading(false);
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  // 刷新用户信息（租户配额等）
  useEffect(() => {
    api.fetchMe().then(data => {
      onTenantUpdated(data.activeTenant || activeTenant!);
    }).catch(() => {});
  }, []);

  const tabs = [
    { id: 'dashboard', label: '控制台', icon: '🌀' },
    { id: 'agents', label: '智能体', icon: '🤖' },
    { id: 'opc', label: 'OPC工作台', icon: '🦞' },
    { id: 'knowledge', label: '知识库', icon: '📚' },
    { id: 'graph', label: '知识图谱', icon: '🕸️' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          {/* 左：Logo */}
          <div className="flex items-center gap-3">
            <div className="text-2xl">🦞</div>
            <div>
              <h1 className="text-base font-bold taiji-gradient">SIMIAICLAW</h1>
              <p className="text-xs text-slate-500">龙虾集群 · 太极64卦</p>
            </div>
            {activeTenant && (
              <div className="ml-3 flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1">
                <span className="text-xs text-slate-400">🏢</span>
                <span className="text-xs font-medium">{activeTenant.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  activeTenant.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                  activeTenant.plan === 'pro' ? 'bg-cyan-500/20 text-cyan-400' :
                  'bg-slate-600/50 text-slate-400'
                }`}>
                  {activeTenant.plan.toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* 中：标签页 */}
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* 右：用户菜单 */}
          <div className="flex items-center gap-3">
            {/* 📥 多端下载 App */}
            <button
              onClick={() => setDownloadModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600/80 to-teal-600/80 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-emerald-500/20"
            >
              <span>📥</span>
              <span>多端下载</span>
              <span className="bg-white/20 text-[10px] px-1 rounded">App</span>
            </button>

            {/* 🤖 智能体 & 技能商店入口 */}
            <button
              onClick={() => setSkillPanelOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-600 hover:to-violet-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
            >
              <span>🤖</span>
              <span>智能体 & 技能</span>
            </button>

            {/* 多租户切换 */}
            {authUser.tenants.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setTenantMenuOpen(v => !v)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg"
                >
                  🔄 切换团队 <span className="text-slate-600">({authUser.tenants.length})</span>
                </button>
                {tenantMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                    {authUser.tenants.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { onSwitchTenant(t.id); setTenantMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-700 flex items-center justify-between ${
                          t.id === activeTenant?.id ? 'text-cyan-400' : 'text-slate-300'
                        }`}
                      >
                        <span>{t.name}</span>
                        <span className="text-xs text-slate-500">{t.role}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 用户信息 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                {authUser.displayName[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-medium">{authUser.displayName}</div>
                <div className="text-[10px] text-slate-500">{activeTenant?.role}</div>
              </div>
            </div>

            <button onClick={onLogout} className="text-xs text-slate-500 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-800 transition-colors">
              退出
            </button>
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6">
        {isLoading && !status && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">🦞</div>
              <p className="text-slate-400">集群启动中...</p>
            </div>
          </div>
        )}

        {status && activeTab === 'dashboard' && <DashboardView status={status} health={health} />}
        {status && activeTab === 'agents' && <AgentsView status={status} health={health} onTabChange={onTabChange} />}
        {activeTab === 'opc' && <OPCWorkbench />}
        {activeTab === 'knowledge' && <KnowledgeBase />}
        {activeTab === 'graph' && <AgentKnowledgeGraph />}
        {activeTab === 'settings' && (
          <SettingsView
            authUser={authUser}
            activeTenant={activeTenant}
            settingsTab={settingsTab}
            onSettingsTabChange={setSettingsTab}
            status={status}
          />
        )}
      </main>

      {/* 智能体 & 技能商店面板 */}
      {skillPanelOpen && <AgentSkillPanel onClose={() => setSkillPanelOpen(false)} />}

      {/* 多端下载 App 弹窗 */}
      {downloadModalOpen && (
        <AppDownloadModal onClose={() => setDownloadModalOpen(false)} />
      )}

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

// ── 设置视图 ─────────────────────────────────────────────────
function SettingsView({ authUser, activeTenant, settingsTab: externalTab, onSettingsTabChange, status }: {
  authUser: AuthUser; activeTenant: TenantInfo | null;
  settingsTab?: string; onSettingsTabChange?: (tab: string) => void;
  status: SystemStatus | null;
}) {
  const [displayName, setDisplayName] = useState(authUser.displayName);
  const [saving, setSaving] = useState(false);
  const [settingsTab, setSettingsTab] = useState<string>(externalTab || 'account');

  // 同步外部传入的 tab（来自 HeyGen 按钮）
  useEffect(() => {
    if (externalTab) setSettingsTab(externalTab);
  }, [externalTab]);

  const handleSetSettingsTab = (tab: string) => {
    setSettingsTab(tab);
    onSettingsTabChange?.(tab);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ displayName });
      toast.success('资料已更新');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const SETTING_TABS: Array<{ id: string; label: string; icon: string; href?: string; external?: boolean }> = [
    { id: 'account', label: '账户', icon: '👤' },
    { id: 'integrations', label: 'MCP 连接器', icon: '🔌' },
    { id: 'skillhub', label: 'SkillHub', icon: '⚡' },
    { id: 'openspace', label: 'OpenSpace', icon: '🧬' },
    { id: 'models', label: '大模型市场', icon: '🌐' },
    { id: 'subscription', label: '订阅服务', icon: '💎' },
    { id: 'payments', label: '支付管理', icon: '💰' },
    { id: 'globallogin', label: '全球登录', icon: '🌍' },
    { id: 'newslanding', label: '龙虾资讯', icon: '📰' },
    { id: 'university', label: '跨境龙虾社大学', icon: '🎓', href: 'https://clawhub.ai/lobster', external: true },
  ];

  return (
    <div className="space-y-6">
      {/* 标签导航 */}
      <div className="flex items-center gap-1 flex-wrap">
        {SETTING_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.href ? undefined : handleSetSettingsTab(tab.id)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
              settingsTab === tab.id
                ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            {tab.icon} {tab.label}
            {tab.external && <span className="text-slate-500">↗</span>}
          </button>
        ))}
      </div>

      {/* 外部链接提示 */}
      {settingsTab === 'university' && (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="text-5xl">🎓</div>
          <div>
            <h3 className="text-lg font-semibold text-white">跨境龙虾社大学</h3>
            <p className="text-sm text-slate-400 mt-1">系统化的 AI 学习平台，从入门到精通 · 跨境电商 · AI 应用实战</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
            <span>📚 AI 实战课程</span>
            <span>·</span>
            <span>🤖 Agent 开发</span>
            <span>·</span>
            <span>🔧 工作流编排</span>
            <span>·</span>
            <span>💰 商业变现</span>
          </div>
          <a
            href="https://clawhub.ai/lobster"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
          >
            🚀 前往龙虾社大学 ↗
          </a>
        </div>
      )}

      {/* 账户设置 */}
      {settingsTab === 'account' && (
        <div className="space-y-6 max-w-2xl">
          <div className="glass-card p-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-300">👤 个人资料</h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">显示名称</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">邮箱</label>
              <input type="email" value={authUser.email} readOnly className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-500" />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? '保存中...' : '💾 保存更改'}
            </button>
          </div>

          {activeTenant && (
            <div className="glass-card p-6 space-y-3">
              <h3 className="text-sm font-medium text-slate-300">🏢 团队信息</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {[
                  { label: '团队名称', value: activeTenant.name },
                  { label: '套餐计划', value: activeTenant.plan.toUpperCase(), color: activeTenant.plan === 'enterprise' ? 'text-purple-400' : activeTenant.plan === 'pro' ? 'text-cyan-400' : 'text-slate-400' },
                  { label: '你的角色', value: activeTenant.role },
                  { label: '团队成员', value: `${activeTenant.memberCount} 人` },
                ].map(item => (
                  <div key={item.label}>
                    <div className="text-xs text-slate-500">{item.label}</div>
                    <div className={`text-slate-200 ${(item as any).color || ''}`}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MCP 连接器 */}
      {settingsTab === 'integrations' && (
        <MCPSettings />
      )}

      {settingsTab === 'skillhub' && (
        <SkillHubSettings />
      )}

      {/* OpenSpace 自进化智能体社区 */}
      {settingsTab === 'openspace' && (
        <OpenSpacePanel />
      )}

      {/* 大模型市场 */}
      {settingsTab === 'models' && (
        <ModelMarketplace />
      )}

      {/* 订阅服务 */}
      {settingsTab === 'subscription' && (
        <SubscriptionPanel />
      )}

      {/* 支付管理 */}
      {settingsTab === 'payments' && (
        <PaymentsView status={status} />
      )}

      {settingsTab === 'globallogin' && (
        <GlobalLoginPanel />
      )}

      {settingsTab === 'opcworkbench' && (
        <OPCWorkbench />
      )}

      {settingsTab === 'newslanding' && (
        <NewsLanding />
      )}
    </div>
  );
}

// ── 仪表盘视图 ───────────────────────────────────────────────
function DashboardView({ status, health }: { status: SystemStatus; health: HealthReport | null }) {
  const [showHexGrid, setShowHexGrid] = useState(false);

  if (showHexGrid) {
    return (
      <div className="bg-slate-950 min-h-screen">
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-2 flex items-center gap-3">
          <button
            onClick={() => setShowHexGrid(false)}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            ← 返回仪表盘
          </button>
          <div className="h-4 w-px bg-slate-700" />
          <div className="text-xs text-slate-500">🌀 64卦详细分工表</div>
          <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
            <span>8宫</span><span>×</span><span>8卦</span><span>=</span>
            <span className="text-cyan-400 font-bold">64卦</span>
          </div>
        </div>
        <HexagramGrid />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '智能体总数', value: status.agents.total, color: 'text-cyan-400', icon: '🤖' },
          { label: '心跳节点', value: status.heartbeat.nodeCount, color: 'text-emerald-400', icon: '💓' },
          { label: '知识条目', value: status.openspace.total, color: 'text-purple-400', icon: '🧠' },
          { label: '累计流水', value: `¥${(status.clawtip.revenue || 0).toLocaleString()}`, color: 'text-amber-400', icon: '💰' },
        ].map(item => (
          <div key={item.label} className="glass-card p-4 text-center">
            <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.icon} {item.label}</div>
          </div>
        ))}
      </div>

      {/* 龙虾 OpenClaw 官方操作面板快捷入口 */}
      <div className="glass-card p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl">
              🦞
            </div>
            <div>
              <div className="text-sm font-semibold text-white">龙虾 OpenClaw 官方操作面板</div>
              <div className="text-xs text-slate-500 mt-0.5">本地 AI Agent 操作界面 · http://127.0.0.1:18789</div>
              <div className="text-[10px] text-cyan-500/60 mt-0.5">session=main · 可多开独立会话</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-emerald-400">● 在线</div>
              <div className="text-[10px] text-slate-500">Claude Agent Ready</div>
            </div>
            <a
              href="http://127.0.0.1:18789/chat?session=main"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
            >
              <span>🦞</span>
              <span>打开操作面板</span>
              <span className="text-xs opacity-70">↗</span>
            </a>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-slate-400">🌀 八宫状态</h2>
          <button
            onClick={() => setShowHexGrid(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-700/60 to-blue-700/60 hover:from-cyan-700 hover:to-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-all border border-cyan-500/30 shadow shadow-cyan-500/10"
          >
            <span>🌀</span>
            <span>展开64卦详情</span>
            <span className="bg-white/20 text-[10px] px-1 rounded">64</span>
          </button>
        </div>
        <PalaceStatus healthByPalace={status.heartbeat.healthByPalace} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TaskQueue tasks={status.tasks} />
        <KnowledgePanel stats={status.openspace} />
        <PaymentPanel stats={status.clawtip} />
      </div>

      {status.llm && <LLMStatsPanel stats={status.llm} />}
      <CommandBar />
    </div>
  );
}

function KnowledgePanel({ stats }: { stats: SystemStatus['openspace'] }) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">🧠 OpenSpace 知识库</h3>
      <div className="text-2xl font-bold text-purple-400 mb-1">{stats.total} 条</div>
      <div className="text-xs text-slate-500 mb-3">知识条目</div>
      <div className="space-y-1">
        {Object.entries(stats.byType || {}).map(([type, count]) => (
          <div key={type} className="flex justify-between text-xs">
            <span className="text-slate-400">{type}</span>
            <span className="text-purple-300">{count}</span>
          </div>
        ))}
        {Object.entries(stats.byLane || {}).map(([lane, count]) => (
          <div key={lane} className="flex justify-between text-xs">
            <span className="text-slate-500">{lane}</span>
            <span className="text-slate-400">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentPanel({ stats }: { stats: SystemStatus['clawtip'] }) {
  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">💰 ClawTip 支付闭环</h3>
      <div className="text-2xl font-bold text-emerald-400 mb-1">¥{(stats.revenue || 0).toLocaleString()}</div>
      <div className="text-xs text-slate-500 mb-3">累计流水</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: '总计', value: stats.total, color: 'text-white' },
          { label: '完成', value: stats.completed, color: 'text-emerald-400' },
          { label: '待批', value: stats.pending, color: 'text-amber-400' },
        ].map(item => (
          <div key={item.label}>
            <div className={`text-lg font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 支付视图 ─────────────────────────────────────────────────
function PaymentsView({ status }: { status: SystemStatus | null }) {
  const { payments } = status || {};

  const paymentMethods = [
    {
      id: 'wechat',
      icon: '💚',
      name: '微信支付',
      nameEn: 'WeChat Pay',
      desc: '扫码付款 · 企业微信 · 自动对账',
      color: '#07C160',
      bgClass: 'from-green-950/40 to-emerald-950/40',
      borderClass: 'border-green-800/40',
      tag: '即时到账',
    },
    {
      id: 'alipay',
      icon: '🔵',
      name: '支付宝支付',
      nameEn: 'Alipay',
      desc: '扫码 / APP · 担保交易 · 退款秒到',
      color: '#1677FF',
      bgClass: 'from-blue-950/40 to-sky-950/40',
      borderClass: 'border-blue-800/40',
      tag: 'T+0 到账',
    },
    {
      id: 'personal',
      icon: '🏦',
      name: '对私银行转账',
      nameEn: 'Personal Transfer',
      desc: '个人账户直接打款 · 支持所有主流银行',
      color: '#F59E0B',
      bgClass: 'from-amber-950/40 to-yellow-950/40',
      borderClass: 'border-amber-800/40',
      tag: '1-3工作日',
    },
    {
      id: 'corporate',
      icon: '🏢',
      name: '对公支付账户',
      nameEn: 'Corporate Account',
      desc: '企业公账打款 · 开具增值税发票 · 合规无忧',
      color: '#8B5CF6',
      bgClass: 'from-violet-950/40 to-purple-950/40',
      borderClass: 'border-violet-800/40',
      tag: '1-5工作日',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 顶部横幅 */}
      <div className="glass-card p-5 border border-slate-600/30">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">💰</span>
          <div>
            <h2 className="text-sm font-semibold text-white">支付中心</h2>
            <p className="text-xs text-slate-400">SIMIAICLAW 龙虾集群 · 多通道安全支付</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-emerald-400">支付系统正常</span>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '总笔数', value: payments?.total ?? '—', color: 'text-white' },
            { label: '已完成', value: payments?.completed ?? '—', color: 'text-emerald-400' },
            { label: '待审批', value: payments?.pending ?? '—', color: 'text-amber-400' },
            { label: '累计金额', value: payments ? `¥${(payments.revenue || 0).toLocaleString()}` : '—', color: 'text-cyan-400' },
          ].map(item => (
            <div key={item.label} className="glass-card p-3 text-center">
              <div className={`text-xl font-bold ${item.color}`}>{item.value}</div>
              <div className="text-xs text-slate-500 mt-1">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 四种支付方式 */}
      <div>
        <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
          <span>💳</span> 支付方式
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map(pm => (
            <div
              key={pm.id}
              className={`glass-card p-5 border bg-gradient-to-br ${pm.bgClass} ${pm.borderClass} hover:scale-[1.01] transition-transform cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border border-slate-700/50"
                  style={{ background: `${pm.color}20` }}
                >
                  {pm.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base font-semibold text-white">{pm.name}</span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full border"
                      style={{ color: pm.color, borderColor: `${pm.color}50`, background: `${pm.color}15` }}
                    >
                      {pm.tag}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mb-2">{pm.nameEn}</div>
                  <div className="text-sm text-slate-400">{pm.desc}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      className="text-xs px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
                      style={{ color: pm.color, borderColor: `${pm.color}50`, background: `${pm.color}10` }}
                    >
                      {pm.id === 'wechat' ? '💚 微信收款码' : pm.id === 'alipay' ? '🔵 支付宝收款码' : pm.id === 'personal' ? '🏦 私户信息' : '🏢 对公账户'}
                    </button>
                    <button className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
                      查看教程
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 收款账户信息 */}
      <div className="glass-card p-5 border border-slate-600/30">
        <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
          <span>📋</span> 收款账户
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            { label: '💚 微信支付', value: '无需配置，扫码即付', icon: '✅' },
            { label: '🔵 支付宝', value: '无需配置，扫码即付', icon: '✅' },
            { label: '🏦 对私银行转账', value: '账户名：龙口市墨龙数字科技有限公司', icon: '📝' },
            { label: '🏢 对公账户', value: '开户行：中国工商银行龙口支行 账号：1606 **** **** 8899', icon: '📝' },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg border border-slate-700/30">
              <span className="text-emerald-400 flex-shrink-0 mt-0.5">{item.icon}</span>
              <div>
                <div className="text-slate-300 font-medium">{item.label}</div>
                <div className="text-slate-500 mt-0.5 leading-relaxed">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 待审批 */}
      <div className="glass-card p-6 border border-slate-600/30">
        <h3 className="text-sm text-slate-400 mb-4 flex items-center gap-2">
          <span>🕐</span> 待审批支付
        </h3>
        {(!payments || payments.pending === 0) ? (
          <div className="text-center py-6">
            <div className="text-3xl mb-2 opacity-50">✅</div>
            <p className="text-slate-500 text-sm">暂无待审批记录</p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">{payments.pending} 笔待审批</p>
        )}
      </div>
    </div>
  );
}

// ── 智能体视图 ───────────────────────────────────────────────
function AgentsView({ status, health, onTabChange }: { status: SystemStatus; health: HealthReport | null; onTabChange: (tab: AppTab) => void }) {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showNLDialog, setShowNLDialog] = useState(false);
  const palaceNames: Record<string, string> = {
    '乾宫': '⚔️', '坤宫': '📝', '震宫': '🎨', '巽宫': '⚙️',
    '坎宫': '🚀', '离宫': '📊', '艮宫': '🏔️', '兑宫': '🦞',
  };

  // 工作流编辑器全屏模式
  if (showWorkflow) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setShowWorkflow(false)}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >← 返回智能体</button>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-xs text-slate-500">🌀 工作流编排 · 基于64卦智能体系统</span>
        </div>
        <div className="h-full">
          <WorkflowEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🌍 GEO 系统入口 */}
      <a
        href="https://app.dageno.ai/hmwhtm/simiai_top/geo/overview"
        target="_blank"
        rel="noopener noreferrer"
        className="block glass-card p-5 border border-emerald-500/30 hover:border-emerald-400/50 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🌍
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>GEO 地理智能体系统</span>
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">入口</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">地理信息处理 · 空间智能分析 · dageno.ai 平台</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-xs text-emerald-400 font-medium">🌐 app.dageno.ai</div>
              <div className="text-[10px] text-slate-500">点击直达 GEO Overview</div>
            </div>
            <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
              <span>🗺️</span>
              <span>打开 GEO 系统</span>
              <span className="text-[10px] opacity-70">↗</span>
            </span>
          </div>
        </div>
      </a>

      {/* HeyGen Agent 自然语言生成视频入口 */}
      <div className="glass-card p-5 border border-pink-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/30 to-rose-600/30 border border-pink-500/30 flex items-center justify-center text-2xl">
              🎬
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>HeyGen Agent</span>
                <span className="bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">自然语言描述，一键生成 AI 视频 · 175+ 语言 · $0.033/秒</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-xs text-pink-400 font-medium">✨ 数字人 · 自动脚本 · 配音</div>
              <div className="text-[10px] text-slate-500">上传至 YouTube / TikTok / 抖音</div>
            </div>
            <button
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const event = new CustomEvent('openspace-tab');
                  window.dispatchEvent(event);
                }, 150);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 border border-pink-500/30"
            >
              <span>🎬</span>
              <span>生成 AI 视频</span>
              <span className="text-[10px] opacity-70">↗</span>
            </button>
          </div>
        </div>

        {/* 快捷提示 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            '产品介绍视频', '品牌故事', '培训教程', '社交媒体短视频',
            '多语言本地化', '数字人客服', '直播切片'
          ].map(tag => (
            <button
              key={tag}
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const event = new CustomEvent('openspace-tab');
                  window.dispatchEvent(event);
                }, 150);
              }}
              className="text-[10px] bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 px-2.5 py-1 rounded-full border border-pink-500/20 hover:border-pink-500/40 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 自然语言创建 Agent 入口 */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-xl">✨</span> 自然语言生成智能体
            </h3>
            <p className="text-xs text-slate-500 mt-1">用自然语言描述需求，AI 自动构建 Agent + Skill 包</p>
          </div>
          <button
            onClick={() => setShowNLDialog(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 border border-indigo-500/30"
          >
            <span>⚡</span>
            <span>自然语言创建</span>
          </button>
        </div>

        {/* 快捷入口 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { icon: '🔍', label: '选品助手', desc: '竞品/趋势分析' },
            { icon: '📝', label: '文案助手', desc: '标题/描述/A+' },
            { icon: '🎬', label: '视频脚本', desc: 'TikTok/抖音' },
            { icon: '📊', label: '数据分析', desc: '广告/库存' },
            { icon: '💬', label: '客服助手', desc: '售前/售后' },
            { icon: '🎯', label: '广告优化', desc: 'ACOS/ROAS' },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => setShowNLDialog(true)}
              className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/50 hover:border-indigo-500/40 rounded-lg px-3 py-1.5 text-left transition-all"
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <div className="text-xs font-medium text-white leading-tight">{item.label}</div>
                <div className="text-[9px] text-slate-500">{item.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 工作流编排入口 */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-white flex items-center gap-2">
              <span className="text-xl">🦞</span> 工作流编排器
            </h3>
            <p className="text-xs text-slate-500 mt-1">基于64卦智能体系统的可视化工作流编排与执行引擎</p>
          </div>
          <button
            onClick={() => setShowWorkflow(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
          >
            <span>🌀</span>
            <span>打开工作流编排器</span>
          </button>
        </div>

        {/* 快捷模板入口 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { emoji: '🌐', name: '跨境电商全链路', color: 'from-cyan-700/50 to-blue-700/50 border-cyan-500/30', count: 10 },
            { emoji: '📝', name: '内容矩阵生产', color: 'from-violet-700/50 to-purple-700/50 border-violet-500/30', count: 9 },
            { emoji: '🎬', name: '爆款视频工厂', color: 'from-pink-700/50 to-rose-700/50 border-pink-500/30', count: 9 },
            { emoji: '🏔️', name: '品牌IP打造', color: 'from-amber-700/50 to-orange-700/50 border-amber-500/30', count: 8 },
            { emoji: '🦞', name: '虾群协作推广', color: 'from-emerald-700/50 to-teal-700/50 border-emerald-500/30', count: 10 },
            { emoji: '🔍', name: '选品调研链路', color: 'from-red-700/50 to-orange-700/50 border-red-500/30', count: 8 },
            { emoji: '🎨', name: '视觉内容工厂', color: 'from-purple-700/50 to-fuchsia-700/50 border-purple-500/30', count: 8 },
            { emoji: '📊', name: '数据分析复盘', color: 'from-blue-700/50 to-indigo-700/50 border-blue-500/30', count: 9 },
          ].map(t => (
            <button
              key={t.name}
              onClick={() => setShowWorkflow(true)}
              className={`bg-gradient-to-br ${t.color} rounded-xl p-3 text-left hover:scale-[1.02] transition-transform border`}
            >
              <div className="text-lg mb-1">{t.emoji}</div>
              <div className="text-xs font-semibold text-white">{t.name}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{t.count}个卦位节点</div>
            </button>
          ))}
        </div>
      </div>

      {/* 八宫状态 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {status.agents.byPalace.map(({ palace, count }: { palace: string; count: number }) => (
          <div key={palace} className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{palaceNames[palace] || '🌐'}</span>
              <div>
                <div className="font-medium text-white">{palace}</div>
                <div className="text-xs text-slate-500">{count} 个智能体</div>
              </div>
            </div>
            <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        ))}
      </div>
      {health && (
        <div className="glass-card p-6">
          <h3 className="text-sm text-slate-400 mb-4">💓 节点健康详情</h3>
          <div className="space-y-2">
            {health.nodes.slice(0, 16).map((node) => (
              <div key={node.agentId} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full ${node.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'} heartbeat-dot`} />
                <span className="text-slate-500 w-12">{node.palace}</span>
                <span className="text-slate-300 flex-1">{node.agentId}</span>
                <span className="text-slate-500">{node.responseTime}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 自然语言生成 Agent 对话框 */}
      {showNLDialog && <NLAgentDialog onClose={() => setShowNLDialog(false)} />}
    </div>
  );
}
