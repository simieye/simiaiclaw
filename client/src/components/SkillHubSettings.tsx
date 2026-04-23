/**
 * SkillHub 集成设置面板
 * 对接 https://www.skillhub.club，支持浏览/搜索/一键安装 Skills
 * 到 AI Agent 和 64卦工作流编排中
 */
import React, { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_BASE || '/api';
const SKILLHUB_BASE = 'https://www.skillhub.club/api/v1';

interface SkillHubSkill {
  id?: string;
  slug: string;
  name: string;
  description: string;
  author?: string;
  stars?: number;
  rating?: number;
  category?: string;
  tags?: string[];
  icon?: string;
  installCommand?: string;
  previewUrl?: string;
  rank?: number;
}

interface InstalledSkill {
  slug: string;
  targetAgent: string;
  targetType: string;
  hexagramId?: string;
  installedAt: string;
  source: string;
}

type ViewTab = 'catalog' | 'search' | 'trending' | 'installed';
type InstallTarget = 'claude' | 'cursor' | 'codex' | 'gemini' | 'windsurf' | 'workflow' | 'hexagram';

const AGENT_OPTIONS: { value: InstallTarget; label: string; icon: string }[] = [
  { value: 'claude', label: 'Claude Code', icon: '🤖' },
  { value: 'cursor', label: 'Cursor', icon: '🎯' },
  { value: 'codex', label: 'Codex CLI', icon: '⚡' },
  { value: 'gemini', label: 'Gemini CLI', icon: '🌟' },
  { value: 'windsurf', label: 'Windsurf', icon: '🌊' },
  { value: 'workflow', label: '工作流编排', icon: '🌀' },
  { value: 'hexagram', label: '64卦节点', icon: '🥠' },
];

const CATEGORIES = [
  { value: '', label: '全部', emoji: '🌐' },
  { value: 'frontend', label: '前端开发', emoji: '🎨' },
  { value: 'backend', label: '后端开发', emoji: '⚙️' },
  { value: 'fullstack', label: '全栈开发', emoji: '🚀' },
  { value: 'devops', label: 'DevOps', emoji: '🛠️' },
  { value: 'data', label: '数据/AI', emoji: '📊' },
  { value: 'writing', label: '技术写作', emoji: '✍️' },
  { value: 'design', label: '设计', emoji: '🎭' },
  { value: 'productivity', label: '效率工具', emoji: '⚡' },
];

const RATING_STARS = (rating?: number) => {
  if (!rating) return '—';
  const stars = Math.round(rating);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
};

function SkillCard({
  skill,
  onInstall,
  onPreview,
}: {
  skill: SkillHubSkill;
  onInstall: (skill: SkillHubSkill) => void;
  onPreview: (skill: SkillHubSkill) => void;
}) {
  const [installing, setInstalling] = useState(false);
  const [showTarget, setShowTarget] = useState(false);

  const handleInstall = () => {
    if (skill.slug.includes(' ')) {
      toast.error('技能标识无效');
      return;
    }
    setShowTarget(true);
  };

  const confirmInstall = async (target: InstallTarget) => {
    setInstalling(true);
    setShowTarget(false);
    try {
      const res = await fetch(`${API}/skillhub/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          skillSlug: skill.slug,
          targetAgent: target,
          targetType: target === 'workflow' ? 'workflow' : target === 'hexagram' ? 'hexagram' : 'agent',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ ${skill.name} 已安装到 ${AGENT_OPTIONS.find(a => a.value === target)?.label}`);
      } else {
        toast.error(data.error || '安装失败');
      }
    } catch (e) {
      toast.error('安装请求失败: ' + String(e));
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="glass-card p-4 flex flex-col gap-3 hover:bg-white/[0.03] transition-colors group">
      {/* 头部：图标 + 名称 */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600/30 to-violet-600/30 border border-indigo-500/30 flex items-center justify-center text-lg shrink-0">
          {skill.icon || '⚡'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-semibold text-white leading-tight">{skill.name}</h4>
            {skill.rank && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">
                TOP{skill.rank}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {skill.stars !== undefined && (
              <span className="text-xs text-amber-400">★ {skill.stars}</span>
            )}
            {skill.rating !== undefined && (
              <span className="text-xs text-amber-400">{RATING_STARS(skill.rating)}</span>
            )}
            {skill.category && (
              <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">
                {skill.category}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 描述 */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{skill.description}</p>

      {/* 标签 */}
      {skill.tags && skill.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.tags.slice(0, 4).map(tag => (
            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* 操作 */}
      <div className="flex items-center gap-2 pt-1 border-t border-white/5">
        <button
          onClick={() => onPreview(skill)}
          className="flex-1 text-xs text-slate-400 hover:text-white py-1.5 rounded-lg hover:bg-white/5 transition-colors"
        >
          预览
        </button>
        <button
          onClick={handleInstall}
          disabled={installing}
          className="flex-1 text-xs font-medium bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-1.5 rounded-lg transition-all disabled:opacity-50"
        >
          {installing ? '安装中...' : '⚡ 一键安装'}
        </button>
      </div>

      {/* 目标选择弹层 */}
      {showTarget && (
        <div className="border border-indigo-500/30 rounded-xl p-3 bg-slate-900/80 space-y-1.5">
          <p className="text-xs text-slate-400 mb-2">选择安装目标：</p>
          {AGENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => confirmInstall(opt.value)}
              className="w-full flex items-center gap-2.5 text-xs text-slate-300 hover:text-white hover:bg-indigo-600/20 py-1.5 px-2.5 rounded-lg transition-colors"
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              <span className="ml-auto text-[10px] text-slate-500">→ ~/.{opt.value}/skills/</span>
            </button>
          ))}
          <button
            onClick={() => setShowTarget(false)}
            className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 mt-1"
          >
            取消
          </button>
        </div>
      )}
    </div>
  );
}

function SkillPreviewModal({
  skill,
  onClose,
  onInstall,
}: {
  skill: SkillHubSkill;
  onClose: () => void;
  onInstall: (skill: SkillHubSkill) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto">
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600/40 to-violet-600/40 border border-indigo-500/40 flex items-center justify-center text-2xl">
              {skill.icon || '⚡'}
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">{skill.name}</h3>
              {skill.author && <p className="text-xs text-slate-400 mt-0.5">by {skill.author}</p>}
              <div className="flex items-center gap-3 mt-1">
                {skill.stars !== undefined && (
                  <span className="text-xs text-amber-400">★ {skill.stars} stars</span>
                )}
                {skill.rating !== undefined && (
                  <span className="text-xs text-amber-400">{RATING_STARS(skill.rating)}</span>
                )}
                {skill.category && (
                  <span className="text-xs text-slate-500">{skill.category}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white shrink-0 mt-1">✕</button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-xs text-slate-400 mb-1.5">📝 描述</h4>
            <p className="text-sm text-slate-300 leading-relaxed">{skill.description}</p>
          </div>

          {skill.tags && skill.tags.length > 0 && (
            <div>
              <h4 className="text-xs text-slate-400 mb-1.5">🏷️ 标签</h4>
              <div className="flex flex-wrap gap-1.5">
                {skill.tags.map(tag => (
                  <span key={tag} className="text-xs px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {skill.installCommand && (
            <div>
              <h4 className="text-xs text-slate-400 mb-1.5">💻 安装命令</h4>
              <code className="block text-xs bg-slate-900 text-cyan-400 px-3 py-2 rounded-lg font-mono break-all">
                {skill.installCommand}
              </code>
            </div>
          )}

          <div className="glass-card p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
            <h4 className="text-xs text-indigo-300 mb-2">🌀 安装到 64卦智能体系统</h4>
            <p className="text-xs text-slate-400 mb-3">
              可将此 Skill 安装到 Claude Code、Cursor 等主流 Agent，或直接添加到工作流编排节点
            </p>
            <button
              onClick={() => { onClose(); onInstall(skill); }}
              className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition-all"
            >
              ⚡ 一键安装到智能体
            </button>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 flex items-center justify-between">
          <a
            href={`https://www.skillhub.club/skills/${skill.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            🌐 在 SkillHub 查看 ↗
          </a>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-4 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function SkillHubSettings() {
  const [activeTab, setActiveTab] = useState<ViewTab>('catalog');
  const [skills, setSkills] = useState<SkillHubSkill[]>([]);
  const [installed, setInstalled] = useState<InstalledSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SkillHubSkill[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewSkill, setPreviewSkill] = useState<SkillHubSkill | null>(null);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const LIMIT = 24;
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCatalog();
    loadInstalled();
  }, [selectedCategory, offset]);

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(offset),
        sort: activeTab === 'trending' ? 'stars' : 'composite',
      });
      if (selectedCategory) params.set('category', selectedCategory);
      const res = await fetch(`${API}/skillhub/catalog?${params}`);
      const data = await res.json();
      if (data.skills) {
        setSkills(data.skills);
        setTotal(data.total || data.skills.length);
      } else if (data.results) {
        setSkills(data.results);
        setTotal(data.results.length);
      } else {
        setSkills([]);
      }
    } catch (e) {
      console.error('[SkillHub] load catalog error:', e);
      toast.error('加载技能目录失败，请检查网络');
    }
    setLoading(false);
  };

  const loadInstalled = async () => {
    try {
      const res = await fetch(`${API}/skillhub/installed`, { credentials: 'include' });
      const data = await res.json();
      setInstalled(data.skills || []);
    } catch (e) {
      console.error('[SkillHub] load installed error:', e);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`${API}/skillhub/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: searchQuery, limit: 30, category: selectedCategory || undefined }),
      });
      const data = await res.json();
      setSearchResults(data.results || data.skills || []);
    } catch (e) {
      toast.error('搜索失败: ' + String(e));
    }
    setSearching(false);
  };

  const handleInstall = (skill: SkillHubSkill) => {
    setPreviewSkill(skill);
  };

  const handleQuickInstall = async (slug: string, agent: string = 'claude') => {
    try {
      const res = await fetch(`${API}/skillhub/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ skillSlug: slug, targetAgent: agent }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ ${slug} 已安装`);
        loadInstalled();
      } else {
        toast.error(data.error || '安装失败');
      }
    } catch (e) {
      toast.error('安装失败');
    }
  };

  const displaySkills = activeTab === 'search' ? searchResults : skills;

  const TABS: { id: ViewTab; label: string; icon: string }[] = [
    { id: 'catalog', label: '技能市场', icon: '🏪' },
    { id: 'trending', label: '热门趋势', icon: '🔥' },
    { id: 'search', label: '智能搜索', icon: '🔍' },
    { id: 'installed', label: '我的安装', icon: '📦' },
  ];

  return (
    <div className="space-y-5">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <span className="text-xl">⚡</span> SkillHub 技能市场
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            87K+ Skills · 对接 <a href="https://www.skillhub.club" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">skillhub.club</a> · 一键安装到 AI Agent & 工作流
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
            🟢 API 已连接
          </span>
          <span className="text-xs text-slate-500">|</span>
          <span className="text-xs text-slate-400">{installed.length} 个已安装</span>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '技能总数', value: '87K+', color: 'text-indigo-400', icon: '⚡' },
          { label: '已安装', value: String(installed.length), color: 'text-emerald-400', icon: '✅' },
          { label: '开发者', value: '10+', color: 'text-amber-400', icon: '🤖' },
          { label: 'S/A 级', value: '50+', color: 'text-pink-400', icon: '🏆' },
        ].map(s => (
          <div key={s.label} className="glass-card p-3 text-center">
            <div className={`text-lg font-bold ${s.color}`}>{s.icon} {s.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* 标签导航 */}
      <div className="flex items-center gap-2">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setOffset(0); if (tab.id === 'search') searchInputRef.current?.focus(); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 搜索栏（仅搜索标签页显示主搜索框） */}
      {activeTab === 'search' && (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="用自然语言描述你需要的功能，如：PDF处理、前端组件生成..."
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-400 disabled:opacity-30"
            >
              {searching ? (
                <span className="animate-spin inline-block">⟳</span>
              ) : (
                <span>🔍</span>
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium px-5 py-3 rounded-xl transition-colors"
          >
            {searching ? '搜索中...' : '搜索'}
          </button>
        </form>
      )}

      {/* 分类过滤器 */}
      {activeTab !== 'search' && activeTab !== 'installed' && (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => (
            <button
              key={cat.value}
              onClick={() => { setSelectedCategory(cat.value); setOffset(0); }}
              className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                selectedCategory === cat.value
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* 内容区域 */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-700" />
                <div className="flex-1"><div className="h-4 bg-slate-700 rounded w-3/4 mb-1.5" /><div className="h-3 bg-slate-700 rounded w-1/2" /></div>
              </div>
              <div className="h-3 bg-slate-700 rounded w-full mb-1.5" />
              <div className="h-3 bg-slate-700 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : activeTab === 'installed' ? (
        /* 已安装技能 */
        installed.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-slate-400 text-sm">暂无已安装的 SkillHub 技能</p>
            <p className="text-xs text-slate-500 mt-1">从上方市场安装技能，一键部署到你的 Agent</p>
            <button
              onClick={() => setActiveTab('catalog')}
              className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl transition-colors"
            >
              浏览技能市场
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <h4 className="text-xs text-slate-400 font-medium">已从 SkillHub 安装的技能</h4>
            {installed.map(skill => (
              <div key={`${skill.slug}-${skill.targetAgent}`} className="glass-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600/30 to-teal-600/30 border border-emerald-500/30 flex items-center justify-center text-lg">
                  ⚡
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white text-sm">{skill.slug}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {AGENT_OPTIONS.find(a => a.value === skill.targetAgent)?.label || skill.targetAgent}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                      {skill.targetType}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">
                      安装于 {new Date(skill.installedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`https://www.skillhub.club/skills/${skill.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-600/20 transition-colors"
                  >
                    查看详情 ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'search' && searchResults.length === 0 && !loading ? (
        <div className="glass-card p-10 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-400 text-sm">输入关键词，语义搜索 SkillHub 87K+ 技能</p>
          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            {['react component', 'PDF extraction', 'API design', 'data analysis', 'docker', 'CI/CD'].map(q => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {displaySkills.map((skill, i) => (
              <SkillCard
                key={`${skill.slug}-${i}`}
                skill={skill}
                onInstall={handleInstall}
                onPreview={setPreviewSkill}
              />
            ))}
          </div>

          {/* 分页 */}
          {displaySkills.length > 0 && total > LIMIT && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                显示 {offset + 1}-{Math.min(offset + LIMIT, total)} / 共 {total} 个
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - LIMIT))}
                  disabled={offset === 0}
                  className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  ← 上一页
                </button>
                <button
                  onClick={() => setOffset(offset + LIMIT)}
                  disabled={offset + LIMIT >= total}
                  className="text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  下一页 →
                </button>
              </div>
            </div>
          )}

          {displaySkills.length === 0 && !loading && (
            <div className="glass-card p-10 text-center">
              <div className="text-4xl mb-3">😔</div>
              <p className="text-slate-400 text-sm">未找到匹配的技能</p>
              <button onClick={() => { setSearchQuery(''); setActiveTab('catalog'); }} className="mt-3 text-xs text-indigo-400 hover:underline">
                返回技能市场
              </button>
            </div>
          )}
        </>
      )}

      {/* Skill 预览弹窗 */}
      {previewSkill && (
        <SkillPreviewModal
          skill={previewSkill}
          onClose={() => setPreviewSkill(null)}
          onInstall={handleInstall}
        />
      )}
    </div>
  );
}
