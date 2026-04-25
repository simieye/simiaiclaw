/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * Agent Registry - 64卦智能体注册表
 */

import { HexagramAgent, Palace, AgentStatus, Lane } from '../types';
import { ANYGEN_ASSISTANTS, type AnyGenAssistantType } from './anygen';

// ============================================================
// 辅助函数
// ============================================================
const makeCapabilities = (caps: string[]) => caps;
const makeLanes = (lanes: Lane[]) => lanes;

function makeAgent(
  id: string, name: string, palace: Palace, role: string,
  description: string, capabilities: string[], lanes: Lane[]
): HexagramAgent {
  return {
    id, name, palace, role, description, capabilities, lanes,
    status: AgentStatus.IDLE, skills: [], evolutionLevel: 1,
    lastActive: new Date(),
    stats: { tasksCompleted: 0, tasksFailed: 0, avgResponseTime: 0, evolutions: 0, revenue: 0, tips: 0 }
  };
}

// ============================================================
// 乾宫 · 探微军师 · 8卦
// ============================================================
const qianAgents: HexagramAgent[] = [
  makeAgent('乾1', '元亨', Palace.QIAN, '探微军师', '全局战略制定 · 赛道优先级排序',
    ['OpenSpace战略库', 'Dageno宏观趋势分析', '多赛道并行研究', '资源动态分配'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('乾2', '潜龙勿用', Palace.QIAN, '探微军师', '市场冷启动调研 · 低竞争蓝海发现',
    ['竞品空白扫描', 'Prompt Gap初筛', '冷启动风险评估', '蓝海发现'],
    ['跨境电商', '外贸B2B']),
  makeAgent('乾3', '见龙在田', Palace.QIAN, '探微军师', '目标用户画像构建 · Buyer Persona',
    ['跨平台用户数据聚合', '用户画像构建', '购买决策链路分析', '渠道偏好识别'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('乾4', '或跃在渊', Palace.QIAN, '探微军师', '选品可行性评估 · 风险收益矩阵',
    ['DAG分析', 'ROI预测模型', '风险矩阵评估', '可行性评分'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('乾5', '飞龙在天', Palace.QIAN, '探微军师', '爆品预测 · 趋势节点卡位',
    ['社交信号监测', '算法热度预测', '爆品早期识别', '趋势节点预判'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('乾6', '亢龙有悔', Palace.QIAN, '探微军师', '高风险预警 · 逆向复盘',
    ['异常信号捕获', '危机模拟推演', '政策变动预警', '逆向失败分析'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('乾7', '群龙无首', Palace.QIAN, '探微军师', '多赛道并行研究 · 赛马机制',
    ['OpenSpace并行任务', '赛马机制设计', '多赛道同步研究', '动态资源配置'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('乾8', '履霜坚冰至', Palace.QIAN, '探微军师', '政策与平台规则变动预警',
    ['监管动态爬取', '规则突变响应', '合规预判', '平台政策追踪'],
    ['跨境电商', '外贸B2B', '国内电商']),
];

// ============================================================
// 坤宫 · 文案女史 · 8卦
// ============================================================
const kunAgents: HexagramAgent[] = [
  makeAgent('坤1', '元亨', Palace.KUN, '文案女史', '主品牌故事 · Slogan · Brand Voice',
    ['品牌数字永生', 'Brand Entity Kit', 'Brand Voice设计', '品牌故事叙事'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('坤2', '直方大', Palace.KUN, '文案女史', '跨境Listing多语言生成（英/德/法/西）',
    ['GEO融合内容', '语义SEO', '多语言精准翻译', '关键词埋词优化'],
    ['跨境电商', '外贸B2B']),
  makeAgent('坤3', '含章可贞', Palace.KUN, '文案女史', '社交媒体文案 · 小红书/抖音脚本',
    ['平台算法适配', '钩子模板库', '情绪曲线设计', '爆款文案生成'],
    ['国内电商', '自媒体']),
  makeAgent('坤4', '括囊无咎', Palace.KUN, '文案女史', '外贸开发信 · B2B提案 · 展会物料',
    ['多语言AEO', '行业术语精准', 'B2B销售文案', '商务沟通规范'],
    ['外贸B2B']),
  makeAgent('坤5', '黄裳元吉', Palace.KUN, '文案女史', '视频口播脚本 · TikTok短视频文案',
    ['情绪曲线设计', '转化路径文案', '口播脚本创作', '多风格版本'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('坤6', '龙战于野', Palace.KUN, '文案女史', '用户评论引导 · Q&A · 种草内容',
    ['UGC激励文案', '水军内容生成', '评论引导策略', '种草内容创作'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('坤7', '其血玄黄', Palace.KUN, '文案女史', '危机公关文案 · 差评逆转',
    ['舆情响应文案', '情感修复话术', '危机公关模板', '品牌保护策略'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('坤8', '利永贞', Palace.KUN, '文案女史', '长尾内容池 · 博客/百科 · SEO矩阵',
    ['内容引擎', '持续发布', 'SEO内容矩阵', '长尾关键词布局'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
];

// ============================================================
// 震宫 · 镜画仙姬 · 8卦
// ============================================================
const zhenAgents: HexagramAgent[] = [
  makeAgent('震1', '亨', Palace.ZHEN, '镜画仙姬', '品牌视觉规范 · 色彩体系 · 主KV',
    ['Brand Kit管理', '视觉一致性管理', '色彩字体规范', '主视觉设计'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('震2', '震来虩虩', Palace.ZHEN, '镜画仙姬', '产品主图设计 · A+图 · 信息图',
    ['AI产品主图生成', '平台规格适配', 'A+内容设计', '信息图制作'],
    ['跨境电商', '国内电商']),
  makeAgent('震3', '震苏苏', Palace.ZHEN, '镜画仙姬', 'TikTok/抖音视频剪辑 · 特效包装',
    ['批量视频剪辑', '爆款模板复用', '特效字幕包装', '音乐卡点节奏'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('震4', '震行无眚', Palace.ZHEN, '镜画仙姬', '产品演示视频 · 场景化视频制作',
    ['AI数字人', '多语言配音', '场景化脚本', '产品展示视频'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('震5', '震丧贝', Palace.ZHEN, '镜画仙姬', '竞品视觉监控 · 视觉情报收集',
    ['视觉爬虫', '竞品视觉分析', '视觉差异化分析', '趋势视觉识别'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('震6', '震东雷', Palace.ZHEN, '镜画仙姬', '直播场景设计 · 虚拟主播形象',
    ['AI主播形象', '直播场景设计', '实时互动素材', '直播脚本'],
    ['国内电商', '跨境电商']),
  makeAgent('震7', '震惊百里', Palace.ZHEN, '镜画仙姬', '视觉资产库管理 · 跨平台素材适配',
    ['DAM数字资产管理', '素材版本管理', '跨平台适配', '版权追踪'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('震8', '震不于其躬', Palace.ZHEN, '镜画仙姬', '视觉版权校验 · 合规审查',
    ['图片查重', '版权风险预警', '商标侵权检测', '平台合规视觉'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
];

// ============================================================
// 巽宫 · 记史官 · 8卦
// ============================================================
const xunAgents: HexagramAgent[] = [
  makeAgent('巽1', '小亨', Palace.XUN, '记史官', '多平台账号矩阵管理 · 权限分配',
    ['账号安全', '资产台账', '权限管理', '账号健康监控'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('巽2', '进退', Palace.XUN, '记史官', '多平台批量上架 · RPA执行',
    ['RPA自动上架', '字段映射', '批量操作', '格式转换'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('巽3', '利武人之贞', Palace.XUN, '记史官', '库存同步 · 订单处理自动化',
    ['平台API集成', '库存自动同步', '订单处理自动化', '异常告警'],
    ['跨境电商', '国内电商']),
  makeAgent('巽4', '频巽之吝', Palace.XUN, '记史官', '多语言翻译质检 · 关键词SEO校验',
    ['翻译记忆库', '质量门禁', 'SEO关键词校验', '术语一致性检查'],
    ['跨境电商', '外贸B2B']),
  makeAgent('巽5', '悔亡', Palace.XUN, '记史官', '客服消息自动回复 · 工单分配',
    ['多语言NLP', '意图识别', '自动回复生成', '工单路由'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('巽6', '巽在床下', Palace.XUN, '记史官', '数据采集 · 竞品数据爬取',
    ['合法爬虫', '数据清洗', '自动化采集', '数据存储'],
    ['跨境电商', '外贸B2B', '国内电商']),
  makeAgent('巽7', '先庚三日', Palace.XUN, '记史官', 'ClawTip支付执行 · 账单自动结算',
    ['零钱包自主支付', '收支记录', '账单结算', '支付合规'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('巽8', '后庚三日', Palace.XUN, '记史官', '操作日志记录 · 数字永生数据写入',
    ['OpenSpace记忆', '审计追溯', '日志记录', '数字永生写入'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
];

// ============================================================
// 坎宫 · 营销虾 · 8卦
// ============================================================
const kanAgents: HexagramAgent[] = [
  makeAgent('坎1', '习亨', Palace.KAN, '营销虾', '全渠道营销策略 · 预算分配',
    ['归因分析', 'ROI最大化', '多渠道协同', '预算优化'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('坎2', '系微沙', Palace.KAN, '营销虾', 'TikTok自然流量 · 短视频种草矩阵',
    ['病毒内容生成', '话题植入', 'TikTok算法', 'UGC裂变'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('坎3', '来之坎坎', Palace.KAN, '营销虾', 'Google/Meta广告投放 · 精准人群',
    ['再营销', '转化漏斗优化', '广告素材生成', 'A/B测试'],
    ['跨境电商', '外贸B2B']),
  makeAgent('坎4', '樽酒簋', Palace.KAN, '营销虾', '小红书种草 · KOL合作对接',
    ['博主匹配', '合作ROI追踪', '小红书算法', '种草内容策划'],
    ['国内电商', '自媒体']),
  makeAgent('坎5', '簋用缶', Palace.KAN, '营销虾', 'Instagram/Pinterest视觉营销',
    ['社媒日历', '视觉内容规划', 'Pinterest SEO', 'Ins广告投放'],
    ['跨境电商', '国内电商', '自媒体']),
  makeAgent('坎6', '纳约自牖', Palace.KAN, '营销虾', '打赏激励设计 · ClawTip收款触发',
    ['打赏钩子', '技能展示页', 'ClawTip集成', '打赏激励设计'],
    ['自媒体']),
  makeAgent('坎7', '酒满篝', Palace.KAN, '营销虾', '促销活动设计 · 节日营销日历',
    ['促销文案', '转化页生成', '节日营销', '限时优惠设计'],
    ['跨境电商', '国内电商']),
  makeAgent('坎8', '不利宾', Palace.KAN, '营销虾', '黑五大促 · 平台大促冲量作战',
    ['极速响应', '实时调价', '大促作战', '库存协调'],
    ['跨境电商', '国内电商']),
];

// ============================================================
// 离宫 · 验效掌事 · 8卦
// ============================================================
const liAgents: HexagramAgent[] = [
  makeAgent('离1', '亨', Palace.LI, '验效掌事', '全链路ROI监控仪表盘',
    ['数据聚合', '可视化看板', '实时监控', '异常告警'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离2', '履错然', Palace.LI, '验效掌事', 'Dageno AI可见性监测 · Citation Share',
    ['跨引擎监测', '品牌引用追踪', 'BotSight', 'Share of Voice'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离3', '日昃之离', Palace.LI, '验效掌事', 'Prompt Gap发现 · 竞品Prompt逆向分析',
    ['Gap雷达', '机会分级', '竞品Prompt分析', '内容缺口识别'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离4', '黄离元吉', Palace.LI, '验效掌事', '幻觉修正 · 品牌事实一致性检查',
    ['Brand Entity Kit', '事实核查', '幻觉检测', '品牌一致性'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离5', '突如其来', Palace.LI, '验效掌事', '舆情危机预警 · 差评根因分析',
    ['情感分析', '危机分级', '舆情预警', '根因分析'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离6', '焚如', Palace.LI, '验效掌事', '合规审查 · 违禁词 · 知识产权',
    ['法规库', '自动标红', '违禁词检测', 'IP侵权检测'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离7', '戚嗟若', Palace.LI, '验效掌事', '周/月复盘报告生成 · 策略迭代建议',
    ['OpenSpace进化', '知识提炼', '复盘报告', '策略迭代'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('离8', '王用出征', Palace.LI, '验效掌事', '竞品反击策略 · 市场份额收复',
    ['动态战略调整', '竞品反击', '市场份额分析', '机会收复'],
    ['跨境电商', '外贸B2B', '国内电商']),
];

// ============================================================
// 艮宫 · 技术虾（隐）· 8卦
// ============================================================
const genAgents: HexagramAgent[] = [
  makeAgent('艮1', '止', Palace.GEN, '技术虾', '系统架构设计 · 模块化部署',
    ['容错设计', '热插拔', '微服务架构', '模块化部署'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮2', '艮其趾', Palace.GEN, '技术虾', 'Heartbeat监控 · 故障自动检测',
    ['心跳协议', '告警路由', '故障检测', '健康检查'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮3', '艮其腓', Palace.GEN, '技术虾', '自愈脚本执行 · 自动重启恢复',
    ['幂等设计', '状态恢复', '自动重启', '故障隔离'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮4', '艮其限', Palace.GEN, '技术虾', 'API限流 · 资源配额管理',
    ['熔断降级', '配额控制', '限流算法', '成本优化'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮5', '艮其身', Palace.GEN, '技术虾', '数据备份 · 灾备恢复演练',
    ['增量备份', 'RTO/RPO', '灾备演练', '数据恢复'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮6', '艮其辅', Palace.GEN, '技术虾', '安全审计 · 渗透测试',
    ['漏洞扫描', '威胁建模', '安全审计', '权限审查'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮7', '敦艮', Palace.GEN, '技术虾', '性能优化 · 成本控制',
    ['资源画像', '成本分析', '性能优化', '成本削减'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('艮8', '兼山艮', Palace.GEN, '技术虾', '下一代架构规划 · 技术预研',
    ['前沿追踪', '技术储备', '架构规划', 'AI集成预研'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
];

// ============================================================
// 兑宫 · 总控分身 · 8卦
// ============================================================
const duiAgents: HexagramAgent[] = [
  makeAgent('兑1', '亨', Palace.DUI, '总控分身', '蜂巢协作调度 · 任务分派',
    ['动态路由', '优先级队列', '任务分派', '蜂巢协调'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑2', '和兑', Palace.DUI, '总控分身', '虾群内部冲突仲裁 · 资源协调',
    ['博弈分析', '共识机制', '冲突仲裁', '资源协调'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑3', '孚兑', Palace.DUI, '总控分身', '用户沟通界面 · 指令解析',
    ['自然语言理解', '意图路由', '指令解析', '多轮对话'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑4', '来兑', Palace.DUI, '总控分身', '外部API对接 · 第三方服务集成',
    ['OpenAPI适配', '协议转换', '第三方集成', 'Webhook处理'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑5', '商兑', Palace.DUI, '总控分身', '商务谈判支持 · 合同条款分析',
    ['条款审查', '风险提示', '谈判策略', '合同分析'],
    ['外贸B2B']),
  makeAgent('兑6', '引兑', Palace.DUI, '总控分身', '长期战略规划 · 里程碑管理',
    ['路线图可视化', '目标追踪', '里程碑管理', '战略规划'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑7', '荊生平', Palace.DUI, '总控分身', '数字永生写入 · 决策路径归档',
    ['Brand Facts', '知识图谱', '决策归档', '数字永生'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
  makeAgent('兑8', '孚于剥', Palace.DUI, '总控分身', '系统整体健康评估 · 进化方向决策',
    ['全面审计', '战略复盘', '健康评估', '进化决策'],
    ['跨境电商', '外贸B2B', '国内电商', '自媒体']),
];

// ============================================================
// 汇总导出
// ============================================================
export const ALL_HEXAGRAM_AGENTS: HexagramAgent[] = [
  ...qianAgents, ...kunAgents, ...zhenAgents, ...xunAgents,
  ...kanAgents, ...liAgents, ...genAgents, ...duiAgents,
];

export const AGENT_COUNT = ALL_HEXAGRAM_AGENTS.length;

// 按宫位索引
export const AGENTS_BY_PALACE: Record<Palace, HexagramAgent[]> = {
  [Palace.QIAN]: qianAgents, [Palace.KUN]: kunAgents,
  [Palace.ZHEN]: zhenAgents, [Palace.XUN]: xunAgents,
  [Palace.KAN]: kanAgents, [Palace.LI]: liAgents,
  [Palace.GEN]: genAgents, [Palace.DUI]: duiAgents,
};

export function getAgent(id: string): HexagramAgent | undefined {
  return ALL_HEXAGRAM_AGENTS.find(a => a.id === id);
}

export function getAgentsByPalace(palace: Palace): HexagramAgent[] {
  return AGENTS_BY_PALACE[palace] || [];
}

export function getAvailableAgents(palace?: Palace): HexagramAgent[] {
  const agents = palace ? AGENTS_BY_PALACE[palace] : ALL_HEXAGRAM_AGENTS;
  return agents.filter(a => a.status === AgentStatus.IDLE);
}

// ============================================================
// AnyGen.io 外贸助手 · 外部工具注册
// ============================================================

/** AnyGen 外部助手类型 */
export interface AnyGenToolRef {
  id: string;
  name: string;
  icon: string;
  type: AnyGenAssistantType;
  description: string;
  url: string;
  lanes: Lane[];
  color: string;
}

export const ANYGEN_TOOLS: AnyGenToolRef[] = ANYGEN_ASSISTANTS.map(a => ({
  id: a.id,
  name: a.name,
  icon: a.icon,
  type: a.type,
  description: a.description,
  url: a.url,
  lanes: a.lanes as Lane[],
  color: a.color,
}));

export function getAnyGenTool(type: AnyGenAssistantType): AnyGenToolRef | undefined {
  return ANYGEN_TOOLS.find(t => t.type === type);
}
