import React, { useState } from 'react';

type TradeTab = 'b2b' | 'b2c' | 'opclaw' | 'ai-tools' | 'tiktok-site' | 'tiktok-sop' | 'platform-sop';

export function GlobalTradeEco() {
  const [tradeTab, setTradeTab] = useState<TradeTab>('b2b');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const tabs: { id: TradeTab; label: string; icon: string; color: string; border: string }[] = [
    { id: 'b2b', label: '外贸供应链B2B', icon: '📦', color: 'text-cyan-400', border: 'border-cyan-500/30', },
    { id: 'b2c', label: '跨境电商B2C', icon: '🛒', color: 'text-emerald-400', border: 'border-emerald-500/30', },
    { id: 'opclaw', label: 'OpenClaw龙虾生态', icon: '🦞', color: 'text-orange-400', border: 'border-orange-500/30', },
    { id: 'ai-tools', label: 'AI工具矩阵', icon: '🤖', color: 'text-violet-400', border: 'border-violet-500/30', },
    { id: 'tiktok-site', label: 'TikTok+独立站', icon: '🎬', color: 'text-pink-400', border: 'border-pink-500/30', },
    { id: 'tiktok-sop', label: 'TikTok爆款SOP', icon: '📈', color: 'text-amber-400', border: 'border-amber-500/30', },
    { id: 'platform-sop', label: '平台运营SOP', icon: '🏪', color: 'text-teal-400', border: 'border-teal-500/30', },
  ];

  const activeTab = tabs.find(t => t.id === tradeTab)!;

  return (
    <div className="space-y-5">
      {/* 顶部标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🌐</span> 全球贸易生态合作体系
          </h2>
          <p className="text-xs text-slate-400 mt-1">打造全链路跨境贸易生态，赋能企业规模化出海</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="px-2 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">{tabs.length}大板块</span>
          <span className="px-2 py-1 rounded-full bg-slate-800 border border-slate-700">全链路覆盖</span>
        </div>
      </div>

      {/* 7标签切换导航 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setTradeTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${
              tradeTab === tab.id
                ? `bg-slate-800 border ${tab.border} ${tab.color} shadow-lg`
                : 'bg-slate-800/50 border border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── B2B 外贸供应链 ── */}
      {tradeTab === 'b2b' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-cyan-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-lg">📦</div>
              <div>
                <h3 className="text-sm font-bold text-white">外贸供应链管理（B2B国际贸易出口）</h3>
                <p className="text-[11px] text-slate-500">以供应商序号为唯一索引 · 一商一档 · 全域管控</p>
              </div>
            </div>

            {/* 核心指标 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: '收录供应商', value: '200+', icon: '🏢', color: 'cyan' },
                { label: '覆盖国家', value: '80+', icon: '🌍', color: 'emerald' },
                { label: '档案完整率', value: '98%', icon: '📋', color: 'amber' },
                { label: '响应时效', value: '<24h', icon: '⚡', color: 'violet' },
              ].map(m => (
                <div key={m.label} className={`glass-card p-3 text-center border border-${m.color}-500/10`}>
                  <div className="text-lg mb-1">{m.icon}</div>
                  <div className={`text-lg font-bold text-${m.color}-400`}>{m.value}</div>
                  <div className="text-[10px] text-slate-500">{m.label}</div>
                </div>
              ))}
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              搭建标准化模块化供应链知识库，以供应商序号为唯一索引维度，实现各类供应链资源资料的分类归档、集中管控与高效检索，打破资源分散壁垒。可按对应供应商序号，独立上传、添加各类核心资料，严格落实"一商一档"管理模式，确保供应链资料全覆盖留存、快速调取。
            </p>

            {/* 资料类型 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { type: '供应链文档', icon: '📄', desc: '合同/协议/资质/认证文件', color: 'cyan' },
                { type: '产业实景图片', icon: '📸', desc: '工厂/车间/产品实拍图', color: 'emerald' },
                { type: '宣传视频资料', icon: '🎬', desc: '企业宣传/生产流程视频', color: 'amber' },
                { type: '官网链接', icon: '🔗', desc: '官方及合作方网站链接', color: 'violet' },
              ].map(item => (
                <div key={item.type} className={`flex items-start gap-3 bg-slate-800/40 rounded-xl p-3 border border-${item.color}-500/10`}>
                  <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 border border-${item.color}-500/20 flex items-center justify-center text-base flex-shrink-0`}>{item.icon}</div>
                  <div>
                    <div className={`text-xs font-semibold text-${item.color}-300`}>{item.type}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 供应商管理示例 */}
          <div className="glass-card p-4 border border-cyan-500/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <span>🏢</span> 供应商序号档案
              </h4>
              <button className="text-[10px] px-3 py-1 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-600/30 transition-colors">+ 新增供应商</button>
            </div>
            <div className="space-y-2">
              {[
                { id: 'SUP-2024-001', name: '深圳市明途科技', type: 'OPC核心硬件供应商', country: '🇨🇳 中国', docs: 24, imgs: 18, videos: 6, status: '正常' },
                { id: 'SUP-2024-002', name: '上海华通物流', type: '国际物流服务商', country: '🇨🇳 中国', docs: 12, imgs: 8, videos: 2, status: '正常' },
                { id: 'SUP-2024-003', name: '德国MTG机械', type: '生产设备供应商', country: '🇩🇪 德国', docs: 36, imgs: 42, videos: 10, status: '审核中' },
              ].map(s => (
                <div key={s.id} className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3 border border-slate-700/40 hover:border-cyan-500/20 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-xs font-bold text-cyan-400 flex-shrink-0">{s.id.split('-').pop()}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white truncate">{s.name}</span>
                      <span className="text-[9px] text-slate-500">{s.country}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${s.status === '正常' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>{s.status}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.type} · 编号：{s.id}</div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-slate-500"><span className="text-cyan-400">{s.docs}</span> 文档</span>
                    <span className="text-slate-500"><span className="text-emerald-400">{s.imgs}</span> 图片</span>
                    <span className="text-slate-500"><span className="text-amber-400">{s.videos}</span> 视频</span>
                    <button className="px-2 py-1 rounded bg-slate-700 text-slate-400 hover:text-white hover:bg-slate-600 transition-colors">查看档案 →</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── B2C 跨境电商供应链 ── */}
      {tradeTab === 'b2c' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-lg">🛒</div>
              <div>
                <h3 className="text-sm font-bold text-white">跨境电商供应链（B2C跨境电商）</h3>
                <p className="text-[11px] text-slate-500">标准化供应商序号管理 · 多平台适配 · 精准供应链管控</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-800/40 rounded-xl p-4 border border-emerald-500/10">
                <div className="text-[10px] text-emerald-400 font-bold mb-2">📦 供应链核心功能</div>
                <div className="space-y-2">
                  {[
                    '按供应商编号批量/单独录入',
                    '资质文件 + 高清实拍图',
                    '全流程运营视频存档',
                    '店铺官网 + 各平台链接',
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                      <span className="text-[11px] text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800/40 rounded-xl p-4 border border-emerald-500/10">
                <div className="text-[10px] text-emerald-400 font-bold mb-2">🌐 支持跨境电商平台</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {['亚马逊', '速卖通', 'TikTok Shop', 'Temu', 'Shopee', 'Lazada', 'eBay', 'Wish'].map(p => (
                    <div key={p} className="bg-slate-800/60 rounded-lg px-2 py-1 text-center">
                      <span className="text-[10px] text-emerald-300">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              独立搭建B2C跨境电商专属供应链管理板块，严格沿用供应商序号统一管理规则，保障全体系供应链管理的标准化、规范化，避免多平台、多品类运营带来的管理混乱。精准适配跨境电商多平台、多品类、多场景的供应链管理需求，简化资料录入流程、提升管理效率，助力卖家快速响应海外市场变化、优化供应链布局、降低运营损耗。
            </p>
          </div>

          {/* 多品类管理视图 */}
          <div className="glass-card p-4 border border-emerald-500/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5"><span>🗂️</span> 多品类供应链视图</h4>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { cat: '消费电子', vendors: 45, products: 320, icon: '📱', color: 'cyan' },
                { cat: '家居用品', vendors: 28, products: 180, icon: '🏠', color: 'amber' },
                { cat: '服装配饰', vendors: 62, products: 450, icon: '👗', color: 'pink' },
                { cat: '美妆个护', vendors: 35, products: 210, icon: '💄', color: 'violet' },
                { cat: '户外运动', vendors: 22, products: 150, icon: '⚽', color: 'emerald' },
                { cat: '母婴用品', vendors: 18, products: 95, icon: '🍼', color: 'orange' },
              ].map(c => (
                <div key={c.cat} className={`bg-slate-800/40 rounded-xl p-3 border border-${c.color}-500/10 hover:border-${c.color}-500/30 transition-all`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{c.icon}</span>
                    <span className={`text-xs font-semibold text-${c.color}-300`}>{c.cat}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-slate-500">供应商 <span className={`text-${c.color}-400 font-bold`}>{c.vendors}</span></span>
                    <span className="text-slate-500">商品 <span className={`text-${c.color}-400 font-bold`}>{c.products}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── OpenClaw 龙虾生态 ── */}
      {tradeTab === 'opclaw' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-lg">🦞</div>
              <div>
                <h3 className="text-sm font-bold text-white">OpenClaw+龙虾集群智能体生态</h3>
                <p className="text-[11px] text-slate-500">垂直化 · 精细化 · 智能化管控</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/5 to-amber-500/5 rounded-xl p-4 border border-orange-500/10 mb-4">
              <div className="text-xs text-orange-300 leading-relaxed">
                深度融合OpenClaw技术与龙虾产业，打造OpenClaw+龙虾产业专属跨境集群智能体生态板块，依托供应商序号标准化管理体系，实现龙虾产业供应链的精细化、垂直化、智能化管控。可根据企业实际运营需求，为对应OpenClaw+龙虾产业供应商，增补、归档各类核心资源资料，构建完善的OpenClaw+龙虾产业垂直化跨境供应链资源库，整合产业上下游资源，赋能龙虾产业企业借助智能技术降低跨境运营门槛、提升出海竞争力。
              </div>
            </div>

            {/* 资源类型矩阵 */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { type: '企业资质文件', icon: '📜', color: 'orange', count: '120+' },
                { type: '养殖/加工实景图', icon: '📸', color: 'amber', count: '480+' },
                { type: '生产线视频', icon: '🎬', color: 'violet', count: '65+' },
                { type: '产业平台链接', icon: '🔗', color: 'cyan', count: '38+' },
              ].map(r => (
                <div key={r.type} className={`bg-slate-800/40 rounded-xl p-3 border border-${r.color}-500/10 text-center`}>
                  <div className="text-xl mb-1">{r.icon}</div>
                  <div className={`text-lg font-bold text-${r.color}-400`}>{r.count}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{r.type}</div>
                </div>
              ))}
            </div>

            {/* 生态架构 */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-orange-500/10">
              <div className="text-[10px] text-orange-400 font-bold mb-3">🧬 OpenClaw+龙虾产业生态架构</div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  { step: '养殖端', items: ['种苗繁育', '饲料管理', '水质监测'], color: 'emerald' },
                  { step: '加工端', items: ['初加工', '精加工', '质量检测'], color: 'amber' },
                  { step: 'AI智能体', items: ['供应链AI', '质检AI', '物流AI'], color: 'violet' },
                  { step: '跨境出口', items: ['报关清关', '国际物流', '海外仓'], color: 'cyan' },
                  { step: '终端销售', items: ['B端批发', 'C端零售', '品牌运营'], color: 'pink' },
                ].map((layer, i) => (
                  <React.Fragment key={layer.step}>
                    {i > 0 && <span className="text-slate-600 text-sm flex-shrink-0">→</span>}
                    <div className={`flex-shrink-0 w-28 glass-card p-3 border border-${layer.color}-500/20 bg-${layer.color}-500/5 rounded-xl`}>
                      <div className={`text-[10px] font-bold text-${layer.color}-400 mb-2 text-center`}>{layer.step}</div>
                      <div className="space-y-1">
                        {layer.items.map(item => (
                          <div key={item} className={`text-[9px] text-slate-400 bg-${layer.color}-500/10 rounded px-1.5 py-0.5 text-center`}>{item}</div>
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AI领航跨境电商工具生态 ── */}
      {tradeTab === 'ai-tools' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-lg">🤖</div>
              <div>
                <h3 className="text-sm font-bold text-white">AI领航跨境电商工具生态</h3>
                <p className="text-[11px] text-slate-500">一站式资源对接 · 全链路运营支撑 · 10000个AI客服账号</p>
              </div>
            </div>

            {/* ── Skywork.ai 平台 ── */}
            <div className="bg-gradient-to-br from-violet-950/60 via-sky-950/60 to-indigo-950/60 rounded-2xl p-5 border border-violet-500/30 mb-5 relative overflow-hidden">
              {/* 背景装饰 */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

              <div className="relative">
                {/* 标题行 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center text-lg shadow-lg shadow-violet-500/20">
                      🌌
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-white">Skywork.ai</h4>
                        <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[10px] font-medium">✨ 深度研究驱动的一体化超级智能体</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">open.skywork.ai · 全链路AI创作与自动化平台</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">🟢 全能力开放</span>
                    <a href="https://skywork.ai/" target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-sky-600 hover:from-violet-500 hover:to-sky-500 text-white text-[11px] font-medium transition-all shadow-lg shadow-violet-500/20">
                      访问平台 →
                    </a>
                  </div>
                </div>

                {/* 核心数据 */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'AI智能体', value: 'SkyClaw', icon: '🤖', color: 'violet' },
                    { label: '创作模式', value: '9+', icon: '🎨', color: 'sky' },
                    { label: '平台覆盖', value: '全球', icon: '🌐', color: 'indigo' },
                    { label: '免费创作', value: '注册即享', icon: '🎁', color: 'emerald' },
                  ].map(m => (
                    <div key={m.label} className={`bg-slate-800/60 rounded-xl p-3 text-center border border-${m.color}-500/15`}>
                      <div className="text-lg mb-1">{m.icon}</div>
                      <div className={`text-base font-bold text-${m.color}-400`}>{m.value}</div>
                      <div className="text-[10px] text-slate-500">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* 9大创作工具矩阵 */}
                <div className="mb-4">
                  <div className="text-[11px] text-violet-400 font-bold mb-2 flex items-center gap-1.5">
                    <span>🛠️</span> 9大AI创作工具矩阵
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: '通用任务', icon: '⚡', desc: '多类型智能任务处理', color: 'violet' },
                      { name: '图片生成', icon: '🖼️', desc: 'GPT Image 2模型支持', color: 'sky' },
                      { name: '文档处理', icon: '📄', desc: 'PDF/Word智能解析', color: 'indigo' },
                      { name: 'PPT制作', icon: '📊', desc: '一键生成专业演示文稿', color: 'amber' },
                      { name: '表格处理', icon: '📋', desc: '数据分析与可视化', color: 'emerald' },
                      { name: '网站操作', icon: '🌐', desc: '网页自动化与建站', color: 'cyan' },
                      { name: '视频处理', icon: '🎬', desc: '剪辑/字幕/合成', color: 'pink' },
                      { name: 'AI对话', icon: '💬', desc: 'SkyClaw智能体对话', color: 'rose' },
                      { name: '定时任务', icon: '⏰', desc: '自动化任务调度执行', color: 'orange' },
                    ].map(tool => (
                      <div key={tool.name} className={`flex items-center gap-2 bg-slate-800/60 rounded-xl p-2.5 border border-${tool.color}-500/10 hover:border-${tool.color}-500/30 hover:bg-${tool.color}-500/5 transition-all cursor-pointer group`}>
                        <span className="text-lg">{tool.icon}</span>
                        <div>
                          <div className={`text-[11px] font-semibold text-${tool.color}-300 group-hover:text-${tool.color}-200 transition-colors`}>{tool.name}</div>
                          <div className="text-[9px] text-slate-500">{tool.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skywork × 跨境电商 场景应用 */}
                <div className="bg-slate-800/40 rounded-xl p-4 border border-violet-500/10">
                  <div className="text-[11px] text-violet-400 font-bold mb-3 flex items-center gap-1.5">
                    <span>🚀</span> Skywork × 跨境电商场景深度应用
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { scene: '产品图生成', icon: '🛍️', use: '一键生成多国市场产品主图，支持不同背景/模特/场景，适配亚马逊/TikTok/Temu平台', color: 'violet' },
                      { scene: 'Listing文案创作', icon: '✍️', use: '自动生成SEO优化标题、五点描述、长描述，匹配各平台算法与目标市场语言习惯', color: 'sky' },
                      { scene: '市场调研报告', icon: '📊', use: '深度研究目标市场趋势、竞品分析、定价策略，输出结构化调研报告', color: 'amber' },
                      { scene: '多语言客服', icon: '💬', use: '支持全球主流语言智能客服，自动生成回复话术，7×24小时响应海外买家咨询', color: 'emerald' },
                      { scene: '社媒内容批量', icon: '📣', use: '一键生成TikTok短视频脚本、Instagram文案、Facebook广告语，支持本地化风格', color: 'pink' },
                      { scene: '合规风控文档', icon: '⚖️', use: '自动生成产品合规声明、认证申请材料、知识产权保护文档，符合各国监管要求', color: 'cyan' },
                    ].map(s => (
                      <div key={s.scene} className={`flex items-start gap-2.5 bg-slate-800/60 rounded-lg p-3 border border-${s.color}-500/10`}>
                        <span className="text-lg mt-0.5 flex-shrink-0">{s.icon}</span>
                        <div>
                          <div className={`text-[11px] font-semibold text-${s.color}-300 mb-1`}>{s.scene}</div>
                          <div className="text-[10px] text-slate-500 leading-relaxed">{s.use}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 生态合作入口 */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    <span>🏷️</span> 合作标签：
                  </div>
                  {['超级智能体', '多模态AI', 'GPT Image 2', '企业级AI', '开放API', '跨境电商赋能', '内容自动化'].map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[9px]">{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* 核心工具平台（保留原有3个） */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { name: 'TKFFF.COM', url: 'tkfff.com', desc: '跨境运营工具 · 货源信息 · 全球达人资源', color: 'violet', icon: '🛠️', badge: '优质平台' },
                { name: '10100.COM', url: '10100.com', desc: '专业物流服务 · 合规风控方案', color: 'cyan', icon: '📦', badge: '官方合作' },
                { name: 'KJ123.CN', url: 'kj123.cn', desc: '跨境数据分析 · 市场情报 · 选品工具', color: 'amber', icon: '📊', badge: '数据支撑' },
              ].map(p => (
                <a key={p.name} href={`https://${p.url}`} target="_blank" rel="noopener noreferrer"
                  className={`block bg-slate-800/40 rounded-xl p-4 border border-${p.color}-500/20 hover:border-${p.color}-500/40 hover:shadow-lg hover:shadow-${p.color}-500/5 transition-all`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.icon}</span>
                      <span className={`text-xs font-bold text-${p.color}-300`}>{p.name}</span>
                    </div>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded bg-${p.color}-500/20 text-${p.color}-400 border border-${p.color}-500/30`}>{p.badge}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed">{p.desc}</p>
                </a>
              ))}
            </div>

            {/* AnyGen + 客服机器人矩阵 */}
            <div className="bg-gradient-to-r from-violet-500/5 to-pink-500/5 rounded-xl p-4 border border-violet-500/10">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold text-violet-300 flex items-center gap-2">
                  <span>💬</span> AnyGen+ 销售客服机器人矩阵
                </div>
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-400 border border-violet-500/30">10000个账号</span>
                  <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">1000+主体</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">每家≥10账号</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { area: '供应链管理', icon: '📦', coverage: '100%', color: 'violet' },
                  { area: '日常运营', icon: '⚙️', coverage: '100%', color: 'cyan' },
                  { area: '全域推广', icon: '📣', coverage: '100%', color: 'amber' },
                  { area: '品牌塑造', icon: '🎨', coverage: '100%', color: 'pink' },
                  { area: '群控管理', icon: '👥', coverage: '100%', color: 'emerald' },
                  { area: '售后保障', icon: '🛡️', coverage: '100%', color: 'rose' },
                ].map(bot => (
                  <div key={bot.area} className={`flex items-center gap-2 bg-slate-800/60 rounded-lg p-2 border border-${bot.color}-500/10`}>
                    <span className="text-base">{bot.icon}</span>
                    <div>
                      <div className={`text-[10px] font-semibold text-${bot.color}-300`}>{bot.area}</div>
                      <div className={`text-[9px] text-${bot.color}-400/60`}>覆盖{bot.coverage}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
                机器人矩阵深度覆盖跨境电商全链路核心环节，实现全流程自动化赋能，大幅降低人工运营成本、提升服务响应效率。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TikTok+品牌独立站 ── */}
      {tradeTab === 'tiktok-site' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-lg">🎬</div>
              <div>
                <h3 className="text-sm font-bold text-white">OPC TikTok+品牌独立站模式</h3>
                <p className="text-[11px] text-slate-500">一体化运营 · 闭环式体系 · 市场验证</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-[10px] font-medium">已打通全工作流</span>
                <span className="px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">市场验证</span>
              </div>
            </div>

            {/* 全链路流程 */}
            <div className="bg-gradient-to-r from-pink-500/5 to-amber-500/5 rounded-xl p-4 border border-pink-500/10 mb-4">
              <div className="text-[10px] text-pink-400 font-bold mb-3">🔄 TikTok+品牌独立站 全链路工作流</div>
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {[
                  { step: '内容引流', icon: '📱', desc: 'TikTok短视频/直播', color: 'pink' },
                  { step: '精准获客', icon: '🎯', desc: '算法推荐+私域沉淀', color: 'amber' },
                  { step: '成交转化', icon: '💰', desc: '独立站闭环成交', color: 'emerald' },
                  { step: '私域沉淀', icon: '🏠', desc: '品牌独立站留存', color: 'cyan' },
                  { step: '复购留存', icon: '🔄', desc: 'CRM运营+会员体系', color: 'violet' },
                ].map((s, i) => (
                  <React.Fragment key={s.step}>
                    {i > 0 && <span className="text-slate-600 text-sm flex-shrink-0">→</span>}
                    <div className={`flex-shrink-0 w-28 glass-card p-3 border border-${s.color}-500/20 bg-${s.color}-500/5 rounded-xl text-center`}>
                      <div className="text-xl mb-1">{s.icon}</div>
                      <div className={`text-[10px] font-bold text-${s.color}-400`}>{s.step}</div>
                      <div className="text-[9px] text-slate-500 mt-0.5">{s.desc}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* 覆盖全环节 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { area: '供应链', icon: '🏭', desc: '优质货源+供应商管理', color: 'amber' },
                { area: '运营', icon: '⚙️', desc: '内容运营+账号矩阵', color: 'pink' },
                { area: '推广', icon: '📣', desc: 'TikTok ADS+达人合作', color: 'violet' },
                { area: '品牌塑造', icon: '🎨', desc: '品牌形象+独立站建设', color: 'cyan' },
                { area: '群控管理', icon: '👥', desc: '多账号矩阵管理', color: 'emerald' },
                { area: '售后保障', icon: '🛡️', desc: '客服+退换货体系', color: 'rose' },
              ].map(a => (
                <div key={a.area} className={`flex items-center gap-2.5 bg-slate-800/40 rounded-xl p-3 border border-${a.color}-500/10`}>
                  <span className="text-xl">{a.icon}</span>
                  <div>
                    <div className={`text-xs font-semibold text-${a.color}-300`}>{a.area}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 核心优势 */}
            <div className="bg-slate-800/40 rounded-xl p-4 border border-pink-500/10">
              <div className="text-[10px] text-pink-400 font-bold mb-3">⭐ 核心供应链企业优先权益</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  '优先对接OPC合伙人资源',
                  '拓宽跨境业务布局',
                  '整合优质供应链资源',
                  '强化核心竞争力',
                  '品牌全球化布局',
                  '规模化盈利加速',
                ].map(perk => (
                  <div key={perk} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                    <span className="text-[11px] text-slate-300">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TikTok 爆款 SOP ── */}
      {tradeTab === 'tiktok-sop' && (
        <div className="space-y-4">

          {/* 核心金句横幅 */}
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-950/60 via-orange-950/60 to-amber-950/60 rounded-2xl p-4 border border-amber-500/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg flex-shrink-0">📈</div>
              <div>
                <div className="text-[10px] text-amber-400 font-bold mb-0.5">AI工具领航跨境增长SOP</div>
                <div className="text-sm font-bold text-white">前3秒决定生死，中间决定转化，结尾决定成交</div>
                <div className="text-[11px] text-slate-400 mt-0.5">所有爆款，都是这套逻辑的变体</div>
              </div>
            </div>
          </div>

          {/* 第一部分：HVA 黄金结构 */}
          <div className="glass-card p-5 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-lg">🎯</div>
              <div>
                <h3 className="text-sm font-bold text-white">HVA 黄金结构</h3>
                <p className="text-[11px] text-slate-500">爆款视频的核心底层公式 · 适用于所有短视频平台</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium">核心主题</span>
              </div>
            </div>

            {/* HVA 三段式可视化 */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-5">
              {/* H - Hook */}
              <div className="flex-shrink-0 w-52 bg-gradient-to-b from-red-950/40 to-slate-900/80 rounded-2xl p-4 border border-red-500/25">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-[10px] font-bold text-red-400">H</div>
                    <span className="text-xs font-bold text-red-300">Hook 钩子</span>
                  </div>
                  <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">0-3秒</span>
                </div>
                <div className="text-[10px] text-slate-400 mb-2 leading-relaxed">前3秒决定生死 · 抓住注意力 · 激发好奇</div>
                <div className="space-y-1.5">
                  {[
                    { t: '痛点提问', c: '你是不是也这样……', icon: '❓' },
                    { t: '反差对比', c: '前后对比惊呆所有人', icon: '⚡' },
                    { t: '数字承诺', c: '3个技巧，转化翻倍', icon: '🔢' },
                    { t: '制造悬念', c: '这个方法没人敢公开', icon: '🎭' },
                  ].map(s => (
                    <div key={s.t} className="flex items-start gap-1.5">
                      <span className="text-[10px] mt-0.5 flex-shrink-0">{s.icon}</span>
                      <div>
                        <span className="text-[10px] font-semibold text-red-300">{s.t}</span>
                        <span className="text-[9px] text-slate-500 block">"{s.c}"</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <span className="text-slate-600 text-lg flex-shrink-0">→</span>

              {/* V - Value */}
              <div className="flex-shrink-0 w-52 bg-gradient-to-b from-emerald-950/40 to-slate-900/80 rounded-2xl p-4 border border-emerald-500/25">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold text-emerald-400">V</div>
                    <span className="text-xs font-bold text-emerald-300">Value 价值</span>
                  </div>
                  <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">4-12秒</span>
                </div>
                <div className="text-[10px] text-slate-400 mb-2 leading-relaxed">中间决定转化 · 展示价值 · 赢得信任</div>
                <div className="space-y-1.5">
                  {[
                    { t: '产品演示', c: '真实使用过程呈现', icon: '🎬' },
                    { t: '效果证明', c: 'Before/After 数据', icon: '📊' },
                    { t: '成分解析', c: '拆解产品核心卖点', icon: '🔬' },
                    { t: '第三方见证', c: '用户评价截图/视频', icon: '👥' },
                  ].map(s => (
                    <div key={s.t} className="flex items-start gap-1.5">
                      <span className="text-[10px] mt-0.5 flex-shrink-0">{s.icon}</span>
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-300">{s.t}</span>
                        <span className="text-[9px] text-slate-500 block">{s.c}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <span className="text-slate-600 text-lg flex-shrink-0">→</span>

              {/* A - Action */}
              <div className="flex-shrink-0 w-52 bg-gradient-to-b from-sky-950/40 to-slate-900/80 rounded-2xl p-4 border border-sky-500/25">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-[10px] font-bold text-sky-400">A</div>
                    <span className="text-xs font-bold text-sky-300">Action 行动</span>
                  </div>
                  <span className="text-[9px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">尾部结尾</span>
                </div>
                <div className="text-[10px] text-slate-400 mb-2 leading-relaxed">结尾决定成交 · 推动决策 · 引导转化</div>
                <div className="space-y-1.5">
                  {[
                    { t: '限时优惠', c: '"今天下单立减30%"', icon: '⏰' },
                    { t: '互动引导', c: '"评论区告诉我你的问题"', icon: '💬' },
                    { t: '直接下单', c: '"左下角链接直接冲"', icon: '🔗' },
                  ].map(s => (
                    <div key={s.t} className="flex items-start gap-1.5">
                      <span className="text-[10px] mt-0.5 flex-shrink-0">{s.icon}</span>
                      <div>
                        <span className="text-[10px] font-semibold text-sky-300">{s.t}</span>
                        <span className="text-[9px] text-slate-500 block">{s.c}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* HVA 金句强调 */}
            <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-xl p-3 border border-amber-500/15 flex items-center gap-3">
              <div className="w-1.5 h-12 rounded-full bg-gradient-to-b from-red-500 via-amber-500 to-emerald-500 flex-shrink-0" />
              <div className="flex items-center gap-6">
                {[
                  { label: '前3秒', sub: '决定生死', color: 'text-red-400', bar: 'from-red-500 to-red-600' },
                  { label: '中间', sub: '决定转化', color: 'text-amber-400', bar: 'from-amber-500 to-amber-600' },
                  { label: '结尾', sub: '决定成交', color: 'text-emerald-400', bar: 'from-emerald-500 to-emerald-600' },
                ].map(p => (
                  <div key={p.label} className="text-center">
                    <div className={`text-[11px] font-bold ${p.color}`}>{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 第二部分：6+3 步完整 SOP */}
          <div className="glass-card p-5 border border-violet-500/20">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-lg">🔄</div>
              <div>
                <h3 className="text-sm font-bold text-white">从"拆"到"复刻"：6+3 步完整 SOP</h3>
                <p className="text-[11px] text-slate-500">这是一套可以打印出来贴墙上的流程</p>
              </div>
              <div className="ml-auto">
                <span className="px-2 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-medium">团队SOP资产</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 左侧：6步脚本拆解 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[9px] font-bold text-amber-400">1</div>
                  <span className="text-[11px] font-bold text-amber-300">脚本拆解 6 步</span>
                  <span className="text-[9px] text-slate-500 ml-auto bg-slate-800 px-1.5 py-0.5 rounded">找到爆款</span>
                </div>
                <div className="space-y-2">
                  {[
                    { step: '① 找原片', desc: '精准锁定TikTok行业爆款短视频，确认对标方向与受众', icon: '🎯', color: 'amber' },
                    { step: '② 截分销', desc: '提取爆款视频的核心卖点片段，标注关键帧', icon: '✂️', color: 'cyan' },
                    { step: '③ 标时长', desc: '记录每段内容的精确秒数，还原视频节奏', icon: '⏱️', color: 'violet' },
                    { step: '④ 提台词', desc: '转写/翻译原文台词，提取核心文案结构', icon: '📝', color: 'pink' },
                    { step: '⑤ 标情绪', desc: '标记情绪曲线（兴奋→平静→冲击），还原情感节奏', icon: '📈', color: 'emerald' },
                    { step: '⑥ 记钩子', desc: '提炼开头钩子公式，形成可复用的钩子模板库', icon: '🪝', color: 'orange' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-2.5 bg-slate-800/40 rounded-xl p-3 border border-${s.color}-500/10 hover:border-${s.color}-500/25 transition-all`}>
                      <span className="text-base mt-0.5 flex-shrink-0">{s.icon}</span>
                      <div>
                        <div className={`text-[11px] font-bold text-${s.color}-300`}>{s.step}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 右侧：3步AI复刻 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-[9px] font-bold text-violet-400">2</div>
                  <span className="text-[11px] font-bold text-violet-300">AI 复刻 3 步</span>
                  <span className="text-[9px] text-slate-500 ml-auto bg-slate-800 px-1.5 py-0.5 rounded">生成新片</span>
                </div>
                <div className="space-y-2">
                  {[
                    { step: '① 替换场景/产品', desc: '保留爆款骨架，填入自家产品血肉', icon: '🔄', color: 'violet', tag: '核心变体' },
                    { step: '② 喂参考图', desc: '将原片截图作为参考，锁定构图与光影', icon: '🖼️', color: 'sky', tag: '视觉还原' },
                    { step: '③ 生成测试', desc: 'AI生成 → 人工微调 → AB测试 → 批量产出', icon: '✨', color: 'amber', tag: '验证迭代' },
                  ].map(s => (
                    <div key={s.step} className={`flex items-start gap-2.5 bg-slate-800/40 rounded-xl p-3 border border-${s.color}-500/10 hover:border-${s.color}-500/25 transition-all`}>
                      <span className="text-base mt-0.5 flex-shrink-0">{s.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold text-${s.color}-300`}>{s.step}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full bg-${s.color}-500/10 text-${s.color}-400 border border-${s.color}-500/20`}>{s.tag}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{s.desc}</div>
                      </div>
                    </div>
                  ))}

                  {/* 箭头连接 */}
                  <div className="flex items-center justify-center py-1">
                    <span className="text-slate-600 text-sm">↓ 循环迭代 ↓</span>
                  </div>

                  {/* SOP资产总结 */}
                  <div className="bg-gradient-to-r from-violet-950/40 to-amber-950/40 rounded-xl p-4 border border-violet-500/20">
                    <div className="text-[10px] text-violet-400 font-bold mb-2 flex items-center gap-1.5">
                      <span>💎</span> SOP 资产总结
                    </div>
                    <div className="text-[10px] text-slate-400 leading-relaxed">
                      每一步都留存模板，团队就有了可持续迭代的内容资产：
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {[
                        '截分销截图 → 素材库',
                        '时间轴文档 → SOP库',
                        '台词脚本 → 文案库',
                        '钩子公式 → 模板库',
                        '情绪曲线 → 策略库',
                        'AI素材 → 测试队列',
                      ].map(asset => (
                        <div key={asset} className="flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />
                          <span className="text-[9px] text-slate-400">{asset}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 第三部分：7步落地执行（保留原有） */}
          <div className="glass-card p-5 border border-pink-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-lg">🚀</div>
              <div>
                <h3 className="text-sm font-bold text-white">TikTok爆款7步落地执行</h3>
                <p className="text-[11px] text-slate-500">从找对标到数据优化的完整闭环</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { step: 1, title: '对标', icon: '🎯', desc: '精准筛选TikTok平台内行业优质爆款短视频，锁定高流量、高转化、高适配的内容模板', color: 'amber', time: '30分钟' },
                { step: 2, title: '拆解底层逻辑', icon: '🔍', desc: '深度拆解爆款内容的核心逻辑，提炼可复用的核心要素', color: 'cyan', time: '1小时' },
                { step: 3, title: '喂AI', icon: '🤖', desc: '将拆解后的核心要素、细节要求精准输入AI工具，完成素材训练与参数调试', color: 'violet', time: '30分钟' },
                { step: 4, title: 'AI工具复刻爆款', icon: '✨', desc: '借助AI工具高效复刻爆款内容，大幅降低内容创作成本、缩短创作周期', color: 'pink', time: '2-3小时' },
                { step: 5, title: '发布', icon: '🚀', desc: '完成内容剪辑优化后，严格遵循TikTok平台规则与算法偏好，选择最佳发布时间', color: 'emerald', time: '10分钟' },
                { step: 6, title: '看数据', icon: '📊', desc: '实时监测内容数据表现，重点关注曝光量、点击率、互动率、转化率等核心指标', color: 'orange', time: '每日监测' },
                { step: 7, title: '优化迭代', icon: '🔄', desc: '根据数据反馈，针对性调整内容细节，持续优化运营策略，实现内容迭代升级', color: 'teal', time: '持续' },
              ].map(s => (
                <div key={s.step} className="flex items-start gap-3 bg-slate-800/40 rounded-xl p-3 border border-pink-500/5 hover:border-pink-500/20 transition-all">
                  <div className={`w-8 h-8 rounded-lg bg-${s.color}-500/20 border border-${s.color}-500/30 flex items-center justify-center text-base font-bold text-${s.color}-400 flex-shrink-0`}>{s.step}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{s.icon}</span>
                      <span className="text-xs font-bold text-white">{s.title}</span>
                      <span className="text-[9px] text-slate-500 ml-auto bg-slate-700/60 px-1.5 py-0.5 rounded">{s.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── 跨境电商平台运营SOP ── */}
      {tradeTab === 'platform-sop' && (
        <div className="space-y-4">
          <div className="glass-card p-5 border border-teal-500/20">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-lg">🏪</div>
              <div>
                <h3 className="text-sm font-bold text-white">跨境电商平台电商生态 + 运营SOP</h3>
                <p className="text-[11px] text-slate-500">全流程闭环管理 · 多平台一体化运营 · 标准化可落地</p>
              </div>
            </div>

            {/* 支持平台 */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              <span className="text-[10px] text-slate-500 flex-shrink-0">支持平台：</span>
              {['亚马逊', '速卖通', 'TikTok Shop', 'Temu', 'Shopee', 'Lazada'].map(p => (
                <span key={p} className="flex-shrink-0 px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-[10px] text-teal-300">{p}</span>
              ))}
            </div>

            {/* 8大运营SOP模块 */}
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 1, title: '平台规则深度解读', icon: '📖', color: 'teal',
                  items: ['品类限制与认证标准', 'CPC认证（如Temu儿童品类）', 'TikTok AIGC内容监管', '税务规范与申报要求', '违规处罚机制规避'],
                  highlight: '规避私户收款稽查'
                },
                {
                  id: 2, title: '店铺搭建', icon: '🏗️', color: 'cyan',
                  items: ['店铺定位与赛道选择', '店铺装修与资质完善', '账号安全设置', '品牌形象优化', '用户信任度提升'],
                  highlight: '快速通过审核'
                },
                {
                  id: 3, title: '产品选品与定价', icon: '🛍️', color: 'amber',
                  items: ['选品工具与数据支撑', '平台趋势与竞品分析', '成本核算与定价方案', '性价比与盈利空间', '高潜力爆款锁定'],
                  highlight: 'Tkfff选品数据支撑'
                },
                {
                  id: 4, title: 'Listing优化', icon: '📝', color: 'violet',
                  items: ['标题关键词精准布局', '主图/详情页设计', '产品卖点高效提炼', '搜索排名与点击转化', '评价管理优化'],
                  highlight: '搜索算法全面适配'
                },
                {
                  id: 5, title: '流量推广', icon: '📣', color: 'pink',
                  items: ['自然流运营（内容+标签）', 'TikTok Ads / 亚马逊广告', '达人合作精准建联', '多渠道引流策略', '流量精准度提升'],
                  highlight: '达人工具效果追踪'
                },
                {
                  id: 6, title: '订单履约', icon: '📦', color: 'emerald',
                  items: ['规范订单处理流程', '跨境物流资源对接', '发货时效与成本管控', '海外仓一件代发', '用户体验优化'],
                  highlight: '宝昌/翼星国际物流'
                },
                {
                  id: 7, title: '售后处理', icon: '🛡️', color: 'rose',
                  items: ['标准化售后响应机制', '纠纷解决规范流程', '差评优化与客户维护', 'AI客服机器人响应', '复购率提升策略'],
                  highlight: 'AI客服降本增效'
                },
                {
                  id: 8, title: '合规运营', icon: '⚖️', color: 'orange',
                  items: ['税务申报规范', '知识产权保护', '产品认证（如储能/儿童）', '梅西侵权案例参考', '长期稳定发展保障'],
                  highlight: '规避法律风险'
                },
              ].map(sop => (
                <div key={sop.id} className={`bg-slate-800/40 rounded-xl p-4 border border-${sop.color}-500/10 hover:border-${sop.color}-500/25 transition-all`}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-6 h-6 rounded bg-${sop.color}-500/20 border border-${sop.color}-500/30 flex items-center justify-center text-xs font-bold text-${sop.color}-400`}>{sop.id}</div>
                    <span className="text-base">{sop.icon}</span>
                    <span className={`text-xs font-bold text-${sop.color}-300`}>{sop.title}</span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {sop.items.map(item => (
                      <div key={item} className="flex items-center gap-2">
                        <span className={`w-1 h-1 rounded-full bg-${sop.color}-400/60 flex-shrink-0`} />
                        <span className="text-[11px] text-slate-400">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className={`text-[10px] px-2 py-1 rounded bg-${sop.color}-500/10 text-${sop.color}-400 border border-${sop.color}-500/20`}>
                    ⭐ {sop.highlight}
                  </div>
                </div>
              ))}
            </div>

            {/* 联动资源 */}
            <div className="mt-4 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-xl p-4 border border-teal-500/10">
              <div className="text-[10px] text-teal-400 font-bold mb-2">🔗 生态联动资源</div>
              <div className="flex flex-wrap gap-2">
                {['✅ 生态内供应链', '✅ AI工具矩阵', '✅ 跨境资源网站', '✅ 专业物流服务', '✅ 合规风控方案', '✅ AnyGen+客服机器人'].map(r => (
                  <span key={r} className="text-[10px] px-2 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">{r}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 图片预览弹窗 */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <button className="absolute top-4 right-4 text-white text-2xl hover:text-amber-400 transition-colors" onClick={() => setPreviewUrl(null)}>✕</button>
          <img src={previewUrl} alt="预览" className="max-w-[90vw] max-h-[90vh] rounded-2xl border border-slate-700 shadow-2xl object-contain" />
        </div>
      )}
    </div>
  );
}
