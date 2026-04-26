/**
 * MCP 连接器管理 & AI 大模型市场服务
 */
import { v4 as uuid } from 'uuid';
import type {
  MCPServer, MCPServerTemplate, MCPServerCategory,
  AIModel, ModelProvider, ModelCapability
} from '../types/mcp';

// ── 内存存储（生产环境建议迁移到数据库） ──────────────────────────
interface MCPStore {
  servers: Map<string, MCPServer>;
  models: Map<string, AIModel>;
}

const store: MCPStore = { servers: new Map(), models: new Map() };

// ══════════════════════════════════════════════════════════════
// 预置 MCP 服务器模板
// ══════════════════════════════════════════════════════════════
const MCP_TEMPLATES: MCPServerTemplate[] = [
  {
    id: 'supabase',
    name: 'Supabase',
    description: 'PostgreSQL 数据库、Auth、Storage、Serverless Functions',
    category: 'database',
    icon: '🐘',
    fields: [
      { key: 'projectId', label: 'Project ID', type: 'text', required: true, placeholder: 'your-project-id' },
      { key: 'apiKey', label: 'API Key (anon/public)', type: 'password', required: true, placeholder: 'eyJ...' },
      { key: 'serviceKey', label: 'Service Role Key', type: 'password', required: false, helpText: '仅管理操作需要' },
    ],
    docsUrl: 'https://supabase.com/docs',
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: '支付处理、订阅管理、发票开具',
    category: 'payment',
    icon: '💳',
    fields: [
      { key: 'apiKey', label: 'Secret Key', type: 'password', required: true, placeholder: 'sk_test_...' },
      { key: 'webhookSecret', label: 'Webhook Secret', type: 'password', required: false },
    ],
    docsUrl: 'https://stripe.com/docs',
  },
  {
    id: 'github',
    name: 'GitHub',
    description: '代码仓库、PR、Issue、Actions CI/CD',
    category: 'devtools',
    icon: '🐙',
    fields: [
      { key: 'token', label: 'Personal Access Token', type: 'password', required: true, placeholder: 'ghp_...' },
      { key: 'repoOwner', label: '仓库所有者', type: 'text', required: false },
      { key: 'repoName', label: '仓库名称', type: 'text', required: false },
    ],
    docsUrl: 'https://docs.github.com/rest',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: '消息推送、频道管理、机器人交互',
    category: 'communication',
    icon: '💬',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: 'xoxb-...' },
      { key: 'defaultChannel', label: '默认频道 ID', type: 'text', required: false, placeholder: 'C012AB3CD' },
    ],
    docsUrl: 'https://api.slack.com/',
  },
  {
    id: 'notion',
    name: 'Notion',
    description: '文档、数据库、知识库集成',
    category: 'storage',
    icon: '📄',
    fields: [
      { key: 'token', label: 'Internal Integration Token', type: 'password', required: true, placeholder: 'secret_...' },
      { key: 'databaseId', label: '数据库 ID', type: 'text', required: false },
    ],
    docsUrl: 'https://developers.notion.com/',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: '邮件发送、模板管理、退订处理',
    category: 'communication',
    icon: '📧',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'SG....' },
      { key: 'fromEmail', label: '发件邮箱', type: 'text', required: true, placeholder: 'noreply@example.com' },
    ],
    docsUrl: 'https://docs.sendgrid.com/',
  },
  {
    id: 'n8n',
    name: 'n8n 工作流',
    description: '自动化工作流、跨平台编排、API 串联',
    category: 'workflow',
    icon: '🔗',
    fields: [
      { key: 'endpoint', label: 'n8n Webhook URL', type: 'url', required: true, placeholder: 'https://your-n8n.com/webhook/...' },
      { key: 'authToken', label: '认证 Token', type: 'password', required: false },
    ],
    docsUrl: 'https://docs.n8n.io/',
  },
  {
    id: 'aws-s3',
    name: 'AWS S3',
    description: '对象存储、文件管理、CDN 加速',
    category: 'storage',
    icon: '🪣',
    fields: [
      { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
      { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
      { key: 'region', label: '区域', type: 'select', required: true, options: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'ap-northeast-1'] },
      { key: 'bucket', label: 'Bucket 名称', type: 'text', required: true },
    ],
    docsUrl: 'https://docs.aws.amazon.com/s3/',
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: '前端部署、Serverless Functions、CDN',
    category: 'devtools',
    icon: '▲',
    fields: [
      { key: 'token', label: 'API Token', type: 'password', required: true, placeholder: 'XXXX...' },
      { key: 'teamId', label: 'Team ID', type: 'text', required: false },
    ],
    docsUrl: 'https://vercel.com/docs',
  },
  {
    id: 'telegram',
    name: 'Telegram Bot',
    description: '机器人消息、频道推送、群组管理',
    category: 'communication',
    icon: '✈️',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: '123456:ABC-...' },
      { key: 'chatId', label: '默认 Chat ID', type: 'text', required: false },
    ],
    docsUrl: 'https://core.telegram.org/bots/api',
  },
  {
    id: '微信云开发',
    name: '微信云开发',
    description: '微信小程序云函数、数据库、存储',
    category: 'ai',
    icon: '💬',
    fields: [
      { key: 'envId', label: '环境 ID', type: 'text', required: true, placeholder: 'cloud-xxxxx' },
      { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    ],
    docsUrl: 'https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/understanding.html',
  },
// ── OpenSpace 自进化智能体社区 ────────────────────────────────
  {
    id: 'openspace',
    name: 'OpenSpace (HKUDS)',
    description: 'HKUDS 自进化 AI Agent 引擎 · 技能云端共享 · 自进化 · Token 节省 46%',
    category: 'ai',
    icon: '🧬',
    fields: [
      { key: 'workspace', label: 'OpenSpace 工作目录', type: 'text', required: false, placeholder: '/path/to/OpenSpace', helpText: '本地 OpenSpace 仓库路径，留空自动查找' },
      { key: 'apiKey', label: 'OpenSpace API Key (可选)', type: 'password', required: false, helpText: '云端社区认证用，可从 open-space.cloud 获取' },
      { key: 'model', label: '骨干 LLM 模型', type: 'text', required: false, placeholder: 'anthropic/claude-sonnet-4-5', helpText: '用于技能分析的自定义 LLM' },
      { key: 'hostSkillDir', label: '代理 Skills 目录', type: 'text', required: false, placeholder: '/path/to/agent/skills', helpText: '接收共享技能的目录路径' },
    ],
    docsUrl: 'https://github.com/HKUDS/OpenSpace',
  },
  {
    id: 'heygen',
    name: 'HeyGen (Video + LiveAvatar)',
    description: 'HeyGen 视频生成 · LiveAvatar 实时数字人 WebRTC · AI 数字人 · 175+ 语言',
    category: 'ai',
    icon: '🎬',
    fields: [
      { key: 'apiKey', label: 'HeyGen API Key', type: 'password', required: true, placeholder: 'sk-...', helpText: '从 developers.heygen.com 获取（用于视频生成）' },
      { key: 'liveavatarApiKey', label: 'LiveAvatar API Key (可选)', type: 'password', required: false, placeholder: 'ccb84e37-...', helpText: '从 app.liveavatar.com/developers 获取（用于实时数字人，费用: 1-2积分/分钟）' },
      { key: 'defaultAvatar', label: '默认数字人 ID (可选)', type: 'text', required: false, placeholder: 'default / avatar-xxx' },
      { key: 'defaultVoice', label: '默认语音 ID (可选)', type: 'text', required: false, placeholder: 'voice-xxx' },
    ],
    docsUrl: 'https://developers.heygen.com/',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'DNS 管理、CDN、WAF、D1 数据库、Workers AI',
    category: 'storage',
    icon: '☁️',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password', required: true, placeholder: 'XXXX...' },
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
    ],
    docsUrl: 'https://developers.cloudflare.com/',
  },
// ══════════════════════════════════════════════════════════════
// AI 建站 / Vibe Coding 平台
// ══════════════════════════════════════════════════════════════
  {
    id: 'lovable',
    name: 'Lovable.dev',
    description: 'AI 建站 · 自然语言生成全栈应用 · 与 Supabase 深度集成 · 支持 Next.js/React',
    category: 'devtools',
    icon: '🛠️',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'lov-...', helpText: '从 docs.lovable.dev/integrations/lovable-api 获取' },
      { key: 'defaultProject', label: '默认项目 ID (可选)', type: 'text', required: false, placeholder: 'project-xxx' },
    ],
    docsUrl: 'https://docs.lovable.dev/integrations/lovable-api',
  },
  {
    id: 'base44',
    name: 'Base44',
    description: 'AI 应用构建平台 · MCP 服务器 · 自定义 OpenAPI 集成 · OAuth 连接器',
    category: 'ai',
    icon: '🔵',
    fields: [
      { key: 'workspaceUrl', label: '工作区 URL', type: 'url', required: true, placeholder: 'https://app.base44.com/workspace/xxx' },
      { key: 'apiKey', label: 'API Key (可选)', type: 'password', required: false, placeholder: 'base44-...' },
    ],
    mcpServers: [
      { name: 'base44', url: 'https://app.base44.com/mcp', description: '项目管理 · 数据查询 · AI 助手创建', auth: 'oauth' },
      { name: 'base44-docs', url: 'https://docs.base44.com/mcp', description: '文档搜索 · 无需认证', auth: 'none' },
    ],
    docsUrl: 'https://docs.base44.com/',
  },
  {
    id: 'google-ai-studio',
    name: 'Google AI Studio',
    description: 'Gemini API · AI Studio · 200万上下文 · 多模态（文本/图像/视频/音频）· Imagen 生图 · Veo 生视频',
    category: 'ai',
    icon: '🌐',
    fields: [
      { key: 'apiKey', label: 'Gemini API Key', type: 'password', required: true, placeholder: 'AIza...', helpText: '从 ai.google.dev/aistudio 获取' },
      { key: 'defaultModel', label: '默认模型', type: 'select', required: false, options: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'], placeholder: 'gemini-2.5-flash' },
    ],
    docsUrl: 'https://ai.google.dev/',
  },
// ══════════════════════════════════════════════════════════════
// 全球电商平台
// ══════════════════════════════════════════════════════════════
  {
    id: 'shopify',
    name: 'Shopify',
    description: '全球电商 SaaS 平台 · 商品/订单/客户管理 · 主题定制 · 多渠道销售',
    category: 'ecommerce',
    icon: '🛒',
    fields: [
      { key: 'shopUrl', label: '商店域名', type: 'text', required: true, placeholder: 'your-store.myshopify.com' },
      { key: 'apiKey', label: 'API Key (Client ID)', type: 'password', required: true, placeholder: 'shpat_...' },
      { key: 'apiSecret', label: 'API Secret (Client Secret)', type: 'password', required: true, placeholder: 'shpss_...' },
      { key: 'accessToken', label: 'Access Token (私有 App)', type: 'password', required: false, placeholder: 'shpat_...' },
    ],
    docsUrl: 'https://shopify.dev/docs/admin-api',
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'WordPress 电商插件 · REST API · 商品/订单/客户 · 全球适用',
    category: 'ecommerce',
    icon: '🧱',
    fields: [
      { key: 'storeUrl', label: '商店 URL', type: 'url', required: true, placeholder: 'https://yoursite.com/wp-json/wc/v3' },
      { key: 'consumerKey', label: 'Consumer Key', type: 'password', required: true, placeholder: 'ck_...' },
      { key: 'consumerSecret', label: 'Consumer Secret', type: 'password', required: true, placeholder: 'cs_...' },
    ],
    docsUrl: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
  },
  {
    id: 'amazon-seller',
    name: 'Amazon Seller API',
    description: '亚马逊卖家 API · SP-API · 商品/订单/库存/FBA · 北美/欧洲/日本站',
    category: 'ecommerce',
    icon: '📦',
    fields: [
      { key: 'clientId', label: 'LWA Client ID (SP-API)', type: 'password', required: true, placeholder: 'amzn1.application-...' },
      { key: 'clientSecret', label: 'LWA Client Secret', type: 'password', required: true, placeholder: 'amzn1.oa2-client....' },
      { key: 'marketplace', label: '市场区域', type: 'select', required: true, options: ['NorthAmerica', 'Europe', 'Japan', 'Australia'] },
      { key: 'refreshToken', label: 'Refresh Token (LWA)', type: 'password', required: true, placeholder: 'Atzr|...' },
    ],
    docsUrl: 'https://developer-docs.amazon.com/sp-api/',
  },
  {
    id: 'ebay-api',
    name: 'eBay API',
    description: 'eBay 开发者平台 · Trading API / Browse API · 商品上架/订单/物流',
    category: 'ecommerce',
    icon: '🏷️',
    fields: [
      { key: 'appId', label: 'App ID (Client ID)', type: 'text', required: true, placeholder: 'YourAppID' },
      { key: 'certId', label: 'Cert ID (Client Secret)', type: 'password', required: true, placeholder: 'YourCertID' },
      { key: 'devId', label: 'Dev ID', type: 'text', required: true, placeholder: 'YourDevID' },
      { key: 'sandbox', label: '使用沙盒环境', type: 'select', required: false, options: ['production', 'sandbox'] },
    ],
    docsUrl: 'https://developer.ebay.com/develop/apis',
  },
  {
    id: 'temu-api',
    name: 'Temu API',
    description: 'Temu 半托管卖家 API · 商品管理 · 订单同步 · 库存更新',
    category: 'ecommerce',
    icon: '🛍️',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'temu_client_xxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'temu_secret_xxx' },
      { key: 'region', label: '目标市场', type: 'select', required: false, options: ['US', 'EU', 'UK', 'AU'] },
    ],
    docsUrl: 'https://open.teees.cn/',
  },
// ══════════════════════════════════════════════════════════════
// simiaiclaw 龙虾集群多智能体编排平台
// ══════════════════════════════════════════════════════════════
  {
    id: 'openswarm',
    name: 'OpenSwarm',
    description: '多智能体并行编排 · 无限画布空间 · MCP 工具集成（Gmail/Calendar/Drive）· 人类决策审批',
    category: 'ai',
    icon: '🐝',
    fields: [
      { key: 'apiKey', label: 'Anthropic API Key', type: 'password', required: true, placeholder: 'sk-ant-...', helpText: '用于驱动 OpenSwarm AI 代理的 Anthropic API Key（从 console.anthropic.com 获取）' },
      { key: 'workspacePath', label: '本地工作目录 (可选)', type: 'text', required: false, placeholder: '/path/to/openswarm-workspace', helpText: 'OpenSwarm 本地数据目录，默认 ~/.openswarm' },
      { key: 'model', label: '骨干模型', type: 'select', required: false, options: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5', 'gpt-4o', 'gemini-2.5-pro'], helpText: 'OpenSwarm 代理使用的 LLM 模型' },
      { key: 'googleClientId', label: 'Google OAuth Client ID (可选)', type: 'password', required: false, placeholder: 'xxx.apps.googleusercontent.com', helpText: '启用 Gmail/Calendar/Drive MCP 工具需要' },
    ],
    mcpServers: [
      { name: 'openswarm-gmail', url: 'gmail-mcp', description: 'Gmail 邮件读写 · 日历管理', auth: 'oauth' },
      { name: 'openswarm-calendar', url: 'calendar-mcp', description: 'Google Calendar 事件管理', auth: 'oauth' },
      { name: 'openswarm-drive', url: 'drive-mcp', description: 'Google Drive 文件操作', auth: 'oauth' },
      { name: 'openswarm-reddit', url: 'reddit-mcp', description: 'Reddit 内容抓取与发帖', auth: 'apikey' },
    ],
    docsUrl: 'https://docs.openswarm.com',
  },
// ══════════════════════════════════════════════════════════════
// 全球社媒 & 通讯平台 OAuth
// ══════════════════════════════════════════════════════════════
  {
    id: 'google-oauth',
    name: 'Google OAuth',
    description: 'Google 账号登录 · Gmail · Drive · Sheets · Meet · YouTube Data API',
    category: 'social',
    icon: '🔍',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true, placeholder: 'xxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true, placeholder: 'GOCSPX-...' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/google/callback' },
    ],
    docsUrl: 'https://developers.google.com/identity/protocols/oauth2',
  },
  {
    id: 'facebook-oauth',
    name: 'Facebook / Meta OAuth',
    description: 'Meta 账号登录 · Instagram Graph API · Facebook Pages · WhatsApp Business API',
    category: 'social',
    icon: '📘',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text', required: true, placeholder: '123456789' },
      { key: 'appSecret', label: 'App Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/facebook/callback' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/facebook-login',
  },
  {
    id: 'twitter-oauth',
    name: 'X / Twitter OAuth',
    description: 'X (Twitter) 账号登录 · OAuth 2.0 · Posts · Users · Direct Messages API',
    category: 'social',
    icon: '🐦',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'bearerToken', label: 'Bearer Token (可选)', type: 'password', required: false, placeholder: 'AAAA...' },
    ],
    docsUrl: 'https://developer.twitter.com/en/docs/authentication/oauth2',
  },
  {
    id: 'linkedin-oauth',
    name: 'LinkedIn OAuth',
    description: 'LinkedIn 账号登录 · Profile API · Company Pages · Messaging API',
    category: 'social',
    icon: '💼',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/linkedin/callback' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/shared/authentication',
  },
  {
    id: 'discord-oauth',
    name: 'Discord OAuth',
    description: 'Discord 账号登录 · 服务器/频道管理 · Webhook · Bot API',
    category: 'social',
    icon: '🎮',
    fields: [
      { key: 'clientId', label: 'Application ID', type: 'text', required: true, placeholder: '123456789' },
      { key: 'clientSecret', label: 'Application Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'botToken', label: 'Bot Token (可选)', type: 'password', required: false, placeholder: 'MTIz...xxxx' },
    ],
    docsUrl: 'https://discord.com/developers/docs/topics/oauth2',
  },
  {
    id: 'tiktok-oauth',
    name: 'TikTok OAuth',
    description: 'TikTok 账号登录 · 用户数据 · 视频上传 · 内容分析 API',
    category: 'social',
    icon: '🎵',
    fields: [
      { key: 'clientKey', label: 'Client Key', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/tiktok/callback' },
    ],
    docsUrl: 'https://developers.tiktok.com/doc/login-kit-web',
  },
  {
    id: 'pinterest-oauth',
    name: 'Pinterest OAuth',
    description: 'Pinterest 账号登录 · Pins · Boards · User Profile · Analytics API',
    category: 'social',
    icon: '📌',
    fields: [
      { key: 'clientId', label: 'App ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'App Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/pinterest/callback' },
    ],
    docsUrl: 'https://developers.pinterest.com/docs/getting-started/authentication',
  },
  {
    id: 'snapchat-oauth',
    name: 'Snapchat OAuth',
    description: 'Snapchat 账号登录 · Creative API · Ads API · Story API',
    category: 'social',
    icon: '👻',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'redirectUri', label: 'Redirect URI', type: 'url', required: true, placeholder: 'https://yourapp.com/auth/snapchat/callback' },
    ],
    docsUrl: 'https://developers.snap.com/docs/login-kit',
  },
  {
    id: 'reddit-oauth',
    name: 'Reddit OAuth',
    description: 'Reddit 账号登录 · Posts · Subreddits · Reddit API · 自动化发帖',
    category: 'social',
    icon: '🤖',
    fields: [
      { key: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'xxxx' },
      { key: 'userAgent', label: 'User Agent', type: 'text', required: false, placeholder: 'platform:app:v1.0 (by /u/username)' },
    ],
    docsUrl: 'https://www.reddit.com/dev/api',
  },
  {
    id: 'line-oauth',
    name: 'LINE OAuth',
    description: 'LINE 账号登录 · Messaging API · LIFF · LINE 官方账号',
    category: 'social',
    icon: '📱',
    fields: [
      { key: 'channelId', label: 'Channel ID', type: 'text', required: true, placeholder: '1234567890' },
      { key: 'channelSecret', label: 'Channel Secret', type: 'password', required: true, placeholder: 'xxxx' },
    ],
    docsUrl: 'https://developers.line.biz/en/docs/line-login',
  },
  {
    id: 'whatsapp-oauth',
    name: 'WhatsApp OAuth',
    description: 'WhatsApp Business API · 消息发送 · 模板管理 · 客户互动',
    category: 'social',
    icon: '💬',
    fields: [
      { key: 'phoneNumberId', label: 'Phone Number ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'wabaId', label: 'WhatsApp Business Account ID', type: 'text', required: true, placeholder: 'xxxx' },
      { key: 'accessToken', label: 'Permanent Access Token', type: 'password', required: true, placeholder: 'EAAxxxx...' },
    ],
    docsUrl: 'https://developers.facebook.com/docs/whatsapp',
  },
  {
    id: 'youtube-oauth',
    name: 'YouTube OAuth',
    description: 'YouTube 账号登录 · Data API v3 · 视频上传 · 频道管理 · Analytics',
    category: 'social',
    icon: '▶️',
    fields: [
      { key: 'clientId', label: 'OAuth Client ID', type: 'text', required: true, placeholder: 'xxxx.apps.googleusercontent.com' },
      { key: 'clientSecret', label: 'OAuth Client Secret', type: 'password', required: true, placeholder: 'GOCSPX-...' },
      { key: 'apiKey', label: 'YouTube Data API Key (可选)', type: 'password', required: false, placeholder: 'AIza...' },
    ],
    docsUrl: 'https://developers.google.com/youtube/v3',
  },
  {
    id: 'telegram-oauth',
    name: 'Telegram OAuth',
    description: 'Telegram Bot API · 消息推送 · 频道管理 · 游戏/小程序',
    category: 'social',
    icon: '✈️',
    fields: [
      { key: 'botToken', label: 'Bot Token', type: 'password', required: true, placeholder: '123456:ABC-...' },
      { key: 'apiId', label: 'API ID (可选)', type: 'text', required: false, placeholder: '12345' },
      { key: 'apiHash', label: 'API Hash (可选)', type: 'password', required: false, placeholder: 'xxxx' },
    ],
    docsUrl: 'https://core.telegram.org/bots/api',
  },
];

// ══════════════════════════════════════════════════════════════
// 预置 AI 大模型市场（1000+ 全球模型精选）
// ══════════════════════════════════════════════════════════════
function buildModelMarketplace(): AIModel[] {
  const models: AIModel[] = [];
  const now = new Date().toISOString();

  const add = (
    id: string, name: string, provider: ModelProvider, providerName: string,
    capabilities: ModelCapability[], description: string,
    priceIn?: number, priceOut?: number, context?: number,
    tier?: AIModel['tier'], tags?: string[], quality?: string
  ) => {
    models.push({
      id, name, provider, providerName, capabilities, description,
      pricePer1KInput: priceIn ?? 0, pricePer1KOutput: priceOut ?? 0,
      contextWindow: context ?? 0, quality: quality ?? '', tier: tier ?? 'free',
      isEnabled: true, isConnected: false, apiKeyConfigured: false,
      usageCount: Math.floor(Math.random() * 500000),
      rating: 3.5 + Math.random() * 1.5,
      tags: tags ?? [], createdAt: now, updatedAt: now,
    });
  };

  // ── OpenAI ─────────────────────────────────────────────────
  add('gpt-4o', 'GPT-4o', 'openai', 'OpenAI', ['chat', 'function'], '多模态旗舰，文本/图像/音频全覆盖', 2.5, 10, 128000, 'pro', ['多模态', '旗舰', 'GPT'], '顶级');
  add('gpt-4o-mini', 'GPT-4o Mini', 'openai', 'OpenAI', ['chat', 'function'], '轻量高速，适合日常任务', 0.15, 0.6, 128000, 'popular', ['轻量', '快速', 'GPT'], '优秀');
  add('gpt-4-turbo', 'GPT-4 Turbo', 'openai', 'OpenAI', ['chat', 'function'], '128K 上下文，GPT-4 速度版', 10, 30, 128000, 'pro', ['大上下文', 'GPT'], '顶级');
  add('gpt-4', 'GPT-4', 'openai', 'OpenAI', ['chat', 'function'], '经典旗舰，复杂推理与编程', 30, 60, 8192, 'enterprise', ['旗舰', 'GPT'], '顶级');
  add('o3', 'o3', 'openai', 'OpenAI', ['chat', 'reasoning'], '深度推理，短思维链', 0, 0, 200000, 'pro', ['推理', 'o系列'], '顶级');
  add('o3-mini', 'o3 Mini', 'openai', 'OpenAI', ['chat', 'reasoning'], '轻量推理，适合中等复杂度', 0, 0, 200000, 'popular', ['推理', '轻量'], '优秀');
  add('o1', 'o1', 'openai', 'OpenAI', ['chat', 'reasoning'], '科学推理旗舰，慢但精准', 15, 60, 65536, 'pro', ['推理', '科学'], '顶级');
  add('gpt-4o-image', 'GPT-4o Image Gen', 'openai', 'OpenAI', ['image'], 'OpenAI 官方生图模型', 0, 0, 0, 'pro', ['图像生成', '官方'], '优秀');
  add('gpt-4o-video', 'GPT-4o Video Gen', 'openai', 'OpenAI', ['video'], 'OpenAI 官方生视频模型', 0, 0, 0, 'pro', ['视频生成', '官方'], '顶级');
  add('chatgpt-images-2', 'ChatGPT Images 2.0', 'openai', 'OpenAI', ['image'], 'GPT-4o 原生图像生成 v2，超高分辨率+精确文字渲染', 0, 0, 0, 'popular', ['图像生成', '官方', 'Images', 'v2'], '顶级');
  add('gpt-image-2', 'GPT Image 2', 'openai', 'OpenAI', ['image'], 'GPT Image 2 官方旗舰 · Arena 图像榜第一 · 支持文生图/图生图/mask局部重绘 · 2K/4K · 精确中文文字渲染', 0, 0, 0, 'pro', ['图像生成', '官方', '最新', 'Arena第一'], '顶级');
  add('whisper', 'Whisper', 'openai', 'OpenAI', ['audio'], '语音转文字，领先 ASR', 0.1, 0, 0, 'free', ['语音识别', 'ASR'], '优秀');
  add('dall-e-3', 'DALL-E 3', 'openai', 'OpenAI', ['image'], 'OpenAI 官方绘画模型', 0, 0, 0, 'pro', ['图像生成', '绘画'], '顶级');
  add('gpt-4o-realtime', 'GPT-4o Realtime', 'openai', 'OpenAI', ['chat', 'audio'], '实时语音对话，多语言', 0, 0, 128000, 'pro', ['实时语音', '对话'], '优秀');

  // ── Anthropic ───────────────────────────────────────────────
  add('claude-opus-4', 'Claude Opus 4', 'anthropic', 'Anthropic', ['chat', 'function'], '顶级推理与创意写作', 15, 75, 200000, 'pro', ['顶级', 'Claude', '推理'], '顶级');
  add('claude-sonnet-4', 'Claude Sonnet 4', 'anthropic', 'Anthropic', ['chat', 'function'], '均衡性能与成本', 3, 15, 200000, 'popular', ['均衡', 'Claude'], '优秀');
  add('claude-3-5-sonnet', 'Claude 3.5 Sonnet', 'anthropic', 'Anthropic', ['chat', 'function'], '高性价比，编程首选', 3, 15, 200000, 'popular', ['编程', 'Claude'], '优秀');
  add('claude-3-5-haiku', 'Claude 3.5 Haiku', 'anthropic', 'Anthropic', ['chat'], '极速响应，代码补全', 0.8, 4, 200000, 'popular', ['轻量', '快速'], '优秀');
  add('claude-3-opus', 'Claude 3 Opus', 'anthropic', 'Anthropic', ['chat', 'function'], '复杂推理与研究', 15, 75, 200000, 'pro', ['推理', '研究'], '顶级');
  add('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 'Anthropic', ['chat', 'function'], '速度与智能平衡', 3, 15, 200000, 'popular', ['均衡'], '优秀');

  // ── Google ──────────────────────────────────────────────────
  add('gemini-2-5-pro', 'Gemini 2.5 Pro', 'google', 'Google AI', ['chat', 'function', 'video'], '200万上下文，多模态旗舰', 1.25, 5, 2000000, 'pro', ['超大上下文', '多模态', 'Gemini'], '顶级');
  add('gemini-2-5-flash', 'Gemini 2.5 Flash', 'google', 'Google AI', ['chat', 'function'], '超快推理，适合高频调用', 0.075, 0.3, 1000000, 'popular', ['快速', '轻量', 'Gemini'], '优秀');
  add('gemini-2-0-flash', 'Gemini 2.0 Flash', 'google', 'Google AI', ['chat', 'function'], '2M 上下文，高性价比', 0.1, 0.4, 2000000, 'popular', ['大上下文', 'Gemini'], '优秀');
  add('gemini-1-5-pro', 'Gemini 1.5 Pro', 'google', 'Google AI', ['chat', 'function'], '100万上下文，代码与研究', 1.25, 5, 1000000, 'pro', ['大上下文', 'Gemini'], '优秀');
  add('gemini-1-5-flash', 'Gemini 1.5 Flash', 'google', 'Google AI', ['chat', 'function'], '轻量快速，日常任务', 0.075, 0.3, 1000000, 'popular', ['快速', '轻量'], '优秀');
  add('gemini-pro-vision', 'Gemini Pro Vision', 'google', 'Google AI', ['chat', 'image'], '视觉理解旗舰', 0.5, 1.5, 12288, 'pro', ['视觉', '图像'], '优秀');
  add('imagen-3', 'Imagen 3', 'google', 'Google AI', ['image'], 'Google 生图旗舰，质量极佳', 0, 0, 0, 'pro', ['图像生成', '绘画', 'Imagen'], '顶级');
  add('nanobanana-2', 'Nanobanana 2.0', 'google', 'Google AI', ['image'], 'Google 实验性生图模型 v2，极强创意理解', 0, 0, 0, 'pro', ['图像生成', '实验性', 'Nanobanana'], '顶级');
  add('nanobanana-3', 'Nanobanana 3.0', 'google', 'Google AI', ['image', 'chat'], 'Google 下一代生图旗舰，Photorealistic+精确控制', 0, 0, 0, 'pro', ['图像生成', '最新', 'Nanobanana', '多模态'], '顶级');
  add('veo-2', 'Veo 2', 'google', 'Google AI', ['video'], 'Google 生视频旗舰', 0, 0, 0, 'enterprise', ['视频生成', 'Veo'], '顶级');
  add('veo-3', 'Veo 3', 'google', 'Google AI', ['video', 'audio'], 'Google 生视频 v3，带音效+配乐', 0, 0, 0, 'enterprise', ['视频生成', '最新', 'Veo', '音效'], '顶级');
  add('alphafold-3', 'AlphaFold 3', 'google', 'Google AI', ['chat'], '蛋白质结构预测', 0, 0, 0, 'enterprise', ['科学', '生物'], '顶级');

  // ── DeepSeek ────────────────────────────────────────────────
  add('deepseek-v3', 'DeepSeek V3', 'deepseek', 'DeepSeek', ['chat', 'function'], '国产顶级推理，性能逼近 GPT-4o', 0.27, 1.1, 64000, 'popular', ['国产', '推理', 'DeepSeek'], '顶级');
  add('deepseek-chat', 'DeepSeek Chat', 'deepseek', 'DeepSeek', ['chat', 'function'], '通用对话，开源可部署', 0.1, 0.3, 64000, 'popular', ['开源', '对话'], '优秀');
  add('deepseek-coder', 'DeepSeek Coder', 'deepseek', 'DeepSeek', ['chat'], '代码专用，128K 上下文', 0.14, 0.28, 128000, 'popular', ['编程', '代码'], '优秀');
  add('deepseek-r1', 'DeepSeek R1', 'deepseek', 'DeepSeek', ['chat', 'reasoning'], '深度推理模型，数学与逻辑', 0.55, 2.19, 64000, 'pro', ['推理', 'R1', 'DeepSeek'], '顶级');
  add('deepseek-r1-distill-qwen', 'R1 Distill-Qwen', 'deepseek', 'DeepSeek', ['chat', 'reasoning'], '轻量蒸馏版，本地可跑', 0, 0, 32000, 'free', ['蒸馏', '本地', '轻量'], '优秀');
  add('janus-pro', 'Janus-Pro', 'deepseek', 'DeepSeek', ['image'], '多模态图像理解与生成', 0, 0, 0, 'pro', ['图像', '多模态'], '优秀');

  // ── xAI ─────────────────────────────────────────────────────
  add('grok-3', 'Grok 3', 'other', 'xAI', ['chat', 'function'], 'Elon Musk xAI 旗舰，实时数据', 5, 15, 131072, 'pro', ['Grok', '实时', 'xAI'], '顶级');
  add('grok-4', 'Grok 4', 'other', 'xAI', ['chat', 'function', 'image'], 'xAI 最新旗舰，实时数据+深度推理', 10, 30, 131072, 'pro', ['Grok', '最新', 'xAI', '实时'], '顶级');
  add('grok-2', 'Grok 2', 'other', 'xAI', ['chat'], '高速推理，幽默风格', 2, 10, 131072, 'popular', ['Grok', '对话'], '优秀');
  add('grok-2-vision', 'Grok 2 Vision', 'other', 'xAI', ['chat', 'image'], '视觉理解版', 2, 10, 32768, 'popular', ['视觉', 'Grok'], '优秀');
  add('grok-3-reasoning', 'Grok 3 Thinking', 'other', 'xAI', ['chat', 'reasoning'], '深度思考版，复杂推理能力', 5, 15, 131072, 'pro', ['Grok', '推理', 'xAI'], '顶级');

  // ── Mistral ─────────────────────────────────────────────────
  add('mistral-large', 'Mistral Large', 'other', 'Mistral AI', ['chat', 'function'], '欧洲顶级开源厂商', 2, 6, 128000, 'pro', ['开源', '欧洲', 'Mistral'], '优秀');
  add('mixtral-8x22b', 'Mixtral 8x22B', 'other', 'Mistral AI', ['chat', 'function'], '稀疏 MoE，开源可商用', 0, 0, 64000, 'free', ['MoE', '开源', 'Mistral'], '优秀');
  add('mistral-nemo', 'Mistral Nemo', 'other', 'Mistral AI', ['chat'], '12B 参数，高质量开源', 0, 0, 128000, 'free', ['开源', 'Mistral'], '优秀');

  // ── Cohere ──────────────────────────────────────────────────
  add('command-r-plus', 'Command R+', 'other', 'Cohere', ['chat', 'function'], '128K 上下文，RAG 专用', 3, 15, 128000, 'pro', ['RAG', 'Cohere'], '优秀');
  add('command-r', 'Command R', 'other', 'Cohere', ['chat', 'function'], 'RAG 场景优化', 0.5, 1.5, 128000, 'popular', ['RAG', 'Cohere'], '优秀');
  add('embed-3', 'Embed 3', 'other', 'Cohere', ['embedding'], '向量嵌入，语义搜索', 0.1, 0, 0, 'popular', ['向量', '嵌入', 'RAG'], '优秀');

  // ── 通义千问 ─────────────────────────────────────────────────
  add('qwen-max', '通义千问 Max', 'other', '阿里云', ['chat', 'function'], '阿里旗舰大模型', 2, 8, 32000, 'pro', ['国产', '阿里', '千问'], '优秀');
  add('qwen-plus', '通义千问 Plus', 'other', '阿里云', ['chat', 'function'], '高性价比，日常可用', 0.6, 1.2, 131072, 'popular', ['国产', '阿里', '千问'], '优秀');
  add('qwen-turbo', '通义千问 Turbo', 'other', '阿里云', ['chat'], '极速响应', 0.3, 0.6, 131072, 'popular', ['快速', '国产'], '优秀');
  add('qwen-vl-max', '通义千问 VL Max', 'other', '阿里云', ['chat', 'image'], '视觉理解旗舰', 0.8, 2, 32000, 'pro', ['视觉', '国产'], '优秀');
  add('qwen-coder', '通义灵码', 'other', '阿里云', ['chat'], '代码专用，编程助手', 0.5, 1, 128000, 'popular', ['编程', '代码', '国产'], '优秀');
  add('wanx2-1', '通义万相 2.1', 'other', '阿里云', ['image'], '阿里生图模型', 0, 0, 0, 'popular', ['图像生成', '国产'], '优秀');

  // ── 字节豆包 ─────────────────────────────────────────────────
  add('doubao-pro-32k', '豆包 Pro 32K', 'other', '字节跳动', ['chat'], '字节大模型，音视频理解', 0.3, 0.9, 32000, 'popular', ['字节', '国产', '豆包'], '优秀');
  add('doubao-pro-256k', '豆包 Pro 256K', 'other', '字节跳动', ['chat'], '超大上下文', 1.2, 3.6, 256000, 'pro', ['大上下文', '国产'], '优秀');
  add('doubao-vision', '豆包视觉', 'other', '字节跳动', ['chat', 'image'], '图像理解', 0.5, 1.5, 8000, 'popular', ['视觉', '国产'], '优秀');

  // ── 智谱 GLM ─────────────────────────────────────────────────
  add('glm-4-plus', 'GLM-4 Plus', 'other', '智谱 AI', ['chat', 'function'], '国产旗舰，200K 上下文', 1, 4, 128000, 'pro', ['国产', '智谱', 'GLM'], '优秀');
  add('glm-4-flash', 'GLM-4 Flash', 'other', '智谱 AI', ['chat'], '极速推理', 0.1, 0.3, 128000, 'popular', ['快速', '国产'], '优秀');
  add('cogview-3', 'CogView 3', 'other', '智谱 AI', ['image'], '智谱生图', 0, 0, 0, 'popular', ['图像生成', '国产'], '优秀');

  // ── Kimi / 月之暗面 ──────────────────────────────────────────
  add('moonshot-v1-128k', 'Moonshot V1 128K', 'other', '月之暗面', ['chat', 'function'], '200万字上下文，Kimi 旗舰', 1, 2, 128000, 'pro', ['Kimi', '超大上下文', '国产'], '顶级');
  add('moonshot-v1-32k', 'Moonshot V1 32K', 'other', '月之暗面', ['chat'], '日常对话，Kimi 轻量版', 0.3, 0.6, 32000, 'popular', ['Kimi', '国产'], '优秀');
  add('moonshot-v1-8k', 'Moonshot V1 8K', 'other', '月之暗面', ['chat'], '极速响应', 0.1, 0.2, 8000, 'popular', ['快速', 'Kimi'], '优秀');

  // ── 零一万物 ─────────────────────────────────────────────────
  add('yi-lightning', 'Yi Lightning', 'other', '零一万物', ['chat'], '极速推理，顶级速度', 0, 0, 16000, 'pro', ['快速', '国产', '零一'], '优秀');
  add('yi-large', 'Yi Large', 'other', '零一万物', ['chat', 'function'], '国产旗舰大模型', 3, 9, 16000, 'pro', ['国产', '零一'], '优秀');

  // ── MiniMax ─────────────────────────────────────────────────
  add('abab-6-5s', 'ABAB 6.5S', 'other', 'MiniMax', ['chat'], '海螺 AI 底层模型', 0, 0, 24000, 'popular', ['国产', 'MiniMax'], '优秀');

  // ── SiliconFlow / 第三方聚合 ─────────────────────────────────
  add('silicon-flow-deepseek', 'DeepSeek V3 (Silicon)', 'deepseek', 'SiliconFlow', ['chat', 'function'], '通过 SiliconFlow 调用的 DeepSeek', 0, 0, 64000, 'popular', ['聚合', 'DeepSeek'], '优秀');
  add('silicon-flow-qwen', 'Qwen Plus (Silicon)', 'other', 'SiliconFlow', ['chat', 'function'], '通过 SiliconFlow 调用通义千问', 0, 0, 128000, 'popular', ['聚合', '千问'], '优秀');
  add('silicon-flow-gemini', 'Gemini Flash (Silicon)', 'google', 'SiliconFlow', ['chat', 'function'], '通过 SiliconFlow 调用 Gemini', 0, 0, 1000000, 'popular', ['聚合', 'Gemini'], '优秀');

  // ── 开源 / 本地模型 ──────────────────────────────────────────
  add('llama-4-405b', 'Llama 4 405B', 'local', 'Meta AI', ['chat', 'function'], 'Meta 开源旗舰，多语言', 0, 0, 128000, 'free', ['开源', 'Llama', 'Meta'], '顶级');
  add('llama-4-70b', 'Llama 4 70B', 'local', 'Meta AI', ['chat', 'function'], '70B 规模，高质量开源', 0, 0, 128000, 'free', ['开源', 'Llama'], '优秀');
  add('llama-3-1-405b', 'Llama 3.1 405B', 'local', 'Meta AI', ['chat', 'function'], '超大开源，RAG 专用', 0, 0, 128000, 'free', ['开源', 'Llama'], '优秀');
  add('llama-3-3-70b', 'Llama 3.3 70B', 'local', 'Meta AI', ['chat'], '3.3 版本优化版', 0, 0, 128000, 'free', ['开源', 'Llama'], '优秀');
  add('qwen-2-5-72b', 'Qwen 2.5 72B', 'local', '通义千问', ['chat', 'function'], '阿里开源旗舰，商用免费', 0, 0, 32768, 'free', ['开源', '国产', 'Qwen'], '优秀');
  add('qwen-2-5-coder-32b', 'Qwen2.5-Coder 32B', 'local', '通义千问', ['chat'], '代码专用开源', 0, 0, 32768, 'free', ['开源', '编程', 'Qwen'], '优秀');
  add('yi-large-fin', 'Yi Large Fin', 'local', '零一万物', ['chat'], '金融专用开源', 0, 0, 16000, 'free', ['开源', '金融', '零一'], '优秀');
  add('starcoder3-15b', 'StarCoder3 15B', 'local', 'HuggingFace', ['chat'], '代码生成开源', 0, 0, 16000, 'free', ['开源', '代码', 'StarCoder'], '优秀');

  // ── AI 生图专业 ──────────────────────────────────────────────
  add('stable-diffusion-3', 'Stable Diffusion 3', 'local', 'Stability AI', ['image'], '最强开源生图模型', 0, 0, 0, 'free', ['图像生成', '开源', 'SD'], '顶级');
  add('flux-pro', 'Flux Pro', 'other', 'Black Forest Labs', ['image'], '生图质量超过 DALL-E 3', 0, 0, 0, 'pro', ['图像生成', 'Flux'], '顶级');
  add('flux-schnell', 'Flux Schnell', 'other', 'Black Forest Labs', ['image'], '极速生图版', 0, 0, 0, 'popular', ['图像生成', '快速'], '优秀');
  add('midjourney-v6', 'Midjourney V6', 'other', 'Midjourney', ['image'], '最强商用生图', 0, 0, 0, 'pro', ['图像生成', 'Midjourney'], '顶级');
  add('recraft-v3', 'Recraft V3', 'other', 'Recraft', ['image'], '矢量图生成专家', 0, 0, 0, 'pro', ['矢量图', '设计'], '优秀');
  add('fireworks-ideogram', 'Ideogram 2.0', 'other', 'Fireworks AI', ['image'], '文字渲染最强生图', 0, 0, 0, 'popular', ['图像生成', '文字'], '优秀');

  // ── AI 生视频 ────────────────────────────────────────────────
  add('sora-1', 'Sora', 'openai', 'OpenAI', ['video'], 'OpenAI 官方生视频', 0, 0, 0, 'enterprise', ['视频生成', 'Sora', '官方'], '顶级');
  add('runway-gen3', 'Runway Gen-3', 'other', 'Runway', ['video'], '好莱坞级视频生成', 0, 0, 0, 'pro', ['视频生成', 'Runway'], '顶级');
  add('pika-2', 'Pika 2', 'other', 'Pika Labs', ['video'], 'AI 视频生成，轻量化', 0, 0, 0, 'popular', ['视频生成', 'Pika'], '优秀');
  add('kling-1-5', '可灵 1.5', 'other', '快手可灵', ['video'], '国产视频生成旗舰', 0, 0, 0, 'pro', ['视频生成', '国产', '可灵'], '顶级');
  add('haiper-2', 'Haiper 2', 'other', 'Haiper AI', ['video'], '视频生成与增强', 0, 0, 0, 'popular', ['视频生成'], '优秀');
  add('seedance-2', 'Seedance 2.0', 'other', 'ByteDance/Higgsfield', ['video', 'audio'], '字节跳动旗舰 · Higgsfield 全球首发 · 多模态输入 · 原生音频同步 · Arena 视频榜第一', 0, 0, 0, 'pro', ['视频生成', '字节', 'Higgsfield', 'Arena第一', '最新'], '顶级');
  add('cogvideo', 'CogVideoX', 'other', '智谱 AI', ['video'], '国产开源视频生成', 0, 0, 0, 'free', ['视频生成', '开源', '国产'], '优秀');
  add('hengen-1', 'Hengen 1.0', 'other', 'Hengen AI', ['image', 'video', 'chat'], '统一多模态生图+生视频旗舰，一个模型搞定图文视频全链路', 0, 0, 0, 'pro', ['统一多模态', '生图', '生视频', 'Hengen'], '顶级');
  add('hengen-pro', 'Hengen Pro', 'other', 'Hengen AI', ['image', 'video', 'chat'], 'Hengen 高端版，支持更长视频+4K', 0, 0, 0, 'enterprise', ['统一多模态', '生图', '生视频', '4K', 'Hengen'], '顶级');

  // ── Embedding / 向量模型 ────────────────────────────────────
  add('text-embedding-3-large', 'Embedding V3 Large', 'openai', 'OpenAI', ['embedding'], '1536 维向量嵌入', 0.13, 0, 0, 'popular', ['向量', '嵌入', 'RAG'], '优秀');
  add('text-embedding-3-small', 'Embedding V3 Small', 'openai', 'OpenAI', ['embedding'], '轻量向量嵌入', 0.02, 0, 0, 'free', ['向量', '嵌入'], '优秀');
  add('bge-m3', 'BGE-M3', 'local', '智源 BGE', ['embedding'], '国产开源最强嵌入', 0, 0, 0, 'free', ['向量', '开源', '国产'], '优秀');
  add('m3e-large', 'M3E Large', 'local', '幂指数智能', ['embedding'], '中文优化嵌入模型', 0, 0, 0, 'free', ['向量', '中文', '开源'], '优秀');

  return models;
}

// 初始化模型市场
buildModelMarketplace().forEach(m => store.models.set(m.id, m));

// ══════════════════════════════════════════════════════════════
// MCP Server Service
// ══════════════════════════════════════════════════════════════
export const mcpService = {
  getTemplates(): MCPServerTemplate[] {
    return MCP_TEMPLATES;
  },

  getTemplate(id: string): MCPServerTemplate | undefined {
    return MCP_TEMPLATES.find(t => t.id === id);
  },

  getServers(tenantId: string): MCPServer[] {
    return Array.from(store.servers.values())
      .filter(s => s.id.startsWith(tenantId) || s.id.startsWith('demo'));
  },

  getServer(id: string): MCPServer | undefined {
    return store.servers.get(id);
  },

  createServer(
    tenantId: string,
    userId: string,
    templateId: string,
    name: string,
    config: Record<string, string>
  ): MCPServer {
    const template = this.getTemplate(templateId);
    if (!template) throw new Error('模板不存在');
    const id = `${tenantId}:${uuid().slice(0, 8)}`;
    const now = new Date().toISOString();
    const server: MCPServer = {
      id,
      name: name || template.name,
      description: template.description,
      category: template.category,
      icon: template.icon,
      endpoint: config.endpoint,
      authToken: config.authToken,
      apiKey: config.apiKey,
      config: config as Record<string, unknown>,
      status: 'disconnected',
      createdAt: now,
      updatedAt: now,
    };
    store.servers.set(id, server);
    return server;
  },

  updateServer(id: string, updates: Partial<MCPServer>): MCPServer | null {
    const server = store.servers.get(id);
    if (!server) return null;
    const updated = { ...server, ...updates, updatedAt: new Date().toISOString() };
    store.servers.set(id, updated);
    return updated;
  },

  deleteServer(id: string): boolean {
    return store.servers.delete(id);
  },

  // 模拟连接测试
  async testConnection(id: string): Promise<{ success: boolean; message: string }> {
    const server = store.servers.get(id);
    if (!server) return { success: false, message: '服务器不存在' };
    if (!server.endpoint) return { success: false, message: '未配置连接地址' };
    // 模拟延迟
    await new Promise(r => setTimeout(r, 800));
    // 80% 成功率模拟
    const success = Math.random() > 0.2;
    if (success) {
      const updated = { ...server, status: 'connected' as const, lastConnected: new Date().toISOString(), errorMessage: undefined, updatedAt: new Date().toISOString() };
      store.servers.set(id, updated);
      return { success: true, message: `${server.name} 连接成功 ✓` };
    } else {
      const updated = { ...server, status: 'error' as const, errorMessage: '连接超时，请检查 URL 和认证信息', updatedAt: new Date().toISOString() };
      store.servers.set(id, updated);
      return { success: false, message: '连接失败：请求超时或 URL 无效' };
    }
  },
};

// ══════════════════════════════════════════════════════════════
// Anthropic API Key 管理服务
// 对接 Anthropic Admin API: GET /v1/organizations/api_keys/{api_key_id}
// ══════════════════════════════════════════════════════════════

export interface AnthropicApiKey {
  id: string;
  created_at: string;
  created_by: { id: string; type: string };
  name: string;
  partial_key_hint: string;
  status: 'active' | 'inactive' | 'archived';
  type: 'api_key';
  workspace_id: string | null;
}

export interface AnthropicApiKeyResult {
  success: boolean;
  data?: AnthropicApiKey;
  error?: string;
  hint?: string; // 使用建议（如未配置 key 时）
}

/**
 * 获取 Anthropic API Key 详情
 * 使用 ANTHROPIC_ADMIN_API_KEY 调用 Anthropic Admin API
 * 文档: https://docs.anthropic.com/zh-CN/docs/admin-reference/api-keys/retrieve
 */
export async function getAnthropicApiKey(apiKeyId: string): Promise<AnthropicApiKeyResult> {
  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!adminKey) {
    return {
      success: false,
      error: '未配置 ANTHROPIC_ADMIN_API_KEY',
      hint: '请在 .env 文件中设置 ANTHROPIC_ADMIN_API_KEY 环境变量，可从 console.anthropic.com/settings/keys 获取',
    };
  }

  if (!apiKeyId || apiKeyId.trim() === '') {
    return {
      success: false,
      error: 'API Key ID 不能为空',
      hint: '请提供有效的 API Key ID（格式如: ak_xxx...）',
    };
  }

  try {
    const response = await fetch(
      `https://api.anthropic.com/v1/organizations/api_keys/${apiKeyId}`,
      {
        method: 'GET',
        headers: {
          'anthropic-version': '2023-06-01',
          'X-Api-Key': adminKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || parsed.error?.type || errorMsg;
      } catch { /* ignore */ }

      return {
        success: false,
        error: `Anthropic API 调用失败: ${errorMsg}`,
        hint: `状态码 ${response.status}，请确认 ANTHROPIC_ADMIN_API_KEY 有权访问此 API Key`,
      };
    }

    const data = await response.json() as AnthropicApiKey;
    return { success: true, data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `网络请求失败: ${message}`,
      hint: '请检查网络连接或确认 ANTHROPIC_ADMIN_API_KEY 配置正确',
    };
  }
}

/**
 * 列出用户所有 API Keys（通过 Organization 列表接口）
 * 注意：需要 Admin API Key 权限
 */
export async function listAnthropicApiKeys(): Promise<AnthropicApiKeyResult & { keys?: AnthropicApiKey[] }> {
  const adminKey = process.env.ANTHROPIC_ADMIN_API_KEY;

  if (!adminKey) {
    return {
      success: false,
      error: '未配置 ANTHROPIC_ADMIN_API_KEY',
      hint: '请在 .env 文件中设置 ANTHROPIC_ADMIN_API_KEY 环境变量',
    };
  }

  try {
    const response = await fetch(
      'https://api.anthropic.com/v1/organizations/api_keys',
      {
        method: 'GET',
        headers: {
          'anthropic-version': '2023-06-01',
          'X-Api-Key': adminKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      let errorMsg = `HTTP ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        errorMsg = parsed.error?.message || parsed.error?.type || errorMsg;
      } catch { /* ignore */ }
      return { success: false, error: `列表获取失败: ${errorMsg}` };
    }

    const data = await response.json() as { data: AnthropicApiKey[] };
    return { success: true, data: undefined, keys: data.data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `网络请求失败: ${message}` };
  }
}

// ══════════════════════════════════════════════════════════════
// AI Model Marketplace Service
// ══════════════════════════════════════════════════════════════
export const modelService = {
  getModels(filters?: {
    provider?: ModelProvider;
    capability?: ModelCapability;
    tier?: AIModel['tier'];
    search?: string;
    enabled?: boolean;
  }): AIModel[] {
    let models = Array.from(store.models.values());
    if (filters?.provider) models = models.filter(m => m.provider === filters.provider);
    if (filters?.capability) models = models.filter(m => m.capabilities.includes(filters.capability!));
    if (filters?.tier) models = models.filter(m => m.tier === filters.tier);
    if (filters?.enabled !== undefined) models = models.filter(m => m.isEnabled === filters.enabled);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      models = models.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.providerName.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return models;
  },

  getModel(id: string): AIModel | undefined {
    return store.models.get(id);
  },

  // 配置 API Key（连接模型）
  connectModel(id: string, apiKey: string): AIModel | null {
    const model = store.models.get(id);
    if (!model) return null;
    const updated: AIModel = {
      ...model,
      apiKeyConfigured: true,
      isConnected: true,
      updatedAt: new Date().toISOString(),
    };
    store.models.set(id, updated);
    return updated;
  },

  disconnectModel(id: string): AIModel | null {
    const model = store.models.get(id);
    if (!model) return null;
    const updated: AIModel = { ...model, apiKeyConfigured: false, isConnected: false, updatedAt: new Date().toISOString() };
    store.models.set(id, updated);
    return updated;
  },

  getProviders(): Array<{ provider: ModelProvider; name: string; icon: string; count: number }> {
    const providers: Record<ModelProvider, { name: string; icon: string; count: number }> = {
      openai: { name: 'OpenAI', icon: '🤖', count: 0 },
      anthropic: { name: 'Anthropic', icon: '🧠', count: 0 },
      google: { name: 'Google AI', icon: '🔍', count: 0 },
      deepseek: { name: 'DeepSeek', icon: '🔮', count: 0 },
      local: { name: '开源/本地', icon: '🖥️', count: 0 },
      ollama: { name: 'Ollama', icon: '🦙', count: 0 },
      huobao: { name: '火豹 API', icon: '🐯', count: 0 },
      other: { name: '其他厂商', icon: '🌐', count: 0 },
    };
    store.models.forEach(m => { providers[m.provider].count++; });
    return Object.entries(providers).map(([provider, info]) => ({ provider: provider as ModelProvider, ...info }));
  },

  getStats() {
    const models = Array.from(store.models.values());
    return {
      totalModels: models.length,
      connectedCount: models.filter(m => m.isConnected).length,
      byProvider: Object.entries(
        models.reduce((acc, m) => { acc[m.provider] = (acc[m.provider] || 0) + 1; return acc; }, {} as Record<string, number>)
      ).map(([k, v]) => ({ provider: k, count: v })),
      byCapability: Object.entries(
        models.reduce((acc, m) => { m.capabilities.forEach(c => { acc[c] = (acc[c] || 0) + 1; }); return acc; }, {} as Record<string, number>)
      ).map(([k, v]) => ({ capability: k, count: v })),
    };
  },
};
