/**
 * NLWorkspaceDialog — 自然语言创建工作台
 * 一键创建：多智能体 + 自定义知识库 + Skill项目工作空间
 * SIMIAICLAW 龙虾集群太极64卦系统
 */
import React, { useState, useRef } from 'react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════
// 类型定义
// ══════════════════════════════════════════════════════════════

interface WsAgent {
  id: string;
  name: string;
  icon: string;
  color: string;
  palace: string;
  duty: string;
  systemPrompt: string;
  skills: string[];
}

interface WsKnowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
}

interface WsSkill {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  instructions: string;
}

interface GeneratedWorkspace {
  name: string;
  description: string;
  icon: string;
  agents: WsAgent[];
  knowledge: WsKnowledge[];
  skills: WsSkill[];
}

type DialogStep = 'input' | 'generating' | 'preview' | 'done';

// ══════════════════════════════════════════════════════════════
// 八宫配置
// ══════════════════════════════════════════════════════════════

const PALACE_MAP: Record<string, { icon: string; duty: string; agents: string[] }> = {
  '乾宫': { icon: '⚔️', duty: '战略决策 · 资源统筹', agents: ['乾卦·战略', '大有·公关'] },
  '坤宫': { icon: '📝', duty: '执行落地 · 团队协同', agents: ['坤卦·执行', '比卦·联盟'] },
  '震宫': { icon: '🎨', duty: '流量获取 · 增长爆发', agents: ['震卦·增长', '无妄·合规'] },
  '巽宫': { icon: '⚙️', duty: '渠道优化 · 供应链协同', agents: ['巽卦·供应链', '小畜·库存'] },
  '坎宫': { icon: '📣', duty: '风险监控 · 安全合规', agents: ['坎卦·风控', '讼卦·合规'] },
  '离宫': { icon: '📊', duty: '品牌传播 · 内容营销', agents: ['离卦·品牌', '噬磕·内容'] },
  '艮宫': { icon: '🏔️', duty: '产品研发 · 技术攻坚', agents: ['艮卦·研发', '大蓄·技术'] },
  '兑宫': { icon: '🦞', duty: '客户沟通 · 销售转化', agents: ['兑卦·客服', '咸卦·关系'] },
};

// ══════════════════════════════════════════════════════════════
// 关键词 → 配置映射
// ══════════════════════════════════════════════════════════════

const KNOWLEDGE_TEMPLATES: Record<string, { title: string; content: string; category: string; tags: string[] }> = {
  跨境: {
    title: '跨境电商运营知识库',
    content: '亚马逊/TikTok Shop/SHEIN全平台运营 SOP：选品调研→竞品分析→Listing优化→广告投放→物流履约→客服售后。核心指标：ACOS<25%、转化率>10%、评分>4.3星。',
    category: '运营',
    tags: ['跨境', '亚马逊', 'TikTok', '选品', '广告'],
  },
  文案: {
    title: '高转化文案知识库',
    content: '电商文案黄金公式：AIDA模型。Attention(3秒钩子)→Interest(痛点共鸣)→Desire(价值展示)→Action(行动号召)。各平台标题规范：亚马逊80字符、抖音无限、小红书20字。',
    category: '内容',
    tags: ['文案', 'AIDA', '标题', '转化率'],
  },
  视频: {
    title: '短视频创作知识库',
    content: 'TikTok/抖音爆款公式：黄金3秒开场+痛点共鸣+产品展示+行动号召。热门音乐节奏卡点、评论区运营、dou+投放策略、直播间话术模板。',
    category: '内容',
    tags: ['短视频', 'TikTok', '抖音', '脚本', '直播'],
  },
  数据: {
    title: '电商数据分析知识库',
    content: '核心指标体系：曝光→点击(CTR)→加购(CVR)→转化(GMV)→复购。广告指标：ACOS=广告支出/广告销售额，ROAS=广告收入/广告支出，TACOS=广告支出/总销售额。异常诊断：CTR低→优化主图；CVR低→优化详情页；ACOS高→优化关键词和出价。',
    category: '数据',
    tags: ['数据分析', 'ACOS', 'ROAS', 'CVR', '指标'],
  },
  品牌: {
    title: '品牌建设知识库',
    content: '品牌定位方法论：STP细分→市场选择→定位差异化。品牌故事框架：起源(Why)→坚持(How)→成就(What)。视觉规范：主色调不超过3种，字体不超过2种，视觉一致性>80%。',
    category: '品牌',
    tags: ['品牌', '定位', 'STP', 'VI', '故事'],
  },
  外贸: {
    title: '外贸B2B知识库',
    content: '外贸B2B全链路：开发信→样品确认→合同签订→生产跟进→验货出货→尾款结算。核心工具：LinkedIn开发、Google搜索、海关数据、阿里国际站。关键文件：PI、CI、PL、CO、BL。',
    category: '外贸',
    tags: ['外贸', 'B2B', 'LinkedIn', '开发信', '验货'],
  },
};

const SKILL_TEMPLATES: Record<string, { name: string; icon: string; category: string; description: string; instructions: string }> = {
  选品: {
    name: '智能选品分析师', icon: '🔍', category: 'business',
    description: '分析市场趋势、竞品数据，计算ROI并给出选品建议',
    instructions: '你是一个专业的电商选品分析师。根据品类关键词执行：\n1. 分析市场容量和增长趋势（体积/增速/季节性）\n2. 扫描主要竞品及其定价/评分/销量\n3. 计算平均ROI和竞争强度评分\n4. 输出结构化选品报告（潜力评分1-10、推荐理由、风险提示、上架建议）',
  },
  文案: {
    name: '高转化文案助手', icon: '📝', category: 'creative',
    description: '生成高点击率的产品标题、五点描述、A+内容',
    instructions: '你是一个专业的电商文案专家。帮助用户撰写：\n- 主图标题（限制80字符，突出核心USP）\n- 五点描述（每点不超过200字符，FABE结构）\n- A+内容（适合PC端展示的详细描述）\n- 社媒推广文案（各平台适配）\n始终遵循平台规范，避免夸大宣传，注重真实性和转化率',
  },
  视频: {
    name: '短视频脚本创作师', icon: '🎬', category: 'creative',
    description: '生成TikTok/抖音风格的带货短视频脚本',
    instructions: '你是一个专业的短视频脚本师。根据产品信息生成：\n1. 黄金3秒开场钩子（悬念/冲突/数据/数字）\n2. 产品核心卖点展示（约15秒）\n3. 痛点共鸣片段（约10秒）\n4. 行动号召CTA（约5秒）\n语言风格：口语化、有节奏感、适合短视频平台',
  },
  数据: {
    name: '数据分析运营官', icon: '📊', category: 'ai',
    description: '解读销售数据、广告报表，输出可执行优化建议',
    instructions: '你是一个专业的数据分析师。分析用户提供的数据后：\n1. 识别关键指标异常（CTR、CVR、ACOS、TACOS）\n2. 诊断问题根源（listing/广告/评论/竞品）\n3. 给出优先级排序的可执行优化建议\n4. 预测优化后的预期效果\n擅长用图表和对比呈现数据洞察',
  },
  营销: {
    name: '广告投放优化师', icon: '🎯', category: 'business',
    description: '分析广告数据，自动调价和预算分配',
    instructions: '你是一个专业的广告投放优化师。基于广告数据报告：\n1. 识别高ACOS关键词并给出否词建议\n2. 识别低ROAS广告组并给出调价策略\n3. 推荐预算在Campaign间的重新分配\n4. 预测下周最优出价区间\n提供具体数字和百分比，不要模糊建议',
  },
  客服: {
    name: '智能客服应答官', icon: '💬', category: 'productivity',
    description: '生成专业、友好的售前售后回复模板',
    instructions: '你是一个专业的客服助手。根据场景生成回复：\n1. 售前咨询（产品参数、使用场景、对比）\n2. 物流咨询（追踪、延迟、改地址）\n3. 售后问题（退货、换货、差评处理）\n4. 催单与挽回\n语气：专业、友好、有同理心，符合品牌调性，每条回复不超过50字',
  },
  GEO: {
    name: 'GEO内容优化师', icon: '🌐', category: 'integration',
    description: '生成结构化GEO内容，实现品牌全网可见性',
    instructions: '你是一个GEO（生成式引擎优化）内容专家。帮助用户：\n1. 挖掘行业长尾关键词和问答对\n2. 生成FAQ、How-to、Comparison类型结构化内容\n3. 优化内容以适配Perplexity/ChatGPT/DeepSeek等AI搜索引擎\n4. 生成多语言本地化版本\n输出格式：标题、H2段落、FAQ_schema、meta描述',
  },
};

// ══════════════════════════════════════════════════════════════
// 解析引擎
// ══════════════════════════════════════════════════════════════

function detectKeywords(text: string): string[] {
  const keywords: string[] = [];
  const lower = text.toLowerCase();
  const words = [
    '选品', '文案', '视频', '视觉', '数据', '分析', '营销', '广告',
    '运营', '竞品', '客服', '品牌', '跨境', '亚马逊', 'tiktok', '小红书',
    '社媒', '外贸', 'shopify', '独立站', 'SEO', 'GEO', '内容', '供应链',
    '研发', '法律', '医疗', '金融', '教育', '旅游',
  ];
  words.forEach(w => { if (lower.includes(w) || lower.includes(w.toLowerCase())) keywords.push(w); });
  return keywords.length > 0 ? [...new Set(keywords)] : ['运营'];
}

function detectIndustry(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('跨境') || lower.includes('亚马逊') || lower.includes('tiktok') || lower.includes('shopee')) return '跨境电商';
  if (lower.includes('小红书') || lower.includes('抖音') || lower.includes('短视频') || lower.includes('直播')) return '内容创业';
  if (lower.includes('外贸') || lower.includes('b2b') || lower.includes('独立站')) return '外贸B2B';
  if (lower.includes('品牌') || lower.includes('出海')) return '品牌出海';
  if (lower.includes('供应链') || lower.includes('采购')) return '供应链管理';
  if (lower.includes('数据') || lower.includes('分析')) return '数据分析';
  if (lower.includes('营销') || lower.includes('推广')) return '营销增长';
  return '综合运营';
}

function detectPalace(keywords: string[]): { palace: string; config: typeof PALACE_MAP[string] } {
  const map: Record<string, string> = {
    '跨境': '乾宫', '选品': '乾宫', '竞品': '乾宫',
    '文案': '坤宫', '内容': '坤宫',
    '视频': '震宫', '视觉': '震宫', '短视频': '震宫',
    '营销': '离宫', '广告': '坎宫', '数据': '离宫', '分析': '离宫',
    '运营': '兑宫', '客服': '兑宫', '品牌': '艮宫', '供应链': '巽宫',
    'GEO': '乾宫', 'SEO': '乾宫',
  };
  for (const kw of keywords) {
    if (map[kw]) return { palace: map[kw], config: PALACE_MAP[map[kw]] };
  }
  return { palace: '兑宫', config: PALACE_MAP['兑宫'] };
}

function generateWorkspace(text: string): GeneratedWorkspace {
  const keywords = detectKeywords(text);
  const industry = detectIndustry(text);
  const { palace, config } = detectPalace(keywords);

  // 选择技能模板
  const skillKeys = keywords.filter(k => k in SKILL_TEMPLATES);
  if (skillKeys.length === 0) skillKeys.push('运营');
  const skills: WsSkill[] = skillKeys.slice(0, 4).map(k => ({
    id: `skill-${Date.now()}-${k}`,
    ...SKILL_TEMPLATES[k] || SKILL_TEMPLATES['运营'],
  }));

  // 生成知识库
  const kbKeys = keywords.filter(k => k in KNOWLEDGE_TEMPLATES);
  const knowledge: WsKnowledge[] = kbKeys.slice(0, 3).map(k => ({
    id: `kb-${Date.now()}-${k}`,
    ...KNOWLEDGE_TEMPLATES[k],
  }));
  if (knowledge.length === 0) {
    knowledge.push({
      id: `kb-${Date.now()}-default`,
      title: `${industry}运营知识库`,
      content: `本知识库聚焦${industry}场景，涵盖核心业务流程、常用模板、术语解释和常见问题解决方案。持续更新中。`,
      category: '运营',
      tags: [industry, '知识库', 'SOP'],
    });
  }

  // 生成多智能体
  const agentConfigs = config.agents.length > 0 ? config.agents : ['兑卦·总控'];
  const agents: WsAgent[] = agentConfigs.slice(0, Math.min(3, keywords.length + 1)).map((agentName, i) => ({
    id: `agent-${Date.now()}-${i}`,
    name: agentName,
    icon: config.icon,
    color: ['#ef4444', '#a855f7', '#3b82f6', '#22c55e'][i % 4],
    palace,
    duty: config.duty,
    systemPrompt: `你是一个专注于${industry}的智能助手，角色：${agentName}。\n\n核心职责：${config.duty}\n\n擅长领域：${keywords.slice(0, 3).join('、')}。\n\n工作方式：先分析背景，再制定方案，最后给出可执行建议。回复要专业、结构化、有数据支撑。`,
    skills: skills.slice(0, 2).map(s => s.name),
  }));

  const workspaceName = `${industry}智能工作台`;

  return {
    name: workspaceName,
    description: `基于您的需求「${text.slice(0, 40)}${text.length > 40 ? '...' : ''}」自动生成的${industry}工作台，包含${agents.length}个智能体、${skills.length}个专业技能和${knowledge.length}个知识库。`,
    icon: '🦞',
    agents,
    knowledge,
    skills,
  };
}

// ══════════════════════════════════════════════════════════════
// 步骤动画
// ══════════════════════════════════════════════════════════════

function TypingStep({ steps, progress }: { steps: string[]; progress: number }) {
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const done = i < progress;
        const active = i === progress;
        return (
          <div key={i} className={`flex items-center gap-2 text-xs transition-all ${done ? 'text-emerald-400' : active ? 'text-slate-200' : 'text-slate-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] shrink-0 ${done ? 'bg-emerald-600 text-white' : active ? 'bg-indigo-600 text-white animate-pulse' : 'bg-slate-700 text-slate-600'}`}>
              {done ? '✓' : i + 1}
            </span>
            <span className={active ? 'animate-pulse' : ''}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

interface Props {
  onClose: () => void;
  onWorkspaceCreated?: (ws: GeneratedWorkspace) => void;
}

export function NLWorkspaceDialog({ onClose, onWorkspaceCreated }: Props) {
  const [step, setStep] = useState<DialogStep>('input');
  const [naturalText, setNaturalText] = useState('');
  const [loading, setLoading] = useState(false);
  const [genWs, setGenWs] = useState<GeneratedWorkspace | null>(null);
  const [genSteps, setGenSteps] = useState<string[]>([]);
  const [stepProgress, setStepProgress] = useState(0);
  const [selectedTab, setSelectedTab] = useState<'agents' | 'knowledge' | 'skills'>('agents');

  const EXAMPLES = [
    '创建一个跨境电商全链路工作台，包含选品、文案、视频脚本和数据分析师，能自动生成SEO内容',
    '帮我做一个品牌出海工作台，要有GEO内容优化师和外贸开发信助手，关联竞品分析知识库',
    '创建一个内容创业工作室，包含短视频脚本、数据分析、粉丝运营三个智能体和相关知识库',
    '做一个智能客服工作台，支持售前咨询、售后处理、物流追踪，自动生成回复模板',
  ];

  const handleGenerate = async () => {
    if (!naturalText.trim()) return;
    setStep('generating');
    setLoading(true);

    const keywords = detectKeywords(naturalText);
    const industry = detectIndustry(naturalText);

    const steps = [
      `🔍 解析需求：识别 ${industry} 场景`,
      `🧠 理解意图：检测到 ${keywords.length} 个能力关键词`,
      `⚙️ 路由至 ${detectPalace(keywords).palace}，加载太极角色`,
      `🤖 构建 ${Math.min(keywords.length + 1, 3)} 个专业智能体`,
      `📚 生成 ${Math.min(keywords.length, 3)} 个知识库词条`,
      `🔧 打包 ${Math.min(keywords.length, 4)} 个 Skill 技能包`,
      `✨ 组装完整工作空间配置`,
    ];

    setGenSteps(steps);

    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 580));
      setStepProgress(i + 1);
    }
    await new Promise(r => setTimeout(r, 300));

    const ws = generateWorkspace(naturalText);
    setGenWs(ws);
    setLoading(false);
    setStep('preview');
  };

  const handleCreate = () => {
    if (!genWs) return;
    // 模拟保存到本地存储
    try {
      const existing = JSON.parse(localStorage.getItem('simiaiclaw_workspaces') || '[]');
      localStorage.setItem('simiaiclaw_workspaces', JSON.stringify([genWs, ...existing]));
      toast.success(`「${genWs.name}」创建成功！已保存至本地工作空间。`);
      onWorkspaceCreated?.(genWs);
      setStep('done');
    } catch {
      toast.error('保存失败，请重试');
    }
  };

  const wsIcon = genWs?.icon || '🦞';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-violet-700 to-purple-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{wsIcon}</span>
            <div>
              <h2 className="text-lg font-bold text-white">✨ 自然语言创建工作台</h2>
              <p className="text-xs text-indigo-200 mt-0.5">
                {step === 'input' && '一键创建多智能体 + 自定义知识库 + Skill项目工作空间'}
                {step === 'generating' && '🤖 正在解析需求，构建完整工作空间...'}
                {step === 'preview' && '📋 预览确认生成的工作台配置'}
                {step === 'done' && '🎉 工作台创建完成！'}
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
                {i < 2 && <div className="flex-1 h-px mx-2 bg-slate-800" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>

          {/* Step 1: 输入 */}
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">
                  🏗️ 用自然语言描述你的工作台需求
                </label>
                <textarea
                  value={naturalText}
                  onChange={e => setNaturalText(e.target.value)}
                  placeholder="例如：创建一个跨境电商全链路工作台，包含选品、文案、视频脚本和数据分析师，能自动生成SEO内容，关联亚马逊运营知识库..."
                  rows={5}
                  className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70 resize-none leading-relaxed"
                  onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
                  autoFocus
                />
                <div className="text-[10px] text-slate-600 mt-1 text-right">⌘+Enter 快速生成</div>
              </div>

              {/* 能力预览 */}
              <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                <p className="text-xs font-medium text-slate-400 mb-2">🦞 太极64卦 · 将自动创建</p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: '🤖', label: '多智能体', desc: '按需求生成2-5个专家Agent', color: 'text-cyan-400' },
                    { icon: '📚', label: '知识库', desc: '关联行业SOP和术语词条', color: 'text-amber-400' },
                    { icon: '🔧', label: 'Skill包', desc: '可复用的专业技能配置', color: 'text-emerald-400' },
                  ].map(item => (
                    <div key={item.label} className="bg-slate-800/60 rounded-lg p-2 text-center">
                      <div className={`text-xl mb-1 ${item.color}`}>{item.icon}</div>
                      <div className="text-[10px] text-slate-300 font-medium">{item.label}</div>
                      <div className="text-[9px] text-slate-600 mt-0.5">{item.desc}</div>
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
                <span>⚡</span>
                <span>一键生成工作台（智能体 + 知识库 + Skill）</span>
              </button>
            </div>
          )}

          {/* Step 2: 生成中 */}
          {step === 'generating' && (
            <div className="space-y-4">
              <div className="bg-slate-800/40 rounded-2xl p-6 border border-slate-700/40">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-full bg-indigo-600/30 flex items-center justify-center">
                    <span className="text-2xl animate-bounce inline-block">🤖</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">🦞 太极工作台生成引擎</div>
                    <div className="text-xs text-slate-500">正在理解需求并构建完整工作空间...</div>
                  </div>
                </div>
                <TypingStep steps={genSteps} progress={stepProgress} />
              </div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                <p className="text-xs text-indigo-300">📝 您的需求：「{naturalText.slice(0, 80)}{naturalText.length > 80 ? '...' : ''}」</p>
              </div>
            </div>
          )}

          {/* Step 3: 预览 */}
          {step === 'preview' && genWs && (
            <div className="space-y-4">
              {/* 工作台概览 */}
              <div className="bg-gradient-to-r from-indigo-600/20 to-violet-600/20 border border-indigo-500/30 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{genWs.icon}</span>
                  <div>
                    <h3 className="text-base font-bold text-white">{genWs.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{genWs.description}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300">🤖 {genWs.agents.length}个智能体</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">📚 {genWs.knowledge.length}个知识库</span>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300">🔧 {genWs.skills.length}个Skill</span>
                </div>
              </div>

              {/* Tab 切换 */}
              <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
                {([
                  { key: 'agents', icon: '🤖', label: `智能体(${genWs.agents.length})` },
                  { key: 'knowledge', icon: '📚', label: `知识库(${genWs.knowledge.length})` },
                  { key: 'skills', icon: '🔧', label: `Skill(${genWs.skills.length})` },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${selectedTab === tab.key ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* 智能体列表 */}
              {selectedTab === 'agents' && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {genWs.agents.map((agent, i) => (
                    <div key={agent.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg" style={{ color: agent.color }}>{agent.icon}</span>
                        <span className="text-sm font-semibold text-white">{agent.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">{agent.palace}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{agent.systemPrompt.slice(0, 120)}...</p>
                      <div className="flex gap-1 mt-2">
                        {agent.skills.map(s => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 知识库列表 */}
              {selectedTab === 'knowledge' && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {genWs.knowledge.map(kb => (
                    <div key={kb.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold text-amber-300">📚 {kb.title}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{kb.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{kb.content.slice(0, 180)}...</p>
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {kb.tags.map(t => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-500">#{t}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Skill列表 */}
              {selectedTab === 'skills' && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {genWs.skills.map(skill => (
                    <div key={skill.id} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{skill.icon}</span>
                        <span className="text-sm font-semibold text-emerald-300">{skill.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{skill.category}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{skill.description}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleCreate}
                className="w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>🚀</span>
                <span>创建此工作台（保存至本地）</span>
              </button>
            </div>
          )}

          {/* Step 4: 完成 */}
          {step === 'done' && genWs && (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl animate-bounce inline-block">🎉</div>
              <div>
                <h3 className="text-xl font-bold text-white">{genWs.name} 已创建！</h3>
                <p className="text-sm text-slate-400 mt-2">
                  已成功创建 {genWs.agents.length} 个智能体、{genWs.knowledge.length} 个知识库和 {genWs.skills.length} 个 Skill
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">✅ 智能体已注册</span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">✅ 知识库已入库</span>
                <span className="text-xs px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">✅ Skill已打包</span>
              </div>
              <button
                onClick={onClose}
                className="mt-4 px-8 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 transition-all"
              >
                关闭，开始使用 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
