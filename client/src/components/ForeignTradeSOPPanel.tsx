/**
 * ForeignTradeSOPPanel — 外贸AI客户开发业务SOP工作流面板
 * 18个工作流，覆盖 USP系统 / 销售物料 / 内容营销 / AI工具 / 客户调研 / 战略选品 / 邮件自动化 / 客户数据库 / LinkedIn运营
 * 新增 AI Studio 创作室
 */
import React, { useState, useCallback } from 'react';
import { toast } from 'sonner';

// ── 数据类型 ────────────────────────────────────────────────

type SOPPanelTab = 'overview' | 'all-workflows' | 'ai-studio' | 'completed';

interface ForeignTradeModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  skillCount: number;
  workflowIds: string[];
}

interface ForeignTradeWorkflow {
  id: string;
  module: string;
  name: string;
  description: string;
  longDescription?: string;
  source: 'official';
  category: 'foreign-trade';
  tags: string[];
  icon: string;
  installCount: number;
  stars: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isCompleted: boolean;
  installCommand?: string;
  officialHubUrl?: string;
  workflow?: string[];
  aiTools?: string[];
  deliverables?: string[];
  classDuration?: string;
  createdAt: string;
  updatedAt: string;
}

interface AITool {
  id: string;
  name: string;
  icon: string;
  description: string;
  useCase: string;
  color: string;
  url?: string;
}

// ── 模块配色映射 ─────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  'usp-system': 'from-red-500 to-rose-600',
  'sales-materials': 'from-blue-500 to-indigo-600',
  'content-marketing': 'from-green-500 to-emerald-600',
  'ai-studio': 'from-purple-500 to-violet-600',
  'customer-research': 'from-orange-500 to-amber-600',
  'strategy-planning': 'from-cyan-500 to-teal-600',
  'cold-email-automation': 'from-pink-500 to-rose-600',
  'customer-database': 'from-amber-600 to-yellow-600',
  'linkedin-operations': 'from-blue-700 to-sky-600',
};

const MODULE_ACCENT: Record<string, string> = {
  'usp-system': 'border-red-500/30 bg-red-500/5',
  'sales-materials': 'border-blue-500/30 bg-blue-500/5',
  'content-marketing': 'border-green-500/30 bg-green-500/5',
  'ai-studio': 'border-purple-500/30 bg-purple-500/5',
  'customer-research': 'border-orange-500/30 bg-orange-500/5',
  'strategy-planning': 'border-cyan-500/30 bg-cyan-500/5',
  'cold-email-automation': 'border-pink-500/30 bg-pink-500/5',
  'customer-database': 'border-amber-500/30 bg-amber-500/5',
  'linkedin-operations': 'border-blue-700/30 bg-blue-700/5',
};

const MODULE_TEXT: Record<string, string> = {
  'usp-system': 'text-red-400',
  'sales-materials': 'text-blue-400',
  'content-marketing': 'text-green-400',
  'ai-studio': 'text-purple-400',
  'customer-research': 'text-orange-400',
  'strategy-planning': 'text-cyan-400',
  'cold-email-automation': 'text-pink-400',
  'customer-database': 'text-amber-400',
  'linkedin-operations': 'text-blue-400',
};

// ── 模块配置 ────────────────────────────────────────────────

const SOP_MODULES: ForeignTradeModule[] = [
  { id: 'usp-system', name: 'USP系统搭建', icon: '🎯', description: '差异化价值定位系统', color: '#FF1552', skillCount: 1, workflowIds: ['wf-usp'] },
  { id: 'sales-materials', name: '销售物料武器库', icon: '📦', description: '20+种可激活客户的武器', color: '#4285F4', skillCount: 4, workflowIds: ['wf-catalog', 'wf-sales-arsenal', 'wf-negotiation-bot', 'wf-sales-process'] },
  { id: 'content-marketing', name: '内容营销矩阵', icon: '📈', description: 'LinkedIn + SEO 双驱动', color: '#00C853', skillCount: 4, workflowIds: ['wf-linkedin-content', 'wf-website-content', 'wf-newsletter', 'wf-seo-articles'] },
  { id: 'ai-studio', name: 'AI Studio 创作室', icon: '🤖', description: '视频 · 图片 · 文案 · 提案', color: '#9C27B0', skillCount: 5, workflowIds: ['wf-ai-video', 'wf-ai-image', 'wf-customer-proposal', 'wf-market-report', 'wf-ppt'] },
  { id: 'customer-research', name: '客户调研系统', icon: '🕵️', description: '5000字定制调研报告', color: '#FF9800', skillCount: 2, workflowIds: ['wf-customer-research', 'wf-buyer-perspective'] },
  { id: 'strategy-planning', name: '战略选品规划', icon: '🌐', description: '老板专用增长战略', color: '#00BCD4', skillCount: 1, workflowIds: ['wf-product-strategy'] },
  { id: 'cold-email-automation', name: 'Snov.io开发信自动化', icon: '📧', description: 'AI定制开发信 · Snov.io邮件自动化', color: '#E91E63', skillCount: 1, workflowIds: ['wf-snov-cold-email'] },
  { id: 'customer-database', name: '客户数据库搭建', icon: '🗄️', description: '从画像到网站列表到竞品挖掘', color: '#795548', skillCount: 2, workflowIds: ['wf-customer-icp', 'wf-similar-company'] },
  { id: 'linkedin-operations', name: 'LinkedIn运营系统', icon: '💼', description: '账号打造 · Carousel · 爆文 · Poll', color: '#0A66C2', skillCount: 5, workflowIds: ['wf-linkedin-profile', 'wf-linkedin-carousel', 'wf-linkedin-myth', 'wf-linkedin-narrative', 'wf-linkedin-poll'] },
];

// ── 全部工作流数据 ──────────────────────────────────────────

const ALL_WORKFLOWS: ForeignTradeWorkflow[] = [
  {
    id: 'wf-usp', module: 'usp-system', name: 'USP系统搭建工作流', icon: '🎯',
    description: '用AI + 竞品分析 + 购买心理学，帮你在课堂现场搭建差异化价值定位 + 可复用的价值叙述系统。',
    longDescription: 'USP（独特销售主张）系统搭建完整工作流：\n1. 竞品对标分析（AI扫描同类产品定位）\n2. 购买心理学框架应用（FEAR/归属/身份认同等）\n3. 差异化价值主张生成（从产品语言→客户语言）\n4. 可复用"说服骨架"输出（邮件版/短视频版/目录版）\n5. 现场迭代优化直至定位清晰\n\n结果是：你再也不会在邮件里"罗列优势"，而是说出客户想听的理由。',
    tags: ['USP', '差异化定位', '竞品分析', '购买心理学', '价值主张'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-usp',
    workflow: ['竞品分析', '心理学框架', 'USP生成', '说服骨架', '多格式输出'],
    aiTools: ['Claude', 'Perplexity', 'MarketMap'],
    deliverables: ['差异化定位文档', '价值叙述模板', '邮件/视频/目录说服骨架'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-catalog', module: 'sales-materials', name: '产品目录成交机器', icon: '📦',
    description: '把产品目录从"参数列表"变成"自动成交机器"。参数→价值点，列表→选型逻辑，静态展示→信任机制。',
    tags: ['产品目录', '转化率', '价值主张', '信任背书', '信息图'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-catalog',
    workflow: ['参数扫描', '价值翻译', '选型逻辑', '信任机制', '视觉升级', '多格式输出'],
    aiTools: ['Claude', 'AI作图', 'Canva'],
    deliverables: ['升级版产品目录PDF', '选型对照表', '信任背书合集'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-sales-arsenal', module: 'sales-materials', name: '销售武器库搭建', icon: '🗡️',
    description: '不只是报价单——20+种销售物料：采购指南、竞品对比表、技术白皮书、FAQ合集、行业趋势速览。每一个物料都是激活客户的一个武器。',
    tags: ['销售物料', '武器库', '报价单', '对比表', '白皮书'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-sales-arsenal',
    workflow: ['物料清单规划', 'AI批量生成初稿', '人工审核优化', '格式标准化', '分发策略制定'],
    aiTools: ['Claude', 'AI绘图', 'Canva', 'PDF工具'],
    deliverables: ['20+份可直接使用的销售物料', '物料分发 SOP'],
    classDuration: '约3小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-negotiation-bot', module: 'sales-materials', name: 'AI业务谈判机器人', icon: '🤖',
    description: '经过9个月迭代。你只要复制沟通记录给机器人，它就会判断真实动机，从几百种策略里选最合适的，给你2-3种回应思路+具体话术。',
    tags: ['谈判', '话术', 'AI谈判机器人', 'B2B', '异议处理'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 5.0, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-negotiation-bot',
    workflow: ['记录输入', '动机分析', '策略匹配', '话术输出', '结果复盘'],
    aiTools: ['Claude', '谈判策略库'],
    deliverables: ['谈判策略库访问权限', 'AI谈判助手使用权限', '常见谈判场景话术手册'],
    classDuration: '约1.5小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-sales-process', module: 'sales-materials', name: '销售流程SOP搭建', icon: '🔄',
    description: '搭建属于你产品的全链路SOP：开发-报价-推进-复盘，以及全团队统一标准话术库。让团队从"靠感觉"→"靠系统"。',
    tags: ['SOP', '销售流程', '话术库', '团队管理', '规模化'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-sales-process',
    workflow: ['现状调研', '流程梳理', '话术撰写', 'SOP文档化', '团队培训材料制作'],
    aiTools: ['Claude', 'Notion', '飞书文档'],
    deliverables: ['完整SOP手册', '全团队话术库', '新人培训手册'],
    classDuration: '约2.5小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-content', module: 'content-marketing', name: 'LinkedIn内容系统', icon: '💼',
    description: '搭建一整套内容思维模型：哪些内容激发兴趣、哪些建立信任、哪些驱动客户行动。几十个内容策略，当场产出可直接发布的内容。',
    tags: ['LinkedIn', '内容营销', '社媒运营', '询盘', '内容矩阵'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.7, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-content',
    workflow: ['账号诊断', '内容定位', 'Hook设计', '模板选择', '批量生产', '发布规划'],
    aiTools: ['Claude', 'LinkedIn AI助手'],
    deliverables: ['内容分类矩阵', '50+内容模板', '30天发布计划'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-website-content', module: 'content-marketing', name: '网站内容结构升级', icon: '🌐',
    description: '将网站从"展示型"升级为"成交型"。重构文案转化路径、买家信任链条、成交型架构。客户不再"看完就走"，而是开始信任你。',
    tags: ['网站优化', '转化率', '信任链条', '成交型', 'CRO'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-website-content',
    workflow: ['网站诊断', '信任链条梳理', '文案重构', '架构优化', 'CTA设计', '信任背书布局'],
    aiTools: ['Claude', '网站分析工具'],
    deliverables: ['网站诊断报告', '文案优化方案', '信任背书清单'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-newsletter', module: 'content-marketing', name: 'LinkedIn Newsletter工作流', icon: '📬',
    description: '搭建可订阅的Newsletter系统，客户只要订阅了你，你在LinkedIn发文章，他就会收到邮件推送。不打扰客户，但客户每周自己看你、记住你、慢慢信你。',
    tags: ['Newsletter', 'LinkedIn', '邮件营销', '内容订阅', '客户培育'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-newsletter',
    workflow: ['定位设计', '栏目规划', '文章结构', '生成机制', '订阅引导', '邮件配置'],
    aiTools: ['Claude', 'LinkedIn', '邮件系统'],
    deliverables: ['Newsletter定位文档', '栏目规划', '10篇预制文章'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-seo-articles', module: 'content-marketing', name: '人性化SEO文章生成', icon: '📝',
    description: '学习适合你的产品领域最佳SEO策略 + 如何写出"像人写的文章"。每天产出3篇不重复、可长期排名的文章，网站流量变成真实询盘。',
    tags: ['SEO', '文章写作', '内容营销', '网站流量', '自然排名'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-seo-articles',
    workflow: ['SEO策略分析', '关键词研究', '文章结构设计', 'AI写作优化', '反AI检测', '批量生产'],
    aiTools: ['Claude', 'SEO工具', 'Humanizer'],
    deliverables: ['SEO策略文档', '文章模板库', '30天发布计划'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-ai-video', module: 'ai-studio', name: 'AI视频制作工作流', icon: '🎬',
    description: '低成本产品展示视频、虚拟工厂展示、客户定制开发信视频。三种视频类型，覆盖电商/社媒/冷 outreach 全场景。',
    tags: ['AI视频', '产品展示', '工厂展示', '冷 outreach', 'TikTok'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-ai-video',
    workflow: ['场景选择', '素材准备', 'AI生图', 'AI视频生成', '多平台适配', '邮件嵌入'],
    aiTools: ['GPTImage2', 'Seedance2', 'Kling', 'HeyGen'],
    deliverables: ['3种类型视频制作流程', 'AI工具配置指南', '多平台分发模板'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-ai-image', module: 'ai-studio', name: 'AI作图工作流', icon: '🖼️',
    description: '定制化产品Mockup虚拟打样、场景化产品Lifestyle展示，专业英文信息图。让你的产品在视觉上碾压竞品。',
    tags: ['AI作图', '产品图', 'Mockup', 'Lifestyle', '信息图'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.7, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-ai-image',
    workflow: ['场景选择', '参考图收集', 'AI生图提示词生成', '图像生成', '后期优化', '多平台适配'],
    aiTools: ['GPTImage2', 'NanoBananaPro', 'Midjourney'],
    deliverables: ['3种类型作图流程', 'AI提示词模板库', '图片规范文档'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-customer-proposal', module: 'ai-studio', name: '针对性客户提案AI', icon: '📊',
    description: '要见大客户？根据对方具体痛点，用AI工作流生成一份逻辑严密、直击痛点的Pitch Deck。直接下载可用，每一页的具体文案都帮你写好。',
    tags: ['提案', 'Pitch Deck', '大客户', 'AI提案', '销售工具'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-customer-proposal',
    workflow: ['客户调研', '痛点分析', '方案设计', '提案框架', 'AI文案生成', '视觉设计', '演练话术'],
    aiTools: ['Claude', 'Perplexity', 'AI PPT工具'],
    deliverables: ['完整Pitch Deck（PPT格式）', '每页讲解话术', '客户背景调研摘要'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-market-report', module: 'ai-studio', name: '行业趋势洞察报告AI', icon: '📈',
    description: '给客户从咨询公司角度出方案。深度分析市场机会 + 客户当前痛点 + 产品如何解决具体问题 = 一份图文并茂的深度报告，提升你的专业溢价。',
    tags: ['行业报告', '市场分析', '趋势洞察', '咨询', '专业形象'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.8, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-market-report',
    workflow: ['数据收集', '市场分析', '痛点挖掘', '方案匹配', '报告生成', '图表制作', '多格式输出'],
    aiTools: ['Claude', 'Perplexity', 'AI图表', 'AI PPT'],
    deliverables: ['完整行业洞察报告（PDF/PPT）', '配套数据表格', '客户沟通话术'],
    classDuration: '约2.5小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-ppt', module: 'ai-studio', name: 'AI生成PPT工作流', icon: '📑',
    description: '产品说明书、公司介绍、培训课件、行业分享——所有需要PPT的场景，AI帮你从大纲到设计全搞定。输入内容要点，输出可直接演示的专业PPT。',
    tags: ['PPT', '演示文稿', 'AI制作', '产品说明书', '公司介绍'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-ppt',
    workflow: ['场景选择', '内容输入', 'AI大纲生成', '内容撰写', '设计优化', 'PPT生成'],
    aiTools: ['Claude', 'Gamma', 'Beautiful.ai', 'Canva'],
    deliverables: ['可直接演示的PPT文件', '配套演讲备注', '多语言版本（如需要）'],
    classDuration: '约1.5小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-customer-research', module: 'customer-research', name: '定向客户5000字调研报告', icon: '🕵️',
    description: '针对某一个特定客户公司，AI帮你生成一份5000字+的咨询公司级别分析报告：供应链结构、采购画像、市场环境、销售切入角度、邮件策略。',
    tags: ['客户调研', '5000字报告', '定向开发', '背调', '邮件策略'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 5.0, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-customer-research',
    workflow: ['信息收集', '供应链分析', '采购画像', '市场分析', '切入设计', '邮件策略', '报告生成'],
    aiTools: ['Claude', 'Perplexity', 'LinkedIn分析'],
    deliverables: ['5000字+客户调研报告', '个性化邮件模板', '销售切入建议'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-buyer-perspective', module: 'customer-research', name: '买家视角研究工作流', icon: '👁️',
    description: '详细拆解目标行业采购流程，从需求产生到供应商筛选。深度分析：决策人角色、采购痛点、替换供应商动因、内容影响路径。',
    tags: ['买家视角', '采购流程', '决策分析', '内容营销', '客户开发'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.7, reviewCount: 0, isFeatured: false, isCompleted: false,
    installCommand: 'clawhub install wf-buyer-perspective',
    workflow: ['采购流程梳理', '决策人分析', '痛点提取', '替换动因', '内容路径', '沟通策略'],
    aiTools: ['Claude', 'Perplexity', '行业数据库'],
    deliverables: ['买家视角分析报告', '决策人画像', '内容策略地图'],
    classDuration: '约1.5小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-product-strategy', module: 'strategy-planning', name: '选品+营销战略（老板专用）', icon: '🏆',
    description: '用AI + 数据判断：哪些品类竞争小/利润高/增长快？哪些渠道还没被主流走通？如何制定差异化战略？帮助老板做有数据依据的增长决策。',
    tags: ['选品', '营销战略', '老板决策', '差异化', '增长战略'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-product-strategy',
    workflow: ['品类数据分析', '利润测算', '趋势研究', '差异化识别', '渠道规划', '战略制定'],
    aiTools: ['Claude', 'Perplexity', '亚马逊数据工具', 'Google Trends'],
    deliverables: ['选品分析报告', '营销战略方案', '差异化打法建议', '增长路线图'],
    classDuration: '约3小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-snov-cold-email', module: 'cold-email-automation', name: 'Snov.io AI定制开发信工作流', icon: '📧',
    description: '用Snov.io + AI，从客户画像到USP提炼，再到5封高度个性化开发信、弱CTA Warm Email、9种跟进邮件策略，配合Snov.io邮件自动化，实现批量触达、持续跟进、询盘稳定到来。',
    tags: ['Snov.io', '开发信', 'Cold Email', 'Warm Email', '邮件自动化', '客户画像', 'USP', '跟进策略'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 5.0, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-snov-cold-email',
    workflow: [
      '步骤0：AI生成目标客户画像（ICP）',
      '步骤1：AI梳理产品USP',
      '步骤2：生成5封高度个性化Cold Email',
      '步骤3+：生成1封弱CTA Warm Email',
      '步骤4：生成9种跟进邮件策略',
      '步骤5：Snov.io邮件自动化配置'
    ],
    aiTools: ['Claude', 'Perplexity', 'Gary Fen分身系列', 'Snov.io', 'Snovio.cn Email Finder', 'Snovio.cn Email Warm-up'],
    deliverables: [
      '多份目标客户画像（ICP）',
      '公司USP列表',
      '5封个性化Cold Email',
      '1封弱CTA Warm Email',
      '9封跟进邮件模板',
      'Snov.io自动化配置方案',
      '客户列表分类建议（≤500人/列表）'
    ],
    classDuration: '2天内部课（约4-6小时）', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T01:00:00Z'
  },
  {
    id: 'wf-customer-icp', module: 'customer-database', name: '客户画像创立工作流', icon: '🧩',
    description: '用AI深度分析你的产品，自动生成详细的ICP（目标客户画像）列表。覆盖行业/公司规模/地理/采购行为/供应链复杂度/决策链/痛点/市场趋势，生成可直接用于开发信 Targeting 的精准画像。',
    tags: ['ICP', '客户画像', '目标客户', 'B2B', '批量采购', '客户数据库'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 5.0, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-customer-icp',
    workflow: [
      'AI询问产品信息（产品名称/目标行业/细分领域）',
      'AI从9个维度深度分析目标客户',
      '生成行业细分（Industry Segment）',
      '生成公司特征（规模/营业额/独特优势）',
      '生成地理聚焦（Geographical Focus）',
      '生成采购行为（Buying Behavior）',
      '生成痛点（Pain Points）',
      '导出可执行的ICP文档'
    ],
    aiTools: ['Claude', 'Perplexity', 'LinkedIn Sales Navigator', 'Snov.io'],
    deliverables: ['多份详细ICP文档', '行业分类矩阵', '地理优先级列表', '采购行为画像', '痛点清单'],
    classDuration: '约1小时（AI主导，人工确认）', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-similar-company', module: 'customer-database', name: '竞品公司网站相似列表生成', icon: '🔍',
    description: '基于已有客户公司网站，用AI生成20个高度相似的竞品公司网站列表。排除知名大企业，专注新兴、快速增长的中小型公司，用于精准客户数据库扩充。',
    tags: ['竞品公司', '网站列表', '相似公司', 'Lead Generation', '客户数据库', 'Snov.io'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-similar-company',
    workflow: [
      '提供种子公司域名（已知客户网站）',
      'AI深度分析种子公司网站（9个维度）',
      '定义相似性评估指标（行业/规模/地理/商业模式）',
      'AI从海量数据库中筛选相似公司',
      '评分排序，输出Top 20相似公司列表',
      '表格形式导出（含域名+采购理由）',
      '可选：重复步骤扩充客户数据库'
    ],
    aiTools: ['Claude', 'Perplexity', 'LinkedIn Sales Navigator', 'Snov.io Email Finder', 'Crunchbase'],
    deliverables: ['20个相似公司域名列表（表格格式）', '每家公司大批量采购理由', '相似度评分排序', '可直接用于Snov.io Email Finder的目标域名清单'],
    classDuration: '约1.5小时（AI主导分析，人工验证）', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-profile', module: 'linkedin-operations', name: 'LinkedIn账号打造工作流', icon: '👤',
    description: '从账号评估、标题创作、About撰写到Thought Leadership全方位打造LinkedIn账号IP，让目标客户主动找你、信任你、联系你。',
    tags: ['LinkedIn', '账号打造', 'Headline', 'About', 'Thought Leadership', 'Inbound', 'Outbound'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 5.0, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-profile',
    workflow: [
      '步骤1：LinkedIn账号评估（全选Profile文字→AI分析）',
      '步骤2：LinkedIn Headline创作（产品/USP/目标客户）',
      '步骤3：LinkedIn About撰写（个性化Bio）',
      '步骤4：LinkedIn About优化（SEO/USP突出/成果数据化）'
    ],
    aiTools: ['Claude', 'Perplexity', 'Gary Fen分身 - LinkedIn主页打造'],
    deliverables: ['账号评估报告', '优化版Headline', '优化版About Bio', '内容策略建议'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-carousel', module: 'linkedin-operations', name: 'LinkedIn Carousel轮播内容工作流', icon: '🎠',
    description: '用AI生成20个Carousel Idea → 选择最优Idea → 生成完整10页轮播内容。涵盖信息图/How-to/行业洞察等多种类型，大幅提升账号互动率和曝光量。',
    tags: ['LinkedIn', 'Carousel', '轮播内容', '内容营销', '互动率', '权威内容'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-carousel',
    workflow: [
      '步骤1：生成20个LinkedIn Carousel Ideas（Google Trends + 市场报告）',
      '步骤2：基于选定Idea生成完整10页轮播内容',
      '步骤3：买家视角热点话题发现（客户语言→传播上下文→热议话题）'
    ],
    aiTools: ['Claude', 'Perplexity', 'Google Trends', 'Answer the Public'],
    deliverables: ['20个Carousel Idea列表', '完整10页Carousel内容', '5-8个买家视角热点话题', '内容策略建议'],
    classDuration: '约2小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-myth', module: 'linkedin-operations', name: '打破误解型内容工作流', icon: '💥',
    description: '用AI生成高互动率的打破误解型LinkedIn爆文。融合反差Hook + 个人经历 + 行业真相揭露 + 买家心理洞察 + 6-12条Myth/Trap清单，让内容像资深老外贸写的。',
    tags: ['LinkedIn', 'Myth-Busting', '打破误解', '爆文', 'Buyer Psychology', '互动率'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-myth',
    workflow: [
      'AI询问产品+ICP（如未提供）',
      'AI应用内部策略引擎（9步）',
      '生成Personal Voice Layer内容',
      '输出Myth/Trap清单 + Soft CTA',
      '可扫描、高张力、高互动格式'
    ],
    aiTools: ['Claude'],
    deliverables: ['高互动率Myth-Busting帖子', '6-12条Myth/Trap清单', 'Soft CTA文案'],
    classDuration: '约1小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-narrative', module: 'linkedin-operations', name: '身份重塑型叙事爆文工作流', icon: '🎭',
    description: '用AI生成高情感共鸣的叙事型LinkedIn爆文。从逆向Hook开场 → 背景故事 → 隐藏机制揭露 → ICP痛点可视化 → 身份转换 → Lead Magnet CTA，形成完整叙事弧线。',
    tags: ['LinkedIn', '叙事爆文', '身份重塑', 'Buyer Psychology', '情感共鸣', 'Lead Magnet'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-narrative',
    workflow: [
      'AI自动检测产品+ICP',
      'Contrarian Shock Opening',
      '背景故事 + Hidden Mechanism揭露',
      'ICP Pain Visualization + Identity Shift',
      'Lead Magnet CTA + Emotional Closing',
      '7-10短章节叙事格式输出'
    ],
    aiTools: ['Claude'],
    deliverables: ['高情感叙事型帖子', 'Lead Magnet CTA关键词', '评论引导文案'],
    classDuration: '约1小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
  {
    id: 'wf-linkedin-poll', module: 'linkedin-operations', name: 'LinkedIn Poll投票内容工作流', icon: '📊',
    description: '用AI生成10个高度相关的Poll Idea → 选择最优质 → 优化成完整Poll Post。投票是领英互动率最容易提升的内容形式，显著提升账号活跃度和可见性。',
    tags: ['LinkedIn', 'Poll', '投票', '互动率', '内容营销', '市场调研'], category: 'foreign-trade', source: 'official',
    installCount: 0, stars: 0, rating: 4.7, reviewCount: 0, isFeatured: true, isCompleted: false,
    installCommand: 'clawhub install wf-linkedin-poll',
    workflow: [
      '步骤1：生成10个高度相关的Poll Ideas',
      '步骤2：选择最优质Idea → 优化成完整Poll Post',
      '视觉设计建议',
      '发布时机 + Hashtags建议',
      '评论引导策略'
    ],
    aiTools: ['Claude', 'Perplexity'],
    deliverables: ['10个Poll Idea列表', '完整Poll Post', '视觉设计建议', '发布策略'],
    classDuration: '约1小时', createdAt: '2026-04-25T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z'
  },
];

// ── AI Studio 工具 ────────────────────────────────────────────

const AI_TOOLS: AITool[] = [
  { id: 'gpt-image-2', name: 'GPT Image 2', icon: '🖼️', description: 'Arena图像榜第一 · 2K/4K高清 · 精确文字渲染', useCase: '产品Mockup · 场景图 · 信息图', color: '#8B5CF6', url: 'https://playbooks.com/gpt-image-2' },
  { id: 'seedance', name: 'Seedance 2.0', icon: '🎬', description: '字节跳动旗舰 · Arena视频榜第一 · 文字/图片/音频多模态', useCase: '产品展示视频 · 工厂视频', color: '#F59E0B', url: 'https://playbooks.com/seedance' },
  { id: 'heygon', name: 'HeyGen', icon: '🎭', description: '数字人视频 · 175+语言 · $0.033/秒', useCase: '个性化开发信视频 · 数字人客服', color: '#EC4899', url: 'https://heygen.com' },
  { id: 'claude', name: 'Claude', icon: '🧠', description: 'Anthropic旗舰 · 深度内容创作 · 谈判策略', useCase: '提案撰写 · 谈判话术 · SOP编写', color: '#EF4444', url: 'https://claude.ai' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔭', description: 'AI搜索 · 深度行业研究 · 多模型验证', useCase: '客户调研 · 市场分析 · 竞品研究', color: '#10B981', url: 'https://perplexity.ai' },
  { id: 'nano-banana', name: 'Nano Banana Pro', icon: '🍌', description: 'Gemini 3 Pro Image · 2K高清 · 精确文字', useCase: '产品场景图 · Mockup · 营销素材', color: '#F97316', url: 'https://playbooks.com/nano-banana' },
  { id: 'kling', name: 'Kling 可灵', icon: '⚡', description: '快手旗舰 · 5秒~3分钟视频 · 文字/图片生成', useCase: '产品展示视频 · 工厂流水线', color: '#6366F1', url: 'https://kling.kuaishou.com' },
  { id: 'gamma', name: 'Gamma PPT', icon: '📊', description: 'AI生成PPT · 设计师级设计 · 一键导出', useCase: '提案PPT · 产品说明书 · 培训课件', color: '#0EA5E9', url: 'https://gamma.app' },
  { id: 'humanizer', name: 'Humanizer', icon: '🎭', description: '反AI检测 · 注入本地化语气 · 保持品牌调性', useCase: 'SEO文章 · 开发信 · 社媒内容', color: '#14B8A6', url: 'https://playbooks.com/humanizer' },
  { id: 'canva', name: 'Canva', icon: '🎨', description: '在线设计平台 · 品牌套件 · AI辅助设计', useCase: '销售物料 · 信息图 · 演示文稿', color: '#00C4CC', url: 'https://canva.com' },
  { id: 'linkedin-ai', name: 'LinkedIn AI', icon: '💼', description: '内容优化 · Hook生成 · Newsletter自动化', useCase: 'LinkedIn内容 · Newsletter · 客户档案', color: '#0A66C2', url: 'https://linkedin.com' },
  { id: 'ga4', name: 'GA4 分析助手', icon: '📈', description: '实时访客 · 转化漏斗 · SEO关键词排名', useCase: '数据分析 · 效果追踪 · ROI优化', color: '#FBBc05', url: 'https://playbooks.com/ga4-analytics' },
];

// ── 学员说（社会证明）─────────────────────────────────────────

const TESTIMONIALS = [
  { name: '李总', company: '宁波某机械出口商', quote: '谈判机器人太好用了，客户砍价的时候我再也不慌了，直接问AI，它给我2-3个应对方案，真的帮了大忙。' },
  { name: '张总', company: '深圳某3C配件卖家', quote: '5000字客户调研报告，客户看完以后说我是他见过最专业的一个供应商，当月就下了第一个柜子。' },
  { name: '王总', company: '广州某家具出口商', quote: '销售武器库里的采购指南，客户拿去给他的采购团队做培训，直接帮客户建立了对我们品牌的信任。' },
  { name: '陈总', company: '杭州某纺织服装厂', quote: 'LinkedIn内容系统太牛了，发了一个月，询盘质量明显不一样了，而且加人的通过率也高了。' },
];

// ── 子组件：工作流卡片 ─────────────────────────────────────────

function WorkflowCard({ workflow, onDetail, onToggle }: {
  workflow: ForeignTradeWorkflow;
  onDetail: (w: ForeignTradeWorkflow) => void;
  onToggle: (id: string) => void;
}) {
  const mod = workflow.module;
  const accent = MODULE_ACCENT[mod] || 'border-slate-700/50';
  const textColor = MODULE_TEXT[mod] || 'text-slate-400';
  const grad = MODULE_COLORS[mod] || 'from-slate-500 to-slate-600';

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all hover:shadow-lg hover:scale-[1.01] ${accent}`}>
      {/* 头部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{workflow.icon}</span>
          <div>
            <h4 className="font-semibold text-sm text-white leading-tight">{workflow.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              {workflow.isFeatured && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">推荐</span>
              )}
              {workflow.classDuration && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400">⏱ {workflow.classDuration}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] ${textColor}`}>⭐ {workflow.rating.toFixed(1)}</span>
          {workflow.isCompleted && <span className="text-emerald-400 text-sm">✓</span>}
        </div>
      </div>

      {/* 描述 */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{workflow.description}</p>

      {/* AI工具 */}
      {workflow.aiTools && workflow.aiTools.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {workflow.aiTools.map((t, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-400">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* 工作流步骤 */}
      {workflow.workflow && workflow.workflow.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {workflow.workflow.slice(0, 4).map((w, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-500">
              {i > 0 && <span className="text-slate-700 mr-0.5">→</span>}{w}
            </span>
          ))}
          {workflow.workflow.length > 4 && (
            <span className="text-[10px] text-slate-600">+{workflow.workflow.length - 4}</span>
          )}
        </div>
      )}

      {/* 操作 */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={() => onDetail(workflow)}
          className="flex-1 text-xs py-1.5 rounded-lg font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500 transition-all"
        >
          查看详情
        </button>
        <button
          onClick={() => onToggle(workflow.id)}
          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
            workflow.isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300'
          }`}
        >
          {workflow.isCompleted ? '✓ 已完成' : '标记完成'}
        </button>
      </div>
    </div>
  );
}

// ── 子组件：工作流详情弹窗 ──────────────────────────────────

function WorkflowDetailDialog({ workflow, onClose, onToggle }: {
  workflow: ForeignTradeWorkflow;
  onClose: () => void;
  onToggle: (id: string) => void;
}) {
  const mod = workflow.module;
  const moduleInfo = SOP_MODULES.find(m => m.id === mod);
  const textColor = MODULE_TEXT[mod] || 'text-slate-400';
  const accent = MODULE_ACCENT[mod] || 'border-slate-700/50';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 bg-gradient-to-r ${MODULE_COLORS[mod] || 'from-slate-600 to-slate-700'} px-6 py-4 flex items-start justify-between gap-4`}>
          <div className="flex items-start gap-3">
            <span className="text-3xl">{workflow.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                {moduleInfo && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 text-white/80">{moduleInfo.icon} {moduleInfo.name}</span>
                )}
                {workflow.isFeatured && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">⭐ 推荐</span>
                )}
              </div>
              <h2 className="text-lg font-bold text-white">{workflow.name}</h2>
              <p className="text-xs text-white/60 mt-0.5">⏱ {workflow.classDuration} · ⭐ {workflow.rating.toFixed(1)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors shrink-0">✕</button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* 描述 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-2">工作流简介</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{workflow.description}</p>
          </div>

          {/* 详细说明 */}
          {workflow.longDescription && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">完整内容</h3>
              <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
                {workflow.longDescription.split('\n').map((line, i) => (
                  <p key={i} className={`text-xs leading-relaxed mb-1 ${line.startsWith('场景') || line.startsWith('结果是') || line.includes('★') ? 'text-amber-300 font-medium mt-2' : line.startsWith('★') ? 'text-amber-400' : 'text-slate-400'}`}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 工作流步骤 */}
          {workflow.workflow && workflow.workflow.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">工作流步骤</h3>
              <div className="space-y-2">
                {workflow.workflow.map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${accent}`}>
                    <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${MODULE_COLORS[mod]} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {i + 1}
                    </div>
                    <span className="text-sm text-slate-300">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI工具 */}
          {workflow.aiTools && workflow.aiTools.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">使用到的AI工具</h3>
              <div className="flex flex-wrap gap-2">
                {workflow.aiTools.map((tool, i) => (
                  <span key={i} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-300">
                    🤖 {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 交付物 */}
          {workflow.deliverables && workflow.deliverables.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">课上交付成果</h3>
              <div className="space-y-1.5">
                {workflow.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="text-emerald-400">✓</span>
                    <span>{d}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 安装命令 */}
          {workflow.installCommand && (
            <div>
              <h3 className="text-sm font-semibold text-slate-300 mb-2">安装命令</h3>
              <div className="bg-slate-950 rounded-lg p-3 font-mono text-xs text-slate-400 border border-slate-800 flex items-center justify-between gap-2">
                <span className="break-all">$ {workflow.installCommand}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(workflow.installCommand!);
                    toast.success('命令已复制到剪贴板');
                  }}
                  className="shrink-0 text-xs px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  复制
                </button>
              </div>
            </div>
          )}

          {/* 标签 */}
          <div className="flex flex-wrap gap-1.5">
            {workflow.tags.map((tag, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/50">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-3">
          <button
            onClick={() => { onToggle(workflow.id); onClose(); }}
            className={`text-sm px-5 py-2.5 rounded-xl font-semibold transition-all ${
              workflow.isCompleted
                ? 'bg-emerald-600/80 text-white hover:bg-emerald-600'
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:from-indigo-500 hover:to-violet-500'
            }`}
          >
            {workflow.isCompleted ? '✓ 已标记完成' : '✓ 标记为已完成'}
          </button>
          <button
            onClick={() => {
              if (workflow.installCommand) {
                navigator.clipboard.writeText(workflow.installCommand);
                toast.success('安装命令已复制到剪贴板');
              }
            }}
            className="text-xs px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            📋 复制安装命令
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 子组件：学员说 ──────────────────────────────────────────────

function TestimonialsSection() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <span>💬</span> 学员说
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {TESTIMONIALS.map((t, i) => (
          <div key={i} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/40">
            <p className="text-xs text-slate-300 leading-relaxed mb-3 italic">"{t.quote}"</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
                {t.name[0]}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-300">{t.name}</div>
                <div className="text-[10px] text-slate-500">{t.company}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────

export function ForeignTradeSOPPanel() {
  const [activeTab, setActiveTab] = useState<SOPPanelTab>('overview');
  const [workflows, setWorkflows] = useState<ForeignTradeWorkflow[]>(ALL_WORKFLOWS);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ForeignTradeWorkflow | null>(null);
  const [search, setSearch] = useState('');

  const handleToggle = useCallback((id: string) => {
    setWorkflows(prev => prev.map(w =>
      w.id === id ? { ...w, isCompleted: !w.isCompleted } : w
    ));
    const w = workflows.find(w => w.id === id);
    toast.success(w?.isCompleted ? `"${w?.name}" 已取消完成标记` : `"${w?.name}" 已标记完成！继续加油 💪`);
  }, [workflows]);

  const filteredWorkflows = search.trim()
    ? workflows.filter(w =>
        w.name.includes(search) || w.description.includes(search) ||
        w.tags.some(t => t.includes(search)) ||
        (w.aiTools || []).some(t => t.toLowerCase().includes(search.toLowerCase()))
      )
    : workflows;

  const completedCount = workflows.filter(w => w.isCompleted).length;
  const totalCount = workflows.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* 顶部标题 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🌍</span> 外贸AI客户开发业务SOP
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            18个工作流 · 2天线下课 · 不讲概念，带你做完搭出来，当场就能用
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 完成进度 */}
          <div className="flex items-center gap-2 bg-slate-800/60 rounded-lg px-3 py-1.5 border border-slate-700/40">
            <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="text-[10px] text-slate-400">{completedCount}/{totalCount}</span>
          </div>
          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            {completionRate}% 完成
          </span>
        </div>
      </div>

      {/* 搜索 */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索工作流、AI工具或标签..."
        className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70"
      />

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl">
        {([
          { id: 'overview', label: '🎯 工作流概览', count: 9 },
          { id: 'all-workflows', label: '📋 全部工作流', count: workflows.length },
          { id: 'ai-studio', label: '🤖 AI Studio', count: AI_TOOLS.length },
          { id: 'completed', label: '✓ 已完成', count: completedCount },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.label} <span className="opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* ── Tab: 工作流概览 ─────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-indigo-600/20 via-violet-600/20 to-purple-600/20 border border-indigo-500/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-4xl">🌍</div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-1">外贸AI工作流实操线下课</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  2天全员持续输出，不讲一句废话。18个工作流，每一个都不讲虚的，搭出来就是你的，落地后直接用。
                </p>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">🎯 USP系统</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">📦 销售武器库</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">🤖 AI谈判机器人</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">🕵️ 5000字调研</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">🎬 AI视频</span>
                  <span className="bg-slate-800/80 px-2 py-1 rounded-full border border-slate-700/40">📊 AI提案</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="text-2xl font-bold text-indigo-400">{completionRate}%</div>
                <div className="text-[10px] text-slate-500">总完成度</div>
              </div>
            </div>
          </div>

          {/* 6大模块卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SOP_MODULES.map(mod => {
              const modWorkflows = workflows.filter(w => w.module === mod.id);
              const modCompleted = modWorkflows.filter(w => w.isCompleted).length;
              const grad = MODULE_COLORS[mod.id] || 'from-slate-500 to-slate-600';
              const accent = MODULE_ACCENT[mod.id] || 'border-slate-700/50';
              const textColor = MODULE_TEXT[mod.id] || 'text-slate-400';

              return (
                <div
                  key={mod.id}
                  className={`rounded-xl border p-4 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer ${accent}`}
                  onClick={() => { setActiveTab('all-workflows'); setSearch(mod.name); }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-lg`}>
                      {mod.icon}
                    </div>
                    <span className={`text-[10px] ${textColor}`}>{modCompleted}/{mod.skillCount}</span>
                  </div>
                  <h3 className="font-bold text-sm text-white mb-1">{mod.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{mod.description}</p>
                  <div className="w-full h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${grad} rounded-full transition-all`}
                      style={{ width: mod.skillCount > 0 ? `${(modCompleted / mod.skillCount) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* 学员说 */}
          <TestimonialsSection />
        </div>
      )}

      {/* ── Tab: 全部工作流 ─────────────────────────────── */}
      {activeTab === 'all-workflows' && (
        <div>
          {/* 模块分组 */}
          {SOP_MODULES.map(mod => {
            const modWorkflows = filteredWorkflows.filter(w => w.module === mod.id);
            if (modWorkflows.length === 0 && search.trim()) return null;

            const grad = MODULE_COLORS[mod.id] || 'from-slate-500 to-slate-600';
            const accent = MODULE_ACCENT[mod.id] || '';
            const textColor = MODULE_TEXT[mod.id] || 'text-slate-400';
            const completed = modWorkflows.filter(w => w.isCompleted).length;

            return (
              <div key={mod.id} className="mb-6">
                {/* 模块标题 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center text-lg shadow`}>
                    {mod.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{mod.name}</h3>
                    <p className="text-[10px] text-slate-500">{mod.description} · {completed}/{modWorkflows.length} 已完成</p>
                  </div>
                </div>
                {/* 工作流网格 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {modWorkflows.map(w => (
                    <WorkflowCard
                      key={w.id}
                      workflow={w}
                      onDetail={setSelectedWorkflow}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {filteredWorkflows.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-4 opacity-50">🔍</div>
              <h3 className="font-bold text-white mb-2">没有找到匹配的工作流</h3>
              <p className="text-xs text-slate-500">尝试调整搜索关键词</p>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: AI Studio ─────────────────────────────── */}
      {activeTab === 'ai-studio' && (
        <div className="space-y-5">
          {/* AI Studio 介绍 */}
          <div className="bg-gradient-to-r from-purple-600/20 to-violet-600/20 border border-purple-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🤖</div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">AI Studio 创作室</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  集成 12 款顶级AI工具，覆盖视频、图片、文案、提案、PPT 全创作场景。每个工具都是外贸业务中的高频需求，配合SOP工作流使用效果最佳。
                </p>
              </div>
            </div>
          </div>

          {/* 工具分类 */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>🎬</span> 视频生成
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {AI_TOOLS.filter(t => ['seedance', 'heygon', 'kling'].includes(t.id)).map(tool => (
                <div key={tool.id} className="rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-all hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${tool.color}20` }}>
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                      <p className="text-[10px] text-slate-500">{tool.useCase}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tool.description}</p>
                  {tool.url && (
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors inline-block"
                    >
                      打开 ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>🖼️</span> 图像生成
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
              {AI_TOOLS.filter(t => ['gpt-image-2', 'nano-banana', 'canva', 'humanizer'].includes(t.id)).map(tool => (
                <div key={tool.id} className="rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-all hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${tool.color}20` }}>
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                      <p className="text-[10px] text-slate-500">{tool.useCase}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tool.description}</p>
                  {tool.url && (
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors inline-block">
                      打开 ↗
                    </a>
                  )}
                </div>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>📝</span> 内容 & 分析
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {AI_TOOLS.filter(t => ['claude', 'perplexity', 'gamma', 'linkedin-ai', 'ga4'].includes(t.id)).map(tool => (
                <div key={tool.id} className="rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-all hover:shadow-lg group">
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl" style={{ background: `${tool.color}20` }}>
                      {tool.icon}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{tool.name}</h4>
                      <p className="text-[10px] text-slate-500">{tool.useCase}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tool.description}</p>
                  {tool.url && (
                    <a href={tool.url} target="_blank" rel="noopener noreferrer" className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors inline-block">
                      打开 ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: 已完成 ─────────────────────────────────── */}
      {activeTab === 'completed' && (
        <div>
          {completedCount === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4 opacity-40">🏗️</div>
              <h3 className="font-bold text-white mb-2">还没有完成任何工作流</h3>
              <p className="text-xs text-slate-500 mb-6">完成线下课后，在这里标记你的学习成果</p>
              <button
                onClick={() => setActiveTab('overview')}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm px-6 py-2.5 rounded-xl hover:from-indigo-500 hover:to-violet-500 transition-all font-medium"
              >
                去看看工作流概览
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 进度概览 */}
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-4">
                <div className="text-3xl">🏆</div>
                <div className="flex-1">
                  <h3 className="font-bold text-emerald-400 text-sm">已累计完成 {completedCount} 个工作流！</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    继续加油，完成全部18个工作流后，你将拥有完整的外贸AI工作流系统！
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-emerald-400">{completionRate}%</div>
                  <div className="text-[10px] text-slate-500">完成度</div>
                </div>
              </div>

              {/* 完成的工作流 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {workflows.filter(w => w.isCompleted).map(w => (
                  <WorkflowCard
                    key={w.id}
                    workflow={w}
                    onDetail={setSelectedWorkflow}
                    onToggle={handleToggle}
                  />
                ))}
              </div>

              {/* 未完成的工作流 */}
              {workflows.filter(w => !w.isCompleted).length > 0 && (
                <>
                  <h3 className="text-sm font-semibold text-slate-400 pt-4 border-t border-slate-800">
                    未完成 ({workflows.filter(w => !w.isCompleted).length})
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {workflows.filter(w => !w.isCompleted).map(w => (
                      <WorkflowCard
                        key={w.id}
                        workflow={w}
                        onDetail={setSelectedWorkflow}
                        onToggle={handleToggle}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 工作流详情弹窗 */}
      {selectedWorkflow && (
        <WorkflowDetailDialog
          workflow={selectedWorkflow}
          onClose={() => setSelectedWorkflow(null)}
          onToggle={handleToggle}
        />
      )}
    </div>
  );
}
