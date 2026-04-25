/**
 * CrossBorderEcommercePanel — 跨境电商营销技能面板
 * 六大模块 43 个技能，覆盖 TikTok短视频 / SEO/GEO / 广告投放 / 竞品监控 / Listing优化 / 社媒矩阵
 */
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';

// ── 数据类型 ────────────────────────────────────────────────

type CrossBorderPanelTab = 'modules' | 'all-skills' | 'workflow' | 'installed';

interface CrossBorderModule {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  skillCount: number;
}

interface CrossBorderSkill {
  id: string;
  module?: string;
  name: string;
  description: string;
  longDescription?: string;
  source?: 'community';
  category?: 'cross-border';
  tags: string[];
  icon: string;
  installCount: number;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;
  isInstalled: boolean;
  officialHubUrl?: string;
  installCommand?: string;
  workflow?: string[];
  createdAt: string;
  updatedAt: string;
}

// ── 模块配置 ────────────────────────────────────────────────

const MODULE_COLORS: Record<string, string> = {
  'tiktok-video': 'from-pink-500 to-rose-600',
  'seo-geo': 'from-blue-500 to-indigo-600',
  'ads-roi': 'from-green-500 to-emerald-600',
  'competitor-intel': 'from-purple-500 to-violet-600',
  'listing-cro': 'from-orange-500 to-amber-600',
  'social-matrix': 'from-cyan-500 to-teal-600',
};

const MODULE_ACCENT: Record<string, string> = {
  'tiktok-video': 'border-pink-500/30 bg-pink-500/5',
  'seo-geo': 'border-blue-500/30 bg-blue-500/5',
  'ads-roi': 'border-green-500/30 bg-green-500/5',
  'competitor-intel': 'border-purple-500/30 bg-purple-500/5',
  'listing-cro': 'border-orange-500/30 bg-orange-500/5',
  'social-matrix': 'border-cyan-500/30 bg-cyan-500/5',
};

// ── 工作流演示数据 ──────────────────────────────────────────

const DEMO_WORKFLOW = {
  title: '竞品广告异常 → 热点捕捉 → 短视频制作 → 独立站转化',
  steps: [
    {
      id: 1,
      skill: 'Amazon PPC 自动优化器',
      icon: '🛒',
      desc: 'ACoS 跑偏 → 自动重算竞价',
      detail: '分钟级检测，ACoS 偏离基准线时数学模型立即响应',
    },
    {
      id: 2,
      skill: 'TikTok 趋势雷达',
      icon: '🛰️',
      desc: '捕捉正在爆发的话题',
      detail: '在话题增长斜率最高点前介入，抢占流量',
    },
    {
      id: 3,
      skill: 'AI 营销视频工厂',
      icon: '🎥',
      desc: '商品素材 → TikTok 短视频',
      detail: 'AI 脚本 + 多格式适配，一键分发 TikTok/Reels/Shorts',
    },
    {
      id: 4,
      skill: '结账漏斗优化大师',
      icon: '💳',
      desc: 'Shopify 结账页武装',
      detail: 'Trust Badges + 紧迫感倒计时 + 行为经济学优化',
    },
    {
      id: 5,
      skill: 'GA4 全套分析助手',
      icon: '📈',
      desc: '数据回传 → 闭环优化',
      detail: '跨平台归因，实时 ROI 追踪，广告预算再分配',
    },
  ],
};

// ── 全部技能数据（硬编码，与后端同步）──────────────────────

const ALL_CROSS_BORDER_SKILLS: CrossBorderSkill[] = [
  // tiktok-video
  { id: 'skill-tiktok-ai-model-generator', module: 'tiktok-video', name: 'TikTok AI 虚拟模特生成', description: '用 AI 生成 TikTok 直播虚拟模特穿搭视频，四步流程输出 1080x1920 MP4。', tags: ['TikTok', '虚拟模特', 'AI生图', '服装'], icon: '👗', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/tiktok-ai-model-generator', installCommand: 'clawhub install tiktok-ai-model-generator', workflow: ['GPTImage2', 'Claude', 'NanoBananaPro', 'Seedance2'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-larry-tiktok-marketing', module: 'tiktok-video', name: 'Larry · TikTok 幻灯片营销', description: '竞品调研、AI生图、Postiz发布、数据追踪一条龙，支持新号养号期。', tags: ['TikTok', 'Instagram', 'YouTube Shorts', 'Postiz'], icon: '📱', installCount: 0, rating: 4.7, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/larry', installCommand: 'clawhub install larry', workflow: ['竞品调研', 'AI生图', 'Postiz', 'A/B测试'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-genviral', module: 'tiktok-video', name: 'GenViral · 爆款制造机', description: '六页幻灯片结构最大化留存，文本字体高度 = 图像6.5%，防平台UI遮挡。', tags: ['TikTok', '爆款', '幻灯片', '无人出镜'], icon: '🔥', installCount: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/genviral', installCommand: 'clawhub install genviral', workflow: ['六页幻灯片', 'AI生图', '批量生成'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-ai-marketing-videos', module: 'tiktok-video', name: 'AI 营销视频工厂', description: '静态商品素材 + AI 脚本 → Reels/Shorts/TikTok 多平台适配短视频。', tags: ['TikTok', 'Instagram', 'YouTube Shorts', '视频生成'], icon: '🎥', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://skills.sh/trending', installCommand: 'clawhub install ai-marketing-videos', workflow: ['素材输入', '脚本生成', '多格式裁剪'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-tiktok-growth', module: 'tiktok-video', name: 'TikTok 账号增长助手', description: '结合产品卖点 + 平台热门趋势，自动输出多角度本地化视频脚本。', tags: ['TikTok', '增长', '本地化', '脚本'], icon: '📈', installCount: 356, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/tiktok-growth', installCommand: 'clawhub install tiktok-growth', workflow: ['趋势分析', '本地化', '脚本生成'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-tiktok-ads', module: 'tiktok-video', name: 'TikTok 广告数据分析', description: 'Hook优化、CTA测试、受众定向建议，输出可执行优化清单。', tags: ['TikTok Ads', '数据分析', 'Hook', 'CTA'], icon: '📊', installCount: 1300, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/tiktok-ads', installCommand: 'clawhub install tiktok-ads', workflow: ['数据分析', 'Hook优化', '受众定向'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-tiktok-trend-radar', module: 'tiktok-video', name: 'TikTok 趋势雷达', description: '实时监控热门话题，在爆发顶峰前捕捉增长斜率，提前发布窗口。', tags: ['TikTok', 'Instagram', '趋势监控', '热点捕捉'], icon: '🛰️', installCount: 325, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/tiktok-trend-radar', installCommand: 'clawhub install tiktok-trend-radar', workflow: ['话题监控', '增长预测', '发布窗口'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  // seo-geo
  { id: 'skill-seo-geo-claude', module: 'seo-geo', name: 'SEO + GEO 20合1技能套装', description: '关键词研究/SERP分析/GEO内容优化/Schema标记生成，20个可单独安装的技能包。', tags: ['SEO', 'GEO', '关键词', 'Schema', '内容优化'], icon: '🔍', installCount: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/keyword-research', installCommand: 'npx skills add aaron-he-zhu/seo-geo-claude-skills', workflow: ['关键词研究', 'SERP分析', '内容优化', 'Schema生成'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-geo-content-optimizer', module: 'seo-geo', name: 'GEO 内容优化器', description: '让 ChatGPT/Gemini/Perplexity 引用你的内容，AI搜索引擎首选答案。', tags: ['GEO', 'AI搜索', 'Perplexity', 'ChatGPT引用'], icon: '🤖', installCount: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install geo-content-optimizer', workflow: ['结构优化', '实体信号', 'Schema检查', '引用评分'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-seo-audit', module: 'seo-geo', name: 'SEO 审计仪', description: '输入 URL，自动跑 Meta标签/标题结构/内链外链/移动端适配，每维0-100评分。', tags: ['SEO', '审计', '诊断', 'Core Web Vitals'], icon: '🩺', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/seo-audit', installCommand: 'clawhub install seo-audit', workflow: ['URL输入', '多维度诊断', '评分报告', '修复清单'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-serp-analysis', module: 'seo-geo', name: 'SERP 分析仪', description: '拆解精选摘要/PAA问答/AI Overview，检测被AI引用条件。', tags: ['SERP', 'Google', 'AI Overview', '精选摘要'], icon: '🔬', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/serp-analysis', installCommand: 'clawhub install serp-analysis', workflow: ['关键词输入', 'SERP抓取', 'AI引用分析'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-programmatic-seo', module: 'seo-geo', name: '程序化 SEO 引擎', description: '对接商品数据库，自动组合产品属性+地域词，批量生成数以万计精准着陆页。', tags: ['SEO', '程序化', '长尾词', '批量生成'], icon: '⚙️', installCount: 0, rating: 4.7, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://skills.sh/hot', installCommand: 'clawhub install programmatic-seo', workflow: ['数据库接入', '属性提取', '地域词库', '批量生成'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-content-creator', module: 'seo-geo', name: '品牌内容创作者', description: '品牌声音分析 + SEO优化，先学调性再输出品牌一致且搜索友好的内容。', tags: ['内容创作', '品牌调性', 'SEO', '可读性'], icon: '✍️', installCount: 0, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/content-creator', installCommand: 'clawhub install content-creator', workflow: ['品牌分析', '调性设定', '关键词注入'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-seo-competitor-analysis', module: 'seo-geo', name: 'SEO 竞品分析器', description: '深度扫描关键词布局、外链情况、内容策略，识别反超机会。', tags: ['SEO', '竞品分析', '外链', '关键词'], icon: '🕵️', installCount: 5500, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/seo-competitor-analysis', installCommand: 'clawhub install seo-competitor-analysis', workflow: ['竞品URL输入', '多维度扫描', 'gap分析'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  // ads-roi
  { id: 'skill-adspirer-ads-agent', module: 'ads-roi', name: 'AdsPirer 广告智能体', description: 'Google/Meta/LinkedIn/TikTok Ads 一个界面管四大平台，自然语言创建广告系列。', tags: ['Google Ads', 'Meta Ads', 'TikTok Ads', 'ROAS'], icon: '📺', installCount: 0, rating: 4.9, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/adspirer-ads-agent', installCommand: 'openclaw plugins install openclaw-adspirer', workflow: ['多平台接入', '自然语言创建', '实时监控'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-claude-ads', module: 'ads-roi', name: 'Claude 广告全审计', description: '186项加权评分检查，穿透 Meta/Google/YouTube/TikTok，识别广告疲劳和受众重叠。', tags: ['Meta', 'Google', 'YouTube', 'TikTok', '751 Stars'], icon: '🔎', installCount: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://github.com/AgriciDaniel/claude-ads', installCommand: 'clawhub install claude-ads', workflow: ['多平台数据拉取', '186项审计', '疲劳分析'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-amazon-ads-optimizer', module: 'ads-roi', name: '亚马逊 PPC 自动优化器', description: 'Amazon Ads API v3 分钟级检测，ACoS偏离立即数学竞价重算，跨时区抢广告位。', tags: ['Amazon PPC', 'ACoS', 'SP广告', '竞价优化'], icon: '🛒', installCount: 0, rating: 4.7, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://github.com/Zero2Ai-hub/skill-amazon-ads-optimizer', installCommand: 'clawhub install skill-amazon-ads-optimizer', workflow: ['API接入', '分钟级监控', 'ACoS检测', '智能竞价'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-meta-ads-report', module: 'ads-roi', name: 'Meta 广告报表助手', description: '聊天里直接查 ROAS/CPA/CTR，不用登后台，自然语言一句话查数据。', tags: ['Meta Ads', 'Facebook Ads', 'ROAS', '报表'], icon: '📱', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install Meta-ads-report', workflow: ['自然语言查询', '实时数据拉取'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-windsor-ai', module: 'ads-roi', name: 'Windsor AI 数据中枢', description: '325+数据源一键接入，问一句话拿到跨平台汇总数据，打破数据孤岛。', tags: ['数据整合', 'GA4', 'Facebook Ads', '跨平台归因'], icon: '🔗', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install windsor-ai', workflow: ['数据源接入', '跨平台汇总', '自然语言查询'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-ga4-analytics', module: 'ads-roi', name: 'GA4 全套分析助手', description: '实时访客/流量来源/转化漏斗/关键词排名，Markdown 报告自动生成。', tags: ['GA4', 'Google Analytics', 'Search Console', '流量分析'], icon: '📈', installCount: 4600, rating: 4.7, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/ga4-analytics', installCommand: 'clawhub install ga4-analytics', workflow: ['GA4接入', '实时数据', 'Markdown报告'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-perplexity-research', module: 'ads-roi', name: 'Perplexity 深度研究', description: '多模型对比验证（GPT/Claude/Gemini），出高质量行业分析报告。', tags: ['Perplexity', '深度研究', '行业分析', '竞品调研'], icon: '🔭', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/perplexity-research', installCommand: 'clawhub install perplexity-research', workflow: ['主题输入', '深度检索', '多模型验证', '报告输出'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  // competitor-intel
  { id: 'skill-competitor-monitoring', module: 'competitor-intel', name: '竞品动态监控', description: '持续跟踪竞品价格/评分/新品/促销，一有变动 Webhook/Telegram 自动推送。', tags: ['竞品监控', '价格追踪', '评分监控', '推送通知'], icon: '👁️', installCount: 258, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/competitor-monitoring', installCommand: 'clawhub install competitor-monitoring', workflow: ['竞品列表录入', '持续监控', '变动检测', '推送通知'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-price-tracker', module: 'competitor-intel', name: '多平台价格追踪器', description: 'Amazon/eBay/Walmart 多平台同时监控，发现套利机会，计算含运费/汇率的利润空间。', tags: ['Amazon', 'eBay', 'Walmart', '价格追踪', '套利'], icon: '💰', installCount: 2500, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/price-tracker', installCommand: 'clawhub install price-tracker', workflow: ['多平台接入', '价格监控', '利润计算'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-reddit-insights', module: 'competitor-intel', name: 'Reddit 真实用户洞察', description: 'AI 语义搜索数百万 Reddit 帖子，发现真实痛点和未被满足的需求，选品金矿。', tags: ['Reddit', '用户洞察', '选品', '痛点分析'], icon: '💬', installCount: 5000, rating: 4.8, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/reddit-insights', installCommand: 'clawhub install reddit-insights', workflow: ['语义搜索', '痛点提取', '需求缺口', '选品评分'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-google-trends', module: 'competitor-intel', name: 'Google Trends 全球趋势', description: '多关键词对比/全球热度分布/品类季节性识别/突发趋势预警。', tags: ['Google Trends', '趋势监控', '搜索热度', '季节性'], icon: '🌐', installCount: 1200, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/google-trends', installCommand: 'clawhub install google-trends', workflow: ['关键词输入', '趋势分析', '季节性识别'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-shopify-analytics', module: 'competitor-intel', name: 'Shopify 店铺分析', description: '流量来源/转化漏斗/热销排行/客户RFM分析/弃购率分析。', tags: ['Shopify', '店铺分析', '转化漏斗', 'RFM'], icon: '🛍️', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/shopify-analytics', installCommand: 'clawhub install shopify-analytics', workflow: ['店铺接入', '流量分析', '转化漏斗', '客户画像'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-amazon-product-research', module: 'competitor-intel', name: '亚马逊选品研究', description: '类目容量/竞争强度/利润空间/季节性/专利风险，可量化选品建议。', tags: ['Amazon', '选品', 'BSR', 'FBA', '专利风险'], icon: '🔍', installCount: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/amazon-product-research', installCommand: 'clawhub install amazon-product-research', workflow: ['类目输入', '市场分析', '专利检测', '备货建议'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-supply-chain-monitor', module: 'competitor-intel', name: '供应链动态监控', description: '汇率/运费/海运价格/原材料成本/关税政策监控，成本决策数据支撑。', tags: ['供应链', '汇率', '运费', '海运', '成本监控'], icon: '🚢', installCount: 0, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/supply-chain-monitor', installCommand: 'clawhub install supply-chain-monitor', workflow: ['多数据源接入', '成本计算', '利润预警'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  // listing-cro
  { id: 'skill-amazon-listing-optimizer', module: 'listing-cro', name: '亚马逊 Listing 优化器', description: '拉取ASIN指标，爬取BS页面，交叉关键词搜索量，长尾词前置，SP-API推送更新全程<5秒。', tags: ['Amazon', 'Listing', '标题优化', 'SP-API'], icon: '🛍️', installCount: 0, rating: 4.8, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://github.com/Zero2Ai-hub/skill-amazon-listing-optimizer', installCommand: 'clawhub install skill-amazon-listing-optimizer', workflow: ['ASIN分析', 'BS爬取', '关键词对比', 'SP-API推送'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-humanizer', module: 'listing-cro', name: '反AI味语义重构器', description: '注入当地俚语，打破机械句法，制造人类口语长短句停顿，瓦解买家心理防御。', tags: ['文案优化', '反AI', '本地化', '俚语'], icon: '🎭', installCount: 3659, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/sundial-org/awesome-openclaw-skills', installCommand: 'clawhub install humanizer', workflow: ['原文输入', 'AI味检测', '语义重构', '本地化注入'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-frontend-design-extractor', module: 'listing-cro', name: '独立站视觉间谍', description: '解析高转化竞品网站的 CTA/价格展示/信任背书/CSS变量，Shopify主题直接参考。', tags: ['Shopify', '独立站', '视觉优化', 'CTA', 'A/B测试'], icon: '🎨', installCount: 102, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/sundial-org/awesome-openclaw-skills', installCommand: 'clawhub install frontend-design-extractor', workflow: ['竞品URL', '视觉解析', '参数提取', 'Shopify优化'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-paywall-upgrade-cro', module: 'listing-cro', name: '结账漏斗优化大师', description: '行为经济学硬编码，Trust Badges/紧迫感倒计时/定价层级重组，Shopify代码补丁一键注入。', tags: ['CRO', 'Shopify', '结账优化', '行为经济学', 'Trust Badges'], icon: '💳', installCount: 0, rating: 4.7, reviewCount: 0, isFeatured: true, isInstalled: false, officialHubUrl: 'https://skills.sh/hot', installCommand: 'clawhub install paywall-upgrade-cro', workflow: ['漏斗分析', '定价优化', '信任元素', '代码注入'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-product-marketing-context', module: 'listing-cro', name: '产品营销定位指南针', description: '功能→情感利益转化，品牌调性参数设定，全部文案一致性检查，解决AI跑偏问题。', tags: ['品牌定位', '情感营销', '产品定位', '品牌调性'], icon: '🧭', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install product-marketing-context', workflow: ['功能提取', '情感转化', '品牌调性', '一致性检查'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-amazon-reviews-analyzer', module: 'listing-cro', name: '亚马逊评论分析器', description: '高频关键词/情感分析/产品缺陷检测/竞品对比/Q&A热点，给Listing优化提供数据依据。', tags: ['Amazon', '评论分析', '情感分析', '选品优化'], icon: '⭐', installCount: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/amazon-reviews-analyzer', installCommand: 'clawhub install amazon-reviews-analyzer', workflow: ['评论抓取', '关键词提取', '情感分析', '缺陷检测'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-product-photo-enhancer', module: 'listing-cro', name: '产品图 AI 增强器', description: 'AI背景移除/白底图生成/infographic叠加/场景图合成，自动适配Amazon/Shopify尺寸。', tags: ['产品图', 'AI增强', '背景移除', 'infographic', 'Amazon主图'], icon: '📸', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/product-photo-enhancer', installCommand: 'clawhub install product-photo-enhancer', workflow: ['图片输入', '背景移除', '白底生成', 'infographic'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  // social-matrix
  { id: 'skill-instagram-poster', module: 'social-matrix', name: 'Instagram 自动发布', description: '通过 Telegram 桥接绕过官方API限制，把图片/Reels无损推送到Instagram主页，降低封号风险。', tags: ['Instagram', 'Reels', '自动发布', 'Telegram', 'AI评论回复'], icon: '📸', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install instagram-poster', workflow: ['素材准备', 'Telegram桥接', 'API发布', 'AI回复'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-blog-writer', module: 'social-matrix', name: '品牌博客深度写手', description: '深度伪装人类语气的长图文，模仿特定作者风格，SEO关键词自然植入，多语言本地化。', tags: ['博客', '内容营销', 'SEO', '品牌故事', '多语言'], icon: '📝', installCount: 154, rating: 4.3, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/sundial-org/awesome-openclaw-skills', installCommand: 'clawhub install blog-writer', workflow: ['风格学习', '结构设计', 'SEO植入', '多语言适配'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-marketing-ideas', module: 'social-matrix', name: '营销策略灵感库', description: '140个经过验证的营销策略库，按阶段/预算/时间线分类推荐，最适合策略组合建议。', tags: ['营销策略', '140策略', '预算规划', '时间线', '增长黑客'], icon: '💡', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://playbooks.com/skills/openclaw/skills/marketing-ideas', installCommand: 'clawhub install marketing-ideas', workflow: ['产品阶段输入', '策略推荐', '预算规划', '时间线输出'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-listing-swarm', module: 'social-matrix', name: '目录站批量提交机器人', description: '自动提交产品到70+高质量目录站，增加外链和品牌曝光，DA/PA过滤只提交高权重目录。', tags: ['外链', '目录站', '批量提交', 'SEO', '70+站点'], icon: '🌐', installCount: 0, rating: 4.2, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/VoltAgent/awesome-openclaw-skills', installCommand: 'clawhub install listing-swarm', workflow: ['目录库接入', '信息填充', '批量提交', '状态追踪'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-b2c-marketing-sop', module: 'social-matrix', name: 'B2C 短视频营销 SOP', description: 'TikTok/Instagram/YouTube Shorts B2C内容营销完整SOP框架，平台选择/内容矩阵/ROI追踪。', tags: ['B2C', 'TikTok', 'Instagram', 'YouTube Shorts', 'SOP'], icon: '🎯', installCount: 0, rating: 4.6, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://github.com/openclaw/skills', installCommand: 'clawhub install b2c-marketing-1-0-1', workflow: ['平台选择', '内容矩阵', '发布规划', 'ROI追踪'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-email-marketing-automation', module: 'social-matrix', name: '邮件营销自动化', description: '欢迎序列/弃购召回/复购激励/节日关怀自动触发，Klaviyo/Mailchimp集成，全链路追踪。', tags: ['邮件营销', 'Klaviyo', 'Mailchimp', '自动化', '弃购召回'], icon: '📧', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/email-marketing-automation', installCommand: 'clawhub install email-marketing-automation', workflow: ['平台接入', '序列设计', '触发规则', 'A/B测试'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-affiliate-program-setup', module: 'social-matrix', name: '联盟营销计划搭建', description: '佣金结构设计/追踪系统配置/联盟客招募/佣金结算自动化，Impact/Refersion集成。', tags: ['联盟营销', 'Affiliate', '亚马逊', '独立站', '佣金'], icon: '🤝', installCount: 0, rating: 4.4, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/affiliate-program-setup', installCommand: 'clawhub install affiliate-program-setup', workflow: ['佣金设计', '追踪配置', '联盟客招募', '结算自动化'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
  { id: 'skill-influencer-outreach', module: 'social-matrix', name: '网红达人合作外联', description: 'AI筛选网红/外联邮件个性化生成/合作报价计算/效果追踪/ROI计算。', tags: ['网红', 'KOL', 'TikTok', 'Instagram', 'GMV分成'], icon: '🎤', installCount: 0, rating: 4.5, reviewCount: 0, isFeatured: false, isInstalled: false, officialHubUrl: 'https://clawhub.ai/skills/influencer-outreach', installCommand: 'clawhub install influencer-outreach', workflow: ['网红筛选', '外联生成', '合作谈判', '效果追踪'], createdAt: '2026-04-20T00:00:00Z', updatedAt: '2026-04-25T00:00:00Z' },
];

// ── 模块配置数据 ─────────────────────────────────────────────

const MODULES: CrossBorderModule[] = [
  { id: 'tiktok-video', name: 'TikTok & 短视频工厂', icon: '🎬', description: '一天量产 50 条视频', color: '#FF1552', skillCount: 7 },
  { id: 'seo-geo', name: 'SEO / GEO 搜索优化', icon: '🔍', description: '抢占 Google 和 AI 搜索入口', color: '#4285F4', skillCount: 7 },
  { id: 'ads-roi', name: '广告投放与 ROI 优化', icon: '📈', description: '每一分广告费花在刀刃上', color: '#00C853', skillCount: 7 },
  { id: 'competitor-intel', name: '竞品监控与市场洞察', icon: '🕵️', description: '7×24小时盯着对手', color: '#9C27B0', skillCount: 7 },
  { id: 'listing-cro', name: 'Listing 与转化率提升', icon: '🛒', description: '把流量变成真金白银', color: '#FF9800', skillCount: 7 },
  { id: 'social-matrix', name: '社媒矩阵自动驾驶', icon: '🌐', description: '一个人运营五个平台', color: '#00BCD4', skillCount: 8 },
];

// ── 子组件：技能卡片 ─────────────────────────────────────────

function SkillCard({ skill, onToggle, onCopyCommand }: {
  skill: CrossBorderSkill;
  onToggle: (id: string) => void;
  onCopyCommand: (cmd: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const mod = skill.module || '';

  const handleToggle = async () => {
    setLoading(true);
    await onToggle(skill.id);
    setLoading(false);
  };

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg ${MODULE_ACCENT[mod] || 'border-slate-700/50'}`}>
      {/* 头部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{skill.icon}</span>
          <div>
            <h4 className="font-semibold text-sm text-white leading-tight">{skill.name}</h4>
            {skill.isFeatured && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">推荐</span>
            )}
          </div>
        </div>
        <span className="text-[10px] text-slate-500 shrink-0">⭐ {skill.rating.toFixed(1)}</span>
      </div>

      {/* 描述 */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{skill.description}</p>

      {/* 工作流 */}
      {skill.workflow && skill.workflow.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {skill.workflow.map((w, i) => (
            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/70 text-slate-400">
              {i > 0 && <span className="text-slate-600 mr-1">→</span>}{w}
            </span>
          ))}
        </div>
      )}

      {/* 安装命令 */}
      {skill.installCommand && (
        <div className="bg-slate-900/80 rounded-lg p-2 font-mono text-[10px] text-slate-400 break-all">
          <span className="text-slate-600">$ </span>{skill.installCommand}
        </div>
      )}

      {/* 操作 */}
      <div className="flex items-center gap-2 mt-auto">
        <button
          onClick={handleToggle}
          disabled={loading}
          className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-all ${
            skill.isInstalled
              ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
              : 'bg-indigo-600 text-white hover:bg-indigo-500'
          } disabled:opacity-50`}
        >
          {loading ? '...' : skill.isInstalled ? '✓ 已安装' : '安装'}
        </button>
        {skill.installCommand && (
          <button
            onClick={() => onCopyCommand(skill.installCommand!)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-300 transition-colors"
          >
            复制命令
          </button>
        )}
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────

export function CrossBorderEcommercePanel() {
  const [activeTab, setActiveTab] = useState<CrossBorderPanelTab>('modules');
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [skills, setSkills] = useState<CrossBorderSkill[]>(ALL_CROSS_BORDER_SKILLS);
  const [search, setSearch] = useState('');

  // 本地安装状态管理
  const installedIds = new Set(skills.filter(s => s.isInstalled).map(s => s.id));

  const handleToggle = useCallback((skillId: string) => {
    setSkills(prev => prev.map(s =>
      s.id === skillId ? { ...s, isInstalled: !s.isInstalled } : s
    ));
    const skill = skills.find(s => s.id === skillId);
    toast.success(skill?.isInstalled ? `"${skill?.name}" 已卸载` : `"${skill?.name}" 安装成功！`);
  }, [skills]);

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd).then(() => toast.success('命令已复制到剪贴板'));
  };

  // 过滤技能
  const filteredSkills = search.trim()
    ? skills.filter(s =>
        s.name.includes(search) || s.description.includes(search) ||
        s.tags.some(t => t.includes(search))
      )
    : skills;

  const moduleSkills = activeModule
    ? filteredSkills.filter(s => s.module === activeModule)
    : filteredSkills;

  const installedSkills = skills.filter(s => s.isInstalled);

  return (
    <div className="space-y-4">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🌏</span> 跨境电商营销技能库
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            43 个成熟技能 · 6 大模块 · ClawHub 精选 · 装完即用
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400">
            {installedSkills.length} 已安装
          </span>
          <span className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-400">
            {skills.length} 技能
          </span>
        </div>
      </div>

      {/* 搜索 */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="搜索技能名称、描述或标签..."
        className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/70"
      />

      {/* Tab 导航 */}
      <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl">
        {([
          { id: 'modules', label: '🎯 六大模块', count: 6 },
          { id: 'all-skills', label: '📦 全部技能', count: skills.length },
          { id: 'workflow', label: '🔗 工作流', count: 0 },
          { id: 'installed', label: '✓ 已安装', count: installedSkills.length },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setActiveModule(null); }}
            className={`flex-1 text-xs py-2 px-3 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="opacity-60">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* ── Tab: 六大模块 ─────────────────────────────────── */}
      {activeTab === 'modules' && !activeModule && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MODULES.map(mod => {
            const modSkills = skills.filter(s => s.module === mod.id);
            const modInstalled = modSkills.filter(s => s.isInstalled).length;
            const grad = MODULE_COLORS[mod.id] || 'from-slate-500 to-slate-600';
            return (
              <button
                key={mod.id}
                onClick={() => { setActiveModule(mod.id); setActiveTab('modules'); }}
                className={`text-left rounded-xl border border-slate-700/50 p-4 hover:border-slate-600 transition-all hover:shadow-lg bg-gradient-to-br ${MODULE_ACCENT[mod.id] || ''} hover:scale-[1.02] active:scale-[0.99]`}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-lg`}>
                    {mod.icon}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500">{modInstalled}/{mod.skillCount}</span>
                  </div>
                </div>
                <h3 className="font-bold text-sm text-white mt-3">{mod.name}</h3>
                <p className="text-xs text-slate-400 mt-1">{mod.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1 bg-slate-700/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${grad} rounded-full transition-all`}
                      style={{ width: `${(modInstalled / mod.skillCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">{mod.skillCount} 个技能</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Tab: 模块内技能 ───────────────────────────────── */}
      {activeTab === 'modules' && activeModule && (
        <div>
          <button
            onClick={() => setActiveModule(null)}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mb-3 transition-colors"
          >
            ← 返回六大模块
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{MODULES.find(m => m.id === activeModule)?.icon}</span>
            <h3 className="font-bold text-white">{MODULES.find(m => m.id === activeModule)?.name}</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {moduleSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={handleToggle}
                onCopyCommand={handleCopyCommand}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: 全部技能 ─────────────────────────────────── */}
      {activeTab === 'all-skills' && !activeModule && (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {moduleSkills.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onToggle={handleToggle}
                onCopyCommand={handleCopyCommand}
              />
            ))}
          </div>
          {moduleSkills.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-sm">没有找到匹配的技能</div>
          )}
        </div>
      )}

      {/* ── Tab: 工作流 ───────────────────────────────────── */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 rounded-xl p-4">
            <h3 className="font-bold text-white text-sm mb-1">{DEMO_WORKFLOW.title}</h3>
            <p className="text-xs text-slate-400">完整的跨平台营销自动化闭环</p>
          </div>

          <div className="relative">
            {/* 连接线 */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500 via-violet-500 to-cyan-500 opacity-30" />

            <div className="space-y-3">
              {DEMO_WORKFLOW.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-4 relative">
                  {/* 节点 */}
                  <div className="relative z-10 w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 shrink-0">
                    {step.icon}
                  </div>
                  {/* 内容 */}
                  <div className={`flex-1 rounded-xl border p-4 ${idx === 0 ? 'border-pink-500/30 bg-pink-500/5' : idx === 1 ? 'border-blue-500/30 bg-blue-500/5' : idx === 2 ? 'border-green-500/30 bg-green-500/5' : idx === 3 ? 'border-orange-500/30 bg-orange-500/5' : 'border-cyan-500/30 bg-cyan-500/5'}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-white">{step.skill}</h4>
                        <p className="text-xs text-indigo-400 mt-0.5">{step.desc}</p>
                      </div>
                      <span className="text-[10px] text-slate-600 bg-slate-800 px-2 py-1 rounded-full">{idx + 1}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 技巧提示 */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-amber-400 text-sm">💡 Skill 联动最佳实践</h4>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>• <span className="text-amber-300">reddit-insights</span> 发现选品痛点 → <span className="text-amber-300">seo-gee-claude</span> 布局 GEO 关键词</p>
              <p>• <span className="text-amber-300">tiktok-trend-radar</span> 捕捉热点 → <span className="text-amber-300">ai-marketing-videos</span> 批量出视频</p>
              <p>• <span className="text-amber-300">claude-ads</span> 发现疲劳 → <span className="text-amber-300">humanizer</span> 重构文案 → GA4 追踪效果</p>
              <p>• <span className="text-amber-300">amazon-reviews-analyzer</span> 挖掘缺陷 → <span className="text-amber-300">listing-optimizer</span> 定向优化</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: 已安装 ───────────────────────────────────── */}
      {activeTab === 'installed' && (
        <div>
          {installedSkills.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-4">📦</div>
              <h3 className="font-bold text-white mb-2">还没有安装任何技能</h3>
              <p className="text-xs text-slate-500 mb-6">选择一个模块，开始安装你的第一个跨境电商技能</p>
              <button
                onClick={() => setActiveTab('modules')}
                className="bg-indigo-600 text-white text-sm px-6 py-2.5 rounded-xl hover:bg-indigo-500 transition-colors font-medium"
              >
                浏览六大模块
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-slate-500 mb-3">已安装 {installedSkills.length} 个技能</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {installedSkills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onToggle={handleToggle}
                    onCopyCommand={handleCopyCommand}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
