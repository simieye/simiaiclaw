/**
 * SIMIAICLAW 龙虾集群 · 太极总控对话框
 * 64卦太极系统一键指挥中心
 * 支持: 多智能体协同 / 技能Skill组合 / 一键跳转 SkillHub
 */
import React, { useState } from 'react';

interface PresetWorkflow {
  id: string;
  name: string;
  icon: string;
  hexagram: string;
  steps: { agent: string; skill: string; desc: string }[];
}

interface Props {
  onClose: () => void;
  onOpenAgents: () => void;
  onOpenOPC: () => void;
  onOpenSkillHub: () => void;
  onOpenHappycapy: () => void;
  onOpenRexwit: () => void;
}

const PRESET_WORKFLOWS: PresetWorkflow[] = [
  {
    id: 'brand-campaign',
    name: '品牌营销战',
    icon: '🎯',
    hexagram: '离卦·大有',
    steps: [
      { agent: '行业分析师', skill: '市场调研', desc: '分析目标市场与竞品格局' },
      { agent: '内容创作官', skill: 'Geo优化', desc: '生成 SEO + GEO 双优化内容' },
      { agent: '视觉设计师', skill: '品牌设计', desc: '产出品牌视觉体系' },
      { agent: '运营督导', skill: '投放策略', desc: '制定多渠道投放计划' },
    ],
  },
  {
    id: 'cross-border-launch',
    name: '跨境产品上市',
    icon: '🌐',
    hexagram: '乾卦·天行',
    steps: [
      { agent: '选品Agent', skill: '电商选品', desc: '从1688/亚马逊数据中筛选潜力品' },
      { agent: '合规审核员', skill: '法规合规', desc: '核查目标国法规与认证要求' },
      { agent: '多语言内容官', skill: '翻译本地化', desc: '生成英语/本地语言产品文案' },
      { agent: '物流跟踪Agent', skill: '供应链管理', desc: '配置海外仓与物流方案' },
    ],
  },
  {
    id: 'customer-service',
    name: '智能客服体系',
    icon: '💬',
    hexagram: '兑卦·咸',
    steps: [
      { agent: '龙虾客服助手', skill: 'FAQ构建', desc: '从知识库生成 FAQ 问答对' },
      { agent: '合规审核员', skill: '话术审核', desc: '确保回复符合法规要求' },
      { agent: '运营督导', skill: '质检分析', desc: '监控满意度与改进建议' },
    ],
  },
];

const QUICK_ACTIONS = [
  { id: 'skillhub', label: 'SkillHub 市场', icon: '🌐', description: '浏览 skillhub.club 的技能', color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
  { id: 'happycapy', label: 'Happycapy Skills', icon: '🦫', description: 'Claude Code 技能商店 (45+ Skills)', color: 'text-orange-400', bg: 'bg-orange-950/40' },
  { id: 'xiaojia', label: '小加营销', icon: '🧙', description: 'JustAI 营销智能体', color: 'text-violet-400', bg: 'bg-violet-950/40' },
  { id: 'rexwit', label: 'Rexwit 本地AI', icon: '🎨', description: '本地图片·3D生成', color: 'text-cyan-400', bg: 'bg-cyan-950/40' },
  { id: 'opc', label: 'OPC 工作台', icon: '🦞', description: '18个行业赛道 · 64卦节点', color: 'text-red-400', bg: 'bg-red-950/40' },
  { id: 'agents', label: '智能体编排', icon: '🤖', description: '多智能体协同 · 64卦分工', color: 'text-amber-400', bg: 'bg-amber-950/40' },
  { id: 'knowledge', label: '知识库构建', icon: '📚', description: '多格式文档解析 · RAG', color: 'text-purple-400', bg: 'bg-purple-950/40' },
  { id: 'workflow', label: 'SOP 工作流', icon: '🌀', description: '自然语言生成 SOP', color: 'text-blue-400', bg: 'bg-blue-950/40' },
];

export function MasterControlDialog({ onClose, onOpenOPC, onOpenSkillHub, onOpenHappycapy, onOpenRexwit, onOpenAgents }: Props) {
  const [activeSection, setActiveSection] = useState<'main' | 'workflow' | 'agents'>('main');
  const [executingStep, setExecutingStep] = useState<string | null>(null);
  const [doneSteps, setDoneSteps] = useState<Set<string>>(new Set());

  const handleWorkflowStep = async (workflowId: string, stepIndex: number) => {
    const key = workflowId + '-' + stepIndex;
    setExecutingStep(key);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    setExecutingStep(null);
    setDoneSteps(prev => new Set([...prev, key]));
  };

  const handleQuickAction = (id: string) => {
    switch (id) {
      case 'skillhub': onOpenSkillHub(); break;
      case 'happycapy': onOpenHappycapy(); break;
      case 'xiaojia': window.dispatchEvent(new CustomEvent('xiaojia-tab')); break;
      case 'rexwit': onOpenRexwit(); break;
      case 'opc': onOpenOPC(); break;
      case 'agents': onOpenAgents(); break;
      case 'workflow': setActiveSection('workflow'); break;
      case 'knowledge': window.dispatchEvent(new CustomEvent('knowledge-tab')); break;
    }
    onClose();
  };

  const hexagrams8 = [
    { palace: '乾宫', industry: '金融与投资', duty: '战略统帅', icon: '⚔️', agents: ['离卦·品牌传播', '坎卦·风控合规', '乾卦·战略决策'] },
    { palace: '震宫', industry: '获客与增长', duty: '增长引擎', icon: '📈', agents: ['震卦·流量获取', '巽卦·渠道优化', '大畜·团队扩张'] },
    { palace: '离宫', industry: '营销与品牌', duty: '传播中枢', icon: '🎯', agents: ['离卦·品牌传播', '大有·公关扩张', '噬磕·内容审核'] },
    { palace: '巽宫', industry: '供应链与采购', duty: '协同枢纽', icon: '🔗', agents: ['巽卦·供应链协同', '小畜·库存优化', '涣卦·物流整合'] },
    { palace: '坎宫', industry: '风险与安全', duty: '风控防线', icon: '🛡️', agents: ['坎卦·风险监控', '需卦·资金流', '讼卦·合规守护'] },
    { palace: '艮宫', industry: '研发与产品', duty: '创新引擎', icon: '⚙️', agents: ['艮卦·产品研发', '大蓄·技术积累', '蛊卦·产品迭代'] },
    { palace: '兑宫', industry: '客服与销售', duty: '变现终端', icon: '💬', agents: ['兑卦·客户沟通', '咸卦·关系建立', '萃卦·团队凝聚'] },
    { palace: '坤宫', industry: '法务与政府关系', duty: '后盾支撑', icon: '⚖️', agents: ['乾卦·战略决策', '坤卦·资源调配', '讼卦·争议处理'] },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/60 to-blue-950/60">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-xl">🌀</div>
          <div>
            <h2 className="text-white font-bold text-lg">太极总控台</h2>
            <p className="text-cyan-400/70 text-xs">64卦太极系统 · 一键指挥多智能体协同作战</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white text-xl leading-none px-2">×</button>
        </div>

        {/* Section nav */}
        <div className="flex border-b border-slate-700">
          {[
            { id: 'main', label: '⚡ 快捷入口' },
            { id: 'workflow', label: '🌀 预设战法' },
            { id: 'agents', label: '🤖 智能体编排' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeSection === tab.id ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-950/20' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeSection === 'main' && (
            <div className="space-y-5">
              {/* Quick actions grid */}
              <div>
                <h3 className="text-xs font-medium text-slate-500 mb-3 uppercase tracking-wider">快捷工具</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {QUICK_ACTIONS.map(a => (
                    <button
                      key={a.id}
                      onClick={() => handleQuickAction(a.id)}
                      className={`${a.bg} border border-slate-700/50 rounded-xl p-3 text-left hover:border-cyan-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <div className="text-2xl mb-1.5">{a.icon}</div>
                      <div className={`text-sm font-semibold ${a.color}`}>{a.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{a.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* SkillHub link */}
              <div className="bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="text-3xl">🌐</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-emerald-300">SkillHub.club · AI 技能市场</div>
                  <div className="text-xs text-emerald-400/60 mt-0.5">收录 1000+ Skills，支持 Claude/Cursor/Codex 多平台一键安装</div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => handleQuickAction('skillhub')} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg transition-colors">访问 SkillHub ↗</button>
                    <a href="https://www.skillhub.club/web/openclaw" target="_blank" rel="noreferrer" className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors">OpenClaw 入口 →</a>
                  </div>
                </div>
              </div>

              {/* OpenClaw link */}
              <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 border border-cyan-500/20 rounded-xl p-4 flex items-center gap-4">
                <div className="text-3xl">🦞</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-cyan-300">龙虾 OpenClaw 官方入口</div>
                  <div className="text-xs text-cyan-400/60 mt-0.5">本地 AI Agent 操作界面 · session=main 可多开独立会话</div>
                  <div className="flex gap-2 mt-2">
                    <a href="http://127.0.0.1:18789/chat?session=main" target="_blank" rel="noreferrer" className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded-lg transition-colors">🦞 打开操作面板 ↗</a>
                    <a href="https://www.skillhub.club/web/openclaw" target="_blank" rel="noreferrer" className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1 rounded-lg transition-colors">SkillHub OpenClaw →</a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'workflow' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">选择预设战法，点击执行智能体协同链式任务</p>
              {PRESET_WORKFLOWS.map(workflow => (
                <div key={workflow.id} className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-800">
                    <span className="text-2xl">{workflow.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{workflow.name}</div>
                      <div className="text-[10px] text-cyan-400/70">{workflow.hexagram}</div>
                    </div>
                    <button
                      onClick={() => {
                        let delay = 0;
                        workflow.steps.forEach((_, i) => {
                          setTimeout(() => handleWorkflowStep(workflow.id, i), delay);
                          delay += 1200;
                        });
                      }}
                      className="ml-auto text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                    >
                      ⚡ 一键执行
                    </button>
                  </div>
                  <div className="divide-y divide-slate-700/50">
                    {workflow.steps.map((step, i) => {
                      const key = workflow.id + '-' + i;
                      const done = doneSteps.has(key);
                      const running = executingStep === key;
                      return (
                        <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${done ? 'bg-emerald-500 text-white' : running ? 'bg-cyan-500 text-white animate-pulse' : 'bg-slate-700 text-slate-400'}`}>
                            {done ? '✓' : running ? '⚡' : i + 1}
                          </div>
                          <div className="flex-1">
                            <span className="text-xs font-medium text-white">{step.agent}</span>
                            <span className="text-slate-500 text-[10px] mx-1">→</span>
                            <span className="text-xs text-slate-400">{step.skill}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{step.desc}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === 'agents' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">从 64卦体系中选择职能节点，构建多智能体协同网络</p>
              <div className="grid grid-cols-2 gap-3">
                {hexagrams8.map((palace, i) => (
                  <button
                    key={i}
                    onClick={onOpenAgents}
                    className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-left hover:border-cyan-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{palace.icon}</span>
                      <div>
                        <div className="text-xs font-semibold text-cyan-300">{palace.palace}</div>
                        <div className="text-[10px] text-slate-500">{palace.industry}</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mb-1.5">{palace.duty}</div>
                    <div className="flex flex-wrap gap-1">
                      {palace.agents.map((a, j) => (
                        <span key={j} className="text-[9px] bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{a}</span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <button
                onClick={onOpenOPC}
                className="w-full mt-2 py-2.5 bg-gradient-to-r from-red-700/60 to-orange-700/60 hover:from-red-700 hover:to-orange-700 border border-red-500/30 text-white text-sm font-medium rounded-xl transition-all"
              >
                🦞 进入 OPC 工作台 · 查看完整 64 卦节点
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
