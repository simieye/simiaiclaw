import { useState } from 'react';

interface RetailChain {
  id: string;
  name: string;
  nameLocal: string;
  country: string;
  city: string;
  chainType: 'hypermarket' | 'department' | 'convenience' | 'electronics' | 'lifestyle' | 'outlet';
  tier: 'global' | 'regional' | 'local';
  status: 'active' | 'negotiating' | 'pending' | 'rejected';
  annualSales?: string;
  storeCount?: number;
  joinDate?: string;
  contact: string;
  phone: string;
  categories: string[];
  commission?: string;
  minOrder?: string;
  note?: string;
}

const MOCK_CHAINS: RetailChain[] = [
  { id: 'R001', name: 'Walmart', nameLocal: '沃尔玛', country: '美国', city: '本顿维尔', chainType: 'hypermarket', tier: 'global', status: 'negotiating', annualSales: '$650B', storeCount: 10500, contact: 'James Smith', phone: '+1-479-555-0301', categories: ['全品类', '家居', '3C数码'], commission: '18%', minOrder: '$50,000' },
  { id: 'R002', name: 'Target', nameLocal: '塔吉特', country: '美国', city: '明尼阿波利斯', chainType: 'department', tier: 'global', status: 'negotiating', annualSales: '$107B', storeCount: 1947, contact: 'Sarah Johnson', phone: '+1-612-555-0302', categories: ['家居', '个护', '母婴'], commission: '15%', minOrder: '$30,000' },
  { id: 'R003', name: 'Carrefour', nameLocal: '家乐福', country: '法国', city: '巴黎', chainType: 'hypermarket', tier: 'global', status: 'active', joinDate: '2025-03-01', annualSales: '€420B', storeCount: 12000, contact: 'Marie Dupont', phone: '+33-1-5555-0303', categories: ['食品', '日化', '生鲜'], commission: '12%', minOrder: '€20,000' },
  { id: 'R004', name: 'Tesco', nameLocal: '乐购', country: '英国', city: '韦林花园城', chainType: 'hypermarket', tier: 'global', status: 'pending', annualSales: '£61B', storeCount: 4500, contact: 'John Williams', phone: '+44-1992-555-0304', categories: ['食品', '服装', '家居'], commission: '10%', minOrder: '£15,000' },
  { id: 'R005', name: '7-Eleven', nameLocal: '7-11便利店', country: '日本', city: '东京', chainType: 'convenience', tier: 'global', status: 'active', joinDate: '2025-01-15', annualSales: '$85B', storeCount: 77000, contact: 'Tanaka Ken', phone: '+81-3-5555-0305', categories: ['食品', '饮料', '日化'], commission: '20%', minOrder: '$5,000' },
  { id: 'R006', name: 'Best Buy', nameLocal: '百思买', country: '美国', city: '里奇菲尔德', chainType: 'electronics', tier: 'global', status: 'active', joinDate: '2024-11-20', annualSales: '$47B', storeCount: 1000, contact: 'David Lee', phone: '+1-612-555-0306', categories: ['3C数码', '家电', '智能硬件'], commission: '14%', minOrder: '$20,000' },
  { id: 'R007', name: 'IKEA', nameLocal: '宜家', country: '瑞典', city: '阿姆霍特', chainType: 'lifestyle', tier: 'global', status: 'pending', annualSales: '€47B', storeCount: 460, contact: 'Erik Andersson', phone: '+46-392-555-0307', categories: ['家居', '家具', '装饰'], commission: '8%', minOrder: '€50,000' },
  { id: 'R008', name: 'Sports Direct', nameLocal: '体育用品直营', country: '英国', city: '伦敦', chainType: 'outlet', tier: 'regional', status: 'active', joinDate: '2025-02-10', annualSales: '£3.8B', storeCount: 600, contact: 'Mike Ashley', phone: '+44-20-7555-0308', categories: ['运动户外', '鞋类', '装备'], commission: '22%', minOrder: '£10,000' },
  { id: 'R009', name: 'El Corte Inglés', nameLocal: '英格列斯', country: '西班牙', city: '马德里', chainType: 'department', tier: 'regional', status: 'negotiating', annualSales: '€18B', storeCount: 94, contact: 'Carmen García', phone: '+34-91-555-0309', categories: ['奢侈品', '时尚', '美妆'], commission: '16%', minOrder: '€25,000' },
  { id: 'R010', name: 'DFI Retail Group', nameLocal: '牛奶国际', country: '新加坡', city: '新加坡', chainType: 'hypermarket', tier: 'regional', status: 'active', joinDate: '2025-04-01', annualSales: '$16B', storeCount: 6500, contact: 'Tan Choon Hua', phone: '+65-6555-0310', categories: ['生鲜', '食品', '日化'], commission: '11%', minOrder: '$15,000' },
  { id: 'R011', name: 'Carrefour UAE', nameLocal: '家乐福阿联酋', country: '阿联酋', city: '迪拜', chainType: 'hypermarket', tier: 'regional', status: 'active', joinDate: '2025-03-15', annualSales: '$8B', storeCount: 300, contact: 'Ahmed Hassan', phone: '+971-4-555-0311', categories: ['食品', '清真产品', '家居'], commission: '14%', minOrder: '$20,000' },
  { id: 'R012', name: 'Mitsukoshi', nameLocal: '三越百货', country: '日本', city: '东京', chainType: 'department', tier: 'global', status: 'negotiating', annualSales: '¥1.2T', storeCount: 17, contact: 'Yamamoto Sato', phone: '+81-3-5555-0312', categories: ['奢侈品', '和服', '艺术品'], commission: '15%', minOrder: '¥5,000,000' },
];

const CHAIN_TYPE_COLORS: Record<string, string> = {
  hypermarket: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  department: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  convenience: 'bg-green-500/20 text-green-300 border-green-500/30',
  electronics: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  lifestyle: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  outlet: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
};
const CHAIN_TYPE_LABELS: Record<string, string> = {
  hypermarket: '大卖场', department: '百货商场', convenience: '便利店', electronics: '电器连锁', lifestyle: '生活方式', outlet: '折扣奥莱',
};
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '已入驻', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  negotiating: { label: '洽谈中', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  pending: { label: '待入驻', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' },
  rejected: { label: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
};

function ChainCard({ r }: { r: RetailChain }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[r.status];
  return (
    <div className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${r.status === 'active' ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-orange-500/30 hover:border-orange-400/50' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`} onClick={() => setExpanded(!expanded)}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl shrink-0">🏬</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">{r.nameLocal} {r.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-[10px] text-slate-500">📍 {r.country} · {r.city}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CHAIN_TYPE_COLORS[r.chainType]}`}>🏷️ {CHAIN_TYPE_LABELS[r.chainType]}</span>
          {r.storeCount && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">🏪 {r.storeCount.toLocaleString()}店</span>}
          {r.annualSales && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">💰 {r.annualSales}</span>}
        </div>
        <div className="flex flex-wrap gap-1">
          {r.categories.map(c => <span key={c} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">{c}</span>)}
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
            {r.commission && <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div className="bg-slate-900/60 rounded-lg p-2 text-center"><div className="text-amber-400 font-bold">{r.commission}</div><div className="text-slate-500">抽佣比例</div></div>
              <div className="bg-slate-900/60 rounded-lg p-2 text-center"><div className="text-cyan-400 font-bold">{r.minOrder}</div><div className="text-slate-500">最低起订</div></div>
              <div className="bg-slate-900/60 rounded-lg p-2 text-center"><div className="text-slate-300">{r.joinDate || '—'}</div><div className="text-slate-500">入驻日期</div></div>
            </div>}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-900/60 rounded-lg p-2"><div className="text-slate-500 mb-0.5">👤 对接人</div><div className="text-slate-300">{r.contact}</div></div>
              <div className="bg-slate-900/60 rounded-lg p-2"><div className="text-slate-500 mb-0.5">📞 电话</div><div className="text-slate-300">{r.phone}</div></div>
            </div>
            {r.note && <div className="text-[10px] text-slate-400 bg-slate-900/60 rounded-lg p-2">📝 {r.note}</div>}
            <div className="flex gap-1.5">
              {r.status === 'active' ? (
                <><button className="flex-1 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-medium text-[10px]">📦 下单补货</button><button className="flex-1 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all text-[10px]">📊 销售数据</button></>
              ) : r.status === 'negotiating' ? (
                <button className="w-full py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all font-medium text-[10px]">🔄 跟进洽谈</button>
              ) : (
                <button className="w-full py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-medium text-[10px]">📨 申请入驻</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RetailChainPanel() {
  const [activeTab, setActiveTab] = useState<'chains'|'hongmeng'>('chains');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const countries = [...new Set(MOCK_CHAINS.map(r => r.country))];
  const filtered = MOCK_CHAINS.filter(r =>
    (statusFilter === 'all' || r.status === statusFilter) &&
    (typeFilter === 'all' || r.chainType === typeFilter) &&
    (countryFilter === 'all' || r.country === countryFilter) &&
    (!search || r.name.includes(search) || r.nameLocal.includes(search) || r.country.includes(search))
  );

  const activeCount = MOCK_CHAINS.filter(r => r.status === 'active').length;
  const totalStores = MOCK_CHAINS.filter(r => r.status === 'active').reduce((s, r) => s + (r.storeCount || 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">🌍 跨境龙虾社 <span className="text-slate-500 text-sm font-normal">/</span> <span className="text-orange-400">全球线下商超连锁渠道合作</span></h2>
        <p className="text-xs text-slate-500 mt-1">拓展全球线下零售渠道，覆盖大卖场、百货、便利店、电器连锁等主流零售业态，实现线上线下一体化销售</p>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-1 bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
        <button onClick={() => setActiveTab('chains')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'chains' ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
          🏬 全球零售连锁 <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'chains' ? 'bg-orange-500/30 text-orange-300' : 'bg-slate-700/60 text-slate-500'}`}>{MOCK_CHAINS.length}</span>
        </button>
        <button onClick={() => setActiveTab('hongmeng')} className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${activeTab === 'hongmeng' ? 'bg-red-500/20 border border-red-500/40 text-red-300 shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'}`}>
          🚀 海外品牌增长加速器 <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === 'hongmeng' ? 'bg-red-500/30 text-red-300' : 'bg-slate-700/60 text-slate-500'}`}>新</span>
          <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">新</span>
        </button>
      </div>

      {activeTab === 'chains' && (
      <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[{ label: '零售连锁', value: MOCK_CHAINS.length, emoji: '🏬', color: 'text-orange-400' }, { label: '已入驻', value: activeCount, emoji: '✅', color: 'text-green-400' }, { label: '门店总数', value: totalStores > 0 ? `${(totalStores / 1000).toFixed(0)}K+` : '—', emoji: '🏪', color: 'text-cyan-400' }, { label: '覆盖国家', value: new Set(MOCK_CHAINS.map(r => r.country)).size, emoji: '🌐', color: 'text-purple-400' }].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div><div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div><div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索零售连锁…" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部状态</option><option value="active">✅ 已入驻</option><option value="negotiating">🔄 洽谈中</option><option value="pending">○ 待入驻</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部业态</option>{Object.entries(CHAIN_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部国家</option>{countries.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="text-[11px] text-slate-500">共 <span className="text-slate-300 font-medium">{filtered.length}</span> 家零售连锁{filtered.length !== MOCK_CHAINS.length && <span className="ml-2 text-orange-400">（筛选中）</span>}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(r => <ChainCard key={r.id} r={r} />)}</div>

      {filtered.length === 0 && <div className="text-center py-16 text-slate-500 text-xs"><div className="text-3xl mb-2">🏬</div><div>未找到匹配的零售连锁</div></div>}

      <div className="text-center text-[10px] text-slate-600">💡 点击卡片展开详情含佣金比例与最低起订量 · 已入驻合作方可发起补货订单</div>
        </div>
      )}

      {/* ====== 香港红萌海外品牌增长加速器 ====== */}
      {activeTab === 'hongmeng' && (
        <div className="space-y-5">
          {/* Hero 横幅 */}
          <div className="relative bg-gradient-to-br from-red-900/60 via-slate-900 to-orange-900/40 border border-red-500/30 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 50%, #ef4444 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f97316 0%, transparent 50%)'}} />
            <div className="relative p-6 text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-medium mb-2">
                <span className="text-sm">🇭🇰</span> 香港红萌 · 海外品牌增长加速器
              </div>
              <h3 className="text-lg font-bold text-white">覆盖澳加 5,000+ 连锁 · 750 银发机构 · 7,000+ Airbnb 房源</h3>
              <p className="text-slate-300 text-xs max-w-2xl mx-auto leading-relaxed">
                我们为品牌提供 TikTok、Facebook、Instagram 等全球主流社交平台<strong className="text-white">全渠道营销</strong>，覆盖澳大利亚、加拿大、美国三大核心市场，<br/>
                依托庞大供应链与本地化运营团队，打造<strong className="text-white">线上线下联动的品牌增长闭环</strong>，让您的品牌快速进入目标市场、提升影响力、实现持续增长。
              </p>
              <div className="flex items-center justify-center gap-4 text-xs">
                <span className="text-red-300 font-semibold">🇦🇺 澳大利亚</span>
                <span className="text-slate-500">|</span>
                <span className="text-red-300 font-semibold">🇨🇦 加拿大</span>
                <span className="text-slate-500">|</span>
                <span className="text-red-300 font-semibold">🇺🇸 美国</span>
              </div>
            </div>
          </div>

          {/* 核心数据 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { emoji: '🛒', value: '5,000+', label: '连锁超市及餐饮连锁', color: 'text-orange-400' },
              { emoji: '🏥', value: '750', label: '银发养生养老院', color: 'text-cyan-400' },
              { emoji: '🏠', value: '7,000+', label: 'Airbnb 酒店房源', color: 'text-purple-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* 渠道矩阵 */}
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              📊 全渠道营销矩阵 <span className="text-[10px] text-slate-500 font-normal">覆盖全球主流社交平台</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { platform: 'TikTok', desc: '短视频种草 · 直播带货 · 挑战赛', emoji: '🎵', color: 'bg-pink-500/20 border-pink-500/30 text-pink-300' },
                { platform: 'Facebook', desc: '精准投放 · 社群运营 · 品牌主页', emoji: '👥', color: 'bg-blue-500/20 border-blue-500/30 text-blue-300' },
                { platform: 'Instagram', desc: '图文种草 · Story推广 · Reels短视频', emoji: '📸', color: 'bg-purple-500/20 border-purple-500/30 text-purple-300' },
                { platform: 'YouTube', desc: '品牌视频 · KOL合作 · 测评内容', emoji: '▶️', color: 'bg-red-500/20 border-red-500/30 text-red-300' },
                { platform: 'Google Ads', desc: '搜索广告 · 购物广告 · 展示广告', emoji: '🔍', color: 'bg-green-500/20 border-green-500/30 text-green-300' },
                { platform: 'WhatsApp', desc: '私域引流 · 客户维护 · 精准触达', emoji: '💬', color: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' },
              ].map(p => (
                <div key={p.platform} className={`rounded-xl border px-3 py-2.5 text-center ${p.color}`}>
                  <div className="text-lg mb-1">{p.emoji}</div>
                  <div className="text-xs font-semibold mb-0.5">{p.platform}</div>
                  <div className="text-[9px] opacity-80">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 市场覆盖 */}
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              🌍 市场覆盖 <span className="text-[10px] text-slate-500 font-normal">三大核心市场线下渠道网络</span>
            </div>
            <div className="space-y-2">
              {[
                { region: '🇦🇺 澳大利亚', channels: 'Woolworths · Coles · ALDI · IGA · Chemist Warehouse · 7-Eleven · Caltex', stores: '1,500+ 超市 · 1,200+ 便利店 · 600+ 药房连锁', highlight: 'from-blue-900/60 to-blue-800/20 border-blue-500/30' },
                { region: '🇨🇦 加拿大', channels: 'Loblaw · Sobeys · Costco Canada · Walmart Canada · Metro · Shoppers Drug Mart', stores: '1,800+ 超市 · 850+ 药房 · 600+ 便利店', highlight: 'from-red-900/60 to-red-800/20 border-red-500/30' },
                { region: '🇺🇸 美国', channels: 'Walmart · Target · Costco · Whole Foods · Sprouts · GNC · Vitamin Shoppe · CVS', stores: '1,700+ 大卖场 · 1,200+ 天然食品店 · 650+ 保健品连锁', highlight: 'from-purple-900/60 to-purple-800/20 border-purple-500/30' },
              ].map(m => (
                <div key={m.region} className={`bg-gradient-to-r ${m.highlight} rounded-xl px-4 py-3 border`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-100 mb-1.5">{m.region}</div>
                      <div className="text-[10px] text-slate-300 mb-0.5">🏪 {m.stores}</div>
                      <div className="text-[10px] text-slate-400">🛍️ {m.channels}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-bold text-slate-100">{m.stores.split(' · ')[0].split(' ')[0]}</div>
                      <div className="text-[9px] text-slate-500">核心渠道</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 服务特色 */}
          <div>
            <div className="text-sm font-semibold text-slate-200 mb-3">✨ 服务特色</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📦', title: '线上线下一体化闭环', desc: '社交平台种草 → 线下门店转化 → 私域复购' },
                { icon: '🌏', title: '本地化运营团队', desc: 'Native 团队深耕澳加美，熟悉本地消费习惯' },
                { icon: '📈', title: '品牌增长加速', desc: '从 0 到 1 打响品牌，从 1 到 N 持续增长' },
                { icon: '🔗', title: '庞大供应链网络', desc: '覆盖三大市场仓储物流，降本增效' },
                { icon: '📋', title: '全托管服务', desc: '选品 · 上架 · 运营 · 客服全流程覆盖' },
                { icon: '📊', title: '数据驱动决策', desc: '实时监控 ROI、GMV、复购率等核心指标' },
              ].map(f => (
                <div key={f.title} className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-3 py-2.5">
                  <div className="text-sm mb-1">{f.icon} <span className="text-xs font-semibold text-slate-200">{f.title}</span></div>
                  <div className="text-[10px] text-slate-400 leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button className="flex-1 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all font-semibold text-sm flex items-center justify-center gap-2">
              🚀 立即咨询品牌加速方案
            </button>
            <button className="px-5 py-3 rounded-xl bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all text-xs">
              📋 下载合作方案
            </button>
          </div>

          <div className="text-center text-[10px] text-slate-600">💡 香港红萌 — 专业 · 高效 · 有结果</div>
        </div>
      )}
    </div>
  );
}
