import { useState } from 'react';
import { YUE_CHAMBERS, GD_REPRESENTATIVE_OFFICES } from '../data/yueChamberData';

interface Chamber {
  id: string;
  name: string;
  nameEn: string;
  type: 'trade' | 'industry' | 'government' | 'cultural' | 'startup';
  region: string;
  country: string;
  city: string;
  tier: 'strategic' | 'core' | 'general';
  status: 'active' | 'negotiating' | 'pending';
  joinedDate: string;
  memberCount?: string;
  annualFee?: string;
  benefits: string[];
  contact: string;
  phone: string;
  website?: string;
}

const MOCK_CHAMBERS: Chamber[] = [
  { id: 'C001', name: '美中贸易全国委员会', nameEn: 'US-China Business Council', type: 'trade', region: '北美', country: '美国', city: '华盛顿', tier: 'strategic', status: 'active', joinedDate: '2024-09-01', memberCount: '200+企业', annualFee: '$25,000', benefits: ['政府关系对接', '市场情报', ' networking活动'], contact: 'Robert Zhang', phone: '+1-202-555-0201', website: 'uschina.org' },
  { id: 'C002', name: '英中贸易协会', nameEn: 'China-Britain Business Council', type: 'trade', region: '欧洲', country: '英国', city: '伦敦', tier: 'core', status: 'active', joinedDate: '2024-11-15', memberCount: '500+企业', annualFee: '£8,000', benefits: ['英企对接', '贸促活动', '签证支持'], contact: 'Emma Liu', phone: '+44-20-7555-0202', website: 'cbbc.org' },
  { id: 'C003', name: '东南亚商会', nameEn: 'ASEAN Chambers of Commerce', type: 'trade', region: '东南亚', country: '新加坡', city: '新加坡', tier: 'core', status: 'active', joinedDate: '2025-01-20', memberCount: '1,000+企业', annualFee: 'SGD 5,000', benefits: ['多国准入', '政府对接', '法律咨询'], contact: 'Tan Wei Ming', phone: '+65-6555-0203', website: 'aseancham.org' },
  { id: 'C004', name: '迪拜工商会', nameEn: 'Dubai Chamber of Commerce', type: 'trade', region: '中东', country: '阿联酋', city: '迪拜', tier: 'strategic', status: 'active', joinedDate: '2025-02-01', memberCount: '300,000+会员', annualFee: 'AED 3,000', benefits: ['阿联酋市场准入', '清真认证', '展会名额'], contact: 'Mohammed Al-Rashid', phone: '+971-4-555-0204', website: 'dubaichamber.ae' },
  { id: 'C005', name: '中国德国商会', nameEn: 'German Chamber of Commerce in China', type: 'trade', region: '欧洲', country: '德国', city: '法兰克福', tier: 'core', status: 'negotiating', joinedDate: '2025-03-10', benefits: ['德企合作', '欧盟合规', '制造业对接'], contact: 'Klaus Weber', phone: '+49-69-555-0205', website: 'china.ahk.de' },
  { id: 'C006', name: '日中贸易机构', nameEn: 'Japan-China Investment Promotion', type: 'trade', region: '亚太', country: '日本', city: '东京', tier: 'general', status: 'pending', joinedDate: '', benefits: ['日企合作', '技术对接', '市场情报'], contact: 'Yamamoto Hiroshi', phone: '+81-3-5555-0206', website: 'jcci.or.jp' },
  { id: 'C007', name: '洛杉矶华人商会', nameEn: 'LA Chinese Chamber of Commerce', type: 'cultural', region: '北美', country: '美国', city: '洛杉矶', tier: 'core', status: 'active', joinedDate: '2024-10-01', memberCount: '800+企业', annualFee: '$1,500', benefits: ['华人商脉', '本地资源', '社区支持'], contact: '陈志明', phone: '+1-213-555-0207' },
  { id: 'C008', name: '巴中工商总会', nameEn: 'Brazil-China Business Council', type: 'trade', region: '拉美', country: '巴西', city: '圣保罗', tier: 'general', status: 'negotiating', joinedDate: '2025-04-01', benefits: ['拉美市场', '进出口支持', '文化交流'], contact: 'Carlos Silva', phone: '+55-11-555-0208' },
  { id: 'C009', name: '中国澳大利亚商会', nameEn: 'Australia China Business Council', type: 'trade', region: '大洋洲', country: '澳大利亚', city: '悉尼', tier: 'core', status: 'active', joinedDate: '2025-01-05', memberCount: '400+企业', annualFee: 'AUD 3,000', benefits: ['澳企对接', '资源合作', '移民支持'], contact: 'James Brown', phone: '+61-2-555-0209', website: 'acbc.com.au' },
  { id: 'C010', name: '法兰克福工商总会', nameEn: 'Frankfurt Chamber of Commerce', type: 'government', region: '欧洲', country: '德国', city: '法兰克福', tier: 'general', status: 'pending', joinedDate: '', benefits: ['欧盟通行证', '展会支持', '法律咨询'], contact: 'Stefan Klein', phone: '+49-69-555-0210' },
  { id: 'C011', name: '上海进出口商会', nameEn: 'Shanghai Import & Export Chamber', type: 'industry', region: '中国', country: '中国', city: '上海', tier: 'strategic', status: 'active', joinedDate: '2024-05-01', memberCount: '2,000+企业', annualFee: '¥20,000', benefits: ['出口支持', '政策解读', '展会资源'], contact: '李明华', phone: '+86-21-5555-0211' },
  { id: 'C012', name: '全球数字贸易协会', nameEn: 'Global Digital Trade Association', type: 'startup', region: '全球', country: '新加坡', city: '新加坡', tier: 'core', status: 'active', joinedDate: '2025-02-15', memberCount: '500+企业', annualFee: 'SGD 2,500', benefits: ['数字贸易规则', '跨境数据', 'FinTech资源'], contact: 'Sarah Tan', phone: '+65-6555-0212' },
];

const TYPE_COLORS: Record<string, string> = {
  trade: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  industry: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  government: 'bg-red-500/20 text-red-300 border-red-500/30',
  cultural: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  startup: 'bg-green-500/20 text-green-300 border-green-500/30',
};
const TYPE_LABELS: Record<string, string> = {
  trade: '贸易促进',
  industry: '行业协会',
  government: '政府机构',
  cultural: '文化商会',
  startup: '创业协会',
};
const TIER_COLORS: Record<string, string> = {
  strategic: 'text-amber-300 bg-amber-500/20 border-amber-500/30',
  core: 'text-cyan-300 bg-cyan-500/20 border-cyan-500/30',
  general: 'text-slate-300 bg-slate-500/20 border-slate-500/30',
};
const TIER_LABELS: Record<string, string> = { strategic: '⭐ 战略级', core: '◆ 核心级', general: '○ 普通级' };
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: '合作中', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  negotiating: { label: '洽谈中', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  pending: { label: '待加入', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' },
};

function ChamberCard({ c }: { c: Chamber }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[c.status];
  return (
    <div className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${c.status === 'active' ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-blue-500/30 hover:border-blue-400/50' : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'}`} onClick={() => setExpanded(!expanded)}>
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-2xl shrink-0">🏛️</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">{c.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TIER_COLORS[c.tier]}`}>{TIER_LABELS[c.tier]}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-[10px] text-slate-500">{c.nameEn}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 text-[10px] mb-2">
          <span className={`px-2 py-0.5 rounded-full border ${TYPE_COLORS[c.type]}`}>🏷️ {TYPE_LABELS[c.type]}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">📍 {c.country} · {c.city}</span>
          {c.memberCount && <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">👥 {c.memberCount}</span>}
        </div>
        {c.annualFee && (
          <div className="text-[10px] text-slate-500">💰 年费：{c.annualFee} · 加入：{c.joinedDate}</div>
        )}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-[10px] text-cyan-400/80 font-medium mb-1">✅ 合作权益</div>
              <div className="flex flex-wrap gap-1">
                {c.benefits.map(b => <span key={b} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40">{b}</span>)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-900/60 rounded-lg p-2"><div className="text-slate-500 mb-0.5">👤 对接人</div><div className="text-slate-300">{c.contact}</div></div>
              <div className="bg-slate-900/60 rounded-lg p-2"><div className="text-slate-500 mb-0.5">📞 联系方式</div><div className="text-slate-300">{c.phone}</div></div>
              {c.website && <div className="col-span-2 bg-slate-900/60 rounded-lg p-2"><div className="text-slate-500 mb-0.5">🌐 官网</div><div className="text-cyan-400">{c.website}</div></div>}
            </div>
            <div className="flex gap-1.5">
              {c.status === 'active' ? (
                <>
                  <button className="flex-1 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all font-medium text-[10px]">📊 合作报告</button>
                  <button className="flex-1 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all text-[10px]">✏️ 编辑</button>
                </>
              ) : c.status === 'negotiating' ? (
                <button className="w-full py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20 transition-all font-medium text-[10px]">🔄 继续洽谈</button>
              ) : (
                <button className="w-full py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-medium text-[10px]">➕ 申请加入</button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlobalChamberPanel() {
  const [activeTab, setActiveTab] = useState<'chamber'|'yue'|'gdrep'>('chamber');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [yueSearch, setYueSearch] = useState('');
  const [gdSearch, setGdSearch] = useState('');

  const regions = [...new Set(MOCK_CHAMBERS.map(c => c.region))];
  const filtered = MOCK_CHAMBERS.filter(c =>
    (statusFilter === 'all' || c.status === statusFilter) &&
    (typeFilter === 'all' || c.type === typeFilter) &&
    (regionFilter === 'all' || c.region === regionFilter) &&
    (!search || c.name.includes(search) || c.nameEn.includes(search) || c.country.includes(search))
  );
  const activeCount = MOCK_CHAMBERS.filter(c => c.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">🌍 跨境龙虾社 <span className="text-slate-500 text-sm font-normal">/</span> <span className="text-blue-400">全球商协会合作</span></h2>
          <p className="text-xs text-slate-500 mt-1">对接全球优质商协会资源，建立政府关系网络，获取市场准入、政策支持与商业人脉</p>
        </div>
        <button onClick={() => setShowAdd(v => !v)} className="shrink-0 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all text-xs font-medium">+ 新增商会</button>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-1 bg-slate-800/40 rounded-xl p-1 border border-slate-700/50">
        {[
          { key: 'chamber', label: '🌐 全球商协会', count: MOCK_CHAMBERS.length },
          { key: 'yue', label: '🌸 海外粤商会', count: YUE_CHAMBERS.length, new: true },
          { key: 'gdrep', label: '🏛️ 广东省驻境外经贸代表处', count: GD_REPRESENTATIVE_OFFICES.length, new: true },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${activeTab === tab.key ? 'bg-blue-500/30 text-blue-300' : 'bg-slate-700/60 text-slate-500'}`}>{tab.count}</span>
            {tab.new && <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">新</span>}
          </button>
        ))}
      </div>

      {/* 全球商协会主面板 */}
      {activeTab === 'chamber' && (
        <div className="space-y-4">
        {[{ label: '合作商会', value: MOCK_CHAMBERS.length, emoji: '🏛️', color: 'text-cyan-400' }, { label: '正式合作', value: activeCount, emoji: '✅', color: 'text-green-400' }, { label: '洽谈中', value: MOCK_CHAMBERS.filter(c => c.status === 'negotiating').length, emoji: '🔄', color: 'text-yellow-400' }, { label: '覆盖地区', value: new Set(MOCK_CHAMBERS.map(c => c.country)).size, emoji: '🌐', color: 'text-purple-400' }].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div><div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div><div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
        {showAdd && (
        <div className="bg-slate-900/80 border border-blue-500/20 rounded-2xl p-5 space-y-3">
          <div className="text-sm font-semibold text-blue-300 mb-2">➕ 新增商会合作</div>
          <div className="grid grid-cols-2 gap-3">
            {[{ label: '商会名称', placeholder: '中文全称', id: 'name' }, { label: '英文名称', placeholder: 'English name', id: 'nameEn' }].map(f => (
              <div key={f.id}><label className="text-[10px] text-slate-500 mb-1 block">{f.label}</label><input type="text" placeholder={f.placeholder} className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" /></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] text-slate-500 mb-1 block">所在国家</label><input type="text" placeholder="如：美国、英国" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" /></div>
            <div><label className="text-[10px] text-slate-500 mb-1 block">所在城市</label><input type="text" placeholder="如：洛杉矶、伦敦" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-400 hover:bg-slate-700 transition-all text-xs">取消</button>
            <button className="flex-1 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30 transition-all font-medium text-xs">✅ 确认添加</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索商会名称…" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部状态</option><option value="active">✅ 合作中</option><option value="negotiating">🔄 洽谈中</option><option value="pending">○ 待加入</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部类型</option>{Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all">
          <option value="all">全部地区</option>{regions.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="text-[11px] text-slate-500">共 <span className="text-slate-300 font-medium">{filtered.length}</span> 个商会{filtered.length !== MOCK_CHAMBERS.length && <span className="ml-2 text-blue-400">（筛选中）</span>}</div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(c => <ChamberCard key={c.id} c={c} />)}</div>

      {filtered.length === 0 && <div className="text-center py-16 text-slate-500 text-xs"><div className="text-3xl mb-2">🏛️</div><div>未找到匹配的商会</div></div>}

      <div className="text-center text-[10px] text-slate-600">💡 点击卡片展开详情 · 战略级商会享有最高合作权益与政府对接资源</div>
        </div>
      )}

      {/* ====== 海外粤商会标签页 ====== */}
      {activeTab === 'yue' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input type="text" value={yueSearch} onChange={e => setYueSearch(e.target.value)} placeholder="搜索商会名称/国家/城市…" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500/50 transition-all" />
            </div>
            <span className="text-[10px] text-slate-500">共 <span className="text-pink-400 font-medium">{YUE_CHAMBERS.filter(c => !yueSearch || c.name.includes(yueSearch) || c.country.includes(yueSearch) || c.city.includes(yueSearch) || c.leader.includes(yueSearch)).length}</span> 个商会</span>
          </div>
          <div className="space-y-1.5">
            {YUE_CHAMBERS
              .filter(c => !yueSearch || c.name.includes(yueSearch) || c.country.includes(yueSearch) || c.city.includes(yueSearch) || c.leader.includes(yueSearch))
              .map(c => (
                <div key={c.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 flex items-start gap-4 hover:border-pink-500/30 transition-all">
                  <div className="flex items-center gap-2 w-32 shrink-0">
                    <span className="text-lg">🌸</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 leading-tight">{c.name}</div>
                      <div className="text-[9px] text-slate-500">{c.region} · {c.country}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 flex-1 min-w-0">
                    <div><div className="text-[9px] text-slate-500">会长/秘书长</div><div className="text-xs text-slate-300 truncate">{c.leader}</div></div>
                    <div><div className="text-[9px] text-slate-500">所在城市</div><div className="text-xs text-slate-300">{c.city}</div></div>
                    <div><div className="text-[9px] text-slate-500">📞</div><div className="text-[10px] text-slate-400 truncate">{c.phone}</div></div>
                    <div><div className="text-[9px] text-slate-500">✉️</div><div className="text-[10px] text-slate-400 truncate">{c.email}</div></div>
                  </div>
                </div>
              ))}
          </div>
          <div className="text-center text-[10px] text-slate-600">📊 数据来源：广东省政府海外粤商会名单（共37个商会，覆盖全球5大洲）</div>
        </div>
      )}

      {/* ====== 广东省驻境外经贸代表处标签页 ====== */}
      {activeTab === 'gdrep' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px]">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
              <input type="text" value={gdSearch} onChange={e => setGdSearch(e.target.value)} placeholder="搜索代表处名称/所在地…" className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all" />
            </div>
            <span className="text-[10px] text-slate-500">共 <span className="text-amber-400 font-medium">{GD_REPRESENTATIVE_OFFICES.filter(c => !gdSearch || c.name.includes(gdSearch) || c.location.includes(gdSearch) || c.rep.includes(gdSearch)).length}</span> 个代表处</span>
          </div>
          <div className="space-y-1.5">
            {GD_REPRESENTATIVE_OFFICES
              .filter(c => !gdSearch || c.name.includes(gdSearch) || c.location.includes(gdSearch) || c.rep.includes(gdSearch))
              .map(c => (
                <div key={c.id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 flex items-start gap-4 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-2 w-40 shrink-0">
                    <span className="text-lg">🏛️</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 leading-tight">{c.name}</div>
                      <div className="text-[9px] text-slate-500">{c.region} · {c.location}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 flex-1 min-w-0">
                    <div><div className="text-[9px] text-slate-500">成立时间</div><div className="text-xs text-amber-400">{c.established}</div></div>
                    <div><div className="text-[9px] text-slate-500">首席代表</div><div className="text-xs text-slate-300">{c.rep}</div></div>
                    <div><div className="text-[9px] text-slate-500">📞</div><div className="text-[10px] text-slate-400 truncate">{c.phone}</div></div>
                    <div><div className="text-[9px] text-slate-500">✉️</div><div className="text-[10px] text-slate-400 truncate">{c.email}</div></div>
                  </div>
                </div>
              ))}
          </div>
          <div className="text-center text-[10px] text-slate-600">📊 数据来源：广东省政府驻境外经贸代表处名单（31个代表处，最早成立于2013年）</div>
        </div>
      )}
    </div>
  );
}
