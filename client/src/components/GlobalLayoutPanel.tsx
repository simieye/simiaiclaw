import { useState } from 'react';

interface Region {
  id: string;
  name: string;
  flag: string;
  markets: string[];
  status: 'active' | 'planning' | 'pending';
  localStrength: string;
  challenge: string;
  priority: number;
}

interface LocalMarket {
  region: string;
  platform: string;
  status: 'active' | 'paused' | 'testing';
  monthlyRevenue: string;
  growth: string;
  strategy: string;
}

const REGIONS: Region[] = [
  { id: 'na', name: '北美市场', flag: '🇺🇸', markets: ['美国', '加拿大', '墨西哥'], status: 'active', localStrength: 'TikTok电商生态成熟，物流基础设施完善，付费习惯强', challenge: '竞争激烈，合规成本高，版权意识强', priority: 1 },
  { id: 'eu', name: '欧洲市场', flag: '🇪🇺', markets: ['英国', '德国', '法国', '西班牙', '意大利'], status: 'active', localStrength: '消费能力强，品牌溢价高，VAT体系完善', challenge: '多语言多文化，GDPR合规，物流成本高', priority: 2 },
  { id: 'sea', name: '东南亚市场', flag: '🌏', markets: ['越南', '泰国', '印尼', '马来西亚', '菲律宾'], status: 'active', localStrength: '人口红利大，移动端流量占95%，电商增速全球领先', challenge: '支付碎片化，物流最后一公里，本土化难度高', priority: 3 },
  { id: 'me', name: '中东市场', flag: '🏜️', markets: ['沙特阿拉伯', '阿联酋', '卡塔尔'], status: 'planning', localStrength: '人均购买力强，对中国品牌接受度高，斋月经济旺盛', challenge: '文化禁忌多，清真认证要求，女性消费市场受限', priority: 4 },
  { id: 'latam', name: '拉丁美洲市场', flag: '🌎', markets: ['巴西', '阿根廷', '智利', '哥伦比亚'], status: 'planning', localStrength: '人口红利大，电商渗透率快速增长，社交电商潜力大', challenge: '汇率波动大，清关复杂，基础设施相对落后', priority: 5 },
  { id: 'africa', name: '非洲市场', flag: '🌍', markets: ['尼日利亚', '肯尼亚', '南非', '埃及'], status: 'pending', localStrength: '年轻人口结构，移动支付快速普及，跨境电商蓝海', challenge: '支付基础设施弱，物流覆盖有限，消费能力分层明显', priority: 6 },
];

const LOCAL_MARKETS: LocalMarket[] = [
  { region: '北美 - 美国', platform: 'TikTok Shop', status: 'active', monthlyRevenue: '$128,000', growth: '+35%', strategy: '达人矩阵+ADS精准投放+直播带货' },
  { region: '北美 - 加拿大', platform: 'TikTok Shop', status: 'testing', monthlyRevenue: '$18,000', growth: '+22%', strategy: 'KOL种草+联盟分销' },
  { region: '欧洲 - 英国', platform: 'TikTok Shop', status: 'active', monthlyRevenue: '$85,000', growth: '+28%', strategy: '品牌自播+短视频种草+季节性促销' },
  { region: '欧洲 - 德国', platform: 'TikTok Shop', status: 'testing', monthlyRevenue: '$42,000', growth: '+45%', strategy: '品质导向内容+家居品类切入' },
  { region: '欧洲 - 法国', platform: 'TikTok Shop', status: 'active', monthlyRevenue: '$55,000', growth: '+31%', strategy: '时尚美妆品类+本地KOL合作' },
  { region: '东南亚 - 越南', platform: 'TikTok Shop', status: 'active', monthlyRevenue: '$38,000', growth: '+62%', strategy: '低价引流+高频短视频+直播秒杀' },
  { region: '东南亚 - 泰国', platform: 'TikTok Shop', status: 'active', monthlyRevenue: '$72,000', growth: '+55%', strategy: '美妆个护+食品饮料+达人分销' },
  { region: '东南亚 - 印尼', platform: 'TikTok Shop', status: 'paused', monthlyRevenue: '$12,000', growth: '-8%', strategy: '等待政策稳定后重启' },
  { region: '中东 - 阿联酋', platform: 'Noon/TikTok', status: 'testing', monthlyRevenue: '$25,000', growth: '+88%', strategy: '高端定位+斋月营销+礼品品类' },
  { region: '南美 - 巴西', platform: 'TikTok Shop', status: 'testing', monthlyRevenue: '$8,000', growth: '+120%', strategy: '入门期+本地化选品测试' },
];

const STATUS_CONFIG = {
  active: { label: '运营中', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/30' },
  paused: { label: '已暂停', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/30' },
  testing: { label: '测试中', color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/30' },
  planning: { label: '规划中', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  pending: { label: '待启动', color: 'text-slate-400', bg: 'bg-slate-500/20 border-slate-500/30' },
};

function RegionCard({ region }: { region: Region }) {
  const [expanded, setExpanded] = useState(false);
  const statusCfg = STATUS_CONFIG[region.status];
  const totalRevenue = LOCAL_MARKETS
    .filter(m => region.markets.some(mkt => m.region.includes(mkt)))
    .reduce((sum, m) => sum + parseFloat(m.monthlyRevenue.replace(/[^0-9.]/g, '')), 0);

  return (
    <div
      className={`rounded-2xl border transition-all duration-300 cursor-pointer overflow-hidden ${
        region.status === 'active'
          ? 'bg-gradient-to-br from-slate-800/80 to-slate-800/40 border-green-500/30 hover:border-green-400/50'
          : region.status === 'planning'
          ? 'bg-slate-800/40 border-blue-500/30 hover:border-blue-400/50'
          : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3 mb-2">
          <span className="text-3xl shrink-0">{region.flag}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-slate-200">{region.name}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`}>{statusCfg.label}</span>
            </div>
            <div className="text-[10px] text-slate-500">{region.markets.join(' · ')}</div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm font-bold text-amber-400">#{region.priority}</div>
            <div className="text-[10px] text-slate-500">优先级</div>
          </div>
        </div>

        {region.status === 'active' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 mb-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-green-400">月预估收入</span>
              <span className="text-sm font-bold text-green-300">${totalRevenue.toLocaleString()}K</span>
            </div>
          </div>
        )}

        {!expanded ? (
          <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed mt-1">
            💪 {region.localStrength}
          </div>
        ) : (
          <div className="mt-2 space-y-2 text-[10px]">
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-cyan-400/80 font-medium mb-0.5">✅ 本地化优势</div>
              <div className="text-slate-300 leading-relaxed">{region.localStrength}</div>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-2">
              <div className="text-red-400/80 font-medium mb-0.5">⚠️ 本地化挑战</div>
              <div className="text-slate-300 leading-relaxed">{region.challenge}</div>
            </div>
            <div className="flex gap-1.5">
              <button className="flex-1 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-all font-medium">
                📊 查看数据
              </button>
              <button className="flex-1 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all">
                📋 制定策略
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GlobalLayoutPanel() {
  const [activeRegion, setActiveRegion] = useState<string>('all');
  const [view, setView] = useState<'regions' | 'markets'>('regions');

  const filteredRegions = REGIONS.filter(r => activeRegion === 'all' || r.status === activeRegion);

  const activeMarkets = LOCAL_MARKETS.filter(m => m.status === 'active');
  const totalRevenue = activeMarkets.reduce((sum, m) => sum + parseFloat(m.monthlyRevenue.replace(/[^0-9.]/g, '')), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          🌍 跨境龙虾社 <span className="text-slate-500 text-sm font-normal">/</span>
          <span className="text-green-400">全球化布局本地化营销</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">基于区域市场特征制定本地化营销策略，追踪全球多市场运营数据与增长趋势</p>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: '覆盖市场', value: REGIONS.reduce((s, r) => s + r.markets.length, 0), emoji: '🌐', color: 'text-cyan-400' },
          { label: '运营中市场', value: LOCAL_MARKETS.filter(m => m.status === 'active').length, emoji: '✅', color: 'text-green-400' },
          { label: '月总收入', value: `$${(totalRevenue / 1000).toFixed(0)}K`, emoji: '💰', color: 'text-amber-400' },
          { label: '规划中市场', value: REGIONS.filter(r => r.status === 'planning' || r.status === 'pending').length, emoji: '🔮', color: 'text-purple-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-center">
            <div className="text-xl mb-1">{stat.emoji}</div>
            <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Local Markets Quick View */}
      <div className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-green-300">📊 运营中市场速览</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-700/50">
                <th className="text-left py-1.5 font-medium">市场</th>
                <th className="text-left py-1.5 font-medium">平台</th>
                <th className="text-left py-1.5 font-medium">月收入</th>
                <th className="text-left py-1.5 font-medium">增长</th>
                <th className="text-left py-1.5 font-medium hidden md:table-cell">策略</th>
              </tr>
            </thead>
            <tbody>
              {LOCAL_MARKETS.filter(m => m.status === 'active').map(m => {
                const cfg = STATUS_CONFIG[m.status];
                return (
                  <tr key={m.region} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="py-1.5 text-slate-300 font-medium">{m.region}</td>
                    <td className="py-1.5 text-slate-400">{m.platform}</td>
                    <td className="py-1.5 text-amber-400 font-medium">{m.monthlyRevenue}</td>
                    <td className="py-1.5 text-green-400 font-medium">{m.growth}</td>
                    <td className="py-1.5 text-slate-500 hidden md:table-cell truncate max-w-[200px]">{m.strategy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-700/50">
        {([
          ['regions', '🌏 区域市场概览', 'bg-green-500/20 text-green-300 border-green-500/30'],
          ['markets', '📈 地方市场数据', 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'],
        ] as [string, string, string][]).map(([tab, label, activeClass]) => (
          <button
            key={tab}
            onClick={() => setView(tab as 'regions' | 'markets')}
            className={`text-xs px-4 py-2 rounded-t-lg border-b-2 transition-all -mb-px ${
              view === tab ? `${activeClass} border-b-2` : 'text-slate-500 hover:text-slate-300 border-transparent'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === 'regions' && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              ['all', '全部'],
              ['active', '运营中'],
              ['planning', '规划中'],
              ['pending', '待启动'],
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setActiveRegion(val)}
                className={`text-[11px] px-3 py-1 rounded-full border transition-all ${
                  activeRegion === val
                    ? 'bg-green-500/15 border-green-500/40 text-green-300'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-400 hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredRegions.map(r => <RegionCard key={r.id} region={r} />)}
          </div>

          <div className="text-center text-[10px] text-slate-600">
            💡 点击区域卡片展开详细本地化策略 · 优先级数字越小代表市场越成熟
          </div>
        </div>
      )}

      {view === 'markets' && (
        <div className="space-y-3">
          {LOCAL_MARKETS.map(m => {
            const cfg = STATUS_CONFIG[m.status];
            return (
              <div key={m.region} className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 hover:border-slate-600 transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-200">{m.region}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">{m.platform}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">📋 策略：{m.strategy}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-amber-400">{m.monthlyRevenue}</div>
                    <div className={`text-[10px] font-medium ${
                      m.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                    }`}>{m.growth}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
