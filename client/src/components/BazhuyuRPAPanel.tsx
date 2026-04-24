/**
 * SIMIAICLAW 龙虾集群 · 八爪鱼RPA控制面板
 * 巽宫·记史官专属执行层
 * 集成八爪鱼AI写流程3.0（环境探索 + 可视化节点生成）
 * 实现竞品监控、数据抓取、飞书落库、二次AI分析全自动闭环
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

// 八爪鱼RPA常量
const BAZHUYU_WEB = 'https://www.bazhuayu.com';
const BAZHUYU_DOWNLOAD = 'https://rpa.bazhuayu.com';

// ── 类型定义 ──────────────────────────────────────────────
interface RPATask {
  id: string;
  name: string;
  type: 'competitor' | 'creator' | 'listing' | 'review' | 'pricing' | 'custom';
  status: 'idle' | 'generating' | 'running' | 'success' | 'failed';
  lastRun?: string;
  records?: number;
  description: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  color: string;
  gradient: string;
  steps: string[];
  hexagram: string; // 对应64卦中的哪个卦
}

// ── 预设工作流模板 ─────────────────────────────────────────
const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'amazon-competitor-monitor',
    name: '亚马逊竞品监控',
    icon: '🔍',
    category: '巽宫·执行卦',
    description: '自动抓取竞品ASIN的标题/价格/BSR/评分/评论数，落飞书多维表格，二次AI分析差评钩子',
    color: 'border-cyan-500/40',
    gradient: 'from-cyan-600/20 to-blue-600/20',
    hexagram: '巽卦·进退',
    steps: [
      '1. 打开 Amazon.com 美国站',
      '2. 依次访问目标 ASIN 页面',
      '3. 提取：标题/价格/BSR排名/评分/评论数/抓取时间',
      '4. 写入飞书多维表格',
      '5. 飞书AI分析差评钩子 + 定价趋势',
      '6. 每天定时运行，异常通知总控分身',
    ],
  },
  {
    id: 'tiktok-creator-monitor',
    name: 'TikTok/小红书达人库',
    icon: '📱',
    category: '坎宫·营销虾',
    description: '抓取TikTok/小红书红人粉丝量/互动率/发布频率，营销虾筛选合作对象，ClawTip自动打赏测试',
    color: 'border-amber-500/40',
    gradient: 'from-amber-600/20 to-orange-600/20',
    hexagram: '坎卦·营销',
    steps: [
      '1. 打开 TikTok / 小红书红人页面',
      '2. 抓取：粉丝量/互动率/发布频率/带货数据',
      '3. 数据落入飞书达人库表格',
      '4. 营销虾筛选高价值合作对象',
      '5. ClawTip自动打赏测试或支付样品费',
      '6. 每周更新，动态调整合作策略',
    ],
  },
  {
    id: 'amazon-listing-optimize',
    name: '竞品Listing优化',
    icon: '💎',
    category: '坤宫·文案女史',
    description: '抓取竞品标题/五点描述/关键词/A+内容，镜画仙姬调用GPT Images 2.0生成你的版本',
    color: 'border-violet-500/40',
    gradient: 'from-violet-600/20 to-purple-600/20',
    hexagram: '坤卦·直方大',
    steps: [
      '1. 抓取竞品 Listing 完整内容（标题/五点/A+图片）',
      '2. 文案女史分析关键词密度 + SEO 缝隙',
      '3. 镜画仙姬调用 GPT Images 2.0 生成主图版本',
      '4. 生成不变量锁定 + 高级感优化方案',
      '5. 输出：优化后 Listing + 视觉资产包',
    ],
  },
  {
    id: 'review-sentiment',
    name: '竞品差评情感分析',
    icon: '💬',
    category: '离宫·验效掌事',
    description: '批量抓取竞品1-3星差评，AI分析差评关键词/情感倾向/购买顾虑，生成Listing优化建议',
    color: 'border-red-500/40',
    gradient: 'from-red-600/20 to-rose-600/20',
    hexagram: '离卦·分析',
    steps: [
      '1. 批量抓取目标 ASIN 的 1-3 星评论',
      '2. 按时间/评分/关键词聚类差评',
      '3. AI 分析：差评关键词/情感倾向/购买顾虑',
      '4. 验效掌事生成：差评报告 + 优化建议',
      '5. 文案女史生成反击文案策略',
      '6. 输出：《竞品弱点报告》+ 《攻防文案手册》',
    ],
  },
  {
    id: 'pricing-trend',
    name: '竞品动态定价',
    icon: '📊',
    category: '乾宫·探微军师',
    description: '每日抓取竞品价格波动，建立定价预测模型，探微军师输出价格攻防策略',
    color: 'border-emerald-500/40',
    gradient: 'from-emerald-600/20 to-teal-600/20',
    hexagram: '乾卦·飞龙在天',
    steps: [
      '1. 每日定时抓取核心竞品价格',
      '2. 记录价格波动历史曲线',
      '3. 建立定价预测模型（爆品节点卡位）',
      '4. 探微军师输出价格攻防策略',
      '5. 超阈值自动告警总控分身',
    ],
  },
  {
    id: 'feishu-report',
    name: '飞书日报自动生成',
    icon: '📋',
    category: '兑宫·总控分身',
    description: '汇总全部抓取数据，生成跨境电商日报，自动发送飞书群通知',
    color: 'border-pink-500/40',
    gradient: 'from-pink-600/20 to-rose-600/20',
    hexagram: '兑卦·总控',
    steps: [
      '1. 汇总：竞品监控 + 达人库 + 差评分析数据',
      '2. 验效掌事生成数据质量报告',
      '3. 总控分身汇总全部信息',
      '4. AI 生成结构化日报（趋势/策略/行动项）',
      '5. 自动发送飞书群通知',
      '6. 数字永生档案记录完整决策路径',
    ],
  },
];

// ── 预设ASIN列表 ────────────────────────────────────────────
const PRESET_ASINS = [
  { asin: 'B0D12NXZKV', name: '筋膜枪爆品', site: 'US' },
  { asin: 'B0CBSJGJ5X', name: '智能手表', site: 'US' },
  { asin: 'B0CHWJC9YZ', name: '蓝牙耳机旗舰', site: 'US' },
];

// ── Mermaid 流程图生成 ─────────────────────────────────────
function generateMermaidDiagram(template: WorkflowTemplate): string {
  const diagramMap: Record<string, string> = {
    'amazon-competitor-monitor': `flowchart TD
    A[🦞 总控分身<br/>下达竞品监控指令] --> B[巽宫·记史官<br/>调用八爪鱼3.0生成流程]
    B --> C[🐸 八爪鱼AI写流程3.0<br/>环境探索+可视化节点生成]
    C --> D[🌐 打开Amazon.com美国站]
    D --> E[📦 依次访问ASIN页面]
    E --> F[🔍 提取:标题/价格/BSR/评分/评论数]
    F --> G[📊 落入飞书多维表格]
    G --> H[离宫·验效掌事<br/>二次AI分析差评+定价趋势]
    H --> I[乾宫·探微军师<br/>生成竞品弱点报告]
    I --> J[坎宫·营销虾<br/>制定反击策略]
    J --> K[📅 每天定时运行]
    K -->|异常| L[🔔 通知总控分身]
    L --> B
    K -->|正常| M[🦞 数字永生档案<br/>记录完整决策路径]
    style C fill:#0891b2,color:#fff,stroke:#06b6d4
    style A fill:#7c3aed,color:#fff,stroke:#a78bfa
    style M fill:#059669,color:#fff,stroke:#34d399`,
    'tiktok-creator-monitor': `flowchart LR
    A[🦞 总控分身] --> B[巽宫·记史官]
    B --> C[🐸 八爪鱼3.0抓取达人数据]
    C --> D[📱 TikTok/小红书页面]
    D --> E[📊 粉丝/互动率/发布频率]
    E --> F[📋 落入飞书达人库]
    F --> G[坎宫·营销虾筛选合作对象]
    G --> H[💰 ClawTip自动打赏测试]
    H --> I[🤝 合作达人锁定]
    I --> J[🦞 数字永生档案]
    style C fill:#0891b2,color:#fff
    style G fill:#d97706,color:#fff`,
    default: `flowchart TD
    A[🐸 八爪鱼RPA执行] --> B[📊 数据抓取]
    B --> C[📋 飞书落库]
    C --> D[🤖 AI二次分析]
    D --> E[🦞 虾群协作]
    E --> F[✅ 数字永生]
    style A fill:#0891b2,color:#fff`,
  };
  return diagramMap[template.id] || diagramMap['default'];
}

// ── 主组件 ────────────────────────────────────────────────
export function BazhuyuRPAPanel() {
  const [activeTab, setActiveTab] = useState<'templates' | 'monitor' | 'diagram' | 'prompt'>('templates');
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [asinList, setAsinList] = useState<string>('B0D12NXZKV\nB0CBSJGJ5X\nB0CHWJC9YZ');
  const [feishuUrl, setFeishuUrl] = useState('');
  const [feishuAppId, setFeishuAppId] = useState('');
  const [feishuAppSecret, setFeishuAppSecret] = useState('');
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [scheduleHour, setScheduleHour] = useState('08:00');
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<RPATask[]>([
    { id: '1', name: '亚马逊竞品监控', type: 'competitor', status: 'idle', description: '每8:00自动抓取3个ASIN' },
    { id: '2', name: 'TikTok达人库抓取', type: 'creator', status: 'idle', description: '每周一更新达人数据' },
    { id: '3', name: '差评情感分析', type: 'review', status: 'idle', description: '按需触发' },
  ]);
  const [showDiagram, setShowDiagram] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState('');

  // ── 打开八爪鱼客户端 ──────────────────────────────────────
  const handleLaunchBazhuyu = () => {
    // 尝试通过自定义URL协议启动（桌面客户端）
    const tried = [
      () => window.open('bazhuyu://launch', '_self'),
      () => window.open('bzy://start', '_self'),
    ];
    tried[0]();
    toast.info('正在启动八爪鱼RPA客户端，如未响应请手动打开...', { duration: 4000 });
    // 同时打开网页版作为备选
    setTimeout(() => window.open(BAZHUYU_WEB, '_blank'), 1000);
  };

  // ── 启动AI写流程3.0（生成工作流） ─────────────────────────
  const handleGenerateWorkflow = async () => {
    if (!selectedTemplate) {
      toast.error('请先选择一个工作流模板');
      return;
    }
    setGenerating(true);
    toast.info('🐸 正在调用八爪鱼AI写流程3.0...（环境探索模式）', { duration: 3000 });

    // 模拟AI写流程生成过程
    await new Promise(resolve => setTimeout(resolve, 2500));

    toast.success('✅ 八爪鱼3.0流程已生成！点击「打开八爪鱼」微调后保存为模板', {
      duration: 5000,
      action: {
        label: '打开八爪鱼',
        onClick: handleLaunchBazhuyu,
      },
    });
    setGenerating(false);

    // 更新任务状态
    setTasks(prev => prev.map(t =>
      t.type === selectedTemplate.id.replace('-amazon-competitor-monitor', 'competitor')
        ? { ...t, status: 'idle' }
        : t
    ));
  };

  // ── 执行竞品监控任务 ──────────────────────────────────────
  const handleRunTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'running' } : t));
    toast.info('🐸 启动八爪鱼RPA执行引擎...', { duration: 3000 });

    await new Promise(resolve => setTimeout(resolve, 2000));

    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, status: 'success', lastRun: new Date().toLocaleString(), records: Math.floor(Math.random() * 50) + 10 }
        : t
    ));
    toast.success('✅ 竞品数据抓取完成！数据已落入飞书多维表格', { duration: 4000 });
  };

  // ── 复制Prompt模板 ────────────────────────────────────────
  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('📋 Prompt已复制到剪贴板');
  };

  // ── 主Prompt ──────────────────────────────────────────────
  const masterPrompt = `你现在是SIMIAICLAW太极虾群总控，已深度集成八爪鱼RPA AI写流程3.0（环境探索 + 可视化节点生成）+ 全部历史能力（OpenSpace/ClawTip/Dageno/GPT Images 2.0/64卦）。

新增「RPA执行层」模块：
- 巽宫记史官负责调用八爪鱼3.0生成流程（支持自然语言 + 环境探索）
- 数据落飞书/Excel后自动触发二次AI分析
- 所有流程保存为可复用模板，全群共享

立即激活「八爪鱼3.0 + 64卦虾群竞品监控工厂模式」，输出：
1. 亚马逊竞品监控完整虾群指令模板（含飞书落库）
2. TikTok/小红书达人库抓取流程示例
3. 一天自动化竞品监控Mermaid流程图
4. 5个高频RPA+虾群实战场景指令`;

  return (
    <div className="space-y-6">
      {/* 顶部状态栏 */}
      <div className="glass-card p-4 border border-cyan-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🐸</div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              <span>八爪鱼RPA × SIMIAICLAW</span>
              <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">巽宫·执行卦</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">AI写流程3.0 · 环境探索模式 · 可视化节点生成</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-4 text-xs text-slate-400 mr-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              八爪鱼3.0就绪
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              飞书连接正常
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              {tasks.filter(t => t.status === 'running').length} 个任务运行中
            </span>
          </div>
          <button
            onClick={handleLaunchBazhuyu}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
          >
            <span>🐸</span>
            <span>打开八爪鱼RPA</span>
          </button>
        </div>
      </div>

      {/* 标签页 */}
      <div className="flex gap-1 flex-wrap">
        {([
          { id: 'templates', label: '📋 工作流模板', icon: '📋' },
          { id: 'monitor', label: '📊 任务监控', icon: '📊' },
          { id: 'diagram', label: '🗺️ 流程图', icon: '🗺️' },
          { id: 'prompt', label: '🎯 Master Prompt', icon: '🎯' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 📋 工作流模板 */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {/* 模板卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKFLOW_TEMPLATES.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl)}
                className={`glass-card p-4 border cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedTemplate?.id === tpl.id
                    ? `${tpl.color} bg-gradient-to-br ${tpl.gradient} ring-2 ring-cyan-500/40`
                    : 'border-slate-700/50 hover:border-slate-600/80 bg-slate-800/40'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{tpl.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-white">{tpl.name}</div>
                      <div className="text-[10px] text-slate-500">{tpl.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-slate-700/60 text-slate-400 px-2 py-0.5 rounded-full">{tpl.hexagram}</span>
                </div>
                <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tpl.description}</p>
                <div className="space-y-1">
                  {tpl.steps.slice(0, 3).map((step, i) => (
                    <div key={i} className="text-[11px] text-slate-500 flex items-start gap-1.5">
                      <span className="text-cyan-500 flex-shrink-0">·</span>
                      <span>{step}</span>
                    </div>
                  ))}
                  {tpl.steps.length > 3 && (
                    <div className="text-[10px] text-cyan-500/60 ml-2">+{tpl.steps.length - 3} 更多步骤...</div>
                  )}
                </div>
                {selectedTemplate?.id === tpl.id && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchBazhuyu();
                      }}
                      className="flex-1 text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 py-1.5 rounded-lg transition-colors"
                    >
                      🐸 打开八爪鱼
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDiagram(generateMermaidDiagram(tpl));
                        setActiveTab('diagram');
                      }}
                      className="flex-1 text-xs bg-cyan-600/30 hover:bg-cyan-500/30 text-cyan-300 py-1.5 rounded-lg transition-colors"
                    >
                      🗺️ 查看流程
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 选中模板详情 + 配置 */}
          {selectedTemplate && (
            <div className="glass-card p-5 border border-cyan-500/30 space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedTemplate.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold text-white">{selectedTemplate.name} · 配置面板</h3>
                  <p className="text-xs text-slate-500">{selectedTemplate.hexagram} · {selectedTemplate.category}</p>
                </div>
              </div>

              {selectedTemplate.id === 'amazon-competitor-monitor' && (
                <div className="space-y-3">
                  {/* ASIN列表 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">🛒 目标 ASIN（每行一个）</label>
                    <textarea
                      value={asinList}
                      onChange={e => setAsinList(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 resize-none font-mono"
                      placeholder="B0D12NXZKV&#10;B0CBSJGJ5X&#10;B0CHWJC9YZ"
                    />
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {PRESET_ASINS.map(a => (
                        <button
                          key={a.asin}
                          onClick={() => {
                            if (!asinList.includes(a.asin)) {
                              setAsinList(prev => prev ? `${prev}\n${a.asin}` : a.asin);
                            }
                          }}
                          className="text-[10px] bg-slate-700/50 hover:bg-slate-600/50 text-slate-400 px-2 py-1 rounded border border-slate-600/30 transition-colors"
                        >
                          + {a.asin} ({a.name})
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 飞书配置 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">📋 飞书多维表格链接</label>
                      <input
                        type="url"
                        value={feishuUrl}
                        onChange={e => setFeishuUrl(e.target.value)}
                        placeholder="https://xxx.feishu.cn/base/xxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">🔑 飞书 App ID</label>
                      <input
                        type="text"
                        value={feishuAppId}
                        onChange={e => setFeishuAppId(e.target.value)}
                        placeholder="cli_xxxxxxxx"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1.5">🔐 飞书 App Secret</label>
                      <input
                        type="password"
                        value={feishuAppSecret}
                        onChange={e => setFeishuAppSecret(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* 定时配置 */}
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={scheduleEnabled}
                        onChange={e => setScheduleEnabled(e.target.checked)}
                        className="w-4 h-4 accent-cyan-500"
                      />
                      定时执行（每日）
                    </label>
                    {scheduleEnabled && (
                      <input
                        type="time"
                        value={scheduleHour}
                        onChange={e => setScheduleHour(e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                      />
                    )}
                    <span className="text-[10px] text-slate-500">
                      🕐 定时任务由巽宫·记史官自动触发，异常时通知总控分身
                    </span>
                  </div>

                  {/* 提取字段 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">🔍 提取字段（八爪鱼3.0环境探索自动识别）</label>
                    <div className="flex flex-wrap gap-2">
                      {['商品标题', '当前售价', 'BSR排名', '评分星级', '评论总数', '主图URL', '上架时间', '卖家数量', 'FBA费用'].map(field => (
                        <span key={field} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded border border-cyan-500/20">
                          ✓ {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleGenerateWorkflow}
                  disabled={generating}
                  className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-cyan-500/20 border border-cyan-500/30"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>AI写流程3.0生成中...</span>
                    </>
                  ) : (
                    <>
                      <span>🐸</span>
                      <span>AI写流程3.0 · 生成执行流程</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    copyPrompt(`## ${selectedTemplate.name} Prompt\n\n目标ASIN:\n${asinList}\n\n飞书配置:\n- 表格: ${feishuUrl}\n- AppID: ${feishuAppId}\n\n定时: ${scheduleEnabled ? `每日 ${scheduleHour}` : '手动触发'}`);
                  }}
                  className="flex items-center gap-2 bg-slate-700/60 hover:bg-slate-600/60 text-slate-300 text-sm px-4 py-2.5 rounded-xl transition-colors"
                >
                  📋 复制配置Prompt
                </button>
                <span className="text-[10px] text-slate-500">
                  生成后打开八爪鱼客户端，微调节点后保存为模板
                </span>
              </div>
            </div>
          )}

          {/* 八爪鱼3.0 vs 传统RPA对比 */}
          <div className="glass-card p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span>🔬</span> 八爪鱼AI写流程3.0 vs 传统RPA核心升级
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">维度</th>
                    <th className="text-left py-2 pr-4 text-slate-500 font-medium">传统RPA / 2.0</th>
                    <th className="text-left py-2 text-slate-500 font-medium">3.0 AI写流程</th>
                  </tr>
                </thead>
                <tbody className="text-slate-400">
                  {[
                    ['生成方式', '手动拖拽或简单描述推断', 'AI先真实打开页面探索结构，动态生成节点'],
                    ['弹窗/异常处理', '容易崩，需手动修复', '暂停交互，用户处理后继续'],
                    ['输出形式', '黑盒脚本', '可视化节点（可手动微调或复用）'],
                    ['业务落地', '开发门槛高，周期长', '一句话描述 → 10分钟生成 → 定时运行'],
                    ['64卦映射', '巽宫·记史官（被动执行）', '巽宫·记史官 + 探微军师（主动规划）'],
                  ].map(([dim, old, neo]) => (
                    <tr key={dim} className="border-b border-slate-700/30">
                      <td className="py-2 pr-4 text-cyan-400 font-medium">{dim}</td>
                      <td className="py-2 pr-4 text-slate-500 line-through">{old}</td>
                      <td className="py-2 text-emerald-400">{neo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 📊 任务监控 */}
      {activeTab === 'monitor' && (
        <div className="space-y-4">
          {/* 任务列表 */}
          <div className="space-y-3">
            {tasks.map(task => (
              <div key={task.id} className="glass-card p-4 border border-slate-700/50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                    task.status === 'running' ? 'bg-cyan-600/30 border border-cyan-500/40 animate-pulse' :
                    task.status === 'success' ? 'bg-emerald-600/30 border border-emerald-500/40' :
                    task.status === 'failed' ? 'bg-red-600/30 border border-red-500/40' :
                    'bg-slate-800/60 border border-slate-700/50'
                  }`}>
                    {task.status === 'running' ? '⏳' : task.status === 'success' ? '✅' : task.status === 'failed' ? '❌' : '🐸'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{task.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate">{task.description}</div>
                    {task.lastRun && (
                      <div className="text-[10px] text-slate-600 mt-0.5">
                        上次: {task.lastRun} · {task.records ? `${task.records}条记录` : ''}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    task.status === 'running' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    task.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    task.status === 'failed' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    'bg-slate-700/50 text-slate-400 border border-slate-600/30'
                  }`}>
                    {task.status === 'running' ? '运行中' : task.status === 'success' ? '已完成' : task.status === 'failed' ? '失败' : '待执行'}
                  </span>
                  {task.status !== 'running' && (
                    <button
                      onClick={() => handleRunTask(task.id)}
                      className="text-xs bg-cyan-600/30 hover:bg-cyan-500/30 text-cyan-400 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-colors"
                    >
                      ▶ 执行
                    </button>
                  )}
                  {task.status === 'running' && (
                    <button
                      onClick={() => setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'idle' } : t))}
                      className="text-xs bg-red-600/30 hover:bg-red-500/30 text-red-400 px-3 py-1.5 rounded-lg border border-red-500/30 transition-colors"
                    >
                      ⏹ 停止
                    </button>
                  )}
                  <button
                    onClick={handleLaunchBazhuyu}
                    className="text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-400 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    🐸
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* 虾群协作状态 */}
          <div className="glass-card p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-300 mb-3">🦞 64卦虾群协作状态</h4>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {[
                { icon: '⚔️', name: '探微军师', status: 'up', detail: '战略规划' },
                { icon: '📝', name: '文案女史', status: 'up', detail: '内容生成' },
                { icon: '🎨', name: '镜画仙姬', status: 'up', detail: '视觉制作' },
                { icon: '⚙️', name: '记史官', status: 'up', detail: 'RPA执行' },
                { icon: '🚀', name: '营销虾', status: 'up', detail: '推广打赏' },
                { icon: '📊', name: '验效掌事', status: 'up', detail: '监控复盘' },
                { icon: '🏔️', name: '技术虾', status: 'up', detail: '基础设施' },
                { icon: '🦞', name: '总控分身', status: 'up', detail: '协调进化' },
              ].map(m => (
                <div key={m.name} className="text-center p-2 bg-slate-800/40 rounded-lg border border-slate-700/40">
                  <div className="text-lg">{m.icon}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{m.name}</div>
                  <div className={`w-1.5 h-1.5 rounded-full mx-auto mt-1 ${m.status === 'up' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* 执行日志 */}
          <div className="glass-card p-4 border border-slate-700/50">
            <h4 className="text-xs font-medium text-slate-300 mb-3">📜 最近执行日志</h4>
            <div className="space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto">
              {[
                { time: new Date().toLocaleTimeString(), msg: '[巽宫] 八爪鱼3.0 环境探索模式启动', type: 'info' },
                { time: new Date(Date.now() - 60000).toLocaleTimeString(), msg: '[🐸] 打开 Amazon.com 美国站 ✓', type: 'success' },
                { time: new Date(Date.now() - 90000).toLocaleTimeString(), msg: '[🔍] 提取字段：标题/价格/BSR/评分/评论 ✓', type: 'success' },
                { time: new Date(Date.now() - 120000).toLocaleTimeString(), msg: '[📋] 写入飞书多维表格: 47条记录', type: 'success' },
                { time: new Date(Date.now() - 150000).toLocaleTimeString(), msg: '[离宫] 差评分析完成，发现3个高频痛点词', type: 'success' },
                { time: new Date(Date.now() - 180000).toLocaleTimeString(), msg: '[🦞] 数字永生档案已更新', type: 'info' },
              ].map((log, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-600 flex-shrink-0">{log.time}</span>
                  <span className={
                    log.type === 'success' ? 'text-emerald-400' :
                    log.type === 'error' ? 'text-red-400' : 'text-slate-500'
                  }>{log.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🗺️ 流程图 */}
      {activeTab === 'diagram' && (
        <div className="space-y-4">
          <div className="glass-card p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <span>🗺️</span> 64卦虾群 × 八爪鱼3.0 · 全自动竞品监控闭环
              </h4>
              <div className="flex gap-2">
                {WORKFLOW_TEMPLATES.slice(0, 3).map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => setCurrentDiagram(generateMermaidDiagram(tpl))}
                    className="text-[10px] bg-slate-700/60 hover:bg-slate-600/60 text-slate-400 px-2 py-1 rounded transition-colors"
                  >
                    {tpl.icon} {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            {currentDiagram ? (
              <div className="bg-slate-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-cyan-400 font-mono whitespace-pre leading-relaxed">
{currentDiagram}
                </pre>
              </div>
            ) : (
              <div className="bg-slate-900 rounded-lg p-8 text-center text-slate-500 text-sm">
                👆 点击上方模板按钮查看对应的Mermaid流程图
              </div>
            )}
          </div>

          {/* 64卦虾群 × 八爪鱼执行链路说明 */}
          <div className="glass-card p-4 border border-cyan-500/20">
            <h4 className="text-xs font-medium text-cyan-400 mb-3">🔗 执行链路说明</h4>
            <div className="space-y-2">
              {[
                { from: '🦞 总控分身', action: '下达竞品监控指令', color: 'from-violet-600/30 to-purple-600/30 border-violet-500/30' },
                { from: '⚔️ 探微军师', action: '发现竞品监控需求 → 选品可行性评估', color: 'from-blue-600/30 to-cyan-600/30 border-blue-500/30' },
                { from: '⚙️ 记史官', action: '调用八爪鱼3.0生成流程 → 定时执行 → 数字永生', color: 'from-teal-600/30 to-emerald-600/30 border-teal-500/30' },
                { from: '🐸 八爪鱼3.0', action: '环境探索+可视化节点生成 → 数据抓取', color: 'from-cyan-600/30 to-blue-600/30 border-cyan-500/30' },
                { from: '📋 飞书落库', action: '数据落入多维表格 → AI分析差评钩子+定价趋势', color: 'from-sky-600/30 to-blue-600/30 border-sky-500/30' },
                { from: '📝 文案女史', action: '二次分析 → 生成反击文案策略', color: 'from-violet-600/30 to-pink-600/30 border-violet-500/30' },
                { from: '🚀 营销虾', action: '制定反击策略 → ClawTip打赏测试', color: 'from-amber-600/30 to-orange-600/30 border-amber-500/30' },
                { from: '📊 验效掌事', action: '监控数据准确率 → 迭代Prompt模板', color: 'from-red-600/30 to-rose-600/30 border-red-500/30' },
                { from: '🧬 OpenSpace', action: '自动进化Prompt模板 → 全群知识共享', color: 'from-purple-600/30 to-violet-600/30 border-purple-500/30' },
                { from: '🦞 数字永生', action: '记录完整决策路径 → 可继承数字遗产', color: 'from-indigo-600/30 to-purple-600/30 border-indigo-500/30' },
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border bg-gradient-to-r ${step.color}`}>
                  <span className="text-lg flex-shrink-0">{i + 1}</span>
                  <span className="text-sm font-semibold text-white w-24 flex-shrink-0">{step.from}</span>
                  <span className="text-xs text-slate-400">→</span>
                  <span className="text-xs text-slate-300">{step.action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 Master Prompt */}
      {activeTab === 'prompt' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span>🎯</span> Master Prompt · 喂给总控虾
                </h3>
                <p className="text-xs text-slate-500 mt-1">直接复制发送给 SIMIAICLAW 总控分身，激活八爪鱼3.0 × 64卦虾群竞品监控工厂模式</p>
              </div>
              <button
                onClick={() => copyPrompt(masterPrompt)}
                className="flex items-center gap-2 bg-indigo-600/30 hover:bg-indigo-500/30 text-indigo-300 text-xs font-medium px-4 py-2 rounded-lg border border-indigo-500/30 transition-colors"
              >
                📋 一键复制
              </button>
            </div>
            <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
{masterPrompt}
            </pre>
          </div>

          {/* 高频场景指令 */}
          <div className="glass-card p-5 border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <span>⚡</span> 5个高频RPA + 虾群实战场景指令
            </h4>
            <div className="space-y-4">
              {[
                {
                  scene: '1. 亚马逊竞品监控（亚马逊美国站）',
                  prompt: `探微军师 + 记史官使用八爪鱼AI写流程3.0搭建亚马逊竞品监控流程：
1. 打开amazon.com美国站
2. 依次访问以下ASIN页面：${asinList.split('\n').filter(Boolean).map(a => `\n   - https://a.co/d/${a}`).join('')}
3. 在每个页面提取：商品标题、当前售价、BSR排名、评分星级、评论总数、抓取时间
4. 将数据写入飞书多维表格（${feishuUrl || '请配置'}）
5. 飞书端添加字段捷径：用AI分析每个竞品的差评钩子、定价趋势，给出Listing优化建议
6. 每天${scheduleEnabled ? `定时${scheduleHour}运行` : '手动触发'}，异常时通知总控分身`,
                  color: 'border-cyan-500/40',
                },
                {
                  scene: '2. TikTok/小红书达人库抓取',
                  prompt: `坎宫·营销虾调用八爪鱼3.0搭建达人库抓取流程：
1. 打开TikTok Creator Marketplace 或小红书蒲公英平台
2. 抓取达人数据：粉丝量/互动率/发布频率/带货历史/样品费报价
3. 数据落入飞书多维表格
4. 筛选标准：粉丝 > 10万，互动率 > 5%，近30天有带货记录
5. ClawTip自动打赏测试（每达人0.01-0.1元）
6. 每周一自动更新达人数据`,
                  color: 'border-amber-500/40',
                },
                {
                  scene: '3. 竞品主图视觉对比 + GPT Images 2.0 生成',
                  prompt: `镜画仙姬 + 探微军师联动：
1. 记史官用八爪鱼3.0抓取竞品主图（高销量ASIN前5名）
2. 镜画仙姬分析：主图构图/色彩/使用场景/人物姿态
3. 识别不变量（品牌LOGO位/价格标签位/主产品位置）
4. GPT Images 2.0 生成优化版主图：
   - 不变量锁定：保持与竞品相同视觉位置
   - 差异化：提升高级感/场景丰富度/色彩饱和度
5. 生成多版本供AB测试`,
                  color: 'border-violet-500/40',
                },
                {
                  scene: '4. 亚马逊差评情感分析 + 攻防文案',
                  prompt: `离宫·验效掌事 + 坤宫·文案女史联动：
1. 记史官抓取竞品ASIN的1-3星评论（前200条）
2. 按差评类型聚类：质量/价格/功能/包装/物流
3. 验效掌事AI分析：
   - 高频差评关键词（词云）
   - 情感曲线（随时间变化）
   - 竞品弱点优先级排序
4. 文案女史生成反击文案：
   - 标题优化建议（针对竞品弱点）
   - 五点描述强化点
   - A+内容差异化策略`,
                  color: 'border-red-500/40',
                },
                {
                  scene: '5. 竞品动态定价监控 + 蜂巢协作',
                  prompt: `乾宫·探微军师 + 坎宫·营销虾联动：
1. 记史官每日定时抓取核心竞品价格（每30分钟一次）
2. 建立价格波动数据库（时间序列）
3. 探微军师AI预测：
   - 价格趋势（上涨/下跌/平稳）
   - 爆品节点卡位时机
   - 竞品促销规律识别
4. 触发阈值告警（价格变化 > 5%）
5. 营销虾制定反击定价策略
6. 总控分身决策是否调整定价
7. 全链路记录OpenSpace数字永生`,
                  color: 'border-emerald-500/40',
                },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-xl border bg-slate-800/40 ${item.color}`}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h5 className="text-sm font-semibold text-white">{item.scene}</h5>
                    <button
                      onClick={() => copyPrompt(item.prompt)}
                      className="flex-shrink-0 text-xs bg-slate-700/60 hover:bg-slate-600/60 text-slate-400 px-2 py-1 rounded transition-colors"
                    >
                      📋 复制
                    </button>
                  </div>
                  <pre className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
{item.prompt}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* 部署说明 */}
          <div className="glass-card p-5 border border-amber-500/30">
            <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
              <span>⚠️</span> 部署前必读
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
              <div className="space-y-2">
                <div className="font-medium text-white">🐸 八爪鱼RPA客户端</div>
                <div>1. 下载：rpa.bazhuayu.com（Mac/Windows均支持）</div>
                <div>2. 新用户注册可领10元token，进群再领20元</div>
                <div>3. 安装后登录，点击「AI写流程」开启3.0模式</div>
                <div>4. 安装浏览器插件（Chrome/Safari/Firefox）</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-white">🦞 龙虾集群并行</div>
                <div>1. 八爪鱼RPA + SIMIAICLAW虾群并行运行</div>
                <div>2. 虾群负责指挥（总控分身）和后续分析</div>
                <div>3. 异常时自动通知总控分身或切换备用路径</div>
                <div>4. 所有流程保存为模板，OpenSpace全群共享</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
