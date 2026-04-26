/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * AI 短剧工作室 — 专业创作面板
 */
import React, { useState, useEffect, useCallback } from 'react';
import { api, type StudioScript, type StudioCharacter, type StudioShot, type DramaGenre, type ScriptTemplateType } from '../api/client';
import { toast } from 'sonner';

// ── 类型定义 ────────────────────────────────────────────────

type WorkflowPhase = 1 | 2 | 3 | 4;
type ContentDomain = 'animation' | 'realistic' | 'comics';

interface ProjectConfig {
  title: string;
  genre: DramaGenre;
  template: ScriptTemplateType;
  synopsis: string;
  characterCount: number;
  shotCount: number;
  domain: ContentDomain;
}

// ── 常量 ────────────────────────────────────────────────────

const GENRES: { value: DramaGenre; label: string; emoji: string }[] = [
  { value: '霸总', label: '霸总', emoji: '💼' },
  { value: '甜宠', label: '甜宠', emoji: '💕' },
  { value: '重生', label: '重生', emoji: '🔄' },
  { value: '逆袭', label: '逆袭', emoji: '⚡' },
  { value: '穿越', label: '穿越', emoji: '🌀' },
  { value: '悬疑', label: '悬疑', emoji: '🔍' },
  { value: '复仇', label: '复仇', emoji: '🗡️' },
  { value: '职场', label: '职场', emoji: '🏢' },
  { value: '校园', label: '校园', emoji: '🎓' },
  { value: '玄幻', label: '玄幻', emoji: '🐉' },
  { value: '搞笑', label: '搞笑', emoji: '😂' },
  { value: '科幻', label: '科幻', emoji: '🚀' },
];

const TEMPLATES: { value: ScriptTemplateType; label: string; desc: string }[] = [
  { value: '爽文逆袭', label: '爽文逆袭', desc: '平凡少年觉醒，一路打脸升级' },
  { value: '霸总甜宠', label: '霸总甜宠', desc: '高冷总裁与倔强女孩的甜蜜日常' },
  { value: '复仇打脸', label: '复仇打脸', desc: '被陷害后重生，步步为营反击' },
  { value: '职场升职', label: '职场升职', desc: '职场小白逆袭成高管的热血故事' },
  { value: '穿越逆天', label: '穿越逆天', desc: '穿越异世界，凭现代知识称霸' },
  { value: '重生复仇', label: '重生复仇', desc: '重生回来，让仇人付出代价' },
  { value: '悬疑反转', label: '悬疑反转', desc: '层层悬念，真相令人震惊' },
  { value: '搞笑段子', label: '搞笑段子', desc: '轻松幽默，笑点密集不断' },
];

const CAMERAS = ['固定', '手持跟拍', '远景', '中景', '近景', '特写', '航拍'] as const;
const ANGLES = ['平视', '仰拍', '俯拍', '过肩', '荷兰角'] as const;
const VIDEO_MODELS = ['可灵', '即梦', 'Pika', 'Seedance', '即梦-图生视频', '可灵-图生视频'] as const;

const DOMAIN_LABELS: Record<ContentDomain, { label: string; emoji: string; desc: string }> = {
  animation: { label: 'AI 动画视频', emoji: '🎨', desc: '奇幻、科幻、古风、治愈、悬疑、喜剧等动画风格' },
  realistic: { label: 'AI 仿真人视频', emoji: '🎭', desc: '剧情短剧、数字主播、知识讲解、电商种草' },
  comics: { label: 'AI 漫画与静帧', emoji: '📚', desc: '热血格斗、少女恋爱、推理悬疑、恐怖灵异' },
};

// ── 子组件 ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: StudioShot['videoStatus'] }) {
  const map: Record<StudioShot['videoStatus'], { label: string; color: string; dot: string }> = {
    idle: { label: '待生成', color: 'text-slate-400 bg-slate-500/10 border-slate-500/20', dot: 'bg-slate-500' },
    generating: { label: '生成中', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400 animate-pulse' },
    done: { label: '已完成', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
    failed: { label: '失败', color: 'text-red-400 bg-red-500/10 border-red-500/20', dot: 'bg-red-400' },
  };
  const m = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full border font-medium ${m.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ── 主组件 ──────────────────────────────────────────────────

export function AIDramaStudioPanel({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<WorkflowPhase>(1);
  const [domain, setDomain] = useState<ContentDomain>('animation');
  const [scripts, setScripts] = useState<StudioScript[]>([]);
  const [characters, setCharacters] = useState<StudioCharacter[]>([]);
  const [activeScript, setActiveScript] = useState<StudioScript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingShotId, setGeneratingShotId] = useState<string | null>(null);
  const [leftTab, setLeftTab] = useState<'nav' | 'chars' | 'shots'>('nav');

  // 新建项目表单
  const [form, setForm] = useState<ProjectConfig>({
    title: '',
    genre: '逆袭',
    template: '爽文逆袭',
    synopsis: '',
    characterCount: 3,
    shotCount: 12,
    domain: 'animation',
  });

  // 加载数据
  useEffect(() => {
    loadScripts();
    loadCharacters();
  }, []);

  const loadScripts = async () => {
    setIsLoading(true);
    try {
      const data = await api.getStudioScripts();
      setScripts(data.scripts || []);
      if (data.scripts?.length > 0) {
        setActiveScript(data.scripts[0]);
      }
    } catch (e) {
      console.error('[DramaStudio] loadScripts error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCharacters = async () => {
    try {
      const data = await api.getStudioCharacters();
      setCharacters(data.characters || []);
    } catch (e) {
      console.error('[DramaStudio] loadCharacters error:', e);
    }
  };

  // AI 生成剧本
  const handleGenerateScript = async () => {
    if (!form.title.trim()) {
      toast.error('请输入剧本标题');
      return;
    }
    setIsGenerating(true);
    try {
      const script = await api.createStudioScript({
        genre: form.genre,
        template: form.template,
        title: form.title,
        synopsis: form.synopsis || undefined,
        characterCount: form.characterCount,
        shotCount: form.shotCount,
      });
      setScripts(prev => [script, ...prev]);
      setActiveScript(script);
      setCharacters(script.characters || []);
      setPhase(2);
      toast.success(`剧本「${form.title}」生成成功！`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('生成失败: ' + msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // 模板快速生成
  const handleQuickGenerate = async () => {
    if (!form.title.trim()) {
      toast.error('请输入剧本标题');
      return;
    }
    setIsGenerating(true);
    try {
      const script = await api.createTemplateScript({
        genre: form.genre,
        template: form.template,
        title: form.title,
        extraShots: form.shotCount,
      });
      setScripts(prev => [script, ...prev]);
      setActiveScript(script);
      setPhase(2);
      toast.success('剧本生成成功！');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('生成失败: ' + msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // 生成视频
  const handleGenerateVideo = async (shot: StudioShot, model: string) => {
    setGeneratingShotId(shot.id);
    try {
      const updated = await api.updateStudioShot(shot.id, { videoStatus: 'generating', model: model as StudioShot['model'] });
      setActiveScript(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          shots: prev.shots.map(s => s.id === shot.id ? updated : s),
        };
      });
      // 模拟生成（实际由后端 Worker 处理）
      setTimeout(() => {
        const done = { ...updated, videoStatus: 'done' as const };
        setActiveScript(prev => {
          if (!prev) return prev;
          return { ...prev, shots: prev.shots.map(s => s.id === shot.id ? done : s) };
        });
        toast.success(`镜头 ${shot.seq} 生成完成`);
        setGeneratingShotId(null);
      }, 2000 + Math.random() * 2000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error('生成失败: ' + msg);
      setGeneratingShotId(null);
    }
  };

  const doneCount = activeScript?.shots.filter(s => s.videoStatus === 'done').length ?? 0;
  const totalCount = activeScript?.shots.length ?? 0;

  // ── 左导航 ─────────────────────────────────────────────────

  const leftNavItems = [
    { id: 'nav', label: '工作室', emoji: '🎬' },
    { id: 'chars', label: '角色库', emoji: '👤' },
    { id: 'shots', label: '镜头库', emoji: '🎞️' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative flex w-full max-w-[1400px] mx-auto my-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{ height: 'calc(100vh - 32px)', background: '#09091a' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ══ 左导航栏 ══ */}
        <div className="w-52 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#0d0d1e]" style={{ minWidth: 208 }}>
          {/* 顶栏 */}
          <div className="flex items-center gap-2.5 px-4 py-4 border-b border-white/5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-xs font-black flex-shrink-0">
              SC
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-purple-300 truncate">AI 短剧工作室</div>
              <div className="text-[10px] text-slate-500">SimiaiClaw Studio</div>
            </div>
          </div>

          {/* 导航标签 */}
          <div className="px-3 pt-3 pb-1">
            <div className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-2 mb-2">导航</div>
            {leftNavItems.map(item => (
              <button
                key={item.id}
                onClick={() => setLeftTab(item.id as typeof leftTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm mb-0.5 transition-all ${
                  leftTab === item.id
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span className="font-medium">{item.label}</span>
                {item.id === 'chars' && characters.length > 0 && (
                  <span className="ml-auto text-[10px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded-full">{characters.length}</span>
                )}
                {item.id === 'shots' && totalCount > 0 && (
                  <span className="ml-auto text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-full">{doneCount}/{totalCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* 工作流阶段 */}
          <div className="px-3 pt-3 pb-1 border-t border-white/5">
            <div className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-2 mb-2">创作阶段</div>
            {([
              { n: 1, label: '新建项目' },
              { n: 2, label: '角色设定' },
              { n: 3, label: '镜头编排' },
              { n: 4, label: '视频生成' },
            ] as const).map(({ n, label }) => (
              <button
                key={n}
                onClick={() => setPhase(n)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
                  phase === n
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/25'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  phase === n ? 'bg-blue-500/30 text-blue-300' : 'bg-white/5 text-slate-500'
                }`}>{n}</span>
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* 项目列表 */}
          {leftTab === 'nav' && scripts.length > 0 && (
            <div className="px-3 pt-3 border-t border-white/5 flex-1 overflow-y-auto">
              <div className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-2 mb-2">最近剧本</div>
              {scripts.slice(0, 8).map(s => (
                <button
                  key={s.id}
                  onClick={() => { setActiveScript(s); setCharacters(s.characters); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-all ${
                    activeScript?.id === s.id ? 'bg-white/8 text-white' : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <div className="truncate font-medium text-xs">{s.title}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{s.genre} · {s.shots.length}镜头</div>
                </button>
              ))}
            </div>
          )}

          {/* 角色库 */}
          {leftTab === 'chars' && (
            <div className="px-3 pt-3 border-t border-white/5 flex-1 overflow-y-auto">
              <div className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-2 mb-2">角色列表</div>
              {characters.length === 0 ? (
                <div className="text-center text-slate-600 text-xs py-8">暂无角色</div>
              ) : (
                characters.map(c => (
                  <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 bg-white/3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600/40 to-blue-600/40 flex items-center justify-center text-xs flex-shrink-0">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-500">{c.role}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 镜头库 */}
          {leftTab === 'shots' && (
            <div className="px-3 pt-3 border-t border-white/5 flex-1 overflow-y-auto">
              <div className="text-[10px] font-semibold tracking-widest text-slate-600 uppercase px-2 mb-2">镜头列表</div>
              {activeScript?.shots.map(s => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 bg-white/3">
                  <span className="text-[10px] font-bold text-slate-600 w-4 flex-shrink-0">{s.seq}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs truncate">{s.scene}</div>
                    <div className="text-[10px] text-slate-500">{s.camera} · {s.angle}</div>
                  </div>
                  <StatusBadge status={s.videoStatus} />
                </div>
              ))}
            </div>
          )}

          {/* 底部 */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={onClose}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-white/5 hover:text-white transition-all"
            >
              <span>←</span>
              <span>返回控制台</span>
            </button>
          </div>
        </div>

        {/* ══ 主内容区 ══ */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部栏 */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-white/5 bg-[#0d0d1e]/80 backdrop-blur-xl flex-shrink-0">
            {/* 内容领域切换 */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
              {(Object.keys(DOMAIN_LABELS) as ContentDomain[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDomain(d)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    domain === d ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{DOMAIN_LABELS[d].emoji}</span>
                  <span>{DOMAIN_LABELS[d].label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* 阶段指示器 */}
            <div className="flex items-center gap-0.5 ml-2">
              {([1, 2, 3, 4] as WorkflowPhase[]).map(n => (
                <React.Fragment key={n}>
                  <button
                    onClick={() => setPhase(n)}
                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold transition-all ${
                      phase === n ? 'bg-blue-600 text-white' : n < phase ? 'bg-emerald-600/60 text-emerald-200' : 'bg-white/5 text-slate-500'
                    }`}
                  >
                    {n < phase ? '✓' : n}
                  </button>
                  {n < 4 && <div className={`w-4 h-px ${n < phase ? 'bg-emerald-500/60' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>

            <div className="flex-1" />

            {activeScript && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">{activeScript.title}</span>
                <span className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">{activeScript.genre}</span>
                <span className="text-slate-600">·</span>
                <span className="text-emerald-400">{doneCount}/{totalCount} 镜头</span>
              </div>
            )}

            <button
              onClick={loadScripts}
              className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
            >
              刷新
            </button>
          </div>

          {/* 内容主体 */}
          <div className="flex-1 overflow-y-auto p-5">
            {/* ── Phase 1: 新建项目 ── */}
            {phase === 1 && (
              <div className="max-w-3xl">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white mb-1">新建项目</h2>
                  <p className="text-sm text-slate-500">选择题材模板，AI 自动生成完整剧本与角色设定</p>
                </div>

                {/* 项目信息 */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-5 mb-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">项目信息</div>
                  <div className="mb-3">
                    <label className="block text-xs text-slate-400 mb-1.5">剧本标题 *</label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="例如：《逆袭总裁》第1集"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">故事概要（可选）</label>
                    <textarea
                      value={form.synopsis}
                      onChange={e => setForm(f => ({ ...f, synopsis: e.target.value }))}
                      placeholder="描述故事背景、核心冲突、主要人物关系..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                    />
                  </div>
                </div>

                {/* 题材选择 */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-5 mb-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">选择题材</div>
                  <div className="grid grid-cols-6 gap-2 mb-4">
                    {GENRES.map(g => (
                      <button
                        key={g.value}
                        onClick={() => setForm(f => ({ ...f, genre: g.value }))}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border transition-all ${
                          form.genre === g.value
                            ? 'border-purple-500/60 bg-purple-600/15 text-purple-300'
                            : 'border-white/8 bg-white/3 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-base">{g.emoji}</span>
                        <span className="text-[10px] font-medium">{g.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">选择模板</div>
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setForm(f => ({ ...f, template: t.value }))}
                        className={`text-left p-3 rounded-lg border transition-all ${
                          form.template === t.value
                            ? 'border-blue-500/60 bg-blue-600/15'
                            : 'border-white/8 bg-white/3 hover:border-white/20'
                        }`}
                      >
                        <div className={`text-xs font-semibold mb-0.5 ${form.template === t.value ? 'text-blue-300' : 'text-slate-300'}`}>
                          {t.label}
                        </div>
                        <div className="text-[11px] text-slate-600 leading-relaxed">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 参数配置 */}
                <div className="bg-white/3 border border-white/5 rounded-xl p-5 mb-5">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">参数配置</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">角色数量</label>
                      <select
                        value={form.characterCount}
                        onChange={e => setForm(f => ({ ...f, characterCount: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      >
                        {[2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} 人</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">镜头数量</label>
                      <select
                        value={form.shotCount}
                        onChange={e => setForm(f => ({ ...f, shotCount: Number(e.target.value) }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
                      >
                        {[6, 8, 12, 16, 20, 24].map(n => <option key={n} value={n}>{n} 个镜头</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    预计时长：约 {((form.shotCount * 3) / 60).toFixed(1)} 分钟 · 预计生成角色 {form.characterCount} 个
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-3">
                  <button
                    onClick={handleGenerateScript}
                    disabled={isGenerating || !form.title.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/30"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                        </svg>
                        AI 生成中...
                      </>
                    ) : (
                      <>
                        <span>🤖</span>
                        <span>AI 智能生成剧本</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleQuickGenerate}
                    disabled={isGenerating || !form.title.trim()}
                    className="px-6 py-3 rounded-xl border border-white/15 text-slate-400 font-medium text-sm hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    模板快速生成
                  </button>
                </div>
              </div>
            )}

            {/* ── Phase 2: 角色设定 ── */}
            {phase === 2 && (
              <div className="max-w-3xl">
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">角色设定</h2>
                    <p className="text-sm text-slate-500">
                      {activeScript ? `剧本「${activeScript.title}」共 ${activeScript.characters.length} 个角色` : '管理剧本中的角色设定'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPhase(1)}
                      className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                    >← 返回新建</button>
                    <button
                      onClick={() => setPhase(3)}
                      className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all"
                    >
                      下一阶段 →
                    </button>
                  </div>
                </div>

                {characters.length === 0 ? (
                  <div className="bg-white/3 border border-white/5 rounded-xl p-10 text-center">
                    <div className="text-4xl mb-3 opacity-30">👤</div>
                    <div className="text-slate-500 text-sm">暂无角色，请先生成剧本</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {characters.map(c => (
                      <div key={c.id} className="bg-white/3 border border-white/5 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all">
                        {/* 角色头像占位 */}
                        <div className="h-24 bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center text-3xl">
                          {c.imageUrl ? (
                            <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.name[0]
                          )}
                        </div>
                        <div className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-white">{c.name}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                              c.role === '主角' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              c.role === '反派' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }`}>{c.role}</span>
                          </div>
                          <div className="text-[11px] text-slate-600 mb-1">
                            {c.age ? `${c.age} · ` : ''}{c.gender || ''}
                          </div>
                          {c.personality && (
                            <div className="text-[11px] text-slate-500 leading-relaxed">{c.personality}</div>
                          )}
                          {c.avatarPrompt && (
                            <div className="mt-2 text-[10px] text-slate-600 bg-white/3 rounded p-1.5 leading-relaxed">
                              {c.avatarPrompt.slice(0, 60)}{c.avatarPrompt.length > 60 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phase 3: 镜头编排 ── */}
            {phase === 3 && (
              <div>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">镜头编排</h2>
                    <p className="text-sm text-slate-500">
                      {activeScript ? `共 ${activeScript.shots.length} 个镜头 · 已生成 ${doneCount} 个` : '编排镜头序列与画面描述'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPhase(2)} className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">← 角色</button>
                    <button onClick={() => setPhase(4)} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg transition-all">视频生成 →</button>
                  </div>
                </div>

                {!activeScript ? (
                  <div className="bg-white/3 border border-white/5 rounded-xl p-10 text-center">
                    <div className="text-4xl mb-3 opacity-30">🎞️</div>
                    <div className="text-slate-500 text-sm">暂无剧本，请先新建项目</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {activeScript.shots.map((shot, i) => (
                      <div key={shot.id} className="bg-white/3 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                        <div className="flex items-start gap-3">
                          {/* 序号 */}
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {shot.seq}
                          </div>

                          {/* 画面预览占位 */}
                          <div className="w-20 h-14 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 flex items-center justify-center text-lg flex-shrink-0">
                            {shot.imageUrl ? (
                              <img src={shot.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                            ) : (
                              <span className="opacity-20">{shot.seq}</span>
                            )}
                          </div>

                          {/* 镜头信息 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-semibold text-white">{shot.scene}</span>
                              <span className="text-[10px] bg-white/8 text-slate-400 px-1.5 py-0.5 rounded">{shot.camera}</span>
                              <span className="text-[10px] bg-white/8 text-slate-400 px-1.5 py-0.5 rounded">{shot.angle}</span>
                              {shot.duration && <span className="text-[10px] text-slate-600">{shot.duration}秒</span>}
                              <StatusBadge status={shot.videoStatus} />
                            </div>
                            {shot.action && <div className="text-xs text-slate-500 mb-1">动作：{shot.action}</div>}
                            {shot.dialogue && (
                              <div className="text-xs text-blue-300/80 italic border-l-2 border-blue-500/40 pl-2 leading-relaxed">
                                「{shot.dialogue}」
                              </div>
                            )}
                            {shot.visualPrompt && (
                              <div className="mt-1.5 text-[10px] text-slate-600 bg-white/3 rounded p-1.5 leading-relaxed">
                                {shot.visualPrompt.slice(0, 100)}{shot.visualPrompt.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>

                          {/* 操作 */}
                          <div className="flex-shrink-0 flex gap-2">
                            {shot.videoStatus === 'idle' && (
                              <select
                                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-slate-400 focus:outline-none"
                                onChange={e => { if (e.target.value) handleGenerateVideo(shot, e.target.value); }}
                              >
                                <option value="">选择模型</option>
                                {VIDEO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            )}
                            {shot.videoStatus === 'generating' && (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400 px-2 py-1">
                                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                                </svg>
                                生成中
                              </div>
                            )}
                            {shot.videoStatus === 'done' && shot.videoUrl && (
                              <a
                                href={shot.videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1"
                              >
                                查看 →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Phase 4: 视频生成 ── */}
            {phase === 4 && (
              <div>
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">视频生成</h2>
                    <p className="text-sm text-slate-500">
                      {activeScript
                        ? `剧本「${activeScript.title}」· ${doneCount}/${totalCount} 镜头已完成`
                        : '批量生成视频镜头'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setPhase(3)} className="text-xs text-slate-500 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all">← 镜头</button>
                  </div>
                </div>

                {!activeScript ? (
                  <div className="bg-white/3 border border-white/5 rounded-xl p-10 text-center">
                    <div className="text-4xl mb-3 opacity-30">🎬</div>
                    <div className="text-slate-500 text-sm">暂无剧本</div>
                  </div>
                ) : (
                  <>
                    {/* 批量操作工具栏 */}
                    <div className="bg-white/3 border border-white/5 rounded-xl p-4 mb-4 flex items-center gap-4">
                      <div className="text-xs text-slate-500">
                        待生成镜头：
                        <span className="text-white font-semibold ml-1">
                          {activeScript.shots.filter(s => s.videoStatus === 'idle').length}
                        </span>
                      </div>
                      <select
                        id="batch-model"
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-400 focus:outline-none"
                      >
                        {VIDEO_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg shadow-purple-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={activeScript.shots.filter(s => s.videoStatus === 'idle').length === 0}
                        onClick={() => {
                          const model = (document.getElementById('batch-model') as HTMLSelectElement)?.value;
                          if (!model) return;
                          activeScript.shots.filter(s => s.videoStatus === 'idle').forEach((shot, idx) => {
                            setTimeout(() => handleGenerateVideo(shot, model), idx * 500);
                          });
                          toast.success(`已提交 ${activeScript.shots.filter(s => s.videoStatus === 'idle').length} 个镜头到队列`);
                        }}
                      >
                        🚀 批量生成全部
                      </button>
                      {doneCount > 0 && (
                        <button className="px-4 py-2 rounded-xl border border-emerald-500/30 text-emerald-400 text-xs hover:bg-emerald-500/10 transition-all">
                          📦 导出全部 ({doneCount})
                        </button>
                      )}
                    </div>

                    {/* 进度概览 */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {(['idle', 'generating', 'done', 'failed'] as const).map(status => {
                        const count = activeScript.shots.filter(s => s.videoStatus === status).length;
                        const colors = {
                          idle: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
                          generating: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
                          done: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
                          failed: 'bg-red-500/20 text-red-400 border-red-500/20',
                        };
                        return (
                          <div key={status} className={`rounded-xl p-3 border ${colors[status]}`}>
                            <div className="text-xl font-bold">{count}</div>
                            <div className="text-[10px] mt-0.5">
                              {status === 'idle' ? '待生成' : status === 'generating' ? '生成中' : status === 'done' ? '已完成' : '失败'}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 镜头网格 */}
                    <div className="grid grid-cols-3 gap-3">
                      {activeScript.shots.map(shot => (
                        <div key={shot.id} className="bg-white/3 border border-white/5 rounded-xl overflow-hidden hover:border-white/10 transition-all">
                          <div className="h-20 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-2xl relative">
                            {shot.imageUrl ? (
                              <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="opacity-20 text-3xl">{shot.seq}</span>
                            )}
                            <div className="absolute top-1.5 right-1.5">
                              <StatusBadge status={shot.videoStatus} />
                            </div>
                            <div className="absolute bottom-1.5 left-1.5 text-[10px] text-slate-600">#{shot.seq}</div>
                          </div>
                          <div className="p-2.5">
                            <div className="text-xs font-semibold text-white truncate">{shot.scene}</div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-[10px] text-slate-500">{shot.camera}</span>
                              <span className="text-[10px] text-slate-600">·</span>
                              <span className="text-[10px] text-slate-500">{shot.angle}</span>
                            </div>
                            {shot.videoStatus === 'idle' && (
                              <button
                                onClick={() => {
                                  const model = (document.getElementById('batch-model') as HTMLSelectElement)?.value || '可灵';
                                  handleGenerateVideo(shot, model);
                                }}
                                className="mt-2 w-full py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/30 text-purple-300 text-[11px] hover:bg-purple-600/50 transition-all"
                              >
                                生成视频
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
