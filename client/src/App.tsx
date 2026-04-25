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
import { ECommerceAssistant } from './components/ECommerceAssistant';
import { BazhuyuRPAPanel } from './components/BazhuyuRPAPanel';
import { HuburpaRPAPanel } from './components/HuburpaRPAPanel';
import { UiPathRPAPanel } from './components/UiPathRPAPanel';
import { MoClawPanel } from './components/MoClawPanel';
import { ZeelyPanel } from './components/ZeelyPanel';
import { XiaojiaPanel } from './components/XiaojiaPanel';
import { HappycapyPanel } from './components/HappycapyPanel';
import { MasterControlDialog } from './components/MasterControlDialog';
import { RexwitPanel } from './components/RexwitPanel';
import { LiveAvatarPanel } from './components/LiveAvatarPanel';
import { OpenSwarmPanel } from './components/OpenSwarmPanel';
import { GPTImagePanel } from './components/GPTImagePanel';
import { HiggsfieldPanel } from './components/HiggsfieldPanel';
import { PromptsrefPanel } from './components/PromptsrefPanel';
import { StaticAdGeneratorPanel } from './components/StaticAdGeneratorPanel';
import { CrossBorderEcommercePanel } from './components/CrossBorderEcommercePanel';
import { FlyElepPanel } from './components/FlyElepPanel';
import { LinkFoxPanel } from './components/LinkFoxPanel';
import { ForeignTradeSOPPanel } from './components/ForeignTradeSOPPanel';
import { GeoMarketingPanel } from './components/GeoMarketingPanel';
import { AnyGenPanel } from './components/AnyGenPanel';

type AppTab = 'dashboard' | 'cluster' | 'agents' | 'opc' | 'knowledge' | 'graph' | 'logs' | 'settings';

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

  // ── 已登录：显示龙虾集群 ─────────────────────────────────
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

  // 自动登录凭证（默认账号）
  const AUTO_EMAIL = 'hmwhtm@gmail.com';
  const AUTO_PASSWORD = 'htmhmw911';

  // 表单状态 — 自动预填
  const [email, setEmail] = useState(AUTO_EMAIL);
  const [password, setPassword] = useState(AUTO_PASSWORD);
  const [displayName, setDisplayName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');

  // 组件挂载时自动登录
  useEffect(() => {
    const autoLogin = async () => {
      setError('');
      setIsLoading(true);
      try {
        const { user, tenant } = await api.login({ email: AUTO_EMAIL, password: AUTO_PASSWORD });
        onSuccess(user, tenant);
      } catch {
        // 自动登录失败时不显示错误，静默等待用户手动登录
        setIsLoading(false);
      }
    };
    autoLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <p className="text-slate-500 text-sm mt-1">龙虾集群太极64卦 · 多租户智能体集群系统</p>
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
              mode === 'login' ? '🔐 进入龙虾集群' : '✨ 创建账号 + 团队'
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
      version: 'v2.5.0',
      size: '128 MB',
      color: 'from-slate-700 to-slate-800',
      badge: 'App Store',
      downloadUrl: 'https://apps.apple.com/app/simiaiclaw',
    },
    {
      name: 'Android',
      icon: '🤖',
      desc: 'Android 手机/平板',
      version: 'v2.5.0',
      size: '96 MB',
      color: 'from-green-700 to-green-800',
      badge: 'APK 直装包',
      downloadUrl: '/simiaiclaw-android.apk',
      secondaryUrl: 'https://play.google.com/store/apps/details?id=ai.simai.claw',
      secondaryBadge: 'Google Play',
    },
    {
      name: 'Windows',
      icon: '🪟',
      desc: 'Windows 10/11',
      version: 'v2.5.0',
      size: '210 MB',
      color: 'from-blue-700 to-blue-800',
      badge: 'exe 安装包',
      downloadUrl: 'https://download.simai.claw/client/simiaiclaw-win.exe',
    },
    {
      name: 'macOS',
      icon: '🍎',
      desc: 'macOS 12+ (Intel & Apple Silicon)',
      version: 'v2.5.0',
      size: '185 MB',
      color: 'from-gray-700 to-gray-800',
      badge: 'dmg 镜像',
      downloadUrl: 'https://download.simai.claw/client/simiaiclaw-mac.dmg',
    },
    {
      name: 'Linux',
      icon: '🐧',
      desc: 'Ubuntu / Debian / Fedora',
      version: 'v2.5.0',
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
            <div
              key={p.name}
              className={`bg-gradient-to-br ${p.color} hover:scale-[1.02] transition-transform rounded-xl p-4 flex flex-col items-center text-center gap-2 border border-white/10 cursor-pointer relative`}
            >
              <div className="text-4xl">{p.icon}</div>
              <div>
                <div className="text-white font-semibold text-sm">{p.name}</div>
                <div className="text-white/60 text-xs mt-0.5">{p.desc}</div>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full">{p.badge}</span>
                {p.secondaryBadge && (
                  <a
                    href={p.secondaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="bg-white/10 text-white text-[10px] px-2 py-0.5 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {p.secondaryBadge}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-white/50 mt-1">
                <span>{p.version}</span>
                {p.size !== '无需安装' && <span>· {p.size}</span>}
              </div>
              <a
                href={p.downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-full mt-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-1.5 px-3 rounded-lg transition-colors text-center"
              >
                {p.name === 'Android' ? '📥 下载 APK 直装' : p.name === 'Web' ? '🌐 立即访问' : '⬇️ 下载'}
              </a>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-between text-xs text-slate-500">
          <span>如遇下载问题，请联系 support@simai.claw</span>
          <div className="flex items-center gap-2">
            <span>当前版本: v2.5.0</span>
            <span>·</span>
            <button className="hover:text-emerald-400 transition-colors">检查更新 →</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 龙虾集群 ─────────────────────────────────────────────────
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
  const [ecommerceOpen, setEcommerceOpen] = useState(false);
  const [liveAvatarOpen, setLiveAvatarOpen] = useState(false);
  const [foreignTradeOpen, setForeignTradeOpen] = useState(false);
  const [anygenOpen, setAnygenOpen] = useState(false);

  const handleSetSettingsTab = (tab: string) => {
    setSettingsTab(tab);
    onTabChange('settings');
  };

  // 监听来自 HeyGen 按钮的导航事件
  useEffect(() => {
    const handler = () => {
      onTabChange('settings');
      setSettingsTab('openspace');
    };
    window.addEventListener('openspace-tab', handler);
    return () => window.removeEventListener('openspace-tab', handler);
  }, [onTabChange]);

  // 监听来自八爪鱼RPA按钮的导航事件
  useEffect(() => {
    const handler = () => {
      onTabChange('settings');
      setSettingsTab('bazhuyurpa');
    };
    window.addEventListener('bazhuyu-tab', handler);
    return () => window.removeEventListener('bazhuyu-tab', handler);
  }, [onTabChange]);

  useEffect(() => {
    const handler2 = () => {
      onTabChange('settings');
      setSettingsTab('huburparpa');
    };
    window.addEventListener('huburpa-tab', handler2);
    return () => window.removeEventListener('huburpa-tab', handler2);
  }, [onTabChange]);

  useEffect(() => {
    const handler3 = () => {
      onTabChange('settings');
      setSettingsTab('xiaojia');
    };
    window.addEventListener('xiaojia-tab', handler3);
    return () => window.removeEventListener('xiaojia-tab', handler3);
  }, [onTabChange]);

  useEffect(() => {
    const handler4 = () => {
      onTabChange('settings');
      setSettingsTab('happycapy');
    };
    window.addEventListener('happycapy-tab', handler4);
    return () => window.removeEventListener('happycapy-tab', handler4);
  }, [onTabChange]);

  useEffect(() => {
    const handler5 = () => {
      onTabChange('settings');
      setSettingsTab('skillhub');
    };
    window.addEventListener('skillhub-tab', handler5);
    return () => window.removeEventListener('skillhub-tab', handler5);
  }, [onTabChange]);

  useEffect(() => {
    const handler7 = () => {
      setForeignTradeOpen(v => !v);
    };
    window.addEventListener('foreigntrade-tab', handler7);
    return () => window.removeEventListener('foreigntrade-tab', handler7);
  }, []);

  useEffect(() => {
    const handler6 = () => {
      onTabChange('settings');
      setSettingsTab('rexwit');
    };
    window.addEventListener('settings-tab-rexwite', handler6);
    return () => window.removeEventListener('settings-tab-rexwite', handler6);
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
    { id: 'cluster', label: '龙虾集群中心', icon: '🦞' },
    { id: 'agents', label: '智能体集群', icon: '🦞' },
    { id: 'opc', label: 'OPC工作台', icon: '🦞' },
    { id: 'knowledge', label: '知识库', icon: '📚' },
    { id: 'graph', label: '知识图谱', icon: '🕸️' },
    { id: 'settings', label: '设置', icon: '⚙️' },
  ] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* ═══════════════════════════════════════════════════════ */}
      {/*  左侧边栏导航                                          */}
      {/* ═══════════════════════════════════════════════════════ */}
      <aside className="w-56 flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col min-h-screen sticky top-0">
        {/* Logo 区 */}
        <div className="px-4 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="text-2xl flex-shrink-0">🦞</div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold taiji-gradient leading-tight">SIMIAICLAW</h1>
              <p className="text-[10px] text-slate-500 leading-tight">龙虾集群中心</p>
            </div>
          </div>
          <a
            href="https://claw-evolution-university.lovable.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block text-[10px] text-amber-400 hover:text-amber-300 hover:underline decoration-amber-400/50 transition-colors"
          >
            🏫 跨境龙虾社大学
          </a>
          <a
            href="https://pixiedream-studio.lovable.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1.5 block text-[10px] text-pink-400 hover:text-pink-300 hover:underline decoration-pink-400/50 transition-colors"
          >
            ✨ PixieDream 修图
          </a>
          {activeTenant && (
            <div className="mt-2 flex items-center gap-1.5 bg-slate-800 rounded-lg px-2 py-1">
              <span className="text-[10px] text-slate-400">🏢</span>
              <span className="text-[11px] font-medium truncate">{activeTenant.name}</span>
              <span className={`text-[9px] px-1 py-0.5 rounded flex-shrink-0 ${
                activeTenant.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                activeTenant.plan === 'pro' ? 'bg-cyan-500/20 text-cyan-400' :
                'bg-slate-600/50 text-slate-400'
              }`}>
                {activeTenant.plan.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* 主导航标签（垂直排列） */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* 快捷工具入口（边栏底部） */}
        <div className="px-3 py-3 border-t border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-600 px-3 pb-1 uppercase tracking-wider">快捷入口</div>

          {/* AnyGen 外贸助手 */}
          <a
            href="https://www.anygen.io/assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-gradient-to-r from-emerald-700/60 to-teal-700/60 hover:from-emerald-600 hover:to-teal-600 text-emerald-200 transition-all border border-emerald-600/30"
          >
            <span>🤖</span>
            <span className="font-medium">AnyGen 外贸助手</span>
            <span className="ml-auto text-[9px] opacity-60">↗</span>
          </a>

          {/* simiaiclaw 超级小小鸟对话框 */}
          <a
            href="https://simiaiclaw.base44.app"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-gradient-to-r from-violet-700/60 to-purple-700/60 hover:from-violet-600 hover:to-purple-600 text-violet-200 transition-all border border-violet-600/30"
          >
            <span>🐦</span>
            <span className="font-medium">超级小小鸟对话</span>
            <span className="ml-auto text-[9px] opacity-60">↗</span>
          </a>

          {/* 龙虾 OpenClaw 面板 */}
          <a
            href="http://127.0.0.1:18789/chat?session=main"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/50"
          >
            <span>🦞</span>
            <span>OpenClaw 面板</span>
            <span className="ml-auto text-[9px] text-emerald-400">●</span>
          </a>

          {/* 多端下载 App */}
          <button
            onClick={() => setDownloadModalOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700/50"
          >
            <span>📥</span>
            <span>多端下载 App</span>
          </button>
        </div>

        {/* 用户信息（边栏底部） */}
        <div className="px-3 py-3 border-t border-slate-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
            {authUser.displayName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium truncate">{authUser.displayName}</div>
            <div className="text-[10px] text-slate-500 truncate">{activeTenant?.role}</div>
          </div>
          <button
            onClick={onLogout}
            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
            title="退出登录"
          >
            ✕
          </button>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════ */}
      {/*  右侧主内容区                                           */}
      {/* ═══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar: 功能工具按钮条 */}
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-6 py-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* 🌍 外贸跨境电商助手 */}
              <button
                onClick={() => setEcommerceOpen(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  ecommerceOpen
                    ? 'bg-amber-600/80 text-white shadow-lg shadow-amber-500/20'
                    : 'bg-gradient-to-r from-amber-600/70 to-orange-600/70 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20'
                }`}
              >
                <span>🌍</span>
                <span>外贸助手</span>
              </button>

              {/* 🌐 外贸AI客户开发SOP */}
              <button
                onClick={() => setForeignTradeOpen(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  foreignTradeOpen
                    ? 'bg-indigo-600/80 text-white shadow-lg shadow-indigo-500/20'
                    : 'bg-gradient-to-r from-indigo-600/70 to-violet-600/70 hover:from-indigo-600 hover:to-violet-600 text-white shadow-lg shadow-indigo-500/20'
                }`}
              >
                <span>🌐</span>
                <span>外贸SOP</span>
              </button>

              {/* 🎭 数字人 */}
              <button
                onClick={() => setLiveAvatarOpen(v => !v)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  liveAvatarOpen
                    ? 'bg-violet-600/80 text-white shadow-lg shadow-violet-500/20'
                    : 'bg-gradient-to-r from-violet-600/70 to-purple-600/70 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg shadow-violet-500/20'
                }`}
              >
                <span>🎭</span>
                <span>数字人</span>
              </button>

              {/* 🦞 智能体集群 & 技能商店 */}
              <button
                onClick={() => setSkillPanelOpen(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600/80 to-violet-600/80 hover:from-indigo-600 hover:to-violet-600 text-white transition-all shadow-lg shadow-indigo-500/20"
              >
                <span>🦞</span>
                <span>智能体集群 & 技能</span>
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
                    <div className="absolute left-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
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
            </div>
          </div>
        </header>

        {/* Hero 横幅区 */}
        <div className="px-6 pt-5 pb-0">
          {/* AnyGen Hero 横幅 */}
          <a
            href="https://www.anygen.io/assistant"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 glass-card border border-emerald-500/30 hover:border-emerald-400/50 transition-all group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/40 to-teal-600/40 border border-emerald-500/30 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/10 group-hover:scale-110 transition-transform">
                  🤖
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">AnyGen · AI 外贸助手</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    全链路外贸 AI 工具 · SEO · GEO · 社媒矩阵 · 多语言内容生成
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-emerald-400 font-medium">anygen.io/assistant</div>
                  <div className="text-[10px] text-slate-500">AI 外贸 · 全面赋能</div>
                </div>
                <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
                  <span>🚀</span>
                  <span>立即体验</span>
                  <span className="text-[10px] opacity-70">↗</span>
                </span>
              </div>
            </div>
            {/* 底部功能标签 */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['SEO 优化', 'GEO 可见性', '社媒矩阵', '多语言', '客户开发', '文案生成'].map(tag => (
                <span key={tag} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </a>

          {/* simiaiclaw 超级小小鸟对话 Hero 横幅 */}
          <a
            href="https://simiaiclaw.base44.app"
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-4 glass-card border border-violet-500/30 hover:border-violet-400/50 transition-all group"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/40 to-purple-600/40 border border-violet-500/30 flex items-center justify-center text-xl shadow-lg shadow-violet-500/10 group-hover:scale-110 transition-transform">
                  🐦
                </div>
                <div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    simiaiclaw 超级小小鸟对话
                    <span className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">NEW</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    AI 智能对话 · 跨境电商场景 · 多语言支持 · 极速响应
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right hidden md:block">
                  <div className="text-xs text-violet-400 font-medium">simiaiclaw.base44.app</div>
                  <div className="text-[10px] text-slate-500">AI 助手 · 随时对话</div>
                </div>
                <span className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 border border-violet-500/30">
                  <span>🐦</span>
                  <span>开始对话</span>
                  <span className="text-[10px] opacity-70">↗</span>
                </span>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {['智能对话', '跨境场景', '多语言', '极速响应', '上下文记忆'].map(tag => (
                <span key={tag} className="text-[10px] bg-violet-500/10 text-violet-400 px-2.5 py-0.5 rounded-full border border-violet-500/20">
                  {tag}
                </span>
              ))}
            </div>
          </a>
        </div>

        {/* 主体内容 */}
        <main className="flex-1 max-w-7xl w-full px-6 py-5">
          {isLoading && !status && (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-pulse">🦞</div>
                <p className="text-slate-400">集群启动中...</p>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && <DashboardView status={status!} health={health} onTabChange={onTabChange} handleSetSettingsTab={handleSetSettingsTab} onOpenLiveAvatar={() => setLiveAvatarOpen(true)} />}
          {status && activeTab === 'cluster' && <DashboardView status={status!} health={health} onTabChange={onTabChange} handleSetSettingsTab={handleSetSettingsTab} onOpenLiveAvatar={() => setLiveAvatarOpen(true)} />}
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
      </div>

      {/* 智能体集群 & 技能商店面板 */}
      {skillPanelOpen && <AgentSkillPanel onClose={() => setSkillPanelOpen(false)} />}

      {/* 多端下载 App 弹窗 */}
      {downloadModalOpen && (
        <AppDownloadModal onClose={() => setDownloadModalOpen(false)} />
      )}

      {/* 🌍 外贸跨境电商全能助手 */}
      {ecommerceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <ECommerceAssistant onClose={() => setEcommerceOpen(false)} />
          </div>
        </div>
      )}

      {/* 🎭 数字人 */}
      {liveAvatarOpen && (
        <LiveAvatarPanel onClose={() => setLiveAvatarOpen(false)} />
      )}

      {/* 🌐 外贸AI SOP */}
      {foreignTradeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-5xl">
            <ForeignTradeSOPPanel />
            <div className="flex justify-center mt-4">
              <button
                onClick={() => setForeignTradeOpen(false)}
                className="text-xs text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 px-6 py-2 rounded-lg transition-colors border border-slate-700"
              >
                关闭面板
              </button>
            </div>
          </div>
        </div>
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
    { id: 'openswarm', label: 'OpenSwarm', icon: '🐝' },
    { id: 'gptimage', label: 'GPT Image 2', icon: '🖼️' },
    { id: 'promptsref', label: 'Promptsref', icon: '🎨' },
    { id: 'adgen', label: '广告生成器', icon: '📣' },
    { id: 'flyelep', label: '飞象AI', icon: '🐘' },
    { id: 'linkfox', label: 'LinkFox', icon: '🦊' },
    { id: 'higgsfield', label: 'Seedance 2.0', icon: '🎬' },
    { id: 'crossborder', label: '跨境电商', icon: '🌏' },
    { id: 'foreigntradesop', label: '外贸SOP', icon: '🌐' },
    { id: 'geomarketing', label: 'GEO营销', icon: '🌍' },
    { id: 'bazhuyurpa', label: '八爪鱼RPA', icon: '🐸' },
    { id: 'huburparpa', label: '虎步RPA', icon: '🐯' },
    { id: 'xiaojia', label: '小加营销', icon: '🧙' },
    { id: 'happycapy', label: 'Happycapy', icon: '🦫' },
    { id: 'rexwit', label: 'Rexwit AI', icon: '🎨' },
    { id: 'models', label: '大模型市场', icon: '🌐' },
    { id: 'subscription', label: '订阅服务', icon: '💎' },
    { id: 'payments', label: '支付管理', icon: '💰' },
    { id: 'globallogin', label: '全球登录', icon: '🌍' },
    { id: 'newslanding', label: '龙虾资讯', icon: '📰' },
    { id: 'university', label: '跨境龙虾社大学', icon: '🎓', href: 'https://claw-evolution-university.lovable.app/', external: true },
    { id: 'pixiedream', label: 'PixieDream 修图', icon: '✨', href: 'https://pixiedream-studio.lovable.app/', external: true },
    { id: 'uipath', label: 'UiPath RPA', icon: '🤖' },
    { id: 'moclaw', label: 'MoClaw AI', icon: '☁️' },
    { id: 'zeely', label: 'Zeely 广告', icon: '📣' },
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
            href="https://claw-evolution-university.lovable.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
          >
            🚀 前往龙虾社大学 ↗
          </a>
        </div>
      )}

      {/* PixieDream Studio 外部链接 */}
      {settingsTab === 'pixiedream' && (
        <div className="glass-card p-8 text-center space-y-4">
          <div className="text-5xl">✨</div>
          <div>
            <h3 className="text-lg font-semibold text-white">PixieDream Studio</h3>
            <p className="text-sm text-slate-400 mt-1">商业广告级AI修图智能体 · AI Agent + Flux + ControlNet + LoRA</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs text-slate-500">
            <span>🎨 明星艺人修图</span>
            <span>·</span>
            <span>📣 品牌KV海报</span>
            <span>·</span>
            <span>🌟 时尚大片</span>
          </div>
          <a
            href="https://pixiedream-studio.lovable.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-pink-500/20"
          >
            ✨ 前往 PixieDream Studio ↗
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

      {/* OpenSwarm 多智能体编排平台 */}
      {settingsTab === 'openswarm' && (
        <OpenSwarmPanel />
      )}

      {/* GPT Image 2 图像生成 */}
      {settingsTab === 'gptimage' && (
        <GPTImagePanel />
      )}
      {/* Promptsref AI 图像生成器（iframe 嵌入） */}
      {settingsTab === 'promptsref' && (
        <PromptsrefPanel />
      )}
      {/* 静态广告批量生成器 */}
      {settingsTab === 'adgen' && (
        <StaticAdGeneratorPanel />
      )}
      {/* 飞象AI · 跨境电商智能体 */}
      {settingsTab === 'flyelep' && (
        <FlyElepPanel />
      )}
      {/* LinkFox · 跨境电商AI运营助手 */}
      {settingsTab === 'linkfox' && (
        <LinkFoxPanel />
      )}
      {/* Seedance 2.0 视频生成 */}
      {settingsTab === 'higgsfield' && (
        <HiggsfieldPanel />
      )}

      {/* 跨境电商营销技能库 */}
      {settingsTab === 'crossborder' && (
        <CrossBorderEcommercePanel />
      )}

      {/* 外贸AI客户开发业务SOP工作流 */}
      {settingsTab === 'foreigntradesop' && (
        <ForeignTradeSOPPanel />
      )}

      {/* Dageno GEO 营销系统 · 离宫·验效卦 */}
      {settingsTab === 'geomarketing' && (
        <GeoMarketingPanel />
      )}

      {/* 八爪鱼RPA · 巽宫执行卦 */}
      {settingsTab === 'bazhuyurpa' && (
        <BazhuyuRPAPanel />
      )}

      {/* 虎步RPA · 巽宫双引擎（紫鸟生态） */}
      {settingsTab === 'huburparpa' && (
        <HuburpaRPAPanel />
      )}

      {/* UiPath RPA · 乾宫统御卦 */}
      {settingsTab === 'uipath' && (
        <UiPathRPAPanel />
      )}

      {/* MoClaw AI 云计算机 · 震宫·云智卦 */}
      {settingsTab === 'moclaw' && (
        <MoClawPanel />
      )}

      {/* Zeely AI 广告智能体 · 巽宫·创意工具卦 */}
      {settingsTab === 'zeely' && (
        <ZeelyPanel />
      )}

      {/* 小加营销智能体 · 离宫·营销卦 */}
      {settingsTab === 'xiaojia' && (
        <XiaojiaPanel />
      )}

      {/* Happycapy Skills · 坎宫·技能商店 */}
      {settingsTab === 'happycapy' && (
        <HappycapyPanel />
      )}

      {/* Rexwit 本地 AI · 巽宫·创意工具卦 */}
      {settingsTab === 'rexwit' && (
        <RexwitPanel />
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
function DashboardView({ status, health, onTabChange, handleSetSettingsTab, onOpenLiveAvatar }: { status: SystemStatus | null; health: HealthReport | null; onTabChange: (t: AppTab) => void; handleSetSettingsTab: (tab: string) => void; onOpenLiveAvatar: () => void }) {
  const [showHexGrid, setShowHexGrid] = useState(false);
  const [showMasterControl, setShowMasterControl] = useState(false);

  // 等待状态加载
  if (!status) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <div className="text-4xl">🦞</div>
          <div className="text-sm text-slate-400">龙虾集群加载中...</div>
          <div className="text-xs text-slate-500 animate-pulse">正在连接后端服务</div>
        </div>
      </div>
    );
  }

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

  // Master control dialog
  const openSkillHub = () => {
    onTabChange('settings');
    const interval = setInterval(() => {
      const btn = document.querySelector('[data-settings-tab="skillhub"]') as HTMLButtonElement;
      if (btn) { btn.click(); clearInterval(interval); }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  };
  const openHappycapy = () => {
    onTabChange('settings');
    const interval = setInterval(() => {
      const btn = document.querySelector('[data-settings-tab="happycapy"]') as HTMLButtonElement;
      if (btn) { btn.click(); clearInterval(interval); }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  };
  const openRexwit = () => {
    onTabChange('settings');
    const interval = setInterval(() => {
      const btn = document.querySelector('[data-settings-tab="rexwit"]') as HTMLButtonElement;
      if (btn) { btn.click(); clearInterval(interval); }
    }, 100);
    setTimeout(() => clearInterval(interval), 3000);
  };

  return (
    <>
      {showMasterControl && (
        <MasterControlDialog
          onClose={() => setShowMasterControl(false)}
          onOpenAgents={() => { setShowMasterControl(false); onTabChange('agents'); }}
          onOpenOPC={() => { setShowMasterControl(false); onTabChange('opc'); }}
          onOpenSkillHub={openSkillHub}
          onOpenHappycapy={openHappycapy}
          onOpenRexwit={openRexwit}
        />
      )}
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '智能体集群总数', value: status.agents.total, color: 'text-cyan-400', icon: '🦞' },
          { label: '心跳节点', value: status.heartbeat.nodeCount, color: 'text-emerald-400', icon: '💓' },
          { label: '知识条目', value: status.openspace.total, color: 'text-purple-400', icon: '🧠' },
          { label: '累计流水', value: `¥${(status.clawtip.revenue || 0).toLocaleString()}`, color: 'text-amber-400', icon: '💰' },
        ].map((item, idx) => (
          <div
            key={item.label}
            className="glass-card p-4 text-center hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group cursor-default"
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className={`text-3xl font-bold ${item.color} transition-transform duration-300 group-hover:scale-110`}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-1 group-hover:text-slate-400 transition-colors">{item.icon} {item.label}</div>
          </div>
        ))}
      </div>

      {/* OpenSwarm 多智能体编排平台快捷入口 */}
      <div className="glass-card p-5 border border-amber-500/20 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/40 to-orange-600/40 border border-amber-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              🐝
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-200 transition-colors">OpenSwarm 多智能体编排平台</div>
              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">并行 Agent · 无限画布 · MCP 工具集成</div>
              <div className="text-[10px] text-amber-500/60 mt-0.5">
                <a href="https://docs.openswarm.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 hover:underline">
                  📖 docs.openswarm.com
                </a>
                {' · '}
                <a href="https://openswarm.com" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400 hover:underline">
                  🌐 openswarm.com
                </a>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-amber-400">🐝</div>
              <div className="text-[10px] text-slate-500">OpenSwarm Ready</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('openswarm'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 border border-amber-500/30 hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>🐝</span>
              <span>打开 OpenSwarm</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI 短剧工作室快捷入口 */}
      <a
        href="http://localhost:3001/studio"
        target="_blank"
        rel="noopener noreferrer"
        className="glass-card p-5 border border-orange-500/20 hover:border-orange-400/40 transition-all group flex items-center justify-between gap-4 no-underline"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600/40 to-red-600/40 border border-orange-500/30 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/10 group-hover:scale-110 transition-transform">
            🎬
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              AI 短剧工作室
              <span className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              角色一致性保障 · 批量镜头生成 · 模板化脚本 · Seedance 2.0 视频合成
            </div>
            <div className="text-[10px] text-orange-500/60 mt-0.5">
              选题材 → 定角色 → 批量生镜头 → 合成视频
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden md:block">
            <div className="text-xs text-orange-400 font-medium">🎬 5 步流水线</div>
            <div className="text-[10px] text-slate-500">角色 × 脚本 × 镜头 × 视频</div>
          </div>
          <span className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 border border-orange-500/30">
            <span>🎬</span>
            <span>进入工作室</span>
            <span className="text-xs opacity-70">↗</span>
          </span>
        </div>
      </a>

      {/* 底部功能标签 */}
      <div className="flex flex-wrap gap-1.5">
        {['角色一致性', '批量生成', '模板脚本', 'Seedance 2.0', '可灵/即梦', 'Pika'].map(tag => (
          <span key={tag} className="text-[10px] bg-orange-500/10 text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-500/20">
            {tag}
          </span>
        ))}
      </div>

      {/* GPT Image 2 图像生成快捷入口 */}
      <div className="glass-card p-5 border border-violet-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600/40 to-indigo-600/40 border border-violet-500/30 flex items-center justify-center text-2xl">
              🖼️
            </div>
            <div>
              <div className="text-sm font-semibold text-white">GPT Image 2 图像生成</div>
              <div className="text-xs text-slate-500 mt-0.5">Arena 图像榜第一 · 2K/4K 高清 · 文生图/图生图</div>
              <div className="text-[10px] text-violet-500/60 mt-0.5">
                Arena 图像榜第一 · 精确文字渲染 · 支持 mask 局部重绘
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-violet-400">🖼️</div>
              <div className="text-[10px] text-slate-500">GPT Image 2 Ready</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('gptimage'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-500/20 border border-violet-500/30"
            >
              <span>🖼️</span>
              <span>打开图像生成</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🎨 Promptsref AI 图像生成器快捷入口 */}
      <div className="glass-card p-5 border border-pink-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/40 to-purple-600/40 border border-pink-500/30 flex items-center justify-center text-2xl">
              🎨
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                Promptsref AI 图像生成器
                <span className="bg-gradient-to-r from-pink-600 to-purple-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">多模型并行生成 · 无水印下载 · 6 大顶级模型</div>
              <div className="text-[10px] text-pink-500/60 mt-0.5">
                FLUX.2 Pro / Midjourney / Nano Banana Pro / Seedream / GPT Image 2 / Grok Imagine
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-pink-400">🎨</div>
              <div className="text-[10px] text-slate-500">US$5/月</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('promptsref'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 border border-pink-500/30"
            >
              <span>🎨</span>
              <span>打开生成器</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 📣 静态广告批量生成器快捷入口 */}
      <div className="glass-card p-5 border border-orange-500/20 hover:border-orange-400/40 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600/40 to-rose-600/40 border border-orange-500/30 flex items-center justify-center text-2xl">
              📣
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                静态广告批量生成器
                <span className="bg-gradient-to-r from-orange-600 to-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">GPT Image 2 驱动 · 参考图 + 品牌包 + AI画像</div>
              <div className="text-[10px] text-orange-500/60 mt-0.5">
                批量生成 Meta 广告 · 每个画像自动生成多个变体
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-orange-400">GPT Image 2</div>
              <div className="text-[10px] text-slate-500">批量生图</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('adgen'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 border border-orange-500/30"
            >
              <span>📣</span>
              <span>打开生成器</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🐘 飞象AI 跨境电商智能体集群快捷入口 */}
      <div className="glass-card p-5 border border-orange-500/20 hover:border-orange-400/40 hover:shadow-lg hover:shadow-orange-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 border border-orange-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              🐘
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2 group-hover:text-orange-200 transition-colors">
                飞象AI · 跨境电商智能体集群
                <span className="bg-gradient-to-r from-orange-600 to-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">GPT Image 2 · 邀请码 260109</div>
              <div className="text-[10px] text-orange-500/60 mt-0.5">
                首次注册赠 300+200 算力值 · 多模型生图 + SEO/GEO + 社媒矩阵
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-orange-400">邀请码 260109</div>
              <div className="text-[10px] text-slate-500">flyelep.cn</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('flyelep'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 border border-orange-500/30 hover:shadow-orange-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>🐘</span>
              <span>立即体验</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🦊 LinkFox 跨境电商AI运营助手快捷入口 */}
      <div className="glass-card p-5 border border-violet-500/20 hover:border-violet-400/40 transition-all">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 border border-violet-500/30 flex items-center justify-center text-2xl">
              🦊
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                LinkFox · 跨境电商AI运营助手
                <span className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">NEW</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">linkfox.com · AI选品 · AI作图 · AI分析</div>
              <div className="text-[10px] text-violet-500/60 mt-0.5">
                从0到1覆盖运营全链路 · 告别盲目测款 · 省下上万拍摄费
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-violet-400">AI选品+作图+分析</div>
              <div className="text-[10px] text-slate-500">跨境全链路</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('linkfox'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-violet-600/20 border border-violet-500/30"
            >
              <span>🦊</span>
              <span>立即体验</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🎭 HeyGen LiveAvatar 实时数字人快捷入口 */}
      <div className="glass-card p-5 border border-pink-500/20 hover:border-pink-400/40 transition-all group">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/40 to-rose-600/40 border border-pink-500/30 flex items-center justify-center text-2xl shadow-lg shadow-pink-500/10 group-hover:scale-110 transition-transform">
              🎭
            </div>
            <div>
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                HeyGen LiveAvatar 实时数字人
                <span className="bg-gradient-to-r from-pink-600 to-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">HOT</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                企业级 AI 数字人 · WebRTC 实时流 · 唇形同步 · 175+ 语言
              </div>
              <div className="text-[10px] text-pink-500/60 mt-0.5">
                数字人 × AI 脚本 × 多语言配音 · 跨境电商 / B2B 展示 · 展会大屏
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden md:block">
              <div className="text-xs text-pink-400 font-medium">🎭 WebRTC 实时流</div>
              <div className="text-[10px] text-slate-500">唇形同步 · 自然表情</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('openspace'); onOpenLiveAvatar(); }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 border border-pink-500/30"
            >
              <span>🎭</span>
              <span>启动数字人</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
        {/* 底部功能标签 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['WebRTC实时流', '唇形同步', '175+语言', '多场景', 'B2B展示', '展会大屏'].map(tag => (
            <span key={tag} className="text-[10px] bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full border border-pink-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Seedance 2.0 × Higgsfield 视频生成快捷入口 */}
      <div className="glass-card p-5 border border-amber-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-600/40 to-orange-600/40 border border-amber-500/30 flex items-center justify-center text-2xl">
              🎬
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Seedance 2.0 × Higgsfield</div>
              <div className="text-xs text-slate-500 mt-0.5">字节跳动旗舰 · Arena 视频榜第一 · 文字/图片/音频多模态</div>
              <div className="text-[10px] text-amber-500/60 mt-0.5">
                GPT Image 2 → Seedance 2.0 · 完整图像+视频创作流
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-amber-400">🎬</div>
              <div className="text-[10px] text-slate-500">Seedance 2.0 Ready</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('higgsfield'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 border border-amber-500/30"
            >
              <span>🎬</span>
              <span>打开视频生成</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>
      {/* 🌏 跨境电商营销技能库快捷入口 */}
      <div className="glass-card p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-teal-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl">
              🌏
            </div>
            <div>
              <div className="text-sm font-semibold text-white">跨境电商营销技能库</div>
              <div className="text-xs text-slate-500 mt-0.5">43个技能 · 6大模块 · ClawHub精选</div>
              <div className="text-[10px] text-cyan-500/60 mt-0.5">
                TikTok / SEO / 广告 / 竞品 / Listing / 社媒矩阵
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-cyan-400">43 Skills</div>
              <div className="text-[10px] text-slate-500">6 Modules</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('crossborder'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
            >
              <span>🌏</span>
              <span>打开技能库</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌐 外贸AI客户开发业务SOP工作流快捷入口 */}
      <div className="glass-card p-5 border border-indigo-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/40 to-violet-600/40 border border-indigo-500/30 flex items-center justify-center text-2xl">
              🌐
            </div>
            <div>
              <div className="text-sm font-semibold text-white">外贸AI客户开发业务SOP</div>
              <div className="text-xs text-slate-500 mt-0.5">15个工作流 · 2天线下课 · 不讲概念，带你做完搭出来</div>
              <div className="text-[10px] text-indigo-500/60 mt-0.5">
                USP系统 / 销售武器库 / 谈判机器人 / LinkedIn / AI Studio
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-indigo-400">15 Workflows</div>
              <div className="text-[10px] text-slate-500">6 Modules + AI Studio</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('foreigntradesop'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 border border-indigo-500/30"
            >
              <span>🌐</span>
              <span>打开SOP系统</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
      </div>


      {/* ✨ PixieDream Studio 商业广告级AI修图快捷入口 */}
      <div className="glass-card p-5 border border-pink-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600/40 to-rose-600/40 border border-pink-500/30 flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <div className="text-sm font-semibold text-white">PixieDream Studio</div>
              <div className="text-xs text-slate-500 mt-0.5">AI Agent + Flux + ControlNet + LoRA</div>
              <div className="text-[10px] text-pink-500/60 mt-0.5">
                明星艺人商业修图 · 品牌KV海报 · 时尚大片 · 一键广告级精修
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-pink-400">✨ AI 修图</div>
              <div className="text-[10px] text-slate-500">商业级成片</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('pixiedream'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-pink-500/20 border border-pink-500/30"
            >
              <span>✨</span>
              <span>打开修图工具</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
        {/* 底部功能标签 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['抠图', '生图', '放大', '合成', 'AI置景', 'LoRA定制'].map(tag => (
            <span key={tag} className="text-[10px] bg-pink-500/10 text-pink-400 px-2.5 py-0.5 rounded-full border border-pink-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 🤖 UiPath 企业级RPA智能体集群快捷入口 */}
      <div className="glass-card p-5 border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600/40 to-violet-600/40 border border-purple-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              🤖
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-purple-200 transition-colors">UiPath · 企业级RPA智能体集群</div>
              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">Agentic Automation · Orchestrator API</div>
              <div className="text-[10px] text-purple-500/60 mt-0.5">
                流程自动化 · AI + Robot 协同执行 · 企业级流程编排
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-purple-400">🤖 UiPath</div>
              <div className="text-[10px] text-slate-500">RPA + AI Agent</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('uipath'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 border border-purple-500/30 hover:shadow-purple-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>🤖</span>
              <span>打开RPA控制台</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
        {/* 底部功能标签 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['OAuth认证', '作业调度', '队列管理', 'API集成', 'Robot监控'].map(tag => (
            <span key={tag} className="text-[10px] bg-purple-500/10 text-purple-400 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* ☁️ MoClaw AI 云计算机快捷入口 · 震宫·云智卦 */}
      <div className="glass-card p-5 border border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-lg hover:shadow-cyan-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              ☁️
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">MoClaw · AI 云计算机</div>
              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">Personal AI Assistant · 云端智能体集群 · 浏览器控制</div>
              <div className="text-[10px] text-cyan-500/60 mt-0.5">
                云端AI工作站 · 深度研究 · 多渠道集成 · 50+技能 · $20/月
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-cyan-400">☁️ MoClaw</div>
              <div className="text-[10px] text-slate-500">AI Cloud Computer</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('moclaw'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30 hover:shadow-cyan-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>☁️</span>
              <span>打开AI云计算机</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
        {/* 底部功能标签 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['浏览器控制', '深度研究', '多渠道聊天', 'BYOK密钥', 'Cron定时', '自动化工作流'].map(tag => (
            <span key={tag} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 📣 Zeely AI 广告智能体快捷入口 · 巽宫·创意工具卦 */}
      <div className="glass-card p-5 border border-rose-500/20 hover:border-rose-500/40 hover:shadow-lg hover:shadow-rose-500/5 transition-all duration-300 group">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-600/40 to-pink-600/40 border border-rose-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-200">
              📣
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-rose-200 transition-colors">Zeely · AI 广告智能体集群</div>
              <div className="text-xs text-slate-500 mt-0.5 group-hover:text-slate-400 transition-colors">UGC视频广告 · 静态横幅 · AI虚拟形象 · 多平台投放</div>
              <div className="text-[10px] text-rose-500/60 mt-0.5">
                CTR最高+54% · ROAS最高+250% · 创作成本-95% · Facebook/Instagram/Google/TikTok
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="text-xs text-rose-400">📣 Zeely</div>
              <div className="text-[10px] text-slate-500">AI Ad Creative</div>
            </div>
            <button
              onClick={() => { onTabChange('settings'); handleSetSettingsTab('zeely'); }}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-500/20 border border-rose-500/30"
            >
              <span>📣</span>
              <span>打开广告控制台</span>
              <span className="text-xs opacity-70">↗</span>
            </button>
          </div>
        </div>
        {/* 底部功能标签 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['AI视频广告', '静态横幅', '30+虚拟形象', 'UGC风格', 'A/B测试', '自动优化'].map(tag => (
            <span key={tag} className="text-[10px] bg-rose-500/10 text-rose-400 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 龙虾 OpenClaw 官方操作面板快捷入口 */}
      <div className="glass-card p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border border-cyan-500/30 flex items-center justify-center text-2xl">
              🦞
            </div>
            <div>
              <button onClick={() => setShowMasterControl(true)} className="flex items-center gap-2 bg-gradient-to-r from-cyan-700/60 to-blue-700/60 hover:from-cyan-700 hover:to-blue-700 text-white text-xs px-3 py-1.5 rounded-lg transition-all border border-cyan-500/30 shadow shadow-cyan-500/10 mr-3">🌀 太极总控</button>
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
    </>
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

// ── 智能体集群视图 ───────────────────────────────────────────────
function AgentsView({ status, health, onTabChange }: { status: SystemStatus; health: HealthReport | null; onTabChange: (tab: AppTab) => void }) {
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showNLDialog, setShowNLDialog] = useState(false);
  const palaceNames: Record<string, string> = {
    '乾宫': '⚔️', '坤宫': '📝', '震宫': '🎨', '巽宫': '⚙️',
    '坎宫': '🚀', '离宫': '📊', '艮宫': '🏔️', '兑宫': '🦞',
  };

  // 键盘快捷键：Ctrl/Cmd + K 打开自然语言创建
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowNLDialog(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 工作流编辑器全屏模式
  if (showWorkflow) {
    return (
      <div className="h-[calc(100vh-7rem)]">
        <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setShowWorkflow(false)}
            className="text-sm text-slate-400 hover:text-white flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >← 返回智能体集群</button>
          <div className="h-4 w-px bg-slate-700" />
          <span className="text-xs text-slate-500">🌀 工作流编排 · 基于64卦智能体集群系统</span>
        </div>
        <div className="h-full">
          <WorkflowEditor />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 🌍 GEO 系统入口 — 打开内置 GEO 面板 */}
      <button
        onClick={() => { onTabChange('settings'); setTimeout(() => { const btn = document.querySelector('[data-settings-tab="geomarketing"]') as HTMLButtonElement; if (btn) btn.click(); }, 150); }}
        className="w-full text-left block glass-card p-5 border border-emerald-500/30 hover:border-emerald-400/50 transition-all group"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
              🌍
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>GEO · AI可见性营销系统</span>
                <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Dageno</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">BotSight · Prompt Gap Radar · Citation Share · 全引擎可见性监测 · 深度集成控制台</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-xs text-emerald-400 font-medium">🤖 AI可见性 · 🔍 BotSight · 📊 Prompt Gap</div>
              <div className="text-[10px] text-slate-500">内置控制台 · 快速入口</div>
            </div>
            <span className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 border border-emerald-500/30">
              <span>🗺️</span>
              <span>打开 GEO 系统</span>
              <span className="text-[10px] opacity-70">→</span>
            </span>
          </div>
        </div>
      </button>

      {/* 八爪鱼RPA × 64卦虾群入口 */}
      <div className="glass-card p-5 border border-cyan-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-2xl">
              🐸
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>八爪鱼RPA × SIMIAICLAW</span>
                <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">巽宫·执行卦</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">AI写流程3.0 · 竞品监控全自动闭环 · 飞书落库 · 二次AI分析</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-xs text-cyan-400 font-medium">🐸 八爪鱼3.0 + 64卦虾群</div>
              <div className="text-[10px] text-slate-500">rpa.bazhuayu.com</div>
            </div>
            <button
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const event = new CustomEvent('bazhuyu-tab');
                  window.dispatchEvent(event);
                  // 模拟tab切换
                  document.querySelectorAll('[data-settings-tab]').forEach(el => {
                    if (el.getAttribute('data-settings-tab') === 'bazhuyurpa') el.dispatchEvent(new MouseEvent('click'));
                  });
                }, 150);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
            >
              <span>🐸</span>
              <span>打开RPA控制台</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['竞品监控', '达人库抓取', '差评分析', '动态定价', 'Listing优化', '飞书日报'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const tabs = document.querySelectorAll('button');
                  tabs.forEach(el => {
                    if (el.textContent?.includes('八爪鱼RPA') && el.textContent?.includes('设置')) {
                      (el as HTMLElement).click();
                    }
                  });
                }, 100);
              }}
              className="text-[10px] bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded-full border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* 虎步RPA × 64卦虾群入口（紫鸟生态·亚马逊专用） */}
      <div className="glass-card p-5 border border-orange-500/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-600/30 to-amber-600/30 border border-orange-500/30 flex items-center justify-center text-2xl">
              🐯
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span>虎步RPA × SIMIAICLAW</span>
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">巽宫·双引擎</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">紫鸟生态 · API自动化 · 亚马逊跨境电商专用 · 6大预置模板</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:block text-right">
              <div className="text-xs text-orange-400 font-medium">🐯 虎步RPA + 64卦虾群</div>
              <div className="text-[10px] text-slate-500">huburpa.com · 紫鸟API</div>
            </div>
            <button
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const tabs = document.querySelectorAll('button');
                  tabs.forEach(el => {
                    if (el.textContent?.includes('虎步RPA') && el.textContent?.includes('设置')) {
                      (el as HTMLElement).click();
                    }
                  });
                }, 100);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-orange-500/20 border border-orange-500/30"
            >
              <span>🐯</span>
              <span>打开虎步控制台</span>
            </button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {['竞品销售', '订单抓取', '差评分析', '动态定价', '库存预警', '主图对比'].map(tag => (
            <button
              key={tag}
              onClick={() => {
                onTabChange('settings');
                setTimeout(() => {
                  const tabs = document.querySelectorAll('button');
                  tabs.forEach(el => {
                    if (el.textContent?.includes('虎步RPA') && el.textContent?.includes('设置')) {
                      (el as HTMLElement).click();
                    }
                  });
                }, 100);
              }}
              className="text-[10px] bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 px-2.5 py-1 rounded-full border border-orange-500/20 hover:border-orange-500/40 transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

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
              <span className="text-xl">✨</span> 自然语言生成智能体集群
            </h3>
            <p className="text-xs text-slate-500 mt-1">用自然语言描述需求，AI 自动构建 Agent + Skill 包</p>
          </div>
          <button
            onClick={() => setShowNLDialog(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-indigo-500/20 border border-indigo-500/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0"
            title="⌘K / Ctrl+K 快速打开"
          >
            <span>⚡</span>
            <span>自然语言创建</span>
            <span className="text-[10px] opacity-60 bg-indigo-950/60 px-1.5 py-0.5 rounded">⌘K</span>
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
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={() => setShowNLDialog(true)}
              className="flex items-center gap-2 bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/50 hover:border-indigo-500/50 rounded-lg px-3 py-1.5 text-left transition-all duration-200 hover:scale-[1.03] hover:shadow-sm hover:shadow-indigo-500/10 animate-fade-in-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <span className="text-base">{item.icon}</span>
              <div>
                <div className="text-xs font-medium text-white leading-tight">{item.label}</div>
                <div className="text-[9px] text-slate-500 hover:text-slate-400">{item.desc}</div>
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
            <p className="text-xs text-slate-500 mt-1">基于64卦智能体集群系统的可视化工作流编排与执行引擎</p>
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
            { emoji: '🌐', name: '跨境电商全链路', color: 'from-cyan-700/50 to-blue-700/50 border-cyan-500/30', count: 10, glow: 'hover:shadow-cyan-500/30' },
            { emoji: '📝', name: '内容矩阵生产', color: 'from-violet-700/50 to-purple-700/50 border-violet-500/30', count: 9, glow: 'hover:shadow-violet-500/30' },
            { emoji: '🎬', name: '爆款视频工厂', color: 'from-pink-700/50 to-rose-700/50 border-pink-500/30', count: 9, glow: 'hover:shadow-pink-500/30' },
            { emoji: '🏔️', name: '品牌IP打造', color: 'from-amber-700/50 to-orange-700/50 border-amber-500/30', count: 8, glow: 'hover:shadow-amber-500/30' },
            { emoji: '🦞', name: '虾群协作推广', color: 'from-emerald-700/50 to-teal-700/50 border-emerald-500/30', count: 10, glow: 'hover:shadow-emerald-500/30' },
            { emoji: '🔍', name: '选品调研链路', color: 'from-red-700/50 to-orange-700/50 border-red-500/30', count: 8, glow: 'hover:shadow-red-500/30' },
            { emoji: '🎨', name: '视觉内容工厂', color: 'from-purple-700/50 to-fuchsia-700/50 border-purple-500/30', count: 8, glow: 'hover:shadow-purple-500/30' },
            { emoji: '📊', name: '数据分析复盘', color: 'from-blue-700/50 to-indigo-700/50 border-blue-500/30', count: 9, glow: 'hover:shadow-blue-500/30' },
          ].map((t, i) => (
            <button
              key={t.name}
              onClick={() => setShowWorkflow(true)}
              className={`bg-gradient-to-br ${t.color} rounded-xl p-3 text-left hover:scale-[1.04] hover:-translate-y-0.5 transition-all duration-200 border ${t.glow} shadow-lg animate-fade-in-up`}
              style={{ animationDelay: `${i * 60}ms` }}
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
        {status.agents.byPalace.map(({ palace, count }: { palace: string; count: number }, idx: number) => (
          <div
            key={palace}
            className="glass-card p-4 flex items-center justify-between hover:border-cyan-500/30 transition-all duration-300 group"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl group-hover:scale-110 transition-transform duration-200">{palaceNames[palace] || '🌐'}</span>
              <div>
                <div className="font-medium text-white">{palace}</div>
                <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">{count} 个智能体集群</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full animate-pulse"
                  style={{ width: count > 0 ? `${Math.min(100, count * 10)}%` : '0%' }}
                />
              </div>
              <span className="text-xs font-mono text-emerald-400">{count}</span>
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
