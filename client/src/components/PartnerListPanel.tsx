import { useState } from 'react';

interface Partner {
  id: string;
  name: string;
  type: 'distributor' | 'agent' | 'franchise' | 'reseller' | 'strategic';
  region: string;
  city: string;
  contact: string;
  phone: string;
  tier: 'gold' | 'silver' | 'bronze' | 'trial';
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  monthlyVolume: string;
  commission: string;
  mainProducts: string[];
  note?: string;
}

const MOCK_PARTNERS: Partner[] = [
  { id: 'P001', name: '洛杉矶华创贸易', type: 'distributor', region: '北美', city: '洛杉矶', contact: '陈明华', phone: '+1-213-555-0101', tier: 'gold', status: 'active', joinedDate: '2024-06-15', monthlyVolume: '$85,000', commission: '15%', mainProducts: ['美妆护肤', '家居用品'] },
  { id: 'P002', name: '伦敦东方跨境', type: 'agent', region: '欧洲', city: '伦敦', contact: 'Sarah Chen', phone: '+44-20-7946-0102', tier: 'gold', status: 'active', joinedDate: '2024-08-20', monthlyVolume: '$62,000', commission: '12%', mainProducts: ['时尚服饰', '配饰'] },
  { id: 'P003', name: '曼谷泰润贸易', type: 'reseller', region: '东南亚', city: '曼谷', contact: 'นภา วงศ์สกุล', phone: '+66-2-555-0103', tier: 'silver', status: 'active', joinedDate: '2025-01-10', monthlyVolume: '$38,000', commission: '10%', mainProducts: ['3C数码', '户外用品'] },
  { id: 'P004', name: '迪拜海湾优品', type: 'franchise', region: '中东', city: '迪拜', contact: 'Ahmed Al-Rashid', phone: '+971-4-555-0104', tier: 'gold', status: 'active', joinedDate: '2025-02-28', monthlyVolume: '$120,000', commission: '18%', mainProducts: ['奢侈品', '高端礼品'] },
  { id: 'P005', name: '多伦多枫叶供应链', type: 'distributor', region: '北美', city: '多伦多', contact: 'Michael Wang', phone: '+1-416-555-0105', tier: 'silver', status: 'active', joinedDate: '2025-03-05', monthlyVolume: '$45,000', commission: '12%', mainProducts: ['母婴用品', '宠物用品'] },
  { id: 'P006', name: '法兰克福欧品汇', type: 'agent', region: '欧洲', city: '法兰克福', contact: 'Hans Mueller', phone: '+49-69-555-0106', tier: 'bronze', status: 'active', joinedDate: '2025-03-18', monthlyVolume: '$22,000', commission: '8%', mainProducts: ['厨房用品', '运动器材'] },
  { id: 'P007', name: '新加坡东亚分销', type: 'distributor', region: '东南亚', city: '新加坡', contact: '林志伟', phone: '+65-6555-0107', tier: 'gold', status: 'active', joinedDate: '2024-11-01', monthlyVolume: '$95,000', commission: '15%', mainProducts: ['全品类'] },
  { id: 'P008', name: '悉尼大洋商贸', type: 'reseller', region: '大洋洲', city: '悉尼', contact: 'Emma Liu', phone: '+61-2-555-0108', tier: 'silver', status: 'active', joinedDate: '2025-04-02', monthlyVolume: '$28,000', commission: '10%', mainProducts: ['保健品', '美妆护肤'] },
  { id: 'P009', name: '墨西哥城拉美星', type: 'strategic', region: '拉美', city: '墨西哥城', contact: 'Carlos Mendez', phone: '+52-55-555-0109', tier: 'trial', status: 'pending', joinedDate: '2026-04-20', monthlyVolume: '$5,000', commission: '6%', mainProducts: ['时尚服饰', '3C数码'] },
  { id: 'P010', name: '胡志明市越华贸易', type: 'reseller', region: '东南亚', city: '胡志明市', contact: '阮氏明月', phone: '+84-28-555-0110', tier: 'bronze', status: 'active', joinedDate: '2025-04-15', monthlyVolume: '$18,000', commission: '8%', mainProducts: ['家居用品', '食品'] },
  { id: 'P011', name: '圣保罗巴中贸易', type: 'agent', region: '拉美', city: '圣保罗', contact: 'Pedro Santos', phone: '+55-11-555-0111', tier: 'trial', status: 'active', joinedDate: '2026-04-10', monthlyVolume: '$8,000', commission: '6%', mainProducts: ['鞋类', '箱包'] },
  { id: 'P012', name: '巴黎法华贸易', type: 'franchise', region: '欧洲', city: '巴黎', contact: 'Marie Dupont', phone: '+33-1-555-0112', tier: 'silver', status: 'active', joinedDate: '2025-05-01', monthlyVolume: '$55,000', commission: '13%', mainProducts: ['美妆护肤', '时尚服饰'] },
];

const TIER_CONFIG = {
  gold: { label: '🥇 金牌', color: 'text-amber-300', bg: 'bg-amber-500/20 border-amber-500/30' },
  silver: { label: '🥈 银牌', color: 'text-slate-300', bg: 'bg-slate-400/20 border-slate-400/30' },
  bronze: { label: '🥉 铜牌', color: 'text-orange-300', bg: 'bg-orange-500/20 border-orange-500/30' },
  trial: { label: '🔰 试用', color: 'text-blue-300', bg: 'bg-blue-500/20 border-blue-500/30' },
};

const TYPE_CONFIG: Record<string, string> = {
  distributor: '批发分销商',
  agent: '区域代理',
  franchise: '特许加盟商',
  reseller: '零售经销商',
  strategic: '战略合作伙伴',
};

const STATUS_CONFIG = {
  active: { label: '合作中', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  pending: { label: '审批中', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  suspended: { label: '已暂停', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
};

function PartnerCard({ partner }: { partner: Partner }) {
  const [expanded, setExpanded] = useState(false);
  const tier = TIER_CONFIG[partner.tier];
  const status = STATUS_CONFIG[partner.status];

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        partner.tier === 'gold'
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-amber-500/30 hover:border-amber-400/50'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <div className="text-2xl shrink-0">🏢</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-slate-200">{partner.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${tier.bg} ${tier.color}`}>{tier.label}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${status.bg} ${status.color}`}>{status.label}</span>
            </div>
            <div className="text-[10px] text-slate-500">
              {partner.region} · {partner.city} · {TYPE_CONFIG[partner.type]}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs font-bold text-amber-400">{partner.monthlyVolume}</div>
            <div className="text-[9px] text-slate-500">月销量</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-xs font-bold text-cyan-400">{partner.commission}</div>
            <div className="text-[9px] text-slate-500">佣金比例</div>
          </div>
          <div className="bg-slate-900/60 rounded-lg p-2 text-center">
            <div className="text-[10px] text-slate-300">{partner.mainProducts.slice(0, 2).join('·')}</div>
            <div className="text-[9px] text-slate-500">主营品类</div>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-wrap">
          {partner.mainProducts.map(p => (
            <span key={p} className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/60 text-slate-400 border border-slate-600/40">{p}</span>
          ))}
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-700/40 space-y-2">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-slate-500 mb-0.5">👤 联系人</div>
                <div className="text-slate-300 font-medium">{partner.contact}</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-slate-500 mb-0.5">📞 联系电话</div>
                <div className="text-slate-300 font-medium">{partner.phone}</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-slate-500 mb-0.5">📅 合作起始</div>
                <div className="text-slate-300">{partner.joinedDate}</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2">
                <div className="text-slate-500 mb-0.5">🏷️ 合作类型</div>
                <div className="text-slate-300">{TYPE_CONFIG[partner.type]}</div>
              </div>
            </div>
            {partner.note && (
              <div className="text-[10px] text-slate-400 bg-slate-900/60 rounded-lg p-2">
                📝 备注：{partner.note}
              </div>
            )}
            <div className="flex gap-1.5">
              <button className="flex-1 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 transition-all font-medium text-[10px]">
                📊 查看报表
              </button>
              <button className="flex-1 py-1.5 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-300 hover:bg-slate-700 transition-all text-[10px]">
                ✏️ 编辑信息
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PartnerListPanel() {
  const [tierFilter, setTierFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const regions = [...new Set(MOCK_PARTNERS.map(p => p.region))];
  const types = [...new Set(MOCK_PARTNERS.map(p => p.type))];

  const filtered = MOCK_PARTNERS.filter(p =>
    (tierFilter === 'all' || p.tier === tierFilter) &&
    (regionFilter === 'all' || p.region === regionFilter) &&
    (typeFilter === 'all' || p.type === typeFilter) &&
    (!search || p.name.includes(search) || p.city.includes(search) || p.contact.includes(search))
  );

  const goldCount = MOCK_PARTNERS.filter(p => p.tier === 'gold').length;
  const totalVolume = MOCK_PARTNERS
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + parseFloat(p.monthlyVolume.replace(/[^0-9.]/g, '')), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            🌍 跨境龙虾社 <span className="text-slate-500 text-sm font-normal">/</span>
            <span className="text-amber-400">线下实体合作渠道</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">管理全球线下合作伙伴网络，追踪分销商、代理商、加盟商的业绩与佣金数据</p>
        </div>
        <button
          onClick={() => setShowAddForm(v => !v)}
          className="shrink-0 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all text-xs font-medium"
        >
          + 添加合作商
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '合作商总数', value: MOCK_PARTNERS.length, emoji: '🏢', color: 'text-cyan-400' },
          { label: '金牌合作商', value: goldCount, emoji: '🥇', color: 'text-amber-400' },
          { label: '月总销量', value: `$${(totalVolume / 1000).toFixed(0)}K`, emoji: '💰', color: 'text-green-400' },
          { label: '覆盖国家', value: new Set(MOCK_PARTNERS.map(p => p.region)).size, emoji: '🌐', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-5 space-y-3">
          <div className="text-sm font-semibold text-amber-300 mb-2">➕ 新增合作商</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '公司名称', placeholder: '输入公司全称', id: 'name' },
              { label: '联系人', placeholder: '输入联系人姓名', id: 'contact' },
              { label: '联系电话', placeholder: '+86-xxx-xxxx-xxxx', id: 'phone' },
              { label: '所在城市', placeholder: '输入城市', id: 'city' },
            ].map(f => (
              <div key={f.id}>
                <label className="text-[10px] text-slate-500 mb-1 block">{f.label}</label>
                <input
                  type="text"
                  placeholder={f.placeholder}
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">合作类型</label>
              <select className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-all">
                {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">合作等级</label>
              <select className="w-full bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500/50 transition-all">
                <option>🔰 试用</option><option>🥉 铜牌</option><option>🥈 银牌</option><option>🥇 金牌</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="flex-1 py-2 rounded-lg bg-slate-700/50 border border-slate-600/40 text-slate-400 hover:bg-slate-700 transition-all text-xs"
            >
              取消
            </button>
            <button className="flex-1 py-2 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 transition-all font-medium text-xs">
              ✅ 确认添加
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[140px]">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索合作商、城市、联系人…"
            className="w-full bg-slate-800/60 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
        >
          <option value="all">全部等级</option>
          <option value="gold">🥇 金牌</option><option value="silver">🥈 银牌</option>
          <option value="bronze">🥉 铜牌</option><option value="trial">🔰 试用</option>
        </select>
        <select
          value={regionFilter}
          onChange={e => setRegionFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
        >
          <option value="all">全部区域</option>
          {regions.map(r => <option key={r}>{r}</option>)}
        </select>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-800/60 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none transition-all"
        >
          <option value="all">全部类型</option>
          {types.map(t => <option key={t}>{TYPE_CONFIG[t]}</option>)}
        </select>
      </div>

      {/* Count */}
      <div className="text-[11px] text-slate-500">
        共 <span className="text-slate-300 font-medium">{filtered.length}</span> 家合作商
        {filtered.length !== MOCK_PARTNERS.length && (
          <span className="ml-2 text-amber-400">（筛选中）</span>
        )}
      </div>

      {/* Partner Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map(p => <PartnerCard key={p.id} partner={p} />)}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500 text-xs">
          <div className="text-3xl mb-2">🏢</div>
          <div>未找到匹配的合作商</div>
          <div className="mt-1">试试调整筛选条件</div>
        </div>
      )}

      <div className="text-center text-[10px] text-slate-600">
        💡 点击卡片展开详细信息 · 金牌合作商月销量满 $80,000 自动晋升 · 支持多维度筛选
      </div>
    </div>
  );
}
