/**
 * LLM 统计面板 + Anthropic API Key 管理
 */
import React, { useEffect, useState } from 'react';
import { api } from '../api/client';

interface LLMStats {
  simulateMode: boolean;
  totalRequests: number;
  costUSD: number;
}

interface RoutingInfo {
  simulateMode: boolean;
  concurrentRequests: number;
  lowVolumeThreshold: number;
  primaryProvider: string;
  primaryModel: string;
  fallbackProvider: string;
  fallbackModel: string;
  providers: {
    anthropic: { available: boolean };
    openai: { available: boolean };
    ollama: { available: boolean; defaultModel: string; endpoint: string };
    huobao: { available: boolean; endpoint: string };
  };
  routeStrategy?: {
    description: string;
    rules: Array<{ condition: string; engine: string; cost: string; latency: string }>;
  };
  huobaoSignupUrl?: string;
  ollamaInstallUrl?: string;
}

interface AnthropicApiKey {
  id: string;
  created_at: string;
  created_by: { id: string; type: string };
  name: string;
  partial_key_hint: string;
  status: 'active' | 'inactive' | 'archived';
  type: 'api_key';
  workspace_id: string | null;
}

interface Props {
  stats: LLMStats;
}

export function LLMStatsPanel({ stats }: Props) {
  const [routing, setRouting] = useState<RoutingInfo | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiKeyResult, setApiKeyResult] = useState<AnthropicApiKey | null>(null);
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const [apiKeyHint, setApiKeyHint] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [allKeys, setAllKeys] = useState<AnthropicApiKey[]>([]);
  const [showApiPanel, setShowApiPanel] = useState(false);
  const [activeAnthropicTab, setActiveAnthropicTab] = useState<'lookup' | 'list'>('lookup');

  useEffect(() => {
    loadRouting();
  }, []);

  const loadRouting = async () => {
    try {
      const r = await api.getLLMRouting() as RoutingInfo;
      setRouting(r);
    } catch { /* ignore */ }
  };

  const handleLookupApiKey = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('请输入 API Key ID');
      setApiKeyResult(null);
      return;
    }
    setLoadingKey(true);
    setApiKeyError(null);
    setApiKeyHint(null);
    setApiKeyResult(null);
    try {
      const res = await api.getAnthropicApiKey(apiKeyInput.trim());
      if (res.success && res.data) {
        setApiKeyResult(res.data);
        setApiKeyError(null);
      } else {
        setApiKeyError(res.error || '查询失败');
        setApiKeyHint(res.hint || null);
      }
    } catch {
      setApiKeyError('网络请求失败，请稍后重试');
    }
    setLoadingKey(false);
  };

  const handleListKeys = async () => {
    setListLoading(true);
    try {
      const res = await api.listAnthropicApiKeys();
      if (res.success && res.keys) {
        setAllKeys(res.keys);
      } else {
        setApiKeyError(res.error || '获取列表失败');
        setApiKeyHint(res.hint || null);
      }
    } catch {
      setApiKeyError('网络请求失败');
    }
    setListLoading(false);
  };

  const statusColor = (status: string) => {
    if (status === 'active') return 'text-emerald-400';
    if (status === 'inactive') return 'text-amber-400';
    return 'text-slate-400';
  };

  const statusBg = (status: string) => {
    if (status === 'active') return 'bg-emerald-500/10 border-emerald-500/20';
    if (status === 'inactive') return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-slate-500/10 border-slate-500/20';
  };

  const providerIcon = (provider: string) => {
    const icons: Record<string, string> = {
      anthropic: '🧠', openai: '🤖', ollama: '🖥️', huobao: '🐯', simulate: '🎭',
    };
    return icons[provider] || '🔌';
  };

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">🧠 AI 模型使用统计</h3>
        <button
          onClick={() => { setShowApiPanel(v => !v); }}
          className="text-xs px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
        >
          {showApiPanel ? '收起' : 'Anthropic API Key'}
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.totalRequests}</div>
          <div className="text-xs text-slate-500">请求次数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-400">${stats.costUSD.toFixed(4)}</div>
          <div className="text-xs text-slate-500">累计成本</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${stats.simulateMode ? 'text-amber-400' : 'text-emerald-400'}`}>
            {stats.simulateMode ? '⚠️' : '✅'}
          </div>
          <div className="text-xs text-slate-500">{stats.simulateMode ? '模拟模式' : '真实AI'}</div>
        </div>
      </div>

      {/* 路由状态条 */}
      {routing && (
        <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/30">
          <div className="text-xs text-slate-400 mb-2 font-medium">⚡ 智能路由状态</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { label: '主引擎', value: `${providerIcon(routing.primaryProvider)} ${routing.primaryProvider}`, color: 'text-cyan-400' },
              { label: '备用引擎', value: `${providerIcon(routing.fallbackProvider)} ${routing.fallbackProvider}`, color: 'text-slate-400' },
              { label: '并发数', value: `${routing.concurrentRequests}/${routing.lowVolumeThreshold}`, color: routing.concurrentRequests > routing.lowVolumeThreshold ? 'text-amber-400' : 'text-emerald-400' },
              { label: 'Anthropic', value: routing.providers.anthropic.available ? '✅ 已连接' : '❌ 未配置', color: routing.providers.anthropic.available ? 'text-emerald-400' : 'text-slate-500' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center">
                <span className="text-slate-500">{item.label}</span>
                <span className={item.color}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Anthropic API Key 管理面板 */}
      {showApiPanel && (
        <div className="glass-card border border-cyan-500/20 p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-base">🧠</div>
            <div>
              <div className="text-sm font-semibold text-white">Anthropic API Key 管理</div>
              <div className="text-xs text-slate-400">查询 API Key 详情 · 状态监控 · 使用审计</div>
            </div>
          </div>

          {/* Tab 切换 */}
          <div className="flex gap-1 bg-slate-800/60 rounded-lg p-1">
            {[
              { id: 'lookup' as const, label: '🔍 查询单个 Key' },
              { id: 'list' as const, label: '📋 查看所有 Keys' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveAnthropicTab(tab.id);
                  setApiKeyError(null);
                  setApiKeyHint(null);
                  setApiKeyResult(null);
                  setAllKeys([]);
                }}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all ${activeAnthropicTab === tab.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-300'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 查询单个 Key */}
          {activeAnthropicTab === 'lookup' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={apiKeyInput}
                  onChange={e => setApiKeyInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLookupApiKey()}
                  placeholder="输入 API Key ID (如: ak_xxxxx...)"
                  className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                <button
                  onClick={handleLookupApiKey}
                  disabled={loadingKey}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs px-4 py-2 rounded-lg transition-all"
                >
                  {loadingKey ? <span className="animate-pulse">查询中...</span> : '查询'}
                </button>
              </div>

              {/* 错误提示 */}
              {apiKeyError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-red-400 mb-1">❌ {apiKeyError}</div>
                  {apiKeyHint && (
                    <div className="text-xs text-slate-400 mt-1">💡 {apiKeyHint}</div>
                  )}
                </div>
              )}

              {/* API Key 详情结果 */}
              {apiKeyResult && (
                <div className="rounded-xl bg-slate-800/80 border border-emerald-500/20 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${apiKeyResult.status === 'active' ? 'bg-emerald-400' : apiKeyResult.status === 'inactive' ? 'bg-amber-400' : 'bg-slate-500'} animate-pulse`} />
                      <span className={`text-xs font-medium ${statusColor(apiKeyResult.status)} uppercase`}>{apiKeyResult.status}</span>
                    </div>
                    <span className="text-xs text-slate-500">{providerIcon('anthropic')} Anthropic</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { label: 'Key ID', value: apiKeyResult.id, mono: true },
                      { label: '名称', value: apiKeyResult.name || '(未命名)', mono: false },
                      { label: '部分密钥', value: apiKeyResult.partial_key_hint, mono: true },
                      { label: '创建时间', value: new Date(apiKeyResult.created_at).toLocaleString('zh-CN'), mono: false },
                      { label: '创建者', value: `${apiKeyResult.created_by.type} · ${apiKeyResult.created_by.id.slice(0, 8)}...`, mono: false },
                      { label: 'Workspace ID', value: apiKeyResult.workspace_id || '默认工作区', mono: true },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between items-start text-xs gap-3">
                        <span className="text-slate-500 flex-shrink-0">{row.label}</span>
                        <span className={`text-slate-300 text-right break-all ${row.mono ? 'font-mono text-cyan-300' : ''}`}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* 状态操作建议 */}
                  <div className={`mt-2 p-2 rounded-lg border text-xs ${statusBg(apiKeyResult.status)} ${statusColor(apiKeyResult.status)}`}>
                    {apiKeyResult.status === 'active' && '✅ 此 Key 处于活跃状态，可正常调用 Anthropic API'}
                    {apiKeyResult.status === 'inactive' && '⚠️ 此 Key 处于非活跃状态，无法调用 API。请在 Anthropic Console 中重新激活。'}
                    {apiKeyResult.status === 'archived' && '🔒 此 Key 已被归档，无法使用。请创建新的 API Key。'}
                  </div>

                  {/* 操作链接 */}
                  <div className="flex gap-2 pt-1">
                    <a
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 transition-all"
                    >
                      🔗 Anthropic Console
                    </a>
                    <a
                      href="https://docs.anthropic.com/zh-CN/docs/admin-reference/api-keys/retrieve"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/30 transition-all"
                    >
                      📖 API 文档
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 列出所有 Keys */}
          {activeAnthropicTab === 'list' && (
            <div className="space-y-3">
              <button
                onClick={handleListKeys}
                disabled={listLoading}
                className="w-full bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 disabled:opacity-40 text-cyan-400 text-xs py-2 rounded-lg border border-cyan-500/20 transition-all"
              >
                {listLoading ? <span className="animate-pulse">加载中...</span> : '📋 获取所有 API Keys'}
              </button>

              {allKeys.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-slate-400 font-medium">共 {allKeys.length} 个 API Keys</div>
                  {allKeys.map(key => (
                    <div key={key.id} className={`rounded-lg p-3 border space-y-1.5 ${statusBg(key.status)}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${statusColor(key.status)} uppercase`}>{key.status}</span>
                        <span className="text-xs text-slate-500">{new Date(key.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="text-xs text-slate-300 font-mono truncate">{key.name || '(未命名)'} · {key.id}</div>
                      <div className="text-xs text-slate-500">{key.partial_key_hint}</div>
                    </div>
                  ))}
                </div>
              )}

              {apiKeyError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-red-400">{apiKeyError}</div>
                  {apiKeyHint && <div className="text-xs text-slate-400 mt-1">💡 {apiKeyHint}</div>}
                </div>
              )}

              {/* 说明 */}
              <div className="text-xs text-slate-500 p-3 bg-slate-800/40 rounded-lg">
                💡 <b className="text-slate-400">使用说明：</b>需要配置 <code className="bg-slate-700/50 px-1 rounded">ANTHROPIC_ADMIN_API_KEY</code> 环境变量。
                请在 <code className="bg-slate-700/50 px-1 rounded">.env</code> 文件中设置，可从{' '}
                <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                  Anthropic Console
                </a> 获取。
                此功能仅限管理员使用。
              </div>
            </div>
          )}
        </div>
      )}

      {/* 模拟模式提示 */}
      {stats.simulateMode && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <p className="text-xs text-amber-400">
            💡 当前为模拟模式，请在 <code className="bg-amber-500/10 px-1 rounded">.env</code> 中配置 <code className="bg-amber-500/10 px-1 rounded">ANTHROPIC_API_KEY</code> 以启用真实 AI
          </p>
        </div>
      )}
    </div>
  );
}
