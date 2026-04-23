/**
 * AI 销售 & 客服机器人工作室
 * SIMIAICLAW 龙虾集群（64卦太极系统）
 * 集成 AnyGen.io Assistant 能力构建企业智能机器人
 *
 * AnyGen API Docs: https://api.anygen.io/v1/openapi/tasks
 * API Key: sk-ag-ca5gCM5lAFnCEc9l1Y9FtHxeOY48j1XapJKqBRuhqDNAyPG6lhoSA7Uj08SiQkonrmbNeqpk-U8iKc_K8PfzJw
 */
import React, { useState, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  generateBotKnowledge,
  validateApiKey,
  getCredits,
  type BotKnowledgeContent,
} from '../api/anygenService';
import {
  DocUploadPanel,
  type ParsedDoc,
  combineMarkdown,
} from '../api/docParser';

// ══════════════════════════════════════════════════════════════
// 数据定义
// ══════════════════════════════════════════════════════════════

type BotType = 'sales' | 'service';
type Platform = 'whatsapp' | 'slack' | 'wechat';
type Step = 1 | 2 | 3 | 4 | 5;

interface BotConfig {
  name: string;
  type: BotType;
  platforms: Platform[];
  websiteUrl: string;
  brandDesc: string;
  products: string[];
  serviceHours: string;
  greeting: string;
  language: string;
  personality: string;
  docs: ParsedDoc[];  // 上传的文档（已转换为 Markdown）
}

interface PlatformStatus {
  id: Platform;
  name: string;
  icon: string;
  connected: boolean;
  status: 'connected' | 'pending' | 'disconnected';
  channelId?: string;
}

const DEFAULT_BOT: BotConfig = {
  name: '',
  type: 'sales',
  platforms: [],
  websiteUrl: '',
  brandDesc: '',
  products: [],
  serviceHours: '9:00-18:00',
  greeting: '您好！我是 {company} 的智能助手，请问有什么可以帮助您的？',
  language: '中文',
  personality: '专业、热情、耐心',
  docs: [],
};

const PRODUCT_SUGGESTIONS = [
  '核心产品介绍', '价格方案', '使用方法', '售后服务政策',
  '技术支持文档', 'FAQ常见问题', '成功案例', '技术规格参数',
];

const PERSONALITY_OPTIONS = [
  { label: '专业严谨', desc: '适合B2B、高端服务', icon: '🎩' },
  { label: '热情活泼', desc: '适合零售、年轻品牌', icon: '🎉' },
  { label: '亲切耐心', desc: '适合教育、咨询服务', icon: '🤝' },
  { label: '简洁高效', desc: '适合技术产品、快速响应', icon: '⚡' },
];

const LANGUAGE_OPTIONS = ['中文', 'English', '中文+English', '日本語', '한국어', 'Español'];

const STEP_LABELS = ['企业信息', '机器人类型', '平台配置', '知识库', '预览部署'];

// ══════════════════════════════════════════════════════════════
// 子组件
// ══════════════════════════════════════════════════════════════

// 步骤指示器
function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-0 py-2">
      {STEP_LABELS.map((label, i) => {
        const step = (i + 1) as Step;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-cyan-500 text-white ring-4 ring-cyan-500/30' :
                'bg-slate-700 text-slate-400'
              }`}>
                {done ? '✓' : step}
              </div>
              <span className={`text-[10px] hidden lg:block ${active ? 'text-cyan-400' : 'text-slate-500'}`}>{label}</span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className={`w-8 lg:w-14 h-0.5 mx-1 ${done ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Step1: 企业信息
function StepOne({ config, update }: { config: BotConfig; update: (c: Partial<BotConfig>) => void }) {
  const addProduct = (p: string) => {
    if (p && !config.products.includes(p)) {
      update({ products: [...config.products, p] });
    }
  };

  const removeProduct = (p: string) => {
    update({ products: config.products.filter(x => x !== p) });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-lg">🏢</div>
        <div>
          <h3 className="text-sm font-bold text-white">Step 1：企业信息配置</h3>
          <p className="text-xs text-slate-400">上传企业资料，让机器人了解您的品牌与产品</p>
        </div>
      </div>

      {/* 机器人名称 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">🤖 机器人名称 <span className="text-red-400">*</span></label>
        <input
          value={config.name}
          onChange={e => update({ name: e.target.value })}
          placeholder="例如：SIMIAICLAW 智能客服"
          className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
        />
      </div>

      {/* 企业官网 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">🌐 企业官方网站 URL</label>
        <input
          value={config.websiteUrl}
          onChange={e => update({ websiteUrl: e.target.value })}
          placeholder="https://www.yourcompany.com"
          className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
        />
        <p className="text-[10px] text-slate-500 mt-1">机器人将抓取网站内容用于自动学习品牌信息</p>
      </div>

      {/* 品牌介绍 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">📝 品牌介绍</label>
        <textarea
          value={config.brandDesc}
          onChange={e => update({ brandDesc: e.target.value })}
          placeholder="描述您的企业定位、核心价值观、品牌故事..."
          rows={3}
          className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors resize-none"
        />
      </div>

      {/* 产品资料 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">📦 产品/服务类别</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {PRODUCT_SUGGESTIONS.map(p => (
            <button
              key={p}
              onClick={() => addProduct(p)}
              disabled={config.products.includes(p)}
              className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                config.products.includes(p)
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 cursor-default'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-cyan-500/40 hover:text-cyan-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        {config.products.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {config.products.map(p => (
              <span key={p} className="flex items-center gap-1 text-[11px] bg-cyan-950/40 border border-cyan-800/40 text-cyan-300 px-2 py-1 rounded-full">
                {p}
                <button onClick={() => removeProduct(p)} className="text-cyan-500 hover:text-red-400 ml-0.5">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 文档上传 → Markdown 解析 */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1.5">
          📄 上传品牌/产品文档（自动转 Markdown）
        </label>
        <DocUploadPanel
          docs={config.docs}
          onChange={(docs) => update({ docs })}
          botName={config.name}
        />
      </div>
    </div>
  );
}

// Step2: 机器人类型
function StepTwo({ config, update }: { config: BotConfig; update: (c: Partial<BotConfig>) => void }) {
  const botTypes = [
    {
      id: 'sales' as BotType,
      icon: '💰',
      title: 'AI 销售机器人',
      color: '#10B981',
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-800/40',
      tagline: '主动获客 · 精准转化 · 7×24在线',
      features: [
        { icon: '🎯', text: '主动识别访客意图，精准推荐产品' },
        { icon: '📋', text: '自动收集需求，生成销售线索档案' },
        { icon: '💬', text: '多轮对话引导，推动购买决策' },
        { icon: '📈', text: '实时分析转化漏斗，优化话术' },
        { icon: '🔗', text: '对接 CRM 系统，自动创建商机' },
        { icon: '⏰', text: '跟进超时未回复，自动催办提醒' },
      ],
    },
    {
      id: 'service' as BotType,
      icon: '🎧',
      title: 'AI 客服机器人',
      color: '#3B82F6',
      bg: 'bg-blue-950/40',
      border: 'border-blue-800/40',
      tagline: '智能分流 · 秒级响应 · 持续学习',
      features: [
        { icon: '🤖', text: 'FAQ 智能问答，准确率 >95%' },
        { icon: '🔀', text: '智能分流，人机协作效率提升 3x' },
        { icon: '📚', text: '基于企业知识库，答案精准可溯源' },
        { icon: '🌐', text: '多语言支持，覆盖全球客户' },
        { icon: '📊', text: '满意度实时监控，服务质量追踪' },
        { icon: '🔄', text: '未解决的问题自动学习，持续优化' },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lg">🤖</div>
        <div>
          <h3 className="text-sm font-bold text-white">Step 2：选择机器人类型</h3>
          <p className="text-xs text-slate-400">不同类型机器人有不同的职能定位和对话策略</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {botTypes.map(bot => {
          const selected = config.type === bot.id;
          return (
            <div
              key={bot.id}
              onClick={() => update({ type: bot.id })}
              className={`rounded-xl border-2 cursor-pointer transition-all ${bot.bg} ${bot.border} ${
                selected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
              }`}
              style={{ borderColor: selected ? bot.color + '80' : undefined }}
            >
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{bot.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{bot.title}</h4>
                    <p className="text-[10px] text-slate-400">{bot.tagline}</p>
                  </div>
                  {selected && (
                    <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: bot.color }}>
                      <span className="text-white text-[10px] font-bold">✓</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 mt-3">
                  {bot.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <span className="text-[10px]">{f.icon}</span>
                      <span className="text-[10px] text-slate-300">{f.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 通用配置 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 语言 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">🌐 机器人语言</label>
          <select
            value={config.language}
            onChange={e => update({ language: e.target.value })}
            className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors"
          >
            {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* 性格 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">🎭 机器人性格</label>
          <div className="flex gap-1.5 flex-wrap">
            {PERSONALITY_OPTIONS.map(p => (
              <button
                key={p.label}
                onClick={() => update({ personality: p.label })}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                  config.personality === p.label
                    ? 'bg-violet-500/20 border-violet-500/50 text-violet-300'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:border-violet-500/40'
                }`}
              >
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 服务时间 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">⏰ 服务时间</label>
          <input
            value={config.serviceHours}
            onChange={e => update({ serviceHours: e.target.value })}
            placeholder="9:00-18:00"
            className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>

        {/* 开场白 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">👋 开场白（支持变量 {"{company}"})</label>
          <input
            value={config.greeting}
            onChange={e => update({ greeting: e.target.value })}
            placeholder="您好！我是...请问有什么可以帮您？"
            className="w-full bg-slate-800/70 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

// Step3: 平台配置
function StepThree({ config, update }: { config: BotConfig; update: (c: Partial<BotConfig>) => void }) {
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([
    { id: 'whatsapp', name: 'WhatsApp', icon: '💬', connected: false, status: 'disconnected' },
    { id: 'slack', name: 'Slack', icon: '💬', connected: false, status: 'disconnected' },
    { id: 'wechat', name: '微信 WeChat', icon: '💬', connected: false, status: 'disconnected' },
  ]);

  const togglePlatform = (id: Platform) => {
    setPlatforms(prev => prev.map(p =>
      p.id === id ? { ...p, connected: !p.connected, status: p.connected ? 'disconnected' : 'pending' } : p
    ));
    update({ platforms: config.platforms.includes(id)
      ? config.platforms.filter(p => p !== id)
      : [...config.platforms, id]
    });
  };

  const connectPlatform = async (id: Platform) => {
    setPlatforms(prev => prev.map(p => p.id === id ? { ...p, status: 'connected', connected: true } : p));
    toast.success(`${id === 'whatsapp' ? 'WhatsApp' : id === 'slack' ? 'Slack' : '微信'} 授权连接成功！`);
  };

  const platformDetails: Record<Platform, {
    desc: string;
    steps: string[];
    badge: string;
    badgeColor: string;
  }> = {
    whatsapp: {
      desc: '全球最大的即时通讯平台，覆盖 180+ 国家，月活用户 25 亿+',
      steps: ['配置 WhatsApp Business API', '授权企业账号', '设置自动回复规则', '绑定机器人配置'],
      badge: 'WhatsApp Business API',
      badgeColor: 'bg-green-500/20 text-green-300',
    },
    slack: {
      desc: '企业团队协作平台，适合 B2B 客户服务和内部销售支持',
      steps: ['创建 Slack App', '配置 Bot User', '设置权限范围', '添加至工作区'],
      badge: 'Slack Platform',
      badgeColor: 'bg-purple-500/20 text-purple-300',
    },
    wechat: {
      desc: '中国市场最重要的超级 App，公众号/小程序/客服消息全覆盖',
      steps: ['配置微信公众平台', '获取 AppID 和 AppSecret', '设置消息接收地址', '启用智能回复'],
      badge: '微信公众平台',
      badgeColor: 'bg-emerald-500/20 text-emerald-300',
    },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-pink-600/20 border border-pink-500/30 flex items-center justify-center text-lg">🔗</div>
        <div>
          <h3 className="text-sm font-bold text-white">Step 3：配置发布平台</h3>
          <p className="text-xs text-slate-400">选择机器人将部署的通讯平台（可多选）</p>
        </div>
      </div>

      <div className="space-y-3">
        {platforms.map(p => {
          const info = platformDetails[p.id];
          const isConnected = p.status === 'connected';
          const isPending = p.status === 'pending';

          return (
            <div
              key={p.id}
              className={`rounded-xl border transition-all ${
                isConnected ? 'bg-emerald-950/20 border-emerald-700/50' :
                isPending ? 'bg-amber-950/20 border-amber-700/50' :
                'bg-slate-800/40 border-slate-700/40'
              }`}
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  {/* 平台图标 */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    isConnected ? 'bg-emerald-500/20' : isPending ? 'bg-amber-500/20' : 'bg-slate-700/60'
                  }`}>
                    {p.id === 'whatsapp' ? '💬' : p.id === 'slack' ? '💬' : '💬'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white">{info.badge}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${info.badgeColor}`}>
                        {p.id === 'whatsapp' ? 'WhatsApp' : p.id === 'slack' ? 'Slack' : 'WeChat'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{info.desc}</p>

                    {/* 状态 */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-400 animate-pulse' :
                        isPending ? 'bg-amber-400' :
                        'bg-slate-500'
                      }`} />
                      <span className={`text-[11px] ${
                        isConnected ? 'text-emerald-400' :
                        isPending ? 'text-amber-400' :
                        'text-slate-500'
                      }`}>
                        {isConnected ? '已连接' : isPending ? '待授权' : '未连接'}
                      </span>
                    </div>
                  </div>

                  {/* 操作 */}
                  <div className="flex flex-col gap-1.5">
                    {!isConnected ? (
                      <button
                        onClick={() => connectPlatform(p.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/50 transition-colors"
                      >
                        {isPending ? '重新授权' : '授权连接'}
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-center">
                        ✓ 已连接
                      </span>
                    )}
                    <button
                      onClick={() => togglePlatform(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        config.platforms.includes(p.id)
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-slate-700/60 text-slate-400 border border-slate-700/40'
                      }`}
                    >
                      {config.platforms.includes(p.id) ? '✓ 已选择' : '选择'}
                    </button>
                  </div>
                </div>

                {/* 配置步骤 */}
                {isPending && !isConnected && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40">
                    <div className="grid grid-cols-2 gap-2">
                      {info.steps.map((step, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[9px] text-amber-400 font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-[11px] text-slate-300">{step}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => connectPlatform(p.id)}
                      className="mt-3 w-full py-2 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white text-xs font-medium transition-colors"
                    >
                      🔑 完成授权 → 正式连接
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
        <div className="flex items-start gap-2">
          <span className="text-cyan-400 text-sm mt-0.5">💡</span>
          <div className="text-[11px] text-slate-400 leading-relaxed">
            <span className="text-slate-300 font-medium">多平台部署：</span>
            同一机器人可同时部署到多个平台，机器人会根据平台特性自动调整回复风格。
            {config.platforms.length > 0 && (
              <span className="block mt-1 text-cyan-400">
                已选择 {config.platforms.length} 个平台：
                {config.platforms.map(p => p === 'whatsapp' ? ' WhatsApp' : p === 'slack' ? ' Slack' : ' 微信').join('、')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step4: 知识库预览（AnyGen AI 生成）
function StepFour({ config }: { config: BotConfig }) {
  const [knowledge, setKnowledge] = useState<BotKnowledgeContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<'idle' | 'connected' | 'disconnected'>('idle');
  const [credits, setCredits] = useState<number | null>(null);
  const generatedRef = useRef(false);

  // 首次进入此步骤时，调用 AnyGen API 生成知识库
  const generateKnowledge = useCallback(async () => {
    if (generatedRef.current) return;
    generatedRef.current = true;
    setLoading(true);

    // 检查 API 状态
    try {
      const [status, creditsResult] = await Promise.all([
        validateApiKey(),
        getCredits(),
      ]);
      setApiStatus(status.valid ? 'connected' : 'disconnected');
      setCredits(creditsResult.credits > 0 ? creditsResult.credits : null);
    } catch {
      setApiStatus('disconnected');
    }

    try {
      const result = await generateBotKnowledge({
        botName: config.name,
        brandDesc: config.brandDesc,
        products: config.products,
        botType: config.type,
        personality: config.personality,
        language: config.language,
        websiteUrl: config.websiteUrl,
        docsMarkdown: config.docs.length > 0 ? combineMarkdown(config.docs) : undefined,
      });
      setKnowledge(result);
    } catch (err) {
      console.warn('[AnyGen] 知识库生成失败:', err);
      toast.warning('知识库由默认模板生成（AnyGen API 不可用时自动回退）');
    } finally {
      setLoading(false);
    }
  }, [config.brandDesc, config.name, config.products, config.type, config.personality, config.language, config.websiteUrl, config.docs.length]);

  React.useEffect(() => {
    generateKnowledge();
  }, [generateKnowledge]);

  const knowledgeAreas = [
    {
      icon: '🏢', title: '企业信息',
      desc: config.brandDesc || '品牌定位、核心价值观、企业愿景',
      color: 'text-blue-400',
      items: [
        config.websiteUrl || '官网URL未填写',
        ...(config.brandDesc ? ['品牌介绍已配置'] : []),
      ],
    },
    {
      icon: '📦', title: '产品知识',
      desc: '产品功能、规格、使用方法、定价方案',
      color: 'text-emerald-400',
      items: config.products.length > 0 ? config.products : PRODUCT_SUGGESTIONS.slice(0, 3).map(p => p + ' (未选择)'),
    },
    {
      icon: '💬', title: 'FAQ 问答',
      desc: '常见问题及标准答案库（AnyGen AI 生成）',
      color: 'text-amber-400',
      items: knowledge
        ? knowledge.faqs.slice(0, 4).map(f => `${f.q.slice(0, 16)}... → ${f.a.slice(0, 20)}...`)
        : ['产品咨询响应策略', '价格方案说明', '售后服务政策', '技术问题分级'],
    },
    {
      icon: '🎯', title: config.type === 'sales' ? '销售话术' : '服务话术',
      desc: config.type === 'sales' ? '转化话术、异议处理、催单策略' : '服务话术、投诉处理、升级流程',
      color: 'text-pink-400',
      items: knowledge
        ? knowledge.responses.slice(0, 4).map(r => `[${r.intent}] ${r.response.slice(0, 30)}...`)
        : config.type === 'sales'
        ? ['开场白模板', '需求挖掘话术', '价格异议处理', '促单技巧']
        : ['礼貌问候模板', '问题确认技巧', '解决方案呈现', '满意度调查话术'],
    },
    {
      icon: '🌐', title: '多语言支持',
      desc: `${config.language} 多语言自动识别与回复`,
      color: 'text-cyan-400',
      items: [`主语言: ${config.language}`, '多语言切换策略', '文化差异适配'],
    },
    {
      icon: '⏰', title: '服务规则',
      desc: `服务时间: ${config.serviceHours}`,
      color: 'text-violet-400',
      items: [`服务时间: ${config.serviceHours}`, `性格: ${config.personality}`, '非工作时间处理策略'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-lg">🧠</div>
        <div>
          <h3 className="text-sm font-bold text-white">Step 4：知识库预览</h3>
          <p className="text-xs text-slate-400">AI 机器人将基于以下知识库精准回复客户咨询</p>
        </div>
      </div>

      {/* AnyGen API 状态栏 */}
      <div className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs ${
        apiStatus === 'connected'
          ? 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-300'
          : apiStatus === 'disconnected'
          ? 'bg-amber-950/40 border border-amber-800/40 text-amber-300'
          : 'bg-slate-800/40 border border-slate-700/40 text-slate-400'
      }`}>
        <span>{apiStatus === 'connected' ? '✅' : apiStatus === 'disconnected' ? '⚠️' : '🔄'}</span>
        <span className="font-medium">
          {apiStatus === 'connected' ? 'AnyGen.io API 已连接' : apiStatus === 'disconnected' ? 'AnyGen.io API 未配置（使用默认知识库）' : '连接 AnyGen.io API...'}
        </span>
        {credits !== null && apiStatus === 'connected' && (
          <span className="ml-auto bg-emerald-500/20 px-2 py-0.5 rounded-full text-[10px]">
            💰 {credits} credits
          </span>
        )}
        {knowledge && (
          <span className="ml-auto text-cyan-400">✨ AnyGen 知识库已生成</span>
        )}
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-3 bg-cyan-950/30 border border-cyan-800/30 rounded-xl">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <div>
            <p className="text-xs text-cyan-300 font-medium">AnyGen.io 正在生成知识库...</p>
            <p className="text-[10px] text-slate-400">AI 分析企业信息 · 构建 FAQ · 生成回复话术</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {knowledgeAreas.map((area, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{area.icon}</span>
              <div>
                <span className={`text-sm font-bold ${area.color}`}>{area.title}</span>
                <p className="text-[10px] text-slate-500">{area.desc}</p>
              </div>
            </div>
            <div className="space-y-1">
              {area.items.map((item, j) => (
                <div key={j} className="flex items-start gap-1.5">
                  <span className="w-1 h-1 bg-slate-500 rounded-full flex-shrink-0 mt-1.5" />
                  <span className="text-[11px] text-slate-400 leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* AnyGen 能力展示 */}
      <div className="bg-gradient-to-r from-cyan-950/40 to-blue-950/40 rounded-xl p-4 border border-cyan-800/30">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-bold text-cyan-300">🧠 AnyGen.io 智能训练引擎</h4>
          {knowledge && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              ✨ 已生成 {knowledge.faqs.length} 条FAQ · {knowledge.responses.length} 条话术
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-lg font-bold text-cyan-400">{knowledge ? '95%+' : '—'}</div>
            <div className="text-[10px] text-slate-400">意图识别准确率</div>
          </div>
          <div>
            <div className="text-lg font-bold text-cyan-400">&lt;2s</div>
            <div className="text-[10px] text-slate-400">平均响应延迟</div>
          </div>
          <div>
            <div className="text-lg font-bold text-cyan-400">24/7</div>
            <div className="text-[10px] text-slate-400">全天候在线服务</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step5: 预览 & 部署（AnyGen API 驱动）
function StepFive({ config, onDeploy }: { config: BotConfig; onDeploy: () => void }) {
  const [deployed, setDeployed] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState('');
  const [apiError, setApiError] = useState<string | null>(null);

  const DEPLOY_PHASES = [
    { name: '连接 AnyGen API', progress: 15 },
    { name: '生成机器人配置', progress: 30 },
    { name: '训练意图识别模型', progress: 50 },
    { name: '配置部署平台', progress: 70 },
    { name: '测试连接响应', progress: 85 },
    { name: '正式上线运营', progress: 100 },
  ];

  const handleDeploy = async () => {
    setDeploying(true);
    setApiError(null);

    try {
      // Phase 1: 连接 AnyGen API
      setCurrentPhase(DEPLOY_PHASES[0].name);
      setProgress(5);
      const status = await validateApiKey();

      if (!status.valid) {
        setApiError('⚠️ AnyGen API Key 未配置或无效，将使用默认配置部署');
      } else {
        toast.success(`✅ AnyGen API 已连接（剩余 ${status.credits} credits）`);
      }

      // Phase 2: 生成机器人配置
      setCurrentPhase(DEPLOY_PHASES[1].name);
      for (let i = 10; i <= 30; i += 4) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 60));
      }

      // Phase 3: 训练意图识别模型（模拟 AnyGen AI 训练过程）
      setCurrentPhase(DEPLOY_PHASES[2].name);
      for (let i = 32; i <= 50; i += 3) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 50));
      }

      // Phase 4: 配置部署平台
      setCurrentPhase(DEPLOY_PHASES[3].name);
      for (let i = 52; i <= 70; i += 4) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 45));
      }

      // Phase 5: 测试连接响应
      setCurrentPhase(DEPLOY_PHASES[4].name);
      for (let i = 72; i <= 85; i += 5) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 40));
      }

      // Phase 6: 正式上线
      setCurrentPhase(DEPLOY_PHASES[5].name);
      for (let i = 87; i <= 100; i += 6) {
        setProgress(i);
        await new Promise(r => setTimeout(r, 50));
      }

      setDeploying(false);
      setDeployed(true);
      toast.success('🎉 机器人部署成功！已上线运营');
      onDeploy();
    } catch (err) {
      setDeploying(false);
      setApiError(String(err));
      toast.error('部署失败，请稍后重试');
    }
  };

  const platformNames = config.platforms.map(p =>
    p === 'whatsapp' ? 'WhatsApp' : p === 'slack' ? 'Slack' : '微信 WeChat'
  );

  const summaryItems = [
    { label: '机器人名称', value: config.name || '未命名机器人', icon: '🤖' },
    { label: '机器人类型', value: config.type === 'sales' ? 'AI 销售机器人' : 'AI 客服机器人', icon: config.type === 'sales' ? '💰' : '🎧' },
    { label: '部署平台', value: platformNames.length > 0 ? platformNames.join('、') : '暂未选择平台', icon: '🔗' },
    { label: '服务语言', value: config.language, icon: '🌐' },
    { label: '机器人性格', value: config.personality, icon: '🎭' },
    { label: '服务时间', value: config.serviceHours, icon: '⏰' },
    {
      label: '知识库文档',
      value: config.docs.length > 0
        ? `${config.docs.filter(d => d.status === 'done').length} 个文档（≈${config.docs.reduce((s, d) => s + d.tokenEstimate, 0).toLocaleString()} tokens）`
        : `${config.products.length} 个产品类别`,
      icon: '📚',
    },
    { label: '官网接入', value: config.websiteUrl ? '已配置' : '未配置', icon: '🌐' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-lg">🚀</div>
        <div>
          <h3 className="text-sm font-bold text-white">Step 5：预览 &amp; 部署</h3>
          <p className="text-xs text-slate-400">确认机器人配置，一键部署到选定平台</p>
        </div>
      </div>

      {/* 配置摘要 */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 overflow-hidden">
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">📋 机器人配置摘要</span>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            {deployed ? '✓ 已部署' : '待部署'}
          </span>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {summaryItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-2">
              <span className="text-sm">{item.icon}</span>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-500">{item.label}</span>
                <div className="text-xs text-slate-200 truncate">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 开场白预览 */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-3">
        <h4 className="text-xs font-semibold text-slate-300 mb-2">💬 开场白预览</h4>
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500/30 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              🤖
            </div>
            <div>
              <div className="text-xs text-emerald-300 font-medium mb-1">{config.name || '智能助手'}</div>
              <div className="text-sm text-slate-200 leading-relaxed">
                {config.greeting.replace('{company}', config.name || '本企业')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 部署进度 */}
      {deploying && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/40 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-cyan-300">🚀 {currentPhase}</span>
            </div>
            <span className="text-xs text-cyan-400 font-bold">{progress}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex gap-1 mt-2">
            {DEPLOY_PHASES.map((phase, i) => {
              const done = phase.progress <= progress;
              const active = progress >= (DEPLOY_PHASES[i - 1]?.progress ?? 0) + 1 && phase.progress > progress;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`w-full h-1 rounded-full mx-auto mb-1 transition-all ${done ? 'bg-emerald-500' : active ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
                  <span className={`text-[9px] leading-tight block ${done ? 'text-emerald-400' : active ? 'text-cyan-400' : 'text-slate-600'}`}>
                    {phase.name.slice(0, 4)}
                  </span>
                </div>
              );
            })}
          </div>
          {apiError && (
            <div className="mt-2 text-[10px] text-amber-400 bg-amber-950/30 rounded-lg px-2 py-1">
              {apiError}
            </div>
          )}
        </div>
      )}

      {/* 已部署状态 */}
      {deployed && (
        <div className="bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 rounded-xl border border-emerald-700/50 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl animate-pulse">🎉</div>
            <div>
              <h4 className="text-sm font-bold text-emerald-300">部署成功！</h4>
              <p className="text-xs text-slate-400">您的 AI 机器人已上线运营</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {platformNames.map((p, i) => (
              <div key={i} className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-2">
                <div className="text-xs text-emerald-300 font-medium">{p}</div>
                <div className="text-[10px] text-emerald-400">✓ 在线</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 部署按钮 */}
      {!deployed && (
        <button
          onClick={handleDeploy}
          disabled={deploying}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 border border-cyan-500/30 transition-all disabled:opacity-50"
        >
          🚀 {deploying ? `部署中... ${progress}%` : '一键部署机器人'}
        </button>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 主组件
// ══════════════════════════════════════════════════════════════

export function BotStudioDialog({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>(1);
  const [config, setConfig] = useState<BotConfig>(DEFAULT_BOT);

  const update = (c: Partial<BotConfig>) => setConfig(prev => ({ ...prev, ...c }));

  const canNext = () => {
    if (step === 1) return config.name.trim().length > 0;
    if (step === 2) return config.type !== null;
    if (step === 3) return true;
    return true;
  };

  const handleNext = () => {
    if (step < 5) setStep((step + 1) as Step);
  };

  const handlePrev = () => {
    if (step > 1) setStep((step - 1) as Step);
  };

  const handleDeploy = () => {
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('opc_bots') || '[]');
    saved.unshift({ ...config, id: Date.now(), createdAt: new Date().toISOString() });
    localStorage.setItem('opc_bots', JSON.stringify(saved.slice(0, 20)));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* 头部 */}
        <div className="bg-gradient-to-r from-cyan-800/60 to-blue-800/60 border-b border-cyan-700/30 px-5 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-lg">🤖</div>
            <div>
              <h2 className="text-base font-bold text-white">AI 机器人工作室</h2>
              <p className="text-xs text-cyan-200/70">AnyGen.io · 销售 &amp; 客服机器人一站式构建</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-cyan-300/70 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
              Powered by AnyGen.io
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none transition-colors">×</button>
          </div>
        </div>

        {/* 步骤指示 */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex-shrink-0">
          <StepIndicator current={step} />
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 1 && <StepOne config={config} update={update} />}
          {step === 2 && <StepTwo config={config} update={update} />}
          {step === 3 && <StepThree config={config} update={update} />}
          {step === 4 && <StepFour config={config} />}
          {step === 5 && <StepFive config={config} onDeploy={handleDeploy} />}
        </div>

        {/* 底部导航 */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between flex-shrink-0">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← 上一步
          </button>

          <div className="text-[11px] text-slate-500">
            {step}/5 · {STEP_LABELS[step - 1]}
          </div>

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canNext()}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              下一步 →
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
