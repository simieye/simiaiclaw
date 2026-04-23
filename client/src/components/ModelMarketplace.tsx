/**
 * AI 大模型市场 — 全球 1000+ 模型聚合
 * 支持：聊天、图像生成、视频生成、音频、嵌入等
 */
import React, { useEffect, useState, useCallback } from 'react';
import { api, type AIModel } from '../api/client';
import { toast } from 'sonner';

const PROVIDER_ICONS: Record<string, string> = {
  openai: '🤖', anthropic: '🧠', google: '🔍', deepseek: '🔮',
  local: '🖥️', ollama: '🦙', huobao: '🐯', other: '🌐',
};

const CAPABILITY_ICONS: Record<string, string> = {
  chat: '💬', image: '🖼️', video: '🎬', audio: '🔊',
  embedding: '📐', reasoning: '🧩', function: '⚡',
};

const TIER_COLORS: Record<string, string> = {
  free: 'text-emerald-400 bg-emerald-500/10',
  popular: 'text-amber-400 bg-amber-500/10',
  pro: 'text-indigo-400 bg-indigo-500/10',
  enterprise: 'text-purple-400 bg-purple-500/10',
};

const TIER_LABELS: Record<string, string> = {
  free: '免费', popular: '热门', pro: '专业', enterprise: '企业',
};

function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

export function ModelMarketplace() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provider, setProvider] = useState('');
  const [capability, setCapability] = useState('');
  const [tier, setTier] = useState('');
  const [providers, setProviders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [showConnect, setShowConnect] = useState(false);
  const [connectKey, setConnectKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [activeCap, setActiveCap] = useState('');
  const [routing, setRouting] = useState<any>(null);
  const [ollamaStatus, setOllamaStatus] = useState<any>(null);
  const [huobaoStatus, setHuobaoStatus] = useState<any>(null);
  const [ollamaLoading, setOllamaLoading] = useState(false);

  const loadModels = useCallback(async () => {
    setLoading(true);
    try {
      const filters: Record<string, string> = {};
      if (search) filters.search = search;
      if (provider) filters.provider = provider;
      if (capability) filters.capability = capability;
      if (tier) filters.tier = tier;
      const [mRes, pRes, sRes] = await Promise.all([
        api.getModels(filters),
        api.getModelProviders(),
        api.getModelStats(),
      ]);
      setModels(mRes.models);
      setProviders(pRes.providers);
      setStats(sRes);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [search, provider, capability, tier]);

  const debouncedLoad = useCallback(debounce(loadModels, 400), [loadModels]);

  useEffect(() => { debouncedLoad(); }, [debouncedLoad]);
  useEffect(() => {
    (async () => {
      try {
        const [pRes, sRes] = await Promise.all([api.getModelProviders(), api.getModelStats()]);
        setProviders(pRes.providers);
        setStats(sRes);
      } catch {}
    })();
  }, []);

  // 加载 LLM 智能路由状态
  useEffect(() => {
    (async () => {
      try {
        const [routingRes, ollamaRes, huobaoRes] = await Promise.all([
          api.getLLMRouting(),
          api.getOllamaStatus(),
          api.getHuobaoStatus(),
        ]);
        setRouting(routingRes);
        setOllamaStatus(ollamaRes);
        setHuobaoStatus(huobaoRes);
      } catch {}
    })();
  }, []);

  const handleStartOllama = async (useDocker = false) => {
    setOllamaLoading(true);
    try {
      const res = await api.startOllama(useDocker);
      toast.success(res.message);
      // 重新检测 Ollama 状态
      const status = await api.getOllamaStatus();
      setOllamaStatus(status);
    } catch (e) { toast.error(String(e)); }
    setOllamaLoading(false);
  };

  const handleConnect = async () => {
    if (!selectedModel || !connectKey.trim()) { toast.error('请输入 API Key'); return; }
    setConnecting(true);
    try {
      const res = await api.connectModel(selectedModel.id, connectKey);
      toast.success(res.message);
      setShowConnect(false);
      setConnectKey('');
      setSelectedModel(null);
      loadModels();
    } catch (e) { toast.error(String(e)); }
    setConnecting(false);
  };

  const handleDisconnect = async (id: string) => {
    await api.disconnectModel(id);
    toast.success('已断开连接');
    loadModels();
  };

  const capabilityFilter = (cap: string) => {
    if (activeCap === cap) setActiveCap('');
    else setActiveCap(cap);
    setCapability(activeCap === cap ? '' : cap);
  };

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div>
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          🌐 AI 大模型市场
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          全球 1000+ 大模型 · 文本 · 生图 · 生视频 · 音频 · 向量嵌入
        </p>
      </div>

      {/* ── Ollama + 火豹智能路由状态 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Ollama 本地大模型 */}
        <div className="glass-card p-4 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🦙</span>
              <div>
                <span className="text-sm font-semibold text-white">Ollama 本地大模型</span>
                <span className="ml-2 text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                  免费
                </span>
              </div>
            </div>
            {ollamaStatus?.available ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                运行中
              </span>
            ) : (
              <span className="text-xs text-slate-500">未运行</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-2">
            并发 ≤{routing?.lowVolumeThreshold} 时优先使用 · {ollamaStatus?.endpoint || 'http://localhost:11434'}
          </p>
          {ollamaStatus?.available ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {ollamaStatus.models?.map((m: string) => (
                <span key={m} className="text-xs bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2 mb-2">
              <p className="text-xs text-amber-300 mb-1">💡 尚未运行 Ollama</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                {ollamaStatus?.installHint?.split('·').join('\n') || '安装: https://ollama.com/download'}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            {!ollamaStatus?.available && (
              <>
                <button
                  onClick={() => window.open('https://ollama.com/download', '_blank')}
                  className="flex-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-1.5 rounded-lg transition-colors"
                >
                  📥 下载 Ollama
                </button>
                <button
                  onClick={() => handleStartOllama(false)}
                  disabled={ollamaLoading}
                  className="flex-1 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  ▶ 启动服务
                </button>
                <button
                  onClick={() => handleStartOllama(true)}
                  disabled={ollamaLoading}
                  className="flex-1 text-xs bg-slate-700/60 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  🐳 Docker
                </button>
              </>
            )}
            <button
              onClick={async () => {
                const models = await api.getOllamaModels();
                setOllamaStatus(models);
                toast.success('已刷新 Ollama 状态');
              }}
              className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1.5"
            >
              🔄
            </button>
          </div>
        </div>

        {/* 火豹 API 中转 */}
        <div className="glass-card p-4 border border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐯</span>
              <div>
                <span className="text-sm font-semibold text-white">火豹 API 中转</span>
                <span className="ml-2 text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">
                  付费
                </span>
              </div>
            </div>
            {huobaoStatus?.apiKeyConfigured ? (
              <span className="flex items-center gap-1 text-xs text-orange-400">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
                已配置
              </span>
            ) : (
              <span className="text-xs text-slate-500">未配置</span>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-2">
            并发 &gt;{routing?.lowVolumeThreshold} 时自动切换 · OpenAI 兼容接口 · 比官方省 30-70%
          </p>
          {huobaoStatus?.apiKeyConfigured ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {(huobaoStatus.supportedModels || ['gpt-4o', 'claude-3.5-sonnet', 'deepseek-chat']).map((m: string) => (
                <span key={m} className="text-xs bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded border border-orange-500/20">
                  {m}
                </span>
              ))}
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded p-2 mb-2">
              <p className="text-xs text-amber-300 mb-1">💡 需要配置火豹 API Key</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                高并发任务将自动路由到火豹 · 注册: huobaoapi.com/r/6hEy
              </p>
            </div>
          )}
          {!huobaoStatus?.apiKeyConfigured && (
            <div className="flex gap-2">
              <button
                onClick={() => window.open('https://huobaoapi.com/r/6hEy', '_blank')}
                className="flex-1 text-xs bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 py-1.5 rounded-lg transition-colors"
              >
                🐯 注册火豹 API
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 智能路由说明条 */}
      {routing && (
        <div className="glass-card p-3 flex items-center gap-3 text-xs">
          <span className="text-indigo-400 font-medium shrink-0">🧠 智能路由</span>
          <div className="flex items-center gap-2 flex-wrap">
            {routing.routeStrategy?.rules?.map((rule: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-slate-400">[{rule.condition}]</span>
                <span className="text-white font-medium">{rule.engine}</span>
                <span className="text-slate-500">·</span>
                <span className={rule.cost === '免费' ? 'text-emerald-400' : 'text-amber-400'}>{rule.cost}</span>
                {i < routing.routeStrategy.rules.length - 1 && (
                  <span className="text-slate-600 ml-1">→</span>
                )}
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <span className="text-slate-500">当前并发:</span>
            <span className={`font-bold ${routing.concurrentRequests <= routing.lowVolumeThreshold ? 'text-emerald-400' : 'text-amber-400'}`}>
              {routing.concurrentRequests}
            </span>
          </div>
        </div>
      )}

      {/* 全局统计 */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-indigo-400">{stats.totalModels}</div>
            <div className="text-xs text-slate-400">全部模型</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-emerald-400">{stats.connectedCount}</div>
            <div className="text-xs text-slate-400">已连接</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xl font-bold text-amber-400">{providers.length}</div>
            <div className="text-xs text-slate-400">模型厂商</div>
          </div>
        </div>
      )}

      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索模型名称、厂商、标签..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={provider}
          onChange={e => setProvider(e.target.value)}
          className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">全部厂商</option>
          {providers.map(p => (
            <option key={p.provider} value={p.provider}>{PROVIDER_ICONS[p.provider]} {p.name} ({p.count})</option>
          ))}
        </select>
        <select
          value={tier}
          onChange={e => setTier(e.target.value)}
          className="bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          <option value="">全部等级</option>
          {Object.entries(TIER_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* 能力标签筛选 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500">能力:</span>
        {Object.entries(CAPABILITY_ICONS).map(([cap, icon]) => (
          <button
            key={cap}
            onClick={() => capabilityFilter(cap)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              activeCap === cap
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            {icon} {cap}
          </button>
        ))}
      </div>

      {/* 模型列表 */}
      {loading ? (
        <div className="glass-card p-8 text-center text-slate-400 text-sm">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {models.length === 0 ? (
            <div className="col-span-2 glass-card p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <p className="text-slate-400 text-sm">未找到匹配的模型</p>
              <p className="text-slate-500 text-xs mt-1">尝试调整筛选条件</p>
            </div>
          ) : models.slice(0, 60).map(model => (
            <div key={model.id} className="glass-card p-4 flex items-start gap-3 hover:bg-white/3 transition-colors">
              {/* 头像/图标 */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                model.isConnected ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30' : 'bg-slate-700/50'
              }`}>
                {PROVIDER_ICONS[model.provider] || '🌐'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{model.name}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${TIER_COLORS[model.tier]}`}>
                    {TIER_LABELS[model.tier]}
                  </span>
                  {model.isConnected && (
                    <span className="text-xs text-emerald-400">🟢 已连接</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{model.providerName}</div>

                {/* 能力标签 */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {model.capabilities.map(cap => (
                    <span key={cap} className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">
                      {CAPABILITY_ICONS[cap]} {cap}
                    </span>
                  ))}
                  {model.quality && (
                    <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">⭐ {model.quality}</span>
                  )}
                </div>

                {/* 价格/上下文 */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                  {(model.pricePer1KInput !== undefined && model.pricePer1KInput > 0) && (
                    <span>💰 ${model.pricePer1KInput}/1K in · ${model.pricePer1KOutput}/1K out</span>
                  )}
                  {model.pricePer1KInput === 0 && (
                    <span className="text-emerald-400">🆓 免费</span>
                  )}
                  {model.contextWindow > 0 && (
                    <span>📏 {model.contextWindow >= 1000000 ? `${(model.contextWindow/1000000).toFixed(0)}M` : `${(model.contextWindow/1000).toFixed(0)}K`} ctx</span>
                  )}
                </div>
              </div>

              {/* 操作 */}
              <div className="shrink-0">
                {model.isConnected ? (
                  <button
                    onClick={() => handleDisconnect(model.id)}
                    className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    断开
                  </button>
                ) : (
                  <button
                    onClick={() => { setSelectedModel(model); setShowConnect(true); }}
                    className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    连接
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {models.length > 60 && (
        <p className="text-center text-xs text-slate-500">显示前 60 个模型，共 {models.length} 个结果</p>
      )}

      {/* 连接弹窗 */}
      {showConnect && selectedModel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md">
            <div className="p-5 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{PROVIDER_ICONS[selectedModel.provider] || '🌐'}</span>
                <div>
                  <h3 className="font-semibold text-white text-sm">连接 {selectedModel.name}</h3>
                  <p className="text-xs text-slate-400">{selectedModel.providerName} · {selectedModel.description}</p>
                </div>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  🔑 API Key <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={connectKey}
                  onChange={e => setConnectKey(e.target.value)}
                  placeholder={`输入 ${selectedModel.providerName} API Key`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1.5">
                  你的 API Key 将安全加密存储，仅用于调用 {selectedModel.name}
                </p>
              </div>
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                <p className="text-xs text-amber-300">⚡ 计费说明</p>
                <p className="text-xs text-slate-400 mt-1">
                  输入: {selectedModel.pricePer1KInput !== undefined && selectedModel.pricePer1KInput > 0
                    ? `$${selectedModel.pricePer1KInput}/1K tokens`
                    : '免费'}
                  {' · '}
                  输出: {selectedModel.pricePer1KOutput !== undefined && selectedModel.pricePer1KOutput > 0
                    ? `$${selectedModel.pricePer1KOutput}/1K tokens`
                    : '免费'}
                  {selectedModel.contextWindow > 0 && ` · 上下文窗口: ${(selectedModel.contextWindow/1000).toFixed(0)}K tokens`}
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-white/10 flex items-center justify-end gap-3">
              <button
                onClick={() => { setShowConnect(false); setConnectKey(''); setSelectedModel(null); }}
                className="text-xs text-slate-400 hover:text-white transition-colors px-3 py-2"
              >
                取消
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-2 rounded-lg transition-colors"
              >
                {connecting ? '连接中...' : '🔗 连接'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
