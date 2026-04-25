/**
 * 全球登录聚合面板
 * 整合：全球电商平台 + 全球社媒/通讯平台 OAuth 登录入口
 */
import React, { useState } from 'react';

type PlatformType = 'ecommerce' | 'social';

interface Platform {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  docsUrl: string;
  category: PlatformType;
  features: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  // 直接链接
  websiteUrl?: string;       // 官方网站首页
  loginUrl?: string;         // OAuth 授权页面 / 直接登录
  developerUrl?: string;     // 开发者控制台（注册 App 获取凭证）
  docsSections?: string[];   // 关键文档章节
}

// 全球电商平台数据
const ECOMMERCE_PLATFORMS: Platform[] = [
  {
    id: 'shopify', name: 'Shopify', nameEn: 'Shopify', icon: '🛒',
    description: '全球最大电商 SaaS 平台，支持亚马逊、Temu 多渠道销售',
    docsUrl: 'https://shopify.dev/docs/admin-api',
    category: 'ecommerce', color: '#96BF48', bgColor: 'bg-green-950/40', borderColor: 'border-green-800/40',
    features: ['商品管理', '订单处理', '客户关系', '主题定制', '多渠道同步'],
    websiteUrl: 'https://www.shopify.com/',
    developerUrl: 'https://partners.shopify.com/',
    loginUrl: 'https://accounts.shopify.com/',
    docsSections: ['Admin API', 'Storefront API', 'OAuth 授权'],
  },
  {
    id: 'woocommerce', name: 'WooCommerce', nameEn: 'WooCommerce', icon: '🧱',
    description: 'WordPress 电商插件，适合独立站，全球最大开源电商方案',
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
    category: 'ecommerce', color: '#9B5C8F', bgColor: 'bg-purple-950/40', borderColor: 'border-purple-800/40',
    features: ['商品管理', '支付网关', '物流追踪', '优惠券系统', '会员管理'],
    websiteUrl: 'https://woocommerce.com/',
    developerUrl: 'https://woocommerce.com/woocommerce-rest-api-docs/',
    loginUrl: 'https://wordpress.com/',
    docsSections: ['REST API 认证', '商品端点', '订单端点'],
  },
  {
    id: 'amazon-seller', name: 'Amazon Seller', nameEn: 'Amazon SP-API', icon: '📦',
    description: '亚马逊卖家 API，支持北美/欧洲/日本/澳大利亚站点',
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
    category: 'ecommerce', color: '#FF9900', bgColor: 'bg-amber-950/40', borderColor: 'border-amber-800/40',
    features: ['SP-API', 'FBA 管理', '库存同步', '订单拉取', '广告报表'],
    websiteUrl: 'https://www.amazon.com/',
    developerUrl: 'https://sellercentral.amazon.com/apps/manage',
    loginUrl: 'https://sellercentral.amazon.com/',
    docsSections: ['Selling Partner API', 'LWA OAuth 2.0', 'FBA Inventory'],
  },
  {
    id: 'ebay-api', name: 'eBay', nameEn: 'eBay Developers', icon: '🏷️',
    description: 'eBay 开发者平台，支持 Trading API 和 Browse API',
    docsUrl: 'https://developer.ebay.com/develop/apis',
    category: 'ecommerce', color: '#E53238', bgColor: 'bg-red-950/40', borderColor: 'border-red-800/40',
    features: ['商品上架', '订单管理', '物流追踪', '价格同步', '多站点'],
    websiteUrl: 'https://www.ebay.com/',
    developerUrl: 'https://developer.ebay.com/create-account',
    loginUrl: 'https://www.ebay.com/signin/',
    docsSections: ['Browse API', 'Trading API', 'OAuth 授权流程'],
  },
  {
    id: 'temu-api', name: 'Temu', nameEn: 'Temu Open Platform', icon: '🛍️',
    description: 'Temu 半托管卖家 API，连接全球最大新兴电商平台',
    docsUrl: 'https://open.teees.cn/',
    category: 'ecommerce', color: '#FF6B35', bgColor: 'bg-orange-950/40', borderColor: 'border-orange-800/40',
    features: ['商品同步', '订单拉取', '库存更新', '物流对接', '半托管模式'],
    websiteUrl: 'https://www.temu.com/',
    developerUrl: 'https://seller.terms.4px.com/',
    loginUrl: 'https://seller.terms.4px.com/',
    docsSections: ['商家后台', 'API 接口文档', '半托管模式'],
  },
  {
    id: 'walmart-api', name: 'Walmart', nameEn: 'Walmart Open API', icon: '🏪',
    description: 'Walmart 全球卖家 API，覆盖美国/加拿大/墨西哥市场',
    docsUrl: 'https://developer.walmart.com/',
    category: 'ecommerce', color: '#0071DC', bgColor: 'bg-blue-950/40', borderColor: 'border-blue-800/40',
    features: ['商品管理', '订单同步', '价格调整', '库存监控', '广告投放'],
    websiteUrl: 'https://www.walmart.com/',
    developerUrl: 'https://developer.walmart.com/useps/',
    loginUrl: 'https://marketplace.walmart.com/',
    docsSections: ['US Proxy API', 'Content API', 'Orders API'],
  },
];

// 全球社媒/通讯平台数据
const SOCIAL_PLATFORMS: Platform[] = [
  {
    id: 'google-oauth', name: 'Google', nameEn: 'Google OAuth', icon: '🔍',
    description: 'Google 账号登录 · Gmail · Drive · Sheets · YouTube · Meet',
    docsUrl: 'https://developers.google.com/identity/protocols/oauth2',
    category: 'social', color: '#4285F4', bgColor: 'bg-blue-950/40', borderColor: 'border-blue-800/40',
    features: ['账号登录', 'Gmail API', 'Drive API', 'Sheets API', 'YouTube API'],
    websiteUrl: 'https://www.google.com/',
    developerUrl: 'https://console.cloud.google.com/apis/credentials',
    loginUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    docsSections: ['OAuth 2.0 Scopes', 'Client ID 创建', 'Access Token 获取'],
  },
  {
    id: 'facebook-oauth', name: 'Meta / Facebook', nameEn: 'Meta OAuth', icon: '📘',
    description: 'Facebook · Instagram Graph API · WhatsApp Business',
    docsUrl: 'https://developers.facebook.com/docs/facebook-login',
    category: 'social', color: '#1877F2', bgColor: 'bg-indigo-950/40', borderColor: 'border-indigo-800/40',
    features: ['账号登录', 'Instagram API', 'Pages API', 'WhatsApp API', '营销 API'],
    websiteUrl: 'https://www.facebook.com/',
    developerUrl: 'https://developers.facebook.com/apps/',
    loginUrl: 'https://www.facebook.com/login',
    docsSections: ['Facebook Login', 'Graph API', 'WhatsApp Business API'],
  },
  {
    id: 'twitter-oauth', name: 'X / Twitter', nameEn: 'X OAuth', icon: '🐦',
    description: 'X (Twitter) OAuth 2.0 · Posts · Users · Direct Messages',
    docsUrl: 'https://developer.twitter.com/en/docs/authentication/oauth2',
    category: 'social', color: '#000000', bgColor: 'bg-slate-900/60', borderColor: 'border-slate-700/40',
    features: ['账号登录', '发帖 API', '用户数据', 'DM 发送', '媒体上传'],
    websiteUrl: 'https://x.com/',
    developerUrl: 'https://developer.twitter.com/en/portal/dashboard',
    loginUrl: 'https://twitter.com/i/oauth2/authorize',
    docsSections: ['OAuth 2.0', 'API Keys', 'App Permissions'],
  },
  {
    id: 'linkedin-oauth', name: 'LinkedIn', nameEn: 'LinkedIn OAuth', icon: '💼',
    description: 'LinkedIn 账号登录 · Profile API · Company Pages · Messaging',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication',
    category: 'social', color: '#0A66C2', bgColor: 'bg-sky-950/40', borderColor: 'border-sky-800/40',
    features: ['账号登录', 'Profile API', '公司主页', '内容发布', '人脉数据'],
    websiteUrl: 'https://www.linkedin.com/',
    developerUrl: 'https://www.linkedin.com/developers/apps',
    loginUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    docsSections: ['OAuth 2.0', 'Member Auth', 'Organization API'],
  },
  {
    id: 'discord-oauth', name: 'Discord', nameEn: 'Discord OAuth', icon: '🎮',
    description: 'Discord OAuth · 服务器/频道管理 · Webhook · Bot API',
    docsUrl: 'https://discord.com/developers/docs/topics/oauth2',
    category: 'social', color: '#5865F2', bgColor: 'bg-violet-950/40', borderColor: 'border-violet-800/40',
    features: ['账号登录', '服务器管理', '频道消息', 'Webhook', 'Bot 开发'],
    websiteUrl: 'https://discord.com/',
    developerUrl: 'https://discord.com/developers/applications',
    loginUrl: 'https://discord.com/oauth2/authorize',
    docsSections: ['OAuth2 Scopes', 'Bot Token', 'Gateway API'],
  },
  {
    id: 'tiktok-oauth', name: 'TikTok', nameEn: 'TikTok OAuth', icon: '🎵',
    description: 'TikTok 账号登录 · 用户数据 · 视频上传 · 内容分析',
    docsUrl: 'https://developers.tiktok.com/doc/login-kit-web',
    category: 'social', color: '#000000', bgColor: 'bg-pink-950/40', borderColor: 'border-pink-800/40',
    features: ['账号登录', '用户数据', '视频上传', '内容分析', '广告 API'],
    websiteUrl: 'https://www.tiktok.com/',
    developerUrl: 'https://developers.tiktok.com/',
    loginUrl: 'https://www.tiktok.com/auth/authorize/',
    docsSections: ['Login Kit', 'Content Posting API', 'Analytics API'],
  },
  {
    id: 'youtube-oauth', name: 'YouTube', nameEn: 'YouTube OAuth', icon: '▶️',
    description: 'YouTube Data API v3 · 视频上传 · 频道管理 · Analytics',
    docsUrl: 'https://developers.google.com/youtube/v3',
    category: 'social', color: '#FF0000', bgColor: 'bg-red-950/40', borderColor: 'border-red-800/40',
    features: ['账号登录', '视频上传', '频道管理', '订阅数据', 'Analytics'],
    websiteUrl: 'https://www.youtube.com/',
    developerUrl: 'https://console.cloud.google.com/apis/library/youtube.googleapis.com',
    loginUrl: 'https://developers.google.com/oauthplayground/',
    docsSections: ['Data API v3', 'Videos Insert', 'Subscriptions'],
  },
  {
    id: 'pinterest-oauth', name: 'Pinterest', nameEn: 'Pinterest OAuth', icon: '📌',
    description: 'Pinterest 账号登录 · Pins · Boards · User Profile',
    docsUrl: 'https://developers.pinterest.com/docs/getting-started/authentication',
    category: 'social', color: '#E60023', bgColor: 'bg-rose-950/40', borderColor: 'border-rose-800/40',
    features: ['账号登录', 'Pins API', 'Boards API', '用户数据', '广告 API'],
    websiteUrl: 'https://www.pinterest.com/',
    developerUrl: 'https://developers.pinterest.com/apps/',
    loginUrl: 'https://www.pinterest.com/oauth/',
    docsSections: ['OAuth 2.0', 'Pins API', 'User API'],
  },
  {
    id: 'snapchat-oauth', name: 'Snapchat', nameEn: 'Snapchat OAuth', icon: '👻',
    description: 'Snapchat Creative API · Ads API · Story API',
    docsUrl: 'https://developers.snap.com/docs/login-kit',
    category: 'social', color: '#FFFC00', bgColor: 'bg-yellow-950/40', borderColor: 'border-yellow-800/40',
    features: ['账号登录', 'Creative API', '广告 API', 'Story API', '数据分析'],
    websiteUrl: 'https://www.snapchat.com/',
    developerUrl: 'https://developers.snap.com/',
    loginUrl: 'https://accounts.snapchat.com/accounts/login',
    docsSections: ['Login Kit', 'Creative API', 'Ads API'],
  },
  {
    id: 'reddit-oauth', name: 'Reddit', nameEn: 'Reddit OAuth', icon: '🤖',
    description: 'Reddit API · Posts · Subreddits · 自动化发帖/评论',
    docsUrl: 'https://www.reddit.com/dev/api',
    category: 'social', color: '#FF4500', bgColor: 'bg-orange-950/40', borderColor: 'border-orange-800/40',
    features: ['账号登录', 'Posts API', 'Subreddits', '评论管理', '自动化'],
    websiteUrl: 'https://www.reddit.com/',
    developerUrl: 'https://www.reddit.com/prefs/apps',
    loginUrl: 'https://www.reddit.com/api/v1/authorize',
    docsSections: ['OAuth2', 'Reddit API', 'Script-Type Apps'],
  },
  {
    id: 'line-oauth', name: 'LINE', nameEn: 'LINE OAuth', icon: '📱',
    description: 'LINE 账号登录 · Messaging API · LIFF · 官方账号',
    docsUrl: 'https://developers.line.biz/en/docs/line-login',
    category: 'social', color: '#00B900', bgColor: 'bg-green-950/40', borderColor: 'border-green-800/40',
    features: ['账号登录', '消息推送', 'LIFF 应用', 'Rich Menu', 'OA 管理'],
    websiteUrl: 'https://line.me/',
    developerUrl: 'https://developers.line.biz/console/',
    loginUrl: 'https://developers.line.biz/en/docs/line-login/',
    docsSections: ['LINE Login', 'Messaging API', 'LIFF SDK'],
  },
  {
    id: 'whatsapp-oauth', name: 'WhatsApp', nameEn: 'WhatsApp Business', icon: '💬',
    description: 'WhatsApp Business API · 消息发送 · 模板管理',
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
    category: 'social', color: '#25D366', bgColor: 'bg-emerald-950/40', borderColor: 'border-emerald-800/40',
    features: ['消息发送', '模板管理', '客户互动', '多账号', 'webhook 接收'],
    websiteUrl: 'https://www.whatsapp.com/',
    developerUrl: 'https://business.facebook.com/apps/',
    loginUrl: 'https://business.facebook.com/',
    docsSections: ['WhatsApp Business API', 'Message Templates', 'Webhooks'],
  },
  {
    id: 'telegram-oauth', name: 'Telegram', nameEn: 'Telegram Bot API', icon: '✈️',
    description: 'Telegram Bot API · 消息推送 · 频道管理 · 游戏/小程序',
    docsUrl: 'https://core.telegram.org/bots/api',
    category: 'social', color: '#0088CC', bgColor: 'bg-cyan-950/40', borderColor: 'border-cyan-800/40',
    features: ['Bot 开发', '消息推送', '频道管理', '游戏开发', '支付集成'],
    websiteUrl: 'https://telegram.org/',
    developerUrl: 'https://t.me/BotFather',
    loginUrl: 'https://t.me/BotFather',
    docsSections: ['Bot API', 'BotFather 使用', 'Telegram Payments'],
  },
  {
    id: 'slack-oauth', name: 'Slack', nameEn: 'Slack OAuth', icon: '💬',
    description: 'Slack OAuth · 消息推送 · 频道管理 · Workflow Builder',
    docsUrl: 'https://api.slack.com/docs/oauth',
    category: 'social', color: '#4A154B', bgColor: 'bg-purple-950/40', borderColor: 'border-purple-800/40',
    features: ['账号登录', '消息推送', '频道管理', 'Workflow', 'Bolt 框架'],
    websiteUrl: 'https://slack.com/',
    developerUrl: 'https://api.slack.com/apps',
    loginUrl: 'https://slack.com/oauth/v2/authorize',
    docsSections: ['OAuth & Permissions', 'Scim API', 'Bolt Framework'],
  },
  {
    id: 'instagram-oauth', name: 'Instagram', nameEn: 'Instagram Graph API', icon: '📸',
    description: 'Instagram Graph API · 内容发布 · Stories · Insights',
    docsUrl: 'https://developers.facebook.com/docs/instagram-api',
    category: 'social', color: '#E1306C', bgColor: 'bg-pink-950/40', borderColor: 'border-pink-800/40',
    features: ['内容发布', 'Stories API', 'Insights', '评论管理', 'DM 自动回复'],
    websiteUrl: 'https://www.instagram.com/',
    developerUrl: 'https://developers.facebook.com/apps/',
    loginUrl: 'https://graph.facebook.com/vXX.0/dialog/oauth',
    docsSections: ['Instagram Graph API', 'Content Publishing API', 'Insights API'],
  },
  {
    id: 'zalo-oauth', name: 'Zalo', nameEn: 'Zalo SDK', icon: '🇻🇳',
    description: 'Zalo Vietnam · 越南最大社媒 · OA API · Mini App',
    docsUrl: 'https://developers.zalo.me/docs/',
    category: 'social', color: '#0068FF', bgColor: 'bg-blue-950/40', borderColor: 'border-blue-800/40',
    features: ['账号登录', '消息推送', 'Zalo OA', 'Mini App', '支付集成'],
    websiteUrl: 'https://zalo.me/',
    developerUrl: 'https://developers.zalo.me/',
    loginUrl: 'https://developers.zalo.me/',
    docsSections: ['Zalo SDK', 'Official Account API', 'Mini App'],
  },
  {
    id: 'kakao-oauth', name: 'Kakao', nameEn: 'Kakao Developers', icon: '🇰🇷',
    description: 'Kakao 韩国 · Login · Talk API · Kakao Pay',
    docsUrl: 'https://developers.kakao.com/',
    category: 'social', color: '#FFE812', bgColor: 'bg-yellow-950/40', borderColor: 'border-yellow-800/40',
    features: ['账号登录', 'Talk 消息', 'Kakao Pay', 'Kakao Map', 'Kakao Story'],
    websiteUrl: 'https://www.kakaocorp.com/',
    developerUrl: 'https://developers.kakao.com/',
    loginUrl: 'https://kauth.kakao.com/oauth/authorize',
    docsSections: ['Kakao Login', 'Talk Message API', 'Kakao Pay'],
  },
  {
    id: 'wechat-oauth', name: 'WeChat', nameEn: 'WeChat Open Platform', icon: '🇨🇳',
    description: '微信开放平台 · 公众号 · 小程序 · 企业微信',
    docsUrl: 'https://developers.weixin.qq.com/doc/',
    category: 'social', color: '#07C160', bgColor: 'bg-green-950/40', borderColor: 'border-green-800/40',
    features: ['公众号 API', '网页授权', '小程序', '企业微信', '微信支付'],
    websiteUrl: 'https://www.wechat.com/',
    developerUrl: 'https://mp.weixin.qq.com/',
    loginUrl: 'https://mp.weixin.qq.com/',
    docsSections: ['微信公众平台', '网页授权流程', '客服消息'],
  },
  {
    id: 'douyin-oauth', name: '抖音 / Douyin', nameEn: 'Douyin Open Platform', icon: '🎬',
    description: '抖音开放平台 · 内容发布 · 直播 · 抖音小程序',
    docsUrl: 'https://open.douyin.com/',
    category: 'social', color: '#010101', bgColor: 'bg-slate-900/60', borderColor: 'border-slate-700/40',
    features: ['视频上传', '评论管理', '粉丝数据', '直播 API', '小程序'],
    websiteUrl: 'https://www.douyin.com/',
    developerUrl: 'https://open.douyin.com/platform',
    loginUrl: 'https://open.douyin.com/',
    docsSections: ['内容发布 API', '用户数据 API', '直播推流'],
  },
  {
    id: 'xiaohongshu-oauth', name: '小红书', nameEn: 'XHS Open Platform', icon: '📕',
    description: '小红书开放平台 · 笔记发布 · 品牌合作 · KOL 数据',
    docsUrl: 'https://developers.xiaohongshu.com/',
    category: 'social', color: '#FE2C55', bgColor: 'bg-red-950/40', borderColor: 'border-red-800/40',
    features: ['笔记发布', '评论管理', '粉丝数据', '品牌合作', '数据报表'],
    websiteUrl: 'https://www.xiaohongshu.com/',
    developerUrl: 'https://developers.xiaohongshu.com/',
    loginUrl: 'https://www.xiaohongshu.com/explore',
    docsSections: ['API 接入指南', '内容发布', '数据分析'],
  },
  {
    id: 'rexwit', name: 'Rexwit', nameEn: 'Rexwit AI Image & 3D', icon: '🔥',
    description: '本地免费 AI 图片 & 3D 生成软件 · 隐私安全 · 无积分焦虑 · 支持 Qwen/Flux/Hunyuan 3D/Nano Banana Pro',
    docsUrl: 'https://rexwit.com/doc/1.0.0/rexwit/function.html',
    category: 'social', color: '#FF6B35', bgColor: 'bg-orange-950/40', borderColor: 'border-orange-800/40',
    features: ['本地部署·数据不上传', 'Qwen / Flux / Hunyuan 3D 模型', 'Nano Banana Pro', '无限生成·无隐私担忧', '适用：游戏/电商/影视/产品/建筑/设计'],
    websiteUrl: 'https://www.rexwit.com/',
    developerUrl: 'https://www.rexwit.com/',
    loginUrl: 'https://www.rexwit.com/',
    docsSections: ['功能文档', '安装指南', '模型使用', 'Banana消费点说明'],
  },
];

const ALL_PLATFORMS = [...ECOMMERCE_PLATFORMS, ...SOCIAL_PLATFORMS];

// 平台详情弹窗（包含直接链接入口）
function PlatformModal({ platform, onClose }: { platform: Platform; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'docs'>('overview');

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/50 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className={`${platform.bgColor} border-b ${platform.borderColor} p-5`}>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold"
              style={{ backgroundColor: platform.color + '20', color: platform.color }}
            >
              {platform.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{platform.name}</h2>
              <p className="text-xs opacity-60">{platform.nameEn}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-auto text-slate-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-300 opacity-80">{platform.description}</p>

          {/* 快速操作按钮 */}
          <div className="flex gap-2 mt-4">
            {platform.websiteUrl && (
              <a
                href={platform.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-blue-600/80 hover:bg-blue-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors px-3"
              >
                🌐 官方网站
              </a>
            )}
            {platform.loginUrl && (
              <a
                href={platform.loginUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors flex-1"
              >
                🔑 登录 / 授权
              </a>
            )}
            {platform.developerUrl && (
              <a
                href={platform.developerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors px-3"
              >
                🛠️ 开发者控制台
              </a>
            )}
          </div>
        </div>

        {/* Tab 导航 */}
        <div className="flex border-b border-slate-700/50">
          {(['overview', 'setup', 'docs'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'text-white border-b-2 border-cyan-400 bg-slate-800/50'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab === 'overview' ? '功能概览' : tab === 'setup' ? '接入配置' : '官方文档'}
            </button>
          ))}
        </div>

        {/* 内容 */}
        <div className="overflow-y-auto flex-1 p-5">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">支持的 API 功能</h3>
                <div className="grid grid-cols-2 gap-2">
                  {platform.features.map(f => (
                    <div key={f} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                      <span className="text-emerald-400 text-xs">✓</span>
                      <span className="text-sm text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              {platform.docsSections && platform.docsSections.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-2">关键文档章节</h3>
                  <div className="flex flex-wrap gap-2">
                    {platform.docsSections.map(s => (
                      <span key={s} className="text-xs bg-slate-800/70 text-cyan-400 border border-slate-700/50 px-2.5 py-1 rounded-full">
                        📄 {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-cyan-950/30 border border-cyan-800/30 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-cyan-300 mb-1">💡 接入说明</h4>
                <p className="text-xs text-slate-400">
                  {platform.category === 'ecommerce'
                    ? '前往「设置 → MCP 连接器」找到对应平台，填写 API 凭证完成接入。'
                    : 'OAuth 应用需在对应开发者平台注册，获取 Client ID/Secret 后配置 Redirect URI。'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="space-y-4">
              {/* 快速链接 */}
              <div className="grid grid-cols-3 gap-2">
                {platform.websiteUrl && (
                  <a
                    href={platform.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl py-3 text-sm transition-colors"
                  >
                    🌐 官方网站
                  </a>
                )}
                {platform.loginUrl && (
                  <a
                    href={platform.loginUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 rounded-xl py-3 text-sm transition-colors"
                  >
                    🔑 {platform.name} 登录页
                  </a>
                )}
                {platform.developerUrl && (
                  <a
                    href={platform.developerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl py-3 text-sm transition-colors"
                  >
                    🛠️ 开发者控制台
                  </a>
                )}
              </div>

              {/* 凭证表单 */}
              <div className="bg-slate-800/50 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-200">需要的凭证</h4>
                <div className="space-y-2">
                  {(platform.category === 'ecommerce'
                    ? ['Client ID / API Key', 'Client Secret', 'Store URL / Shop URL']
                    : ['Client ID', 'Client Secret', 'Redirect URI']
                  ).map(field => (
                    <div key={field}>
                      <label className="text-xs text-slate-400 mb-1 block">{field}</label>
                      <input
                        type="text"
                        placeholder={`输入 ${field}...`}
                        className="w-full bg-slate-700/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
              <button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg py-2.5 text-sm font-medium transition-colors">
                💾 保存配置
              </button>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-4">
              {/* 快速链接 */}
              <div className="grid grid-cols-2 gap-2">
                {platform.docsUrl && (
                  <a
                    href={platform.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 rounded-xl py-3 text-sm transition-colors"
                  >
                    📖 API 文档主页
                  </a>
                )}
                {platform.developerUrl && (
                  <a
                    href={platform.developerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl py-3 text-sm transition-colors"
                  >
                    🛠️ 开发者控制台
                  </a>
                )}
              </div>
              {/* 文档章节 */}
              {platform.docsSections && platform.docsSections.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-slate-200 mb-3">推荐阅读章节</h4>
                  <div className="space-y-2">
                    {platform.docsSections.map(s => (
                      <a
                        key={s}
                        href={platform.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        📄 {s}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 平台卡片（含直接链接按钮）
function PlatformCard({ platform, onClick }: { platform: Platform; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${platform.bgColor} border ${platform.borderColor} rounded-xl p-4 text-left hover:scale-[1.02] transition-transform group`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: platform.color + '20' }}
        >
          {platform.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">{platform.name}</h4>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{platform.description}</p>
        </div>
        <span className="text-slate-600 group-hover:text-cyan-400 text-lg flex-shrink-0">→</span>
      </div>
      <div className="flex flex-wrap gap-1 mt-3">
        {platform.features.slice(0, 3).map(f => (
          <span key={f} className="text-xs bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded-full">
            {f}
          </span>
        ))}
        {platform.features.length > 3 && (
          <span className="text-xs text-slate-500 px-1">+{platform.features.length - 3}</span>
        )}
      </div>
      {/* 直接链接入口 */}
      <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-700/30">
        {platform.websiteUrl && (
          <a
            href={platform.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 bg-slate-800/70 hover:bg-blue-600/20 border border-slate-700/50 hover:border-blue-500/40 rounded-lg py-1.5 text-xs text-slate-300 hover:text-blue-300 transition-colors px-2"
          >
            🌐 <span>官网</span>
          </a>
        )}
        {platform.loginUrl && (
          <a
            href={platform.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 bg-slate-800/70 hover:bg-cyan-600/20 border border-slate-700/50 hover:border-cyan-500/40 rounded-lg py-1.5 text-xs text-slate-300 hover:text-cyan-300 transition-colors flex-1"
          >
            🔑 <span>登录/授权</span>
          </a>
        )}
        {platform.developerUrl && (
          <a
            href={platform.developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 bg-slate-800/70 hover:bg-emerald-600/20 border border-slate-700/50 hover:border-emerald-500/40 rounded-lg py-1.5 text-xs text-slate-300 hover:text-emerald-300 transition-colors px-2"
          >
            🛠️ <span>开发者</span>
          </a>
        )}
      </div>
    </button>
  );
}

// 主组件
export function GlobalLoginPanel() {
  const [activeType, setActiveType] = useState<'ecommerce' | 'social'>('social');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Platform | null>(null);

  const platforms = activeType === 'ecommerce' ? ECOMMERCE_PLATFORMS : SOCIAL_PLATFORMS;
  const filtered = platforms.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nameEn.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* 头部 */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          🌍 全球登录聚合
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          整合全球 <span className="text-cyan-400 font-semibold">{ALL_PLATFORMS.length}</span> 个平台：电商 {ECOMMERCE_PLATFORMS.length} 个 · 社媒/通讯 {SOCIAL_PLATFORMS.length - 1} 个 · 生图/3D 1 个
        </p>
      </div>

      {/* 搜索 + 切换 */}
      <div className="flex gap-3 items-center">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索平台..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-500/60 focus:outline-none"
          />
        </div>
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/40">
          <button
            onClick={() => setActiveType('social')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeType === 'social' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 社媒/通讯
          </button>
          <button
            onClick={() => setActiveType('ecommerce')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeType === 'ecommerce' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            🛒 全球电商
          </button>
        </div>
      </div>

      {/* 平台网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            onClick={() => setSelected(platform)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-10 text-slate-500 text-sm">
            未找到匹配的平台
          </div>
        )}
      </div>

      {/* 底部统计 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{SOCIAL_PLATFORMS.length}</div>
          <div className="text-xs text-slate-400">社媒/通讯平台</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-white">{ECOMMERCE_PLATFORMS.length}</div>
          <div className="text-xs text-slate-400">全球电商平台</div>
        </div>
        <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-cyan-400">{ALL_PLATFORMS.length}</div>
          <div className="text-xs text-slate-400">已收录平台</div>
        </div>
      </div>

      {/* 平台详情弹窗 */}
      {selected && (
        <PlatformModal platform={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
