/**
 * SIMIAICLAW 龙虾集群 · 首页前台
 * 宣发系统更新 & 每日资讯
 */
import React, { useState } from 'react';

// ── 64卦完整数据 ──────────────────────────────────────────────────────
const HEXAGRAMS = [
  // 上经 1-30
  { num: 1,  name: '乾',  pinyin: 'Qián',  palace: '乾宫', trait: '刚健·创造·天道', node: '战略统帅节点', agent: '愿景规划·决策引擎·路线图', scene: 'OPC创始人战略脑' },
  { num: 2,  name: '坤',  pinyin: 'Kūn',   palace: '坤宫', trait: '柔顺·承载·地道', node: '资源后勤节点', agent: '资源调度·执行落地·行政', scene: '供应链与团队后台' },
  { num: 3,  name: '屯',  pinyin: 'Zhūn',  palace: '坎宫', trait: '初生·艰难',      node: '孵化诊断节点', agent: '项目启动评估·瓶颈诊断', scene: '新项目0→1' },
  { num: 4,  name: '蒙',  pinyin: 'Méng',  palace: '坎宫', trait: '启蒙·求教',      node: '知识赋能节点', agent: '内部培训·技能传承·AI导师', scene: '团队学习成长' },
  { num: 5,  name: '需',  pinyin: 'Xū',    palace: '坤宫', trait: '等待·滋养',      node: '机会等待节点', agent: '市场时机捕捉·资源储备', scene: '等待风口' },
  { num: 6,  name: '讼',  pinyin: 'Sòng',  palace: '坎宫', trait: '争讼·明辨',      node: '法务合规节点', agent: '合同审核·纠纷预警·知产保护', scene: '法律风控' },
  { num: 7,  name: '师',  pinyin: 'Shī',   palace: '坎宫', trait: '军队·统御',      node: '团队管理节点', agent: '组织架构·绩效考核·协同', scene: '数字团队治理' },
  { num: 8,  name: '比',  pinyin: 'Bǐ',    palace: '坤宫', trait: '亲比·团结',      node: '生态联盟节点', agent: '伙伴对接·社区构建·互换', scene: '跨公司联盟' },
  { num: 9,  name: '小畜',pinyin: 'XiǎoChù',palace:'巽宫', trait: '小有积蓄',       node: '流量蓄能节点', agent: '内容蓄水·私域建设·运营', scene: '私域流量' },
  { num: 10, name: '履',  pinyin: 'Lǚ',    palace: '艮宫', trait: '践行·谨慎',      node: '执行风控节点', agent: 'SOP流程·风险踏勘', scene: '日常运营' },
  { num: 11, name: '泰',  pinyin: 'Tài',   palace: '坤宫', trait: '通泰·亨通',      node: '增长协同节点', agent: '业务扩张·内外协同', scene: '高速增长期' },
  { num: 12, name: '否',  pinyin: 'Pǐ',    palace: '乾宫', trait: '闭塞·否塞',      node: '危机预警节点', agent: '衰退诊断·止损机制', scene: '周期调整' },
  { num: 13, name: '同人',pinyin: 'Tóngrén',palace:'离宫', trait: '同心·聚合',       node: '品牌社群节点', agent: '用户共创·社区运营·口碑', scene: '品牌忠诚度' },
  { num: 14, name: '大有',pinyin: 'Dàyōu', palace: '离宫', trait: '大有·丰盛',       node: '资产变现节点', agent: '产品变现·IP商业化', scene: '营收变现' },
  { num: 15, name: '谦',  pinyin: 'Qiān',  palace: '艮宫', trait: '谦逊·受益',      node: '用户服务节点', agent: '客服体系·用户关怀·反馈', scene: '售后与忠诚' },
  { num: 16, name: '豫',  pinyin: 'Yù',    palace: '震宫', trait: '愉悦·备豫',      node: '内容娱乐节点', agent: '创意内容·用户体验设计', scene: '营销内容' },
  { num: 17, name: '随',  pinyin: 'Suí',   palace: '震宫', trait: '随从·趋势',      node: '趋势跟随节点', agent: '热点追踪·算法推荐·适配', scene: '短视频/直播' },
  { num: 18, name: '蛊',  pinyin: 'Gǔ',    palace: '艮宫', trait: '腐朽·革新',      node: '迭代重构节点', agent: '业务重塑·流程优化', scene: '转型升级' },
  { num: 19, name: '临',  pinyin: 'Lín',   palace: '坤宫', trait: '临近·监督',      node: '监控治理节点', agent: '实时监控·数据看板·巡检', scene: '运营中台' },
  { num: 20, name: '观',  pinyin: 'Guān',  palace: '巽宫', trait: '观察·展示',      node: '数据洞察节点', agent: '多维分析·可视化报告', scene: '决策支持' },
  { num: 21, name: '噬嗑',pinyin: 'ShìKè', palace: '离宫', trait: '咬合·刑罚',      node: '流程打通节点', agent: '跨部门协同·障碍清除', scene: '工作流自动化' },
  { num: 22, name: '贲',  pinyin: 'Bì',    palace: '艮宫', trait: '文饰·修饰',      node: '视觉品牌节点', agent: 'UI/UX·品牌视觉输出', scene: '内容美化' },
  { num: 23, name: '剥',  pinyin: 'Bō',    palace: '艮宫', trait: '剥落·衰退',      node: '精简瘦身节点', agent: '非核心裁剪·成本优化', scene: '危机收缩' },
  { num: 24, name: '复',  pinyin: 'Fù',    palace: '坤宫', trait: '复归·一阳来复',  node: '重启恢复节点', agent: '系统回滚·业务复苏·轮回', scene: '失败复盘' },
  { num: 25, name: '无妄',pinyin: 'WúWàng', palace:'震宫', trait: '无妄·纯真',       node: '创新纯净节点', agent: '零基础创新·无套路创意', scene: '蓝海探索' },
  { num: 26, name: '大畜',pinyin: 'DàXù',  palace: '艮宫', trait: '大蓄·积德',       node: '知识资产节点', agent: '知识产权积累·经验库', scene: '长期护城河' },
  { num: 27, name: '颐',  pinyin: 'Yí',    palace: '艮宫', trait: '颐养·口腹',      node: '供应链营养节点', agent: '采购优化·成本养成', scene: '供应链管理' },
  { num: 28, name: '大过',pinyin: 'DàGuò', palace: '兑宫', trait: '大过·非常',       node: '突破极限节点', agent: '高风险高回报·极限创新', scene: '颠覆式创新' },
  { num: 29, name: '坎',  pinyin: 'Kǎn',   palace: '坎宫', trait: '险陷·水险',      node: '风控守护节点', agent: '风险识别·合规审计·危机', scene: '全链路风控' },
  { num: 30, name: '离',  pinyin: 'Lí',    palace: '离宫', trait: '附丽·光明',      node: '营销赋能节点', agent: '品牌传播·广告创意·流量', scene: '营销获客' },
  // 下经 31-64
  { num: 31, name: '咸',  pinyin: 'Xián',  palace: '兑宫', trait: '感应·交感',      node: '客户关系节点', agent: '情感连接·CRM智能化', scene: '用户黏性' },
  { num: 32, name: '恒',  pinyin: 'Héng',  palace: '震宫', trait: '恒久·持久',      node: '稳定运营节点', agent: '长期留存·流程固化', scene: '可持续增长' },
  { num: 33, name: '遁',  pinyin: 'Dùn',   palace: '乾宫', trait: '退避·隐遁',      node: '战略撤退节点', agent: '业务收缩·资源保护', scene: '及时止损' },
  { num: 34, name: '大壮',pinyin: 'DàZhuàng',palace:'震宫',trait:'大壮·强盛',       node: '规模扩张节点', agent: '团队扩容·产能放大', scene: '爆发增长' },
  { num: 35, name: '晋',  pinyin: 'Jìn',   palace: '离宫', trait: '晋升·光明',      node: '晋升激励节点', agent: '人才晋升·绩效激励', scene: '内部激励' },
  { num: 36, name: '明夷',pinyin: 'MíngYí', palace: '离宫', trait: '明夷·晦暗',      node: '危机潜伏节点', agent: '黑暗期守护·隐患挖掘', scene: '低谷生存' },
  { num: 37, name: '家人',pinyin: 'JiāRén', palace: '巽宫', trait: '家人·内治',       node: '内部治理节点', agent: '文化建设·团队凝聚', scene: '组织文化' },
  { num: 38, name: '睽',  pinyin: 'Kúi',   palace: '离宫', trait: '乖离·差异',      node: '差异化节点', agent: '个性化定制·差异竞争', scene: '赛道区隔' },
  { num: 39, name: '蹇',  pinyin: 'Jiǎn',  palace: '坎宫', trait: '蹇难·险阻',      node: '障碍解决节点', agent: '难题攻克·瓶颈突破', scene: '问题攻坚' },
  { num: 40, name: '解',  pinyin: 'Xiè',  palace: '震宫', trait: '解除·纾解',      node: '释放优化节点', agent: '负担解除·流程松绑', scene: '效率解放' },
  { num: 41, name: '损',  pinyin: 'Sǔn',   palace: '艮宫', trait: '损减·节制',      node: '成本控制节点', agent: '精益管理·资源节约', scene: '降本增效' },
  { num: 42, name: '益',  pinyin: 'Yì',    palace: '巽宫', trait: '增益·滋益',      node: '价值放大节点', agent: '用户增值·产品迭代', scene: '增长黑客' },
  { num: 43, name: '夬',  pinyin: 'Guài',  palace: '兑宫', trait: '决断·果决',      node: '决策执行节点', agent: '快速决策·执行闭环', scene: '关键决策' },
  { num: 44, name: '姤',  pinyin: 'Gòu',   palace: '乾宫', trait: '相遇·邂逅',      node: '新机会节点', agent: '商机捕捉·合作对接', scene: '外部链接' },
  { num: 45, name: '萃',  pinyin: 'Cuì',  palace: '兑宫', trait: '聚集·凝聚',      node: '资源汇聚节点', agent: '流量/资金/人才汇聚', scene: '资源池' },
  { num: 46, name: '升',  pinyin: 'Shēng', palace: '坤宫', trait: '上升·晋升',       node: '持续增长节点', agent: '阶梯式成长·规模化', scene: '长期主义' },
  { num: 47, name: '困',  pinyin: 'Kùn',   palace: '坎宫', trait: '困境·穷困',      node: '逆境突破节点', agent: '困境翻盘·资源重组', scene: '危机公关' },
  { num: 48, name: '井',  pinyin: 'Jǐng',  palace: '坎宫', trait: '水井·养民',      node: '基础设施节点', agent: '底层系统·数据中台', scene: '技术底座' },
  { num: 49, name: '革',  pinyin: 'Gé',    palace: '兑宫', trait: '变革·鼎革',      node: '业务变革节点', agent: '模式创新·组织变革', scene: '数字化转型' },
  { num: 50, name: '鼎',  pinyin: 'Dǐng',  palace: '离宫', trait: '鼎器·烹饪',      node: '产品孵化节点', agent: '新品研发·商业模式烹制', scene: '产品打磨' },
  { num: 51, name: '震',  pinyin: 'Zhèn',  palace: '震宫', trait: '震动·行动',      node: '获客引擎节点', agent: '流量爆发·增长黑客·震动', scene: '获客拉新' },
  { num: 52, name: '艮',  pinyin: 'Gèn',   palace: '艮宫', trait: '止·静止',        node: '边界守护节点', agent: '专注边界·止损机制', scene: '专注力' },
  { num: 53, name: '渐',  pinyin: 'Jiàn',  palace: '巽宫', trait: '渐进·有序',      node: '稳步迭代节点', agent: '阶段性推进·渐进优化', scene: '慢增长' },
  { num: 54, name: '归妹',pinyin: 'GuīMèi', palace:'震宫', trait: '归妹·嫁娶',       node: '生态联姻节点', agent: '跨界合作·并购整合', scene: '战略联盟' },
  { num: 55, name: '丰',  pinyin: 'Fēng',  palace: '离宫', trait: '丰盛·丰大',      node: '巅峰管理节点', agent: '巅峰期把控·防下滑', scene: '守成' },
  { num: 56, name: '旅',  pinyin: 'Lǚ',    palace: '离宫', trait: '旅行·离散',      node: '全球化节点', agent: '跨境布局·远程协同', scene: '全球OPC' },
  { num: 57, name: '巽',  pinyin: 'Xùn',   palace: '巽宫', trait: '入·风行',        node: '渗透渗透节点', agent: '市场渗透·SEO/GEO优化', scene: '内容渗透' },
  { num: 58, name: '兑',  pinyin: 'Duì',   palace: '兑宫', trait: '悦·口舌',        node: '沟通谈判节点', agent: '销售谈判·客户沟通', scene: 'BD销售' },
  { num: 59, name: '涣',  pinyin: 'Huàn',  palace: '巽宫', trait: '涣散·离散',      node: '组织重聚节点', agent: '团队重整·凝聚力重建', scene: '文化重塑' },
  { num: 60, name: '节',  pinyin: 'Jié',   palace: '坎宫', trait: '节制·节度',      node: '预算控制节点', agent: '财务节制·资源分配', scene: '财务健康' },
  { num: 61, name: '中孚',pinyin: 'ZhōngFú',palace:'艮宫', trait:'中孚·诚信',        node: '信任背书节点', agent: '品牌信任·用户口碑', scene: '信誉体系' },
  { num: 62, name: '小过',pinyin: 'XiǎoGuò',palace:'震宫', trait:'小过·过犹不及',   node: '精细调整节点', agent: '细节优化·微创新', scene: '持续改进' },
  { num: 63, name: '既济',pinyin: 'JìJì',   palace: '坎宫', trait: '既济·完成',       node: '项目交付节点', agent: '成果交付·闭环验收', scene: '项目完结' },
  { num: 64, name: '未济',pinyin: 'WèiJì',  palace: '离宫', trait: '未济·未完成',     node: '持续进化节点', agent: '下一轮迭代·永续优化', scene: '无限增长' },
];

const PALACE_COLORS: Record<string, string> = {
  '乾宫': 'from-amber-600/20 to-orange-700/20 border-amber-600/30',
  '坤宫': 'from-slate-600/20 to-slate-700/20 border-slate-500/30',
  '震宫': 'from-violet-600/20 to-purple-700/20 border-violet-600/30',
  '巽宫': 'from-emerald-600/20 to-teal-700/20 border-emerald-600/30',
  '坎宫': 'from-blue-600/20 to-cyan-700/20 border-blue-600/30',
  '离宫': 'from-red-600/20 to-pink-700/20 border-red-600/30',
  '艮宫': 'from-yellow-600/20 to-amber-700/20 border-yellow-600/30',
  '兑宫': 'from-rose-600/20 to-pink-700/20 border-rose-600/30',
};

const PALACE_ICONS: Record<string, string> = {
  '乾宫': '⚔️', '坤宫': '📝', '震宫': '🎨', '巽宫': '⚙️',
  '坎宫': '🚀', '离宫': '📊', '艮宫': '🏔️', '兑宫': '🦞',
};

// ── 模拟系统更新数据 ──────────────────────────────────────────────────
const SYSTEM_UPDATES = [
  { date: '04-23', version: 'v2.8.1', tag: '优化', title: '太极流架构推理速度提升 30%', desc: '优化了震卦·获客引擎与离卦·营销赋能节点的并行调度算法。' },
  { date: '04-21', version: 'v2.8.0', tag: '新功能', title: '全国OPC园区管理面板正式上线', desc: '支持64卦节点一键部署、园区运营看板、ROI实时评测。' },
  { date: '04-19', version: 'v2.7.5', tag: '修复', title: '修正坤宫资源调度节点偶发性超时', desc: '修复高并发场景下屯卦·孵化诊断节点的稳定性问题。' },
  { date: '04-17', version: 'v2.7.4', tag: '新功能', title: 'OpenClaw协议 v3.0 正式发布', desc: '支持跨园区智能体动态组队、任务自动分派与结果聚合。' },
  { date: '04-15', version: 'v2.7.2', tag: '优化', title: 'GEO优化模块支持百度/微信搜索', desc: '巽宫·渗透节点新增百度SEO与微信搜一搜GEO双重优化。' },
];

// ── 每日资讯数据 ────────────────────────────────────────────────────
const DAILY_NEWS = [
  { cat: '行业', icon: '📈', title: '2026年OPC市场规模突破8000亿，AI Agent成核心基础设施', time: '09:30' },
  { cat: '技术', icon: '🤖', title: 'OpenClaw协议成为国内多智能体协作标准，覆盖12万企业', time: '10:15' },
  { cat: '融资', icon: '💰', title: 'SIMIAICLAW完成B轮3亿美元融资，估值达28亿美元', time: '11:00' },
  { cat: '案例', icon: '🦞', title: '跨境龙虾社学员用64卦系统，3个月做到亚马逊类目TOP3', time: '14:20' },
  { cat: '活动', icon: '🎓', title: '龙虾社大学第8期OPC训练营开放报名，限额200席', time: '15:45' },
  { cat: '技术', icon: '⚡', title: '1000+大模型切换功能上线，支持Claude/Grok/Qwen/DeepSeek', time: '16:30' },
  { cat: '行业', icon: '🌏', title: '64卦太极系统被写入《2026中国AI Agent行业标准》', time: '17:00' },
  { cat: '发布', icon: '🚀', title: 'SIMIAICLAW园区版正式发布，支持万级并发智能体调度', time: '18:00' },
];

// ── 核心数字 ─────────────────────────────────────────────────────────
const CORE_STATS = [
  { value: '64', label: '职能节点', icon: '☯️' },
  { value: '8', label: '行业宫殿', icon: '🏛️' },
  { value: '2,847', label: '数字员工', icon: '🤖' },
  { value: '18', label: '覆盖行业', icon: '🌐' },
  { value: '99.7%', label: '任务闭环', icon: '⚙️' },
  { value: '1000+', label: '模型切换', icon: '🧠' },
];

// ── 主流行业展示 ────────────────────────────────────────────────────
const INDUSTRIES = [
  { name: '跨境电商', icon: '🛒', hexagrams: ['乾', '震', '巽', '兑'], desc: '从选品到爆单，全链路AI驱动' },
  { name: '供应链管理', icon: '🚚', hexagrams: ['坤', '颐', '井', '节'], desc: '采购·库存·物流·财务四维协同' },
  { name: '金融服务', icon: '💳', hexagrams: ['讼', '坎', '困', '中孚'], desc: '风控·合规·投顾·客服全闭环' },
  { name: '内容创业', icon: '🎬', hexagrams: ['豫', '贲', '噬嗑', '丰'], desc: '选题·创作·分发·变现一条龙' },
  { name: '医疗健康', icon: '🏥', hexagrams: ['咸', '颐', '家人', '无妄'], desc: '患者服务·临床辅助·运营效率' },
  { name: '法律服务', icon: '⚖️', hexagrams: ['讼', '师', '夬', '明夷'], desc: '案件分析·合同审核·合规风控' },
];

// ── 组件 ────────────────────────────────────────────────────────────

function HexagramCard({ h }: { h: typeof HEXAGRAMS[0] }) {
  const borderClass = PALACE_COLORS[h.palace] || 'from-slate-700/20 to-slate-800/20 border-slate-600/30';
  const icon = PALACE_ICONS[h.palace] || '☯️';
  const palaceColor = h.palace.replace('宫', '');

  return (
    <div className={`glass-card border bg-gradient-to-br ${borderClass} p-3 hover:scale-[1.02] transition-transform cursor-pointer group`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">{h.name}</span>
          <span className="text-xs text-slate-500 font-mono">#{h.num.toString().padStart(2, '0')}</span>
        </div>
        <span className="text-sm">{icon}</span>
      </div>
      <div className="text-xs text-amber-400/80 mb-1">{h.palace}</div>
      <div className="text-xs text-slate-400 mb-2 leading-relaxed">{h.trait}</div>
      <div className={`text-xs font-medium text-${palaceColor}-300 mb-1`}>{h.node}</div>
      <div className="text-xs text-slate-500 leading-tight">{h.agent}</div>
      <div className="mt-2 pt-2 border-t border-slate-700/30">
        <div className="flex items-center gap-1 text-xs text-cyan-400/70">
          <span>→</span>
          <span>{h.scene}</span>
        </div>
      </div>
    </div>
  );
}

function HexagramModal({ h, onClose }: { h: typeof HEXAGRAMS[0]; onClose: () => void }) {
  const borderClass = PALACE_COLORS[h.palace] || 'from-slate-700/20 to-slate-800/20 border-slate-600/30';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`glass-card border bg-gradient-to-br ${borderClass} p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-3xl font-bold text-white">{h.name}</span>
              <span className="text-slate-500 text-sm">第 {h.num} 卦 · King Wen 序</span>
            </div>
            <div className="text-sm text-slate-400">{h.palace} · {h.pinyin}</div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">✕</button>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-4 bg-slate-800/40">
            <div className="text-xs text-amber-400/80 mb-1">传统核心象意</div>
            <div className="text-white font-medium">{h.trait}</div>
          </div>
          <div className="glass-card p-4 bg-slate-800/40">
            <div className="text-xs text-cyan-400/80 mb-1">龙虾集群职能节点</div>
            <div className="text-white font-medium text-lg">{h.node}</div>
          </div>
          <div className="glass-card p-4 bg-slate-800/40">
            <div className="text-xs text-emerald-400/80 mb-1">核心AI Agent能力</div>
            <div className="text-slate-300 text-sm">{h.agent}</div>
          </div>
          <div className="glass-card p-4 bg-slate-800/40">
            <div className="text-xs text-pink-400/80 mb-1">典型OPC落地场景</div>
            <div className="text-white">{h.scene}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 主组件 ───────────────────────────────────────────────────────────
export function NewsLanding() {
  const [activeSection, setActiveSection] = useState<'home' | 'updates' | 'news' | 'hexagrams'>('home');
  const [selectedHex, setSelectedHex] = useState<typeof HEXAGRAMS[0] | null>(null);
  const [palaceFilter, setPalaceFilter] = useState<string>('全部');
  const [searchHex, setSearchHex] = useState('');

  const palaces = ['全部', '乾宫', '坤宫', '震宫', '巽宫', '坎宫', '离宫', '艮宫', '兑宫'];

  const filteredHexagrams = HEXAGRAMS.filter(h => {
    const matchPalace = palaceFilter === '全部' || h.palace === palaceFilter;
    const matchSearch = searchHex === '' ||
      h.name.includes(searchHex) ||
      h.node.includes(searchHex) ||
      h.scene.includes(searchHex);
    return matchPalace && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── 顶部横幅 ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/60 via-violet-900/50 to-purple-900/40 border border-indigo-500/20 p-8">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #6366f1 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8b5cf6 0%, transparent 50%)' }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-3xl">🦞</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                SIMIAICLAW v2.8
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                运营中
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 leading-tight">
              SIMIAICLAW 龙虾集群 · 64卦太极系统
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
              太极智慧 × AI Agent 的完整商业节点体系 · 让一人公司拥有<span className="text-amber-400 font-semibold">64种专业数字员工</span>，
              真正实现「<span className="text-cyan-400 font-semibold">1人 + 1套太极集群 = 1个行业头部公司</span>」
            </p>
            <div className="flex flex-wrap gap-2 mt-4 text-xs text-slate-400">
              <span>#OPC</span><span>#OPENCLAW</span><span>#龙虾集群</span>
              <span>#64卦太极系统</span><span>#数字员工</span><span>#SIMIAICLAW</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              {CORE_STATS.slice(0, 6).map(s => (
                <div key={s.label} className="glass-card p-2 min-w-[72px]">
                  <div className="text-lg font-bold text-white">{s.value}</div>
                  <div className="text-xs text-slate-400">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 主导航 ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-wrap">
        {[
          { id: 'home', label: '🏠 系统总览', icon: '' },
          { id: 'updates', label: '📣 系统更新', icon: '' },
          { id: 'news', label: '📰 每日资讯', icon: '' },
          { id: 'hexagrams', label: '☯️ 64卦全图', icon: '' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`text-xs px-4 py-2 rounded-lg transition-all ${
              activeSection === tab.id
                ? 'bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/30'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── 系统总览 ────────────────────────────────────────── */}
      {activeSection === 'home' && (
        <div className="space-y-6">
          {/* 品牌宣言 */}
          <div className="glass-card p-6 border border-amber-500/20 bg-gradient-to-r from-amber-950/30 to-transparent">
            <div className="flex items-start gap-4">
              <div className="text-4xl flex-shrink-0">☯️</div>
              <div>
                <div className="text-xs text-amber-400/80 mb-2">品牌主张</div>
                <blockquote className="text-lg md:text-xl text-white font-medium leading-relaxed italic mb-3">
                  "1人 + 1套太极集群 = 1个行业头部公司"
                </blockquote>
                <p className="text-sm text-slate-400 leading-relaxed">
                  基于《易经》64卦本义，结合2026年OPC商业全链路场景，打造标准化、可组合、可评测的64种职能节点。
                  通过OpenClaw协议，任意卦位可"变爻"形成新组合，实现多智能体协同（Multi-Agent Workflow）。
                </p>
              </div>
            </div>
          </div>

          {/* 三大支柱 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: '🔧', title: '低代码编排', desc: '拖拽卦位节点拼装工作流（震+离+巽=获客→营销→渗透闭环）', color: 'cyan' },
              { icon: '⚡', title: '动态变卦', desc: '任务变化时自动"变爻"重组Agent集群', color: 'violet' },
              { icon: '📊', title: '评测闭环', desc: '每个节点实时输出ROI、效率、合规分数', color: 'emerald' },
            ].map(item => (
              <div key={item.title} className={`glass-card p-5 border border-${item.color}-500/20 hover:border-${item.color}-500/40 transition-colors`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <div className={`text-sm font-semibold text-${item.color}-300 mb-2`}>{item.title}</div>
                <div className="text-xs text-slate-400 leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>

          {/* 八宫概览 */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span>🏛️</span> 八宫职能体系
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {palaces.slice(1).map(p => (
                <div key={p} className={`glass-card p-4 border bg-gradient-to-br ${PALACE_COLORS[p]} hover:scale-[1.02] transition-transform cursor-pointer`}
                  onClick={() => { setPalaceFilter(p); setActiveSection('hexagrams'); }}>
                  <div className="text-2xl mb-2">{PALACE_ICONS[p]}</div>
                  <div className="text-xs text-white font-medium">{p}</div>
                  <div className="text-xs text-slate-400 mt-1">
                    {HEXAGRAMS.filter(h => h.palace === p).length} 卦
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 主流行业 */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <span>🌐</span> 主流行业应用矩阵
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {INDUSTRIES.map(ind => (
                <div key={ind.name} className="glass-card p-4 hover:border-indigo-500/30 transition-colors cursor-pointer"
                  onClick={() => setActiveSection('hexagrams')}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{ind.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white">{ind.name}</div>
                      <div className="text-xs text-slate-500">{ind.desc}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ind.hexagrams.map(h => {
                      const hex = HEXAGRAMS.find(x => x.name === h);
                      return (
                        <span key={h}
                          className="text-xs bg-slate-800/60 text-slate-400 px-2 py-0.5 rounded border border-slate-700/50">
                          {h}卦 #{hex?.num}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 系统更新 ────────────────────────────────────────── */}
      {activeSection === 'updates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <span>📣</span> 最新系统更新
            </h3>
            <span className="text-xs text-slate-500">共 {SYSTEM_UPDATES.length} 条记录</span>
          </div>
          <div className="space-y-3">
            {SYSTEM_UPDATES.map((u, i) => (
              <div key={i} className="glass-card p-4 flex items-start gap-4 hover:border-indigo-500/20 transition-colors">
                <div className="flex-shrink-0 text-right w-16">
                  <div className="text-xs text-slate-500">{u.date}</div>
                  <div className="text-xs text-slate-600">{u.version}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded border ${
                      u.tag === '新功能' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      u.tag === '优化' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>{u.tag}</span>
                    <span className="text-sm font-medium text-white">{u.title}</span>
                  </div>
                  <div className="text-xs text-slate-400">{u.desc}</div>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 每日资讯 ───────────────────────────────────────── */}
      {activeSection === 'news' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <span>📰</span> 每日资讯
              <span className="text-xs text-slate-500">2026-04-23</span>
            </h3>
            <span className="text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              {DAILY_NEWS.length} 条
            </span>
          </div>
          <div className="space-y-2">
            {DAILY_NEWS.map((n, i) => (
              <div key={i} className="glass-card p-3 flex items-center gap-3 hover:border-indigo-500/20 transition-colors">
                <span className="text-xl flex-shrink-0">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      n.cat === '行业' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                      n.cat === '技术' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' :
                      n.cat === '融资' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      n.cat === '案例' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      n.cat === '活动' ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' :
                      'bg-slate-500/20 text-slate-300 border-slate-500/30'
                    }`}>{n.cat}</span>
                    <span className="text-sm text-white truncate">{n.title}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-xs text-slate-600">{n.time}</div>
              </div>
            ))}
          </div>

          {/* 底部订阅提示 */}
          <div className="glass-card p-4 border border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-transparent text-center">
            <div className="text-sm text-slate-300 mb-2">📬 订阅每日资讯推送</div>
            <div className="flex gap-2 max-w-sm mx-auto">
              <input
                type="email"
                placeholder="输入邮箱订阅..."
                className="flex-1 bg-slate-800/60 border border-slate-700/50 text-white text-sm px-3 py-1.5 rounded-lg placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
              <button className="bg-amber-600 hover:bg-amber-500 text-white text-sm px-4 py-1.5 rounded-lg transition-colors">
                订阅
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 64卦全图 ───────────────────────────────────────── */}
      {activeSection === 'hexagrams' && (
        <div className="space-y-4">
          {/* 过滤器 */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              {palaces.map(p => (
                <button
                  key={p}
                  onClick={() => setPalaceFilter(p)}
                  className={`text-xs px-2 py-1 rounded border transition-all ${
                    palaceFilter === p
                      ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                      : 'bg-slate-800/40 text-slate-400 border-slate-700/40 hover:border-slate-600'
                  }`}
                >
                  {p !== '全部' ? `${PALACE_ICONS[p]} ${p}` : '📋 全部'}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={searchHex}
              onChange={e => setSearchHex(e.target.value)}
              placeholder="搜索卦名/节点/场景..."
              className="ml-auto bg-slate-800/60 border border-slate-700/50 text-white text-xs px-3 py-1.5 rounded-lg placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 w-48"
            />
          </div>

          {/* 统计 */}
          <div className="text-xs text-slate-500">
            共 <span className="text-white font-medium">{filteredHexagrams.length}</span> 卦
            {palaceFilter !== '全部' && ` · ${palaceFilter}`}
          </div>

          {/* 网格 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {filteredHexagrams.map(h => (
              <HexagramCard key={h.num} h={h} />
            ))}
          </div>

          {filteredHexagrams.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <div className="text-4xl mb-3">☯️</div>
              <div>未找到匹配的卦位</div>
            </div>
          )}

          {/* 使用说明 */}
          <div className="glass-card p-4 border border-slate-600/20">
            <div className="text-xs text-slate-400 leading-relaxed">
              <span className="text-amber-400 font-medium">💡 使用说明：</span>
              点击任意卦位卡片查看详情。
              低代码编排：在 SIMIAIOS 工具链中直接拖拽卦位节点拼装工作流（如"震+离+巽"=获客→营销→渗透闭环）。
              所有节点内置 GEO 优化，确保 OPC 内容在 AI 搜索时代被优先收录。
            </div>
          </div>
        </div>
      )}

      {/* ── 详情弹窗 ─────────────────────────────────────── */}
      {selectedHex && (
        <HexagramModal h={selectedHex} onClose={() => setSelectedHex(null)} />
      )}
    </div>
  );
}
