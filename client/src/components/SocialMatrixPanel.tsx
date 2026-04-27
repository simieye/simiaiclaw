/**
 * 跨境龙虾社 · 全球社媒矩阵营销系统
 * 6 大核心模块：全球社媒矩阵 / Webhook配置 / 官方网站入口 / 本地化住宅IP / 服务商管理 / 全球电商中枢
 */
import { useState } from 'react';

// ── 类型定义 ────────────────────────────────────────────────────────────────

type Tab = 'matrix' | 'webhooks' | 'sites' | 'ips' | 'providers' | 'ecommerce';

interface Platform {
  id: string; name: string; nameCn: string; icon: string; color: string;
  loginUrl: string; docsUrl: string; apiBase: string;
  authType: 'oauth2' | 'apikey' | 'bearer' | 'none';
  status: 'connected' | 'disconnected' | 'expired';
  apiKey?: string; description: string; descriptionCn: string;
  region: string;
}

interface Webhook {
  id: string; platform: string; platformName: string; event: string;
  url: string; secret: string; status: 'active' | 'paused' | 'error';
  createdAt: string; lastTriggered?: string; triggerCount: number;
}

interface OfficialSite {
  id: string; name: string; nameCn: string; url: string;
  category: '虾群系统' | '社媒平台' | '电商平台' | '开发工具';
  description: string; descriptionCn: string;
}

interface ResidentialIP {
  id: string; provider: string; providerCn: string;
  country: string; countryFlag: string; city: string; ip: string;
  protocol: 'HTTP' | 'HTTPS' | 'SOCKS5';
  status: 'active' | 'expiring' | 'expired';
  expiresAt: string; usedBy: string; usedByCn: string;
}

interface ServiceProvider {
  id: string; name: string; nameCn: string;
  category: '代理IP' | '住宅IP' | '社媒账号' | '云服务' | 'RPA工具' | '支付网关' | '数据服务';
  website: string; icon: string; color: string;
  description: string; descriptionCn: string;
  status: 'verified' | 'pending' | 'contacted';
  contact?: string; rating: number; reviewCount: number;
}

// ── 数据 ───────────────────────────────────────────────────────────────────

const SOCIAL_PLATFORMS: Platform[] = [
  { id: 'twitter', name: 'Twitter / X', nameCn: 'Twitter / X', icon: '𝕏', color: '#1da1f2', loginUrl: 'https://x.com/login', docsUrl: 'https://developer.twitter.com/en/docs', apiBase: 'https://api.twitter.com/2', authType: 'bearer', status: 'disconnected', description: 'Social media posting, analytics & engagement API', descriptionCn: '社交媒体发布、数据分析与互动 API', region: '全球' },
  { id: 'instagram', name: 'Instagram', nameCn: 'Instagram', icon: '📷', color: '#e1306c', loginUrl: 'https://www.instagram.com/accounts/login/', docsUrl: 'https://developers.facebook.com/docs/instagram-api', apiBase: 'https://graph.instagram.com', authType: 'bearer', status: 'disconnected', description: 'Business account content & insights API', descriptionCn: '企业号内容管理与数据洞察 API', region: '全球' },
  { id: 'facebook', name: 'Facebook', nameCn: 'Facebook', icon: '👤', color: '#1877f2', loginUrl: 'https://www.facebook.com/login', docsUrl: 'https://developers.facebook.com/docs/graph-api', apiBase: 'https://graph.facebook.com/v19.0', authType: 'bearer', status: 'disconnected', description: 'Pages, Groups, Marketing & Messenger API', descriptionCn: '主页、群组、营销与消息 API', region: '全球' },
  { id: 'tiktok', name: 'TikTok', nameCn: 'TikTok', icon: '🎵', color: '#000000', loginUrl: 'https://www.tiktok.com/login', docsUrl: 'https://developers.tiktok.com/doc/tiktok-api-v3-overview', apiBase: 'https://open.tiktokapis.com/v2', authType: 'bearer', status: 'connected', description: 'Creator content, analytics & commerce API', descriptionCn: '创作者内容、数据分析与电商 API', region: '全球' },
  { id: 'linkedin', name: 'LinkedIn', nameCn: 'LinkedIn', icon: '💼', color: '#0a66c2', loginUrl: 'https://www.linkedin.com/login', docsUrl: 'https://learn.microsoft.com/en-us/linkedin/', apiBase: 'https://api.linkedin.com/v2', authType: 'bearer', status: 'disconnected', description: 'Professional network & B2B outreach API', descriptionCn: '职业社交与 B2B 开发信 API', region: '全球' },
  { id: 'youtube', name: 'YouTube', nameCn: 'YouTube', icon: '▶️', color: '#ff0000', loginUrl: 'https://accounts.google.com/login', docsUrl: 'https://developers.google.com/youtube/v3', apiBase: 'https://www.googleapis.com/youtube/v3', authType: 'apikey', status: 'disconnected', description: 'Channel analytics, video upload & live streaming API', descriptionCn: '频道数据、视频上传与直播 API', region: '全球' },
  { id: 'pinterest', name: 'Pinterest', nameCn: 'Pinterest', icon: '📌', color: '#e60023', loginUrl: 'https://www.pinterest.com/login', docsUrl: 'https://developers.pinterest.com/docs/getting-started/', apiBase: 'https://api.pinterest.com/v5', authType: 'bearer', status: 'disconnected', description: 'Pins, boards & visual discovery API', descriptionCn: '图钉、画板与视觉发现 API', region: '全球' },
  { id: 'reddit', name: 'Reddit', nameCn: 'Reddit', icon: '🤖', color: '#ff4500', loginUrl: 'https://www.reddit.com/login', docsUrl: 'https://www.reddit.com/dev/api', apiBase: 'https://oauth.reddit.com', authType: 'oauth2', status: 'disconnected', description: 'Subreddit engagement & moderator tools API', descriptionCn: '子版块互动与管理员工具 API', region: '全球' },
  { id: 'telegram', name: 'Telegram', nameCn: 'Telegram', icon: '✈️', color: '#26a5e4', loginUrl: 'https://web.telegram.org/', docsUrl: 'https://core.telegram.org/bots/api', apiBase: 'https://api.telegram.org', authType: 'apikey', status: 'disconnected', description: 'Bot API for messaging, channels & groups', descriptionCn: '机器人 API，支持消息、频道与群组', region: '全球' },
  { id: 'discord', name: 'Discord', nameCn: 'Discord', icon: '🎮', color: '#5865f2', loginUrl: 'https://discord.com/login', docsUrl: 'https://discord.com/developers/docs', apiBase: 'https://discord.com/api/v10', authType: 'bearer', status: 'disconnected', description: 'Bot API, webhooks & server management', descriptionCn: '机器人 API、Webhook 与服务器管理', region: '全球' },
  { id: 'whatsapp', name: 'WhatsApp Business', nameCn: 'WhatsApp Business', icon: '💬', color: '#25d366', loginUrl: 'https://business.facebook.com/login', docsUrl: 'https://developers.facebook.com/docs/whatsapp', apiBase: 'https://graph.facebook.com/v19.0', authType: 'bearer', status: 'disconnected', description: 'Business messaging & catalog API', descriptionCn: '商务消息与产品目录 API', region: '全球' },
  { id: 'snapchat', name: 'Snapchat', nameCn: 'Snapchat', icon: '👻', color: '#fffc00', loginUrl: 'https://ads.snapchat.com/login', docsUrl: 'https://developers.snap.com/docs', apiBase: 'https://adsapi.snapchat.com/v1', authType: 'bearer', status: 'disconnected', description: 'Ads API, creative API & Snapchat pixel', descriptionCn: '广告 API、创意 API 与追踪像素', region: '全球' },
  { id: 'xiaohongshu', name: 'Xiaohongshu', nameCn: '小红书', icon: '📕', color: '#ff2d55', loginUrl: 'https://creator.xiaohongshu.com/creator/login', docsUrl: 'https://creator.xiaohongshu.com', apiBase: 'https://creator.xiaohongshu.com', authType: 'oauth2', status: 'disconnected', description: 'Creator tools, notes & affiliate commerce', descriptionCn: '创作者工具、笔记与带货电商 API', region: '中国' },
  { id: 'threads', name: 'Threads (Meta)', nameCn: 'Threads', icon: '🧵', color: '#000000', loginUrl: 'https://threads.net/login', docsUrl: 'https://developers.facebook.com/docs/threads', apiBase: 'https://graph.threads.net/v1', authType: 'bearer', status: 'disconnected', description: 'Threads posts, replies & cross-posting API', descriptionCn: 'Threads 发帖、回复与跨平台分发 API', region: '全球' },
];

const WEBHOOKS: Webhook[] = [
  { id: 'wh-tiktok-order', platform: 'tiktok', platformName: 'TikTok', event: 'order.created', url: 'https://your-domain.com/webhooks/tiktok/order', secret: 'sk_live_tiktok_****7f3a', status: 'active', createdAt: '2026-04-10', lastTriggered: '2026-04-27 14:32', triggerCount: 2847 },
  { id: 'wh-amz-review', platform: 'amazon', platformName: 'Amazon', event: 'review.received', url: 'https://your-domain.com/webhooks/amazon/review', secret: 'ak_live_amazon_****9c2b', status: 'active', createdAt: '2026-04-12', lastTriggered: '2026-04-27 09:15', triggerCount: 1243 },
  { id: 'wh-dc-msg', platform: 'discord', platformName: 'Discord', event: 'message.created', url: 'https://your-domain.com/webhooks/discord/message', secret: 'ds_webhook_****f8e1', status: 'active', createdAt: '2026-04-15', lastTriggered: '2026-04-27 22:05', triggerCount: 8901 },
  { id: 'wh-tw-engage', platform: 'twitter', platformName: 'Twitter/X', event: 'tweet.engagement', url: 'https://your-domain.com/webhooks/twitter/engage', secret: 'tw_engage_****3a7d', status: 'paused', createdAt: '2026-04-18', lastTriggered: '2026-04-25 18:44', triggerCount: 412 },
  { id: 'wh-ln-msg', platform: 'linkedin', platformName: 'LinkedIn', event: 'message.received', url: 'https://your-domain.com/webhooks/linkedin/message', secret: 'li_msg_****2b9c', status: 'error', createdAt: '2026-04-20', lastTriggered: '2026-04-26 11:00', triggerCount: 67 },
  { id: 'wh-xhs-post', platform: 'xiaohongshu', platformName: '小红书', event: 'note.published', url: 'https://your-domain.com/webhooks/xiaohongshu/post', secret: 'xhs_note_****5d1e', status: 'active', createdAt: '2026-04-22', lastTriggered: '2026-04-27 20:10', triggerCount: 356 },
];

const OFFICIAL_SITES: OfficialSite[] = [
  { id: 'simiaiclaw', name: 'SIMIAICLAW', nameCn: 'SIMIAICLAW 龙虾集群', url: 'https://simiaiclaw.com', category: '虾群系统', description: 'AI Agent 集群太极64卦系统', descriptionCn: 'AI Agent 集群太极64卦系统' },
  { id: 'openspace', name: 'OpenSpace', nameCn: 'OpenSpace', url: 'https://github.com', category: '虾群系统', description: 'AI Agent 知识进化与工作流平台', descriptionCn: 'AI Agent 知识进化与工作流平台' },
  { id: 'tw-dev', name: 'Twitter Dev', nameCn: 'Twitter 开发者平台', url: 'https://developer.twitter.com', category: '社媒平台', description: 'Twitter/X API, Ads API, Labs', descriptionCn: 'Twitter/X API、广告 API、开发工具' },
  { id: 'meta-dev', name: 'Meta Dev', nameCn: 'Meta 开发者平台', url: 'https://developers.facebook.com', category: '社媒平台', description: 'Facebook, Instagram, WhatsApp, Threads', descriptionCn: 'Facebook、Instagram、WhatsApp、Threads API' },
  { id: 'tt-dev', name: 'TikTok Dev', nameCn: 'TikTok 开发者平台', url: 'https://developers.tiktok.com', category: '社媒平台', description: 'TikTok API, Creator API, Commerce API', descriptionCn: 'TikTok API、创作者 API、电商 API' },
  { id: 'yt-dev', name: 'YouTube APIs', nameCn: 'YouTube 开发者平台', url: 'https://developers.google.com/youtube', category: '社媒平台', description: 'YouTube Data API, Analytics, Live', descriptionCn: 'YouTube Data API、数据分析与直播 API' },
  { id: 'li-dev', name: 'LinkedIn Dev', nameCn: 'LinkedIn 开发者平台', url: 'https://learn.microsoft.com/en-us/linkedin', category: '社媒平台', description: 'Marketing, Sales Navigator, Talent APIs', descriptionCn: '营销、销售、人才 API' },
  { id: 'tg-dev', name: 'Telegram Bot API', nameCn: 'Telegram 机器人 API', url: 'https://core.telegram.org/bots/api', category: '社媒平台', description: 'Bot API, BotFather, Channel management', descriptionCn: '机器人 API、BotFather、频道管理' },
  { id: 'dc-dev', name: 'Discord Dev', nameCn: 'Discord 开发者平台', url: 'https://discord.com/developers/docs', category: '社媒平台', description: 'Bot API, Gateway, Interactions, Webhooks', descriptionCn: '机器人 API、网关、交互与 Webhook' },
  { id: 'xhs-dev', name: '小红书创作平台', nameCn: '小红书创作平台', url: 'https://creator.xiaohongshu.com', category: '社媒平台', description: 'Creator dashboard, analytics, commerce', descriptionCn: '创作者中心、数据分析、带货功能' },
  { id: 'amz-sell', name: 'Amazon Seller', nameCn: 'Amazon 卖家中心', url: 'https://sellercentral.amazon.com', category: '电商平台', description: 'Amazon selling, FBA, ads & seller APIs', descriptionCn: '亚马逊销售、FBA库存、广告与卖家 API' },
  { id: 'wmt-sell', name: 'Walmart Seller', nameCn: 'Walmart 卖家中心', url: 'https://seller.walmart.com', category: '电商平台', description: 'Walmart US marketplace seller portal & APIs', descriptionCn: 'Walmart 美国市场卖家中心与 API' },
  { id: 'tk-shop', name: 'TikTok Shop', nameCn: 'TikTok Shop', url: 'https://seller.tiktok.com', category: '电商平台', description: 'TikTok Shop seller center & APIs', descriptionCn: 'TikTok Shop 卖家中心与 API' },
  { id: 'ae-sell', name: 'AliExpress Seller', nameCn: '速卖通卖家', url: 'https://sell.aliexpress.com', category: '电商平台', description: 'AliExpress seller center & APIs', descriptionCn: '速卖通卖家中心与 API' },
  { id: 'shopee-biz', name: 'Shopee Seller', nameCn: 'Shopee 卖家', url: 'https://seller.shopee.cn', category: '电商平台', description: 'Shopee seller center & APIs', descriptionCn: 'Shopee 卖家中心与 API' },
  { id: 'lazada-biz', name: 'Lazada Seller', nameCn: 'Lazada 卖家', url: 'https://seller.lazada.com', category: '电商平台', description: 'Lazada seller portal & APIs', descriptionCn: 'Lazada 卖家门户与 API' },
  { id: 'temu-sell', name: 'Temu Seller', nameCn: 'Temu 卖家', url: 'https://seller.temu.com', category: '电商平台', description: 'Temu seller registration & management', descriptionCn: 'Temu 卖家入驻与店铺管理' },
  { id: 'etsy-sell', name: 'Etsy Sellers', nameCn: 'Etsy 卖家', url: 'https://www.etsy.com/sell', category: '电商平台', description: 'Etsy seller dashboard & seller API', descriptionCn: 'Etsy 卖家中心与销售 API' },
  { id: 'ngrok', name: 'ngrok', nameCn: 'ngrok', url: 'https://ngrok.com', category: '开发工具', description: 'Secure tunnels for webhooks & local dev', descriptionCn: 'Webhook 本地调试与安全隧道' },
  { id: 'cloudflare', name: 'Cloudflare Workers', nameCn: 'Cloudflare Workers', url: 'https://workers.cloudflare.com', category: '开发工具', description: 'Serverless webhook receivers & edge fns', descriptionCn: '无服务器 Webhook 接收器与边缘函数' },
  { id: 'vercel', name: 'Vercel', nameCn: 'Vercel', url: 'https://vercel.com', category: '开发工具', description: 'Deploy webhook handlers & API routes', descriptionCn: 'Webhook 处理器与 API 路由部署' },
];

const RESIDENTIAL_IPS: ResidentialIP[] = [
  { id: 'ip-001', provider: 'Bright Data', providerCn: '亮数据 Bright Data', country: 'US', countryFlag: '🇺🇸', city: 'New York', ip: '192.168.1.101:8080', protocol: 'HTTP', status: 'active', expiresAt: '2026-05-10', usedBy: 'twitter-01', usedByCn: 'Twitter 账号#01' },
  { id: 'ip-002', provider: 'Oxylabs', providerCn: 'Oxylabs', country: 'UK', countryFlag: '🇬🇧', city: 'London', ip: '192.168.1.102:3128', protocol: 'HTTPS', status: 'active', expiresAt: '2026-05-15', usedBy: 'instagram-02', usedByCn: 'Instagram 账号#02' },
  { id: 'ip-003', provider: 'SmartProxy', providerCn: 'SmartProxy', country: 'DE', countryFlag: '🇩🇪', city: 'Berlin', ip: '192.168.1.103:1080', protocol: 'SOCKS5', status: 'active', expiresAt: '2026-06-01', usedBy: 'tiktok-03', usedByCn: 'TikTok 账号#03' },
  { id: 'ip-004', provider: 'Soax', providerCn: 'Soax', country: 'JP', countryFlag: '🇯🇵', city: 'Tokyo', ip: '192.168.1.104:8080', protocol: 'HTTP', status: 'expiring', expiresAt: '2026-04-30', usedBy: 'linkedin-01', usedByCn: 'LinkedIn 账号#01' },
  { id: 'ip-005', provider: 'Proxy-Cheap', providerCn: 'Proxy-Cheap', country: 'BR', countryFlag: '🇧🇷', city: 'São Paulo', ip: '192.168.1.105:3128', protocol: 'HTTPS', status: 'active', expiresAt: '2026-05-20', usedBy: 'whatsapp-02', usedByCn: 'WhatsApp 账号#02' },
  { id: 'ip-006', provider: 'Bright Data', providerCn: '亮数据 Bright Data', country: 'AU', countryFlag: '🇦🇺', city: 'Sydney', ip: '192.168.1.106:1080', protocol: 'SOCKS5', status: 'expired', expiresAt: '2026-04-20', usedBy: 'reddit-01', usedByCn: 'Reddit 账号#01' },
  { id: 'ip-007', provider: 'Oxylabs', providerCn: 'Oxylabs', country: 'CA', countryFlag: '🇨🇦', city: 'Toronto', ip: '192.168.1.107:8080', protocol: 'HTTP', status: 'active', expiresAt: '2026-06-10', usedBy: 'facebook-01', usedByCn: 'Facebook 账号#01' },
  { id: 'ip-008', provider: 'SmartProxy', providerCn: 'SmartProxy', country: 'FR', countryFlag: '🇫🇷', city: 'Paris', ip: '192.168.1.108:3128', protocol: 'HTTPS', status: 'active', expiresAt: '2026-05-25', usedBy: 'discord-01', usedByCn: 'Discord 账号#01' },
];

const SERVICE_PROVIDERS: ServiceProvider[] = [
  { id: 'sp-01', name: 'Bright Data', nameCn: '亮数据 Bright Data', category: '住宅IP', website: 'https://brightdata.com', icon: '🌐', color: '#4f46e5', description: 'Industry-leading residential proxy network with 72M+ IPs', descriptionCn: '行业领先的住宅代理网络，72M+ IP 覆盖', status: 'verified', contact: 'sales@brightdata.com', rating: 4.8, reviewCount: 342 },
  { id: 'sp-02', name: 'Oxylabs', nameCn: 'Oxylabs', category: '住宅IP', website: 'https://oxylabs.io', icon: '🧬', color: '#059669', description: 'Premium residential & datacenter proxies, 195+ countries', descriptionCn: '高端住宅与数据中心代理，覆盖 195+ 国家', status: 'verified', contact: 'hello@oxylabs.io', rating: 4.7, reviewCount: 218 },
  { id: 'sp-03', name: 'SmartProxy', nameCn: 'SmartProxy', category: '住宅IP', website: 'https://smartproxy.com', icon: '🔄', color: '#dc2626', description: 'Rotating residential proxies, unlimited bandwidth', descriptionCn: '轮换住宅代理，无限带宽', status: 'verified', contact: 'support@smartproxy.com', rating: 4.5, reviewCount: 156 },
  { id: 'sp-04', name: 'Soax', nameCn: 'Soax', category: '住宅IP', website: 'https://soax.com', icon: '🔍', color: '#7c3aed', description: 'Ethical residential proxies, 5M+ clean IPs', descriptionCn: '合规住宅代理，5M+ 纯净 IP', status: 'pending', rating: 4.3, reviewCount: 89 },
  { id: 'sp-05', name: 'Proxy-Cheap', nameCn: 'Proxy-Cheap', category: '代理IP', website: 'https://proxy-cheap.com', icon: '💰', color: '#ea580c', description: 'Affordable proxies for social media automation', descriptionCn: '社媒自动化平价代理方案', status: 'verified', contact: 'hello@proxy-cheap.com', rating: 4.2, reviewCount: 201 },
  { id: 'sp-06', name: '淡友 - 紫鸟浏览器', nameCn: '淡友 - 紫鸟浏览器', category: 'RPA工具', website: 'https://www.ziniao.com', icon: '🐯', color: '#b45309', description: 'Multi-account browser for Amazon & cross-border e-commerce', descriptionCn: '多账号浏览器，亚马逊/跨境电商专用', status: 'verified', contact: 'support@ziniao.com', rating: 4.6, reviewCount: 478 },
  { id: 'sp-07', name: '八爪鱼 RPA', nameCn: '八爪鱼 RPA', category: 'RPA工具', website: 'https://rpa.bazhuayu.com', icon: '🐸', color: '#0891b2', description: 'AI-powered RPA with natural language workflow generation', descriptionCn: 'AI+RPA，支持自然语言流程生成', status: 'verified', contact: 'contact@bazhuayu.com', rating: 4.4, reviewCount: 312 },
  { id: 'sp-08', name: '虎步 RPA', nameCn: '虎步 RPA', category: 'RPA工具', website: 'https://www.huburpa.com', icon: '🐯', color: '#be123c', description: 'Cloud RPA with Amazon-native API integration', descriptionCn: '云RPA，亚马逊原生 API 集成', status: 'verified', contact: 'info@huburpa.com', rating: 4.3, reviewCount: 167 },
  { id: 'sp-09', name: 'ClawTip', nameCn: 'ClawTip', category: '支付网关', website: 'https://clawtip.example.com', icon: '🦞', color: '#16a34a', description: 'AI skill micro-payment and tipping closed loop', descriptionCn: 'AI 技能微支付与打赏闭环', status: 'verified', rating: 4.9, reviewCount: 88 },
  { id: 'sp-10', name: 'Cloudflare', nameCn: 'Cloudflare', category: '云服务', website: 'https://cloudflare.com', icon: '☁️', color: '#f97316', description: 'CDN, Workers (webhook receiver), Tunnel, R2 storage', descriptionCn: 'CDN、Workers（Webhook接收器）、Tunnel、R2存储', status: 'verified', rating: 4.9, reviewCount: 1024 },
  { id: 'sp-11', name: 'Vercel', nameCn: 'Vercel', category: '云服务', website: 'https://vercel.com', icon: '▲', color: '#000000', description: 'Serverless webhook handlers, API routes, edge functions', descriptionCn: '无服务器 Webhook 处理器、API 路由、边缘函数', status: 'verified', rating: 4.7, reviewCount: 876 },
  { id: 'sp-12', name: 'ngrok', nameCn: 'ngrok', category: '云服务', website: 'https://ngrok.com', icon: '🔗', color: '#1d4ed8', description: 'Secure tunnels for local webhook dev & testing', descriptionCn: '本地 Webhook 开发调试安全隧道', status: 'verified', rating: 4.8, reviewCount: 654 },
];

// ── 子组件 ──────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    connected: { label: '已连接', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    disconnected: { label: '未连接', color: 'text-slate-500 bg-slate-500/10 border-slate-500/20' },
    expired: { label: '已过期', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
    active: { label: '活跃', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    expiring: { label: '即将到期', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    paused: { label: '已暂停', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    error: { label: '错误', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
    verified: { label: '已认证', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
    pending: { label: '待审核', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
    contacted: { label: '已联系', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  };
  const cfg = map[status] ?? { label: status, color: 'text-slate-400 bg-slate-500/10 border-slate-500/20' };
  return <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${cfg.color}`}>{cfg.label}</span>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-xs ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
      ))}
      <span className="text-[10px] text-slate-400 ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

// ── 主组件 ──────────────────────────────────────────────────────────────────

export default function SocialMatrixPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('matrix');
  const [platforms] = useState<Platform[]>(SOCIAL_PLATFORMS);
  const [webhooks, setWebhooks] = useState<Webhook[]>(WEBHOOKS);
  const [residentialIPs] = useState<ResidentialIP[]>(RESIDENTIAL_IPS);
  const [providers] = useState<ServiceProvider[]>(SERVICE_PROVIDERS);
  const [loginModal, setLoginModal] = useState<Platform | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [webhookEventInput, setWebhookEventInput] = useState('message.received');
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [contactModal, setContactModal] = useState<ServiceProvider | null>(null);
  const [contactNote, setContactNote] = useState('');
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({ name: '', url: '', category: '住宅IP' as ServiceProvider['category'], note: '' });
  const [openClawCmd, setOpenClawCmd] = useState('');
  const [cmdRunning, setCmdRunning] = useState(false);
  const [cmdOutput, setCmdOutput] = useState<string[]>([]);

  const handleLogin = (platform: Platform) => { setLoginModal(platform); setApiKeyInput(''); };
  const handleSaveApiKey = () => { if (!loginModal || !apiKeyInput.trim()) return; setLoginModal(null); };
  const handleToggleWebhook = (id: string) => setWebhooks(prev => prev.map(w => w.id === id ? { ...w, status: w.status === 'active' ? 'paused' : 'active' } : w));
  const handleDeleteWebhook = (id: string) => setWebhooks(prev => prev.filter(w => w.id !== id));
  const handleAddWebhook = () => {
    if (!webhookUrlInput.trim()) return;
    setWebhooks(prev => [{
      id: `wh-new-${Date.now()}`, platform: 'custom', platformName: '自定义',
      event: webhookEventInput, url: webhookUrlInput,
      secret: `wh_secret_****${Math.random().toString(36).slice(-4)}`,
      status: 'active' as const,
      createdAt: new Date().toISOString().split('T')[0],
      triggerCount: 0,
    }, ...prev]);
    setWebhookUrlInput(''); setShowAddWebhook(false);
  };
  const handleContactProvider = () => { if (!contactModal) return; setContactModal(null); setContactNote(''); };
  const handleAddProvider = () => { if (!newProvider.name.trim() || !newProvider.url.trim()) return; setShowAddProvider(false); setNewProvider({ name: '', url: '', category: '住宅IP', note: '' }); };

  const handleOpenClawRun = () => {
    if (!openClawCmd.trim()) return;
    setCmdRunning(true);
    const newLine = `[${new Date().toLocaleTimeString()}] $ ${openClawCmd}`;
    setCmdOutput(prev => [...prev, newLine, '  → OpenClaw Agent Browser 执行中...']);
    setTimeout(() => {
      setCmdOutput(prev => [...prev, '  ✓ 命令执行完成（模拟输出）']);
      setCmdRunning(false);
    }, 1500);
  };

  const connectedCount = platforms.filter(p => p.status === 'connected').length;
  const activeWebhookCount = webhooks.filter(w => w.status === 'active').length;
  const errorWebhookCount = webhooks.filter(w => w.status === 'error').length;
  const activeIPCount = residentialIPs.filter(ip => ip.status === 'active').length;
  const expiringIPCount = residentialIPs.filter(ip => ip.status === 'expiring').length;
  const verifiedProviderCount = providers.filter(p => p.status === 'verified').length;

  const tabs: { id: Tab; label: string; icon: string; count?: number; countColor?: string }[] = [
    { id: 'matrix', label: '全球社媒矩阵', icon: '📊', count: connectedCount, countColor: connectedCount > 0 ? 'text-green-400' : 'text-slate-500' },
    { id: 'webhooks', label: 'Webhook配置', icon: '🔗', count: activeWebhookCount, countColor: errorWebhookCount > 0 ? 'text-red-400' : 'text-green-400' },
    { id: 'sites', label: '官方网站入口', icon: '🌐', count: OFFICIAL_SITES.length, countColor: 'text-slate-500' },
    { id: 'ips', label: '本地化住宅IP', icon: '🌍', count: activeIPCount, countColor: expiringIPCount > 0 ? 'text-yellow-400' : 'text-green-400' },
    { id: 'providers', label: '添加服务商', icon: '🤝', count: verifiedProviderCount, countColor: 'text-green-400' },
    { id: 'ecommerce', label: '🦞 全球电商中枢', icon: '🦞', count: undefined, countColor: 'text-purple-400' },
  ];

  const categoryColors: Record<string, string> = {
    '虾群系统': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    '社媒平台': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    '电商平台': 'bg-green-500/10 text-green-400 border-green-500/20',
    '开发工具': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  };
  const providerCatColors: Record<string, string> = {
    '代理IP': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    '住宅IP': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    '社媒账号': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    '云服务': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    'RPA工具': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    '支付网关': 'bg-green-500/10 text-green-400 border-green-500/20',
    '数据服务': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  };

  return (
    <div className="flex-1 overflow-auto p-5 space-y-5">

      {/* ── 页面标题 ── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 flex items-center gap-2">
            🦞 跨境龙虾社 <span className="text-slate-700">›</span> 全球社媒矩阵营销系统
          </div>
          <h1 className="text-2xl font-bold text-white mt-1">全球运营矩阵后台</h1>
          <p className="text-xs text-slate-500 mt-1">社媒登录授权 · API 配置 · Webhook · 官方网站 · 住宅IP · 服务商 · 全球电商中枢</p>
        </div>
        <div className="flex gap-4 mt-1">
          <div className="text-right"><div className="text-xl font-bold text-white">{connectedCount}<span className="text-xs text-slate-500 font-normal">/{platforms.length}</span></div><div className="text-[10px] text-slate-500">已连接平台</div></div>
          <div className="text-right"><div className="text-xl font-bold text-green-400">{activeWebhookCount}</div><div className="text-[10px] text-slate-500">活跃 Webhook</div></div>
          <div className="text-right"><div className="text-xl font-bold text-white">{activeIPCount}</div><div className="text-[10px] text-slate-500">活跃 IP</div></div>
          <div className="text-right"><div className="text-xl font-bold text-white">{verifiedProviderCount}</div><div className="text-[10px] text-slate-500">认证服务商</div></div>
        </div>
      </div>

      {/* ── 标签导航 ── */}
      <div className="flex gap-1 border-b border-slate-800 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 -mb-px transition-all cursor-pointer rounded-t-md ${
              activeTab === tab.id
                ? 'border-cyan-500 text-cyan-400 bg-cyan-500/5'
                : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] font-bold ml-1 ${tab.countColor}`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签1：全球社媒矩阵                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">共 {platforms.length} 个平台 · 已连接 {connectedCount} 个 · 包含登录入口、API Key 配置与开发者文档</p>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {platforms.map(p => (
              <div key={p.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3 hover:border-slate-600/80 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: p.color + '22', color: p.color }}>{p.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{p.nameCn}</div>
                      <div className="text-[10px] text-slate-500">{p.name} · {p.region}</div>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{p.descriptionCn}</p>
                <div className="space-y-1">
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-medium">API Key</div>
                  <div className="bg-slate-900/60 rounded px-2.5 py-1.5 flex items-center gap-2">
                    <code className="flex-1 text-[10px] text-slate-400 font-mono truncate">{p.apiKey ? p.apiKey.slice(0, 8) + '••••••••' + p.apiKey.slice(-4) : '未配置'}</code>
                    {p.apiKey && <span className="text-[9px] text-cyan-500 shrink-0">{p.authType.toUpperCase()}</span>}
                  </div>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <button type="button" onClick={() => handleLogin(p)}
                    className={`flex-1 text-[10px] py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                      p.status === 'connected'
                        ? 'border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                        : 'bg-cyan-600/80 text-white hover:bg-cyan-600'
                    }`}>
                    {p.status === 'connected' ? '重新授权' : '连接平台'}
                  </button>
                  <a href={p.docsUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-600/50 text-slate-400 hover:bg-slate-700/50 transition-all text-center">文档</a>
                  <a href={p.loginUrl} target="_blank" rel="noopener noreferrer"
                    className="text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-600/50 text-slate-400 hover:bg-slate-700/50 transition-all text-center">登录</a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签2：Webhook 配置                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">已配置 {webhooks.length} 个 Webhook {errorWebhookCount > 0 && <span className="ml-2 text-red-400 font-medium">⚠ {errorWebhookCount} 个异常</span>}</p>
            <button type="button" onClick={() => setShowAddWebhook(v => !v)}
              className="text-[11px] px-4 py-2 bg-cyan-600/80 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition-colors font-medium">
              + 添加 Webhook
            </button>
          </div>
          {showAddWebhook && (
            <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl p-4 space-y-3 border-l-4 border-l-cyan-500">
              <div className="text-sm font-medium text-cyan-400">添加新 Webhook</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">事件类型</label>
                  <select value={webhookEventInput} onChange={e => setWebhookEventInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
                    {['message.received', 'order.created', 'order.updated', 'review.received', 'tweet.engagement', 'note.published', 'member.joined', 'payment.completed'].map(ev => (
                      <option key={ev} value={ev}>{ev}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">接收 URL</label>
                  <input type="url" value={webhookUrlInput} onChange={e => setWebhookUrlInput(e.target.value)}
                    placeholder="https://your-domain.com/webhooks/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleAddWebhook}
                  className="text-[11px] px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-600 cursor-pointer font-medium">保存 Webhook</button>
                <button type="button" onClick={() => setShowAddWebhook(false)}
                  className="text-[11px] px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer">取消</button>
              </div>
            </div>
          )}
          <div className="space-y-2">
            {webhooks.map(w => (
              <div key={w.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-white">{w.platformName}</span>
                    <span className="text-[10px] text-slate-500 font-mono bg-slate-900/60 px-2 py-0.5 rounded">{w.event}</span>
                    <StatusBadge status={w.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] text-slate-500 font-mono truncate max-w-xs">{w.url}</code>
                    <button type="button" onClick={() => navigator.clipboard.writeText(w.url)}
                      className="text-[10px] text-cyan-500 hover:underline shrink-0">复制</button>
                  </div>
                  <div className="text-[10px] text-slate-600">密钥：<code className="font-mono">{w.secret}</code> · 触发 {w.triggerCount} 次 {w.lastTriggered && <>· 最近 {w.lastTriggered}</>}</div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => handleToggleWebhook(w.id)}
                    className={`text-[10px] px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                      w.status === 'active' ? 'border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10' : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                    }`}>
                    {w.status === 'active' ? '暂停' : '启用'}
                  </button>
                  <button type="button" onClick={() => handleDeleteWebhook(w.id)}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors">删除</button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-medium text-cyan-400 mb-2">💡 Webhook 最佳实践</div>
            <ul className="text-[11px] text-slate-500 space-y-1">
              <li>• 使用 HTTPS 接收 URL，确保数据传输加密</li>
              <li>• 验证 X-Signature 签名头防伪造</li>
              <li>• 返回 200 OK 在 3 秒内完成，避免平台重试</li>
              <li>• 本地开发推荐 ngrok / Cloudflare Tunnel</li>
              <li>• 生产环境推荐 Vercel / Cloudflare Workers / 自建服务器</li>
            </ul>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签3：官方网站入口                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'sites' && (
        <div className="space-y-5">
          {(['虾群系统', '社媒平台', '电商平台', '开发工具'] as const).map(category => {
            const items = OFFICIAL_SITES.filter(s => s.category === category);
            return (
              <div key={category} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">{category}</span>
                  <span className="text-[10px] text-slate-600">{items.length} 个链接</span>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {items.map(site => (
                    <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer"
                      className={`bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3 hover:${categoryColors[category].split(' ')[0]}/10 hover:border-slate-600/80 transition-colors cursor-pointer group`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-medium text-white">{site.nameCn}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded border ${categoryColors[category] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>{site.category}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{site.name} · {site.descriptionCn}</div>
                      </div>
                      <span className="text-slate-600 group-hover:text-cyan-500 transition-colors shrink-0">↗</span>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签4：本地化住宅IP                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'ips' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">共 {residentialIPs.length} 个 IP · 活跃 {activeIPCount} 个 {expiringIPCount > 0 && <span className="ml-2 text-yellow-400 font-medium">⚠ {expiringIPCount} 个即将到期</span>}</p>
            <div className="flex gap-2">
              <button type="button" className="text-[11px] px-4 py-2 bg-cyan-600/80 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition-colors font-medium">+ 添加 IP</button>
              <button type="button" className="text-[11px] px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">批量轮换</button>
            </div>
          </div>
          {/* ISP Summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Bright Data', count: residentialIPs.filter(ip => ip.provider === 'Bright Data').length, color: '#4f46e5', flag: '🌐' },
              { label: 'Oxylabs', count: residentialIPs.filter(ip => ip.provider === 'Oxylabs').length, color: '#059669', flag: '🧬' },
              { label: 'SmartProxy', count: residentialIPs.filter(ip => ip.provider === 'SmartProxy').length, color: '#dc2626', flag: '🔄' },
              { label: 'Proxy-Cheap', count: residentialIPs.filter(ip => ip.provider === 'Proxy-Cheap').length, color: '#ea580c', flag: '💰' },
            ].map(isp => (
              <div key={isp.label} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-3">
                <div className="text-lg">{isp.flag}</div>
                <div><div className="text-xs font-medium text-white">{isp.label}</div><div className="text-[10px] text-slate-500">{isp.count} 个 IP</div></div>
              </div>
            ))}
          </div>
          {/* IP List */}
          <div className="space-y-2">
            {residentialIPs.map(ip => {
              const statusMap: Record<string, { color: string; bar: string }> = {
                active: { color: 'bg-green-500', bar: 'w-full' },
                expiring: { color: 'bg-yellow-500', bar: 'w-1/3' },
                expired: { color: 'bg-red-500', bar: 'w-0' },
              };
              const barCfg = statusMap[ip.status] ?? statusMap.active;
              const [showIP, setShowIP] = useState(false);
              return (
                <div key={ip.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 flex items-center gap-4">
                  <div className="text-2xl">{ip.countryFlag}</div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-white">{ip.providerCn}</span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-900/60 px-1.5 py-0.5 rounded">{ip.city} · {ip.country}</span>
                      <StatusBadge status={ip.status} />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500">
                      <span className="font-mono">{showIP ? ip.ip : ip.ip.replace(/\d+\.\d+\.\d+\./, '***.***.***.').replace(/:.*/, ':****')}</span>
                      <span className="font-mono bg-slate-900/60 px-1.5 py-0.5 rounded">{ip.protocol}</span>
                      <button type="button" onClick={() => setShowIP(s => !s)} className="text-cyan-500 hover:underline">{showIP ? '隐藏' : '显示'}</button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-600">
                      <span>用于：<span className="font-medium text-slate-400">{ip.usedByCn}</span></span>
                      <span>· 到期：{ip.expiresAt}</span>
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${barCfg.color} rounded-full transition-all`} /></div>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => {}}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-colors shrink-0">轮换 IP</button>
                </div>
              );
            })}
          </div>
          <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 space-y-1.5">
            <div className="text-xs font-medium text-cyan-400 mb-2">💡 住宅 IP 使用建议</div>
            <ul className="text-[11px] text-slate-500 space-y-1">
              <li>• 社媒账号绑定固定 IP 段，避免触发风控</li>
              <li>• 账号注册 7 天内不要切换 IP 国家，保持 IP 稳定性</li>
              <li>• 即将到期 IP 及时续费，Expired IP 会导致账号异常</li>
              <li>• 建议每个账号绑定独立 IP，减少关联风险</li>
              <li>• 主流服务商：Bright Data（量大）、Oxylabs（稳定）、SmartProxy（性价比）</li>
            </ul>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签5：添加服务商                                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">共 {providers.length} 家服务商 · 已认证 {verifiedProviderCount} 家</p>
            <button type="button" onClick={() => setShowAddProvider(v => !v)}
              className="text-[11px] px-4 py-2 bg-cyan-600/80 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition-colors font-medium">+ 添加服务商</button>
          </div>
          {showAddProvider && (
            <div className="bg-slate-800/40 border border-cyan-500/20 rounded-xl p-4 space-y-3 border-l-4 border-l-cyan-500">
              <div className="text-sm font-medium text-cyan-400">添加新服务商</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">服务商名称</label>
                  <input type="text" value={newProvider.name} onChange={e => setNewProvider(p => ({ ...p, name: e.target.value }))} placeholder="服务商名称"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">官网 URL</label>
                  <input type="url" value={newProvider.url} onChange={e => setNewProvider(p => ({ ...p, url: e.target.value }))} placeholder="https://example.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">服务类别</label>
                  <select value={newProvider.category} onChange={e => setNewProvider(p => ({ ...p, category: e.target.value as ServiceProvider['category'] }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
                    {['代理IP', '住宅IP', '社媒账号', '云服务', 'RPA工具', '支付网关', '数据服务'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 uppercase tracking-wider">备注</label>
                  <input type="text" value={newProvider.note} onChange={e => setNewProvider(p => ({ ...p, note: e.target.value }))} placeholder="价格/联系信息/备注"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleAddProvider}
                  className="text-[11px] px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-600 cursor-pointer font-medium">提交服务商</button>
                <button type="button" onClick={() => setShowAddProvider(false)}
                  className="text-[11px] px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer">取消</button>
              </div>
            </div>
          )}
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap">
            {['全部', '住宅IP', '代理IP', 'RPA工具', '云服务', '支付网关', '社媒账号', '数据服务'].map(cat => (
              <button key={cat} type="button"
                className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 cursor-pointer transition-colors">{cat}</button>
            ))}
          </div>
          {/* Provider Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
            {providers.map(p => (
              <div key={p.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: p.color + '22', color: p.color }}>{p.icon}</div>
                    <div>
                      <div className="text-sm font-bold text-white">{p.nameCn}</div>
                      <div className="text-[10px] text-slate-500">{p.name}</div>
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{p.descriptionCn}</p>
                <div className="flex items-center justify-between">
                  <StarRating rating={p.rating} />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border ${providerCatColors[p.category] ?? 'bg-slate-700 text-slate-400 border-slate-600'}`}>{p.category}</span>
                </div>
                <div className="flex gap-1.5 pt-0.5">
                  <a href={p.website} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-[10px] py-2 bg-cyan-600/80 text-white rounded-lg hover:bg-cyan-600 text-center transition-opacity font-medium">官网</a>
                  <button type="button" onClick={() => setContactModal(p)}
                    className="flex-1 text-[10px] py-2 border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/10 cursor-pointer transition-colors">联系咨询</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/*  标签6：🦞 全球电商中枢                                  */}
      {/* ════════════════════════════════════════════════════════ */}
      {activeTab === 'ecommerce' && (
        <div className="space-y-5">

          {/* OpenClaw 中枢控制台横幅 */}
          <div className="bg-gradient-to-r from-purple-900/40 to-indigo-900/40 border border-purple-500/30 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">🦞</div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">OpenClaw Agent Browser — 全球电商中枢调度系统</div>
                <div className="text-[10px] text-slate-400 mt-0.5">基于浏览器自动化 · 实时拉取全网订单 · 多站库存自动扣减 · 物流状态邮件自动推送海外买家</div>
              </div>
              <div className="flex gap-2">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors">GitHub</a>
                <a href="https://docs.example.com/openclaw" target="_blank" rel="noopener noreferrer"
                  className="text-[11px] px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">文档</a>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-3">
              {[
                { icon: '📦', label: '今日新订单', value: '127', color: 'text-green-400', sub: '跨 6 个平台' },
                { icon: '📊', label: '待处理订单', value: '43', color: 'text-yellow-400', sub: '自动分配优先级' },
                { icon: '🏭', label: '库存预警', value: '8', color: 'text-red-400', sub: '多站同步扣减' },
                { icon: '📧', label: '邮件已发送', value: '312', color: 'text-blue-400', sub: '物流状态推送' },
              ].map(stat => (
                <div key={stat.label} className="bg-black/20 rounded-lg p-3 text-center border border-purple-500/10">
                  <div className="text-lg mb-1">{stat.icon}</div>
                  <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] text-slate-400">{stat.label}</div>
                  <div className="text-[9px] text-slate-600">{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 电商平台连接 */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-white">🏪 全球电商平台矩阵</div>
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3">
              {[
                { name: 'Amazon Seller', icon: '📦', color: '#FF9900', url: 'https://sellercentral.amazon.com', connected: true, region: '美国 · 欧洲 · 日本' },
                { name: 'Walmart Seller', icon: '🛒', color: '#003366', url: 'https://seller.walmart.com', connected: false, region: '美国为主' },
                { name: 'TikTok Shop', icon: '🎵', color: '#000000', url: 'https://seller.tiktok.com', connected: true, region: '东南亚 · 英国 · 美国' },
                { name: 'AliExpress', icon: '🌐', color: '#FF6600', url: 'https://sell.aliexpress.com', connected: true, region: '全球速卖通' },
                { name: 'Shopee', icon: '🦐', color: '#EE4D2D', url: 'https://seller.shopee.cn', connected: false, region: '东南亚 7 国' },
                { name: 'Lazada', icon: '🛍️', color: '#F57C00', url: 'https://seller.lazada.com', connected: false, region: '东南亚 6 国' },
                { name: 'Temu', icon: '⚡', color: '#D0021B', url: 'https://seller.temu.com', connected: false, region: '美国 · 欧洲' },
                { name: 'Shein', icon: '👗', color: '#FF4DC4', url: 'https://shein.com/supplier', connected: false, region: '全球' },
              ].map(shop => (
                <div key={shop.name} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-base" style={{ background: shop.color + '22', color: shop.color }}>{shop.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white truncate">{shop.name}</div>
                      <div className="text-[9px] text-slate-500 truncate">{shop.region}</div>
                    </div>
                    {shop.connected
                      ? <span className="text-[9px] bg-green-500/10 text-green-400 px-1.5 py-0.5 rounded-full border border-green-500/20">已连接</span>
                      : <span className="text-[9px] bg-slate-700/50 text-slate-500 px-1.5 py-0.5 rounded-full">未连接</span>
                    }
                  </div>
                  <div className="flex gap-1.5">
                    <a href={shop.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 text-[10px] py-1 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors text-center text-slate-400 cursor-pointer">卖家后台</a>
                    <button type="button"
                      className={`flex-1 text-[10px] py-1 rounded-lg text-white cursor-pointer transition-opacity ${
                        shop.connected ? 'bg-green-600/80 hover:bg-green-600' : 'bg-purple-600/80 hover:bg-purple-600'
                      }`}>
                      {shop.connected ? '同步数据' : '连接'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 三大核心功能 */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: '🔄', title: '实时全网订单拉取', color: 'border-blue-500/40 bg-blue-900/20',
                desc: 'OpenClaw Agent Browser 自动登录各大电商平台卖家后台，每 5 分钟轮询一次，实时抓取新订单、发货状态、退款请求。',
                features: ['多平台统一订单池', '5分钟自动轮询', '退款异常预警', 'OpenClaw 浏览器自动化'],
                cmd: 'openclaw browser order-sync --platform all --interval 5m',
              },
              {
                icon: '🏭', title: '多站库存自动扣减', color: 'border-orange-500/40 bg-orange-900/20',
                desc: '订单确认后，自动在所有已连接店铺扣减对应 SKU 库存；库存低于阈值时，自动向供应商发送补货提醒。',
                features: ['SKU 全局库存同步', '库存阈值告警', '自动补货计算', '多平台库存聚合'],
                cmd: 'openclaw inventory sync --sku * --threshold 10 --alert',
              },
              {
                icon: '📧', title: '物流状态邮件推送', color: 'border-green-500/40 bg-green-900/20',
                desc: '物流状态更新后，自动调用 OpenClaw Agent 生成英文物流通知邮件，推送给海外买家，支持 20+ 主流物流商追踪。',
                features: ['AI 生成英文邮件', '物流状态自动抓取', '买家追踪链接', 'FedEx/DHL/UPS/顺丰'],
                cmd: 'openclaw email shipping-notify --lang en --buyer-email * --tracking-auto',
              },
            ].map((func, i) => (
              <div key={i} className={`bg-slate-800/40 border rounded-xl p-4 border-l-4 ${func.color} space-y-3`}>
                <div className="text-lg">{func.icon}</div>
                <div className="text-sm font-bold text-white">{func.title}</div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{func.desc}</p>
                <ul className="space-y-1">
                  {func.features.map(f => <li key={f} className="text-[10px] text-slate-500 flex items-center gap-1.5"><span className="text-green-500">✓</span>{f}</li>)}
                </ul>
                <div className="bg-black/20 rounded-lg p-2">
                  <div className="text-[9px] text-slate-600 mb-1">OpenClaw CLI</div>
                  <code className="text-[10px] font-mono text-purple-400 break-all">{func.cmd}</code>
                </div>
                <button type="button" className="w-full text-[11px] py-2 bg-purple-600/80 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition-opacity font-medium">执行指令</button>
              </div>
            ))}
          </div>

          {/* OpenClaw 指令控制台 */}
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 space-y-3">
            <div className="text-sm font-bold text-white">🖥️ OpenClaw Agent Browser — 指令控制台</div>
            <div className="text-[10px] text-slate-500">输入 OpenClaw Agent Browser CLI 指令，通过 AI Agent 浏览器自动化操控电商卖家后台</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: '🔄 拉取 Walmart 今日订单', cmd: 'openclaw browser read seller.walmart.com --date today --export orders' },
                { label: '📊 同步 Amazon FBA 库存', cmd: 'openclaw inventory sync amazon --region us,eu,jp' },
                { label: '📧 批量推送物流通知邮件', cmd: 'openclaw email batch --status shipped --buyers pending --lang en' },
                { label: '🔍 检测 Walmart Listing 差评', cmd: 'openclaw browser scrape seller.walmart.com --check reviews --alert' },
              ].map(item => (
                <button key={item.cmd} type="button" onClick={() => setOpenClawCmd(item.cmd)}
                  className="text-xs text-left p-2.5 border border-slate-700 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors">
                  <div className="font-medium mb-0.5 text-slate-300">{item.label}</div>
                  <code className="text-purple-400 font-mono text-[10px]">{item.cmd}</code>
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400 text-sm">›</span>
                <input type="text" value={openClawCmd} onChange={e => setOpenClawCmd(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleOpenClawRun()}
                  placeholder="输入 OpenClaw Agent Browser 指令..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-xs font-mono text-purple-400" />
              </div>
              <button type="button" onClick={handleOpenClawRun} disabled={cmdRunning}
                className="text-[11px] px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 cursor-pointer transition-colors">
                {cmdRunning ? '执行中...' : '▶ 执行'}
              </button>
            </div>
            {cmdOutput.length > 0 && (
              <div className="bg-black rounded-lg p-3 text-xs font-mono text-green-400 space-y-0.5 max-h-40 overflow-y-auto">
                {cmdOutput.map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)}
              </div>
            )}
            <div className="text-[10px] text-slate-600">
              <span className="font-medium text-slate-500">提示：</span>OpenClaw Agent Browser 使用 Puppeteer/Playwright 驱动真实浏览器，可登录任意电商平台卖家后台执行自动化任务。
              安装：<code className="font-mono text-purple-400">npm install -g openclaw-agent</code>
            </div>
          </div>

          {/* 物流商追踪 */}
          <div className="space-y-3">
            <div className="text-sm font-bold text-white">🚚 物流状态追踪 — 支持 20+ 主流物流商</div>
            <div className="grid grid-cols-5 gap-2">
              {['FedEx', 'DHL', 'UPS', 'USPS', 'Royal Mail', 'DPD', 'TNT', 'SF Express', 'YTO', 'ZTO', 'STO', 'JD Logistics', 'Yanwen', 'China Post', 'SEKO', 'XPO', 'Ninja Van', 'J&T Express', 'Cainiao', '4PX'].map(carrier => (
                <div key={carrier} className="bg-slate-800/40 border border-slate-700/50 rounded-lg p-2 text-center text-[10px] text-slate-400">{carrier}</div>
              ))}
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-3 space-y-2">
              <div className="text-[10px] font-medium text-slate-400 mb-1">最近物流状态更新</div>
              {[
                { order: '#WM-20260427-8832', buyer: 'john.d***@gmail.com', carrier: 'FedEx', tracking: '7734***9012', status: '已发货', time: '2 分钟前' },
                { order: '#AMZ-20260427-1147', buyer: 'sarah.m***@yahoo.com', carrier: 'UPS', tracking: '1Z999***4482', status: '运输中', time: '8 分钟前' },
                { order: '#TT-20260427-0293', buyer: 'mike.j***@outlook.com', carrier: 'DHL', tracking: '3318***5567', status: '清关中', time: '15 分钟前' },
                { order: '#AE-20260427-7721', buyer: 'lisa.w***@gmail.com', carrier: 'China Post', tracking: 'LB***7823CN', status: '已到达目的国', time: '23 分钟前' },
              ].map(log => (
                <div key={log.order} className="flex items-center gap-3 text-[10px]">
                  <span className="font-mono font-medium text-slate-300">{log.order}</span>
                  <span className="text-slate-600 truncate max-w-xs">{log.buyer}</span>
                  <span className="bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 text-[9px]">{log.carrier}</span>
                  <code className="text-slate-600 font-mono">{log.tracking}</code>
                  <span className={`ml-auto ${log.status === '已发货' ? 'text-green-400' : log.status === '运输中' ? 'text-blue-400' : 'text-yellow-400'}`}>{log.status}</span>
                  <span className="text-slate-600">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── 登录/配置弹窗 ── */}
      {loginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold" style={{ background: loginModal.color + '22', color: loginModal.color }}>{loginModal.icon}</div>
              <div>
                <div className="font-bold text-white">{loginModal.nameCn} API 配置</div>
                <div className="text-[10px] text-slate-500 font-mono">{loginModal.apiBase}</div>
              </div>
              <button type="button" onClick={() => setLoginModal(null)} className="ml-auto text-slate-500 hover:text-white cursor-pointer text-xl leading-none">×</button>
            </div>
            <p className="text-[11px] text-slate-500">{loginModal.descriptionCn}</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">API Key / Bearer Token</label>
                <input type="password" value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)}
                  placeholder={`粘贴 ${loginModal.name} API Key...`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Webhook 接收地址（可选）</label>
                <input type="url" placeholder="https://your-domain.com/webhooks/..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 font-mono" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveApiKey}
                  className="flex-1 text-sm font-medium py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition-opacity font-medium">保存配置</button>
                <a href={loginModal.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="text-sm px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors text-center">查看文档</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 联系服务商弹窗 ── */}
      {contactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl font-bold" style={{ background: contactModal.color + '22', color: contactModal.color }}>{contactModal.icon}</div>
              <div>
                <div className="font-bold text-white">{contactModal.nameCn}</div>
                <div className="text-[10px] text-slate-500">{contactModal.descriptionCn}</div>
              </div>
              <button type="button" onClick={() => setContactModal(null)} className="ml-auto text-slate-500 hover:text-white cursor-pointer text-xl leading-none">×</button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">联系备注</label>
                <textarea value={contactNote} onChange={e => setContactNote(e.target.value)} rows={4}
                  placeholder="描述你的需求，如：需要美国住宅IP 500个，了解价格方案..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 resize-none" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={handleContactProvider}
                  className="flex-1 text-sm font-medium py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-600 cursor-pointer transition-opacity font-medium">发送咨询</button>
                <a href={contactModal.website} target="_blank" rel="noopener noreferrer"
                  className="text-sm px-4 py-2 border border-slate-700 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors text-center">访问官网</a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
