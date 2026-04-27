/**
 * 跨境龙虾社 · 龙虾集群OpenClaw获客运营系统
 * 外贸B2B + 跨境电商B2C · 真正实现跨境获客留客机器人自动化运营
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';

// ── 类型定义 ──────────────────────────────────────────────────────────────────
type SystemTab = 'overview' | 'b2b' | 'b2c' | 'matrix' | 'cluster' | 'tools' | 'sop' | 'skills';
type B2CSubTab = 'tiktok' | 'ecommerce' | 'openclaw';

interface ClusterNode {
  palace: string; name: string; role: string; hexagrams: number;
  status: 'active' | 'standby' | 'busy'; color: string; tasks: number;
  load: number; skills: string[];
}

interface GeoKeyword {
  id: string; keyword: string; engine: string; rank: string;
  trend: 'up' | 'down' | 'stable'; views: number; status: 'active' | 'pending';
}

interface FlipbookItem {
  id: string; url: string; title: string; category: string;
  views: number; created: string; status: 'active' | 'draft';
}

interface TikTokAccount {
  id: string; name: string; niche: string; followers: number;
  videos: number; todayViews: number; status: 'running' | 'paused' | 'error';
  lastPost: string;
}

interface ProductItem {
  id: string; name: string; platform: string; price: string;
  status: 'published' | 'draft' | 'reviewing'; sku: string; sales: number;
}

interface SOPExecution {
  id: string; name: string; type: 'B2B' | 'B2C'; progress: number;
  currentStep: number; status: 'running' | 'completed' | 'paused'; steps: string[];
}

interface SkillExecution {
  id: string; skillName: string; skillIcon: string; skillCat: string;
  status: 'running' | 'completed' | 'failed' | 'queued' | 'paused';
  progress: number; startedAt: string; duration: string;
  input: string; output: string; agent: string; error?: string;
}

interface SkillChain {
  id: string; name: string; skills: { name: string; icon: string; params: string }[];
  status: 'active' | 'draft' | 'paused'; runCount: number; lastRun: string;
  description: string;
}

interface SkillUsageStat {
  skillName: string; totalUse: number; successRate: number;
  avgDuration: string; lastUsed: string; category: string;
}

interface TaskQueueItem {
  id: string; title: string; agent: string; priority: 'high' | 'medium' | 'low';
  status: 'queued' | 'running' | 'done'; created: string; duration: string;
}

interface ToolQuickAction {
  label: string; icon: string; action: () => void;
}

interface ToolFeature {
  label: string; value: string;
}

interface ToolConfig {
  id: string; name: string; desc: string; icon: string; color: string;
  status: 'connected' | 'disconnected';
  url?: string; category: 'video' | 'image' | 'seo' | 'social' | 'automation' | 'customer' | 'design';
  usageCount: number; lastUsed: string; apiKey?: string;
  features: ToolFeature[];
  quickActions: { label: string; icon: string; action: string }[];
  usageTrend: number[];
}

interface AgentTask {
  id: string; palace: string; agent: string; task: string;
  status: 'idle' | 'working' | 'done'; progress: number;
}

interface SocialAccount {
  id: string; platform: 'facebook' | 'x' | 'linkedin' | 'instagram' | 'tiktok' | 'whatsapp' | 'anygen';
  username: string; displayName: string; profileUrl: string;
  status: 'connected' | 'disconnected' | 'error' | 'loading';
  followers?: number; posts?: number; country: string;
  vpnProfile: string; vpnConnected: boolean;
  avatar?: string; lastPost?: string; bio?: string;
  connectedAt: string; sessionToken?: string;
  ipAddress?: string; browserFingerprint?: string;
}

interface VPNProfile {
  id: string; name: string; country: string; countryCode: string;
  city: string; serverIp: string; protocol: 'WireGuard' | 'OpenVPN' | 'Shadowsocks';
  bandwidth: string; status: 'active' | 'idle' | 'error';
  connectedAccounts: number; maxAccounts: number;
  ipAddress: string; load: number; ping: number;
}

interface MatrixMessage {
  id: string; platform: SocialAccount['platform']; content: string;
  sentAt: string; status: 'sent' | 'failed' | 'pending'; recipient: string;
}

type MatrixSubTab = 'accounts' | 'vpn' | 'auto-post' | 'anygen';
type VpnTab = 'profiles' | 'ip-pool' | 'settings';

// ── 8宫数据 ───────────────────────────────────────────────────────────────────
const CLUSTER_NODES: ClusterNode[] = [
  { palace: '乾宫', name: '探微军师', role: '战略研究·选品洞察', hexagrams: 8, status: 'active', color: 'cyan', tasks: 1247, load: 68, skills: ['市场调研', '竞品分析', '选品洞察'] },
  { palace: '坤宫', name: '文案女史', role: '内容生成·多语言', hexagrams: 8, status: 'active', color: 'violet', tasks: 983, load: 75, skills: ['多语言文案', '品牌故事', 'SEO内容'] },
  { palace: '震宫', name: '镜画仙姬', role: '视觉·视频制作', hexagrams: 8, status: 'busy', color: 'pink', tasks: 756, load: 92, skills: ['LTX视频', '主图设计', '品牌KV'] },
  { palace: '巽宫', name: '记史官', role: '上架·RPA·执行', hexagrams: 8, status: 'active', color: 'amber', tasks: 2103, load: 55, skills: ['自动化上架', 'ERP集成', '数据采集'] },
  { palace: '坎宫', name: '营销虾', role: '推广·流量·打赏', hexagrams: 8, status: 'active', color: 'emerald', tasks: 1654, load: 80, skills: ['TikTok矩阵', 'ADS投放', '网红建联'] },
  { palace: '离宫', name: '验效掌事', role: '监控·复盘·Dageno', hexagrams: 8, status: 'active', color: 'red', tasks: 432, load: 45, skills: ['数据监控', 'ROI分析', '合规检测'] },
  { palace: '艮宫', name: '技术虾', role: '基础设施·自愈', hexagrams: 8, status: 'standby', color: 'slate', tasks: 89, load: 20, skills: ['系统监控', '故障自愈', '安全防护'] },
  { palace: '兑宫', name: '总控分身', role: '协调·进化·永生', hexagrams: 8, status: 'active', color: 'sky', tasks: 3201, load: 88, skills: ['任务调度', 'OPC协作', '数字永生'] },
];

const HEXAGRAMS = ['䷀','䷁','䷂','䷃','䷄','䷅','䷆','䷇','䷈','䷉','䷊','䷋','䷌','䷍','䷎','䷏','䷐','䷑','䷒','䷓','䷔','䷕','䷖','䷗','䷘','䷙','䷚','䷛','䷜','䷝','䷞','䷟','䷠','䷡','䷢','䷣','䷤','䷥','䷦','䷧','䷨','䷩','䷪','䷫','䷬','䷭','䷮','䷯','䷰','䷱','䷲','䷳','䷴','䷵','䷶','䷷','䷸','䷹','䷺','䷻','䷼','䷽','䷾','䷿'];

// ── 工具函数 ──────────────────────────────────────────────────────────────────
function cn(...classes: (string | boolean | undefined)[]) { return classes.filter(Boolean).join(' '); }
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ── Modal 组件 ────────────────────────────────────────────────────────────────
function Modal({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  if (!open) return null;
  const w = size === 'xl' ? 'max-w-5xl' : size === 'lg' ? 'max-w-3xl' : size === 'sm' ? 'max-w-md' : 'max-w-2xl';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className={`relative w-full ${w} bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 flex-shrink-0">
          <h3 className="text-base font-bold text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors text-lg">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

// ── 进度动画条 ───────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'bg-cyan-400' }: { value: number; color?: string }) {
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${value}%` }} />
    </div>
  );
}

// ── Toast 提示 ────────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState<Array<{ id: number; msg: string; type: string }>>([]);
  const addToast = useCallback((msg: string, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);
  const ToastContainer = () => (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={cn('px-4 py-3 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 animate-pulse',
          t.type === 'success' ? 'bg-emerald-600/90 text-white' : t.type === 'error' ? 'bg-red-600/90 text-white' : 'bg-slate-700/90 text-white')}>
          <span>{t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
  return { addToast, ToastContainer };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ═══════════════════  主组件  ════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════════════
export function CrossBorderLobsterSystem() {
  const [activeTab, setActiveTab] = useState<SystemTab>('overview');
  const [activeB2C, setActiveB2C] = useState<B2CSubTab>('tiktok');
  const [selectedPalace, setSelectedPalace] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { addToast, ToastContainer } = useToast();

  // ── 实时数据状态 ─────────────────────────────────────────────────────────────
  const [geoKeywords, setGeoKeywords] = useState<GeoKeyword[]>([
    { id: '1', keyword: 'industrial aluminum supplier China', engine: 'Perplexity', rank: 'TOP3', trend: 'up', views: 12400, status: 'active' },
    { id: '2', keyword: 'custom metal fabrication OEM', engine: 'Gemini', rank: 'TOP5', trend: 'stable', views: 8900, status: 'active' },
    { id: '3', keyword: 'B2B sourcing platform Alibaba alternative', engine: 'Perplexity', rank: 'TOP1', trend: 'up', views: 22300, status: 'active' },
    { id: '4', keyword: 'eco-friendly swimwear manufacturer', engine: 'ChatGPT', rank: 'TOP7', trend: 'down', views: 5600, status: 'pending' },
    { id: '5', keyword: 'furniture hardware supplier wholesale', engine: 'Perplexity', rank: 'TOP4', trend: 'up', views: 11200, status: 'active' },
  ]);
  const [flipbooks, setFlipbooks] = useState<FlipbookItem[]>([
    { id: '1', url: 'flipbook.page/lobster-shop/swimwear', title: '环保泳装产品画册', category: 'B2B产品', views: 12500, created: '2026-04-15', status: 'active' },
    { id: '2', url: 'flipbook.page/lobster-shop/aluminum', title: '工业铝材供应链画册', category: 'B2B供应链', views: 8200, created: '2026-04-18', status: 'active' },
    { id: '3', url: 'flipbook.page/lobster-shop/furniture', title: '家具五金解决方案', category: 'B2B产品', views: 6800, created: '2026-04-20', status: 'draft' },
  ]);
  const [tiktokAccounts, setTikTokAccounts] = useState<TikTokAccount[]>([
    { id: '1', name: '@lobster_eco_swimwear', niche: '环保泳装', followers: 45200, videos: 328, todayViews: 89000, status: 'running', lastPost: '2小时前' },
    { id: '2', name: '@china_wholesale_ali', niche: '跨境批发', followers: 32100, videos: 215, todayViews: 56000, status: 'running', lastPost: '5小时前' },
    { id: '3', name: '@fashion_factory_direct', niche: '时尚工厂', followers: 67800, videos: 512, todayViews: 124000, status: 'running', lastPost: '1小时前' },
    { id: '4', name: '@b2b_sourcing_pro', niche: 'B2B采购', followers: 18900, videos: 142, todayViews: 34000, status: 'paused', lastPost: '1天前' },
  ]);
  const [products, setProducts] = useState<ProductItem[]>([
    { id: '1', name: '环保再生尼龙泳装套装', platform: 'TikTok Shop', price: '$24.99', status: 'published', sku: 'SW-ECO-001', sales: 1247 },
    { id: '2', name: '铝合金门窗把手（定制款）', platform: 'Amazon', price: '$8.50', status: 'reviewing', sku: 'AL-HW-023', sales: 0 },
    { id: '3', name: '极简主义办公椅', platform: 'Shopee', price: '$65.00', status: 'published', sku: 'FR-OFC-110', sales: 89 },
    { id: '4', name: '智能家居LED灯带套装', platform: 'TikTok Shop', price: '$18.99', status: 'draft', sku: 'LED-SMT-005', sales: 0 },
  ]);
  const [sopExecutions, setSopExecutions] = useState<SOPExecution[]>([]);
  const [taskQueue, setTaskQueue] = useState<TaskQueueItem[]>([
    { id: '1', title: '生成GEO关键词内容矩阵', agent: '坤宫·文案女史', priority: 'high', status: 'running', created: '10:32', duration: '进行中' },
    { id: '2', title: '同步TikTok矩阵账号数据', agent: '坎宫·营销虾', priority: 'high', status: 'running', created: '10:28', duration: '进行中' },
    { id: '3', title: '执行外贸B2B SOP流程', agent: '巽宫·记史官', priority: 'medium', status: 'queued', created: '10:20', duration: '等待中' },
    { id: '4', title: '监控Flipbook访问数据', agent: '离宫·验效掌事', priority: 'medium', status: 'done', created: '09:45', duration: '已完成' },
    { id: '5', title: '生成竞品分析报告', agent: '乾宫·探微军师', priority: 'low', status: 'done', created: '09:30', duration: '已完成' },
  ]);
  const [agentTasks, setAgentTasks] = useState<AgentTask[]>([
    { id: '1', palace: '乾宫', agent: '探微军师', task: '选品分析中：环保泳装赛道', status: 'working', progress: 65 },
    { id: '2', palace: '坤宫', agent: '文案女史', task: '生成多语言产品描述', status: 'working', progress: 80 },
    { id: '3', palace: '震宫', agent: '镜画仙姬', task: '渲染TikTok视频素材', status: 'working', progress: 45 },
    { id: '4', palace: '巽宫', agent: '记史官', task: '上架Amazon商品Listing', status: 'idle', progress: 0 },
    { id: '5', palace: '坎宫', agent: '营销虾', task: 'TikTok评论区自动互动', status: 'idle', progress: 0 },
    { id: '6', palace: '离宫', agent: '验效掌事', task: '分析今日ROI数据', status: 'done', progress: 100 },
  ]);
  const [toolConfigs, setToolConfigs] = useState<ToolConfig[]>([
    { id: 'ltx', name: 'LTX-2.3', desc: '1080p实时像素视频流生成，支持AI导演与多风格迁移', icon: '🎨', color: 'pink', status: 'connected', url: 'https://ltx-video.ai', category: 'video', usageCount: 1247, lastUsed: '2小时前', features: [{label:'分辨率',value:'1080P/4K'},{label:'时长',value:'最长60秒'},{label:'风格',value:'写实/动漫/3D'}], quickActions: [{label:'生成视频',icon:'🎬',action:'ltx'},{label:'查看历史',icon:'📜',action:'history'},{label:'API设置',icon:'⚙️',action:'settings'}], usageTrend: [12,18,25,22,31,38,45] },
    { id: 'nano', name: 'Nano Banana Pro', desc: '品牌插画与视觉内容生成，支持逆向生图与风格迁移', icon: '🖼️', color: 'violet', status: 'connected', url: 'https://nanobanana.io', category: 'image', usageCount: 3891, lastUsed: '1小时前', features: [{label:'模型',value:'Gemini 3 Pro'},{label:'分辨率',value:'最高4K'},{label:'风格',value:'支持自定义'}], quickActions: [{label:'创建图片',icon:'🖼️',action:'nano'},{label:'逆向生图',icon:'🔄',action:'history'},{label:'API设置',icon:'⚙️',action:'settings'}], usageTrend: [30,42,38,55,68,72,85] },
    { id: 'flipbook', name: 'Flipbook Studio', desc: '无限视觉空间创建工具，交互式产品画册与3D展厅', icon: '📖', color: 'cyan', status: 'connected', url: 'https://flipbook.studio', category: 'design', usageCount: 634, lastUsed: '1天前', features: [{label:'页数',value:'无限'},{label:'交互',value:'3D/AR支持'},{label:'分享',value:'一键嵌入'}], quickActions: [{label:'创建画册',icon:'📖',action:'flipbook'},{label:'模板市场',icon:'🎨',action:'dashboard'},{label:'数据面板',icon:'📊',action:'history'}], usageTrend: [8,12,15,14,22,28,35] },
    { id: 'dageno', name: 'Dageno GEO', desc: 'AI可见性监测与Prompt优化，覆盖Perplexity/Gemini/ChatGPT', icon: '🌍', color: 'amber', status: 'connected', url: 'https://dageno.io', category: 'seo', usageCount: 2108, lastUsed: '3小时前', features: [{label:'关键词',value:'5000+'},{label:'引擎',value:'3大平台'},{label:'更新',value:'每日一次'}], quickActions: [{label:'关键词库',icon:'🔑',action:'geo'},{label:'监测报告',icon:'📡',action:'dashboard'},{label:'Prompt优化',icon:'✨',action:'history'}], usageTrend: [45,52,48,61,78,82,95] },
    { id: 'agentic', name: 'Agentic Search', desc: '买家意图感知与关键词挖掘，实时分析搜索行为', icon: '🔍', color: 'emerald', status: 'connected', url: 'https://agentic-search.ai', category: 'seo', usageCount: 1567, lastUsed: '30分钟前', features: [{label:'意图分类',value:'20+类'},{label:'数据源',value:'实时抓取'},{label:'报告',value:'PDF导出'}], quickActions: [{label:'开始搜索',icon:'🔍',action:'agentic'},{label:'查看报告',icon:'📊',action:'dashboard'},{label:'关键词库',icon:'📁',action:'history'}], usageTrend: [22,28,35,41,52,61,78] },
    { id: 'octopus', name: '八爪鱼RPA', desc: '数据采集与自动化执行，支持任意网页批量操作', icon: '🐸', color: 'orange', status: 'disconnected', url: 'https://paraworld.net', category: 'automation', usageCount: 0, lastUsed: '从未使用', features: [{label:'采集',value:'任意网页'},{label:'自动化',value:'批量操作'},{label:'调度',value:'定时执行'}], quickActions: [{label:'立即连接',icon:'🔗',action:'connect'},{label:'查看教程',icon:'📖',action:'dashboard'},{label:'模板中心',icon:'🎨',action:'history'}], usageTrend: [0,0,0,0,0,0,0] },
    { id: 'anygen', name: 'AnyGen助手', desc: '外贸智能客服与多语言，支持询盘处理与Lead分析', icon: '🤖', color: 'sky', status: 'connected', url: 'https://www.anygen.io/assistant', category: 'customer', usageCount: 8934, lastUsed: '5分钟前', features: [{label:'语言',value:'20+语种'},{label:'响应',value:'实时'},{label:'集成',value:'WhatsApp等'}], quickActions: [{label:'打开助手',icon:'🤖',action:'anygen'},{label:'查看对话',icon:'💬',action:'history'},{label:'数据分析',icon:'📈',action:'dashboard'}], usageTrend: [120,145,162,188,205,234,267] },
    { id: 'pixie', name: 'PixieDream', desc: 'AI商业修图与主图设计，一键生成电商主图', icon: '✨', color: 'rose', status: 'connected', url: 'https://pixiedream.ai', category: 'image', usageCount: 2789, lastUsed: '4小时前', features: [{label:'批量',value:'最多50张'},{label:'风格',value:'自定义模板'},{label:'导出',value:'PSD/PNG'}], quickActions: [{label:'上传图片',icon:'⬆️',action:'pixie'},{label:'模板库',icon:'🎨',action:'dashboard'},{label:'使用记录',icon:'📜',action:'history'}], usageTrend: [38,45,52,48,65,72,88] },
    { id: 'social', name: '社媒矩阵', desc: '全球社媒账号矩阵管理，覆盖Facebook/X/LinkedIn等7大平台', icon: '📱', color: 'sky', status: 'connected', url: '#', category: 'social', usageCount: 4512, lastUsed: '30分钟前', features: [{label:'平台',value:'7个'},{label:'账号',value:'13个'},{label:'VPN节点',value:'8个'}], quickActions: [{label:'管理账号',icon:'👤',action:'social'},{label:'发布内容',icon:'📤',action:'social'},{label:'VPN节点',icon:'🌐',action:'social'}], usageTrend: [65,78,82,95,108,122,135] },
  ]);

  // ── 全球社媒矩阵状态 ─────────────────────────────────────────────────────────
  const [activeMatrixTab, setActiveMatrixTab] = useState<MatrixSubTab>('accounts');
  const [activeVpnTab, setActiveVpnTab] = useState<VpnTab>('profiles');
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([
    { id: 'fb1', platform: 'facebook', username: 'LobsterGlobalB2B', displayName: 'Lobster Global B2B', profileUrl: 'https://facebook.com/LobsterGlobalB2B', status: 'connected', followers: 12400, posts: 342, country: 'United States', vpnProfile: 'vp-usa', vpnConnected: true, avatar: '🦞', lastPost: '3小时前', bio: 'Premium B2B sourcing from China — swimwear, aluminum, furniture hardware', connectedAt: '2026-04-01', ipAddress: '45.33.105.78', browserFingerprint: 'Chrome-MacOS-SF' },
    { id: 'fb2', platform: 'facebook', username: 'ChinaManufacturers', displayName: 'China Manufacturers Hub', profileUrl: 'https://facebook.com/ChinaManufacturersHub', status: 'connected', followers: 8900, posts: 215, country: 'Germany', vpnProfile: 'vp-germany', vpnConnected: true, avatar: '🏭', lastPost: '1天前', bio: 'Direct factory sourcing for European buyers', connectedAt: '2026-04-05', ipAddress: '88.123.45.67', browserFingerprint: 'Firefox-Windows' },
    { id: 'x1', platform: 'x', username: '@lobster_sourcing', displayName: 'Lobster Sourcing 🦞', profileUrl: 'https://x.com/lobster_sourcing', status: 'connected', followers: 6800, posts: 1205, country: 'United States', vpnProfile: 'vp-usa', vpnConnected: true, avatar: '🦞', lastPost: '30分钟前', bio: 'B2B sourcing tips · China factory tours · Eco-products · #TradeWithChina', connectedAt: '2026-04-02', ipAddress: '45.33.105.78' },
    { id: 'x2', platform: 'x', username: '@chinatrade_io', displayName: 'China Trade.io', profileUrl: 'https://x.com/chinatrade_io', status: 'connected', followers: 3200, posts: 567, country: 'United Kingdom', vpnProfile: 'vp-uk', vpnConnected: true, avatar: '🇬🇧', lastPost: '5小时前', bio: 'Breaking news on China trade policy & B2B opportunities', connectedAt: '2026-04-10', ipAddress: '185.234.72.11' },
    { id: 'li1', platform: 'linkedin', username: 'lobster-global', displayName: 'Lobster Global Trading Co.', profileUrl: 'https://linkedin.com/company/lobster-global', status: 'connected', followers: 5600, posts: 89, country: 'United States', vpnProfile: 'vp-usa', vpnConnected: true, avatar: '🏢', lastPost: '2小时前', bio: 'Leading B2B sourcing platform for premium Chinese manufacturers. ISO certified. 500+ happy clients.', connectedAt: '2026-04-03', ipAddress: '45.33.105.78' },
    { id: 'li2', platform: 'linkedin', username: 'alice-zhang-export', displayName: 'Alice Zhang (张丽) — Export Director', profileUrl: 'https://linkedin.com/in/alice-zhang-export', status: 'connected', followers: 2100, posts: 45, country: 'Germany', vpnProfile: 'vp-germany', vpnConnected: true, avatar: '👩‍💼', lastPost: '1天前', bio: 'Export Director @ Lobster Global · 12 yrs in China-EU trade · MBA Heidelberg', connectedAt: '2026-04-08', ipAddress: '88.123.45.67' },
    { id: 'li3', platform: 'linkedin', username: 'bob-sourcing-eng', displayName: 'Bob Chen — Senior Sourcing Engineer', profileUrl: 'https://linkedin.com/in/bob-sourcing-eng', status: 'disconnected', followers: 890, posts: 12, country: 'Japan', vpnProfile: 'vp-japan', vpnConnected: false, avatar: '👨‍💻', lastPost: '2周前', bio: 'Sourcing Engineer specializing in aluminum & furniture hardware', connectedAt: '2026-03-20', ipAddress: '' },
    { id: 'ig1', platform: 'instagram', username: '@lobster.factory.tour', displayName: '🦞 Lobster Factory Tour', profileUrl: 'https://instagram.com/lobster.factory.tour', status: 'connected', followers: 18400, posts: 456, country: 'United States', vpnProfile: 'vp-usa', vpnConnected: true, avatar: '🏭', lastPost: '1小时前', bio: 'Behind-the-scenes factory tours · B2B sourcing made visual 🎥', connectedAt: '2026-04-04', ipAddress: '45.33.105.78' },
    { id: 'ig2', platform: 'instagram', username: '@eco_swimwear_china', displayName: 'Eco Swimwear China 🌿', profileUrl: 'https://instagram.com/eco_swimwear_china', status: 'connected', followers: 9800, posts: 234, country: 'Brazil', vpnProfile: 'vp-brazil', vpnConnected: true, avatar: '🌊', lastPost: '4小时前', bio: 'Sustainable swimwear from China · Recycled nylon · OEKO-TEX certified', connectedAt: '2026-04-06', ipAddress: '187.45.67.89' },
    { id: 'tt1', platform: 'tiktok', username: '@lobster_eco_swimwear', displayName: '🦞 Eco Swimwear Sourcing', profileUrl: 'https://tiktok.com/@lobster_eco_swimwear', status: 'connected', followers: 45200, posts: 328, country: 'United States', vpnProfile: 'vp-usa', vpnConnected: true, avatar: '🏖️', lastPost: '2小时前', bio: 'Factory direct prices on eco swimwear 🦞🇨🇳', connectedAt: '2026-04-01', ipAddress: '45.33.105.78' },
    { id: 'tt2', platform: 'tiktok', username: '@china_b2b_deals', displayName: '🇨🇳 China B2B Deals', profileUrl: 'https://tiktok.com/@china_b2b_deals', status: 'connected', followers: 22100, posts: 145, country: 'United Kingdom', vpnProfile: 'vp-uk', vpnConnected: true, avatar: '💼', lastPost: '6小时前', bio: 'Daily B2B sourcing deals from China factories', connectedAt: '2026-04-07', ipAddress: '185.234.72.11' },
    { id: 'wa1', platform: 'whatsapp', username: '+86-136-8888-9999', displayName: '🦞 Lobster B2B WhatsApp', profileUrl: 'https://wa.me/8613688889999', status: 'connected', followers: 0, posts: 0, country: 'China', vpnProfile: 'vp-china', vpnConnected: true, avatar: '📱', lastPost: '在线', bio: 'WhatsApp Business: B2B inquiries welcome · 回复快速', connectedAt: '2026-04-01', ipAddress: '119.3.45.67' },
    { id: 'ag1', platform: 'anygen', username: 'lobster_sales_bot', displayName: 'AnyGen 全能销售运营客服', profileUrl: 'https://www.anygen.io/assistant', status: 'connected', followers: 0, posts: 0, country: 'Global', vpnProfile: 'vp-global', vpnConnected: true, avatar: '🤖', lastPost: '实时在线', bio: 'AI Sales & Customer Service Bot · 多语言支持 · Auto-reply · Lead capture', connectedAt: '2026-04-01', ipAddress: '52.80.123.45' },
  ]);

  const [vpnProfiles, setVpnProfiles] = useState<VPNProfile[]>([
    { id: 'vp-usa', name: '🇺🇸 USA Matrix', country: 'United States', countryCode: 'US', city: 'Los Angeles', serverIp: '45.33.105.0/24', protocol: 'WireGuard', bandwidth: '10Gbps', status: 'active', connectedAccounts: 4, maxAccounts: 10, ipAddress: '45.33.105.78', load: 42, ping: 18 },
    { id: 'vp-uk', name: '🇬🇧 UK Matrix', country: 'United Kingdom', countryCode: 'GB', city: 'London', serverIp: '185.234.72.0/24', protocol: 'WireGuard', bandwidth: '5Gbps', status: 'active', connectedAccounts: 2, maxAccounts: 8, ipAddress: '185.234.72.11', load: 28, ping: 32 },
    { id: 'vp-germany', name: '🇩🇪 Germany Matrix', country: 'Germany', countryCode: 'DE', city: 'Frankfurt', serverIp: '88.123.45.0/24', protocol: 'OpenVPN', bandwidth: '8Gbps', status: 'active', connectedAccounts: 2, maxAccounts: 8, ipAddress: '88.123.45.67', load: 31, ping: 24 },
    { id: 'vp-brazil', name: '🇧🇷 Brazil Matrix', country: 'Brazil', countryCode: 'BR', city: 'São Paulo', serverIp: '187.45.67.0/24', protocol: 'WireGuard', bandwidth: '3Gbps', status: 'active', connectedAccounts: 1, maxAccounts: 5, ipAddress: '187.45.67.89', load: 22, ping: 180 },
    { id: 'vp-japan', name: '🇯🇵 Japan Matrix', country: 'Japan', countryCode: 'JP', city: 'Tokyo', serverIp: '103.56.78.0/24', protocol: 'Shadowsocks', bandwidth: '5Gbps', status: 'idle', connectedAccounts: 1, maxAccounts: 6, ipAddress: '103.56.78.90', load: 15, ping: 95 },
    { id: 'vp-china', name: '🇨🇳 China Matrix', country: 'China', countryCode: 'CN', city: 'Shanghai', serverIp: '119.3.45.0/24', protocol: 'Shadowsocks', bandwidth: '2Gbps', status: 'active', connectedAccounts: 1, maxAccounts: 4, ipAddress: '119.3.45.67', load: 35, ping: 8 },
    { id: 'vp-india', name: '🇮🇳 India Matrix', country: 'India', countryCode: 'IN', city: 'Mumbai', serverIp: '139.59.12.0/24', protocol: 'WireGuard', bandwidth: '3Gbps', status: 'idle', connectedAccounts: 0, maxAccounts: 6, ipAddress: '139.59.12.34', load: 8, ping: 142 },
    { id: 'vp-global', name: '🌐 Global CDN', country: 'Singapore', countryCode: 'SG', city: 'Singapore', serverIp: '52.80.123.0/24', protocol: 'WireGuard', bandwidth: '20Gbps', status: 'active', connectedAccounts: 1, maxAccounts: 20, ipAddress: '52.80.123.45', load: 55, ping: 5 },
  ]);

  const [matrixMessages, setMatrixMessages] = useState<MatrixMessage[]>([
    { id: '1', platform: 'whatsapp', content: 'Hi, interested in your eco swimwear MOQ and pricing for 5000 units', sentAt: '10:32', status: 'sent', recipient: '+1-305-555-0142' },
    { id: '2', platform: 'linkedin', content: 'Thanks for connecting! We specialize in aluminum extrusion for furniture...', sentAt: '09:45', status: 'sent', recipient: 'Hans Mueller' },
    { id: '3', platform: 'x', content: 'New factory tour: ISO-certified swimwear manufacturer in Guangdong 🇨🇳', sentAt: '08:15', status: 'sent', recipient: '@lobster_sourcing' },
    { id: '4', platform: 'instagram', content: 'Behind the scenes: our recycled nylon production line ♻️', sentAt: '07:30', status: 'sent', recipient: '@lobster.factory.tour' },
    { id: '5', platform: 'anygen', content: 'Hi! Here are our eco swimwear specs for your review: GRS certified, REPREVE® fabric', sentAt: '10:55', status: 'pending', recipient: 'Auto-reply Lead' },
  ]);

  const [matrixPostModal, setMatrixPostModal] = useState(false);
  const [vpnDetailModal, setVpnDetailModal] = useState(false);
  const [selectedVpn, setSelectedVpn] = useState<VPNProfile | null>(null);
  const [anygenModal, setAnygenModal] = useState(false);
  const [accountDetailModal, setAccountDetailModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<SocialAccount | null>(null);
  const [postContent, setPostContent] = useState('');
  const [postPlatforms, setPostPlatforms] = useState<string[]>([]);
  const [anygenQuery, setAnygenQuery] = useState('');
  const [anygenResponse, setAnygenResponse] = useState('');

  // ── Modal 状态 ───────────────────────────────────────────────────────────────
  const [geoModal, setGeoModal] = useState(false);
    const [skillModal, setSkillModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any>(null);
  const [skillTab, setSkillTab] = useState<'overview'|'module'|'search'|'run'|'config'|'chain'|'stats'>('overview');
  const [skillModuleFilter, setSkillModuleFilter] = useState<string>('all');
  const [skillSearch, setSkillSearch] = useState('');
  const [skillDetailTab, setSkillDetailTab] = useState<'run'|'config'|'chain'|'stats'>('run');
  const [skillExecutions, setSkillExecutions] = useState<SkillExecution[]>([
    { id: 'se-1', skillName: '智能选品分析师', skillIcon: '🔍', skillCat: '选品调研', status: 'running', progress: 67, startedAt: '12:31', duration: '2分34秒', input: '分析美国市场蓝牙耳机品类的机会与风险', output: '', agent: '探微军师' },
    { id: 'se-2', skillName: 'LinkedIn外贸获客全攻略', skillIcon: '💼', skillCat: '流量获客', status: 'queued', progress: 0, startedAt: '12:30', duration: '排队中', input: '找美国LED照明行业采购决策人并生成首封Connection消息', output: '', agent: '坎宫·营销虾' },
    { id: 'se-3', skillName: 'AI短视频脚本创作师', skillIcon: '🎬', skillCat: '内容创作', status: 'completed', progress: 100, startedAt: '12:25', duration: '1分18秒', input: '宠物饮水机TikTok带货视频脚本，目标受众为美国年轻女性', output: '✅ 已生成3个脚本版本，含黄金3秒开场+痛点共鸣结构，已复制到剪贴板', agent: '文案女史' },
    { id: 'se-4', skillName: '亚马逊广告投放与ACOS优化', skillIcon: '🎯', skillCat: '流量获客', status: 'completed', progress: 100, startedAt: '12:20', duration: '3分45秒', input: '优化女士连衣裙SP广告，ACOS从45%降至25%', output: '✅ ACOS优化方案已生成：降低bid 12%，添加长尾词组，目标ACOS 22%', agent: '坎宫·营销虾' },
    { id: 'se-5', skillName: '竞品情报追踪师', skillIcon: '🔬', skillCat: '选品调研', status: 'failed', progress: 0, startedAt: '12:15', duration: '0分12秒', input: '监控竞品ASIN B0XXXXXX', output: '', agent: '探微军师', error: 'API请求超时，请检查网络或重试' },
  ]);
  const [skillChains, setSkillChains] = useState<SkillChain[]>([
    { id: 'sc-1', name: '爆款选品+Listing上架流水线', skills: [{ name: '智能选品分析师', icon: '🔍', params: '自动提取TOP3' }, { name: '亚马逊Listing优化专家', icon: '🛒', params: '自动生成' }, { name: 'PixieDream商业广告级AI修图', icon: '✨', params: '主图×5' }], status: 'active', runCount: 28, lastRun: '今日 12:00', description: '选品→Listing生成→主图制作全自动' },
    { id: 'sc-2', name: '红人建联+内容分发自动化', skills: [{ name: 'TikTok+Instagram红人营销', icon: '🌟', params: '筛选TOP50' }, { name: 'AI短视频脚本创作师', icon: '🎬', params: '批量生成10个' }, { name: '外贸邮件开发信创作师', icon: '✉️', params: '个性化模板' }], status: 'active', runCount: 15, lastRun: '今日 11:30', description: '红人筛选→脚本生成→开发信群发' },
    { id: 'sc-3', name: '广告投放全链路优化', skills: [{ name: '亚马逊广告投放与ACOS优化', icon: '🎯', params: 'SP+SB组合' }, { name: '竞品评论区挖掘师', icon: '💬', params: '提取卖点差异' }, { name: '转化率CRO专项优化师', icon: '📊', params: '生成报告' }], status: 'draft', runCount: 7, lastRun: '昨日 18:20', description: '广告分析→竞品挖掘→转化优化' },
  ]);
  const [skillUsageStats] = useState<SkillUsageStat[]>([
    { skillName: '智能选品分析师', totalUse: 2847, successRate: 98, avgDuration: '2分12秒', lastUsed: '今日 12:31', category: '选品调研' },
    { skillName: 'AI短视频脚本创作师', totalUse: 2108, successRate: 97, avgDuration: '1分08秒', lastUsed: '今日 12:25', category: '内容创作' },
    { skillName: 'LinkedIn外贸获客全攻略', totalUse: 1643, successRate: 92, avgDuration: '3分30秒', lastUsed: '今日 12:30', category: '流量获客' },
    { skillName: '亚马逊广告投放与ACOS优化', totalUse: 1956, successRate: 94, avgDuration: '3分45秒', lastUsed: '今日 12:20', category: '流量获客' },
    { skillName: '竞品情报追踪师', totalUse: 1532, successRate: 89, avgDuration: '0分45秒', lastUsed: '今日 12:15', category: '选品调研' },
    { skillName: 'PixieDream商业广告级AI修图', totalUse: 1245, successRate: 96, avgDuration: '0分38秒', lastUsed: '今日 11:50', category: '内容创作' },
    { skillName: '亚马逊Listing优化专家', totalUse: 1890, successRate: 95, avgDuration: '2分20秒', lastUsed: '今日 11:40', category: '内容创作' },
    { skillName: 'TikTok+Instagram红人营销', totalUse: 987, successRate: 91, avgDuration: '4分15秒', lastUsed: '今日 11:30', category: '流量获客' },
    { skillName: 'Google+Meta双平台广告投放', totalUse: 756, successRate: 88, avgDuration: '5分02秒', lastUsed: '昨日 16:20', category: '流量获客' },
    { skillName: '品牌故事策划师', totalUse: 543, successRate: 93, avgDuration: '3分55秒', lastUsed: '昨日 14:10', category: '品牌管理' },
  ]);
  const [runningSkillId, setRunningSkillId] = useState<string | null>(null);
  const [skillInput, setSkillInput] = useState('');
  const [editingChain, setEditingChain] = useState<SkillChain | null>(null);
  const [chainName, setChainName] = useState('');

  const [flipbookModal, setFlipbookModal] = useState(false);
  const [sopModal, setSopModal] = useState(false);
  const [tiktokModal, setTikTokModal] = useState(false);
  const [productModal, setProductModal] = useState(false);
  const [toolModal, setToolModal] = useState(false);
  const [agentModal, setAgentModal] = useState(false);
  const [newGeoKeyword, setNewGeoKeyword] = useState('');
  const [newFlipbookTitle, setNewFlipbookTitle] = useState('');
  const [newFlipbookUrl, setNewFlipbookUrl] = useState('');
  const [selectedSOP, setSelectedSOP] = useState<string>('');
  const [selectedTool, setSelectedTool] = useState<ToolConfig | null>(null);
  const [toolDetailModal, setToolDetailModal] = useState(false);
  const [toolApiKeys, setToolApiKeys] = useState<Record<string, string>>({});
  const [toolTab, setToolTab] = useState<'overview' | 'api' | 'stats'>('overview');

  const handleOpenToolDetail = (tool: ToolConfig) => {
    setSelectedTool(tool);
    setToolDetailModal(true);
    setToolTab('overview');
    addToast(`⚙️ 正在加载 ${tool.name} 配置面板…`, 'info');
  };

  const handleToolQuickAction = (tool: ToolConfig, action: string) => {
    if (action === 'ltx') { setFlipbookModal(true); setToolDetailModal(false); addToast('🎨 正在启动 LTX 视频生成器…', 'info'); }
    else if (action === 'nano') { setFlipbookModal(true); setToolDetailModal(false); addToast('🖼️ 正在启动 Nano Banana Pro…', 'info'); }
    else if (action === 'flipbook') { setFlipbookModal(true); setToolDetailModal(false); addToast('📖 正在启动 Flipbook Studio…', 'info'); }
    else if (action === 'geo') { setActiveTab('b2b'); setToolDetailModal(false); addToast('🌍 正在跳转到 GEO 关键词管理…', 'info'); }
    else if (action === 'agentic') { setAgentModal(true); setToolDetailModal(false); addToast('🔍 正在启动 Agentic Search…', 'info'); }
    else if (action === 'octopus') { handleConnectTool(tool); addToast('🐸 八爪鱼RPA 连接中…', 'info'); }
    else if (action === 'anygen') { setAnygenModal(true); setToolDetailModal(false); addToast('🤖 正在启动 AnyGen 助手…', 'info'); }
    else if (action === 'pixie') { setFlipbookModal(true); setToolDetailModal(false); addToast('✨ 正在启动 PixieDream 修图…', 'info'); }
    else if (action === 'social') { setActiveTab('matrix'); setToolDetailModal(false); addToast('📱 正在跳转到社媒矩阵…', 'info'); }
    else if (action === 'dashboard') { addToast(`📊 正在打开 ${tool.name} 数据面板…`, 'info'); }
    else if (action === 'settings') { setToolTab('api'); addToast(`⚙️ 正在打开 ${tool.name} API 设置…`, 'info'); }
    else if (action === 'history') { setToolTab('stats'); addToast(`📈 正在加载 ${tool.name} 使用记录…`, 'info'); }
    else if (action === 'connect') { handleConnectTool(tool); }
    else { addToast(`⚡ 执行 ${action}…`, 'info'); }
  };
  const [runningAnimation, setRunningAnimation] = useState(false);

  // ── 太极八卦 Canvas 动画 ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab !== 'cluster') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let angle = 0;
    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const cx = canvas.width / 2, cy = canvas.height / 2, r = Math.min(cx, cy) * 0.78;
      ctx.beginPath(); ctx.arc(cx, cy, r + 25, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148,163,184,0.08)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(148,163,184,0.15)'; ctx.lineWidth = 1.5; ctx.stroke();
      // 阴阳鱼
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(148,163,184,0.04)'; ctx.fill();
      ctx.beginPath(); ctx.arc(cx + Math.cos(angle) * r * 0.35, cy - Math.sin(angle) * r * 0.35, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
      CLUSTER_NODES.forEach((node, i) => {
        const na = angle + (i * Math.PI * 2) / 8;
        const nx = cx + Math.cos(na) * r, ny = cy + Math.sin(na) * r, nr = 26;
        const cm: Record<string, string> = { cyan:'#06b6d4', violet:'#8b5cf6', pink:'#ec4899', amber:'#f59e0b', emerald:'#10b981', red:'#ef4444', slate:'#64748b', sky:'#0ea5e9' };
        const col = cm[node.color] || '#06b6d4';
        const g = ctx.createRadialGradient(nx, ny, 0, nx, ny, nr + 12);
        g.addColorStop(0, col + '50'); g.addColorStop(1, col + '00');
        ctx.beginPath(); ctx.arc(nx, ny, nr + 12, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(nx, ny, nr, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a'; ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = col; ctx.font = 'bold 11px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(node.palace.replace('宫', ''), nx, ny - 3);
        ctx.font = '8px sans-serif'; ctx.fillStyle = '#94a3b8';
        ctx.fillText(`${node.hexagrams}卦`, nx, ny + 10);
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(cx, cy);
        ctx.strokeStyle = col + '12'; ctx.lineWidth = 1; ctx.stroke();
      });
      angle += 0.004; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [activeTab]);

  // ── 实时任务模拟 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => {
      setAgentTasks(prev => prev.map(t => {
        if (t.status === 'working' && t.progress < 100) {
          const inc = Math.random() * 8 + 2;
          return { ...t, progress: Math.min(100, t.progress + inc) };
        }
        if (t.status === 'idle' && Math.random() > 0.7) {
          return { ...t, status: 'working' as const, progress: 0 };
        }
        return t;
      }));
      setTaskQueue(prev => prev.map(t => {
        if (t.status === 'running' && Math.random() > 0.6) {
          const idx = prev.indexOf(t);
          if (idx < prev.length - 1 && prev[idx + 1].status === 'queued') {
            return { ...t, status: 'done' as const, duration: '已完成' };
          }
        }
        return t;
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // ── 动作函数 ─────────────────────────────────────────────────────────────────
  const handleAddGeoKeyword = async () => {
    if (!newGeoKeyword.trim()) { addToast('请输入关键词', 'error'); return; }
    await delay(800);
    setGeoKeywords(prev => [...prev, {
      id: Date.now().toString(), keyword: newGeoKeyword.trim(),
      engine: 'Perplexity', rank: 'TOP50', trend: 'stable', views: 0, status: 'pending'
    }]);
    setNewGeoKeyword('');
    setGeoModal(false);
    addToast(`✅ 关键词"${newGeoKeyword.trim()}"已提交AI分析队列`, 'success');
  };

  const handleCreateFlipbook = async () => {
    if (!newFlipbookTitle.trim() || !newFlipbookUrl.trim()) { addToast('请填写完整信息', 'error'); return; }
    await delay(1200);
    setFlipbooks(prev => [...prev, {
      id: Date.now().toString(), url: newFlipbookUrl.trim(), title: newFlipbookTitle.trim(),
      category: 'B2B产品', views: 0, created: new Date().toISOString().slice(0, 10), status: 'draft'
    }]);
    setNewFlipbookTitle(''); setNewFlipbookUrl('');
    setFlipbookModal(false);
    addToast('📖 Flipbook创建成功，正在生成视觉内容…', 'success');
  };

  const handleStartSOP = async (sopId: string) => {
    await delay(600);
    const sopData: Record<string, { name: string; steps: string[]; type: 'B2B' | 'B2C' }> = {
      'SOP-B2B-001': { name: '外贸询盘转化闭环', steps: ['GEO霸屏', '意图识别', '内容触达', 'Flipbook展示', 'SOP跟进', '成交'], type: 'B2B' },
      'SOP-B2C-001': { name: 'TikTok爆款打造', steps: ['选品调研', '内容生成', '矩阵分发', '数据复盘', '爆款复制', '规模化'], type: 'B2C' },
      'SOP-GEO-001': { name: 'AI搜索霸屏计划', steps: ['关键词挖掘', '内容布局', 'Prompt优化', 'Citation监测', '排名提升', '流量承接'], type: 'B2B' },
      'SOP-AUTO-001': { name: 'OpenClaw全自动化', steps: ['OpenSpace学习', 'Agent编排', '任务分发', 'Heartbeat监控', 'ClawTip结算', '数字永生'], type: 'B2C' },
    };
    const data = sopData[sopId];
    if (!data) return;
    const exec: SOPExecution = { id: Date.now().toString(), name: data.name, type: data.type, progress: 0, currentStep: 0, status: 'running', steps: data.steps };
    setSopExecutions(prev => [exec, ...prev]);
    setRunningAnimation(true);
    addToast(`🚀 SOP"${data.name}"启动，机器人矩阵开始执行…`, 'success');
    // 模拟执行进度
    for (let p = 0; p <= 100; p += Math.random() * 10 + 5) {
      await delay(500);
      setSopExecutions(prev => prev.map(e => e.id === exec.id ? {
        ...e, progress: Math.min(100, p), currentStep: Math.min(Math.floor(p / 100 * e.steps.length), e.steps.length - 1)
      } : e));
    }
    setSopExecutions(prev => prev.map(e => e.id === exec.id ? { ...e, status: 'completed' as const, progress: 100 } : e));
    setRunningAnimation(false);
    addToast(`🎉 SOP"${data.name}"执行完成！`, 'success');
  };

  const handleToggleTikTok = async (id: string) => {
    await delay(400);
    setTikTokAccounts(prev => prev.map(a => a.id === id ? {
      ...a, status: a.status === 'running' ? 'paused' : 'running'
    } : a));
    const acc = tiktokAccounts.find(a => a.id === id);
    addToast(`${acc?.status === 'running' ? '⏸️' : '▶️'} @${acc?.name?.replace('@', '')} ${acc?.status === 'running' ? '已暂停' : '已启动'}`, 'success');
  };

  const handlePublishProduct = async (id: string) => {
    await delay(1000);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, status: 'published' } : p));
    addToast('📦 商品已提交平台审核', 'success');
  };

  const handleConnectTool = async (tool: ToolConfig) => {
    await delay(800);
    setToolConfigs(prev => prev.map(t => t.id === tool.id || t.name === tool.name ? { ...t, status: 'connected' as const, usageCount: t.id === tool.id || t.name === tool.name ? (tool.usageCount || 0) : t.usageCount } : t));
    addToast(`✅ ${tool.name} 连接成功！API配置已就绪`, 'success');
  };

  const handleRefreshAgent = async (id: string) => {
    await delay(600);
    setAgentTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'working' as const, progress: 0 } : t));
    addToast(`🤖 ${agentTasks.find(a => a.id === id)?.agent} 开始执行新任务…`, 'success');
  };

  // ── 社媒矩阵动作函数 ─────────────────────────────────────────────────────────
  const handleConnectSocial = async (accountId: string, vpnId: string) => {
    const acc = socialAccounts.find(a => a.id === accountId);
    if (!acc) return;
    await delay(1500);
    const vpn = vpnProfiles.find(v => v.id === vpnId);
    const newIp = vpn?.ipAddress.split('.').slice(0,3).join('.') + '.' + (100 + Math.floor(Math.random() * 150));
    setSocialAccounts(prev => prev.map(a => a.id === accountId ? {
      ...a, status: 'connected' as const, vpnProfile: vpnId,
      vpnConnected: true, ipAddress: newIp, connectedAt: new Date().toISOString().slice(0,10)
    } : a));
    setVpnProfiles(prev => prev.map(v => v.id === vpnId ? { ...v, connectedAccounts: v.connectedAccounts + 1 } : v));
    addToast(`✅ ${acc.platform.toUpperCase()} @${acc.username} 已通过VPN ${vpn?.name} 连接，IP: ${newIp}`, 'success');
  };

  const handleDisconnectSocial = async (accountId: string) => {
    const acc = socialAccounts.find(a => a.id === accountId);
    if (!acc) return;
    await delay(600);
    setVpnProfiles(prev => prev.map(v => v.id === acc.vpnProfile ? { ...v, connectedAccounts: Math.max(0, v.connectedAccounts - 1) } : v));
    setSocialAccounts(prev => prev.map(a => a.id === accountId ? { ...a, status: 'disconnected' as const, vpnConnected: false, ipAddress: '' } : a));
    addToast(`🔌 @${acc.username} 已断开连接`, 'success');
  };

  const handleSwitchVpn = async (accountId: string, newVpnId: string) => {
    const acc = socialAccounts.find(a => a.id === accountId);
    const newVpn = vpnProfiles.find(v => v.id === newVpnId);
    if (!acc || !newVpn) return;
    await delay(800);
    setVpnProfiles(prev => prev.map(v => {
      if (v.id === acc.vpnProfile) return { ...v, connectedAccounts: Math.max(0, v.connectedAccounts - 1) };
      if (v.id === newVpnId) return { ...v, connectedAccounts: v.connectedAccounts + 1 };
      return v;
    }));
    const newIp = newVpn.ipAddress.split('.').slice(0,3).join('.') + '.' + (100 + Math.floor(Math.random() * 150));
    setSocialAccounts(prev => prev.map(a => a.id === accountId ? { ...a, vpnProfile: newVpnId, ipAddress: newIp } : a));
    addToast(`🔄 @${acc.username} 已切换到 ${newVpn.name} · IP: ${newIp}`, 'success');
  };

  const handlePostToMatrix = async () => {
    if (!postContent.trim() || postPlatforms.length === 0) { addToast('请输入内容并选择至少一个平台', 'error'); return; }
    await delay(1200);
    const newMsgs: MatrixMessage[] = postPlatforms.map(p => ({
      id: Date.now().toString() + p, platform: p as SocialAccount['platform'],
      content: postContent, sentAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent', recipient: p === 'whatsapp' ? '+1-305-555-0142' : socialAccounts.find(a => a.platform === p)?.username || p
    }));
    setMatrixMessages(prev => [...newMsgs, ...prev]);
    if (postPlatforms.includes('anygen')) {
      setAnygenResponse(`🤖 AnyGen AI 已自动生成分平台内容适配：\n\n📱 WhatsApp: 精简版消息已发送\n🔗 LinkedIn: 专业版帖子已发布（含CTA）\n🐦 X/Twitter: 带话题标签版本已发布\n📸 Instagram: Reels描述 + 故事文案已准备\n\n预计触达: ${postPlatforms.length * 2800}+ 潜在客户`);
    }
    setPostContent(''); setPostPlatforms([]); setMatrixPostModal(false);
    addToast(`📤 已同步发布到 ${postPlatforms.length} 个平台`, 'success');
  };

  const handleAnygenQuery = async () => {
    if (!anygenQuery.trim()) { addToast('请输入咨询内容', 'error'); return; }
    setAnygenResponse('🤖 AnyGen 正在分析并生成回复...');
    await delay(2000);
    const responses = [
      `✅ 已为您查询「${anygenQuery}」相关供应商信息：\n\n🏭 匹配工厂: 3家（广东·浙江·江苏）\n💰 参考FOB价格: $2.8-4.5/unit（MOQ 500起）\n📋 认证情况: GRS / OEKO-TEX / BSCI\n🚢 交货周期: 25-35天\n\n是否需要我为您生成询盘模板并发送？`,
      `📊 AnyGen AI 分析结果：\n\n关于「${anygenQuery}」的市场趋势：\n• 近30天询盘量 +23%\n• 主要买家来源: 美国、英国、德国\n• 建议报价区间: CIF +5% 竞争优势\n• 竞品平均价格: $3.2/unit\n\n生成报价单请回复「生成报价」`,
      `🤝 AnyGen 已为您准备回复话术：\n\n尊敬的${anygenQuery.includes('price') ? '买家' : '客户'}，\n感谢您的询盘！我们是Lobster Global Trading Co.，专注${anygenQuery.includes('swimwear') ? '环保泳装' : '工业铝材'}出口${anygenQuery.includes('MOQ') ? '12年' : '8年'}。\n\n附上最新产品目录（PDF）和工厂视频。\n请问您的目标市场和数量是？\n\nBest regards,\nAlice Zhang\nExport Director`,
    ];
    setAnygenResponse(responses[Math.floor(Math.random() * responses.length)]);
    addToast('🤖 AnyGen AI 回复已生成', 'success');
  };

  const handleToggleVpn = async (vpnId: string) => {
    await delay(600);
    setVpnProfiles(prev => prev.map(v => v.id === vpnId ? { ...v, status: v.status === 'active' ? 'idle' : 'active' } : v));
    const vp = vpnProfiles.find(v => v.id === vpnId);
    addToast(`${vp?.status === 'active' ? '⏸️' : '▶️'} VPN ${vp?.name} 已${vp?.status === 'active' ? '停用' : '启用'}`, 'success');
  };

  // ── 技能执行 ──────────────────────────────────────────────────────────────────
  const handleRunSkill = (skill: any, input: string) => {
    const id = 'se-' + Date.now();
    const newExec: SkillExecution = {
      id, skillName: skill.name, skillIcon: skill.icon, skillCat: skill.cat || '通用',
      status: 'running', progress: 0,
      startedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      duration: '0分00秒', input: input || skill.desc || '启动技能', output: '', agent: '探微军师',
    };
    setSkillExecutions(prev => [newExec, ...prev]);
    setRunningSkillId(id);
    setSkillModal(false);
    addToast(`🧠 「${skill.name}」技能已启动，正在执行...`, 'info');
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setSkillExecutions(prev => prev.map(e => e.id === id ? {
          ...e, progress: 100, status: 'completed',
          duration: `${Math.floor(progress / 10)}分${Math.floor((progress % 10) * 6)}秒`,
          output: `✅ 「${skill.name}」执行完成！

📋 任务摘要：
${input || skill.desc}

🎯 AI建议：
已根据您的输入生成了完整的解决方案。点击「查看详情」了解更多执行结果和后续操作步骤。`,
        } : e));
        setRunningSkillId(null);
        addToast(`✅ 「${skill.name}」执行完成！`, 'success');
      } else {
        setSkillExecutions(prev => prev.map(e => e.id === id ? {
          ...e, progress,
          status: 'running',
          duration: `${Math.floor(progress / 10)}分${Math.floor((progress % 10) * 6)}秒`,
        } : e));
      }
    }, 800);
  };

  const handleRunChain = (chain: SkillChain) => {
    setSkillChains(prev => prev.map(c => c.id === chain.id ? { ...c, runCount: c.runCount + 1, lastRun: '刚刚' } : c));
    addToast(`⚡ 技能链「${chain.name}」已启动，共${chain.skills.length}个技能`, 'info');
    chain.skills.forEach((s, i) => {
      setTimeout(() => {
        const execId = 'se-' + Date.now() + i;
        setSkillExecutions(prev => [{
          id: execId, skillName: s.name, skillIcon: s.icon, skillCat: '技能链',
          status: 'running', progress: 0,
          startedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          duration: '0分00秒', input: s.params, output: '', agent: chain.name,
        }, ...prev]);
        let p = 0;
        const iv = setInterval(() => {
          p += Math.random() * 30 + 15;
          if (p >= 100) { p = 100; clearInterval(iv); }
          setSkillExecutions(prev => prev.map(e => e.id === execId ? {
            ...e, progress: p,
            status: p >= 100 ? 'completed' : 'running',
            duration: `${Math.floor(p / 10)}分${Math.floor((p % 10) * 6)}秒`,
            output: p >= 100 ? `✅ 「${s.name}」完成（来自技能链：${chain.name}）` : '',
          } : e));
        }, 600);
      }, i * 2000);
    });
  };

  const handleCreateChain = () => {
    if (!chainName.trim() || !editingChain) return;
    const newChain: SkillChain = {
      id: 'sc-' + Date.now(), name: chainName, skills: editingChain.skills,
      status: 'draft', runCount: 0, lastRun: '从未', description: '自定义技能链',
    };
    setSkillChains(prev => [...prev, newChain]);
    setEditingChain(null); setChainName('');
    addToast(`✅ 技能链「${chainName}」创建成功`, 'success');
  };

  const handleDeleteChain = (chainId: string) => {
    setSkillChains(prev => prev.filter(c => c.id !== chainId));
    addToast('🗑️ 技能链已删除', 'success');
  };

  const platformConfig: Record<string, { icon: string; name: string; color: string; bg: string; border: string; url: string }> = {
    facebook: { icon: 'f', name: 'Facebook', color: '#1877F2', bg: 'rgba(24,119,242,0.1)', border: 'rgba(24,119,242,0.3)', url: 'https://facebook.com' },
    x: { icon: '𝕏', name: 'X / Twitter', color: '#000000', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', url: 'https://x.com' },
    linkedin: { icon: 'in', name: 'LinkedIn', color: '#0A66C2', bg: 'rgba(10,102,194,0.1)', border: 'rgba(10,102,194,0.3)', url: 'https://linkedin.com' },
    instagram: { icon: '📷', name: 'Instagram', color: '#E4405F', bg: 'rgba(228,64,95,0.1)', border: 'rgba(228,64,95,0.3)', url: 'https://instagram.com' },
    tiktok: { icon: '♪', name: 'TikTok', color: '#000000', bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.2)', url: 'https://tiktok.com' },
    whatsapp: { icon: '💬', name: 'WhatsApp', color: '#25D366', bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.3)', url: 'https://whatsapp.com' },
    anygen: { icon: '🤖', name: 'AnyGen AI', color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', url: 'https://www.anygen.io/assistant' },
  };

  // ── Tab 配置 ─────────────────────────────────────────────────────────────────
  const tabs: { id: SystemTab; label: string; icon: string; color: string }[] = [
    { id: 'overview', label: '系统总览', icon: '🌐', color: 'cyan' },
    { id: 'b2b', label: '外贸B2B获客', icon: '🌍', color: 'cyan' },
    { id: 'b2c', label: '跨境电商B2C', icon: '🛒', color: 'emerald' },
    { id: 'matrix', label: '社媒矩阵', icon: '📱', color: 'sky' },
    { id: 'cluster', label: '龙虾集群可视化', icon: '🦞', color: 'amber' },
    { id: 'tools', label: '工具矩阵', icon: '⚙️', color: 'violet' },
    { id: 'sop', label: 'SOP流程库', icon: '📋', color: 'pink' },
    { id: 'skills', label: 'AI技能库', icon: '🧠', color: 'orange' },
  ];

  const colorMap: Record<string, string> = {
    cyan: 'rgba(6,182,212,0.12)', emerald: 'rgba(16,185,129,0.12)', amber: 'rgba(245,158,11,0.12)',
    violet: 'rgba(139,92,246,0.12)', pink: 'rgba(236,72,153,0.12)', red: 'rgba(239,68,68,0.12)',
    slate: 'rgba(100,116,139,0.12)', sky: 'rgba(14,165,233,0.12)',
  };
  const borderMap: Record<string, string> = {
    cyan: 'rgba(6,182,212,0.3)', emerald: 'rgba(16,185,129,0.3)', amber: 'rgba(245,158,11,0.3)',
    violet: 'rgba(139,92,246,0.3)', pink: 'rgba(236,72,153,0.3)',
  };
  const textColorMap: Record<string, string> = {
    cyan: '#67e8f9', emerald: '#6ee7b7', amber: '#fcd34d',
    violet: '#c4b5fd', pink: '#f9a8d4',
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-white overflow-hidden relative">
      <ToastContainer />

      {/* ── 顶部标题栏 ───────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🦞</span>
              <span>跨境龙虾社 · OpenClaw获客运营系统</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-normal">外贸B2B + 跨境电商B2C</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">龙虾集群太极64卦 · 真正实现跨境获客留客机器人自动化运营</p>
          </div>
            <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>机器人在线 · 64卦全开</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">📱 {socialAccounts.filter(a => a.status === 'connected').length}/{socialAccounts.length} 社媒在线</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">⚡ {sopExecutions.filter(s => s.status === 'running').length} SOP运行中</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 标签导航 ───────────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-6 py-3 bg-slate-950/50 border-b border-slate-800/50">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'text-white shadow-sm'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={activeTab === tab.id ? { backgroundColor: colorMap[tab.color] || 'rgba(6,182,212,0.12)', borderColor: borderMap[tab.color] || 'rgba(6,182,212,0.3)', color: textColorMap[tab.color] || '#67e8f9' } : {}}>
              <span>{tab.icon}</span><span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 主内容区 ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5">

        {/* ══════════════ 系统总览 ══════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* 实时运行指标 */}
            <div className="grid grid-cols-5 gap-3">
              {[
                { label: '在线Agent', value: '64', icon: '🤖', color: 'cyan', sub: '8宫×8卦', extra: `${agentTasks.filter(a => a.status === 'working').length}工作中` },
                { label: '任务队列', value: `${taskQueue.length}`, icon: '📋', color: 'violet', sub: '自动化调度', extra: `${taskQueue.filter(t => t.status === 'running').length}运行中` },
                { label: 'GEO关键词', value: `${geoKeywords.length}`, icon: '🌐', color: 'amber', sub: 'AI搜索引擎', extra: `${geoKeywords.filter(g => g.status === 'active').length}生效中` },
                { label: 'Flipbook', value: `${flipbooks.length}`, icon: '📖', color: 'pink', sub: '视觉导流', extra: `${flipbooks.reduce((a, b) => a + b.views, 0).toLocaleString()} 总浏览` },
                { label: 'TikTok矩阵', value: `${tiktokAccounts.length}`, icon: '🎬', color: 'emerald', sub: '自动化运营', extra: `${tiktokAccounts.filter(a => a.status === 'running').length}运行中` },
              ].map(m => (
                <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-center hover:border-cyan-500/20 transition-all cursor-pointer group"
                  onClick={() => m.label.includes('GEO') ? setActiveTab('b2b') : m.label.includes('Flipbook') ? setActiveTab('b2b') : m.label.includes('TikTok') ? setActiveTab('b2c') : setActiveTab('cluster')}>
                  <div className="text-lg mb-1">{m.icon}</div>
                  <div className={`text-2xl font-bold text-${m.color}-400 group-hover:scale-110 transition-transform`}>{m.value}</div>
                  <div className="text-xs font-semibold text-white mt-0.5">{m.label}</div>
                  <div className="text-[10px] text-slate-500">{m.sub}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{m.extra}</div>
                </div>
              ))}
            </div>

            {/* Agent实时工作状态 */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🤖</span> 智能体实时工作状态
                  <span className="text-[10px] text-emerald-400 animate-pulse">● LIVE</span>
                </div>
                <button onClick={() => setAgentModal(true)} className="text-[10px] px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/50">
                  全部任务 →
                </button>
              </div>
              <div className="space-y-2">
                {agentTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      task.status === 'working' ? 'bg-cyan-500/20 text-cyan-400' : task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                    }`}>{task.palace}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{task.agent}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">{task.task}</span>
                      </div>
                      <ProgressBar value={task.progress} color={task.status === 'done' ? 'bg-emerald-400' : task.status === 'working' ? 'bg-cyan-400' : 'bg-slate-600'} />
                    </div>
                    <div className="text-[10px] text-slate-400 w-10 text-right">{Math.round(task.progress)}%</div>
                    {task.status === 'idle' && (
                      <button onClick={() => handleRefreshAgent(task.id)} className="text-[9px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">启动</button>
                    )}
                    {task.status === 'working' && <span className="text-xs animate-pulse">⚡</span>}
                    {task.status === 'done' && <span className="text-xs text-emerald-400">✓</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* 自动化任务队列 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 to-slate-900/80 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                    <span>🌍</span> 外贸B2B获客系统
                  </div>
                  <button onClick={() => setActiveTab('b2b')} className="text-xs px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">进入 →</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[['GEO关键词', `${geoKeywords.length}`, 'cyan'], ['Flipbook', `${flipbooks.length}`, 'pink'], ['SOP流程', '4', 'amber']].map(([l, v, c]) => (
                    <div key={l as string} className="text-center rounded-lg bg-slate-800/60 p-2 border border-slate-700/40">
                      <div className={`text-lg font-bold text-${c}-400`}>{v}</div>
                      <div className="text-[9px] text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setGeoModal(true)} className="w-full py-2 rounded-lg bg-cyan-600/20 text-cyan-400 text-xs font-medium hover:bg-cyan-600/30 transition-colors border border-cyan-500/20 mb-2">
                  + 添加GEO关键词
                </button>
                <button onClick={() => setFlipbookModal(true)} className="w-full py-2 rounded-lg bg-pink-600/20 text-pink-400 text-xs font-medium hover:bg-pink-600/30 transition-colors border border-pink-500/20">
                  + 创建Flipbook
                </button>
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-900/80 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                    <span>🛒</span> 跨境电商B2C系统
                  </div>
                  <button onClick={() => setActiveTab('b2c')} className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">进入 →</button>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[['TikTok矩阵', `${tiktokAccounts.length}`, 'pink'], ['商品SKU', `${products.length}`, 'emerald'], ['日任务', '200+', 'amber']].map(([l, v, c]) => (
                    <div key={l as string} className="text-center rounded-lg bg-slate-800/60 p-2 border border-slate-700/40">
                      <div className={`text-lg font-bold text-${c}-400`}>{v}</div>
                      <div className="text-[9px] text-slate-500">{l}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTikTokModal(true)} className="w-full py-2 rounded-lg bg-emerald-600/20 text-emerald-400 text-xs font-medium hover:bg-emerald-600/30 transition-colors border border-emerald-500/20 mb-2">
                  + 管理TikTok矩阵
                </button>
                <button onClick={() => setProductModal(true)} className="w-full py-2 rounded-lg bg-amber-600/20 text-amber-400 text-xs font-medium hover:bg-amber-600/30 transition-colors border border-amber-500/20">
                  + 添加商品SKU
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ 外贸B2B获客 ══════════════ */}
        {activeTab === 'b2b' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🌍</span>
                <div>
                  <h2 className="text-lg font-bold text-white">外贸B2B获客运营系统</h2>
                  <p className="text-xs text-slate-500">GEO霸屏 + Flipbook导流 + SOP自动化闭环</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setGeoModal(true)} className="text-xs px-4 py-2 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600/30 transition-colors flex items-center gap-1.5">
                  <span>+</span> 添加GEO关键词
                </button>
                <button onClick={() => setFlipbookModal(true)} className="text-xs px-4 py-2 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/20 hover:bg-pink-600/30 transition-colors flex items-center gap-1.5">
                  <span>+</span> 创建Flipbook
                </button>
              </div>
            </div>

            {/* GEO关键词管理面板 */}
            <div className="rounded-xl border border-cyan-500/20 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-cyan-300 flex items-center gap-2">
                  <span>🌐</span> GEO关键词矩阵
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{geoKeywords.length} 关键词</span>
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="text-emerald-400">↑ 上升</span>
                  <span className="text-amber-400">→ 稳定</span>
                  <span className="text-red-400">↓ 下降</span>
                </div>
              </div>
              <div className="space-y-2">
                {geoKeywords.map(kw => (
                  <div key={kw.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40 hover:border-cyan-500/20 transition-all group">
                    <div className={`w-16 text-center rounded-lg py-1 text-[10px] font-bold border ${
                      kw.rank.startsWith('TOP1') ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      kw.rank.startsWith('TOP3') ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                      kw.rank.startsWith('TOP5') ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                      'bg-slate-700 text-slate-400 border-slate-600'
                    }`}>{kw.rank}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-200 font-medium truncate">{kw.keyword}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{kw.engine} · {kw.views.toLocaleString()} 搜索量/月</div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className={kw.trend === 'up' ? 'text-emerald-400' : kw.trend === 'down' ? 'text-red-400' : 'text-amber-400'}>
                        {kw.trend === 'up' ? '↑' : kw.trend === 'down' ? '↓' : '→'}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${kw.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {kw.status === 'active' ? '生效中' : '分析中'}
                      </span>
                    </div>
                    <button onClick={() => { setGeoKeywords(prev => prev.filter(k => k.id !== kw.id)); addToast(`关键词"${kw.keyword}"已删除`, 'success'); }}
                      className="opacity-0 group-hover:opacity-100 text-[9px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all">
                      删除
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Flipbook管理 */}
            <div className="rounded-xl border border-pink-500/20 bg-slate-900/80 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-bold text-pink-300 flex items-center gap-2">
                  <span>📖</span> Flipbook视觉导流
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{flipbooks.reduce((a, b) => a + b.views, 0).toLocaleString()} 总浏览</span>
                </div>
                <button onClick={() => setFlipbookModal(true)} className="text-xs px-3 py-1.5 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/20 hover:bg-pink-600/30 transition-colors">+ 新建</button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {flipbooks.map(fb => (
                  <div key={fb.id} className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4 hover:border-pink-500/30 transition-all group">
                    <div className="w-full h-24 rounded-lg bg-gradient-to-br from-pink-900/30 to-violet-900/30 flex items-center justify-center mb-3 border border-slate-700/40">
                      <span className="text-4xl">📖</span>
                    </div>
                    <div className="text-xs font-semibold text-white mb-0.5">{fb.title}</div>
                    <div className="text-[9px] text-slate-500 mb-2">{fb.category} · {fb.created}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{fb.views.toLocaleString()} 浏览</span>
                      <div className="flex items-center gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${fb.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {fb.status === 'active' ? '已发布' : '草稿'}
                        </span>
                        <button className="opacity-0 group-hover:opacity-100 text-[9px] px-2 py-1 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 hover:bg-pink-500/20 transition-all">
                          编辑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 6步获客流程 */}
            <div>
              <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span>🔄</span> AI自动化获客6步闭环
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { step: '01', title: 'GEO可见性', desc: 'AI搜索引擎优化，霸屏目标客户搜索结果', icon: '🌍', color: 'cyan', agents: ['离宫·验效掌事', '乾宫·探微军师'], action: () => setGeoModal(true) },
                  { step: '02', title: '意图识别', desc: 'Agentic Search 实时分析买家意图，精准匹配', icon: '🔍', color: 'violet', agents: ['乾宫·探微军师'], action: () => setToolModal(true) },
                  { step: '03', title: '内容触达', desc: '多语言智能文案 + LTX视觉流，24小时触达', icon: '📨', color: 'emerald', agents: ['坤宫·文案女史', '震宫·镜画仙姬'], action: () => setAgentModal(true) },
                  { step: '04', title: 'Flipbook导流', desc: '无限视觉空间吸引客户停留，建立深度信任', icon: '📖', color: 'pink', agents: ['震宫·镜画仙姬'], action: () => setFlipbookModal(true) },
                  { step: '05', title: 'SOP跟进', desc: '标准化外贸流程节点，自动催款与交付', icon: '⚙️', color: 'amber', agents: ['巽宫·记史官', '兑宫·总控分身'], action: () => setSopModal(true) },
                  { step: '06', title: '数字永生', desc: '每步决策路径记录，生成可继承数字投影', icon: '♾️', color: 'sky', agents: ['兑宫·总控分身'], action: () => setActiveTab('cluster') },
                ].map((step, i) => {
                  const isHovered = hoveredStep === i;
                  const bgMap: Record<string, string> = { cyan:'bg-cyan-500/5', violet:'bg-violet-500/5', emerald:'bg-emerald-500/5', pink:'bg-pink-500/5', amber:'bg-amber-500/5', sky:'bg-sky-500/5' };
                  const borderMap: Record<string, string> = { cyan:'border-cyan-500/30', violet:'border-violet-500/30', emerald:'border-emerald-500/30', pink:'border-pink-500/30', amber:'border-amber-500/30', sky:'border-sky-500/30' };
                  return (
                    <div key={step.step} onMouseEnter={() => setHoveredStep(i)} onMouseLeave={() => setHoveredStep(null)}
                      className={`rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.01] ${borderMap[step.color]} ${bgMap[step.color]} ${isHovered ? 'shadow-lg' : ''}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{step.icon}</span>
                        <div className="text-[10px] font-bold text-slate-500">{step.step}</div>
                      </div>
                      <div className="text-sm font-bold text-white mb-1">{step.title}</div>
                      <div className="text-[11px] text-slate-400 leading-relaxed mb-2">{step.desc}</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {step.agents.map(a => <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">{a}</span>)}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); step.action(); }}
                        className="w-full py-1.5 rounded-lg text-[10px] font-medium transition-colors border bg-slate-800/60 text-slate-300 border-slate-600/40 hover:bg-slate-700/60 hover:text-white">
                        配置 →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ 跨境电商B2C ══════════════ */}
        {activeTab === 'b2c' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🛒</span>
                <div>
                  <h2 className="text-lg font-bold text-white">跨境电商B2C获客运营系统</h2>
                  <p className="text-xs text-slate-500">TikTok矩阵 · 全平台电商 · OpenClaw自动化</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setTikTokModal(true)} className="text-xs px-4 py-2 rounded-lg bg-pink-600/20 text-pink-400 border border-pink-500/20 hover:bg-pink-600/30 transition-colors flex items-center gap-1.5">
                  <span>🎬</span> 管理TikTok矩阵
                </button>
                <button onClick={() => setProductModal(true)} className="text-xs px-4 py-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-600/30 transition-colors flex items-center gap-1.5">
                  <span>+</span> 添加商品
                </button>
              </div>
            </div>

            {/* B2C 子标签 */}
            <div className="flex items-center gap-2 border-b border-slate-700/50 pb-0">
              {([
                { id: 'tiktok' as B2CSubTab, label: 'TikTok矩阵获客', icon: '🎬', color: 'pink' },
                { id: 'ecommerce' as B2CSubTab, label: '全平台电商运营', icon: '🛒', color: 'emerald' },
                { id: 'openclaw' as B2CSubTab, label: 'OpenClaw自动化', icon: '🦞', color: 'amber' },
              ]).map(sub => (
                <button key={sub.id} onClick={() => setActiveB2C(sub.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-t-xl transition-all border-b-0 ${
                    activeB2C === sub.id ? `border border-slate-700/50 bg-slate-900/80 text-${sub.color}-300` : 'text-slate-500 hover:text-white'
                  }`}
                  style={activeB2C === sub.id ? { borderBottomColor: 'transparent', borderTopColor: borderMap[sub.color] || 'rgba(6,182,212,0.3)' } : {}}>
                  <span>{sub.icon}</span> {sub.label}
                </button>
              ))}
            </div>

            {/* TikTok矩阵 */}
            {activeB2C === 'tiktok' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '运行账号', value: `${tiktokAccounts.filter(a => a.status === 'running').length}`, icon: '▶️', color: 'text-pink-400' },
                    { label: '总粉丝', value: (tiktokAccounts.reduce((a, b) => a + b.followers, 0) / 10000).toFixed(1) + '万', icon: '👥', color: 'text-emerald-400' },
                    { label: '今日浏览', value: (tiktokAccounts.reduce((a, b) => a + b.todayViews, 0) / 10000).toFixed(1) + '万', icon: '👁️', color: 'text-amber-400' },
                    { label: '本月视频', value: `${tiktokAccounts.reduce((a, b) => a + b.videos, 0)}`, icon: '🎥', color: 'text-cyan-400' },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
                      <div className={`${m.color} text-xl font-bold`}>{m.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {tiktokAccounts.map(acc => (
                    <div key={acc.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40 hover:border-pink-500/20 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-900/40 to-violet-900/40 flex items-center justify-center text-2xl flex-shrink-0">🎬</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white">{acc.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${acc.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : acc.status === 'paused' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {acc.status === 'running' ? '运行中' : acc.status === 'paused' ? '已暂停' : '异常'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500">{acc.niche} · 最后发布: {acc.lastPost}</div>
                        <div className="flex items-center gap-4 mt-1 text-[10px]">
                          <span className="text-slate-400">👥 <span className="text-white">{acc.followers.toLocaleString()}</span></span>
                          <span className="text-slate-400">🎥 <span className="text-white">{acc.videos}</span></span>
                          <span className="text-slate-400">👁️ <span className="text-pink-400">{acc.todayViews.toLocaleString()}</span> 今日</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => handleToggleTikTok(acc.id)}
                          className={`text-[10px] px-3 py-1.5 rounded-lg font-medium transition-colors ${
                            acc.status === 'running' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}>
                          {acc.status === 'running' ? '⏸ 暂停' : '▶ 启动'}
                        </button>
                        <button className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">详情</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 全平台电商 */}
            {activeB2C === 'ecommerce' && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: '已发布商品', value: `${products.filter(p => p.status === 'published').length}`, color: 'cyan' },
                    { label: '审核中', value: `${products.filter(p => p.status === 'reviewing').length}`, color: 'amber' },
                    { label: '草稿', value: `${products.filter(p => p.status === 'draft').length}`, color: 'slate' },
                    { label: '总销售额', value: '$' + products.reduce((a, p) => a + p.sales * parseFloat(p.price.replace('$', '')), 0).toFixed(0), color: 'emerald' },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4 text-center">
                      <div className={`text-xl font-bold text-${m.color}-400`}>{m.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 overflow-hidden">
                  <div className="grid grid-cols-6 gap-2 px-4 py-2 border-b border-slate-800 text-[10px] text-slate-500 font-semibold">
                    <div>商品名称</div><div>平台</div><div>SKU</div><div>价格</div><div>销量</div><div>状态</div>
                  </div>
                  {products.map(p => (
                    <div key={p.id} className="grid grid-cols-6 gap-2 px-4 py-3 items-center border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <div className="text-xs text-white font-medium truncate">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.platform}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      <div className="text-xs font-semibold text-emerald-400">{p.price}</div>
                      <div className="text-xs text-slate-300">{p.sales.toLocaleString()}</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          p.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          p.status === 'reviewing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-slate-700 text-slate-400 border border-slate-600'
                        }`}>{p.status === 'published' ? '已发布' : p.status === 'reviewing' ? '审核中' : '草稿'}</span>
                        {p.status === 'draft' && <button onClick={() => handlePublishProduct(p.id)} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">提交</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* OpenClaw自动化 */}
            {activeB2C === 'openclaw' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'OpenSpace 技能库', value: '1200+', icon: '🧠', color: 'violet', desc: '自动进化' },
                    { label: 'ClawTip 变现', value: '¥3.2万', icon: '💰', color: 'amber', desc: '本月收入' },
                    { label: 'Heartbeat 自愈', value: '99.9%', icon: '❤️', color: 'red', desc: '系统可用' },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5 text-center">
                      <div className="text-2xl mb-2">{m.icon}</div>
                      <div className={`text-2xl font-bold text-${m.color}-400`}>{m.value}</div>
                      <div className="text-xs font-semibold text-white mt-1">{m.label}</div>
                      <div className="text-[10px] text-slate-500">{m.desc}</div>
                    </div>
                  ))}
                </div>
                {/* OPC协作面板 */}
                <div className="rounded-xl border border-violet-500/20 bg-slate-900/80 p-5">
                  <div className="text-sm font-bold text-violet-300 mb-4 flex items-center gap-2">
                    <span>🐝</span> OPC蜂巢协作 · 数字公司弹性组建
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { role: '乾宫·探微军师', task: '竞品分析报告', progress: 75, color: 'cyan' },
                      { role: '坤宫·文案女史', task: '多语言产品页', progress: 90, color: 'violet' },
                      { role: '震宫·镜画仙姬', task: 'TikTok视频素材', progress: 55, color: 'pink' },
                      { role: '巽宫·记史官', task: 'ERP自动上架', progress: 30, color: 'amber' },
                      { role: '坎宫·营销虾', task: 'ADS广告优化', progress: 80, color: 'emerald' },
                      { role: '离宫·验效掌事', task: 'ROI数据报告', progress: 100, color: 'red' },
                    ].map((item, i) => (
                      <div key={i} className="rounded-xl border border-slate-700/40 bg-slate-800/50 p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-6 h-6 rounded-md bg-${item.color}-500/20 text-${item.color}-400 text-[9px] font-bold flex items-center justify-center`}>{item.role.split('·')[0].slice(0, 2)}</div>
                          <div className="text-[10px] font-semibold text-slate-200">{item.role.split('·')[1]?.trim()}</div>
                        </div>
                        <div className="text-[10px] text-slate-400 mb-2">{item.task}</div>
                        <ProgressBar value={item.progress} />
                        <div className="text-[9px] text-slate-500 mt-1 text-right">{item.progress}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}



        {/* ══════════════ 全球社媒矩阵 ══════════════ */}
        {activeTab === 'matrix' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📱</span>
                <div>
                  <h2 className="text-lg font-bold text-white">全球社媒矩阵 · VPN矩阵登录</h2>
                  <p className="text-xs text-slate-500">多平台账号矩阵 · 独立IP防关联 · AnyGen AI智能运营</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMatrixPostModal(true)} className="text-xs px-4 py-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:bg-sky-500/30 transition-colors">✏️ 发布内容</button>
                <button onClick={() => setAnygenModal(true)} className="text-xs px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors">🤖 AnyGen AI 客服</button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {([{label:'Facebook',icon:'f',col:'#1877F2',plat:'facebook',url:'https://facebook.com'},{label:'X/Twitter',icon:'𝕏',col:'#ffffff',plat:'x',url:'https://x.com'},{label:'LinkedIn',icon:'in',col:'#0A66C2',plat:'linkedin',url:'https://linkedin.com'},{label:'Instagram',icon:'📷',col:'#E4405F',plat:'instagram',url:'https://instagram.com'},{label:'TikTok',icon:'♪',col:'#ffffff',plat:'tiktok',url:'https://tiktok.com'},{label:'WhatsApp',icon:'💬',col:'#25D366',plat:'whatsapp',url:'https://whatsapp.com'},{label:'AnyGen',icon:'🤖',col:'#6366F1',plat:'anygen',url:'https://www.anygen.io/assistant'}]).map(m => {
                const c = socialAccounts.filter(a => a.platform === m.plat && a.status === 'connected').length;
                const t = socialAccounts.filter(a => a.platform === m.plat).length;
                return (<div key={m.plat} className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 text-center hover:scale-105 transition-transform cursor-pointer" style={{borderColor: m.col+'40'}} onClick={() => window.open(m.url, '_blank')}>
                  <div className="text-lg font-bold mb-0.5" style={{color: m.col}}>{m.icon}</div>
                  <div className="text-xs font-bold text-white">{c}<span className="text-slate-500">/{t}</span></div>
                  <div className="text-[9px] text-slate-500 mt-0.5">{m.label}</div>
                  <div className="w-full h-1 mt-1 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full" style={{width: t>0?(c/t)*100+'%':'0%', backgroundColor: m.col}} /></div>
                </div>);
              })}
            </div>

            <div className="flex items-center gap-1.5 border-b border-slate-800">
              {([{id:'accounts',label:'账号矩阵',icon:'👤'},{id:'vpn',label:'VPN矩阵',icon:'🔐'},{id:'auto-post',label:'自动发布',icon:'📤'},{id:'anygen',label:'AnyGen AI',icon:'🤖'}] as const).map(tab => (
                <button key={tab.id} onClick={() => setActiveMatrixTab(tab.id)}
                  className={`px-4 py-2 text-xs font-medium border-b-2 transition-all flex items-center gap-1.5 ${activeMatrixTab === tab.id ? 'text-sky-400 border-sky-400 bg-sky-500/5' : 'text-slate-500 border-transparent hover:text-white hover:bg-slate-800/50'}`}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                </button>
              ))}
            </div>

            {activeMatrixTab === 'accounts' && (
              <div className="space-y-3">
                {(['facebook','x','linkedin','instagram','tiktok','whatsapp','anygen'] as const).map(platform => {
                  const accounts = socialAccounts.filter(a => a.platform === platform);
                  if (!accounts.length) return null;
                  const cfg = platformConfig[platform];
                  return (<div key={platform} className="rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/50" style={{backgroundColor: cfg.bg}}>
                      <span className="text-base font-bold" style={{color: cfg.color}}>{cfg.icon}</span>
                      <span className="text-xs font-bold text-white">{cfg.name}</span>
                      <span className="text-[10px] text-slate-400 ml-auto">{accounts.filter(a => a.status === 'connected').length}/{accounts.length} 在线</span>
                      <button onClick={() => window.open(cfg.url, '_blank')} className="text-[9px] px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors">🌐 官网</button>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                      {accounts.map(acc => {
                        const vpn = vpnProfiles.find(v => v.id === acc.vpnProfile);
                        return (<div key={acc.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => { setSelectedAccount(acc); setAccountDetailModal(true); }}>
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 flex-shrink-0" style={{borderColor: acc.status === 'connected' ? '#22c55e' : '#64748b', backgroundColor: cfg.bg, color: cfg.color}}>{acc.avatar}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{acc.displayName}</span>
                              <span className="text-[9px] text-slate-500">@{acc.username}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${acc.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-500'}`}>{acc.status === 'connected' ? '🟢 已连接' : '⚫ 离线'}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-500">
                              {acc.country && <span>🌍 {acc.country}</span>}
                              {acc.followers && acc.followers > 0 && <span>👥 {acc.followers.toLocaleString()}</span>}
                              {acc.posts && acc.posts > 0 && <span>📝 {acc.posts}</span>}
                              {acc.lastPost && <span>⏱ {acc.lastPost}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {acc.status === 'connected' && vpn && <div className="text-right"><div className="text-[9px] text-sky-400">{vpn.name}</div><div className="text-[8px] text-slate-500">{acc.ipAddress}</div></div>}
                            {acc.status === 'connected' ? (<><button onClick={(e) => { e.stopPropagation(); handleSwitchVpn(acc.id, acc.vpnProfile === 'vp-usa' ? 'vp-uk' : 'vp-usa'); }} className="text-[9px] px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">🔄 切换IP</button><button onClick={(e) => { e.stopPropagation(); handleDisconnectSocial(acc.id); }} className="text-[9px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">断开</button></>) : (<button onClick={(e) => { e.stopPropagation(); handleConnectSocial(acc.id, 'vp-usa'); }} className="text-[9px] px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">🔗 连接</button>)}
                          </div>
                        </div>);
                      })}
                    </div>
                  </div>);
                })}
              </div>
            )}

            {activeMatrixTab === 'vpn' && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2">
                  <span className="text-base">🔐</span>
                  <span className="text-xs font-bold text-white">VPN节点矩阵</span>
                  <span className="text-[10px] text-slate-500 ml-auto">{vpnProfiles.filter(v => v.status === 'active').length}/{vpnProfiles.length} 节点在线</span>
                  <span className="text-[10px] text-emerald-400">{vpnProfiles.reduce((a, v) => a + v.connectedAccounts, 0)} 账号在线</span>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {vpnProfiles.map(vpn => (
                    <div key={vpn.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => { setSelectedVpn(vpn); setVpnDetailModal(true); }}>
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold flex-shrink-0 border" style={{backgroundColor: vpn.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', borderColor: vpn.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}}>{vpn.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{vpn.name}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${vpn.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-500'}`}>{vpn.status === 'active' ? '🟢 活跃' : '⏸ 待机'}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">{vpn.protocol}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-500">
                          <span>📍 {vpn.city}, {vpn.countryCode}</span>
                          <span>🌐 {vpn.serverIp}</span>
                          <span>📶 {vpn.bandwidth}</span>
                          <span>📡 {vpn.ping}ms</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right"><div className="text-[10px] text-white">{vpn.connectedAccounts}<span className="text-slate-500">/{vpn.maxAccounts}</span></div><div className="text-[8px] text-slate-500">账号</div></div>
                        <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-cyan-400 rounded-full" style={{width: `${vpn.load}%`}} /></div>
                        <div className="text-right"><div className="text-[10px] text-cyan-400">{vpn.load}%</div><div className="text-[8px] text-slate-500">负载</div></div>
                        <button onClick={(e) => { e.stopPropagation(); handleToggleVpn(vpn.id); }} className={`text-[9px] px-2 py-1 rounded transition-colors ${vpn.status === 'active' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>{vpn.status === 'active' ? '停用' : '启用'}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMatrixTab === 'auto-post' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800/50 flex items-center gap-2">
                    <span className="text-base">📤</span>
                    <span className="text-xs font-bold text-white">最近发布记录</span>
                    <span className="text-[10px] text-slate-500 ml-auto">{matrixMessages.length} 条</span>
                  </div>
                  <div className="divide-y divide-slate-800/50">
                    {matrixMessages.slice(0, 6).map(msg => {
                      const cfg = platformConfig[msg.platform];
                      return (<div key={msg.id} className="flex items-start gap-3 px-4 py-3">
                        <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0" style={{backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`}}>{cfg.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-[9px]">
                            <span className="text-slate-400">{cfg.name}</span>
                            <span className="text-slate-600">→</span>
                            <span className="text-white">{msg.recipient}</span>
                            <span className="text-slate-500 ml-auto">{msg.sentAt}</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5 line-clamp-2">{msg.content}</div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${msg.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : msg.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>{msg.status === 'sent' ? '✓ 已发' : msg.status === 'failed' ? '✗ 失败' : '⏳ 待发'}</span>
                      </div>);
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2"><span className="text-base">✏️</span><span className="text-xs font-bold text-white">快速同步发布</span></div>
                    <button onClick={() => setMatrixPostModal(true)} className="text-[10px] px-3 py-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:bg-sky-500/30 transition-colors">📝 完整编辑器</button>
                  </div>
                  <textarea value={postContent} onChange={e => setPostContent(e.target.value)} placeholder="输入要发布的内容，支持多平台同步..."
                    className="w-full h-20 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-sky-500/50" />
                  <div className="flex items-center gap-2 mt-2">
                    {(['facebook','x','linkedin','instagram','whatsapp'] as const).map(p => {
                      const cfg = platformConfig[p];
                      const sel = postPlatforms.includes(p);
                      return (<button key={p} onClick={() => setPostPlatforms(prev => sel ? prev.filter(x => x !== p) : [...prev, p])}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-medium border transition-all ${sel ? 'text-white' : 'text-slate-500'}`}
                        style={sel ? {backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color} : {backgroundColor: 'transparent', borderColor: 'rgba(100,116,139,0.3)'}}>
                        {cfg.icon} {cfg.name}
                      </button>);
                    })}
                  </div>
                  <button onClick={handlePostToMatrix} disabled={!postContent.trim() || !postPlatforms.length}
                    className="mt-3 text-xs px-4 py-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:bg-sky-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    📤 立即发布到 {postPlatforms.length} 个平台
                  </button>
                </div>
              </div>
            )}

            {activeMatrixTab === 'anygen' && (
              <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">🤖</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">AnyGen AI 全能销售运营客服</div>
                    <div className="text-[10px] text-indigo-400">https://www.anygen.io/assistant</div>
                  </div>
                  <a href="https://www.anygen.io/assistant" target="_blank" rel="noopener noreferrer"
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors">🌐 打开官网</a>
                </div>
                <p className="text-xs text-slate-400 mb-4">AnyGen是专业的AI外贸客服机器人，支持多语言自动回复、询盘智能处理、Lead自动捕获、WhatsApp/Email/SMS全渠道覆盖。</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[{icon:'🌍',label:'多语言支持',desc:'EN/ES/AR/PT/JP'},{icon:'⚡',label:'即时响应',desc:'<3秒回复'},{icon:'📋',label:'Lead捕获',desc:'自动识别高意向'},{icon:'📱',label:'全渠道覆盖',desc:'WhatsApp+Email'}].map(f => (
                    <div key={f.label} className="bg-indigo-950/50 rounded-lg p-2 text-center border border-indigo-500/10">
                      <div className="text-sm mb-0.5">{f.icon}</div>
                      <div className="text-[10px] font-semibold text-indigo-300">{f.label}</div>
                      <div className="text-[8px] text-slate-500">{f.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <textarea value={anygenQuery} onChange={e => setAnygenQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnygenQuery(); } }}
                    placeholder="输入AnyGen指令，例如：回复来自德国的泳装询盘 / 生成多语言产品介绍 / 分析今日询盘质量"
                    className="w-full h-20 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50" />
                  <div className="flex items-center gap-2">
                    <button onClick={handleAnygenQuery} className="text-xs px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors">🤖 发送指令</button>
                    <span className="text-[9px] text-slate-500">Enter 发送 · Shift+Enter 换行</span>
                  </div>
                  {anygenResponse && (
                    <div className="mt-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <div className="text-[10px] text-indigo-400 mb-1.5 flex items-center gap-1"><span>🤖</span><span>AnyGen 回复</span></div>
                      <div className="text-xs text-slate-300 whitespace-pre-wrap">{anygenResponse}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}


        {/* ══════════════ 龙虾集群可视化 ══════════════ */}
        {activeTab === 'cluster' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🦞</span>
                <div>
                  <h2 className="text-lg font-bold text-white">龙虾集群 · 太极64卦可视化</h2>
                  <p className="text-xs text-slate-500">8宫 × 8卦 = 64智能体 · 实时运行状态 · 点击任意宫位查看详情</p>
                </div>
              </div>
              <button onClick={() => setAgentModal(true)} className="text-xs px-4 py-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/20 hover:bg-amber-500/30 transition-colors">
                🤖 任务调度中心
              </button>
            </div>

            {/* 太极八卦Canvas动画 */}
            <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-slate-900 to-slate-950 overflow-hidden">
              <canvas ref={canvasRef} width={520} height={380} className="w-full max-w-lg mx-auto block" />
              <div className="flex flex-wrap justify-center gap-1 px-6 py-3">
                {HEXAGRAMS.map((h, i) => (
                  <span key={i} className="text-sm font-serif text-slate-600 hover:text-amber-400 transition-colors cursor-default" title={`第${i + 1}卦`}>{h}</span>
                ))}
              </div>
            </div>

            {/* 8宫详情 */}
            <div>
              <div className="text-sm font-bold text-white mb-3">8宫详情 · 点击任意宫位展开详情</div>
              <div className="grid grid-cols-4 gap-2">
                {CLUSTER_NODES.map(node => {
                  const isSelected = selectedPalace === node.palace;
                  const cm: Record<string, { border: string; bg: string; text: string; dim: string; ring: string }> = {
                    cyan: { border:'border-cyan-500/30', bg:'bg-cyan-500/5', text:'text-cyan-300', dim:'text-cyan-400', ring:'ring-cyan-400' },
                    violet: { border:'border-violet-500/30', bg:'bg-violet-500/5', text:'text-violet-300', dim:'text-violet-400', ring:'ring-violet-400' },
                    pink: { border:'border-pink-500/30', bg:'bg-pink-500/5', text:'text-pink-300', dim:'text-pink-400', ring:'ring-pink-400' },
                    amber: { border:'border-amber-500/30', bg:'bg-amber-500/5', text:'text-amber-300', dim:'text-amber-400', ring:'ring-amber-400' },
                    emerald: { border:'border-emerald-500/30', bg:'bg-emerald-500/5', text:'text-emerald-300', dim:'text-emerald-400', ring:'ring-emerald-400' },
                    red: { border:'border-red-500/30', bg:'bg-red-500/5', text:'text-red-300', dim:'text-red-400', ring:'ring-red-400' },
                    slate: { border:'border-slate-500/30', bg:'bg-slate-500/5', text:'text-slate-300', dim:'text-slate-400', ring:'ring-slate-400' },
                    sky: { border:'border-sky-500/30', bg:'bg-sky-500/5', text:'text-sky-300', dim:'text-sky-400', ring:'ring-sky-400' },
                  };
                  const c = cm[node.color];
                  return (
                    <button key={node.palace} onClick={() => setSelectedPalace(isSelected ? null : node.palace)}
                      className={`rounded-xl border p-3 text-left transition-all ${c.border} ${c.bg} ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-950 ' + c.ring : ''}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${c.text}`}>{node.palace}</span>
                        <span className="text-[9px]">{node.status === 'active' ? '🟢' : node.status === 'busy' ? '🟡' : '⚪'}</span>
                      </div>
                      <div className={`text-xs font-semibold ${c.dim}`}>{node.name}</div>
                      <div className="text-[9px] text-slate-500 mb-2">{node.tasks.toLocaleString()} 任务 · {node.load}% 负载</div>
                      <ProgressBar value={node.load} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 选中宫详情 */}
            {selectedPalace && (() => {
              const node = CLUSTER_NODES.find(n => n.palace === selectedPalace)!;
              const baseIdx = CLUSTER_NODES.indexOf(node);
              return (
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/80 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold border ${
                        node.color === 'cyan' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' :
                        node.color === 'violet' ? 'bg-violet-500/20 border-violet-500/30 text-violet-400' :
                        node.color === 'pink' ? 'bg-pink-500/20 border-pink-500/30 text-pink-400' :
                        node.color === 'amber' ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' :
                        node.color === 'emerald' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
                        node.color === 'red' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
                        node.color === 'slate' ? 'bg-slate-500/20 border-slate-500/30 text-slate-400' :
                        'bg-sky-500/20 border-sky-500/30 text-sky-400'
                      }`}>{node.palace}</div>
                      <div>
                        <div className="text-base font-bold text-white">{node.palace} · {node.name}</div>
                        <div className="text-xs text-slate-400">{node.role}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full ${
                        node.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        node.status === 'busy' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-slate-700 text-slate-400 border border-slate-600'
                      }`}>{node.status === 'active' ? '🟢 运行中' : node.status === 'busy' ? '🟡 繁忙' : '⚪ 待机'}</span>
                      <button className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">下达任务</button>
                    </div>
                  </div>
                  {/* 64卦 */}
                  <div className="grid grid-cols-8 gap-1 mb-4">
                    {Array.from({ length: node.hexagrams }, (_, i) => {
                      const hIdx = (baseIdx * 8 + i) % 64;
                      return (
                        <div key={i} className="aspect-square rounded-lg bg-slate-800 flex items-center justify-center text-sm font-serif text-slate-500 border border-slate-700/40 hover:border-cyan-500/40 transition-colors cursor-pointer hover:text-cyan-400"
                          title={`${node.palace}第${i + 1}卦`}>
                          {HEXAGRAMS[hIdx]}
                        </div>
                      );
                    })}
                  </div>
                  {/* 属性 */}
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[
                      { attr: '累计任务', val: node.tasks.toLocaleString() },
                      { attr: '当前负载', val: `${node.load}%` },
                      { attr: '智能体数', val: `${node.hexagrams}个` },
                      { attr: '核心技能', val: node.skills[0] },
                    ].map(a => (
                      <div key={a.attr} className="rounded-lg bg-slate-800/60 p-2 text-center">
                        <div className="text-[9px] text-slate-500">{a.attr}</div>
                        <div className="text-xs font-semibold text-white mt-0.5">{a.val}</div>
                      </div>
                    ))}
                  </div>
                  {/* 技能 */}
                  <div className="flex flex-wrap gap-1.5">
                    {node.skills.map(s => (
                      <span key={s} className="text-[10px] px-2 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700/40">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ══════════════ 工具矩阵 ══════════════ */}
        {activeTab === 'tools' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">⚙️</span>
                <div>
                  <h2 className="text-lg font-bold text-white">AI工具矩阵</h2>
                  <p className="text-xs text-slate-500">一站式配置 · 实时连接状态 · 点击管理</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">{toolConfigs.filter(t => t.status === 'connected').length} 已连接</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">{toolConfigs.filter(t => t.status === 'disconnected').length} 未连接</span>
                </div>
                <div className="h-4 w-px bg-slate-700" />
                <div className="text-slate-400">总使用 <span className="text-violet-400">{toolConfigs.reduce((a, t) => a + t.usageCount, 0).toLocaleString()}</span> 次</div>
              </div>
            </div>

            {/* 使用趋势总览 */}
            <div className="grid grid-cols-3 gap-3">
              {toolConfigs.filter(t => t.status === 'connected').slice(0, 3).map(tool => {
                const max = Math.max(...tool.usageTrend);
                const peak = tool.usageTrend[tool.usageTrend.length - 1];
                const pct = max > 0 ? Math.round((peak / max) * 100) : 0;
                return (
                  <div key={tool.id} className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{tool.icon}</span>
                        <span className="text-xs font-semibold text-white">{tool.name}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">已连接</span>
                    </div>
                    <div className="flex items-end gap-0.5 h-10 mb-2">
                      {tool.usageTrend.map((val, i) => (
                        <div key={i} className="flex-1 rounded-t-sm transition-all hover:opacity-100 opacity-80"
                          style={{ height: `${max > 0 ? Math.round((val / max) * 100) : 0}%`, backgroundColor: i === tool.usageTrend.length - 1 ? '#a855f7' : '#4c1d95', minHeight: '2px' }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-slate-500">近7天趋势</span>
                      <span className="text-[9px] text-violet-400">+{peak}次</span>
                    </div>
                  </div>
                );
              })}
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/60 p-4 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl mb-1">📊</div>
                  <div className="text-xs font-semibold text-white">{toolConfigs.filter(t => t.status === 'connected').length}</div>
                  <div className="text-[9px] text-slate-500">活跃工具</div>
                </div>
              </div>
            </div>

            {/* 工具分类标签 */}
            {(['all','video','image','seo','social','automation','customer','design'] as const).map(cat => {
              const cats: Record<string, {label:string;icon:string}> = {
                all:{label:'全部',icon:'⚡'}, video:{label:'视频生成',icon:'🎬'}, image:{label:'图像设计',icon:'🖼️'},
                seo:{label:'SEO/GEO',icon:'🌍'}, social:{label:'社媒矩阵',icon:'📱'},
                automation:{label:'自动化',icon:'⚙️'}, customer:{label:'客服工具',icon:'🤖'}, design:{label:'设计工具',icon:'🎨'}
              };
              const filtered = cat === 'all' ? toolConfigs : toolConfigs.filter(t => t.category === cat);
              if (cat !== 'all') return null;
              return (
                <div key={cat} className="space-y-3">
                  {filtered.map(tool => {
                    const colorMap: Record<string, string> = {
                      pink:'border-pink-500/20 bg-pink-500/3', violet:'border-violet-500/20 bg-violet-500/3',
                      cyan:'border-cyan-500/20 bg-cyan-500/3', amber:'border-amber-500/20 bg-amber-500/3',
                      emerald:'border-emerald-500/20 bg-emerald-500/3', orange:'border-orange-500/20 bg-orange-500/3',
                      sky:'border-sky-500/20 bg-sky-500/3', rose:'border-rose-500/20 bg-rose-500/3',
                    };
                    const textColorMap: Record<string, string> = {
                      pink:'text-pink-300', violet:'text-violet-300', cyan:'text-cyan-300',
                      amber:'text-amber-300', emerald:'text-emerald-300', orange:'text-orange-300',
                      sky:'text-sky-300', rose:'text-rose-300',
                    };
                    const dotMap: Record<string, string> = {
                      pink:'bg-pink-400', violet:'bg-violet-400', cyan:'bg-cyan-400',
                      amber:'bg-amber-400', emerald:'bg-emerald-400', orange:'bg-orange-400',
                      sky:'bg-sky-400', rose:'bg-rose-400',
                    };
                    return (
                      <div key={tool.id} className={`rounded-xl border p-4 transition-all hover:scale-[1.01] ${tool.status === 'connected' ? colorMap[tool.color] || 'border-slate-700/50 bg-slate-900/60' : 'border-slate-800/40 bg-slate-900/30 opacity-60'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${tool.status === 'connected' ? 'bg-slate-800/80' : 'bg-slate-800'}`}>{tool.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-bold text-white">{tool.name}</span>
                              <div className={`w-1.5 h-1.5 rounded-full ${tool.status === 'connected' ? dotMap[tool.color] || 'bg-emerald-400' : 'bg-slate-600'}`} />
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${tool.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}>
                                {tool.status === 'connected' ? '已连接' : '未连接'}
                              </span>
                              {tool.url && tool.url !== '#' && (
                                <a href={tool.url} target="_blank" rel="noopener noreferrer"
                                  className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
                                  🔗 官网
                                </a>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 leading-relaxed mb-1.5">{tool.desc}</div>
                            {/* 特性标签 */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {tool.features.map(f => (
                                <span key={f.label} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                                  {f.label}: <span className="text-white">{f.value}</span>
                                </span>
                              ))}
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                                📊 使用 <span className="text-white">{tool.usageCount.toLocaleString()}</span> 次
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400 border border-slate-700/40">
                                ⏱ 上次 {tool.lastUsed}
                              </span>
                            </div>
                            {/* 快捷操作 */}
                            <div className="flex flex-wrap gap-1.5">
                              {tool.quickActions.map(qa => (
                                <button key={qa.label}
                                  onClick={() => handleToolQuickAction(tool, qa.action)}
                                  className={`text-[9px] px-2 py-1 rounded-lg font-medium transition-colors border ${
                                    tool.status === 'connected'
                                      ? `bg-slate-800/60 text-slate-300 border-slate-700/40 hover:${textColorMap[tool.color] || 'text-white'} hover:border-${tool.color}-500/30`
                                      : 'bg-slate-800 text-slate-500 border-slate-700/40'
                                  }`}>
                                  {qa.icon} {qa.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button onClick={() => tool.status === 'disconnected' ? handleConnectTool(tool) : handleOpenToolDetail(tool)}
                              className={`text-[10px] px-3 py-1.5 rounded-lg font-medium flex-shrink-0 transition-colors ${
                                tool.status === 'connected'
                                  ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                              }`}>
                              ⚙️ {tool.status === 'connected' ? '配置' : '连接'}
                            </button>
                            {tool.status === 'connected' && tool.url && tool.url !== '#' && (
                              <a href={tool.url} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] px-3 py-1.5 rounded-lg font-medium flex-shrink-0 text-center bg-sky-500/10 text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors">
                                🚀 打开
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {/* 工具分类导航 */}
            <div className="flex flex-wrap gap-2">
              {([
                {cat:'all',label:'全部',icon:'⚡',color:'text-white'},
                {cat:'video',label:'视频生成',icon:'🎬',color:'text-pink-300'},
                {cat:'image',label:'图像设计',icon:'🖼️',color:'text-violet-300'},
                {cat:'seo',label:'SEO/GEO',icon:'🌍',color:'text-amber-300'},
                {cat:'social',label:'社媒矩阵',icon:'📱',color:'text-sky-300'},
                {cat:'automation',label:'自动化',icon:'🐸',color:'text-orange-300'},
                {cat:'customer',label:'客服工具',icon:'🤖',color:'text-sky-300'},
                {cat:'design',label:'设计工具',icon:'📖',color:'text-cyan-300'},
              ] as const).map(({cat,label,icon,color}) => {
                const count = cat === 'all' ? toolConfigs.length : toolConfigs.filter(t => t.category === cat).length;
                return (
                  <button key={cat} onClick={() => {
                    const el = document.getElementById(`tool-cat-${cat}`);
                    if (el) el.scrollIntoView({behavior:'smooth'});
                  }}
                    className={`text-[10px] px-3 py-1.5 rounded-xl border border-slate-700/40 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 transition-colors ${color}`}>
                    {icon} {label} <span className="text-slate-500 ml-1">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* OpenClaw全景 */}
            <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/20 to-slate-900 p-5">
              <div className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span>🦞</span> OpenClaw 全景架构
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'OpenSpace', desc: '知识进化库', icon: '🧠', color: 'violet', stat: '1200+ 技能', action: () => addToast('🧠 正在打开 OpenSpace 技能库…', 'info') },
                  { name: 'ClawTip', desc: '支付变现闭环', icon: '💰', color: 'amber', stat: '¥3.2万/月', action: () => addToast('💰 正在打开 ClawTip 收入面板…', 'info') },
                  { name: 'Heartbeat', desc: '自愈监控', icon: '❤️', color: 'red', stat: '99.9% 可用', action: () => addToast('❤️ 正在打开 Heartbeat 监控系统…', 'info') },
                  { name: 'Dageno', desc: 'GEO/AEO护航', icon: '🌍', color: 'cyan', stat: '5000+ 关键词', action: () => { setActiveTab('b2b'); addToast('🌍 正在跳转 GEO 关键词管理…', 'info'); } },
                  { name: 'OPC蜂巢', desc: '数字协作协议', icon: '🐝', color: 'emerald', stat: '8宫协作', action: () => addToast('🐝 正在打开 OPC 蜂巢协作面板…', 'info') },
                  { name: '数字永生', desc: '决策路径记录', icon: '♾️', color: 'sky', stat: '永久存储', action: () => addToast('♾️ 正在打开数字永生档案库…', 'info') },
                ].map(sys => (
                  <div key={sys.name} className="rounded-xl border border-slate-700/40 bg-slate-800/50 p-4 text-center hover:border-amber-500/20 transition-all cursor-pointer"
                    onClick={sys.action}>
                    <div className="text-2xl mb-1">{sys.icon}</div>
                    <div className="text-xs font-bold text-white">{sys.name}</div>
                    <div className="text-[10px] text-slate-400">{sys.desc}</div>
                    <div className="text-[9px] text-slate-600 mt-1">{sys.stat}</div>
                    <button className="mt-2 text-[9px] px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">{sys.desc === 'GEO/AEO护航' ? '跳转到GEO' : '查看详情'}</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ AI技能库 ══════════════ */}
        {activeTab === 'skills' && (
          <div className="space-y-4">
            {/* 头部 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <h2 className="text-lg font-bold text-white">AI技能库</h2>
                  <p className="text-xs text-slate-500">43个成熟技能 · 6大模块 · 装完即用 · 外贸+跨境电商全链路覆盖</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-400">{skillExecutions.filter(e => e.status === 'running').length} 运行中</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span className="text-amber-400">{skillExecutions.filter(e => e.status === 'queued').length} 排队中</span>
                </div>
                <div className="text-slate-500">✓ 43 已安装</div>
              </div>
            </div>

            {/* 技能执行状态栏 - 有运行中技能时显示 */}
            {skillExecutions.filter(e => e.status === 'running').length > 0 && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-950/20 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-400 animate-pulse">⚡</span>
                    <span className="text-sm font-bold text-white">技能执行中</span>
                    <span className="text-[10px] text-slate-500">{skillExecutions.filter(e => e.status === 'running').length} 个技能正在执行</span>
                  </div>
                  <button onClick={() => { setSkillTab('run'); setSkillModal(true); }}
                    className="text-[10px] px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                    查看全部 →
                  </button>
                </div>
                <div className="space-y-2">
                  {skillExecutions.filter(e => e.status === 'running').slice(0, 2).map(exec => (
                    <div key={exec.id} className="flex items-center gap-3 bg-slate-900/60 rounded-lg px-3 py-2">
                      <span className="text-lg">{exec.skillIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-white truncate">{exec.skillName}</span>
                          <span className="text-[10px] text-orange-400 font-medium ml-2">{exec.duration}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                            style={{width: `${exec.progress}%`}} />
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 flex-shrink-0">{exec.startedAt}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab子导航：概述 / 执行 / 配置 / 技能链 / 统计 */}
            <div className="flex gap-1 p-1 bg-slate-900/60 rounded-xl border border-slate-800/50">
              {([
                {id:'overview',label:'📋 概述',icon:'📋'},
                {id:'run',label:'⚡ 执行',icon:'⚡'},
                {id:'config',label:'⚙️ 配置',icon:'⚙️'},
                {id:'chain',label:'🔗 技能链',icon:'🔗'},
                {id:'stats',label:'📊 统计',icon:'📊'},
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => { setSkillTab(tab.id); setSkillModal(false); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'skills' && skillTab === tab.id || (activeTab === 'skills' && tab.id === 'overview' && skillTab === 'overview')
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                      : 'text-slate-500 hover:text-white hover:bg-slate-800/60'
                  }`}>
                  <span>{tab.icon}</span><span>{tab.label}</span>
                  {tab.id === 'run' && skillExecutions.filter(e => e.status === 'running').length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse ml-1" />
                  )}
                </button>
              ))}
            </div>

            {/* ── 概述 ────────────────────────────────────────────── */}
            {skillTab === 'overview' && (
              <div className="space-y-4">
                {/* 6大模块 */}
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { name: '选品调研', icon: '🔍', color: 'cyan', count: 7, desc: '选品分析/竞品追踪/专利风险' },
                    { name: '流量获客', icon: '📈', color: 'emerald', count: 8, desc: '广告投放/红人营销/社媒获客' },
                    { name: '内容创作', icon: '🎬', color: 'pink', count: 7, desc: '脚本/修图/品牌视觉/Listing' },
                    { name: '转化优化', icon: '💰', color: 'amber', count: 7, desc: 'CRO/促销/落地页/直播' },
                    { name: '履约运营', icon: '📦', color: 'sky', count: 7, desc: 'FBA/物流/退货/供应链' },
                    { name: '品牌管理', icon: '🏷️', color: 'violet', count: 7, desc: '品牌定位/故事/KOL/危机公关' },
                  ].map(m => (
                    <div key={m.name}
                      className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 hover:border-orange-500/20 transition-all cursor-pointer group"
                      onClick={() => { setSkillTab('run'); setSkillModal(true); }}>
                      <div className="text-2xl mb-1">{m.icon}</div>
                      <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors">{m.name}</div>
                      <div className="text-[10px] text-orange-400 font-medium">{m.count}个技能</div>
                      <div className="text-[9px] text-slate-500 mt-1 leading-tight">{m.desc}</div>
                    </div>
                  ))}
                </div>

                {/* 精选技能 */}
                <div>
                  <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                    <span className="text-orange-400">⭐</span> 精选技能
                    <span className="text-[10px] text-slate-600 font-normal ml-2">点击启动AI执行</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { icon: '🔍', name: '智能选品分析师', cat: '选品调研', color: 'cyan', desc: 'AI驱动选品：市场容量+竞品扫描+ROI计算', tags: ['选品', '市场分析', 'ROI'] },
                      { icon: '🎯', name: '亚马逊广告投放与ACOS优化', cat: '流量获客', color: 'emerald', desc: 'SP/SB/SD三广告+ACOS五步优化法', tags: ['亚马逊广告', 'ACOS优化', 'PPC'] },
                      { icon: '💼', name: 'LinkedIn外贸获客全攻略', cat: '流量获客', color: 'sky', desc: '个人IP+Sales Navigator+Connection话术', tags: ['LinkedIn', 'B2B获客', '个人IP'] },
                      { icon: '🎬', name: 'AI短视频脚本创作师', cat: '内容创作', color: 'pink', desc: 'TikTok带货脚本：黄金3秒开场+痛点共鸣', tags: ['短视频脚本', 'TikTok', '带货'] },
                      { icon: '📧', name: 'Google企业邮箱搭建全攻略', cat: '流量获客', color: 'amber', desc: '域名+DNS配置+Snov.io SMTP+预热', tags: ['企业邮箱', 'Snov.io', '送达率'] },
                      { icon: '📦', name: '跨境电商履约全链路管理', cat: '履约运营', color: 'sky', desc: 'FBA入仓+Shopify Dropship+海外仓+SLA', tags: ['FBA', '海外仓', '履约'] },
                    ] as const).map(s => (
                      <div key={s.name}
                        className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-3 hover:border-orange-500/20 transition-all cursor-pointer group"
                        onClick={() => { setSelectedSkill(s); setSkillTab('overview'); setSkillModal(true); }}>
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xl">{s.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">{s.name}</div>
                            <div className="text-[9px] text-slate-500">{s.cat}</div>
                          </div>
                          <button onClick={e => { e.stopPropagation(); handleRunSkill(s, ''); }}
                            className="text-[9px] px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors flex-shrink-0">
                            ▶
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400 mb-2 leading-tight">{s.desc}</p>
                        <div className="flex flex-wrap gap-1">
                          {s.tags.map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500">{t}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 最近执行记录 */}
                {skillExecutions.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span className="text-orange-400">🕐</span> 最近执行
                      <button onClick={() => { setSkillTab('run'); setSkillModal(true); }}
                        className="ml-auto text-[10px] text-slate-500 hover:text-white transition-colors">查看全部 →</button>
                    </div>
                    <div className="space-y-1.5">
                      {skillExecutions.slice(0, 4).map(exec => (
                        <div key={exec.id}
                          className="flex items-center gap-3 bg-slate-900/40 rounded-lg px-3 py-2 border border-slate-800/40 hover:border-slate-700/60 transition-all">
                          <span className="text-lg">{exec.skillIcon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-white truncate">{exec.skillName}</div>
                            <div className="text-[9px] text-slate-500 truncate">{exec.input}</div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                              exec.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              exec.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                              exec.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {exec.status === 'running' ? '⚡' : exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✗' : '⏳'}
                              {' '}{exec.status === 'running' ? '执行中' : exec.status === 'completed' ? '完成' : exec.status === 'failed' ? '失败' : '排队'}
                            </span>
                            <div className="text-[8px] text-slate-600 mt-0.5">{exec.startedAt} · {exec.duration}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 执行面板 ───────────────────────────────────────── */}
            {skillTab === 'run' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">⚡ 技能执行管理</div>
                  <div className="text-[10px] text-slate-500">{skillExecutions.length} 条记录</div>
                </div>

                {/* 筛选标签 */}
                <div className="flex flex-wrap gap-2">
                  {(['all','running','queued','completed','failed'] as const).map(f => (
                    <button key={f} onClick={() => {}}
                      className={`text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
                        f === 'all' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                        'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:text-white'
                      }`}>
                      {f === 'all' ? '全部' : f === 'running' ? '⚡运行中' : f === 'queued' ? '⏳排队' : f === 'completed' ? '✓完成' : '✗失败'}
                      <span className="ml-1 opacity-60">
                        {f === 'all' ? skillExecutions.length :
                          skillExecutions.filter(e => e.status === f).length}
                      </span>
                    </button>
                  ))}
                </div>

                {/* 执行列表 */}
                <div className="space-y-2">
                  {skillExecutions.length === 0 ? (
                    <div className="text-center py-12 text-slate-600">
                      <div className="text-3xl mb-2">⚡</div>
                      <div className="text-sm">暂无执行记录</div>
                      <div className="text-xs mt-1">从上方精选技能点击「▶」启动技能执行</div>
                    </div>
                  ) : skillExecutions.map(exec => (
                    <div key={exec.id}
                      className={`rounded-xl border p-4 transition-all ${
                        exec.status === 'running' ? 'border-orange-500/20 bg-orange-950/10' :
                        exec.status === 'failed' ? 'border-red-500/20 bg-red-950/10' :
                        'border-slate-700/40 bg-slate-900/40'
                      }`}>
                      <div className="flex items-start gap-3 mb-2">
                        <span className="text-2xl mt-0.5">{exec.skillIcon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{exec.skillName}</span>
                              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500">{exec.skillCat}</span>
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-medium ${
                              exec.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              exec.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                              exec.status === 'failed' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {exec.status === 'running' ? '⚡' : exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✗' : '⏳'}
                              {' '}{exec.status === 'running' ? '运行中' : exec.status === 'completed' ? '已完成' : exec.status === 'failed' ? '失败' : '排队中'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mb-1">📋 {exec.input}</div>
                          {exec.status === 'running' && (
                            <div className="mb-1">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-[9px] text-orange-400">{exec.duration}</span>
                                <span className="text-[9px] text-slate-500">{exec.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full transition-all"
                                  style={{width: `${exec.progress}%`}} />
                              </div>
                            </div>
                          )}
                          {exec.error && (
                            <div className="text-[10px] text-red-400 bg-red-950/30 rounded-lg px-2 py-1.5 border border-red-500/20">
                              ❌ {exec.error}
                            </div>
                          )}
                          {exec.output && (
                            <div className="text-[10px] text-slate-300 bg-slate-800/50 rounded-lg px-3 py-2 mt-1 font-mono whitespace-pre-wrap">
                              {exec.output}
                            </div>
                          )}
                          <div className="flex items-center gap-3 mt-1.5 text-[8px] text-slate-600">
                            <span>🕐 {exec.startedAt}</span>
                            <span>⏱ {exec.duration}</span>
                            <span>🤖 {exec.agent}</span>
                          </div>
                        </div>
                      </div>
                      {/* 执行操作 */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/50">
                        {exec.status === 'running' ? (
                          <button onClick={() => { setSkillExecutions(prev => prev.map(e => e.id === exec.id ? {...e, status: 'paused'} : e)); addToast('⏸ 技能已暂停', 'info'); }}
                            className="text-[9px] px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors">⏸ 暂停</button>
                        ) : exec.status === 'failed' ? (
                          <button onClick={() => { setSkillExecutions(prev => prev.map(e => e.id === exec.id ? {...e, status: 'running', progress: 0, duration: '0分00秒', output: '', error: undefined} : e)); addToast('🔄 正在重新执行...', 'info'); }}
                            className="text-[9px] px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">🔄 重试</button>
                        ) : exec.status === 'completed' ? (
                          <button onClick={() => { navigator.clipboard.writeText(exec.output); addToast('📋 输出结果已复制', 'success'); }}
                            className="text-[9px] px-3 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors">📋 复制结果</button>
                        ) : null}
                        <button onClick={() => { setSkillExecutions(prev => prev.filter(e => e.id !== exec.id)); addToast('🗑️ 执行记录已删除', 'success'); }}
                          className="text-[9px] px-3 py-1 rounded-lg bg-slate-800/50 text-slate-500 hover:text-red-400 border border-slate-700/40 transition-colors ml-auto">🗑️</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 配置面板 ───────────────────────────────────────── */}
            {skillTab === 'config' && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-white">⚙️ 技能配置中心</div>

                {/* API密钥配置 */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🔑</span>
                    <div>
                      <div className="text-sm font-bold text-white">API密钥管理</div>
                      <div className="text-[10px] text-slate-500">为各技能配置所需的API密钥，支持OpenAI/Anthropic/自定义接口</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {([
                      {skill:'智能选品分析师', icon:'🔍', keyName:'OPENAI_API_KEY', key:'sk-****-****-****-8f3a', status:'configured', service:'OpenAI GPT-4'},
                      {skill:'AI短视频脚本创作师', icon:'🎬', keyName:'ANTHROPIC_API_KEY', key:'sk-****-****-****-2c9d', status:'configured', service:'Anthropic Claude-3'},
                      {skill:'PixieDream商业广告级AI修图', icon:'✨', keyName:'MIDJOURNEY_API_KEY', key:'****-****-****-a1b2', status:'configured', service:'Midjourney API'},
                      {skill:'竞品情报追踪师', icon:'🔬', keyName:'CUSTOM_API_KEY', key:'未配置', status:'missing', service:'Jungle Scout / Helium 10'},
                      {skill:'TikTok+Instagram红人营销', icon:'🌟', keyName:'TIKTOK_API_KEY', key:'未配置', status:'missing', service:'TikTok Creator Marketplace'},
                    ] as const).map(cfg => (
                      <div key={cfg.keyName} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
                        <span className="text-xl">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white">{cfg.skill}</div>
                          <div className="text-[9px] text-slate-500">{cfg.service} · {cfg.keyName}</div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                            cfg.status === 'configured' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {cfg.status === 'configured' ? '✓ 已配置' : '⚠ 未配置'}
                          </span>
                          <div className="text-[8px] text-slate-600 mt-0.5 font-mono">{cfg.key}</div>
                        </div>
                        <button onClick={() => addToast(`🔑 正在配置 ${cfg.skill} API密钥...`, 'info')}
                          className="text-[9px] px-3 py-1.5 rounded-lg bg-slate-700/60 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600 transition-colors">
                          {cfg.status === 'configured' ? '修改' : '配置'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 技能参数预设 */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🎛️</span>
                    <div>
                      <div className="text-sm font-bold text-white">技能参数预设</div>
                      <div className="text-[10px] text-slate-500">为高频使用的技能预设输入参数，一键启动自动填充</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      {skill:'智能选品分析师', icon:'🔍', preset:'分析美国市场[品类]品类机会', cat:'选品调研'},
                      {skill:'亚马逊广告投放与ACOS优化', icon:'🎯', preset:'优化[ASIN]广告组，ACOS从[当前]%降至[目标]%', cat:'流量获客'},
                      {skill:'AI短视频脚本创作师', icon:'🎬', preset:'为[产品]创作TikTok带货脚本，目标[受众]', cat:'内容创作'},
                      {skill:'LinkedIn外贸获客全攻略', icon:'💼', preset:'找[行业]行业[职位]决策人，生成首封Connection消息', cat:'流量获客'},
                      {skill:'PixieDream商业广告级AI修图', icon:'✨', preset:'产品[品类]白底图+场景图×[数量]张', cat:'内容创作'},
                      {skill:'品牌故事策划师', icon:'📖', preset:'为[品牌名]创作创始人故事+品牌使命宣言', cat:'品牌管理'},
                    ] as const).map(p => (
                      <div key={p.skill} className="rounded-lg border border-slate-700/40 bg-slate-800/40 p-3 hover:border-orange-500/20 transition-all cursor-pointer"
                        onClick={() => { setSkillInput(p.preset); setSkillTab('run'); setSkillModal(true); addToast(`📋 已填充预设：${p.skill}`, 'info'); }}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{p.icon}</span>
                          <span className="text-[10px] font-medium text-white">{p.skill}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 italic leading-tight">{p.preset}</div>
                        <div className="text-[8px] text-slate-600 mt-1">{p.cat}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── 技能链 ──────────────────────────────────────────── */}
            {skillTab === 'chain' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white">🔗 技能链管理</div>
                  <button onClick={() => { setEditingChain({id:'new',name:'',skills:[],status:'draft',runCount:0,lastRun:'从未',description:''}); setChainName(''); addToast('🔗 正在打开技能链编辑器...', 'info'); }}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                    + 新建技能链
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {skillChains.map(chain => (
                    <div key={chain.id}
                      className={`rounded-xl border p-4 transition-all ${
                        chain.status === 'active' ? 'border-emerald-500/20 bg-emerald-950/10' :
                        chain.status === 'paused' ? 'border-amber-500/20 bg-amber-950/10' :
                        'border-slate-700/40 bg-slate-900/40'
                      }`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-white">{chain.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                              chain.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              'bg-slate-700 text-slate-400'
                            }`}>
                              {chain.status === 'active' ? '● 活跃' : '○ 草稿'}
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-500 leading-tight">{chain.description}</div>
                        </div>
                      </div>

                      {/* 技能链步骤 */}
                      <div className="space-y-1.5 mb-3">
                        {chain.skills.map((s, i) => (
                          <div key={i} className="flex items-center gap-2 bg-slate-800/40 rounded-lg px-2.5 py-1.5">
                            <span className="text-[9px] text-slate-600 font-mono w-4 text-center">{i + 1}</span>
                            <span className="text-sm">{s.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-medium text-white truncate">{s.name}</div>
                              <div className="text-[8px] text-slate-500 truncate">{s.params}</div>
                            </div>
                            {i < chain.skills.length - 1 && <span className="text-slate-600 text-[9px]">↓</span>}
                          </div>
                        ))}
                      </div>

                      {/* 统计 */}
                      <div className="flex items-center gap-3 text-[8px] text-slate-600 mb-3">
                        <span>⚡ {chain.runCount}次执行</span>
                        <span>🕐 最近 {chain.lastRun}</span>
                      </div>

                      {/* 操作 */}
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRunChain(chain)}
                          className="flex-1 text-[10px] py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors font-medium">
                          ⚡ 启动链
                        </button>
                        <button onClick={() => { setEditingChain(chain); setChainName(chain.name); }}
                          className="text-[9px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white border border-slate-700/50 transition-colors">
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteChain(chain.id)}
                          className="text-[9px] px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-500 hover:text-red-400 border border-slate-700/50 transition-colors">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 技能链编辑器弹窗 (内联) */}
                {editingChain && (
                  <div className="rounded-xl border border-orange-500/20 bg-orange-950/10 p-4">
                    <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                      <span>✏️</span> {editingChain.id === 'new' ? '新建技能链' : '编辑技能链'}
                      <button onClick={() => setEditingChain(null)} className="ml-auto text-slate-500 hover:text-white text-lg">✕</button>
                    </div>
                    <div className="mb-3">
                      <input value={chainName} onChange={e => setChainName(e.target.value)}
                        placeholder="技能链名称，如：选品+Listing全自动"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/40" />
                    </div>
                    <div className="text-[10px] text-slate-500 mb-2">选择要串联的技能（{editingChain.skills.length}个已选）</div>
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {([
                        {name:'智能选品分析师',icon:'🔍'},{name:'竞品情报追踪师',icon:'🔬'},{name:'亚马逊Listing优化专家',icon:'🛒'},
                        {name:'PixieDream商业广告级AI修图',icon:'✨'},{name:'AI短视频脚本创作师',icon:'🎬'},{name:'外贸邮件开发信创作师',icon:'✉️'},
                        {name:'TikTok+Instagram红人营销',icon:'🌟'},{name:'亚马逊广告投放与ACOS优化',icon:'🎯'},{name:'品牌故事策划师',icon:'📖'},
                      ] as const).map(s => {
                        const isSelected = editingChain.skills.some(es => es.name === s.name);
                        return (
                          <button key={s.name} onClick={() => {
                            const newSkills = isSelected
                              ? editingChain.skills.filter(es => es.name !== s.name)
                              : [...editingChain.skills, {name:s.name, icon:s.icon, params:'默认参数'}];
                            setEditingChain({...editingChain, skills: newSkills});
                          }}
                            className={`text-[10px] px-2 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                              isSelected ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
                            }`}>
                            <span>{s.icon}</span><span className="truncate">{s.name}</span>
                            {isSelected && <span className="ml-auto text-[8px]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={handleCreateChain}
                      disabled={!chainName.trim() || editingChain.skills.length === 0}
                      className="w-full py-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      ✅ {editingChain.id === 'new' ? '创建技能链' : '保存技能链'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── 统计面板 ───────────────────────────────────────── */}
            {skillTab === 'stats' && (
              <div className="space-y-4">
                <div className="text-sm font-bold text-white">📊 技能使用统计</div>

                {/* 总体统计 */}
                <div className="grid grid-cols-4 gap-3">
                  {([
                    {label:'总使用次数', val:'15,847', sub:'次', color:'text-cyan-400', bg:'bg-cyan-500/10', border:'border-cyan-500/20'},
                    {label:'活跃技能', val:'38', sub:'/43', color:'text-emerald-400', bg:'bg-emerald-500/10', border:'border-emerald-500/20'},
                    {label:'平均好评率', val:'93.4', sub:'%', color:'text-amber-400', bg:'bg-amber-500/10', border:'border-amber-500/20'},
                    {label:'本月新增', val:'+7', sub:'个技能', color:'text-orange-400', bg:'bg-orange-500/10', border:'border-orange-500/20'},
                  ] as const).map(s => (
                    <div key={s.label} className={`rounded-xl p-4 text-center border ${s.bg} ${s.border}`}>
                      <div className={`text-xl font-bold ${s.color}`}>{s.val}<span className="text-sm font-normal opacity-60">{s.sub}</span></div>
                      <div className="text-[10px] text-slate-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* TOP10技能使用排行 */}
                <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                  <div className="text-sm font-bold text-white mb-4">🏆 TOP10 热门技能</div>
                  <div className="space-y-2">
                    {skillUsageStats.map((stat, i) => (
                      <div key={stat.skillName} className="flex items-center gap-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${
                          i === 0 ? 'bg-amber-500/20 text-amber-400' :
                          i === 1 ? 'bg-slate-400/20 text-slate-300' :
                          i === 2 ? 'bg-orange-600/20 text-orange-400' :
                          'bg-slate-800 text-slate-600'
                        }`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-medium text-white truncate">{stat.skillName}</span>
                            <span className="text-[9px] text-slate-500 ml-2 flex-shrink-0">{stat.totalUse.toLocaleString()}次</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-cyan-500 to-orange-400 rounded-full"
                              style={{width: `${(stat.totalUse / skillUsageStats[0].totalUse) * 100}%`}} />
                          </div>
                        </div>
                        <span className="text-[9px] text-emerald-400 flex-shrink-0 w-10 text-right">{stat.successRate}%</span>
                        <span className="text-[8px] text-slate-600 flex-shrink-0 w-14 text-right">{stat.lastUsed}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 各模块使用分布 */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                    <div className="text-sm font-bold text-white mb-4">📊 模块使用分布</div>
                    {([
                      {cat:'选品调研', icon:'🔍', pct:28, color:'bg-cyan-500', count:4437},
                      {cat:'流量获客', icon:'📈', pct:35, color:'bg-emerald-500', count:5535},
                      {cat:'内容创作', icon:'🎬', pct:20, color:'bg-pink-500', count:3163},
                      {cat:'转化优化', icon:'💰', pct:10, color:'bg-amber-500', count:1585},
                      {cat:'履约运营', icon:'📦', pct:5, color:'bg-sky-500', count:792},
                      {cat:'品牌管理', icon:'🏷️', pct:2, color:'bg-violet-500', count:335},
                    ] as const).map(item => (
                      <div key={item.cat} className="flex items-center gap-2 mb-2">
                        <span className="text-sm">{item.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[10px] text-slate-400">{item.cat}</span>
                            <span className="text-[9px] text-slate-500">{item.count}次 · {item.pct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{width:`${item.pct}%`}} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                    <div className="text-sm font-bold text-white mb-4">🤖 执行效率分析</div>
                    {([
                      {label:'平均执行时长', val:'2分38秒', trend:'↓12%', good:true, icon:'⏱'},
                      {label:'成功率', val:'93.4%', trend:'↑3.2%', good:true, icon:'✓'},
                      {label:'并发能力', val:'5个/分钟', trend:'稳定', good:true, icon:'⚡'},
                      {label:'API调用成本', val:'¥0.34/次', trend:'↓8%', good:true, icon:'💰'},
                      {label:'日均执行', val:'128次', trend:'↑22%', good:true, icon:'📈'},
                      {label:'平均响应速度', val:'1.2秒', trend:'↓18%', good:true, icon:'🚀'},
                    ] as const).map(item => (
                      <div key={item.label} className="flex items-center gap-2 py-1.5 border-b border-slate-800/50 last:border-0">
                        <span className="text-sm">{item.icon}</span>
                        <div className="flex-1">
                          <div className="text-[10px] text-slate-400">{item.label}</div>
                        </div>
                        <span className="text-[10px] font-bold text-white">{item.val}</span>
                        <span className={`text-[9px] font-medium ${item.good ? 'text-emerald-400' : 'text-red-400'}`}>{item.trend}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


        {activeTab === 'sop' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">📋</span>
                <div>
                  <h2 className="text-lg font-bold text-white">SOP流程库</h2>
                  <p className="text-xs text-slate-500">标准化操作流程 · 一键启动 · 机器人自动化执行</p>
                </div>
              </div>
              <div className="text-[10px] text-slate-500">
                <span className="text-pink-400">⚡ {sopExecutions.filter(s => s.status === 'running').length} 运行中</span>
                <span className="mx-2">·</span>
                <span className="text-emerald-400">✓ {sopExecutions.filter(s => s.status === 'completed').length} 已完成</span>
              </div>
            </div>

            {/* 运行中的SOP */}
            {sopExecutions.filter(s => s.status === 'running').length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-bold text-white">⚡ 执行中</div>
                {sopExecutions.filter(s => s.status === 'running').map(exec => (
                  <div key={exec.id} className="rounded-xl border border-cyan-500/20 bg-cyan-950/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-pink-400 animate-pulse">⚡</span>
                        <span className="text-sm font-bold text-white">{exec.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${exec.type === 'B2B' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>{exec.type}</span>
                      </div>
                      <span className="text-xs text-cyan-400 font-bold">{Math.round(exec.progress)}%</span>
                    </div>
                    <ProgressBar value={exec.progress} color="bg-cyan-400" />
                    <div className="flex items-center gap-0.5 mt-2">
                      {exec.steps.map((step, i) => (
                        <React.Fragment key={step}>
                          <div className="flex-1 text-center">
                            <div className={`text-[9px] py-1 rounded-md border ${i <= exec.currentStep ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-slate-800 text-slate-500 border-slate-700/40'}`}>{step}</div>
                          </div>
                          {i < exec.steps.length - 1 && <div className={`w-4 h-0.5 ${i < exec.currentStep ? 'bg-cyan-500/40' : 'bg-slate-700/40'}`} />}
                        </React.Fragment>
                      ))}
                    </div>
                    <div className="text-[9px] text-slate-500 mt-1">当前: {exec.steps[exec.currentStep]}</div>
                  </div>
                ))}
              </div>
            )}

            {/* SOP卡片 */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { id: 'SOP-B2B-001', name: '外贸询盘转化闭环', type: 'B2B', color: 'cyan', steps: ['GEO霸屏', '意图识别', '内容触达', 'Flipbook展示', 'SOP跟进', '成交'], desc: '从GEO霸屏到询盘转化的完整B2B闭环' },
                { id: 'SOP-B2C-001', name: 'TikTok爆款打造', type: 'B2C', color: 'pink', steps: ['选品调研', '内容生成', '矩阵分发', '数据复盘', '爆款复制', '规模化'], desc: 'AI驱动TikTok从选品到规模化的完整流程' },
                { id: 'SOP-GEO-001', name: 'AI搜索霸屏计划', type: 'B2B', color: 'violet', steps: ['关键词挖掘', '内容布局', 'Prompt优化', 'Citation监测', '排名提升', '流量承接'], desc: '针对Perplexity/Gemini/ChatGPT的GEO优化' },
                { id: 'SOP-AUTO-001', name: 'OpenClaw全自动化', type: 'B2C', color: 'amber', steps: ['OpenSpace学习', 'Agent编排', '任务分发', 'Heartbeat监控', 'ClawTip结算', '数字永生'], desc: '从知识学习到数字永生的完整自动化' },
              ].map(sop => {
                const borderMap: Record<string, string> = { cyan:'border-cyan-500/30 bg-cyan-500/3', violet:'border-violet-500/30 bg-violet-500/3', pink:'border-pink-500/30 bg-pink-500/3', amber:'border-amber-500/30 bg-amber-500/3' };
                const textMap: Record<string, string> = { cyan:'text-cyan-300', violet:'text-violet-300', pink:'text-pink-300', amber:'text-amber-300' };
                const isRunning = sopExecutions.some(e => e.id.startsWith(sop.id) && e.status === 'running');
                return (
                  <div key={sop.id} className={`rounded-xl border p-5 ${borderMap[sop.color]}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-[10px] text-slate-500">{sop.id}</div>
                        <div className={`text-sm font-bold ${textMap[sop.color]} mt-0.5`}>{sop.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{sop.desc}</div>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full ${sop.type === 'B2B' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-pink-500/10 text-pink-400 border border-pink-500/20'}`}>{sop.type}</span>
                    </div>
                    {/* 流程 */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {sop.steps.map((step, i) => (
                        <React.Fragment key={step}>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/40">{step}</span>
                          {i < sop.steps.length - 1 && <span className="text-slate-700 text-[9px] self-center">→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    <button
                      onClick={() => handleStartSOP(sop.id)}
                      disabled={isRunning}
                      className={`w-full py-2 rounded-lg text-xs font-medium transition-colors border ${
                        isRunning ? 'bg-slate-800 text-slate-500 border-slate-700/40 cursor-not-allowed' :
                        sop.type === 'B2B'
                          ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/20 hover:bg-cyan-600/30'
                          : 'bg-pink-600/20 text-pink-400 border-pink-500/20 hover:bg-pink-600/30'
                      }`}>
                      {isRunning ? '⚡ 执行中…' : '▶ 启动SOP流程'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* SOP执行历史 */}
            {sopExecutions.filter(s => s.status === 'completed').length > 0 && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                <div className="text-sm font-bold text-white mb-3">✓ 执行历史</div>
                <div className="space-y-2">
                  {sopExecutions.filter(s => s.status === 'completed').slice(0, 5).map(exec => (
                    <div key={exec.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-2">
                      <span className="text-emerald-400">✓</span>
                      <span className="text-xs text-white font-medium flex-1">{exec.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${exec.type === 'B2B' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-pink-500/10 text-pink-400'}`}>{exec.type}</span>
                      <span className="text-[10px] text-slate-500">100%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════  MODAL 对话框  ═══════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}

      {/* GEO关键词添加 */}
      <Modal open={geoModal} onClose={() => setGeoModal(false)} title="🌐 添加GEO关键词">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">关键词</label>
            <input value={newGeoKeyword} onChange={e => setNewGeoKeyword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddGeoKeyword()}
              placeholder="例如: industrial aluminum supplier China OEM"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-colors" />
            <p className="text-[10px] text-slate-500 mt-1">将自动提交AI分析并部署至Perplexity/Gemini/ChatGPT</p>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">目标搜索引擎</label>
            <div className="flex gap-2">
              {['Perplexity', 'Gemini', 'ChatGPT', '全平台'].map(e => (
                <label key={e} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer hover:border-cyan-500/30 transition-colors">
                  <input type="checkbox" defaultChecked className="accent-cyan-400" />{e}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setGeoModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">取消</button>
            <button onClick={handleAddGeoKeyword} className="flex-1 py-2.5 rounded-xl bg-cyan-600/20 text-cyan-400 text-sm font-medium border border-cyan-500/20 hover:bg-cyan-600/30 transition-colors">
              🤖 AI分析并部署
            </button>
          </div>
        </div>
      </Modal>

      {/* Flipbook创建 */}
      <Modal open={flipbookModal} onClose={() => setFlipbookModal(false)} title="📖 创建Flipbook">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">画册标题</label>
            <input value={newFlipbookTitle} onChange={e => setNewFlipbookTitle(e.target.value)}
              placeholder="例如: 2026新款环保泳装产品画册"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">访问URL</label>
            <input value={newFlipbookUrl} onChange={e => setNewFlipbookUrl(e.target.value)}
              placeholder="例如: flipbook.page/your-company/product"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50 focus:ring-1 focus:ring-pink-500/20 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">内容类型</label>
            <div className="grid grid-cols-2 gap-2">
              {['B2B产品画册', 'B2B供应链', '品牌故事', '工厂实景'].map(t => (
                <label key={t} className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 cursor-pointer hover:border-pink-500/30 transition-colors">
                  <input type="radio" name="fbt" defaultChecked className="accent-pink-400" />{t}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFlipbookModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">取消</button>
            <button onClick={handleCreateFlipbook} className="flex-1 py-2.5 rounded-xl bg-pink-600/20 text-pink-400 text-sm font-medium border border-pink-500/20 hover:bg-pink-600/30 transition-colors">
              📖 生成Flipbook
            </button>
          </div>
        </div>
      </Modal>

      {/* TikTok矩阵管理 */}
      <Modal open={tiktokModal} onClose={() => setTikTokModal(false)} title="🎬 TikTok矩阵管理" size="xl">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: '账号总数', value: `${tiktokAccounts.length}`, color: 'text-pink-400' },
              { label: '运行中', value: `${tiktokAccounts.filter(a => a.status === 'running').length}`, color: 'text-emerald-400' },
              { label: '总粉丝', value: (tiktokAccounts.reduce((a, b) => a + b.followers, 0) / 10000).toFixed(1) + '万', color: 'text-amber-400' },
              { label: '今日浏览', value: (tiktokAccounts.reduce((a, b) => a + b.todayViews, 0) / 10000).toFixed(1) + '万', color: 'text-cyan-400' },
            ].map(m => (
              <div key={m.label} className="rounded-xl bg-slate-800/60 p-3 text-center border border-slate-700/40">
                <div className={`text-lg font-bold ${m.color}`}>{m.value}</div>
                <div className="text-[10px] text-slate-500">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {tiktokAccounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-4 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-900/40 to-violet-900/40 flex items-center justify-center text-2xl">🎬</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{acc.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${acc.status === 'running' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{acc.status === 'running' ? '运行中' : '已暂停'}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-0.5 text-[10px]">
                    <span className="text-slate-400">粉丝 <span className="text-white">{acc.followers.toLocaleString()}</span></span>
                    <span className="text-slate-400">视频 <span className="text-white">{acc.videos}</span></span>
                    <span className="text-slate-400">今日浏览 <span className="text-pink-400">{acc.todayViews.toLocaleString()}</span></span>
                    <span className="text-slate-500">领域: {acc.niche}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleTikTok(acc.id)} className={`text-[10px] px-3 py-1.5 rounded-lg font-medium ${
                    acc.status === 'running' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>{acc.status === 'running' ? '⏸' : '▶'}</button>
                  <button className="text-[10px] px-3 py-1.5 rounded-lg bg-slate-700 text-slate-400">✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 商品添加 */}
      <Modal open={productModal} onClose={() => setProductModal(false)} title="📦 添加商品SKU">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">商品名称</label>
            <input placeholder="商品名称（英文）" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">平台</label>
              <select className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500/50">
                {['TikTok Shop', 'Amazon', 'Shopee', 'Lazada', 'eBay'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">价格</label>
              <input placeholder="$0.00" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">SKU编号</label>
            <input placeholder="例如: PROD-001" className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setProductModal(false)} className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">取消</button>
            <button onClick={() => { setProductModal(false); addToast('📦 商品已添加至草稿，等待AI优化Listing…', 'success'); }} className="flex-1 py-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 text-sm font-medium border border-emerald-500/20 hover:bg-emerald-600/30 transition-colors">
              🤖 AI生成Listing
            </button>
          </div>
        </div>
      </Modal>

      {/* 任务调度中心 */}
      <Modal open={agentModal} onClose={() => setAgentModal(false)} title="🤖 任务调度中心" size="xl">
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            {['全部', '运行中', '已完成', '队列中'].map(s => (
              <button key={s} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50 hover:text-white transition-colors whitespace-nowrap">{s}</button>
            ))}
          </div>
          <div className="space-y-2">
            {taskQueue.map(task => (
              <div key={task.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/40">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold ${
                  task.status === 'running' ? 'bg-cyan-500/20 text-cyan-400' : task.status === 'done' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                }`}>{task.agent[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white">{task.title}</div>
                  <div className="text-[10px] text-slate-500">{task.agent} · {task.created}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    task.status === 'running' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    task.status === 'done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-slate-700 text-slate-400'
                  }`}>{task.status === 'running' ? '⚡' : task.status === 'done' ? '✓' : '⏳'} {task.duration}</span>
                  {task.status === 'queued' && <button className="text-[9px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">启动</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* 工具配置详情 */}
      <Modal open={toolDetailModal} onClose={() => setToolDetailModal(false)} title={selectedTool ? `⚙️ ${selectedTool.icon} ${selectedTool.name}` : '⚙️ AI工具配置'} size="xl">
        {selectedTool && (
          <div className="space-y-4">
            {/* 工具基本信息 */}
            <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl">{selectedTool.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-white">{selectedTool.name}</div>
                  <div className="text-[10px] text-slate-400">{selectedTool.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-violet-400">{selectedTool.usageCount.toLocaleString()}</div>
                  <div className="text-[9px] text-slate-500">总使用次数</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {selectedTool.features.map(f => (
                  <div key={f.label} className="rounded-lg bg-slate-800/60 p-2 text-center">
                    <div className="text-[9px] text-slate-500">{f.label}</div>
                    <div className="text-xs font-semibold text-white">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 工具子标签 */}
            <div className="flex gap-1">
              {([
                {id:'overview',label:'快捷操作',icon:'⚡'},
                {id:'api',label:'API配置',icon:'🔑'},
                {id:'stats',label:'使用统计',icon:'📊'},
              ] as const).map(tab => (
                <button key={tab.id} onClick={() => setToolTab(tab.id)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    toolTab === tab.id
                      ? 'bg-violet-500/10 text-violet-400 border-violet-500/30'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white'
                  }`}>
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* 快捷操作面板 */}
            {toolTab === 'overview' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">⚡ 快捷操作</div>
                <div className="grid grid-cols-2 gap-2">
                  {selectedTool.quickActions.map(qa => (
                    <button key={qa.label}
                      onClick={() => handleToolQuickAction(selectedTool, qa.action)}
                      className="flex items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700/40 px-4 py-3 text-xs text-white hover:bg-slate-700/60 hover:border-violet-500/20 transition-all">
                      <span className="text-base">{qa.icon}</span>
                      <span className="font-medium">{qa.label}</span>
                    </button>
                  ))}
                </div>
                {selectedTool.url && selectedTool.url !== '#' && (
                  <a href={selectedTool.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl bg-sky-500/10 border border-sky-500/20 px-4 py-3 text-xs text-sky-400 hover:bg-sky-500/20 transition-all">
                    <span>🔗</span>
                    <span>打开 {selectedTool.name} 官网</span>
                    <span className="ml-auto text-[9px] opacity-60">{selectedTool.url}</span>
                  </a>
                )}
              </div>
            )}

            {/* API配置面板 */}
            {toolTab === 'api' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">🔑 API密钥配置</div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3">
                  <div>
                    <label className="text-[10px] text-slate-400 mb-1 block">API密钥</label>
                    <div className="flex gap-2">
                      <input type="password" value={toolApiKeys[selectedTool.id] || ''}
                        onChange={e => setToolApiKeys(prev => ({...prev, [selectedTool.id]: e.target.value}))}
                        placeholder={selectedTool.status === 'connected' ? '已保存 ••••••••••••••' : '请输入 API 密钥'}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/50" />
                      <button onClick={() => addToast(`✅ ${selectedTool.name} API密钥已保存`, 'success')}
                        className="text-[10px] px-4 py-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20">
                        💾 保存
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-1">
                      {selectedTool.url && selectedTool.url !== '#'
                        ? <>从 <a href={selectedTool.url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{selectedTool.name} 官网</a> 获取API密钥</>
                        : '请联系管理员获取API密钥'}
                    </p>
                  </div>
                  {selectedTool.status === 'connected' ? (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-emerald-400 text-sm">✓</span>
                      <span className="text-xs text-emerald-400">API已连接 · 上次使用: {selectedTool.lastUsed}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <span className="text-amber-400 text-sm">⚠</span>
                      <span className="text-xs text-amber-400">API未配置 · 请先保存密钥后点击连接</span>
                    </div>
                  )}
                </div>
                <div className="text-xs font-semibold text-slate-300 mt-2">⚙️ MCP设置</div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">MCP服务地址</span>
                    <span className="text-[10px] text-white">https://api.{selectedTool.id || selectedTool.name.toLowerCase().replace(/\s+/g,'')}.ai</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">认证方式</span>
                    <span className="text-[10px] text-white">API Key</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">使用限额</span>
                    <span className="text-[10px] text-white">1000次/日</span>
                  </div>
                </div>
                <button onClick={() => { if (selectedTool.status === 'disconnected') handleConnectTool(selectedTool); addToast(`✅ ${selectedTool.name} API配置已保存`, 'success'); }}
                  className="w-full py-2.5 rounded-xl bg-violet-500/20 text-violet-400 text-sm font-medium border border-violet-500/20 hover:bg-violet-500/30 transition-colors">
                  {selectedTool.status === 'connected' ? '✅ 保存配置' : '🔗 连接工具'}
                </button>
              </div>
            )}

            {/* 使用统计面板 */}
            {toolTab === 'stats' && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-300">📊 使用统计</div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="rounded-xl bg-slate-800/60 p-3 text-center border border-slate-700/40">
                    <div className="text-lg font-bold text-violet-400">{selectedTool.usageCount.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500">总使用</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-3 text-center border border-slate-700/40">
                    <div className="text-lg font-bold text-emerald-400">{selectedTool.usageTrend[selectedTool.usageTrend.length - 1]}</div>
                    <div className="text-[9px] text-slate-500">本周使用</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-3 text-center border border-slate-700/40">
                    <div className="text-lg font-bold text-cyan-400">{selectedTool.status === 'connected' ? '在线' : '离线'}</div>
                    <div className="text-[9px] text-slate-500">当前状态</div>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-3 text-center border border-slate-700/40">
                    <div className="text-lg font-bold text-amber-400">{selectedTool.lastUsed}</div>
                    <div className="text-[9px] text-slate-500">上次使用</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                  <div className="text-[10px] text-slate-400 mb-2">📈 近7天使用趋势</div>
                  <div className="flex items-end gap-1 h-16">
                    {selectedTool.usageTrend.map((val, i) => {
                      const max = Math.max(...selectedTool.usageTrend);
                      const h = max > 0 ? Math.round((val / max) * 100) : 0;
                      const days = ['一','二','三','四','五','六','日'];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full bg-slate-700/40 rounded-t-sm relative" style={{height:'56px'}}>
                            <div className="absolute bottom-0 w-full rounded-t-sm transition-all bg-gradient-to-t from-violet-600 to-violet-400"
                              style={{height:`${h}%`, minHeight: h > 0 ? '3px' : '0'}} />
                          </div>
                          <span className="text-[8px] text-slate-500">{days[i]}</span>
                          <span className="text-[8px] text-slate-400">{val}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                  <div className="text-[10px] text-slate-400 mb-2">🎯 功能分布</div>
                  <div className="space-y-1.5">
                    {[
                      {label:'内容生成',pct:65,color:'bg-violet-500'},
                      {label:'批量处理',pct:25,color:'bg-cyan-500'},
                      {label:'其他功能',pct:10,color:'bg-slate-600'},
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-2">
                        <div className="w-20 text-[9px] text-slate-400">{item.label}</div>
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{width:`${item.pct}%`}} />
                        </div>
                        <div className="w-10 text-right text-[9px] text-white">{item.pct}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* 工具列表 */}
      <Modal open={toolModal} onClose={() => setToolModal(false)} title="⚙️ AI工具配置" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {toolConfigs.filter(t => t.status === 'connected').slice(0, 6).map(tool => (
              <div key={tool.name} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 hover:border-violet-500/20 transition-colors">
                <span className="text-xl">{tool.icon}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-white">{tool.name}</div>
                  <div className="text-[9px] text-slate-400">{tool.usageCount.toLocaleString()}次使用 · {tool.lastUsed}</div>
                </div>
                <button onClick={() => handleOpenToolDetail(tool)}
                  className="text-[9px] px-3 py-1.5 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors">
                  配置
                </button>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-500 text-center py-2">点击「配置」进入详细配置面板</div>
  

      {/* 发布内容完整编辑器 */}
      <Modal open={matrixPostModal} onClose={() => setMatrixPostModal(false)} title="✏️ 同步发布内容编辑器" size="xl">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">选择发布平台</label>
            <div className="flex flex-wrap gap-2">
              {(['facebook','x','linkedin','instagram','tiktok','whatsapp'] as const).map(p => {
                const cfg = platformConfig[p];
                const sel = postPlatforms.includes(p);
                return (<button key={p} onClick={() => setPostPlatforms(prev => sel ? prev.filter(x => x !== p) : [...prev, p])}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sel ? 'text-white' : 'text-slate-500 bg-slate-800'}`}
                  style={sel ? {backgroundColor: cfg.bg, borderColor: cfg.border, color: cfg.color} : {borderColor: 'rgba(100,116,139,0.3)'}}>
                  {cfg.icon} {cfg.name}
                  {sel && <span className="ml-1 text-[9px] opacity-70">✓</span>}
                </button>);
              })}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1 block">内容正文</label>
            <textarea value={postContent} onChange={e => setPostContent(e.target.value)}
              placeholder="输入发布内容... AI将自动适配各平台格式"
              className="w-full h-32 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-sky-500/50" />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
            <button onClick={() => { handlePostToMatrix(); setMatrixPostModal(false); }}
              disabled={!postContent.trim() || !postPlatforms.length}
              className="text-xs px-4 py-2 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/20 hover:bg-sky-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              📤 确认发布到 {postPlatforms.length} 个平台
            </button>
            <span className="text-[10px] text-slate-500">已选平台将同步收到相同内容，AI自动优化各平台适配格式</span>
          </div>
        </div>
      </Modal>

      {/* AnyGen AI 客服 Modal */}
      <Modal open={anygenModal} onClose={() => setAnygenModal(false)} title="🤖 AnyGen AI 全能销售运营客服" size="lg">
        <div className="space-y-4">
          <div className="bg-indigo-950/30 rounded-xl p-4 border border-indigo-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🤖</span>
              <span className="text-xs font-bold text-indigo-300">AnyGen 智能客服 · https://www.anygen.io/assistant</span>
            </div>
            <p className="text-[10px] text-slate-400">AnyGen基于AI大模型，专为外贸B2B场景设计，支持多语言即时响应、询盘智能处理、Lead意向判断和全渠道自动跟进。</p>
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            {[{label:'回复询盘',prompt:'回复来自德国的泳装询盘'},{label:'生成多语言介绍',prompt:'生成多语言产品介绍'},{label:'Lead分析',prompt:'分析今日询盘质量'},{label:'WhatsApp话术',prompt:'生成WhatsApp回复话术'}].map(ex => (
              <button key={ex.label} onClick={() => setAnygenQuery(ex.prompt)} className="text-[9px] px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">{ex.label}</button>
            ))}
          </div>
          <textarea value={anygenQuery} onChange={e => setAnygenQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAnygenQuery(); } }}
            placeholder="输入AnyGen指令..."
            className="w-full h-20 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/50" />
          <button onClick={handleAnygenQuery} className="text-xs px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/30 transition-colors">🤖 发送</button>
          {anygenResponse && (
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="text-[10px] text-indigo-400 mb-1.5">🤖 AnyGen 回复</div>
              <div className="text-xs text-slate-300 whitespace-pre-wrap">{anygenResponse}</div>
            </div>
          )}
        </div>
      </Modal>

      {/* 账号详情 Modal */}
      <Modal open={accountDetailModal} onClose={() => setAccountDetailModal(false)} title={`👤 ${selectedAccount?.displayName || '账号详情'}`} size="md">
        {selectedAccount && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold border-2" style={{borderColor: selectedAccount.status === 'connected' ? '#22c55e' : '#64748b', backgroundColor: platformConfig[selectedAccount.platform]?.bg, color: platformConfig[selectedAccount.platform]?.color}}>
                {selectedAccount.avatar}
              </div>
              <div>
                <div className="text-sm font-bold text-white">{selectedAccount.displayName}</div>
                <div className="text-[10px] text-slate-500">@{selectedAccount.username}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedAccount.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-500'}`}>{selectedAccount.status === 'connected' ? '🟢 已连接' : '⚫ 离线'}</span>
                  <span className="text-[9px] text-slate-500">🌍 {selectedAccount.country}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {selectedAccount.followers !== undefined && [<span key="f" className="bg-slate-800/50 rounded-lg p-2 text-center"><div className="text-sm font-bold text-white">{selectedAccount.followers.toLocaleString()}</div><div className="text-[9px] text-slate-500">粉丝</div></span>]}
              {selectedAccount.posts !== undefined && [<span key="p" className="bg-slate-800/50 rounded-lg p-2 text-center"><div className="text-sm font-bold text-white">{selectedAccount.posts}</div><div className="text-[9px] text-slate-500">帖子</div></span>]}
            </div>
            {selectedAccount.bio && <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-[9px] text-slate-500 mb-1">简介</div><div className="text-xs text-slate-300">{selectedAccount.bio}</div></div>}
            {selectedAccount.status === 'connected' && selectedAccount.ipAddress && <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-[9px] text-slate-500 mb-1">当前IP · VPN</div><div className="text-xs text-sky-400">{selectedAccount.ipAddress} · {vpnProfiles.find(v => v.id === selectedAccount.vpnProfile)?.name}</div></div>}
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-[9px] text-slate-500 mb-1">连接时间</div><div className="text-xs text-slate-300">{selectedAccount.connectedAt}</div></div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
              {selectedAccount.status === 'connected' ? (
                <button onClick={() => { handleDisconnectSocial(selectedAccount.id); setAccountDetailModal(false); }} className="text-xs px-4 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">🔌 断开连接</button>
              ) : (
                <button onClick={() => { handleConnectSocial(selectedAccount.id, 'vp-usa'); setAccountDetailModal(false); }} className="text-xs px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">🔗 连接账号</button>
              )}
              <button onClick={() => window.open(selectedAccount.profileUrl, '_blank')} className="text-xs px-4 py-2 rounded-lg bg-slate-800 text-slate-400 border border-slate-700/50 hover:text-white transition-colors">🌐 打开主页</button>
            </div>
          </div>
        )}
      </Modal>

      {/* VPN详情 Modal */}
      <Modal open={vpnDetailModal} onClose={() => setVpnDetailModal(false)} title={`🔐 ${selectedVpn?.name || 'VPN节点详情'}`} size="md">
        {selectedVpn && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold border" style={{backgroundColor: selectedVpn.status === 'active' ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', borderColor: selectedVpn.status === 'active' ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}}>{selectedVpn.name[0]}</div>
              <div>
                <div className="text-sm font-bold text-white">{selectedVpn.name}</div>
                <div className="text-[10px] text-slate-500">📍 {selectedVpn.city}, {selectedVpn.country}</div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${selectedVpn.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700 text-slate-500'}`}>{selectedVpn.status === 'active' ? '🟢 活跃' : '⏸ 待机'}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[{label:'协议',val:selectedVpn.protocol},{label:'带宽',val:selectedVpn.bandwidth},{label:'延迟',val:selectedVpn.ping+'ms'},{label:'负载',val:selectedVpn.load+'%'}].map(s => (
                <div key={s.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                  <div className="text-xs font-bold text-white">{s.val}</div>
                  <div className="text-[8px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-[9px] text-slate-500 mb-1">服务器IP段</div><div className="text-xs text-slate-300">{selectedVpn.serverIp}</div></div>
            <div className="bg-slate-800/50 rounded-lg p-3"><div className="text-[9px] text-slate-500 mb-1">当前连接账号数</div><div className="text-xs text-emerald-400">{selectedVpn.connectedAccounts} / {selectedVpn.maxAccounts}</div></div>
            <div className="flex items-center gap-2 pt-2 border-t border-slate-700/50">
              <button onClick={() => { handleToggleVpn(selectedVpn.id); setVpnDetailModal(false); }} className={`text-xs px-4 py-2 rounded-lg transition-colors ${selectedVpn.status === 'active' ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'}`}>{selectedVpn.status === 'active' ? '⏸ 停用节点' : '▶ 启用节点'}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════ AI技能库详情 Modal ══════════════ */}
      <Modal open={skillModal} onClose={() => setSkillModal(false)} title={selectedSkill ? `${selectedSkill.icon} ${selectedSkill.name}` : '🧠 AI技能库'} size="xl">
        {/* 技能库子标签 */}
        <div className="flex gap-1 mb-4 p-1 bg-slate-800/40 rounded-xl border border-slate-700/40">
          {([
            {id:'overview',label:'技能详情',icon:'📋'},
            {id:'module',label:'模块浏览',icon:'🗂️'},
            {id:'search',label:'搜索',icon:'🔍'},
            {id:'run',label:'执行',icon:'⚡'},
            {id:'config',label:'配置',icon:'⚙️'},
          ] as const).map(tab => (
            <button key={tab.id} onClick={() => setSkillTab(tab.id as any)}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors border ${
                skillTab === tab.id
                  ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                  : 'text-slate-500 border-transparent hover:text-white hover:bg-slate-700/50'
              }`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── 技能详情 ── */}
        {skillTab === 'overview' && selectedSkill && (() => {
          const catColor = (
            { '选品调研':'cyan', '流量获客':'emerald', '内容创作':'pink', '转化优化':'amber', '履约运营':'sky', '品牌管理':'violet' } as Record<string,string>
          )[selectedSkill.cat as string] || 'cyan';
          const usageStats = {
            '智能选品分析师':{used:2847,rate:'98%',last:'今日',prompt:'分析美国市场蓝牙耳机品类的机会与风险'},
            '亚马逊广告投放与ACOS优化':{used:1956,rate:'94%',last:'今日',prompt:'优化某女士连衣裙SP广告的ACOS从45%降至25%'},
            'LinkedIn外贸获客全攻略':{used:1643,rate:'92%',last:'今日',prompt:'找到美国加州LED照明行业采购决策人并生成首封Connection消息'},
            'AI短视频脚本创作师':{used:2108,rate:'97%',last:'今日',prompt:'为宠物自动饮水机创作TikTok带货视频脚本，目标受众为美国年轻女性'},
            'Google企业邮箱搭建全攻略':{used:873,rate:'89%',last:'昨日',prompt:'指导我完成域名采购+DNS配置+企业邮箱搭建的全流程'},
            '跨境电商履约全链路管理':{used:1204,rate:'91%',last:'今日',prompt:'分析从中国工厂到亚马逊FBA美国买家的完整履约链路成本'},
          };
          const stat = (usageStats as Record<string, {used:number;rate:string;last:string;prompt:string}>)[selectedSkill.name as string] || {used:2847,rate:'95%',last:'今日',prompt:'请详细说明此技能的使用方法和最佳实践'};
          return (
            <div className="space-y-4">
              {/* 技能头部信息卡 */}
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/60 p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border border-slate-700/50 bg-slate-800/60 flex-shrink-0">
                    {selectedSkill.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-bold text-white mb-1">{selectedSkill.name}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2.5 py-1 rounded-full border text-white"
                        style={{backgroundColor:'rgba(251,146,60,0.1)',borderColor:'rgba(251,146,60,0.3)',color:'#fb923c'}}>
                        {selectedSkill.cat}
                      </span>
                      <span className="text-[10px] text-slate-500">v1.0 · 成熟技能</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {selectedSkill.desc || '本技能专为跨境外贸场景设计，基于AI大模型与行业最佳实践，可显著提升工作效率与决策质量。'}
                    </p>
                  </div>
                </div>
                {/* 关键指标 */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-orange-400">{stat.used.toLocaleString()}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">累计使用</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-emerald-400">{stat.rate}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">好评率</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-cyan-400">{stat.last}</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">最近使用</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-xl p-3 text-center">
                    <div className="text-lg font-bold text-violet-400">43</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">总技能数</div>
                  </div>
                </div>
              </div>

              {/* 推荐使用提示词 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-orange-400">💡</span> 推荐使用提示词
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                  <div className="text-xs text-slate-300 mb-3 leading-relaxed italic">
                    "{stat.prompt}"
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(stat.prompt);
                      addToast('📋 提示词已复制到剪贴板', 'success');
                    }}
                    className="text-[10px] px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20 transition-colors">
                    📋 复制提示词
                  </button>
                </div>
              </div>

              {/* 技能模块说明 */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="text-orange-400">🗂️</span> 技能说明
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-2">
                  {[
                    '基于最新AI大模型深度训练，针对跨境外贸场景优化',
                    '支持多语言输入与输出，中英文双语界面',
                    '可与其他技能串联使用，构建完整工作流自动化',
                    '持续学习最新行业案例，保持策略的前沿性',
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 text-xs mt-0.5">✓</span>
                      <span className="text-[11px] text-slate-400">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 启动技能 */}
              <div className="flex gap-2 pt-2 border-t border-slate-700/40">
                <button
                  onClick={() => { if (selectedSkill) handleRunSkill(selectedSkill, stat.prompt); else handleRunSkill({name:'智能选品分析师',icon:'🔍',cat:'选品调研',desc:stat.prompt}, stat.prompt); setSkillModal(false); }}
                  className="flex-1 py-3 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-bold border border-orange-500/30 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2">
                  <span>🚀</span> 立即启动此技能
                </button>
                <button
                  onClick={() => setSkillModal(false)}
                  className="px-6 py-3 rounded-xl bg-slate-800 text-slate-400 text-sm hover:bg-slate-700 transition-colors">
                  关闭
                </button>
              </div>
            </div>
          );
        })()}

        {/* ── 模块浏览 ── */}
        {skillTab === 'module' && (
          <div className="space-y-4">
            {/* 模块选择标签 */}
            <div className="flex flex-wrap gap-2">
              {['all','选品调研','流量获客','内容创作','转化优化','履约运营','品牌管理'].map(cat => {
                const isActive = skillModuleFilter === cat || (cat === 'all' && skillModuleFilter === 'all');
                const catColor = {cyan:'cyan',emerald:'emerald',pink:'pink',amber:'amber',sky:'sky',violet:'violet'}[
                  {选品调研:'cyan',流量获客:'emerald',内容创作:'pink',转化优化:'amber',履约运营:'sky',品牌管理:'violet'}[cat] || ''] || '';
                const catIcon = {选品调研:'🔍',流量获客:'📈',内容创作:'🎬',转化优化:'💰',履约运营:'📦',品牌管理:'🏷️'}[cat] || '📋';
                return (
                  <button key={cat}
                    onClick={() => setSkillModuleFilter(cat)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      isActive
                        ? 'bg-orange-500/10 text-orange-400 border-orange-500/30'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-white'
                    }`}>
                    {catIcon} {cat === 'all' ? '全部模块' : cat}
                  </button>
                );
              })}
            </div>
            {/* 模块内技能网格 */}
            <div className="grid grid-cols-3 gap-2">
              {(() => {
                const MODULE_SKILLS = [
                  { icon: '🔍', name: '智能选品分析师', cat: '选品调研', color: 'cyan', desc: 'AI驱动选品：市场容量+竞品扫描+ROI计算', tags: ['选品', '市场分析', 'ROI'] },
                  { icon: '🔬', name: '竞品情报追踪师', cat: '选品调研', color: 'cyan', desc: '实时监控竞品Listing/价格/评价动态', tags: ['竞品监控', '价格追踪', 'ASIN'] },
                  { icon: '🌐', name: '美国市场调研工具箱', cat: '选品调研', color: 'cyan', desc: '市场规模+竞争度+利润空间三维评估', tags: ['市场调研', '美国', 'TAM'] },
                  { icon: '📡', name: '出海美国信息来源全清单', cat: '选品调研', color: 'cyan', desc: '海关数据+行业协会+社媒趋势一站式获取', tags: ['数据源', '美国', '海关'] },
                  { icon: '🎯', name: '关键词趋势猎人', cat: '选品调研', color: 'cyan', desc: '挖掘高搜索量低竞争度长尾关键词', tags: ['关键词', 'SEO', 'PPC'] },
                  { icon: '⚖️', name: '专利风险扫描师', cat: '选品调研', color: 'cyan', desc: '商标/外观/发明专利三重风险自动检测', tags: ['专利', '商标', '风险'] },
                  { icon: '💰', name: '竞品定价策略分析师', cat: '选品调研', color: 'cyan', desc: '竞品价格带+利润空间+动态定价策略', tags: ['定价', '利润', '竞争'] },
                  { icon: '🎯', name: '亚马逊广告投放与ACOS优化', cat: '流量获客', color: 'emerald', desc: 'SP/SB/SD三广告+ACOS五步优化法', tags: ['亚马逊广告', 'ACOS', 'PPC'] },
                  { icon: '📈', name: 'Google+Meta双平台广告投放', cat: '流量获客', color: 'emerald', desc: '独立站引流双引擎+受众精准定向', tags: ['Google Ads', 'Meta Ads', 'DPA'] },
                  { icon: '🌟', name: 'TikTok+Instagram红人营销', cat: '流量获客', color: 'emerald', desc: '红人筛选+合作谈判+效果追踪全链路', tags: ['KOL', 'TikTok', 'Instagram'] },
                  { icon: '💼', name: 'LinkedIn外贸获客全攻略', cat: '流量获客', color: 'sky', desc: '个人IP+Sales Navigator+Connection话术', tags: ['LinkedIn', 'B2B', '获客'] },
                  { icon: '📸', name: 'Instagram外贸增长黑客', cat: '流量获客', color: 'sky', desc: '账号定位+内容策略+涨粉裂变技巧', tags: ['Instagram', '涨粉', '内容'] },
                  { icon: '📧', name: 'Google企业邮箱搭建全攻略', cat: '流量获客', color: 'amber', desc: '域名+DNS配置+Snov.io SMTP+预热', tags: ['企业邮箱', 'Snov.io', '送达率'] },
                  { icon: '🔎', name: 'B2B找客户工具箱·美国篇', cat: '流量获客', color: 'amber', desc: '海关数据+采购数据库+决策人联系方式', tags: ['B2B', '美国', '找客户'] },
                  { icon: '🔎', name: 'SEO+SEM双引擎驱动增长', cat: '流量获客', color: 'amber', desc: '关键词布局+内容矩阵+付费广告协同', tags: ['SEO', 'SEM', '增长'] },
                  { icon: '🎬', name: 'AI短视频脚本创作师', cat: '内容创作', color: 'pink', desc: 'TikTok带货脚本：黄金3秒开场+痛点共鸣', tags: ['短视频脚本', 'TikTok', '带货'] },
                  { icon: '🎬', name: 'AI短剧工作室·爆款流水线', cat: '内容创作', color: 'pink', desc: '连续短剧分镜脚本+情绪节奏设计', tags: ['短剧', 'TikTok', '脚本'] },
                  { icon: '✨', name: 'PixieDream商业广告级AI修图', cat: '内容创作', color: 'pink', desc: '白底图+场景图+创意图AI一键生成', tags: ['修图', 'AI', '主图'] },
                  { icon: '🎨', name: '品牌视觉设计智能体', cat: '内容创作', color: 'pink', desc: 'Logo+VI+包装设计+品牌视觉系统', tags: ['品牌设计', 'VI', '包装'] },
                  { icon: '🛒', name: '亚马逊Listing优化专家', cat: '内容创作', color: 'pink', desc: '标题+五点描述+Search Terms完整优化', tags: ['Listing', 'SEO', '亚马逊'] },
                  { icon: '✉️', name: '外贸邮件开发信创作师', cat: '内容创作', color: 'pink', desc: '多版本开发信+个性化话术+跟进序列', tags: ['开发信', '外贸', '邮件'] },
                  { icon: '📄', name: '亚马逊A+图文详情页设计', cat: '内容创作', color: 'pink', desc: 'A+模块布局+图文模板+转化率优化', tags: ['A+', '亚马逊', '转化'] },
                  { icon: '📊', name: '转化率CRO专项优化师', cat: '转化优化', color: 'amber', desc: '漏斗分析+A/B测试+用户行为热图优化', tags: ['CRO', 'A/B测试', '转化'] },
                  { icon: '💸', name: '亚马逊定价与促销策略师', cat: '转化优化', color: 'amber', desc: '优惠券+会员价+秒杀+捆绑销售策略', tags: ['定价', '促销', '亚马逊'] },
                  { icon: '🖥️', name: '独立站落地页优化专家', cat: '转化优化', color: 'amber', desc: 'Landing Page结构+CTA设计+信任背书', tags: ['落地页', '独立站', '转化'] },
                  { icon: '📺', name: 'TikTok Shop直播带货优化师', cat: '转化优化', color: 'amber', desc: '话术脚本+选品排品+直播数据分析', tags: ['直播', 'TikTok Shop', '带货'] },
                  { icon: '❓', name: '亚马逊QA问答优化师', cat: '转化优化', color: 'amber', desc: '高频问题挖掘+高质量回答+置顶策略', tags: ['QA', '亚马逊', '问答'] },
                  { icon: '💬', name: '亚马逊竞品评论区挖掘师', cat: '转化优化', color: 'amber', desc: '差评机会+好评卖点和差异化卖点提取', tags: ['评论', '竞品', '机会'] },
                  { icon: '📬', name: '邮件营销自动化设计师', cat: '转化优化', color: 'amber', desc: '欢迎序列+复购触达+节日营销邮件流', tags: ['邮件营销', '自动化', 'EDM'] },
                  { icon: '📦', name: '跨境电商履约全链路管理', cat: '履约运营', color: 'sky', desc: 'FBA入仓+Shopify Dropship+海外仓+SLA', tags: ['FBA', '海外仓', '履约'] },
                  { icon: '📦', name: '亚马逊FBA入仓与库存管理', cat: '履约运营', color: 'sky', desc: '入库计划+补货预警+库存周转分析', tags: ['FBA', '库存', '补货'] },
                  { icon: '🚢', name: '跨境物流渠道选择与优化', cat: '履约运营', color: 'sky', desc: '空派/海派/铁运/卡派成本时效比选', tags: ['物流', 'FBA头程', '成本'] },
                  { icon: '↩️', name: '亚马逊退货处理与SLA管理', cat: '履约运营', color: 'sky', desc: '退货原因分析+SLA达标+退款策略', tags: ['退货', 'SLA', '退款'] },
                  { icon: '⚙️', name: '供应链成本优化师', cat: '履约运营', color: 'sky', desc: '供应商比价+谈判策略+MOQ优化', tags: ['供应链', '成本', '供应商'] },
                  { icon: '💳', name: '跨境支付与结汇策略师', cat: '履约运营', color: 'sky', desc: '收款工具+结汇时机+汇率风险管理', tags: ['收款', '结汇', 'Payoneer'] },
                  { icon: '🛡️', name: '亚马逊账号健康度维护', cat: '履约运营', color: 'sky', desc: '绩效指标监控+账号风险预警+申诉模板', tags: ['账号健康', '绩效', '申诉'] },
                  { icon: '🏷️', name: '独立站品牌定位与战略规划', cat: '品牌管理', color: 'violet', desc: '品牌定位三角+Niche市场选择+竞争壁垒', tags: ['品牌定位', '战略', 'Niche'] },
                  { icon: '📖', name: '品牌故事策划师', cat: '品牌管理', color: 'violet', desc: '创始人故事+品牌使命+情感价值主张', tags: ['品牌故事', '内容', '情感'] },
                  { icon: '🤝', name: 'KOL/KOC合作管理流水线', cat: '品牌管理', color: 'violet', desc: '红人筛选+合作模板+效果分成追踪', tags: ['KOL', 'KOC', '合作'] },
                  { icon: '🎯', name: '多渠道品牌一致性管理', cat: '品牌管理', color: 'violet', desc: '品牌手册+视觉规范+多平台统一执行', tags: ['品牌一致性', '多渠道', '规范'] },
                  { icon: '🚨', name: '品牌危机公关处理师', cat: '品牌管理', color: 'violet', desc: '差评公关+舆论监控+品牌修复策略', tags: ['危机公关', '差评', '品牌'] },
                  { icon: '🛡️', name: '亚马逊品牌备案与透明度计划', cat: '品牌管理', color: 'violet', desc: '品牌注册+透明计划+防伪方案', tags: ['品牌备案', '透明计划', '防伪'] },
                  { icon: '🌍', name: '品牌出海战略规划师', cat: '品牌管理', color: 'violet', desc: '市场进入策略+本地化+全渠道布局规划', tags: ['出海', '战略', '本地化'] },
                ];
                const filtered = skillModuleFilter === 'all' ? MODULE_SKILLS : MODULE_SKILLS.filter(s => s.cat === skillModuleFilter);
                return filtered.map(s => (
                  <div key={s.name}
                    className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 hover:border-orange-500/20 transition-all cursor-pointer group"
                    onClick={() => { setSelectedSkill(s); setSkillTab('overview'); }}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-lg">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">{s.name}</div>
                        <div className="text-[8px] text-slate-500">{s.cat}</div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">{s.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map(t => (
                        <span key={t} className="text-[7px] px-1 py-0.5 rounded-full bg-slate-800 text-slate-500">{t}</span>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ── 搜索结果 ── */}
        {skillTab === 'search' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-orange-400">🔍</span>
              <span className="text-xs text-slate-400">搜索: </span>
              <span className="text-sm font-bold text-white">"{skillSearch || '全部技能'}"</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(() => {
                const ALL_43 = [
                  { icon: '🔍', name: '智能选品分析师', cat: '选品调研', color: 'cyan', desc: 'AI驱动选品：市场容量+竞品扫描+ROI计算', tags: ['选品', '市场分析', 'ROI'] },
                  { icon: '🔬', name: '竞品情报追踪师', cat: '选品调研', color: 'cyan', desc: '实时监控竞品Listing/价格/评价动态', tags: ['竞品监控', '价格追踪'] },
                  { icon: '🌐', name: '美国市场调研工具箱', cat: '选品调研', color: 'cyan', desc: '市场规模+竞争度+利润空间三维评估', tags: ['市场调研', '美国'] },
                  { icon: '📡', name: '出海美国信息来源全清单', cat: '选品调研', color: 'cyan', desc: '海关数据+行业协会+社媒趋势一站式获取', tags: ['数据源', '美国'] },
                  { icon: '🎯', name: '关键词趋势猎人', cat: '选品调研', color: 'cyan', desc: '挖掘高搜索量低竞争度长尾关键词', tags: ['关键词', 'SEO'] },
                  { icon: '⚖️', name: '专利风险扫描师', cat: '选品调研', color: 'cyan', desc: '商标/外观/发明专利三重风险自动检测', tags: ['专利', '风险'] },
                  { icon: '💰', name: '竞品定价策略分析师', cat: '选品调研', color: 'cyan', desc: '竞品价格带+利润空间+动态定价策略', tags: ['定价', '利润'] },
                  { icon: '🎯', name: '亚马逊广告投放与ACOS优化', cat: '流量获客', color: 'emerald', desc: 'SP/SB/SD三广告+ACOS五步优化法', tags: ['亚马逊广告', 'ACOS'] },
                  { icon: '📈', name: 'Google+Meta双平台广告投放', cat: '流量获客', color: 'emerald', desc: '独立站引流双引擎+受众精准定向', tags: ['Google Ads', 'Meta Ads'] },
                  { icon: '🌟', name: 'TikTok+Instagram红人营销', cat: '流量获客', color: 'emerald', desc: '红人筛选+合作谈判+效果追踪全链路', tags: ['KOL', 'TikTok'] },
                  { icon: '💼', name: 'LinkedIn外贸获客全攻略', cat: '流量获客', color: 'sky', desc: '个人IP+Sales Navigator+Connection话术', tags: ['LinkedIn', 'B2B'] },
                  { icon: '📸', name: 'Instagram外贸增长黑客', cat: '流量获客', color: 'sky', desc: '账号定位+内容策略+涨粉裂变技巧', tags: ['Instagram', '涨粉'] },
                  { icon: '📧', name: 'Google企业邮箱搭建全攻略', cat: '流量获客', color: 'amber', desc: '域名+DNS配置+Snov.io SMTP+预热', tags: ['企业邮箱', '送达率'] },
                  { icon: '🔎', name: 'B2B找客户工具箱·美国篇', cat: '流量获客', color: 'amber', desc: '海关数据+采购数据库+决策人联系方式', tags: ['B2B', '找客户'] },
                  { icon: '🔎', name: 'SEO+SEM双引擎驱动增长', cat: '流量获客', color: 'amber', desc: '关键词布局+内容矩阵+付费广告协同', tags: ['SEO', 'SEM'] },
                  { icon: '🎬', name: 'AI短视频脚本创作师', cat: '内容创作', color: 'pink', desc: 'TikTok带货脚本：黄金3秒开场+痛点共鸣', tags: ['短视频脚本', 'TikTok'] },
                  { icon: '🎬', name: 'AI短剧工作室·爆款流水线', cat: '内容创作', color: 'pink', desc: '连续短剧分镜脚本+情绪节奏设计', tags: ['短剧', '脚本'] },
                  { icon: '✨', name: 'PixieDream商业广告级AI修图', cat: '内容创作', color: 'pink', desc: '白底图+场景图+创意图AI一键生成', tags: ['修图', 'AI'] },
                  { icon: '🎨', name: '品牌视觉设计智能体', cat: '内容创作', color: 'pink', desc: 'Logo+VI+包装设计+品牌视觉系统', tags: ['品牌设计', 'VI'] },
                  { icon: '🛒', name: '亚马逊Listing优化专家', cat: '内容创作', color: 'pink', desc: '标题+五点描述+Search Terms完整优化', tags: ['Listing', '亚马逊'] },
                  { icon: '✉️', name: '外贸邮件开发信创作师', cat: '内容创作', color: 'pink', desc: '多版本开发信+个性化话术+跟进序列', tags: ['开发信', '邮件'] },
                  { icon: '📄', name: '亚马逊A+图文详情页设计', cat: '内容创作', color: 'pink', desc: 'A+模块布局+图文模板+转化率优化', tags: ['A+', '转化'] },
                  { icon: '📊', name: '转化率CRO专项优化师', cat: '转化优化', color: 'amber', desc: '漏斗分析+A/B测试+用户行为热图优化', tags: ['CRO', 'A/B测试'] },
                  { icon: '💸', name: '亚马逊定价与促销策略师', cat: '转化优化', color: 'amber', desc: '优惠券+会员价+秒杀+捆绑销售策略', tags: ['定价', '促销'] },
                  { icon: '🖥️', name: '独立站落地页优化专家', cat: '转化优化', color: 'amber', desc: 'Landing Page结构+CTA设计+信任背书', tags: ['落地页', '独立站'] },
                  { icon: '📺', name: 'TikTok Shop直播带货优化师', cat: '转化优化', color: 'amber', desc: '话术脚本+选品排品+直播数据分析', tags: ['直播', '带货'] },
                  { icon: '❓', name: '亚马逊QA问答优化师', cat: '转化优化', color: 'amber', desc: '高频问题挖掘+高质量回答+置顶策略', tags: ['QA', '问答'] },
                  { icon: '💬', name: '亚马逊竞品评论区挖掘师', cat: '转化优化', color: 'amber', desc: '差评机会+好评卖点和差异化卖点提取', tags: ['评论', '竞品'] },
                  { icon: '📬', name: '邮件营销自动化设计师', cat: '转化优化', color: 'amber', desc: '欢迎序列+复购触达+节日营销邮件流', tags: ['邮件营销', 'EDM'] },
                  { icon: '📦', name: '跨境电商履约全链路管理', cat: '履约运营', color: 'sky', desc: 'FBA入仓+Shopify Dropship+海外仓+SLA', tags: ['FBA', '履约'] },
                  { icon: '📦', name: '亚马逊FBA入仓与库存管理', cat: '履约运营', color: 'sky', desc: '入库计划+补货预警+库存周转分析', tags: ['FBA', '库存'] },
                  { icon: '🚢', name: '跨境物流渠道选择与优化', cat: '履约运营', color: 'sky', desc: '空派/海派/铁运/卡派成本时效比选', tags: ['物流', '成本'] },
                  { icon: '↩️', name: '亚马逊退货处理与SLA管理', cat: '履约运营', color: 'sky', desc: '退货原因分析+SLA达标+退款策略', tags: ['退货', 'SLA'] },
                  { icon: '⚙️', name: '供应链成本优化师', cat: '履约运营', color: 'sky', desc: '供应商比价+谈判策略+MOQ优化', tags: ['供应链', '成本'] },
                  { icon: '💳', name: '跨境支付与结汇策略师', cat: '履约运营', color: 'sky', desc: '收款工具+结汇时机+汇率风险管理', tags: ['收款', '结汇'] },
                  { icon: '🛡️', name: '亚马逊账号健康度维护', cat: '履约运营', color: 'sky', desc: '绩效指标监控+账号风险预警+申诉模板', tags: ['账号健康', '申诉'] },
                  { icon: '🏷️', name: '独立站品牌定位与战略规划', cat: '品牌管理', color: 'violet', desc: '品牌定位三角+Niche市场选择+竞争壁垒', tags: ['品牌定位', '战略'] },
                  { icon: '📖', name: '品牌故事策划师', cat: '品牌管理', color: 'violet', desc: '创始人故事+品牌使命+情感价值主张', tags: ['品牌故事', '情感'] },
                  { icon: '🤝', name: 'KOL/KOC合作管理流水线', cat: '品牌管理', color: 'violet', desc: '红人筛选+合作模板+效果分成追踪', tags: ['KOL', 'KOC'] },
                  { icon: '🎯', name: '多渠道品牌一致性管理', cat: '品牌管理', color: 'violet', desc: '品牌手册+视觉规范+多平台统一执行', tags: ['品牌一致性', '规范'] },
                  { icon: '🚨', name: '品牌危机公关处理师', cat: '品牌管理', color: 'violet', desc: '差评公关+舆论监控+品牌修复策略', tags: ['危机公关', '差评'] },
                  { icon: '🛡️', name: '亚马逊品牌备案与透明度计划', cat: '品牌管理', color: 'violet', desc: '品牌注册+透明计划+防伪方案', tags: ['品牌备案', '防伪'] },
                  { icon: '🌍', name: '品牌出海战略规划师', cat: '品牌管理', color: 'violet', desc: '市场进入策略+本地化+全渠道布局规划', tags: ['出海', '战略'] },
                ];
                const q = skillSearch.trim().toLowerCase();
                const results = q ? ALL_43.filter(s =>
                  s.name.toLowerCase().includes(q) ||
                  s.desc.toLowerCase().includes(q) ||
                  s.cat.toLowerCase().includes(q) ||
                  s.tags.some(t => t.toLowerCase().includes(q))
                ) : ALL_43;
                if (results.length === 0) {
                  return (
                    <div className="col-span-2 text-center py-12 text-slate-500">
                      <div className="text-3xl mb-2">🔍</div>
                      <div className="text-sm">未找到匹配「{skillSearch}」的技能</div>
                      <div className="text-xs mt-1">尝试搜索：选品、广告、LinkedIn、红人、直播</div>
                    </div>
                  );
                }
                return results.map(s => (
                  <div key={s.name}
                    className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 hover:border-orange-500/20 transition-all cursor-pointer group"
                    onClick={() => { setSelectedSkill(s); setSkillTab('overview'); }}>
                    <div className="flex items-start gap-2 mb-1.5">
                      <span className="text-lg">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-white group-hover:text-orange-400 transition-colors leading-tight">{s.name}</div>
                        <div className="text-[8px] text-slate-500">{s.cat}</div>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-400 mb-1.5 leading-tight">{s.desc}</p>
                    <div className="flex flex-wrap gap-1">
                      {s.tags.map(t => (
                        <span key={t} className="text-[7px] px-1 py-0.5 rounded-full bg-slate-800 text-slate-500">{t}</span>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
            <div className="text-center text-[10px] text-slate-600 pt-2">
              {(() => {
                const q = skillSearch.trim().toLowerCase();
                const ALL_SKILLS_FOR_SEARCH = [
                  {name:'智能选品分析师',tags:['选品','市场分析','ROI']},{name:'竞品情报追踪师',tags:['竞品监控','价格追踪']},{name:'美国市场调研工具箱',tags:['市场调研','美国']},{name:'出海美国信息来源全清单',tags:['数据源','美国']},{name:'关键词趋势猎人',tags:['关键词','SEO']},{name:'专利风险扫描师',tags:['专利','风险']},{name:'竞品定价策略分析师',tags:['定价','利润']},{name:'亚马逊广告投放与ACOS优化',tags:['亚马逊广告','ACOS']},{name:'Google+Meta双平台广告投放',tags:['Google Ads','Meta Ads']},{name:'TikTok+Instagram红人营销',tags:['KOL','TikTok']},{name:'LinkedIn外贸获客全攻略',tags:['LinkedIn','B2B']},{name:'Instagram外贸增长黑客',tags:['Instagram','涨粉']},{name:'Google企业邮箱搭建全攻略',tags:['企业邮箱','送达率']},{name:'B2B找客户工具箱·美国篇',tags:['B2B','找客户']},{name:'SEO+SEM双引擎驱动增长',tags:['SEO','SEM']},{name:'AI短视频脚本创作师',tags:['短视频脚本','TikTok']},{name:'AI短剧工作室·爆款流水线',tags:['短剧','脚本']},{name:'PixieDream商业广告级AI修图',tags:['修图','AI']},{name:'品牌视觉设计智能体',tags:['品牌设计','VI']},{name:'亚马逊Listing优化专家',tags:['Listing','亚马逊']},{name:'外贸邮件开发信创作师',tags:['开发信','邮件']},{name:'亚马逊A+图文详情页设计',tags:['A+','转化']},{name:'转化率CRO专项优化师',tags:['CRO','A/B测试']},{name:'亚马逊定价与促销策略师',tags:['定价','促销']},{name:'独立站落地页优化专家',tags:['落地页','独立站']},{name:'TikTok Shop直播带货优化师',tags:['直播','带货']},{name:'亚马逊QA问答优化师',tags:['QA','问答']},{name:'亚马逊竞品评论区挖掘师',tags:['评论','竞品']},{name:'邮件营销自动化设计师',tags:['邮件营销','EDM']},{name:'跨境电商履约全链路管理',tags:['FBA','履约']},{name:'亚马逊FBA入仓与库存管理',tags:['FBA','库存']},{name:'跨境物流渠道选择与优化',tags:['物流','成本']},{name:'亚马逊退货处理与SLA管理',tags:['退货','SLA']},{name:'供应链成本优化师',tags:['供应链','成本']},{name:'跨境支付与结汇策略师',tags:['收款','结汇']},{name:'亚马逊账号健康度维护',tags:['账号健康','申诉']},{name:'独立站品牌定位与战略规划',tags:['品牌定位','战略']},{name:'品牌故事策划师',tags:['品牌故事','情感']},{name:'KOL/KOC合作管理流水线',tags:['KOL','KOC']},{name:'多渠道品牌一致性管理',tags:['品牌一致性','规范']},{name:'品牌危机公关处理师',tags:['危机公关','差评']},{name:'亚马逊品牌备案与透明度计划',tags:['品牌备案','防伪']},{name:'品牌出海战略规划师',tags:['出海','战略']},
                ];
                const count = q
                  ? ALL_SKILLS_FOR_SEARCH.filter(s => s.name.toLowerCase().includes(q) || s.tags.some((t:string) => t.toLowerCase().includes(q))).length
                  : 43;
                return q ? `找到 ${count} 个技能` : `显示全部 ${count} 个技能`;
              })()}
            </div>
          </div>
        )}

        {/* ── 执行 (Modal内) ── */}
        {skillTab === 'run' && (
          <div className="space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5"><span className="text-orange-400">⚡</span> 输入任务参数</div>
              <textarea value={skillInput} onChange={e => setSkillInput(e.target.value)}
                placeholder="描述您的任务，如：分析美国蓝牙耳机品类的选品机会"
                className="w-full h-24 bg-slate-800/50 border border-slate-700/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-orange-500/40" />
              <div className="flex items-center gap-2 mt-2">
                <button onClick={() => { if (!skillInput.trim()) { addToast('请先输入任务参数', 'error'); return; } const s = selectedSkill || {name:'智能选品分析师',icon:'🔍',cat:'选品调研',desc:'分析美国市场选品机会'}; handleRunSkill(s, skillInput); setSkillModal(false); }}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500/20 text-orange-400 text-sm font-bold border border-orange-500/20 hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-2">
                  <span>🚀</span> 启动技能
                </button>
                <span className="text-[9px] text-slate-600">Enter 发送</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 mb-2">💡 快速参数模板</div>
              <div className="grid grid-cols-2 gap-1.5">
                {([
                  {label:'选品分析',val:'分析美国市场[品类]品类机会与风险',icon:'🔍'},
                  {label:'广告优化',val:'优化[ASIN]广告，ACOS从45%降至25%',icon:'🎯'},
                  {label:'LinkedIn获客',val:'找[行业]行业采购决策人，生成首封消息',icon:'💼'},
                  {label:'TikTok脚本',val:'为[产品]创作TikTok带货视频脚本',icon:'🎬'},
                ] as const).map(p => (
                  <button key={p.label} onClick={() => setSkillInput(p.val)}
                    className="text-[9px] px-2.5 py-1.5 rounded-lg bg-slate-800/50 text-slate-400 border border-slate-700/40 hover:text-white hover:border-orange-500/30 transition-all text-left">
                    <span>{p.icon}</span> {p.label}
                  </button>
                ))}
              </div>
            </div>
            {skillExecutions.length > 0 && (
              <div>
                <div className="text-[10px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                  <span className="text-orange-400">🕐</span> 当前执行记录 <span className="ml-2 text-slate-600">共{skillExecutions.length}条</span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {skillExecutions.slice(0, 8).map(exec => (
                    <div key={exec.id} className={`flex items-center gap-2 rounded-lg px-3 py-2 border text-[10px] ${exec.status === 'running' ? 'bg-orange-950/10 border-orange-500/20' : exec.status === 'failed' ? 'bg-red-950/10 border-red-500/20' : 'bg-slate-900/40 border-slate-800/40'}`}>
                      <span className="text-sm">{exec.skillIcon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white truncate">{exec.skillName}</div>
                        <div className="text-slate-500 truncate">{exec.input}</div>
                      </div>
                      {exec.status === 'running' && (
                        <div className="w-16">
                          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-400 rounded-full" style={{width:`${exec.progress}%`}} />
                          </div>
                          <div className="text-[8px] text-orange-400 text-right">{exec.progress}%</div>
                        </div>
                      )}
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-medium ${exec.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' : exec.status === 'completed' ? 'bg-cyan-500/10 text-cyan-400' : exec.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {exec.status === 'running' ? '⚡' : exec.status === 'completed' ? '✓' : exec.status === 'failed' ? '✗' : '⏳'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 配置 (Modal内) ── */}
        {skillTab === 'config' && (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5"><span className="text-orange-400">🔑</span> API密钥配置</div>
              <div className="space-y-2">
                {([
                  {name:'OpenAI GPT-4', key:'sk-****-****-8f3a', ok:true, icon:'🤖'},
                  {name:'Anthropic Claude-3', key:'sk-****-****-2c9d', ok:true, icon:'🤖'},
                  {name:'Midjourney API', key:'****-****-a1b2', ok:true, icon:'🖼️'},
                  {name:'Jungle Scout', key:'未配置', ok:false, icon:'🔬'},
                ] as const).map(cfg => (
                  <div key={cfg.name} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                    <span>{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="text-[10px] font-medium text-white">{cfg.name}</div>
                      <div className="text-[8px] text-slate-600 font-mono">{cfg.key}</div>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${cfg.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>{cfg.ok ? '✓ 已配置' : '⚠ 未配置'}</span>
                    <button onClick={() => addToast(`🔑 配置 ${cfg.name}...`, 'info')} className="text-[8px] px-2 py-1 rounded bg-slate-700/50 text-slate-400 hover:text-white transition-colors">{cfg.ok ? '修改' : '配置'}</button>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
              <div className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5"><span className="text-orange-400">🎛️</span> 技能默认参数</div>
              <div className="space-y-2">
                {([
                  {skill:'选品分析', param:'分析品类数=10, 市场=美国', icon:'🔍'},
                  {skill:'广告优化', param:'目标ACOS=25%, 竞价策略=CPI', icon:'🎯'},
                  {skill:'内容创作', param:'生成版本=3, 语言=中英双语', icon:'🎬'},
                ] as const).map(p => (
                  <div key={p.skill} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2">
                    <span>{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium text-white">{p.skill}</div>
                      <div className="text-[8px] text-slate-500 truncate">{p.param}</div>
                    </div>
                    <button onClick={() => addToast(`🎛️ 修改 ${p.skill} 默认参数...`, 'info')} className="text-[8px] px-2 py-1 rounded bg-slate-700/50 text-slate-400 hover:text-white transition-colors flex-shrink-0">修改</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>


      </div>
      </Modal>

    </div>
  );
}
