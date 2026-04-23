/**
 * OpenSpace 自进化智能体社区 + HeyGen Video Agent 管理面板
 * 对接 HKUDS/OpenSpace (https://github.com/HKUDS/OpenSpace) + HeyGen (https://developers.heygen.com/)
 */
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

// ── 类型 ──────────────────────────────────────────────────────
interface OpenSpaceStatus {
  installed: boolean;
  version?: string;
  dashboardUrl?: string;
  githubUrl?: string;
  features?: string[];
}

interface OpenSpaceCloudSkill {
  id: string;
  name: string;
  description?: string;
  author?: string;
  stars?: number;
  downloads?: number;
  version?: string;
  tags?: string[];
}

interface OpenSpaceLocalStats {
  total: number;
  byType: Record<string, number>;
  byLane: Record<string, number>;
  evolutionEnabled: boolean;
  cloudEnabled: boolean;
  dashboardUrl?: string;
}

interface HeyGenStatus {
  configured: boolean;
  endpoint?: string;
  docsUrl?: string;
  features?: string[];
}

interface HeyGenVideoResult {
  videoId?: string;
  status?: string;
  message?: string;
  success?: boolean;
}

interface HeyGenResource {
  id: string;
  name: string;
  type?: string;
  language?: string;
}

// ── API 调用 ────────────────────────────────────────────────────
const API_BASE = '/api';

async function openSpaceRequest<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts?.headers as Record<string, string> | undefined),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.detail || `请求失败: ${res.status}`);
  return data;
}

// ── 主组件 ──────────────────────────────────────────────────────
export function OpenSpacePanel() {
  const [activeTab, setActiveTab] = useState<'community' | 'local' | 'video'>('community');
  const [openspaceStatus, setOpenspaceStatus] = useState<OpenSpaceStatus | null>(null);
  const [localStats, setLocalStats] = useState<OpenSpaceLocalStats | null>(null);
  const [heygenStatus, setHeygenStatus] = useState<HeyGenStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [opsLoading, setOpsLoading] = useState(false);

  // 社区技能
  const [cloudSkills, setCloudSkills] = useState<OpenSpaceCloudSkill[]>([]);
  const [cloudSearch, setCloudSearch] = useState('');
  const [cloudLoading, setCloudLoading] = useState(false);

  // HeyGen 视频生成
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoResult, setVideoResult] = useState<HeyGenVideoResult | null>(null);
  const [videoGenerating, setVideoGenerating] = useState(false);
  const [heygenResources, setHeygenResources] = useState<{ avatars: HeyGenResource[]; voices: HeyGenResource[] } | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('');

  // 初始化
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [osStatus, local, heygen] = await Promise.all([
        openSpaceRequest<OpenSpaceStatus>('/openspace/status'),
        openSpaceRequest<OpenSpaceLocalStats>('/openspace/local/skills'),
        openSpaceRequest<HeyGenStatus>('/heygen/status'),
      ]);
      setOpenspaceStatus(osStatus);
      setLocalStats(local);
      setHeygenStatus(heygen);
    } catch (e) {
      console.error('[OpenSpace] load status error:', e);
    } finally {
      setLoading(false);
    }
  };

  // 加载云端技能
  const loadCloudSkills = useCallback(async (q = '') => {
    setCloudLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      const data = await openSpaceRequest<{ skills: OpenSpaceCloudSkill[]; total: number }>(
        `/openspace/cloud/skills?${params}`
      );
      setCloudSkills(data.skills || []);
    } catch {
      setCloudSkills([]);
    } finally {
      setCloudLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'community') {
      loadCloudSkills(cloudSearch);
    }
  }, [activeTab, cloudSearch, loadCloudSkills]);

  // 加载 HeyGen 资源
  const loadHeygenResources = async () => {
    try {
      const data = await openSpaceRequest<{ avatars: HeyGenResource[]; voices: HeyGenResource[] }>(
        '/heygen/resources'
      );
      setHeygenResources(data);
    } catch {
      // 未配置 API Key
    }
  };

  useEffect(() => {
    if (activeTab === 'video') {
      loadHeygenResources();
    }
  }, [activeTab]);

  // 下载云端技能
  const handleDownload = async (skillId: string) => {
    setOpsLoading(true);
    try {
      const result = await openSpaceRequest<{ success: boolean; skillId: string; result: unknown }>(
        '/openspace/cloud/download',
        { method: 'POST', body: JSON.stringify({ skillId }) }
      );
      toast.success(`✅ ${skillId} 下载成功！`);
      await loadCloudSkills(cloudSearch);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`下载失败: ${msg}`);
    } finally {
      setOpsLoading(false);
    }
  };

  // 生成视频
  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) {
      toast.error('请输入视频描述');
      return;
    }
    setVideoGenerating(true);
    setVideoResult(null);
    try {
      const result = await openSpaceRequest<HeyGenVideoResult>(
        '/heygen/video/generate',
        {
          method: 'POST',
          body: JSON.stringify({
            prompt: videoPrompt,
            avatarId: selectedAvatar || undefined,
            voiceId: selectedVoice || undefined,
          }),
        }
      );
      setVideoResult(result);
      if (result.success) {
        toast.success('🎬 视频生成任务已提交！');
      } else {
        toast.warning(result.message || '任务已提交，请等待处理');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`生成失败: ${msg}`);
    } finally {
      setVideoGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🧬</div>
          <p className="text-slate-400 text-sm">加载 OpenSpace 状态...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'community', label: '🌐 云端技能市场', desc: 'OpenSpace 社区技能' },
    { id: 'local', label: '🧠 本地知识库', desc: '自进化技能管理' },
    { id: 'video', label: '🎬 HeyGen 视频生成', desc: '自然语言一键生成视频' },
  ] as const;

  return (
    <div className="space-y-5">
      {/* 页面标题 */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🧬</span> OpenSpace × HeyGen 集成
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            HKUDS 自进化智能体社区 · 一键生成 AI 视频
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/HKUDS/OpenSpace"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            GitHub ↗
          </a>
          <a
            href="https://open-space.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-white flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            社区平台 ↗
          </a>
        </div>
      </div>

      {/* 状态卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${openspaceStatus?.installed ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-sm font-medium text-slate-300">OpenSpace 引擎</span>
          </div>
          <div className="text-lg font-bold text-white">
            {openspaceStatus?.installed ? `v${openspaceStatus.version?.trim() || '已安装'}` : '未安装'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {openspaceStatus?.installed ? '✅ 自进化引擎就绪' : '❌ 运行: pip install openspace-ai'}
          </div>
          {openspaceStatus?.installed && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(openspaceStatus.features || []).map(f => (
                <span key={f} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${localStats?.cloudEnabled ? 'bg-cyan-400' : 'bg-amber-400'}`} />
            <span className="text-sm font-medium text-slate-300">自进化知识库</span>
          </div>
          <div className="text-lg font-bold text-white">{localStats?.total || 0} 条知识</div>
          <div className="text-xs text-slate-500 mt-1">
            {localStats?.evolutionEnabled ? '🧬 自进化已启用' : '🔒 进化模式待激活'}
          </div>
          {localStats && Object.keys(localStats.byType).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(localStats.byType).slice(0, 3).map(([type, count]) => (
                <span key={type} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">{type} {count}</span>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className={`w-2 h-2 rounded-full ${heygenStatus?.configured ? 'bg-pink-400' : 'bg-red-400'}`} />
            <span className="text-sm font-medium text-slate-300">HeyGen Video Agent</span>
          </div>
          <div className="text-lg font-bold text-white">
            {heygenStatus?.configured ? '✅ API 已配置' : '⚠️ 需配置 Key'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            $0.033/秒 · 175+ 语言
          </div>
          {heygenStatus?.configured && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(heygenStatus.features || []).map(f => (
                <span key={f} className="text-[10px] bg-pink-500/10 text-pink-400 px-1.5 py-0.5 rounded">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 云端技能市场 ── */}
      {activeTab === 'community' && (
        <div className="space-y-4">
          {/* 安装指引 */}
          {!openspaceStatus?.installed && (
            <div className="glass-card p-4 border border-amber-500/20">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h3 className="text-sm font-semibold text-amber-400">安装 OpenSpace MCP 引擎</h3>
                  <div className="mt-2 text-xs text-slate-400 space-y-1">
                    <div className="font-mono bg-slate-800 rounded px-3 py-2 text-amber-300">
                      pip install openspace-ai
                    </div>
                    <div className="font-mono bg-slate-800 rounded px-3 py-2 text-amber-300">
                      git clone https://github.com/HKUDS/OpenSpace && cd OpenSpace && pip install -e .
                    </div>
                    <div className="mt-2 text-slate-500">
                      安装后 MCP 连接器中会自动出现 OpenSpace (HKUDS) 模板，连接后即可使用云端技能市场。
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 搜索栏 */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={cloudSearch}
                onChange={e => setCloudSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadCloudSkills(cloudSearch)}
                placeholder="搜索云端技能（如: code review, data analysis, agent...）"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => loadCloudSkills(cloudSearch)}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              🔍 搜索
            </button>
          </div>

          {/* 技能网格 */}
          {cloudLoading ? (
            <div className="text-center py-12 text-slate-500 text-sm">🧬 加载云端技能中...</div>
          ) : cloudSkills.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-slate-400 text-sm">未找到技能</div>
              <div className="text-slate-600 text-xs mt-1">请确保 OpenSpace 已安装并配置了 API Key</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cloudSkills.map(skill => (
                <div key={skill.id} className="glass-card p-4 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-white truncate">{skill.name}</span>
                        {skill.version && (
                          <span className="text-[10px] bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">v{skill.version}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-2 mb-2">
                        {skill.description || '暂无描述'}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {skill.author && <span>👤 {skill.author}</span>}
                        {skill.stars !== undefined && <span>⭐ {skill.stars}</span>}
                        {skill.downloads !== undefined && <span>📥 {skill.downloads}</span>}
                      </div>
                      {skill.tags && skill.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {skill.tags.slice(0, 4).map(tag => (
                            <span key={tag} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleDownload(skill.id)}
                        disabled={!openspaceStatus?.installed || opsLoading}
                        className="text-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap"
                      >
                        📥 下载
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 本地知识库 ── */}
      {activeTab === 'local' && (
        <div className="space-y-4">
          {/* OpenSpace 特性介绍 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { emoji: '🧬', title: 'Auto-Fix', desc: '技能损坏时自动修复', color: 'from-emerald-700/30 to-teal-700/30 border-emerald-500/20' },
              { emoji: '📈', title: 'Auto-Improve', desc: '成功模式演化为更好的技能', color: 'from-cyan-700/30 to-blue-700/30 border-cyan-500/20' },
              { emoji: '💡', title: 'Auto-Learn', desc: '从实际使用中捕获成功工作流', color: 'from-violet-700/30 to-purple-700/30 border-violet-500/20' },
              { emoji: '🌐', title: '集体智能', desc: '一人改进，所有人受益，网络效应', color: 'from-amber-700/30 to-orange-700/30 border-amber-500/20' },
            ].map(item => (
              <div key={item.title} className={`glass-card p-4 border ${item.color} rounded-xl`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-sm font-semibold text-white">{item.title}</span>
                </div>
                <div className="text-xs text-slate-400">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* 统计数据 */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">📊 知识库统计</h3>
            {localStats && localStats.total > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">{localStats.total}</div>
                    <div className="text-xs text-slate-500 mt-1">总条目</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">
                      {Object.keys(localStats.byType).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">类型</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      {Object.keys(localStats.byLane).length}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">赛道</div>
                  </div>
                </div>

                {Object.keys(localStats.byType).length > 0 && (
                  <div>
                    <div className="text-xs text-slate-500 mb-2">按类型分布</div>
                    <div className="space-y-1">
                      {Object.entries(localStats.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center gap-3 text-xs">
                          <span className="text-slate-400 w-16">{type}</span>
                          <div className="flex-1 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="h-full bg-cyan-500 rounded-full"
                              style={{ width: `${(Number(count) / localStats.total) * 100}%` }}
                            />
                          </div>
                          <span className="text-cyan-400 w-6 text-right">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">🧠</div>
                <div className="text-slate-400 text-sm">暂无本地知识条目</div>
                <div className="text-slate-600 text-xs mt-1">任务完成后会自动提炼知识存入知识库</div>
              </div>
            )}
          </div>

          {/* OpenSpace 仪表盘链接 */}
          <a
            href="https://open-space.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card p-4 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600/40 to-blue-600/40 flex items-center justify-center text-xl">
                🌐
              </div>
              <div>
                <div className="text-sm font-semibold text-white">open-space.cloud 社区平台</div>
                <div className="text-xs text-slate-500 mt-0.5">查看技能进化历史、版本血缘、质量指标、每日监控仪表板</div>
              </div>
            </div>
            <span className="text-cyan-400 text-sm group-hover:text-cyan-300 transition-colors">打开平台 ↗</span>
          </a>
        </div>
      )}

      {/* ── HeyGen 视频生成 ── */}
      {activeTab === 'video' && (
        <div className="space-y-5">
          {!heygenStatus?.configured ? (
            <div className="glass-card p-6 border border-red-500/20">
              <div className="flex items-start gap-4">
                <span className="text-3xl">🔑</span>
                <div>
                  <h3 className="text-sm font-semibold text-amber-400 mb-2">HeyGen API Key 未配置</h3>
                  <div className="text-xs text-slate-400 space-y-2">
                    <p>请在环境变量中设置 <code className="bg-slate-800 px-1 rounded text-amber-300">HEYGEN_API_KEY</code> 后重启服务</p>
                    <p className="text-slate-500">获取方式：登录 <a href="https://developers.heygen.com/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">developers.heygen.com</a> → API Key</p>
                    <div className="bg-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono text-[11px] mt-2">
                      # .env 文件<br />
                      HEYGEN_API_KEY=sk-xxxxx-your-key-here
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* 视频生成器 */}
              <div className="glass-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🎬</span>
                  <h3 className="text-sm font-semibold text-white">HeyGen Video Agent · 自然语言生成视频</h3>
                </div>

                {/* 提示词输入 */}
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-1.5">
                    视频描述 <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={videoPrompt}
                    onChange={e => setVideoPrompt(e.target.value)}
                    placeholder="用自然语言描述你想生成的视频，例如：创建一个产品介绍视频，主角是一位穿西装的女性数字人，用中文介绍我们的 AI 平台..."
                    rows={4}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 resize-none"
                  />
                  <div className="text-[10px] text-slate-600 mt-1">
                    提示：描述越详细，生成效果越好。支持 175+ 语言，自动生成脚本、选择数字人、配音
                  </div>
                </div>

                {/* 数字人和语音选择 */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">数字人（可选）</label>
                    <select
                      value={selectedAvatar}
                      onChange={e => setSelectedAvatar(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="">🤖 自动选择</option>
                      {heygenResources?.avatars?.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name} {a.language ? `(${a.language})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">语音（可选）</label>
                    <select
                      value={selectedVoice}
                      onChange={e => setSelectedVoice(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="">🔊 自动选择</option>
                      {heygenResources?.voices?.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} {v.language ? `(${v.language})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateVideo}
                  disabled={videoGenerating || !videoPrompt.trim()}
                  className="w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-pink-500/20 border border-pink-500/30"
                >
                  {videoGenerating ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span> 正在提交生成任务...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🎬 一键生成视频 · $0.033/秒
                    </span>
                  )}
                </button>

                {/* 生成结果 */}
                {videoResult && (
                  <div className={`mt-4 p-4 rounded-xl border ${
                    videoResult.success ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'
                  }`}>
                    <div className="text-sm font-medium text-white mb-2">
                      {videoResult.success ? '✅ 任务提交成功' : '⚠️ 任务已提交'}
                    </div>
                    {videoResult.videoId && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Video ID: <code className="bg-slate-800 px-1 rounded text-cyan-300">{videoResult.videoId}</code></div>
                        <div>状态: <span className="text-amber-400">{videoResult.status || 'processing'}</span></div>
                      </div>
                    )}
                    {videoResult.message && (
                      <div className="text-xs text-slate-400 mt-2">{videoResult.message}</div>
                    )}
                  </div>
                )}
              </div>

              {/* HeyGen 价格说明 */}
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-slate-300 mb-3">💰 HeyGen Video Agent 定价</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {[
                    { name: 'Video Agent', price: '$0.0333/秒', desc: '一句话生成完整视频' },
                    { name: 'Digital Twin', price: '$0.0667/秒', desc: '数字分身' },
                    { name: 'Photo Avatar', price: '$0.05/秒', desc: '照片数字人' },
                    { name: 'Voice TTS', price: '$0.000667/秒', desc: '语音合成' },
                  ].map(item => (
                    <div key={item.name} className="bg-slate-800/60 rounded-lg p-3 text-center">
                      <div className="text-pink-400 font-bold text-sm">{item.price}</div>
                      <div className="text-white font-medium mt-1">{item.name}</div>
                      <div className="text-slate-500 text-[10px] mt-0.5">{item.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-xs text-slate-600">
                  💡 起步价 $5，随用随付 · SOC 2 Type II + GDPR 合规 · 99.9% 可用性
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
