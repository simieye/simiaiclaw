import { useState } from 'react';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: string;
  originalPrice: string;
  rating: number;
  sales: number;
  tags: string[];
  description: string;
  images: string[];
  colors: string[];
  featured: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'p001',
    name: '智控全能料理锅',
    brand: '星厨智造',
    category: '厨房电器',
    price: '¥399',
    originalPrice: '¥599',
    rating: 4.8,
    sales: 12340,
    tags: ['爆款', '热销', '新品'],
    description: '多功能电压力锅，12种烹饪模式，智能预约，不粘内胆',
    images: ['🍳', '🔥', '⏱️'],
    colors: ['银色', '黑色', '白色'],
    featured: true,
  },
  {
    id: 'p002',
    name: '极简无线降噪耳机',
    brand: '声界音频',
    category: '数码配件',
    price: '¥599',
    originalPrice: '¥899',
    rating: 4.9,
    sales: 28760,
    tags: ['TOP榜', '精选'],
    description: '主动降噪40dB，40小时续航，高保真音质，折叠便携',
    images: ['🎧', '🔊', '🎵'],
    colors: ['曜石黑', '云雾白', '星空蓝'],
    featured: true,
  },
  {
    id: 'p003',
    name: '轻羽便携吹风机',
    brand: '美研优品',
    category: '个护电器',
    price: '¥199',
    originalPrice: '¥299',
    rating: 4.7,
    sales: 8560,
    tags: ['限时特惠'],
    description: '千万负离子护发，速干低噪，轻至380g，冷热风切换',
    images: ['💨', '✨', '🪮'],
    colors: ['樱花粉', '薄荷绿', '奶油白'],
    featured: false,
  },
  {
    id: 'p004',
    name: '智能健身镜M1',
    brand: '动起来科技',
    category: '运动健康',
    price: '¥2999',
    originalPrice: '¥3999',
    rating: 4.6,
    sales: 4320,
    tags: ['预售', '健身'],
    description: 'AI动作识别，实时纠错，100+课程，1080P高清摄像头',
    images: ['🪞', '💪', '🏋️'],
    colors: ['深空灰', '玫瑰金'],
    featured: true,
  },
  {
    id: 'p005',
    name: '迷你便携榨汁杯',
    brand: '鲜果时刻',
    category: '厨房电器',
    price: '¥129',
    originalPrice: '¥199',
    rating: 4.5,
    sales: 15200,
    tags: ['爆款', '便携'],
    description: '无线充电，一键榨汁，便携随行，食品级Tritan材质',
    images: ['🥤', '🍹', '🫐'],
    colors: ['牛油果绿', '蜜桃粉', '柠檬黄'],
    featured: false,
  },
  {
    id: 'p006',
    name: '全屋智能中控屏',
    brand: '智居未来',
    category: '智能家居',
    price: '¥899',
    originalPrice: '¥1299',
    rating: 4.8,
    sales: 3890,
    tags: ['智能', '家居'],
    description: '全屋IoT控制，语音+触控双模式，支持2000+设备接入',
    images: ['🖥️', '📱', '🏠'],
    colors: ['深空灰', '简约白'],
    featured: false,
  },
];

const CATEGORIES = ['全部', '厨房电器', '数码配件', '个护电器', '运动健康', '智能家居'];

const TAG_COLORS: Record<string, string> = {
  '爆款': 'bg-red-500/20 text-red-300 border-red-500/30',
  '热销': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  '新品': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  '限时特惠': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  'TOP榜': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  '精选': 'bg-green-500/20 text-green-300 border-green-500/30',
  '预售': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  '健身': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  '便携': 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  '智能': 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  '家居': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`text-[10px] ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-slate-600'}`}>★</span>
      ))}
      <span className="text-[10px] text-slate-400 ml-1">{rating}</span>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 cursor-pointer group overflow-hidden
        ${product.featured
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-cyan-500/30 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-500/10'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600 hover:shadow-lg hover:shadow-slate-500/5'
        }`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Image area */}
      <div className={`relative flex items-center justify-center py-10 ${product.featured ? 'bg-gradient-to-b from-cyan-500/5 to-transparent' : 'bg-slate-900/40'}`}>
        <span className="text-6xl drop-shadow-lg">{product.images[0]}</span>
        {product.featured && (
          <div className="absolute top-2 left-2 bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-[9px] px-1.5 py-0.5 rounded-full font-medium backdrop-blur-sm">
            ⭐ 精选推荐
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-1">
          {product.tags.slice(0, 2).map(tag => (
            <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
              {tag}
            </span>
          ))}
        </div>
        {/* Image thumbnails on hover */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {product.images.map((img, i) => (
            <span key={i} className="text-lg bg-slate-800/80 rounded-md px-1 py-0.5 backdrop-blur-sm border border-slate-600/40">{img}</span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-3 pb-3 space-y-1.5">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <div className="text-[10px] text-slate-500">{product.brand}</div>
            <div className="text-xs font-medium text-slate-200 leading-tight truncate">{product.name}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-amber-400">{product.price}</div>
            <div className="text-[10px] text-slate-500 line-through">{product.originalPrice}</div>
          </div>
        </div>
        <StarRating rating={product.rating} />
        <div className="text-[10px] text-slate-500">销量 {product.sales.toLocaleString()}</div>
        <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">{product.description}</div>
        <div className="flex items-center gap-1 flex-wrap">
          {product.colors.map(c => (
            <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">{c}</span>
          ))}
        </div>
        {expanded && (
          <div className="pt-1 border-t border-slate-700/40 space-y-1">
            <div className="text-[10px] text-slate-500">类别：{product.category}</div>
            <div className="flex gap-1.5">
              <button className="flex-1 text-[10px] py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-all font-medium">
                加入品牌库
              </button>
              <button className="flex-1 text-[10px] py-1 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all">
                详情
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductGalleryPanel() {
  const [activeCategory, setActiveCategory] = useState('全部');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  const filtered = MOCK_PRODUCTS
    .filter(p => activeCategory === '全部' || p.category === activeCategory)
    .filter(p => !searchQuery || p.name.includes(searchQuery) || p.brand.includes(searchQuery) || p.tags.some(t => t.includes(searchQuery)))
    .sort((a, b) => {
      if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      if (sortBy === 'sales') return b.sales - a.sales;
      if (sortBy === 'price-asc') return parseFloat(a.price.replace('¥', '')) - parseFloat(b.price.replace('¥', ''));
      if (sortBy === 'price-desc') return parseFloat(b.price.replace('¥', '')) - parseFloat(a.price.replace('¥', ''));
      return 0;
    });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          🏢 品牌中心 <span className="text-slate-500 text-sm font-normal">/</span>
          <span className="text-cyan-400">产品多维展览馆</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">多维度展示品牌旗下产品矩阵，支持分类筛选、搜索与详情查看</p>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索产品、品牌、标签…"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all"
          />
        </div>
        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 transition-all"
        >
          <option value="featured">精选优先</option>
          <option value="sales">销量最高</option>
          <option value="price-asc">价格 ↑</option>
          <option value="price-desc">价格 ↓</option>
        </select>
        {/* View toggle */}
        <div className="flex border border-slate-700 rounded-lg overflow-hidden">
          {([['grid', '▦'], ['list', '▤']] as [string, string][]).map(([mode, icon]) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as 'grid' | 'list')}
              className={`px-2.5 py-1.5 text-xs transition-all ${viewMode === mode ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${activeCategory === cat
              ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
              : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-[11px] text-slate-500">
        <span>共 <span className="text-slate-300 font-medium">{filtered.length}</span> 个产品</span>
        {filtered.filter(p => p.featured).length > 0 && (
          <span>· <span className="text-cyan-400">{filtered.filter(p => p.featured).length}</span> 个精选推荐</span>
        )}
        <span>· <span className="text-amber-400">{filtered.reduce((s, p) => s + p.sales, 0).toLocaleString()}</span> 总销量</span>
      </div>

      {/* Grid / List view */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="flex items-center gap-3 bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 hover:border-slate-600 transition-all cursor-pointer">
              <span className="text-3xl shrink-0">{p.images[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-500">{p.brand} · {p.category}</div>
                <div className="text-sm font-medium text-slate-200 truncate">{p.name}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{p.description}</div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="text-sm font-bold text-amber-400">{p.price}</div>
                <div className="text-[10px] text-slate-500 line-through">{p.originalPrice}</div>
                <StarRating rating={p.rating} />
                <div className="text-[10px] text-slate-500">销量 {p.sales.toLocaleString()}</div>
              </div>
              {p.tags.slice(0, 1).map(tag => (
                <span key={tag} className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 ${TAG_COLORS[tag] || ''}`}>{tag}</span>
              ))}
            </div>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">
          <div className="text-3xl mb-2">🔍</div>
          <div>未找到匹配的产品</div>
          <div className="mt-1">试试调整搜索词或筛选条件</div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-[10px] text-slate-600 pt-2">
        💡 点击产品卡片展开详情 · 支持分类筛选 / 搜索 / 多种排序方式
      </div>
    </div>
  );
}
