/**
 * AgentSkillPanel — 智能体与技能商店面板
 * 右上角设置入口，支持：
 *  1. 技能商店（官方/社区/自定义）
 *  2. 自然语言创建自定义 Agent
 *  3. 打赏激励系统
 */
import React, { useEffect, useState, useRef } from 'react';
import { api, type Skill, type CustomAgent } from '../api/client';
import { toast } from 'sonner';

// ── 类型 ──────────────────────────────────────────────────────

type SkillTab = 'store' | 'my-agents' | 'create';
type StoreTab = 'all' | 'official' | 'community' | 'custom';

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI 模型', developer: '开发工具', productivity: '效率工具',
  creative: '创意设计', business: '商业营销', integration: '集成类',
};

const CATEGORY_COLORS: Record<string, string> = {
  ai: 'bg-violet-500/20 text-violet-400',
  developer: 'bg-blue-500/20 text-blue-400',
  productivity: 'bg-emerald-500/20 text-emerald-400',
  creative: 'bg-pink-500/20 text-pink-400',
  business: 'bg-amber-500/20 text-amber-400',
  integration: 'bg-cyan-500/20 text-cyan-400',
};

const SOURCE_LABELS = { official: '🏛️ 官方', community: '🌐 社区', custom: '🔧 自定义' };

// ── 子组件：技能卡片 ─────────────────────────────────────────

function SkillCard({ skill, onInstall, onUninstall, onReward }: {
  skill: Skill;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onReward: (skill: Skill) => void;
}) {
  const [installing, setInstalling] = useState(false);
  const cat = skill.category || 'ai';

  const handleToggle = async () => {
    setInstalling(true);
    try {
      if (skill.isInstalled) {
        await onUninstall(skill.id);
      } else {
        await onInstall(skill.id);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 flex flex-col gap-3 hover:border-indigo-500/40 transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/5">
      {/* 头部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skill.icon || '⚡'}</span>
          <div>
            <h3 className="font-semibold text-sm text-white leading-tight">{skill.name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[cat] || 'bg-slate-600/50 text-slate-400'}`}>
                {CATEGORY_LABELS[cat] || cat}
              </span>
              <span className="text-[10px] text-slate-500">{SOURCE_LABELS[skill.source]}</span>
            </div>
          </div>
        </div>
        {skill.isFeatured && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium shrink-0">推荐</span>
        )}
      </div>

      {/* 描述 */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{skill.description}</p>

      {/* 标签 */}
      {skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-400">{tag}</span>
          ))}
        </div>
      )}

      {/* 统计 */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500">
        <span>📥 {skill.installCount.toLocaleString()}</span>
        <span>⭐ {skill.rating.toFixed(1)}</span>
        <span>🎁 {skill.rewardCount}次</span>
        {skill.rewardPool > 0 && <span>💰 打赏池 {skill.rewardPool.toLocaleString()}积分</span>}
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={handleToggle}
          disabled={installing}
          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all duration-150 ${
            skill.isInstalled
              ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          } disabled:opacity-50`}
        >
          {installing ? '...' : skill.isInstalled ? '已安装' : '安装'}
        </button>
        {skill.isInstalled && (
          <button
            onClick={() => onReward(skill)}
            className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-medium transition-colors"
          >
            🎁 打赏
          </button>
        )}
      </div>
    </div>
  );
}

// ── 子组件：自定义 Agent 卡片 ───────────────────────────────

function AgentCard({ agent, onDelete }: {
  agent: CustomAgent;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 flex items-start gap-3 hover:border-indigo-500/40 transition-all">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ backgroundColor: (agent.color || '#6366f1') + '22', border: `1px solid ${agent.color || '#6366f1'}44` }}
      >
        {agent.icon || '🤖'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm text-white truncate">{agent.name}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">自定义</span>
        </div>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{agent.description}</p>
        <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
          <span>💬 {agent.stats.totalChats}次对话</span>
          <span>📅 {new Date(agent.createdAt).toLocaleDateString('zh-CN')}</span>
        </div>
      </div>
      <button
        onClick={() => onDelete(agent.id)}
        className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
        title="删除"
      >
        ✕
      </button>
    </div>
  );
}

// ── 子组件：创建 Agent（自然语言）──────────────────────────

function CreateAgentForm({ onCreated }: { onCreated: (agent: CustomAgent) => void }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<CustomAgent | null>(null);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const { agent } = await api.createAgentFromNaturalLanguage(text);
      setPreview(agent);
      onCreated(agent);
      toast.success(`「${agent.name}」创建成功！`);
      setText('');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-400 mb-1.5 block">
          🤖 描述你想要创建的 AI 助手
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="例如：帮我创建一个跨境电商选品助手，专门分析亚马逊热销趋势..."
          rows={3}
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 resize-none"
        />
      </div>

      {preview && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-3">
          <p className="text-xs text-indigo-400 font-medium mb-1.5">✨ 预览</p>
          <p className="text-sm text-white font-semibold">{preview.icon} {preview.name}</p>
          <p className="text-xs text-slate-400 mt-1">{preview.description}</p>
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading || !text.trim()}
        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <><span className="animate-spin">⟳</span> AI 正在解析...</>
        ) : (
          <><span>⚡</span> 用自然语言创建 Agent</>
        )}
      </button>

      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
        <p className="text-xs font-medium text-slate-400 mb-2">💡 示例</p>
        {[
          '帮我分析 TikTok 爆款短视频的内容套路',
          '创建一个专业的外贸开发信撰写助手',
          '专门做亚马逊产品 A+ 内容优化的 AI',
          '帮我做小红书种草笔记的情感分析',
        ].map((example, i) => (
          <button
            key={i}
            onClick={() => setText(example)}
            className="block w-full text-left text-xs text-slate-500 hover:text-indigo-400 py-1 transition-colors"
          >
            → {example}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── 子组件：自定义 Skill 创建表单 ─────────────────────────

function CreateSkillForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('ai');
  const [tags, setTags] = useState('');
  const [instructions, setInstructions] = useState('');
  const [icon, setIcon] = useState('⚡');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name || !description) { toast.error('请填写名称和描述'); return; }
    setLoading(true);
    try {
      await api.createCustomSkill({
        name, description, category,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        instructions: instructions || undefined,
        icon,
      });
      toast.success('自定义技能创建成功！');
      onCreated();
      setName(''); setDescription(''); setTags(''); setInstructions('');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="text-xs text-slate-400 mb-1 block">技能名称</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="例如：选品助手"
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70" />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">图标</label>
          <input value={icon} onChange={e => setIcon(e.target.value)} maxLength={2}
            className="w-14 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-500/70" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">简短描述</label>
        <input value={description} onChange={e => setDescription(e.target.value)} placeholder="用一句话描述这个技能..."
          className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">分类</label>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/70">
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">标签（逗号分隔）</label>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="电商,选品,分析"
            className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70" />
        </div>
      </div>
      <div>
        <label className="text-xs text-slate-400 mb-1 block">技能指令（可选）</label>
        <textarea value={instructions} onChange={e => setInstructions(e.target.value)} placeholder="定义这个技能的具体行为和输出格式..."
          rows={3} className="w-full bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 resize-none" />
      </div>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-indigo-600 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? '创建中...' : '✨ 创建自定义技能'}
      </button>
    </div>
  );
}

// ── 主组件 ────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function AgentSkillPanel({ onClose }: Props) {
  const [skillTab, setSkillTab] = useState<SkillTab>('store');
  const [storeTab, setStoreTab] = useState<StoreTab>('all');
  const [search, setSearch] = useState('');
  const [skills, setSkills] = useState<Skill[]>([]);
  const [agents, setAgents] = useState<CustomAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [rewardModal, setRewardModal] = useState<Skill | null>(null);
  const [rewardAmount, setRewardAmount] = useState(10);
  const [rewarding, setRewarding] = useState(false);

  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 加载技能
  const loadSkills = async (src?: string, cat?: string) => {
    setLoading(true);
    try {
      const { skills: s } = await api.getSkills({ source: src !== 'all' ? src : undefined, search: search || undefined });
      setSkills(s);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 加载自定义 Agent
  const loadAgents = async () => {
    try {
      const { agents: a } = await api.getCustomAgents();
      setAgents(a);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (skillTab === 'store') {
      loadSkills(storeTab === 'all' ? undefined : storeTab === 'official' ? 'official' : storeTab === 'community' ? 'community' : 'custom');
    } else if (skillTab === 'my-agents') {
      loadAgents();
    }
  }, [skillTab, storeTab]);

  // 防抖搜索
  useEffect(() => {
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      if (skillTab === 'store') loadSkills(storeTab === 'all' ? undefined : storeTab);
    }, 350);
    return () => { if (searchRef.current) clearTimeout(searchRef.current); };
  }, [search]);

  const handleInstall = async (id: string) => {
    try {
      await api.installSkill(id);
      setSkills(s => s.map(sk => sk.id === id ? { ...sk, isInstalled: true, installCount: sk.installCount + 1 } : sk));
      toast.success('安装成功！');
    } catch (e) { toast.error(String(e)); }
  };

  const handleUninstall = async (id: string) => {
    try {
      await api.uninstallSkill(id);
      setSkills(s => s.map(sk => sk.id === id ? { ...sk, isInstalled: false, installCount: Math.max(0, sk.installCount - 1) } : sk));
      toast.success('已卸载');
    } catch (e) { toast.error(String(e)); }
  };

  const handleReward = async () => {
    if (!rewardModal) return;
    setRewarding(true);
    try {
      const { message } = await api.rewardSkill(rewardModal.id, rewardAmount);
      toast.success(message);
      setRewardModal(null);
    } catch (e) { toast.error(String(e)); }
    finally { setRewarding(false); }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      await api.deleteCustomAgent(id);
      setAgents(a => a.filter(ag => ag.id !== id));
      toast.success('已删除');
    } catch (e) { toast.error(String(e)); }
  };

  const handleAgentCreated = (agent: CustomAgent) => {
    setAgents(a => [agent, ...a]);
    setSkillTab('my-agents');
  };

  const handleSkillCreated = () => {
    loadSkills();
    setSkillTab('store');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ width: 'min(900px, 95vw)', height: 'min(680px, 88vh)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-base font-bold text-white">🤖 智能体 & 技能商店</h2>
            <p className="text-xs text-slate-500 mt-0.5">自定义 Agent · 技能市场 · 打赏激励</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-lg">✕</button>
        </div>

        {/* Tab 导航 */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-slate-800 bg-slate-900/50">
          {[
            { id: 'store' as SkillTab, label: '🏪 技能商店' },
            { id: 'my-agents' as SkillTab, label: '🤖 我的 Agent' },
            { id: 'create' as SkillTab, label: '✨ 新建' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSkillTab(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                skillTab === tab.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── 技能商店 ──────────────────────────────────── */}
          {skillTab === 'store' && (
            <div className="space-y-4">
              {/* 搜索 */}
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="搜索技能名称、标签..."
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70"
                />
              </div>

              {/* 子 Tab */}
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'official', 'community', 'custom'] as StoreTab[]).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStoreTab(tab)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      storeTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab === 'all' ? '全部' : tab === 'official' ? '🏛️ 官方' : tab === 'community' ? '🌐 社区' : '🔧 自定义'}
                  </button>
                ))}
                <span className="ml-auto text-xs text-slate-600">{skills.length} 个技能</span>
              </div>

              {/* 加载/空状态 */}
              {loading ? (
                <div className="flex items-center justify-center py-20 text-slate-500">
                  <span className="animate-spin mr-2">⟳</span> 加载中...
                </div>
              ) : skills.length === 0 ? (
                <div className="text-center py-20 text-slate-600">
                  <div className="text-4xl mb-3">🔍</div>
                  <p>暂无匹配的技能</p>
                  <p className="text-xs mt-1">试试其他关键词或切换分类</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {skills.map(skill => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      onInstall={handleInstall}
                      onUninstall={handleUninstall}
                      onReward={setRewardModal}
                    />
                  ))}
                </div>
              )}

              {/* 打赏激励 Banner */}
              <div className="bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/30 rounded-xl p-4 mt-2">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎁</span>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">打赏激励 · 创造独一无二的 Skill</p>
                    <p className="text-xs text-amber-200/60 mt-1">
                      精彩的自定义 Skill 可获得社区打赏支持，平台抽取 20% 运营费用，其余归创作者所有。
                      累积打赏可兑换真实奖励。
                    </p>
                    <div className="flex gap-3 mt-2 text-xs text-amber-200/70">
                      <span>💡 创作者获得 80%</span>
                      <span>🏛️ 平台支持 20%</span>
                      <span>💰 可兑换积分奖励</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 我的 Agent ─────────────────────────────────── */}
          {skillTab === 'my-agents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">🤖 我的自定义 Agent</h3>
                  <p className="text-xs text-slate-500 mt-0.5">通过自然语言创建，专属你的 AI 助手</p>
                </div>
                <button
                  onClick={() => setSkillTab('create')}
                  className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-500 transition-colors"
                >
                  + 新建 Agent
                </button>
              </div>

              {agents.length === 0 ? (
                <div className="text-center py-16 text-slate-600">
                  <div className="text-5xl mb-4">🤖</div>
                  <p className="text-sm font-medium">还没有自定义 Agent</p>
                  <p className="text-xs mt-1 text-slate-700">用自然语言描述你的需求，一键创建专属 AI 助手</p>
                  <button
                    onClick={() => setSkillTab('create')}
                    className="mt-4 text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    ⚡ 立即创建
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {agents.map(agent => (
                    <AgentCard key={agent.id} agent={agent} onDelete={handleDeleteAgent} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 新建 ───────────────────────────────────────── */}
          {skillTab === 'create' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 自然语言创建 Agent */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="text-sm font-semibold text-white">自然语言创建 Agent</p>
                      <p className="text-[10px] text-slate-500">AI 解析需求，自动生成配置</p>
                    </div>
                  </div>
                  <CreateAgentForm onCreated={handleAgentCreated} />
                </div>

                {/* 自定义 Skill */}
                <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">🔧</span>
                    <div>
                      <p className="text-sm font-semibold text-white">创建自定义 Skill</p>
                      <p className="text-[10px] text-slate-500">发布到技能商店获取打赏</p>
                    </div>
                  </div>
                  <CreateSkillForm onCreated={handleSkillCreated} />
                </div>
              </div>

              {/* 打赏激励说明 */}
              <div className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-4">
                <p className="text-sm font-semibold text-amber-400 mb-2">💰 Skill 打赏激励机制</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { icon: '📝', title: '编写 Skill', desc: '用指令定义能力' },
                    { icon: '🚀', title: '发布商店', desc: '设置关键词标签' },
                    { icon: '🎁', title: '获打赏', desc: '用户付费支持你' },
                  ].map((step, i) => (
                    <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                      <div className="text-xl mb-1">{step.icon}</div>
                      <p className="text-xs font-medium text-slate-300">{step.title}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{step.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-200/60 mt-3 text-center">
                  打赏分配：创作者获得 80% · 平台运营支持 20% · 可提现或兑换积分
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 打赏 Modal */}
      {rewardModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setRewardModal(null)}>
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 w-80 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">{rewardModal.icon}</div>
              <p className="font-semibold text-white">{rewardModal.name}</p>
              <p className="text-xs text-slate-500 mt-1">打赏支持创作者</p>
            </div>
            <div className="flex gap-2 mb-3 justify-center">
              {[5, 10, 20, 50].map(amt => (
                <button
                  key={amt}
                  onClick={() => setRewardAmount(amt)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    rewardAmount === amt ? 'bg-amber-500 text-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {amt}积分
                </button>
              ))}
            </div>
            <input
              type="number"
              value={rewardAmount}
              onChange={e => setRewardAmount(Number(e.target.value))}
              min={1}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white text-center mb-3 focus:outline-none focus:border-amber-500/70"
            />
            <div className="flex gap-2">
              <button onClick={() => setRewardModal(null)} className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                取消
              </button>
              <button
                onClick={handleReward}
                disabled={rewarding}
                className="flex-1 py-2 rounded-lg bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-colors flex items-center justify-center gap-1"
              >
                {rewarding ? '打赏中...' : <>🎁 确认打赏</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
