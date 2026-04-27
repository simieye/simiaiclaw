import { useState } from 'react';

interface Platform {
  id: string;
  name: string;
  nameLocal: string;
  country: string;
  region: string;
  category: 'social-commerce' | 'marketplace' | 'b2c' | 'b2b' | 'flash-sale' | 'luxury';
  status: 'settled' | 'in-review' | 'preparing' | 'not-started';
  monthlyGMV?: string;
  storeUrl?: string;
  website: string;
  commission?: string;
  categories: string[];
  requirements: string[];
  advantages: string[];
  setupDate?: string;
  rating?: number;
  tier?: string;
}

const MOCK_PLATFORMS: Platform[] = [
  { id: 'E001', name: 'TikTok Shop', nameLocal: 'TikTok Shop', country: '美国', region: '北美', category: 'social-commerce', status: 'settled', monthlyGMV: '$128,000', storeUrl: '#', website: 'https://seller.tiktok.com', commission: '8%', categories: ['美妆', '家居', '3C数码', '服饰'], requirements: ['营业执照', '美国仓储', 'FDA认证(部分品类)'], advantages: ['短视频+直播带货', '流量巨大', '年轻用户集中'] },
  { id: 'E002', name: 'Amazon', nameLocal: '亚马逊', country: '美国', region: '北美', category: 'marketplace', status: 'settled', monthlyGMV: '$85,000', storeUrl: '#', website: 'https://sell.amazon.com', commission: '15%', categories: ['全品类', 'FBA'], requirements: ['美国公司/或个人 EIN', '信用卡', '银行账户'], advantages: ['全球最大电商平台', 'FBA物流支持', '品牌信任度高'] },
  { id: 'E003', name: 'Shopee', nameLocal: '虾皮购物', country: '东南亚', region: '东南亚', category: 'marketplace', status: 'settled', monthlyGMV: '$52,000', storeUrl: '#', website: 'https://seller.shopee.cn', commission: '6%', categories: ['时尚', '美妆', '家居', '3C'], requirements: ['本地公司/或个人证件', '当地银行账户', 'SLS物流面单'], advantages: ['东南亚最大电商平台', '低佣金', '本地仓支持'] },
  { id: 'E004', name: 'Lazada', nameLocal: '来赞达', country: '东南亚', region: '东南亚', category: 'marketplace', status: 'settled', monthlyGMV: '$38,000', storeUrl: '#', website: 'https://seller.lazada.com', commission: '7%', categories: ['电子产品', '服饰', '母婴'], requirements: ['本地公司资质', '银行账户', '合规认证'], advantages: ['阿里系生态', '跨境仓服务', '多国同步开店'] },
  { id: 'E005', name: 'Temu', nameLocal: 'Temu', country: '全球', region: '全球', category: 'marketplace', status: 'in-review', commission: '5-10%', website: 'https://seller.temu.com', categories: ['全品类', '性价比商品'], requirements: ['商品样品审核', '价格竞争力', '产能评估'], advantages: ['高速增长', '全托管模式', '亿级流量入口'] },
  { id: 'E006', name: 'Shein', nameLocal: '希音', country: '全球', region: '全球', category: 'marketplace', status: 'preparing', commission: '按件结算', website: 'https://www.shein.com/supplier/', categories: ['时尚服饰', '快时尚', '配饰'], requirements: ['产品图片审核', '快速上新能力', 'OEM/ODM能力'], advantages: ['快时尚标杆', '海外仓储覆盖', '超低退货率'] },
  { id: 'E007', name: 'AliExpress', nameLocal: '速卖通', country: '全球', region: '全球', category: 'marketplace', status: 'settled', monthlyGMV: '$42,000', storeUrl: '#', website: 'https://sell.aliexpress.com', commission: '8%', categories: ['3C数码', '家居', '服饰', '汽配'], requirements: ['企业认证', '商标注册', 'AE仓发货'], advantages: ['俄语/西语市场强', '菜鸟物流整合', '多语言支持'] },
  { id: 'E008', name: 'eBay', nameLocal: 'eBay', country: '全球', region: '北美/欧洲', category: 'marketplace', status: 'settled', monthlyGMV: '$28,000', storeUrl: '#', website: 'https://www.ebay.com/sell', commission: '12%', categories: ['二手/收藏', '3C', '汽配', '工业品'], requirements: ['PayPal/收款账户', 'SKU管理', '发货时效'], advantages: ['拍卖模式', '成熟买家群体', '品牌溢价高'] },
  { id: 'E009', name: 'Etsy', nameLocal: 'Etsy', country: '全球', region: '北美/欧洲', category: 'marketplace', status: 'not-started', commission: '6.5%', website: 'https://www.etsy.com/sell', categories: ['手工艺品', '定制商品', '复古品', '创意设计'], requirements: ['手工制作声明', '美国银行/PayPal', '原创设计'], advantages: ['高客单价', '强品牌属性', '复购率高'] },
  { id: 'E010', name: 'Noon', nameLocal: 'Noon', country: '中东', region: '中东', category: 'marketplace', status: 'in-review', commission: '10%', website: 'https://www.noon.com/partner-with-us', categories: ['美妆', '家居', '时尚', '3C'], requirements: ['本地公司/或第三方仓库', '阿拉伯语内容', '清真认证(食品)'], advantages: ['中东最大本土平台', '沙特/阿联酋双站点', 'COD支持'] },
  { id: 'E011', name: 'Allegro', nameLocal: 'Allegro', country: '欧洲', region: '东欧', category: 'marketplace', status: 'not-started', commission: '11%', website: 'https://allegro.pl/oferta/allegro-czesc-dla-sprzedawcow', categories: ['全品类', '家居', '3C'], requirements: ['欧盟公司/或税务合规', '波兰语本地化', '欧盟仓'], advantages: ['波兰最大电商', '覆盖东欧', '高转化率'] },
  { id: 'E012', name: 'Mercado Libre', nameLocal: '美客多', country: '拉美', region: '拉美', category: 'marketplace', status: 'preparing', commission: '12%', website: 'https://www.mercadolibre.com.mx/registration/partner', categories: ['3C', '家居', '时尚', '汽配'], requirements: ['巴西/墨西哥本地资质', '海外仓/本地仓', '葡萄牙语/西语'], advantages: ['拉美最大电商', 'GMV增速最快', '独立物流网络'] },
  { id: 'E013', name: 'Walmart', nameLocal: 'Walmart', country: '美国', region: '北美', category: 'marketplace', status: 'not-started', commission: '6-15%', website: 'https://seller.walmart.com', categories: ['全品类', '家居', '3C数码', '服饰', '日用杂货'], requirements: ['美国公司或个人 EIN', '美国仓储（WFS可选）', '产品合规认证', ' UPC/GTIN 条码'], advantages: ['美国最大零售商', 'WFS物流托管', '亿级月访客', '高信任度品牌背书'] },
];

const CAT_COLORS: Record<string, string> = {
  'social-commerce': 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  marketplace: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  b2c: 'bg-green-500/20 text-green-300 border-green-500/30',
  b2b: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'flash-sale': 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  luxury: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};
const CAT_LABELS: Record<string, string> = {
  'social-commerce': '社交电商', marketplace: '综合 marketplace', b2c: '品牌B2C官网', b2b: 'B2B批发', 'flash-sale': '闪购特卖', luxury: '奢品平台',
};
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  settled: { label: '已入驻', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  'in-review': { label: '审核中', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  preparing: { label: '准备中', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  'not-started': { label: '未入驻', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' },
};

function PlatformCard({ p }: { p: Platform }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[p.status];
  return (
    <div className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${p.status === 'settled' ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-green-500/30 hover:border-green-400/50' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`} onClick={() => setExpanded(!expanded)}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl shrink-0">🛒</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">{p.nameLocal} ({p.name})</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-[10px] text-slate-500">📍 {p.country} · {p.region}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CAT_COLORS[p.category]}`}>🏷️ {CAT_LABELS[p.category]}</span>
          {p.monthlyGMV && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">💰 月GMV {p.monthlyGMV}</span>}
          {p.commission && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">📊 佣金 {p.commission}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {p.categories.slice(0, 3).map(c => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">{c}</span>)}
          {p.categories.length > 3 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-500">+{p.categories.length - 3}</span>}
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-[10px] text-green-400/80 font-medium mb-1">✅ 入驻优势</div>
              <div className="flex flex-wrap gap-1">{p.advantages.map(a => <span key={a} className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-300 border border-green-500/20">{a}</span>)}</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-[10px] text-red-400/80 font-medium mb-1">📋 入驻要求</div>
              <div className="flex flex-wrap gap-1">{p.requirements.map(r => <span key={r} className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-300 border border-red-500/20">{r}</span>)}</div>
            </div>
            <div className="flex gap-1.5">
              {p.status === 'settled' ? (
                <><a href={p.storeUrl || '#'} className="flex-1 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-medium text-[10px] text-center">🏪 访问店铺</a><button className="flex-1 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all text-[10px]">📊 数据报表</button></>
              ) : p.status === 'in-review' ? (
                <button className="w-full py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all font-medium text-[10px]">🔄 查看审核进度</button>
              ) : (
                <button className="w-full py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all font-medium text-[10px]">🚀 申请入驻</button>
              )}
            </div>
            <a href={p.website} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-slate-900/80 border border-slate-600/50 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 transition-all text-[10px]">
              🌐 访问官网 → {p.website.replace('https://', '')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlobalEcommercePanel() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [search, setSearch] = useState('');

  const regions = [...new Set(MOCK_PLATFORMS.map(p => p.region))];
  const filtered = MOCK_PLATFORMS.filter(p =>
    (statusFilter === 'all' || p.status === statusFilter) &&
    (regionFilter === 'all' || p.region === regionFilter) &&
    (catFilter === 'all' || p.category === catFilter) &&
    (!search || p.name.includes(search) || p.nameLocal.includes(search) || p.country.includes(search))
  );

  const settledGMV = MOCK_PLATFORMS.filter(p => p.status === 'settled' && p.monthlyGMV).reduce((s, p) => s + parseFloat((p.monthlyGMV || '0').replace(/[^0-9.]/g, '')), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">🌍 跨境龙虾社 <span className="text-slate-500 text-sm font-normal">/</span> <span className="text-green-400">全球主流电商平台入驻入口</span></h2>
        <p className="text-xs text-slate-500 mt-1">一站式管理全球电商平台入驻状态，追踪已入驻平台销售数据与待入驻平台申请进度</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[{ label: '电商平台', value: MOCK_PLATFORMS.length, emoji: '🛒', color: 'text-green-400' }, { label: '已入驻', value: MOCK_PLATFORMS.filter(p => p.status === 'settled').length, emoji: '✅', color: 'text-cyan-400' }, { label: '月GMV合计', value: settledGMV > 0 ? `$${settledGMV.toFixed(0)}K` : '—', emoji: '💰', color: 'text-amber-400' }, { label: '覆盖地区', value: new Set(MOCK_PLATFORMS.map(p => p.region)).size, emoji: '🌐', color: 'text-purple-400' }].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div><div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div><div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索电商平台…" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-green-500/50 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部状态</option><option value="settled">✅ 已入驻</option><option value="in-review">🔄 审核中</option><option value="preparing">📋 准备中</option><option value="not-started">○ 未入驻</option>
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部地区</option>{regions.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部类型</option>{Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div className="text-[11px] text-slate-500">共 <span className="text-slate-300 font-medium">{filtered.length}</span> 个电商平台{filtered.length !== MOCK_PLATFORMS.length && <span className="ml-2 text-green-400">（筛选中）</span>}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(p => <PlatformCard key={p.id} p={p} />)}</div>

      {filtered.length === 0 && <div className="text-center py-16 text-slate-500 text-xs"><div className="text-3xl mb-2">🛒</div><div>未找到匹配的平台</div></div>}

      <div className="text-center text-[10px] text-slate-600">💡 点击卡片展开入驻优势与要求 · 已入驻平台可直接访问店铺后台</div>
    </div>
  );
}
