/**
 * NLAgentDialog — 自然语言生成智能体/Skill对话框
 * 多步引导：自然语言输入 → AI解析 → 预览确认 → 保存
 */
import React, { useState, useEffect, useRef } from 'react';
import { api, type CustomAgent } from '../api/client';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型
// ══════════════════════════════════════════════════════════════

interface GeneratedSkill {
  name: string; description: string; category: string;
  tags: string[]; icon: string; instructions: string;
}

interface GeneratedAgent {
  name: string; description: string; icon: string;
  color: string; systemPrompt: string; skills: string[];
}

type DialogStep = 'input' | 'generating' | 'preview' | 'done';

// ══════════════════════════════════════════════════════════════
// 内置生成规则（本地模拟 AI 解析）
// ══════════════════════════════════════════════════════════════

const CATEGORY_COLORS: Record<string, string> = {
  ai: 'bg-violet-500/20 text-violet-400',
  developer: 'bg-blue-500/20 text-blue-400',
  productivity: 'bg-emerald-500/20 text-emerald-400',
  creative: 'bg-pink-500/20 text-pink-400',
  business: 'bg-amber-500/20 text-amber-400',
  integration: 'bg-cyan-500/20 text-cyan-400',
};

const SKILL_TEMPLATES: Record<string, { name: string; description: string; category: string; icon: string; instructions: string }> = {
  选品: {
    name: '智能选品分析师', description: '分析市场趋势、竞品数据，计算ROI并给出选品建议',
    category: 'business', icon: '🔍',
    instructions: '你是一个专业的电商选品分析师。根据用户提供的品类关键词，执行以下流程：\n1. 分析市场容量和增长趋势\n2. 扫描主要竞品及其定价/评分\n3. 计算平均ROI和竞争强度\n4. 输出结构化选品报告，包含：潜力评分(1-10)、推荐理由、风险提示',
  },
  文案: {
    name: '高转化文案助手', description: '生成高点击率的产品标题、五点描述、A+内容',
    category: 'creative', icon: '📝',
    instructions: '你是一个专业的电商文案专家。帮助用户撰写：\n- 主图标题（限制80字符，突出核心卖点）\n- 五点描述（每点不超过200字符）\n- A+内容（适合PC端展示的详细描述）\n始终遵循平台规范，避免夸大宣传，注重真实性和转化率',
  },
  视频: {
    name: '短视频脚本创作师', description: '生成TikTok/抖音风格的带货短视频脚本',
    category: 'creative', icon: '🎬',
    instructions: '你是一个专业的短视频脚本师。根据产品信息生成：\n1. 黄金3秒开场钩子\n2. 产品核心卖点展示（约15秒）\n3. 痛点共鸣片段（约10秒）\n4. 行动号召（约5秒）\n语言风格：口语化、有节奏感、适合短视频平台',
  },
  视觉: {
    name: '视觉营销设计师', description: '指导产品图、A+图、视频内容的视觉营销策略',
    category: 'creative', icon: '🎨',
    instructions: '你是一个专业的视觉营销设计师。提供：\n- 产品主图布局建议（背景、构图，光线）\n- A+图文案结构（对比图、场景图、细节图）\n- 视频封面文字建议\n- 品牌视觉风格指南',
  },
  数据: {
    name: '数据分析运营官', description: '解读销售数据、广告报表，输出可执行优化建议',
    category: 'ai', icon: '📊',
    instructions: '你是一个专业的数据分析师。分析用户提供的数据后：\n1. 识别关键指标异常（CTR、CVR、ACOS）\n2. 诊断问题根源（listing/广告/评论/竞品）\n3. 给出优先级排序的可执行优化建议\n4. 预测优化后的预期效果',
  },
  竞品: {
    name: '竞品情报分析师', description: '追踪竞品动态，分析差异化机会',
    category: 'business', icon: '🔬',
    instructions: '你是一个专业的竞品分析师。持续追踪：\n1. 竞品ASIN的销量排名和评分变化\n2. 关键词排名波动\n3. 评论区的新增差评/好评\n4. 定价策略变化\n输出周报：竞品动态摘要 + 机会点建议',
  },
  营销: {
    name: '广告投放优化师', description: '分析广告数据，自动调价和预算分配',
    category: 'business', icon: '🎯',
    instructions: '你是一个专业的广告投放优化师。基于广告数据报告：\n1. 识别高ACOS关键词并给出否词建议\n2. 识别低ROAS广告组并给出调价策略\n3. 推荐预算在Campaign间的重新分配\n4. 预测下周最优出价区间',
  },
  客服: {
    name: '智能客服应答官', description: '生成专业、友好的售前售后回复模板',
    category: 'productivity', icon: '💬',
    instructions: '你是一个专业的客服助手。根据用户描述的场景生成回复：\n1. 售前咨询（产品参数、使用场景、对比）\n2. 物流咨询（追踪、延迟、改地址）\n3. 售后问题（退货、换货、差评处理）\n语气：专业、友好、有同理心，符合品牌调性',
  },
  默认: {
    name: '通用AI助手', description: '处理各类通用任务的AI助手',
    category: 'ai', icon: '⚡',
    instructions: '你是一个多功能的AI助手，能够根据用户需求提供专业、高效的帮助。',
  },
};

const AGENT_TEMPLATES: Record<string, { icon: string; color: string; systemPrompt: string }> = {
  选品: {
    icon: '🔍', color: '#ef4444',
    systemPrompt: '你是一个跨境电商选品专家，拥有多年Amazon/TikTok Shop运营经验。你擅长通过数据分析发现高潜力产品，并能给出从选品到上架的完整执行方案。',
  },
  文案: {
    icon: '📝', color: '#a855f7',
    systemPrompt: '你是一个跨境电商文案专家，精通英文和中文营销文案。你能根据产品特点和目标用户撰写高转化的产品标题、描述和社媒内容。',
  },
  视频: {
    icon: '🎬', color: '#ec4899',
    systemPrompt: '你是一个短视频内容创作专家，精通TikTok/Reels/抖音的内容算法和爆款逻辑。你能快速生成有节奏感、能引发共鸣的短视频脚本。',
  },
  数据: {
    icon: '📊', color: '#f97316',
    systemPrompt: '你是一个数据分析运营专家，精通电商指标体系和A/B测试方法。你能从海量数据中发现规律，给出清晰、可执行的业务洞察。',
  },
  默认: {
    icon: '🤖', color: '#6366f1',
    systemPrompt: '你是一个专业的AI助手，专注于帮助用户解决跨境电商和内容创作中的实际问题。',
  },
};

function detectKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lower = text.toLowerCase();
  const words = ['选品', '文案', '视频', '视觉', '数据', '分析', '营销', '广告', '运营', '竞品', '客服', '品牌', '跨境', '亚马逊', 'tiktok', '小红书', '社媒', '外贸', 'shopify'];
  words.forEach(w => { if (lower.includes(w)) keywords.push(w); });
  return keywords.length > 0 ? keywords : ['默认'];
}

function generateAgentFromText(text: string): { agent: GeneratedAgent; skills: GeneratedSkill[] } {
  const keywords = detectKeywords(text);
  const primary = keywords[0];
  const tpl = AGENT_TEMPLATES[primary] || AGENT_TEMPLATES['默认'];

  const skillKeys = keywords.slice(0, 3).filter(k => k in SKILL_TEMPLATES);
  if (skillKeys.length === 0) skillKeys.push('默认');

  const skills: GeneratedSkill[] = skillKeys.map(k => {
    const s = SKILL_TEMPLATES[k];
    return { ...s, tags: [primary, k, 'AI生成'] };
  });

  const agentName = `智能${primary}助手`;
  const agent: GeneratedAgent = {
    name: agentName,
    description: `基于您的描述「${text.slice(0, 30)}...」自动生成的专业${primary}智能体`,
    icon: tpl.icon,
    color: tpl.color,
    systemPrompt: tpl.systemPrompt,
    skills: skills.map(s => s.name),
  };

  return { agent, skills };
}

// ══════════════════════════════════════════════════════════════
// 打字机动画
// ══════════════════════════════════════════════════════════════

function TypingAnimation({ texts }: { texts: string[] }) {
  const [current, setCurrent] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const full = texts[0];
  const idxRef = useRef(0);

  useEffect(() => {
    idxRef.current = 0;
    setDisplayed('');
    setCurrent(0);
    const interval = setInterval(() => {
      idxRef.current++;
      setDisplayed(full.slice(0, idxRef.current));
      if (idxRef.current >= full.length) clearInterval(interval);
    }, 30);
    return () => clearInterval(interval);
  }, [full]);

  return (
    <div className="space-y-1">
      {texts.map((t, i) => (
        <div key={i} className={`text-xs ${i === 0 ? (idxRef.current >= full.length ? 'text-emerald-400' : 'text-slate-300') : 'text-slate-600'}`}>
          <span className="mr-2">{i === 0 ? (idxRef.current >= full.length ? '✓' : '…') : '○'}</span>
          <span>{i === 0 ? displayed : t}</span>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

interface Props {
  onClose: () => void;
  onAgentCreated?: (agent: CustomAgent) => void;
}

export function NLAgentDialog({ onClose, onAgentCreated }: Props) {
  const [step, setStep] = useState<DialogStep>('input');
  const [naturalText, setNaturalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [genAgent, setGenAgent] = useState<GeneratedAgent | null>(null);
  const [genSkills, setGenSkills] = useState<GeneratedSkill[]>([]);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [agentDesc, setAgentDesc] = useState('');
  const [agentPrompt, setAgentPrompt] = useState('');
  const [agentIcon, setAgentIcon] = useState('🤖');
  const [genSteps, setGenSteps] = useState<string[]>([]);
  const [stepProgress, setStepProgress] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const EXAMPLES = [
    '帮我创建一个跨境电商选品助手，专门分析亚马逊热销趋势和竞品动态',
    '创建一个专门写TikTok短视频脚本的AI，要能分析热门视频的套路',
    '帮我做一个亚马逊运营数据分析助手，能解读广告报表和库存数据',
    '创建一个品牌出海营销助手，支持多语言内容和社媒发布',
    '帮我做一个小红书种草笔记助手，能生成情感化的种草文案',
    '创建一个外贸开发信撰写助手，要支持多语言和个性化定制',
  ];

  // 启动生成流程
  const handleGenerate = async () => {
    if (!naturalText.trim()) return;
    setStep('generating');
    setLoading(true);

    const keywords = detectKeywords(naturalText);
    const steps = [
      `🔍 解析需求：检测到关键词 [${keywords.join(', ')}]`,
      `🧠 匹配64卦角色：${keywords[0]}卦位专家模式`,
      `⚙️ 生成系统指令：基于「${naturalText.slice(0, 20)}...」`,
      `🔧 构建关联技能：生成 ${Math.min(keywords.length, 3)} 个专业技能`,
      `✨ 组装智能体配置：系统提示词 + Skill包`,
    ];
    setGenSteps(steps);

    // 逐步骤动画
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 650));
      setStepProgress(i + 1);
    }
    await new Promise(r => setTimeout(r, 400));

    // 本地生成
    const { agent, skills } = generateAgentFromText(naturalText);
    setGenAgent(agent);
    setGenSkills(skills);
    setAgentName(agent.name);
    setAgentDesc(agent.description);
    setAgentPrompt(agent.systemPrompt);
    setAgentIcon(agent.icon);
    setLoading(false);
    setStep('preview');
  };

  // 保存智能体
  const handleSave = async () => {
    if (!genAgent) return;
    setSaving(true);
    try {
      const skillIds: string[] = [];
      for (const skill of genSkills) {
        try {
          const { skill: s } = await api.createCustomSkill(skill);
          skillIds.push(s.id);
        } catch {}
      }
      const { agent } = await api.createAgentFromNaturalLanguage(
        `${agentName}：${agentDesc}。系统指令：${agentPrompt}。关联技能：${skillIds.join(', ')}`
      );
      toast.success(`「${agent.name}」创建成功！`);
      onAgentCreated?.(agent);
      setStep('done');
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  const keywords = detectKeywords(naturalText);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 to-violet-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✨</span>
            <div>
              <h2 className="text-lg font-bold text-white">自然语言生成智能体</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {step === 'input' && '用自然语言描述你的需求，AI 自动构建 Agent + Skill'}
                {step === 'generating' && '🤖 正在解析并生成配置...'}
                {step === 'preview' && '📋 预览并确认生成的智能体配置'}
                {step === 'done' && '🎉 智能体创建完成！'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">✕</button>
        </div>

        {/* Step indicator */}
        {step !== 'done' && (
          <div className="px-6 pt-4 flex items-center gap-2">
            {(['input', 'generating', 'preview'] as DialogStep[]).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-1.5 text-xs ${step === s ? 'text-indigo-400' : 'text-slate-600'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === s ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-500'}`}>{i + 1}</span>
                  <span>{s === 'input' ? '描述需求' : s === 'generating' ? 'AI生成' : '预览确认'}</span>
                </div>
                {i < 2 && <div className={`flex-1 h-px mx-2 ${i < (step === 'generating' ? 0 : step === 'preview' ? 2 : -1) ? 'bg-indigo-500' : 'bg-slate-800'}`} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

          {/* Step 1: 自然语言输入 */}
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  🤖 用一句话描述你想要创建的智能体
                </label>
                <textarea
                  ref={textareaRef}
                  value={naturalText}
                  onChange={e => setNaturalText(e.target.value)}
                  placeholder="例如：帮我创建一个专门做亚马逊产品选品和市场调研的AI助手，要能分析竞品数据..."
                  rows={4}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right">⌘+Enter 快速生成</div>
              </div>

              {/* 64卦能力映射 */}
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                <p className="text-xs font-medium text-slate-400 mb-2">🦞 64卦智能体角色映射</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { icon: '⚔️', label: '乾宫·情报', tag: '调研/竞品' },
                    { icon: '📝', label: '坤宫·内容', tag: '文案/脚本' },
                    { icon: '🎨', label: '震宫·视觉', tag: '图/视频' },
                    { icon: '⚙️', label: '巽宫·执行', tag: '运营/RPA' },
                    { icon: '📣', label: '坎宫·营销', tag: '广告/社媒' },
                    { icon: '📊', label: '离宫·分析', tag: '数据/复盘' },
                    { icon: '🏔️', label: '艮宫·品牌', tag: 'IP/故事' },
                    { icon: '🦞', label: '兑宫·总控', tag: '编排/协作' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/60 rounded-lg p-1.5 text-center">
                      <div className="text-sm mb-0.5">{item.icon}</div>
                      <div className="text-[9px] text-slate-400">{item.label}</div>
                      <div className="text-[9px] text-slate-600">{item.tag}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 示例 */}
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">💡 试试这些示例</p>
                <div className="space-y-1">
                  {EXAMPLES.map((ex, i) => (
                    <button
                      key={i}
                      onClick={() => setNaturalText(ex)}
                      className="block w-full text-left text-xs text-slate-500 hover:text-indigo-400 py-1.5 px-3 rounded-lg hover:bg-slate-800/60 transition-colors"
                    >
                      → {ex}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={!naturalText.trim()}
                className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${!naturalText.trim() ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20'}`}
              >
                <span>⚡</span><span>用自然语言生成 Agent + Skill</span>
              </button>
            </div>
          )}

          {/* Step 2: 生成动画 */}
          {step === 'generating' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <span className="text-2xl animate-bounce inline-block">🤖</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">AI 智能解析引擎</div>
                    <div className="text-xs text-slate-500">正在理解需求并构建配置...</div>
                  </div>
                </div>
                <div className="space-y-2">
                  {genSteps.map((stepText, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs ${i < stepProgress ? 'text-emerald-400' : i === stepProgress ? 'text-slate-200' : 'text-slate-600'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${i < stepProgress ? 'bg-emerald-600 text-white' : i === stepProgress ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700 text-slate-600'}`}>
                        {i < stepProgress ? '✓' : i + 1}
                      </span>
                      <span>{stepText}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs text-indigo-300">📝 您的需求：「{naturalText.slice(0, 60)}{naturalText.length > 60 ? '...' : ''}」</p>
              </div>
            </div>
          )}

          {/* Step 3: 预览确认 */}
          {step === 'preview' && genAgent && (
            <div className="space-y-5">
              {/* 智能体编辑 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-400">🤖 智能体配置</h4>
                  <button onClick={() => setEditMode(!editMode)} className="text-[10px] text-indigo-400 hover:text-indigo-300">
                    {editMode ? '收起编辑' : '✏️ 编辑'}
                  </button>
                </div>

                {editMode ? (
                  <div className="space-y-3 bg-slate-800/40 rounded-xl p-4 border border-slate-700/40">
                    <div className="flex gap-2">
                      <input value={agentIcon} onChange={e => setAgentIcon(e.target.value)} maxLength={2}
                        className="w-12 bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-center text-lg" />
                      <div className="flex-1">
                        <input value={agentName} onChange={e => setAgentName(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white" placeholder="智能体名称" />
                      </div>
                    </div>
                    <input value={agentDesc} onChange={e => setAgentDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300" placeholder="一句话描述" />
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">系统指令（System Prompt）</label>
                      <textarea value={agentPrompt} onChange={e => setAgentPrompt(e.target.value)}
                        rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 resize-none" placeholder="定义智能体的角色和能力..." />
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/40 flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0" style={{ backgroundColor: genAgent.color + '22', border: `1px solid ${genAgent.color}44` }}>
                      {genAgent.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{agentName}</h3>
                      <p className="text-xs text-slate-400 mt-1">{agentDesc}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 关联技能 */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2">🔧 关联技能（{genSkills.length}个）</h4>
                <div className="space-y-2">
                  {genSkills.map((skill, i) => (
                    <div key={i} className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-700/60 flex items-center justify-center text-lg shrink-0">{skill.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-white">{skill.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${CATEGORY_COLORS[skill.category] || 'bg-slate-600/50 text-slate-400'}`}>{skill.category}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{skill.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {skill.tags.map(tag => (
                            <span key={tag} className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 64卦角色 */}
              <div className="bg-slate-800/20 rounded-xl p-3 border border-slate-700/30">
                <p className="text-[10px] text-slate-500 mb-1.5">🦞 64卦角色分配</p>
                <div className="flex flex-wrap gap-1.5">
                  {(() => {
                    const PALACE_MAP: Record<string, { palace: string; duty: string; emoji: string }> = {
                      '默认': { palace: '兑宫', duty: '协调总控', emoji: '🦞' },
                      '选品': { palace: '乾宫', duty: '情报调研', emoji: '⚔️' },
                      '文案': { palace: '坤宫', duty: '内容创作', emoji: '📝' },
                      '视频': { palace: '震宫', duty: '视觉视频', emoji: '🎨' },
                      '数据': { palace: '离宫', duty: '分析复盘', emoji: '📊' },
                      '营销': { palace: '坎宫', duty: '营销推广', emoji: '📣' },
                      '品牌': { palace: '艮宫', duty: '品牌IP', emoji: '🏔️' },
                      '运营': { palace: '巽宫', duty: '执行运营', emoji: '⚙️' },
                    };
                    return keywords.map(k => {
                      const info = PALACE_MAP[k] || PALACE_MAP['默认'];
                      return (
                        <span key={k} className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-lg">
                          {info.emoji} {info.palace} · {info.duty}
                        </span>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* 操作 */}
              <div className="flex gap-3">
                <button onClick={() => { setStep('input'); setStepProgress(0); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-slate-400 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700">
                  ← 重新描述
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving ? <><span className="animate-spin">⟳</span> 保存中...</> : <><span>✓</span> 确认创建</>}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: 完成 */}
          {step === 'done' && (
            <div className="text-center py-8 space-y-4">
              <div className="text-7xl mb-2">🎉</div>
              <div className="text-xl font-bold text-white">智能体创建成功！</div>
              <p className="text-sm text-slate-400">「{agentName}」已添加到您的智能体列表</p>
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-left max-w-sm mx-auto">
                <p className="text-xs text-emerald-400 font-medium mb-2">✨ 包含内容</p>
                <ul className="text-xs text-slate-400 space-y-1">
                  <li>• 1个自定义智能体（带系统指令）</li>
                  <li>• {genSkills.length}个关联技能包</li>
                  <li>• 64卦角色身份分配</li>
                  <li>• 可立即开始对话</li>
                </ul>
              </div>
              <button onClick={onClose}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold hover:from-indigo-500 hover:to-violet-500 transition-all shadow-lg shadow-indigo-500/20">
                开始使用 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
