import { useState } from 'react';

interface BrandAsset {
  id: string;
  name: string;
  type: 'logo' | 'banner' | 'icon' | 'font' | 'color' | 'template' | 'video' | 'copy';
  tags: string[];
  description: string;
  preview: string;
  downloadUrl?: string;
  lastUpdated: string;
  usageGuideline?: string;
}

const MOCK_ASSETS: BrandAsset[] = [
  {
    id: 'ba001',
    name: '龙虾集群主Logo（完整版）',
    type: 'logo',
    tags: ['主品牌', 'PNG', 'SVG', 'AI'],
    description: '龙虾集群主品牌Logo，包含完整色彩版本、透明背景版本，适用于所有正式场合',
    preview: '🦞',
    lastUpdated: '2026-04-20',
    usageGuideline: '最小使用尺寸：48px；禁止拉伸变形；单色版本用于深色背景',
  },
  {
    id: 'ba002',
    name: '龙虾集群Logo（单色版）',
    type: 'logo',
    tags: ['主品牌', '单色', 'PNG', 'SVG'],
    description: '单色版本Logo，适用于单色印刷、单一色调场景',
    preview: '🦞',
    lastUpdated: '2026-04-20',
  },
  {
    id: 'ba003',
    name: '跨境龙虾社BANNER套装',
    type: 'banner',
    tags: ['社交媒体', '横版', '9套'],
    description: '覆盖Facebook、Instagram、Twitter、LinkedIn的官方Banner模板，共9个尺寸规格',
    preview: '🖼️',
    lastUpdated: '2026-04-18',
  },
  {
    id: 'ba004',
    name: 'AI太极系统图标集',
    type: 'icon',
    tags: ['UI图标', 'SVG', 'PNG', '2K'],
    description: 'AI太极系统专用UI图标集，包含64个主题图标，支持多尺寸导出',
    preview: '☯️',
    lastUpdated: '2026-04-15',
  },
  {
    id: 'ba005',
    name: '品牌主色盘（CMYK+HEX+RGB）',
    type: 'color',
    tags: ['色彩规范', 'Pantone', '印刷'],
    description: '品牌官方色彩体系，包含主色、辅色、渐变色及对应印刷色值',
    preview: '🎨',
    lastUpdated: '2026-04-10',
  },
  {
    id: 'ba006',
    name: '品牌字体家族（中文+英文）',
    type: 'font',
    tags: ['Typography', '可商用', '版权字体'],
    description: '品牌指定字体包：思源黑体（中文）、Montserrat（英文），含全套字重',
    preview: 'Aa',
    lastUpdated: '2026-04-08',
  },
  {
    id: 'ba007',
    name: '品牌介绍PPT模板',
    type: 'template',
    tags: ['演示文稿', 'Keynote', 'PPT', 'Google Slides'],
    description: '龙虾集群官方品牌介绍演示模板，包含封面、目录、内容、结尾共20+页',
    preview: '📊',
    lastUpdated: '2026-04-05',
  },
  {
    id: 'ba008',
    name: '海外推广短视频模板包',
    type: 'video',
    tags: ['短视频', 'TikTok', 'Reels', 'Shorts'],
    description: '15套品牌短视频模板，含开场动画、转场特效、结尾Logo动画，适用于TikTok/Reels/Shorts',
    preview: '🎬',
    lastUpdated: '2026-04-01',
  },
  {
    id: 'ba009',
    name: '品牌营销文案库（2026Q2）',
    type: 'copy',
    tags: ['文案', 'Slogan', '海外营销', '多语言'],
    description: '2026年Q2季度营销文案库，含品牌故事、产品卖点、促销文案，支持中英日韩4种语言',
    preview: '✍️',
    lastUpdated: '2026-03-28',
  },
  {
    id: 'ba010',
    name: '龙蟹IP吉祥物套装',
    type: 'logo',
    tags: ['IP形象', '矢量', '表情包'],
    description: '龙虾集群IP吉祥物「龙蟹」全套形象，包含正面/侧面/3D渲染/表情包32款',
    preview: '🦞',
    lastUpdated: '2026-03-20',
  },
  {
    id: 'ba011',
    name: '海外社交媒体头像包',
    type: 'banner',
    tags: ['头像', 'Profile', '社交媒体'],
    description: '覆盖Facebook、Instagram、Twitter、TikTok品牌页面的头像模板（圆形+方形）',
    preview: '👤',
    lastUpdated: '2026-03-15',
  },
  {
    id: 'ba012',
    name: '品牌水印Logo（半透明版）',
    type: 'logo',
    tags: ['水印', '透明', '版权保护'],
    description: '低透明度品牌水印Logo，适用于图片/视频版权保护标识',
    preview: '🔒',
    lastUpdated: '2026-03-10',
  },
];

const ASSET_TYPES = [
  { id: 'all', label: '全部资产', emoji: '📦' },
  { id: 'logo', label: 'Logo标识', emoji: '🦞' },
  { id: 'banner', label: 'Banner/封面', emoji: '🖼️' },
  { id: 'icon', label: '图标集', emoji: '🔣' },
  { id: 'font', label: '字体', emoji: '🔤' },
  { id: 'color', label: '色彩规范', emoji: '🎨' },
  { id: 'template', label: '模板', emoji: '📋' },
  { id: 'video', label: '视频素材', emoji: '🎬' },
  { id: 'copy', label: '文案库', emoji: '✍️' },
];

const TYPE_COLORS: Record<string, string> = {
  logo: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  banner: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  icon: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  font: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  template: 'bg-green-500/20 text-green-300 border-green-500/30',
  video: 'bg-red-500/20 text-red-300 border-red-500/30',
  copy: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

function AssetCard({ asset }: { asset: BrandAsset }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-2xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600 transition-all duration-300 cursor-pointer group overflow-hidden"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Preview area */}
      <div className="relative h-28 flex items-center justify-center bg-gradient-to-b from-slate-900/60 to-transparent border-b border-slate-700/30">
        <span className="text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-300">{asset.preview}</span>
        <div className="absolute top-2 right-2">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${TYPE_COLORS[asset.type] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
            {ASSET_TYPES.find(t => t.id === asset.type)?.emoji} {ASSET_TYPES.find(t => t.id === asset.type)?.label}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <div className="text-xs font-medium text-slate-200 leading-tight line-clamp-2">{asset.name}</div>
        <div className="text-[10px] text-slate-500 line-clamp-1">{asset.description}</div>
        <div className="flex items-center gap-1 flex-wrap">
          {asset.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">{tag}</span>
          ))}
        </div>
        <div className="text-[10px] text-slate-600">更新：{asset.lastUpdated}</div>

        {expanded && (
          <div className="pt-2 border-t border-slate-700/40 space-y-2">
            {asset.usageGuideline && (
              <div className="text-[10px] text-slate-400 bg-slate-900/60 rounded-lg p-2">
                <div className="text-cyan-400/80 font-medium mb-0.5">📐 使用规范</div>
                {asset.usageGuideline}
              </div>
            )}
            <div className="flex gap-1.5">
              <a
                href={asset.downloadUrl || '#'}
                onClick={e => e.stopPropagation()}
                className="flex-1 text-[10px] py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium text-center"
              >
                ⬇️ 下载
              </a>
              <button
                onClick={e => e.stopPropagation()}
                className="flex-1 text-[10px] py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all"
              >
                📋 复制链接
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrandAssetPanel() {
  const [activeType, setActiveType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = MOCK_ASSETS.filter(a =>
    (activeType === 'all' || a.type === activeType) &&
    (!searchQuery || a.name.includes(searchQuery) || a.tags.some(t => t.includes(searchQuery)) || a.description.includes(searchQuery))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          🏢 品牌中心 <span className="text-slate-500 text-sm font-normal">/</span>
          <span className="text-amber-400">品牌资产中心</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">统一管理龙虾集群全品牌视觉资产，支持下载、预览及使用规范查阅</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '资产总数', value: '12', emoji: '📦', color: 'text-cyan-400' },
          { label: '本月更新', value: '5', emoji: '🆕', color: 'text-green-400' },
          { label: '资产类型', value: '8', emoji: '🏷️', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="搜索资产名称、标签或描述…"
          className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
        />
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {ASSET_TYPES.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveType(t.id)}
            className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
              activeType === t.id
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Count */}
      <div className="text-[11px] text-slate-500">
        共 <span className="text-slate-300 font-medium">{filtered.length}</span> 项资产
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        {filtered.map(a => <AssetCard key={a.id} asset={a} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">
          <div className="text-3xl mb-2">🔍</div>
          <div>未找到匹配的资产</div>
          <div className="mt-1">试试调整搜索词或筛选条件</div>
        </div>
      )}

      <div className="text-center text-[10px] text-slate-600 pt-2">
        💡 点击资产卡片展开详情及下载选项 · 资产持续更新中
      </div>
    </div>
  );
}
