/**
 * 全国OPC工作台
 * SIMIAICLAW 龙虾集群（64卦太极系统）
 * 行业应用工具链赋能平台
 */
import React, { useState, useRef } from 'react';
import { NLWorkspaceDialog } from './NLWorkspaceDialog';
import { SOPUploadDialog } from './SOPUploadDialog';
import { BotStudioDialog } from './BotStudioDialog';

type BotType = 'sales' | 'service';
type Platform = 'whatsapp' | 'slack' | 'wechat';

// ══════════════════════════════════════════════════════════════
// 数据定义
// ══════════════════════════════════════════════════════════════

interface OPCStat {
  label: string;
  value: string;
  sub: string;
  icon: string;
  color: string;
  bg: string;
}

interface IndustryTool {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  color: string;
  bg: string;
  border: string;
  agents: string[];
  geo: string[];
  status: 'hot' | 'new' | 'stable';
  tasks: number;
  tagline: string;
}

interface GuaNode {
  id: string;
  no: number;
  name: string;
  palace: string;
  duty: string;
  status: 'active' | 'idle' | 'upcoming';
  tasks: number;
}

interface AgentTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  speed: string;
  cost: string;
}

// 核心统计数据
const STATS: OPCStat[] = [
  { label: '数字员工', value: '2,847', sub: '已部署智能体', icon: '🤖', color: 'text-cyan-400', bg: 'bg-cyan-950/40' },
  { label: '行业覆盖', value: '18', sub: '垂直行业赛道', icon: '🏭', color: 'text-emerald-400', bg: 'bg-emerald-950/40' },
  { label: '任务闭环', value: '99.7%', sub: '自动化执行率', icon: '⚡', color: 'text-amber-400', bg: 'bg-amber-950/40' },
  { label: '园区入驻', value: '64', sub: '全国OPC节点', icon: '🦞', color: 'text-red-400', bg: 'bg-red-950/40' },
];

// 八宫对应行业
const PALACE_INDUSTRY: Record<string, { industry: string; agents: string[] }> = {
  '乾宫': { industry: '金融与投资', agents: ['离卦·品牌传播', '坎卦·风控合规', '乾卦·战略决策', '坤卦·资源调配'] },
  '坤宫': { industry: '法务与政府关系', agents: ['乾卦·战略决策', '坤卦·资源调配', '讼卦·争议处理', '比卦·联盟构建'] },
  '震宫': { industry: '获客与增长', agents: ['震卦·流量获取', '巽卦·渠道优化', '大畜·团队扩张', '无妄·合规增长'] },
  '巽宫': { industry: '供应链与采购', agents: ['巽卦·供应链协同', '小畜·库存优化', '涣卦·物流整合', '中孚·信任体系'] },
  '坎宫': { industry: '风险与安全', agents: ['坎卦·风险监控', '需卦·资金流', '讼卦·合规守护', '蹇卦·危机应对'] },
  '离宫': { industry: '营销与品牌', agents: ['离卦·品牌传播', '大有·公关扩张', '噬磕·内容审核', '贲卦·视觉设计'] },
  '艮宫': { industry: '研发与产品', agents: ['艮卦·产品研发', '大蓄·技术积累', '蛊卦·产品迭代', '损卦·精益优化'] },
  '兑宫': { industry: '客服与销售', agents: ['兑卦·客户沟通', '咸卦·关系建立', '萃卦·团队凝聚', '履卦·商务执行'] },
};

// 行业应用工具链
const INDUSTRY_TOOLS: IndustryTool[] = [
  {
    id: 'cross-border', name: '跨境电商', nameEn: 'Cross-Border E-Commerce', icon: '🌐',
    description: '从选品到售后，全流程AI自动化闭环运营',
    color: '#00C9A7', bg: 'bg-teal-950/40', border: 'border-teal-800/40',
    agents: ['选品分析Agent', '广告投流Agent', 'GEO内容优化Agent', '多语言客服Agent', '物流跟踪Agent', '售后处理Agent'],
    geo: ['Amazon SEO', 'Temu关键词优化', '独立站GEO', '多语言本地化'],
    status: 'hot', tasks: 2847, tagline: '一人操控全球市场',
  },
  {
    id: 'supply-chain', name: '供应链管理', nameEn: 'Supply Chain Management', icon: '🔗',
    description: '全链路供应链智能协同与风险预警',
    color: '#7C3AED', bg: 'bg-violet-950/40', border: 'border-violet-800/40',
    agents: ['采购寻源Agent', '库存优化Agent', '物流调度Agent', '供应商管理Agent', '成本分析Agent'],
    geo: ['供应商GEO', '行业数据收录', '竞品监控'],
    status: 'stable', tasks: 1834, tagline: '供应链零盲区运营',
  },
  {
    id: 'fintech', name: '金融服务', nameEn: 'Financial Services', icon: '💰',
    description: '投资、风控、合规一体的智能金融服务',
    color: '#F59E0B', bg: 'bg-amber-950/40', border: 'border-amber-800/40',
    agents: ['投研分析Agent', '风险评估Agent', '合规审查Agent', '客户画像Agent', '智能客服Agent'],
    geo: ['金融关键词优化', '行业白皮书GEO', '品牌信任建设'],
    status: 'new', tasks: 956, tagline: '金融AI赋能每一笔决策',
  },
  {
    id: 'content', name: '内容创业', nameEn: 'Content Creator Studio', icon: '✍️',
    description: '多平台内容生产、分发、数据分析全链路',
    color: '#EF4444', bg: 'bg-red-950/40', border: 'border-red-800/40',
    agents: ['选题策划Agent', '文案创作Agent', '视觉设计Agent', 'SEO优化Agent', '数据分析Agent', '多平台分发Agent'],
    geo: ['小红书GEO', '抖音GEO', '公众号GEO', '知乎GEO'],
    status: 'hot', tasks: 3412, tagline: '一个人就是一家MCN',
  },
  {
    id: 'medical', name: '医疗健康', nameEn: 'Healthcare & MedTech', icon: '🏥',
    description: '医疗内容合规创作与患者服务自动化',
    color: '#3B82F6', bg: 'bg-blue-950/40', border: 'border-blue-800/40',
    agents: ['医学编辑Agent', '合规审查Agent', '患者服务Agent', '数据分析Agent', '科普内容Agent'],
    geo: ['医疗SEO优化', '医患问答GEO', '健康科普'],
    status: 'new', tasks: 643, tagline: '合规高效的智慧医疗',
  },
  {
    id: 'legal', name: '法律服务', nameEn: 'Legal Services', icon: '⚖️',
    description: '法律文书智能生成与案例智能检索',
    color: '#64748B', bg: 'bg-slate-950/40', border: 'border-slate-700/40',
    agents: ['合同审查Agent', '案例检索Agent', '法律文书Agent', '客户咨询Agent', '合规培训Agent'],
    geo: ['法律关键词', '案例收录优化', '专业权威GEO'],
    status: 'stable', tasks: 521, tagline: '法律AI普惠服务',
  },
];

// 64卦核心节点（精简展示八宫各代表卦）
const CORE_GUA: GuaNode[] = [
  { id: 'qian', no: 1, name: '乾', palace: '乾宫', duty: '战略决策 · 资源统筹', status: 'active', tasks: 847 },
  { id: 'kun', no: 2, name: '坤', palace: '坤宫', duty: '执行落地 · 团队协同', status: 'active', tasks: 723 },
  { id: 'zhen', no: 51, name: '震', palace: '震宫', duty: '流量获取 · 增长爆发', status: 'active', tasks: 918 },
  { id: 'xun', no: 57, name: '巽', palace: '巽宫', duty: '渠道优化 · 供应链协同', status: 'active', tasks: 634 },
  { id: 'kan', no: 29, name: '坎', palace: '坎宫', duty: '风险监控 · 安全合规', status: 'active', tasks: 589 },
  { id: 'li', no: 30, name: '离', palace: '离宫', duty: '品牌传播 · 内容营销', status: 'active', tasks: 1052 },
  { id: 'gen', no: 52, name: '艮', palace: '艮宫', duty: '产品研发 · 技术攻坚', status: 'idle', tasks: 412 },
  { id: 'dui', no: 58, name: '兑', palace: '兑宫', duty: '客户沟通 · 销售转化', status: 'active', tasks: 786 },
  { id: 'zuxi', no: 26, name: '大畜', palace: '乾宫', duty: '人才积累 · 团队建设', status: 'upcoming', tasks: 0 },
  { id: 'dayou', no: 14, name: '大有', palace: '乾宫', duty: '公关扩张 · 资本对接', status: 'upcoming', tasks: 0 },
  { id: 'wuwang', no: 25, name: '无妄', palace: '乾宫', duty: '合规增长 · 声誉管理', status: 'upcoming', tasks: 0 },
  { id: 'bixia', no: 8, name: '比', palace: '坤宫', duty: '联盟构建 · 生态合作', status: 'upcoming', tasks: 0 },
];

const PALACE_COLORS: Record<string, { accent: string; bg: string; border: string; badge: string }> = {
  '乾宫': { accent: 'text-red-400', bg: 'bg-red-950/50', border: 'border-red-800/40', badge: 'bg-red-500/20 text-red-300' },
  '坤宫': { accent: 'text-amber-400', bg: 'bg-amber-950/50', border: 'border-amber-800/40', badge: 'bg-amber-500/20 text-amber-300' },
  '震宫': { accent: 'text-purple-400', bg: 'bg-purple-950/50', border: 'border-purple-800/40', badge: 'bg-purple-500/20 text-purple-300' },
  '巽宫': { accent: 'text-emerald-400', bg: 'bg-emerald-950/50', border: 'border-emerald-800/40', badge: 'bg-emerald-500/20 text-emerald-300' },
  '坎宫': { accent: 'text-blue-400', bg: 'bg-blue-950/50', border: 'border-blue-800/40', badge: 'bg-blue-500/20 text-blue-300' },
  '离宫': { accent: 'text-orange-400', bg: 'bg-orange-950/50', border: 'border-orange-800/40', badge: 'bg-orange-500/20 text-orange-300' },
  '艮宫': { accent: 'text-gray-300', bg: 'bg-gray-900/50', border: 'border-gray-700/40', badge: 'bg-gray-600/30 text-gray-300' },
  '兑宫': { accent: 'text-cyan-400', bg: 'bg-cyan-950/50', border: 'border-cyan-800/40', badge: 'bg-cyan-500/20 text-cyan-300' },
};

// ══════════════════════════════════════════════════════════════
// 子组件
// ══════════════════════════════════════════════════════════════

// 行业工具详情弹窗
function IndustryModal({ tool, onClose }: { tool: IndustryTool; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className={`${tool.bg} border-b ${tool.border} p-5`} style={{ borderColor: tool.color + '40' }}>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ backgroundColor: tool.color + '20', color: tool.color }}>
              {tool.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{tool.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: tool.color + '30', color: tool.color }}>
                  {tool.nameEn}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{tool.tagline}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
          <p className="mt-3 text-sm text-slate-300">{tool.description}</p>
          <div className="flex gap-3 mt-3">
            <div className="flex-1 bg-black/20 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-white">{tool.tasks.toLocaleString()}</div>
              <div className="text-xs text-slate-400">已执行任务</div>
            </div>
            <div className="flex-1 bg-black/20 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-white">{tool.agents.length}</div>
              <div className="text-xs text-slate-400">专属Agent</div>
            </div>
            <div className="flex-1 bg-black/20 rounded-lg p-2.5 text-center">
              <div className="text-lg font-bold text-white">{tool.geo.length}</div>
              <div className="text-xs text-slate-400">GEO模块</div>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-5">
          {/* Agent 矩阵 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🦞 专属智能体矩阵</h3>
            <div className="grid grid-cols-2 gap-2">
              {tool.agents.map((agent, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-2">
                  <span className="text-emerald-400 text-xs">●</span>
                  <span className="text-sm text-slate-300">{agent}</span>
                </div>
              ))}
            </div>
          </div>

          {/* GEO 模块 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🌍 GEO 优化模块</h3>
            <div className="flex flex-wrap gap-2">
              {tool.geo.map(g => (
                <span key={g} className="text-xs bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 px-3 py-1.5 rounded-full">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* 行动按钮 */}
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-colors" style={{ backgroundColor: tool.color + '30', color: tool.color, border: `1px solid ${tool.color}40` }}>
              🚀 启动 {tool.name} 工作流
            </button>
            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 text-sm transition-colors">
              📋 查看完整方案
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 64卦节点详情
function GuaModal({ gua, onClose }: { gua: GuaNode; onClose: () => void }) {
  const c = PALACE_COLORS[gua.palace];
  const relatedIndustry = PALACE_INDUSTRY[gua.palace];
  const isActive = gua.status === 'active';

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-md overflow-hidden">
        <div className={`${c.bg} border-b ${c.border} p-5`}>
          <div className="flex items-center gap-3">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl font-bold ${c.accent}`}
              style={{ backgroundColor: `${gua.status === 'active' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'}` }}>
              {gua.name}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">第{gua.no}卦 · {gua.name}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full ${c.badge}`}>{gua.palace}</span>
              </div>
              <p className="text-sm text-slate-300 mt-0.5">{gua.duty}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : gua.status === 'idle' ? 'bg-amber-400' : 'bg-slate-500'}`}></span>
                <span className="text-xs text-slate-400">{isActive ? '运行中' : gua.status === 'idle' ? '待激活' : '即将上线'}</span>
                {isActive && <span className="text-xs text-emerald-400 ml-1">· {gua.tasks.toLocaleString()} 任务执行</span>}
              </div>
            </div>
            <button onClick={onClose} className="ml-auto text-slate-400 hover:text-white text-2xl leading-none">×</button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          {relatedIndustry && (
            <div className="bg-slate-800/50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-slate-300 mb-2">🏭 主管行业</h4>
              <div className="text-white font-medium">{relatedIndustry.industry}</div>
              <div className="mt-2">
                <h4 className="text-xs text-slate-400 mb-1">协同卦位</h4>
                <div className="flex flex-wrap gap-1">
                  {relatedIndustry.agents.map(a => (
                    <span key={a} className="text-xs bg-slate-700/60 text-slate-300 px-2 py-1 rounded-full">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl py-2.5 text-sm font-medium transition-colors">
              ⚡ 激活节点
            </button>
            <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-2.5 text-sm transition-colors">
              📊 节点数据
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 已部署机器人列表
// ══════════════════════════════════════════════════════════════

function BotList() {
  const [bots, setBots] = React.useState<Array<{ id: number; name: string; type: BotType; platforms: Platform[]; createdAt: string }>>([]);

  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('opc_bots') || '[]');
      setBots(saved);
    } catch { setBots([]); }
  }, []);

  if (bots.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-3xl mb-2">🤖</div>
        <p className="text-sm text-slate-400">暂无已部署的机器人</p>
        <p className="text-[11px] text-slate-600 mt-1">点击上方「创建机器人」开始构建您的 AI 销售/客服机器人</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {bots.map((bot) => (
        <div key={bot.id} className="flex items-center gap-3 bg-slate-900/50 rounded-xl px-4 py-3 border border-slate-700/40">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${
            bot.type === 'sales' ? 'bg-emerald-500/20' : 'bg-blue-500/20'
          }`}>
            {bot.type === 'sales' ? '💰' : '🎧'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">{bot.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                bot.type === 'sales' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' :
                'bg-blue-500/10 text-blue-300 border border-blue-500/20'
              }`}>
                {bot.type === 'sales' ? '销售' : '客服'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {bot.platforms.length > 0 ? bot.platforms.map(p => (
                <span key={p} className="text-[10px] text-slate-500">
                  {p === 'whatsapp' ? '💬WhatsApp' : p === 'slack' ? '💬Slack' : '💬微信'}
                </span>
              )) : <span className="text-[10px] text-slate-600">未部署平台</span>}
              <span className="text-[10px] text-slate-600">· {new Date(bot.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-emerald-400">在线</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SIMIAICLAW AI 在线客服组件（OPC工作台专用）
// ══════════════════════════════════════════════════════════════

function OPCAiChatWidget({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    { role: 'assistant', content: '🦞 您好！我是 SIMIAICLAW OPC工作台专属客服小龙虾！\n\n我可以帮您：\n• OPC行业应用咨询\n• 智能体节点配置指导\n• 64卦体系解读\n• 知识库与训练问题\n• 平台功能使用指南' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    'OPC工作台有哪些行业？',
    '如何配置64卦节点？',
    '如何关联企业知识库？',
    '智能体如何协同工作？',
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 1200));

    const replies: Record<string, string> = {
      'OPC工作台有哪些行业？': '🏭 OPC工作台目前已覆盖 <b>18</b> 个垂直行业赛道：\n\n• 跨境电商（亚马逊/Shopify/TikTok）\n• 金融服务（投顾/风控/保险）\n• 医疗健康（辅助诊断/健康管理）\n• 物流供应链（仓储/配送/调度）\n• 法律服务（合同审查/法规咨询）\n• 教育培训（课程设计/学情分析）\n• 内容创作（文案/视频/多语言）\n• 供应链金融（保理/信用评估）\n\n以及更多行业持续更新中...',
      '如何配置64卦节点？': '☯️ 64卦节点配置步骤：\n\n1. 进入「64卦节点」标签页\n2. 选择对应的宫位（如乾宫、坤宫）\n3. 点击「激活节点」配置职能\n4. 设置节点间的协同规则\n5. 启用太极流路由进行联动\n\n每宫8卦，共64种标准职能节点，覆盖企业运营全场景。',
      '如何关联企业知识库？': '📚 关联企业知识库的步骤：\n\n1. 进入顶部「知识库」页面\n2. 上传企业文档（PDF/Word/Excel等）\n3. 在「关联智能体」中配置\n4. 设置召回参数（默认5条）\n5. 开始训练完成接入\n\n支持结构化输出，可精准匹配垂直场景！',
      '智能体如何协同工作？': '⚡ 智能体协同工作通过三大机制：\n\n<b>1. 太极流协议</b>\n基于易经思想的智能体通信协议，自动路由任务到最优节点。\n\n<b>2. 64卦职能矩阵</b>\n每个卦象对应特定职能，节点间自动协同响应。\n\n<b>3. 多智能体编排</b>\n支持工作流编排，多个智能体顺序/并行执行复杂任务。',
    };

    const answer = replies[userMsg] || `🦞 感谢您的提问！\n\n关于「${userMsg}」，OPC工作台提供了完整的解决方案。建议您：\n1. 进入对应行业应用查看详细配置\n2. 在知识库页面构建企业专属知识\n3. 联系技术支持获取专业指导\n\n请问还有什么需要帮助的吗？`;
    setMessages(prev => [...prev, { role: 'assistant', content: answer }]);
    setLoading(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  return (
    <div className="w-96 max-h-[480px] flex flex-col glass-card border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-cyan-700/80 to-blue-700/80 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-cyan-500/30 flex items-center justify-center text-base">🦞</div>
          <div>
            <div className="text-sm font-semibold text-white">OPC 专属客服</div>
            <div className="text-xs text-cyan-200/70 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              在线服务中
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-cyan-200/70 hover:text-white transition-colors text-lg">✕</button>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-cyan-600/80 text-white rounded-br-md'
                : 'bg-slate-800/80 text-slate-200 rounded-bl-md whitespace-pre-wrap'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 text-slate-400 rounded-2xl rounded-bl-md px-3 py-2 text-xs">
              <span className="animate-pulse">🦞 正在思考...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* 快捷问题 */}
      {messages.length === 1 && (
        <div className="px-3 pb-2 flex flex-wrap gap-1">
          {quickQuestions.map(q => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-[11px] px-2 py-1 rounded-full bg-slate-700/60 text-slate-300 hover:bg-slate-600/60 border border-slate-600/40 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="p-3 border-t border-slate-700/50 flex gap-2 flex-shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
          placeholder="输入问题..."
          className="flex-1 bg-slate-800/80 border border-slate-600/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white text-xs px-3 py-2 rounded-xl transition-all"
        >
          发送
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

export function OPCWorkbench() {
  const [activeTab, setActiveTab] = useState<'overview' | 'industries' | 'nodes' | 'bots'>('overview');
  const [selectedTool, setSelectedTool] = useState<IndustryTool | null>(null);
  const [selectedGua, setSelectedGua] = useState<GuaNode | null>(null);
  const [industrySearch, setIndustrySearch] = useState('');
  const [showAiChat, setShowAiChat] = useState(false);
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(false);
  const [showSOPUpload, setShowSOPUpload] = useState(false);
  const [showBotStudio, setShowBotStudio] = useState(false);

  const filteredTools = INDUSTRY_TOOLS.filter(t =>
    t.name.includes(industrySearch) || t.nameEn.toLowerCase().includes(industrySearch.toLowerCase()) ||
    t.description.includes(industrySearch)
  );

  return (
    <div className="space-y-5">
      {/* 自然语言创建工作台对话框 */}
      {showWorkspaceDialog && <NLWorkspaceDialog onClose={() => setShowWorkspaceDialog(false)} />}

      {/* SOP 上传解析对话框 */}
      {showSOPUpload && <SOPUploadDialog onClose={() => setShowSOPUpload(false)} />}

      {/* AI 机器人工作室对话框 */}
      {showBotStudio && <BotStudioDialog onClose={() => setShowBotStudio(false)} />}

      {/* SIMIAICLAW AI 在线客服悬浮按钮 */}
      <div className="fixed bottom-20 right-6 z-40 flex flex-col items-end gap-3">
        {/* 聊天窗口 */}
        {showAiChat && <OPCAiChatWidget onClose={() => setShowAiChat(false)} />}
        {/* 悬浮按钮 */}
        <button
          onClick={() => setShowAiChat(v => !v)}
          className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all text-sm font-medium ${
            showAiChat
              ? 'bg-cyan-600 text-white'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
          }`}
        >
          <span className="text-lg">🦞</span>
          <span className="hidden sm:inline">SIMIAICLAW 智能客服</span>
          <span className="sm:hidden">AI客服</span>
          <span className="bg-white/20 text-[10px] px-1.5 rounded hidden sm:inline">AI</span>
          <span className={`text-xs transition-transform ${showAiChat ? 'rotate-0' : ''}`}>{showAiChat ? '✕' : '💬'}</span>
        </button>
      </div>

      {/* 头部 */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🦞 全国OPC工作台
            <span className="text-xs bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
              SIMIAICLAW · 64卦太极系统
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            1人 + 1套太极集群 = 1个行业头部公司 · 已覆盖 <span className="text-cyan-400 font-semibold">18</span> 个垂直赛道 · <span className="text-amber-400 font-semibold">64</span> 个智能体节点
          </p>
        </div>
        {/* 自然语言创建工作台按钮 */}
        <button
          onClick={() => setShowWorkspaceDialog(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 border border-indigo-500/30 transition-all shrink-0"
        >
          <span className="text-base">✨</span>
          <span className="hidden md:inline">用自然语言创建工作台</span>
          <span className="md:hidden">创建</span>
        </button>

        {/* SOP 上传解析按钮 */}
        <button
          onClick={() => setShowSOPUpload(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-500/20 border border-orange-500/30 transition-all shrink-0"
        >
          <span className="text-base">📤</span>
          <span className="hidden md:inline">上传 SOP 解析工作流</span>
          <span className="md:hidden">上传 SOP</span>
        </button>

        {/* AI 机器人工作室按钮 */}
        <button
          onClick={() => setShowBotStudio(true)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 border border-cyan-500/30 transition-all shrink-0"
        >
          <span className="text-base">🤖</span>
          <span className="hidden lg:inline">AI 机器人工作室</span>
          <span className="lg:hidden">机器人</span>
          <span className="text-[10px] opacity-70">↗</span>
        </button>
      </div>

      {/* 核心统计 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map(s => (
          <div key={s.label} className={`${s.bg} border border-slate-800/40 rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">{s.icon}</span>
              <span className={`text-xs font-medium ${s.color}`}>{s.sub}</span>
            </div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/40 w-fit">
        {([
          { id: 'overview', label: '总览', icon: '🎯' },
          { id: 'industries', label: '行业应用', icon: '🏭' },
          { id: 'nodes', label: '64卦节点', icon: '☯️' },
          { id: 'bots', label: 'AI机器人', icon: '🤖' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-cyan-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* 总览 */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* 品牌主张横幅 */}
          <div className="bg-gradient-to-r from-slate-900 via-purple-950/60 to-slate-900 border border-purple-800/30 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">🦞</span>
              <div>
                <h3 className="text-white font-bold text-base">SIMIAICLAW 龙虾集群</h3>
                <p className="text-xs text-slate-400">64卦太极系统 · OPC园区AI智能体赋能平台</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              以<span className="text-cyan-400 font-semibold">《易经》64卦</span>精准映射<span className="text-purple-400 font-semibold">64种标准智能体职能节点</span>，
              无缝集成<span className="text-amber-400 font-semibold">1000+全球AI大模型</span>，
              打造"1人 + 1套太极集群 = 1个行业头部公司"的<span className="text-red-400 font-semibold">全新商业范式</span>。
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {['🔗 OpenClaw开放钳爪协议', '☯️ 64卦智能体节点', '🌍 1000+AI大模型', '⚡ 多智能体协同', '📈 GEO优先原生能力'].map(t => (
                <span key={t} className="text-xs bg-slate-800/60 text-slate-300 border border-slate-700/40 px-2.5 py-1 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* 三大团队 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🏗️', title: '智能体基座框架', name: 'The Foundation', desc: '打造"数字员工操作系统"：多智能体通信、跨模型记忆共享、长链任务编排与容错机制', color: '#3B82F6', bg: 'bg-blue-950/40', border: 'border-blue-800/40', tags: ['OpenClaw协议', '多智能体通信', '长链任务编排'] },
              { icon: '🎯', title: '行业应用集群', name: 'The Application', desc: '打造"特种数字部队"：跨境电商、供应链、金融、内容创业等垂直赛道全流程AI闭环', color: '#8B5CF6', bg: 'bg-violet-950/40', border: 'border-violet-800/40', tags: ['跨境电商', '供应链管理', '金融服务'] },
              { icon: '⚙️', title: '工具链与评测', name: 'The Infrastructure', desc: '提供"工业化流水线"与"质量闭环"：低代码编排工具、Agent评测体系、ROI实时监控', color: '#10B981', bg: 'bg-emerald-950/40', border: 'border-emerald-800/40', tags: ['低代码编排', 'Agent评测', 'ROI监控'] },
            ].map(team => (
              <div key={team.name} className={`${team.bg} border ${team.border} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{team.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{team.title}</h4>
                    <span className="text-xs text-slate-500">{team.name}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{team.desc}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {team.tags.map(tag => (
                    <span key={tag} className="text-xs" style={{ color: team.color }}>#{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 行业热力图 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🔥 热门行业赛道</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {INDUSTRY_TOOLS.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool)}
                  className={`${tool.bg} border ${tool.border} rounded-xl p-3 text-left hover:scale-[1.02] transition-transform group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg">{tool.icon}</span>
                    {tool.status === 'hot' && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">HOT</span>}
                    {tool.status === 'new' && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">NEW</span>}
                  </div>
                  <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">{tool.name}</h4>
                  <div className="text-xs text-slate-400 mt-0.5">{tool.tasks.toLocaleString()} 任务</div>
                </button>
              ))}
            </div>
          </div>

          {/* 八宫职能分布 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">☯️ 八宫职能分布</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(PALACE_INDUSTRY).map(([palace, info]) => {
                const c = PALACE_COLORS[palace];
                return (
                  <button
                    key={palace}
                    onClick={() => setSelectedGua(CORE_GUA.find(g => g.palace === palace && g.status === 'active') || null)}
                    className={`${c.bg} border ${c.border} rounded-xl p-3 text-left hover:scale-[1.02] transition-transform group`}
                  >
                    <div className={`text-base font-bold ${c.accent}`}>{palace}</div>
                    <div className="text-xs text-slate-300 mt-1">{info.industry}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{info.agents.length} 协同卦位</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 行业应用 */}
      {activeTab === 'industries' && (
        <div className="space-y-4">
          {/* 搜索 */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
            <input
              value={industrySearch}
              onChange={e => setIndustrySearch(e.target.value)}
              placeholder="搜索行业赛道..."
              className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
            />
          </div>
          {/* 工具卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredTools.map(tool => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className={`${tool.bg} border ${tool.border} rounded-xl p-4 text-left hover:scale-[1.01] transition-transform group`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: tool.color + '20', color: tool.color }}>
                    {tool.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">{tool.name}</h4>
                      {tool.status === 'hot' && <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">HOT</span>}
                      {tool.status === 'new' && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full">NEW</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{tool.tagline}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tool.description}</p>
                  </div>
                  <span className="text-slate-600 group-hover:text-cyan-400 text-lg">→</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {tool.agents.slice(0, 4).map(a => (
                    <span key={a} className="text-xs bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-full">{a.replace('Agent', '')}</span>
                  ))}
                  {tool.agents.length > 4 && <span className="text-xs text-slate-500">+{tool.agents.length - 4}</span>}
                </div>
                <div className="flex gap-3 mt-3 pt-2 border-t border-slate-700/30">
                  <div className="text-xs text-slate-400"><span className="text-white font-semibold">{tool.tasks.toLocaleString()}</span> 任务</div>
                  <div className="text-xs text-slate-400"><span className="text-cyan-400 font-semibold">{tool.geo.length}</span> GEO模块</div>
                  <div className="text-xs text-slate-400"><span className="text-amber-400 font-semibold">{tool.agents.length}</span> Agent</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 64卦节点 */}
      {activeTab === 'nodes' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-amber-950/40 to-orange-950/40 border border-amber-800/30 rounded-xl p-4">
            <p className="text-sm text-slate-300">
              <span className="text-amber-400 font-semibold">☯️ 64卦节点</span>是龙虾集群的核心智能体职能标准。
              每卦对应一种商业职能，通过<span className="text-cyan-400">OpenClaw开放钳爪协议</span>互联互通，动态协同作战。
              点击任意卦位查看详情与主管行业。
            </p>
          </div>

          {/* 活跃节点网格 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">⚡ 活跃节点 ({CORE_GUA.filter(g => g.status === 'active').length})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CORE_GUA.filter(g => g.status === 'active').map(gua => {
                const c = PALACE_COLORS[gua.palace];
                return (
                  <button
                    key={gua.id}
                    onClick={() => setSelectedGua(gua)}
                    className={`${c.bg} border ${c.border} rounded-xl p-3 text-center hover:scale-[1.03] transition-transform group`}
                  >
                    <div className={`text-2xl font-bold ${c.accent}`}>{gua.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{gua.palace}</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs text-emerald-400">{gua.tasks.toLocaleString()}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 待激活节点 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">⏳ 即将上线 ({CORE_GUA.filter(g => g.status === 'upcoming').length})</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {CORE_GUA.filter(g => g.status === 'upcoming').map(gua => {
                const c = PALACE_COLORS[gua.palace];
                return (
                  <button
                    key={gua.id}
                    onClick={() => setSelectedGua(gua)}
                    className={`${c.bg} border ${c.border} rounded-xl p-3 text-center opacity-60 hover:opacity-100 transition-opacity group`}
                  >
                    <div className={`text-2xl font-bold ${c.accent}`}>{gua.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{gua.palace}</div>
                    <div className="text-xs text-slate-600 mt-1">即将上线</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 八宫详情 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🏛️ 八宫主管行业</h3>
            <div className="space-y-2">
              {Object.entries(PALACE_INDUSTRY).map(([palace, info]) => {
                const c = PALACE_COLORS[palace];
                return (
                  <div key={palace} className={`${c.bg} border ${c.border} rounded-xl p-4`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`${c.accent} font-bold`}>{palace}</span>
                      <span className="text-white text-sm">→</span>
                      <span className="text-white text-sm font-medium">{info.industry}</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {info.agents.map(a => (
                        <span key={a} className={`text-xs ${c.badge} px-2 py-0.5 rounded-full`}>{a}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* AI 机器人工作室 Tab */}
      {activeTab === 'bots' && (
        <div className="space-y-4">
          {/* 工作室入口横幅 */}
          <div className="bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-800/30 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-white font-bold text-base">AI 机器人工作室</h3>
                  <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                    Powered by AnyGen.io
                  </span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  上传企业官网、品牌内容、产品资料，AI 自动构建销售/客服机器人，
                  一键部署到 WhatsApp、Slack、微信等平台，7×24 小时精准服务全球客户。
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBotStudio(true)}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors flex items-center gap-2"
                >
                  🚀 创建机器人
                </button>
              </div>
            </div>
          </div>

          {/* 平台能力展示 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold text-emerald-300">WhatsApp</span>
                <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">全球覆盖</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                覆盖 180+ 国家，25亿+ 月活用户，自动识别客户意图，精准推荐产品，支持多语言实时翻译。
              </p>
              <div className="mt-3 flex gap-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">Business API</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">多语言</span>
              </div>
            </div>

            <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold text-purple-300">Slack</span>
                <span className="ml-auto text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full">企业协作</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                深度集成 Slack 工作流，自动创建工单、对接 CRM、实时通知销售团队，提升 B2B 客户响应速度。
              </p>
              <div className="mt-3 flex gap-1">
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">Bot User</span>
                <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full">CRM对接</span>
              </div>
            </div>

            <div className="bg-green-950/40 border border-green-800/40 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💬</span>
                <span className="text-sm font-bold text-green-300">微信 WeChat</span>
                <span className="ml-auto text-[10px] text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">中国市场</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                公众号/小程序/客服消息全覆盖，基于企业知识库精准回复，支持朋友圈互动和社群运营自动化。
              </p>
              <div className="mt-3 flex gap-1">
                <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">公众号</span>
                <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">小程序</span>
              </div>
            </div>
          </div>

          {/* 已部署机器人列表 */}
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">🎯 已部署的机器人</h3>
              <button
                onClick={() => setShowBotStudio(true)}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                + 新建机器人
              </button>
            </div>
            <BotList />
          </div>

          {/* 机器人能力矩阵 */}
          <div className="bg-gradient-to-r from-cyan-950/30 to-blue-950/30 border border-slate-700/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">🧠 AnyGen.io 智能引擎能力</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { icon: '🎯', title: '意图识别', desc: '95%+ 准确率，精准理解客户需求', color: 'text-cyan-400' },
                { icon: '📚', title: '知识库问答', desc: '基于企业文档，自动学习产品知识', color: 'text-emerald-400' },
                { icon: '🌐', title: '多语言', desc: '中英日韩等 10+ 语言实时互译', color: 'text-amber-400' },
                { icon: '⏱️', title: '秒级响应', desc: '&lt;2s 平均响应，7×24 不间断服务', color: 'text-pink-400' },
                { icon: '📊', title: '数据分析', desc: '实时监控对话质量，持续优化', color: 'text-violet-400' },
                { icon: '🔗', title: 'CRM 集成', desc: '自动创建线索，同步客户档案', color: 'text-blue-400' },
                { icon: '🔄', title: '持续学习', desc: '未解决的问题自动学习，日益聪明', color: 'text-orange-400' },
                { icon: '🛡️', title: '合规安全', desc: 'GDPR/HIPAA 合规，数据加密传输', color: 'text-red-400' },
              ].map((cap, i) => (
                <div key={i} className="bg-slate-800/60 rounded-lg p-3">
                  <span className="text-lg">{cap.icon}</span>
                  <div className={`text-xs font-bold mt-1 ${cap.color}`}>{cap.title}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{cap.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* AI品牌独立站建站平台 */}
          <div className="bg-gradient-to-r from-violet-950/50 to-purple-950/50 border border-violet-800/40 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🌐</span>
              <h3 className="text-sm font-bold text-white">AI 品牌独立站建站平台</h3>
              <span className="text-[10px] bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full border border-violet-500/30">
                一键跳转
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              搭配 AI 机器人与 OPC 工作流，推荐以下主流建站平台，快速搭建品牌独立站
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  name: 'Lovable',
                  url: 'https://lovable.dev',
                  icon: '💜',
                  color: '#a855f7',
                  tag: 'AI Full-Stack',
                  desc: 'AI 驱动全栈开发，自然语言即可生成品牌站点',
                },
                {
                  name: 'Base44',
                  url: 'https://base44.com',
                  icon: '🟠',
                  color: '#f97316',
                  tag: 'AI App Builder',
                  desc: 'AI 应用构建器，分钟级生成可上线产品',
                },
                {
                  name: 'Shopify',
                  url: 'https://shopify.com',
                  icon: '🛍️',
                  color: '#10b981',
                  tag: 'E-Commerce',
                  desc: '全球最大电商建站平台，覆盖 175+ 国家',
                },
                {
                  name: 'WooCommerce',
                  url: 'https://woocommerce.com',
                  icon: '🟣',
                  color: '#8b5cf6',
                  tag: 'WordPress E-Commerce',
                  desc: 'WordPress 电商插件，灵活定制品牌商城',
                },
              ].map((site) => (
                <a
                  key={site.name}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-slate-900/70 border border-slate-700/50 rounded-xl p-4 hover:scale-[1.02] hover:shadow-lg flex flex-col gap-2"
                  style={{ borderColor: `${site.color}30` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{site.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-white">{site.name}</span>
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                          style={{ backgroundColor: `${site.color}20`, color: site.color }}
                        >
                          {site.tag}
                        </span>
                      </div>
                    </div>
                    <span className="text-slate-600 group-hover:text-slate-300 text-sm transition-colors">↗</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{site.desc}</p>
                  <div
                    className="mt-auto pt-2 border-t text-[10px] text-center rounded-b-xl py-1 font-medium transition-colors"
                    style={{ borderColor: `${site.color}30`, color: `${site.color}90` }}
                  >
                    访问官网 →
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 底部 CTA */}
      <div className="bg-gradient-to-r from-cyan-950/60 to-purple-950/60 border border-cyan-800/30 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <h3 className="text-white font-bold text-base">🦞 邀请全国OPC园区入驻</h3>
            <p className="text-sm text-slate-400 mt-1">
              园区运营方 · 单人公司创始人 · 技术/商业伙伴 — 共同参与智能体生态构建
            </p>
          </div>
          <div className="flex gap-2">
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors">
              🚀 申请入驻
            </button>
            <button className="border border-slate-600 hover:border-slate-500 text-slate-300 rounded-xl px-5 py-2.5 text-sm transition-colors">
              📋 成为开发者
            </button>
          </div>
        </div>
      </div>

      {/* 弹窗 */}
      {selectedTool && <IndustryModal tool={selectedTool} onClose={() => setSelectedTool(null)} />}
      {selectedGua && <GuaModal gua={selectedGua} onClose={() => setSelectedGua(null)} />}
    </div>
  );
}
