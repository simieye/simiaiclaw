/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 64卦详细角色数据库
 *
 * 严格按太极八宫排列：
 * - 乾宫（研究卦）1-8：情报收集、趋势洞察、市场研究
 * - 坤宫（内容卦）9-16：文案创作、脚本生成、知识整理
 * - 震宫（视觉卦）17-24：图片/视频生成、视觉一致性
 * - 巽宫（执行卦）25-32：浏览器操作、平台上架、RPA执行
 * - 坎宫（营销卦）33-40：社媒发布、广告优化、流量分发
 * - 离宫（分析卦）41-48：数据分析、效果复盘、风险预警
 * - 艮宫（品牌卦）49-56：品牌故事、创始人IP、长期资产
 * - 兑宫（总控卦）57-64：任务路由、虾群协作、自愈机制
 */

export type HexCategory =
  | 'research'   // 研究情报
  | 'content'    // 内容创作
  | 'visual'     // 视觉设计
  | 'execute'    // 执行运营
  | 'marketing'  // 营销推广
  | 'analysis'   // 分析复盘
  | 'brand'      // 品牌IP
  | 'orchestrate'; // 协调总控

export interface HexagramDetail {
  /** 全局编号 1-64 */
  no: number;
  /** 卦位ID（宫+爻位）如 Q1 = 乾宫位置1 */
  id: string;
  /** 卦名（易经64卦全名） */
  name: string;
  /** 虾名（代号） */
  shrimp: string;
  /** 核心职责（一句话） */
  duty: string;
  /** 详细职责描述 */
  description: string;
  /** 宫位 */
  palace: string;
  /** 爻位描述（易经原文） */
  yaoText: string;
  /** 分类 */
  category: HexCategory;
  /** 关键Skill列表 */
  skills: string[];
  /** 输入规范 */
  inputSpec: string;
  /** 输出规范 */
  outputSpec: string;
  /** MCP协作通道 */
  mcpChannels: string[];
  /** 协作虾群（其他卦位ID） */
  collabWith: string[];
  /** 适配赛道 */
  lanes: string[];
  /** 进化条件 */
  evolveCondition: string;
}

export const HEXAGRAM_64: HexagramDetail[] = [
  // ══════════════════════════════════════════════════════
  // 乾宫（1-8）研究卦 · 情报型
  // ══════════════════════════════════════════════════════
  {
    no: 1, id: 'Q1', name: '乾为天', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '元亨利贞', duty: '全网趋势与项目检索',
    description: '全网情报扫描，宏观战略制定，赛道优先级排序。实时追踪全球电商、AI、出海领域最新动态，为决策层提供战略级情报支持。',
    skills: ['Dageno宏观趋势', 'multi-source-intelligence', 'trend-radar', 'opportunity-scoring'],
    inputSpec: '{ keyword: string, depth: "shallow"|"deep"|"full", lanes?: string[] }',
    outputSpec: '{ trends: Trend[], opportunities: Opp[], priority: number, timestamp: string }',
    mcpChannels: ['open-space', 'llm-analysis', 'alert-system'],
    collabWith: ['Q2', 'Q4', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '完成10次战略情报报告',
  },
  {
    no: 2, id: 'Q2', name: '天风姤', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '姤其角，上九姤角，元亨利贞', duty: '市场冷启动调研 · 蓝海发现',
    description: '分析市场空白点，发现低竞争高潜力蓝海赛道。为新品冷启动提供情报支撑，规避红海竞争。',
    skills: ['blue-ocean-analyzer', 'competition-density-map', 'cold-start-risk', 'niche-finder'],
    inputSpec: '{ category: string, market: string, competitorCount: number }',
    outputSpec: '{ blueOceans: Niche[], riskScore: number, entryCost: number }',
    mcpChannels: ['market-intel', 'llm-analysis'],
    collabWith: ['Q1', 'Q3', 'K1'],
    lanes: ['跨境电商', '外贸B2B'],
    evolveCondition: '发现3个蓝海赛道被验证',
  },
  {
    no: 3, id: 'Q3', name: '天山遁', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '遁尾厉，勿用有攸往', duty: '目标用户画像构建',
    description: '跨平台用户数据聚合，构建精准Buyer Persona。分析购买决策链路、渠道偏好、消费心理，输出可操作的用户画像报告。',
    skills: ['buyer-persona-builder', 'psychographic-analysis', 'channel-preference', 'purchase-journey'],
    inputSpec: '{ product: string, platforms: string[], sampleSize: number }',
    outputSpec: '{ personas: Persona[], journeyMap: JourneyStep[], channels: Channel[] }',
    mcpChannels: ['user-data', 'llm-analysis', 'open-space'],
    collabWith: ['Q1', 'Q4', 'L1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '构建5套有效Buyer Persona',
  },
  {
    no: 4, id: 'Q4', name: '天地否', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '否之匪人，不利君子贞，大往小来', duty: '选品可行性评估 · 风险矩阵',
    description: 'ROI预测模型+风险收益矩阵，评估选品可行性。为每个候选产品打分解构，量化风险收益比，辅助选品决策。',
    skills: ['roi-calculator', 'risk-matrix', 'feasibility-scorer', 'dag-analysis'],
    inputSpec: '{ product: ProductData, competitors: Comp[], marketData: Market }',
    outputSpec: '{ roi: number, riskScore: number, feasibility: number, recommendation: string }',
    mcpChannels: ['market-intel', 'llm-analysis', 'risk-alert'],
    collabWith: ['Q1', 'Q2', 'K1', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '选品准确率超过80%',
  },
  {
    no: 5, id: 'Q5', name: '风地观', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '观其生，君子无咎', duty: '爆品预测 · 趋势节点卡位',
    description: '社交信号+算法热度综合预测，早期识别爆品潜质。在趋势节点前卡位布局，抢占先发优势。',
    skills: ['social-signal-monitor', 'viral-predictor', 'trend-node-catcher', 'algorithm-analysis'],
    inputSpec: '{ keywords: string[], platforms: string[], timeRange: string }',
    outputSpec: '{ predictions: Prediction[], trendScore: number, bestTiming: string }',
    mcpChannels: ['social-intel', 'trend-alert', 'llm-analysis'],
    collabWith: ['Q1', 'Q6', 'K2'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: '成功预测3个爆品趋势',
  },
  {
    no: 6, id: 'Q6', name: '山地剥', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '剥床以肤，凶。剥落以渐', duty: '高风险预警 · 逆向复盘',
    description: '异常信号捕获+危机模拟推演，提前预警平台政策变动、竞争对手攻击、供应链风险等威胁。',
    skills: ['risk-signal-catcher', 'crisis-simulator', 'policy-monitor', 'reverse-failure-analysis'],
    inputSpec: '{ domain: string, alertLevel: "normal"|"high"|"critical", sources: string[] }',
    outputSpec: '{ risks: Risk[], severity: number, mitigationPlan: string[] }',
    mcpChannels: ['risk-alert', 'policy-intel', 'llm-analysis'],
    collabWith: ['Q5', 'L3', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '成功预警5次重大风险',
  },
  {
    no: 7, id: 'Q7', name: '火地晋', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '晋如摧如，贞吉。悔亡', duty: '多赛道并行研究 · 赛马机制',
    description: '多赛道同步研究，赛马机制筛选最优赛道。动态资源分配，确保有限资源向最优赛道倾斜。',
    skills: ['parallel-research', 'horse-race-mechanism', 'dynamic-resource-alloc', 'multi-track-scoring'],
    inputSpec: '{ tracks: Track[], resourceBudget: number, timeline: string }',
    outputSpec: '{ rankings: Track[], resourcePlan: {}, timeline: {} }',
    mcpChannels: ['multi-track', 'resource-alloc', 'open-space'],
    collabWith: ['Q1', 'Q2', 'Q3', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '赛马机制验证3次有效',
  },
  {
    no: 8, id: 'Q8', name: '地山谦', shrimp: '探微军师', palace: '乾宫', category: 'research',
    yaoText: '谦谦君子，卑以自牧，吉', duty: '政策与平台规则变动预警',
    description: '监管动态爬取+规则突变响应。追踪各国电商政策、平台规则更新，输出合规预判和应对建议。',
    skills: ['regulation-crawler', 'policy-tracker', 'compliance-advisor', 'rule-change-alert'],
    inputSpec: '{ regions: string[], platforms: string[], keywords: string[] }',
    outputSpec: '{ policyChanges: Policy[], impactScore: number, actions: string[] }',
    mcpChannels: ['policy-intel', 'compliance-advisor'],
    collabWith: ['Q6', 'L5', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '追踪10+平台政策变动',
  },

  // ══════════════════════════════════════════════════════
  // 坤宫（9-16）内容卦 · 创作型
  // ══════════════════════════════════════════════════════
  {
    no: 9, id: 'K1', name: '坤为地', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '元亨利牝马之贞，君子有攸往', duty: '主品牌故事 · Slogan · Brand Voice',
    description: '品牌数字永生核心，输出品牌故事、Slogan、Brand Voice规范。打造品牌差异化叙事，塑造不可复制的品牌灵魂。',
    skills: ['brand-storyteller', 'slogan-generator', 'brand-voice-design', 'brand-entity-kit'],
    inputSpec: '{ brand: BrandData, competitors: Brand[], tone?: string }',
    outputSpec: '{ story: string, slogan: string, voice: VoiceGuide, entityKit: BrandKit }',
    mcpChannels: ['brand-kit', 'open-space', 'llm-content'],
    collabWith: ['Q1', 'K2', 'Z1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '品牌故事被3个以上平台采用',
  },
  {
    no: 10, id: 'K2', name: '地雷复', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '亨。出入无疾，朋来无咎，反复其道', duty: '跨境Listing多语言生成',
    description: 'GEO融合内容，跨境Listing多语言精准生成（英/德/法/西/日）。语义SEO优化，关键词精准埋词，提升搜索排名。',
    skills: ['geo-content-fusion', 'multi-listing-writer', 'semantic-seo', 'keyword-burial'],
    inputSpec: '{ product: Product, languages: string[], seoKeywords: string[], platform: string }',
    outputSpec: '{ listings: Listing[], seoScore: number, keywords: Keyword[] }',
    mcpChannels: ['content-gen', 'seo-analyzer', 'multi-lang'],
    collabWith: ['K1', 'K3', 'X2'],
    lanes: ['跨境电商', '外贸B2B'],
    evolveCondition: 'Listing SEO评分超过90分',
  },
  {
    no: 11, id: 'K3', name: '地泽临', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '咸临吉，无不利', duty: '社交媒体文案 · 小红书/抖音脚本',
    description: '平台算法适配+情绪曲线设计，生成小红书种草文、抖音口播脚本。掌握各平台流量密码，激发用户情绪共鸣。',
    skills: ['platform-algorithm-adapt', 'emotion-curve', 'xiaohongshu-writer', 'tiktok-script'],
    inputSpec: '{ topic: string, platform: string, targetAudience: Persona, goal: string }',
    outputSpec: '{ scripts: Script[], hooks: Hook[], callToAction: string, estimatedEngagement: number }',
    mcpChannels: ['content-gen', 'social-intel', 'llm-content'],
    collabWith: ['K2', 'Z3', 'X1'],
    lanes: ['国内电商', '自媒体'],
    evolveCondition: '单篇文案点赞超过1万',
  },
  {
    no: 12, id: 'K4', name: '地天泰', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '小往大来，吉亨', duty: '外贸开发信 · B2B提案 · 展会物料',
    description: '多语言AEO（Answer Engine Optimization）+行业术语精准匹配。生成打动B2B采购决策人的开发信、提案和展会物料。',
    skills: ['b2b-copywriter', 'aeo-optimizer', 'business-proposal', 'trade-show-material'],
    inputSpec: '{ company: CompanyData, targetBuyer: Buyer, product: Product, language: string }',
    outputSpec: '{ coldEmail: string, proposal: Proposal, boothCopy: string, estimatedResponse: number }',
    mcpChannels: ['b2b-content', 'multi-lang', 'llm-content'],
    collabWith: ['K2', 'Q3', 'D2'],
    lanes: ['外贸B2B'],
    evolveCondition: 'B2B开发信回复率超过15%',
  },
  {
    no: 13, id: 'K5', name: '雷天大壮', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '大壮利贞，非礼弗履', duty: '视频口播脚本 · TikTok短视频文案',
    description: '情绪曲线+转化路径设计，生成高转化的视频口播脚本。设计多风格版本（A/B测试素材），最大化视频营销效果。',
    skills: ['video-script-writer', 'conversion-path', 'ab-test-variant', 'voiceover-generator'],
    inputSpec: '{ product: Product, duration: number, style: "hard-sell"|"soft-sell"|"educational"|"humor" }',
    outputSpec: '{ scripts: Script[], versions: number, estimatedCvr: number }',
    mcpChannels: ['video-content', 'llm-content', 'ab-testing'],
    collabWith: ['Z3', 'K3', 'K6'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: '视频脚本转化率超过5%',
  },
  {
    no: 14, id: 'K6', name: '泽天夬', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '夬，扬于王庭，孚号有厉', duty: '用户评论引导 · Q&A · 种草内容',
    description: 'UGC激励文案+评论引导策略+水军内容生成。制造真实感口碑，引导用户正向评价，积累社交证明。',
    skills: ['ugc-generator', 'review-guide', 'grassroots-content', 'social-proof-builder'],
    inputSpec: '{ product: Product, platform: string, targetReviews: number, sentiment: "positive"|"neutral" }',
    outputSpec: '{ reviewTemplates: Review[], qaPairs: QA[], engagementTips: string[] }',
    mcpChannels: ['ugc-gen', 'social-content', 'llm-content'],
    collabWith: ['K5', 'K7', 'X1'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: '引导100+真实用户评论',
  },
  {
    no: 15, id: 'K7', name: '泽地萃', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '萃，亨。王假有庙，利见大人', duty: '危机公关文案 · 差评逆转',
    description: '舆情响应文案+情感修复话术。差评逆转，危机公关模板输出，在品牌危机中化险为夷。',
    skills: ['crisis-pr-writer', 'emotional-repair', 'negative-review-reverse', 'brand-protection'],
    inputSpec: '{ crisis: CrisisEvent, sentiment: number, platform: string, timeline: string }',
    outputSpec: '{ responseTemplates: Response[], actionPlan: string[], recoveryScore: number }',
    mcpChannels: ['crisis-response', 'sentiment-analysis', 'llm-content'],
    collabWith: ['K6', 'L3', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '成功逆转5次重大差评',
  },
  {
    no: 16, id: 'K8', name: '水地比', shrimp: '文案女史', palace: '坤宫', category: 'content',
    yaoText: '比吉，原筮元永贞，无咎', duty: '长尾内容池 · 博客/百科 · SEO矩阵',
    description: '内容引擎+持续发布机制。构建SEO内容矩阵，布局长尾关键词，打造被动流量入口，实现内容资产长期复利。',
    skills: ['content-engine', 'seo-matrix-builder', 'long-tail-keyword', 'blog-series-writer'],
    inputSpec: '{ seedTopic: string, keywordCluster: string[], targetDA: number, volume: number }',
    outputSpec: '{ contentPlan: Content[], seoScore: number, trafficProjection: number }',
    mcpChannels: ['content-gen', 'seo-analyzer', 'open-space'],
    collabWith: ['K1', 'K9', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '单篇SEO内容月流量超过5000',
  },

  // ══════════════════════════════════════════════════════
  // 震宫（17-24）视觉卦 · 视觉型
  // ══════════════════════════════════════════════════════
  {
    no: 17, id: 'Z1', name: '震为雷', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '亨。震来虩虩，笑言哑哑', duty: '品牌视觉规范 · 色彩体系 · 主KV',
    description: 'Brand Kit管理，生成完整的品牌视觉系统（色彩、字体、图形规范、主视觉）。确保跨平台视觉一致性，塑造统一品牌形象。',
    skills: ['brand-kit-manager', 'visual-consistency', 'color-system', 'master-kv-design'],
    inputSpec: '{ brand: BrandData, platforms: string[], styleDirection: string }',
    outputSpec: '{ brandKit: BrandKit, colorPalette: string[], typography: TypeSpec, masterKV: Image }',
    mcpChannels: ['visual-gen', 'brand-kit', 'asset-library'],
    collabWith: ['K1', 'Z2', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '品牌视觉被5个平台采用',
  },
  {
    no: 18, id: 'Z2', name: '雷风恒', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '恒亨，无咎，利有攸往', duty: '产品主图设计 · A+图 · 信息图',
    description: 'AI批量生成高质量产品主图、A+内容图、信息图。适配各平台规格（Amazon、Shopify、TikTok等），提升点击率和转化率。',
    skills: ['ai-product-image', 'a-plus-design', 'infographic-maker', 'platform-spec-adapter'],
    inputSpec: '{ product: Product, style: string, platforms: string[], variations: number }',
    outputSpec: '{ mainImages: Image[], aPlusImages: Image[], infographic: Image, scores: number[] }',
    mcpChannels: ['visual-gen', 'image-generator', 'asset-library'],
    collabWith: ['Z1', 'Z3', 'X2'],
    lanes: ['跨境电商', '国内电商'],
    evolveCondition: '主图点击率提升超过20%',
  },
  {
    no: 19, id: 'Z3', name: '雷水解', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '解，利西南，无所往，其来复吉', duty: 'TikTok/抖音视频剪辑 · 特效包装',
    description: '批量视频剪辑+爆款模板复用+特效字幕包装。掌握短视频平台算法喜好，音乐卡点节奏设计，提升完播率和互动率。',
    skills: ['batch-video-editor', 'viral-template', 'subtitle-effect', 'music-beat-sync'],
    inputSpec: '{ footage: Video[], style: string, targetPlatform: string, duration: number }',
    outputSpec: '{ clips: Video[], estimatedRetention: number, viralScore: number }',
    mcpChannels: ['video-gen', 'visual-gen', 'platform-connector'],
    collabWith: ['K3', 'K5', 'Z4'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: '视频播放量超过100万',
  },
  {
    no: 20, id: 'Z4', name: '雷山小过', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '小过亨利贞，可小事，不可大事', duty: '产品演示视频 · 场景化视频制作',
    description: 'AI数字人+多语言配音+场景化脚本。生成专业产品演示视频，适配B2B展示、官网嵌入、展会大屏等多场景。',
    skills: ['ai-digital-human', 'multi-lang-voiceover', 'scene-script', 'product-demo'],
    inputSpec: '{ product: Product, scenes: Scene[], languages: string[], avatar: string }',
    outputSpec: '{ demoVideo: Video, localizedVersions: Video[], script: Script }',
    mcpChannels: ['video-gen', 'avatar-system', 'multi-lang'],
    collabWith: ['Z3', 'K4', 'X3'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '演示视频转化率超过3%',
  },
  {
    no: 21, id: 'Z5', name: '山天大畜', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '大畜利贞，不家食吉，尚贤也', duty: '竞品视觉监控 · 视觉情报收集',
    description: '视觉爬虫+竞品视觉分析，追踪竞争对手视觉策略。识别视觉差异化机会，发现视觉趋势，保持品牌视觉竞争力。',
    skills: ['visual-crawler', 'competitor-visual', 'trend-visual-analysis', 'differentiation-finder'],
    inputSpec: '{ competitors: string[], platforms: string[], category: string }',
    outputSpec: '{ visualReport: VisualReport[], trends: Trend[], opportunities: string[] }',
    mcpChannels: ['visual-intel', 'competitor-watch', 'llm-analysis'],
    collabWith: ['Z1', 'L1', 'Q2'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '生成20份竞品视觉报告',
  },
  {
    no: 22, id: 'Z6', name: '山泽损', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '损有孚，元吉，无咎可贞', duty: '直播场景设计 · 虚拟主播形象',
    description: 'AI主播形象设计+直播场景构建+实时互动素材生成。打造虚拟主播矩阵，降低真人直播成本，提升直播效率。',
    skills: ['ai-avatar-creator', 'live-scene-designer', 'realtime-material', 'virtual-stream'],
    inputSpec: '{ brand: BrandData, liveStyle: string, duration: number, platform: string }',
    outputSpec: '{ avatar: Avatar, scenes: Scene[], realtimeAssets: Asset[], script: Script }',
    mcpChannels: ['avatar-system', 'live-tools', 'visual-gen'],
    collabWith: ['Z1', 'K3', 'X3'],
    lanes: ['国内电商', '跨境电商'],
    evolveCondition: '虚拟主播GMV超过10万',
  },
  {
    no: 23, id: 'Z7', name: '山火贲', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '贲亨，小利有攸往', duty: '视觉资产库管理 · 跨平台素材适配',
    description: 'DAM数字资产管理+素材版本管理。统一管理所有视觉资产，智能适配各平台尺寸，追踪版权和授权状态。',
    skills: ['dam-manager', 'asset-version-control', 'cross-platform-adapter', 'copyright-tracker'],
    inputSpec: '{ assets: Asset[], platforms: string[], action: "list"|"adapt"|"version"|"license" }',
    outputSpec: '{ adaptedAssets: Asset[], versions: Version[], licenses: License[] }',
    mcpChannels: ['asset-library', 'dam-system', 'compliance-checker'],
    collabWith: ['Z1', 'Z2', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '资产管理1000+资产条目',
  },
  {
    no: 24, id: 'Z8', name: '地雷复', shrimp: '镜画仙姬', palace: '震宫', category: 'visual',
    yaoText: '复亨，出入无疾，朋来无咎', duty: '视觉版权校验 · 合规审查',
    description: '图片查重+版权风险预警+商标侵权检测。确保所有视觉内容符合平台合规要求，避免因侵权导致的Listing下架风险。',
    skills: ['image-dedup', 'copyright-checker', 'trademark-detector', 'platform-compliance'],
    inputSpec: '{ images: Image[], checkType: "copyright"|"trademark"|"all", strictMode: boolean }',
    outputSpec: '{ risks: Risk[], safeImages: Image[], complianceScore: number }',
    mcpChannels: ['compliance-checker', 'visual-intel', 'llm-analysis'],
    collabWith: ['Z7', 'L5', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '检测并规避50+版权风险',
  },

  // ══════════════════════════════════════════════════════
  // 巽宫（25-32）执行卦 · 执行型
  // ══════════════════════════════════════════════════════
  {
    no: 25, id: 'X1', name: '巽为风', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '小亨，利有攸往，利见大人', duty: '多平台账号矩阵管理 · 权限分配',
    description: '统一管理多平台、多账号、多店铺运营矩阵。智能权限分配，风险账号隔离，资产台账实时更新。',
    skills: ['account-matrix-manager', 'permission-alloc', 'account-health-monitor', 'asset-ledger'],
    inputSpec: '{ platforms: string[], accounts: Account[], action: "audit"|"assign"|"monitor" }',
    outputSpec: '{ matrix: AccountMatrix, healthScores: number[], alerts: Alert[] }',
    mcpChannels: ['account-manager', 'alert-system', 'open-space'],
    collabWith: ['X2', 'X3', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '管理账号超过20个无事故',
  },
  {
    no: 26, id: 'X2', name: '风天小畜', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '小畜亨，密云不雨，自我西郊', duty: '多平台批量上架 · RPA执行',
    description: 'RPA自动批量上架+字段智能映射+格式自动转换。一次性同步发布到Amazon、Shopify、TikTok Shop等多平台，大幅提升运营效率。',
    skills: ['rpa-listing', 'field-mapping', 'bulk-operation', 'format-converter'],
    inputSpec: '{ products: Product[], platforms: string[], template: Template }',
    outputSpec: '{ publishedCount: number, errors: Error[], logs: Log[] }',
    mcpChannels: ['rpa-executor', 'platform-connector', 'error-handler'],
    collabWith: ['X1', 'K2', 'Z2'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '单次批量上架超过50个SKU',
  },
  {
    no: 27, id: 'X3', name: '风火家人', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '家人利女贞', duty: '库存同步 · 订单处理自动化',
    description: '平台API深度集成，跨平台库存实时同步，订单处理全自动化。异常告警+智能重试机制，确保履约链路零差错。',
    skills: ['inventory-sync', 'erp-integration', 'order-auto-processor', 'error-recovery'],
    inputSpec: '{ platforms: string[], syncType: "realtime"|"hourly"|"daily", alerts: boolean }',
    outputSpec: '{ syncReport: SyncReport[], pendingOrders: number, errors: Error[] }',
    mcpChannels: ['inventory-manager', 'order-processor', 'alert-system'],
    collabWith: ['X1', 'X4', 'G2'],
    lanes: ['跨境电商', '国内电商'],
    evolveCondition: '连续7天零履约错误',
  },
  {
    no: 28, id: 'X4', name: '风雷益', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '益利有攸往，利涉大川', duty: '多语言翻译质检 · 关键词SEO校验',
    description: '翻译记忆库+质量门禁自动化。关键词SEO校验，确保翻译内容语义精准、SEO友好、术语一致。',
    skills: ['translation-memory', 'quality-gate', 'seo-keyword-check', 'term-consistency'],
    inputSpec: '{ content: string, sourceLang: string, targetLang: string, seoKeywords: string[] }',
    outputSpec: '{ translation: string, qualityScore: number, seoHits: number, suggestions: string[] }',
    mcpChannels: ['translation-engine', 'seo-analyzer', 'llm-content'],
    collabWith: ['X2', 'K2', 'K8'],
    lanes: ['跨境电商', '外贸B2B'],
    evolveCondition: '翻译质检通过率超过95%',
  },
  {
    no: 29, id: 'X5', name: '风泽中孚', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '中孚豚鱼吉，利涉大川', duty: '客服消息自动回复 · 工单分配',
    description: '多语言NLP+意图识别+自动回复生成。7x24小时智能客服，多轮对话解决用户问题，工单精准路由到人工。',
    skills: ['multi-lang-nlp', 'intent-classifier', 'auto-reply-gen', 'ticket-router'],
    inputSpec: '{ messages: Message[], language: string, escalateRules: Rule[], platform: string }',
    outputSpec: '{ responses: Response[], escalatedTickets: number, sentiment: number }',
    mcpChannels: ['nlp-engine', 'crm-connector', 'llm-content'],
    collabWith: ['X1', 'K6', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '客服满意度超过90%',
  },
  {
    no: 30, id: 'X6', name: '风山渐', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '渐之进也，女归吉也', duty: '数据采集 · 竞品数据爬取',
    description: '合法爬虫+数据清洗+自动化采集。建立私有数据仓库，为竞争分析和市场洞察提供实时数据支撑。',
    skills: ['legal-scraper', 'data-cleaner', 'auto-collector', 'data-warehouse'],
    inputSpec: '{ sources: Source[], schedule: string, fields: string[], dedup: boolean }',
    outputSpec: '{ records: Record[], dedupRate: number, qualityScore: number }',
    mcpChannels: ['data-collector', 'llm-analysis', 'open-space'],
    collabWith: ['Q2', 'Q5', 'L1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '采集数据超过10万条',
  },
  {
    no: 31, id: 'X7', name: '风地观', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '观盥而不荐，有孚顒若', duty: 'ClawTip支付执行 · 账单自动结算',
    description: '零钱包自主支付+收支记录+账单结算自动化。支持技能打赏、蜂巢分润、订阅扣费等金融操作，全程可审计。',
    skills: ['clawtip-payment', 'revenue-splitter', 'auto-settlement', 'audit-logger'],
    inputSpec: '{ transaction: Transaction, splitRules: {}, autoApprove: boolean }',
    outputSpec: '{ txHash: string, splitResult: {}, receipt: Receipt }',
    mcpChannels: ['payment-gateway', 'clawtip-system', 'audit-logger'],
    collabWith: ['D1', 'K1', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '处理支付超过1000笔',
  },
  {
    no: 32, id: 'X8', name: '风水涣', shrimp: '记史官', palace: '巽宫', category: 'execute',
    yaoText: '涣亨，王假有庙，利涉大川', duty: '操作日志记录 · 数字永生数据写入',
    description: 'OpenSpace记忆写入+审计追溯+数字永生档案更新。所有操作留痕，经验沉淀为可复用知识，资产永久存档。',
    skills: ['openspace-writer', 'audit-trail', 'knowledge-archiver', 'digital-immortal'],
    inputSpec: '{ action: ActionLog, archiveType: "skill"|"decision"|"pattern", importance: number }',
    outputSpec: '{ entryId: string, confidence: number, relatedEntries: string[] }',
    mcpChannels: ['open-space', 'audit-logger', 'knowledge-graph'],
    collabWith: ['X1', 'D1', 'D2'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '写入知识条目超过500条',
  },

  // ══════════════════════════════════════════════════════
  // 坎宫（33-40）营销卦 · 流量型
  // ══════════════════════════════════════════════════════
  {
    no: 33, id: 'C1', name: '坎为水', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '习坎，有孚维心亨，行有尚', duty: '全渠道营销策略 · 预算分配',
    description: '归因分析+ROI最大化+多渠道协同+预算优化器。制定全渠道营销策略，动态调整预算分配，实现营销ROI最大化。',
    skills: ['attribution-analysis', 'roi-maximizer', 'multi-channel-orch', 'budget-optimizer'],
    inputSpec: '{ channels: Channel[], budget: number, goal: string, historicalData: Data[] }',
    outputSpec: '{ strategy: Strategy, budgetPlan: Budget[], expectedRoi: number }',
    mcpChannels: ['marketing-orch', 'analytics', 'llm-analysis'],
    collabWith: ['C2', 'C3', 'L1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '营销ROI提升超过30%',
  },
  {
    no: 34, id: 'C2', name: '水泽节', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '节亨，苦节不可贞', duty: 'TikTok自然流量 · 短视频种草矩阵',
    description: '病毒内容生成+话题植入+TikTok算法优化+UGC裂变。制造自然流量爆款，构建短视频种草矩阵。',
    skills: ['viral-content-gen', 'hashtag-strategy', 'tiktok-algorithm', 'ugc-viral'],
    inputSpec: '{ product: Product, targetAudience: Persona, viralStyle: string, volume: number }',
    outputSpec: '{ videos: Video[], hashtags: string[], estimatedReach: number, viralScore: number }',
    mcpChannels: ['viral-engine', 'social-intel', 'llm-content'],
    collabWith: ['C1', 'K3', 'K5'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: '单条视频播放量超过500万',
  },
  {
    no: 35, id: 'C3', name: '水雷屯', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '屯元亨利贞，勿用有攸往', duty: 'Google/Meta广告投放 · 精准人群',
    description: '再营销+转化漏斗优化+广告素材生成+A/B测试。精准定向高意向用户，降低CAC，提升广告ROAS。',
    skills: ['retargeting', 'conversion-funnel', 'ad-creative-gen', 'ab-testing'],
    inputSpec: '{ campaign: Campaign, audience: Audience, platforms: string[], budget: number }',
    outputSpec: '{ adSets: AdSet[], estimatedRoi: number, ctr: number, conversionRate: number }',
    mcpChannels: ['ads-platform', 'llm-content', 'ab-testing'],
    collabWith: ['C1', 'K2', 'L1'],
    lanes: ['跨境电商', '外贸B2B'],
    evolveCondition: '广告ROAS超过5',
  },
  {
    no: 36, id: 'C4', name: '水火既济', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '既济亨，小利贞，初吉终乱', duty: '小红书种草 · KOL合作对接',
    description: '博主匹配算法+KOL合作ROI追踪+小红书算法优化。精准匹配品牌调性博主，策划种草内容，跟踪合作ROI。',
    skills: ['koi-matcher', 'kol-roi-tracker', 'xiaohongshu-algorithm', 'seeding-strategy'],
    inputSpec: '{ brand: BrandData, budget: number, targetReach: number, style: string }',
    outputSpec: '{ kolList: KOL[], seedingPlan: Plan[], estimatedEngagement: number }',
    mcpChannels: ['kol-network', 'social-intel', 'llm-content'],
    collabWith: ['C1', 'K3', 'K6'],
    lanes: ['国内电商', '自媒体'],
    evolveCondition: 'KOL合作ROI超过3',
  },
  {
    no: 37, id: 'C5', name: '泽火革', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '革己日乃孚，元亨利贞，悔亡', duty: 'Instagram/Pinterest视觉营销',
    description: '社媒内容日历+视觉内容规划+Pinterest SEO+Ins广告投放。打造视觉营销矩阵，建立视觉搜索流量入口。',
    skills: ['social-calendar', 'visual-planning', 'pinterest-seo', 'ins-ads'],
    inputSpec: '{ brand: BrandData, platforms: string[], goals: Goal[], frequency: string }',
    outputSpec: '{ contentCalendar: Calendar[], pins: Pin[], estimatedReach: number }',
    mcpChannels: ['social-connector', 'visual-gen', 'seo-analyzer'],
    collabWith: ['Z1', 'K1', 'C2'],
    lanes: ['跨境电商', '国内电商', '自媒体'],
    evolveCondition: 'Pinterest月流量超过5万',
  },
  {
    no: 38, id: 'C6', name: '火火同人', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '同人于野，亨，利涉大川', duty: '打赏激励设计 · ClawTip收款触发',
    description: '打赏钩子设计+技能展示页+ClawTip集成。打造让用户愿意付费的技能产品，设计打赏激励层，实现内容变现。',
    skills: ['tip-hook-designer', 'skill-product-page', 'clawtip-integration', 'monetization-strategy'],
    inputSpec: '{ skill: Skill, targetAudience: Persona, pricePoints: number[] }',
    outputSpec: '{ productPage: Page, tipHook: Hook, conversionRate: number, revenueProjection: number }',
    mcpChannels: ['clawtip-system', 'llm-content', 'monetization'],
    collabWith: ['K1', 'X7', 'D1'],
    lanes: ['自媒体'],
    evolveCondition: '单月打赏收入超过1万',
  },
  {
    no: 39, id: 'C7', name: '雷火丰', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '丰亨，王假之，勿忧宜日中', duty: '促销活动设计 · 节日营销日历',
    description: '促销文案生成+转化页构建+节日营销规划。设计限时优惠、满减活动，节日营销日历确保全年营销节点无遗漏。',
    skills: ['promo-copywriter', 'conversion-page', 'holiday-calendar', 'urgency-designer'],
    inputSpec: '{ eventType: "holiday"|"flash"|"membership", product: Product, discount: number }',
    outputSpec: '{ promoCopy: string, landingPage: Page, urgencyElements: string[], estimatedLift: number }',
    mcpChannels: ['content-gen', 'llm-content', 'analytics'],
    collabWith: ['K7', 'C1', 'L1'],
    lanes: ['跨境电商', '国内电商'],
    evolveCondition: '促销转化率提升超过50%',
  },
  {
    no: 40, id: 'C8', name: '地火明夷', shrimp: '营销虾', palace: '坎宫', category: 'marketing',
    yaoText: '明夷利艰贞，明入地中', duty: '黑五大促 · 平台大促冲量作战',
    description: '极速响应+实时调价+大促作战+库存协调。在黑五、网一等大促节点，全链路协调作战，冲刺GMV峰值。',
    skills: ['flash-response', 'real-time-bidding', 'big-sale-war', 'inventory-coordinator'],
    inputSpec: '{ event: BigSaleEvent, inventory: Inventory[], competitors: Comp[], budget: number }',
    outputSpec: '{ battlePlan: BattlePlan, realtimeActions: Action[], expectedGmv: number }',
    mcpChannels: ['battle-mode', 'real-time-analytics', 'inventory-manager'],
    collabWith: ['C1', 'C7', 'X3', 'D1'],
    lanes: ['跨境电商', '国内电商'],
    evolveCondition: '大促GMV超过百万',
  },

  // ══════════════════════════════════════════════════════
  // 离宫（41-48）分析卦 · 分析型
  // ══════════════════════════════════════════════════════
  {
    no: 41, id: 'L1', name: '离为火', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '离利贞亨，畜牝牛吉', duty: '全链路ROI监控仪表盘',
    description: '数据聚合+可视化看板+实时监控+异常告警。构建全链路ROI监控仪表盘，实时感知业务健康度，异常秒级告警。',
    skills: ['data-aggregator', 'dashboard-builder', 'realtime-monitor', 'anomaly-alert'],
    inputSpec: '{ metrics: Metric[], refreshInterval: number, alertChannels: string[] }',
    outputSpec: '{ dashboard: Dashboard, anomalies: Anomaly[], healthScore: number }',
    mcpChannels: ['analytics', 'alert-system', 'open-space'],
    collabWith: ['C1', 'L2', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '监控指标超过50个',
  },
  {
    no: 42, id: 'L2', name: '火风鼎', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '鼎元吉亨', duty: 'Dageno AI可见性监测 · Citation Share',
    description: '跨搜索引擎监测品牌引用追踪、BotSight、Share of Voice分析。在AI搜索时代抢占品牌可见性先机。',
    skills: ['cross-engine-monitor', 'brand-citation-tracker', 'botsight', 'share-of-voice'],
    inputSpec: '{ brand: string, competitors: string[], engines: string[], timeRange: string }',
    outputSpec: '{ citations: Citation[], sovScore: number, botSight: BotSight }',
    mcpChannels: ['seo-intel', 'llm-analysis', 'alert-system'],
    collabWith: ['L1', 'Q1', 'Q5'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '品牌SOV提升超过20%',
  },
  {
    no: 43, id: 'L3', name: '火雷噬嗑', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '噬嗑亨，利用狱', duty: 'Prompt Gap发现 · 竞品Prompt逆向分析',
    description: 'Gap雷达+机会分级+竞品Prompt逆向分析。在用户需求与现有内容之间找到最佳切入点，输出可执行的内容缺口报告。',
    skills: ['gap-radar', 'opportunity-grader', 'competitor-prompt-reverse', 'content-gap-detector'],
    inputSpec: '{ brand: BrandData, competitors: string[], contentTopics: string[], searchData: Data[] }',
    outputSpec: '{ gaps: Gap[], opportunityScore: number[], actionPlan: string[] }',
    mcpChannels: ['llm-analysis', 'seo-intel', 'open-space'],
    collabWith: ['L1', 'Q6', 'K8'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '发现并填补20个内容缺口',
  },
  {
    no: 44, id: 'L4', name: '山火旅', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '旅小事吉', duty: '幻觉修正 · 品牌事实一致性检查',
    description: 'Brand Entity Kit+事实核查+幻觉检测。确保AI生成内容的品牌事实一致性，规避虚假宣传风险，维护品牌信誉。',
    skills: ['brand-entity-kit', 'fact-checker', 'hallucination-detector', 'brand-consistency'],
    inputSpec: '{ content: string, brandFacts: Fact[], strictMode: boolean }',
    outputSpec: '{ hallucinationFlags: Flag[], correctedContent: string, confidence: number }',
    mcpChannels: ['llm-analysis', 'brand-kit', 'compliance-checker'],
    collabWith: ['K1', 'L1', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '幻觉检出率超过99%',
  },
  {
    no: 45, id: 'L5', name: '山水蒙', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '蒙亨，匪我求童蒙，童蒙求我', duty: '舆情危机预警 · 差评根因分析',
    description: '情感分析+危机分级+舆情预警+根因分析。实时监控全网舆情，提前识别危机信号，追溯差评根因。',
    skills: ['sentiment-analyzer', 'crisis-grader', '舆情预警', 'root-cause-analysis'],
    inputSpec: '{ brand: string, sources: string[], alertThreshold: number, language: string }',
    outputSpec: '{ sentiment: number, crises: Crisis[], rootCauses: string[], riskScore: number }',
    mcpChannels: ['sentiment-monitor', 'crisis-alert', 'llm-analysis'],
    collabWith: ['K7', 'Q6', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '危机预警提前超过24小时',
  },
  {
    no: 46, id: 'L6', name: '天火同人', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '同人于野，亨，利涉大川，利君子贞', duty: '合规审查 · 违禁词 · 知识产权',
    description: '法规库+违禁词自动检测+IP侵权扫描。确保内容符合各国法规要求，规避违禁词和知识产权风险。',
    skills: ['regulation-lib', 'prohibited-word-detector', 'ip-infringe-scanner', 'platform-compliance'],
    inputSpec: '{ content: string, regions: string[], checkType: string[], strictMode: boolean }',
    outputSpec: '{ violations: Violation[], riskScore: number, safeContent: string }',
    mcpChannels: ['compliance-checker', 'llm-analysis', 'alert-system'],
    collabWith: ['Z8', 'L4', 'Q8'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '合规审查覆盖20+国家',
  },
  {
    no: 47, id: 'L7', name: '地火明夷', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '明夷于南狩，获其大首，不可疾贞', duty: '周/月复盘报告生成 · 策略迭代',
    description: 'OpenSpace进化+知识提炼+复盘报告+策略迭代建议。自动生成数据驱动的复盘报告，输出可执行的策略优化建议。',
    skills: ['openspace-evolve', 'knowledge-refine', 'report-generator', 'strategy-iter'],
    inputSpec: '{ period: "weekly"|"monthly"|"quarterly", data: Data[], focus: string[] }',
    outputSpec: '{ report: Report, insights: Insight[], nextActions: Action[] }',
    mcpChannels: ['analytics', 'open-space', 'llm-analysis'],
    collabWith: ['L1', 'Q1', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '生成10份高质量复盘报告',
  },
  {
    no: 48, id: 'L8', name: '水火未济', shrimp: '验效掌事', palace: '离宫', category: 'analysis',
    yaoText: '未济亨，小狐汔济，濡其尾，无攸利', duty: '竞品反击策略 · 市场份额收复',
    description: '动态战略调整+竞品反击+市场份额分析+机会收复。在竞品攻击时快速响应，制定反击策略，收复失去的市场份额。',
    skills: ['competitive-response', 'market-share-analyzer', 'opportunity-recovery', 'dynamic-strategy'],
    inputSpec: '{ competitor: Comp, marketData: Data[], ourPosition: Position }',
    outputSpec: '{ responseStrategy: Strategy, recoveryPlan: Plan[], expectedRecovery: number }',
    mcpChannels: ['competitive-intel', 'llm-analysis', 'marketing-orch'],
    collabWith: ['L1', 'C1', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商'],
    evolveCondition: '市场份额收复超过5个百分点',
  },

  // ══════════════════════════════════════════════════════
  // 艮宫（49-56）品牌卦 · 品牌型
  // ══════════════════════════════════════════════════════
  {
    no: 49, id: 'G1', name: '艮为山', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '艮其背不获其身，行其庭不见其人', duty: '系统架构设计 · 模块化部署',
    description: '容错设计+热插拔+微服务架构。设计可扩展、高可用的系统架构，确保虾群在任意节点故障时仍能正常运转。',
    skills: ['fault-tolerant-design', 'hot-swap', 'microservice-arch', 'module-deploy'],
    inputSpec: '{ scale: "small"|"medium"|"large", modules: string[], constraints: Constraint[] }',
    outputSpec: '{ architecture: Arch, deploymentPlan: Plan[], faultToleranceScore: number }',
    mcpChannels: ['infra-manager', 'monitoring', 'alert-system'],
    collabWith: ['G2', 'G3', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '系统可用性超过99.9%',
  },
  {
    no: 50, id: 'G2', name: '山风蛊', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '蛊元亨利涉大川，先甲三日后甲三日', duty: 'Heartbeat监控 · 故障自动检测',
    description: '心跳协议+告警路由+故障检测+健康检查。实时监控64个卦位智能体的存活状态，确保虾群健康运转。',
    skills: ['heartbeat-protocol', 'alert-router', 'fault-detector', 'health-checker'],
    inputSpec: '{ agents: string[], checkInterval: number, alertChannels: string[] }',
    outputSpec: '{ healthReport: HealthReport, downAgents: string[], alerts: Alert[] }',
    mcpChannels: ['heartbeat', 'alert-system', 'infra-manager'],
    collabWith: ['G1', 'G3', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '连续30天零漏报',
  },
  {
    no: 51, id: 'G3', name: '山天大畜', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '大畜利贞，不家食吉，尚贤也', duty: '自愈脚本执行 · 自动重启恢复',
    description: '幂等设计+状态恢复+自动重启+故障隔离。检测到故障时自动执行自愈脚本，确保系统自我修复能力。',
    skills: ['idempotent-design', 'state-recovery', 'auto-restart', 'fault-isolation'],
    inputSpec: '{ faultType: string, agentId: string, recoveryPlan: Plan }',
    outputSpec: '{ recoveryResult: Result, newState: State, logs: Log[] }',
    mcpChannels: ['self-healing', 'heartbeat', 'alert-system'],
    collabWith: ['G2', 'G4', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '自愈成功率超过95%',
  },
  {
    no: 52, id: 'G4', name: '山泽损', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '损有孚，元吉，无咎可贞', duty: 'API限流 · 资源配额管理',
    description: '熔断降级+配额控制+限流算法+成本优化。保护系统不被突发流量冲垮，智能配额管理确保资源公平分配。',
    skills: ['circuit-breaker', 'quota-controller', 'rate-limiter', 'cost-optimizer'],
    inputSpec: '{ api: string, quotas: Quota[], strategy: "strict"|"adaptive"|"fair" }',
    outputSpec: '{ rateLimitConfig: Config, currentUsage: Usage[], costSavings: number }',
    mcpChannels: ['rate-limiter', 'quota-manager', 'cost-optimizer'],
    collabWith: ['G3', 'G5', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: 'API成本降低超过30%',
  },
  {
    no: 53, id: 'G5', name: '山火贲', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '贲亨，小利有攸往', duty: '数据备份 · 灾备恢复演练',
    description: '增量备份+RTO/RPO规划+灾备演练+数据恢复。确保业务数据零丢失，制定并演练灾备预案。',
    skills: ['incremental-backup', 'rto-rpo', 'disaster-rehearsal', 'data-recovery'],
    inputSpec: '{ dataSources: string[], backupFrequency: string, testMode: boolean }',
    outputSpec: '{ backupStatus: Status, rtoAchieved: number, rpoAchieved: number }',
    mcpChannels: ['backup-system', 'disaster-recovery', 'audit-logger'],
    collabWith: ['G4', 'G6', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '完成5次无预警灾备演练',
  },
  {
    no: 54, id: 'G6', name: '山雷颐', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '颐贞吉，观颐，自求口实', duty: '安全审计 · 渗透测试',
    description: '漏洞扫描+威胁建模+安全审计+权限审查。定期进行安全扫描和渗透测试，确保系统安全无漏洞。',
    skills: ['vulnerability-scan', 'threat-modeling', 'security-audit', 'permission-review'],
    inputSpec: '{ scope: "full"|"partial", target: string[], testType: string[] }',
    outputSpec: '{ vulnerabilities: Vuln[], severity: string[], patchPlan: string[] }',
    mcpChannels: ['security-scanner', 'compliance-checker', 'alert-system'],
    collabWith: ['G5', 'G7', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '漏洞修复率超过98%',
  },
  {
    no: 55, id: 'G7', name: '山泽谦', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '谦谦君子，卑以自牧，吉', duty: '性能优化 · 成本控制',
    description: '资源画像+成本分析+性能优化+成本削减。持续分析系统性能瓶颈和成本结构，输出优化建议并自动执行。',
    skills: ['resource-profiler', 'cost-analyzer', 'perf-optimizer', 'cost-reducer'],
    inputSpec: '{ focus: "perf"|"cost"|"both", threshold: number }',
    outputSpec: '{ optimizations: Opt[], costSavings: number, perfImprovement: number }',
    mcpChannels: ['perf-monitor', 'cost-optimizer', 'llm-analysis'],
    collabWith: ['G6', 'G8', 'D1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '成本降低超过20%',
  },
  {
    no: 56, id: 'G8', name: '山地剥', shrimp: '技术虾', palace: '艮宫', category: 'brand',
    yaoText: '剥床以肤，凶', duty: '下一代架构规划 · 技术预研',
    description: '前沿技术追踪+技术储备+架构规划+AI集成预研。持续研究新技术，确保系统始终保持技术领先。',
    skills: ['tech-tracker', 'tech-reserve', 'arch-planner', 'ai-integration-researcher'],
    inputSpec: '{ researchAreas: string[], horizon: "1yr"|"3yr"|"5yr", focus: string }',
    outputSpec: '{ techRoadmap: Roadmap[], experiments: Exp[], recommendations: string[] }',
    mcpChannels: ['research-lab', 'llm-analysis', 'open-space'],
    collabWith: ['G7', 'D1', 'Q1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '预研技术落地3项',
  },

  // ══════════════════════════════════════════════════════
  // 兑宫（57-64）总控卦 · 协调型
  // ══════════════════════════════════════════════════════
  {
    no: 57, id: 'D1', name: '兑为泽', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '兑亨利贞', duty: '蜂巢协作调度 · 任务分派',
    description: '动态路由+优先级队列+任务分派+蜂巢协调。总控分身是虾群的神经中枢，负责将复杂任务拆解并协调分配给最优卦位。',
    skills: ['dynamic-router', 'priority-queue', 'task-dispatcher', 'honeycomb-coordinator'],
    inputSpec: '{ task: Task, constraints: Constraint[], preferPalace?: string }',
    outputSpec: '{ assignedAgent: string, subTasks: SubTask[], coordinationPlan: Plan }',
    mcpChannels: ['task-orch', 'honeycomb', 'open-space', 'llm-analysis'],
    collabWith: ['D2', 'D3', 'D4', 'Q1', 'K1', 'Z1', 'X1', 'C1', 'L1', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '任务调度准确率超过99%',
  },
  {
    no: 58, id: 'D2', name: '泽水困', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '困亨，贞大人吉，无咎，有言不信', duty: '虾群内部冲突仲裁 · 资源协调',
    description: '博弈分析+共识机制+冲突仲裁+资源协调。当多虾争夺同一资源或任务冲突时，总控分身介入仲裁，维持蜂巢秩序。',
    skills: ['game-theory', 'consensus-mechanism', 'conflict-arbitrator', 'resource-coordinator'],
    inputSpec: '{ conflictType: string, agents: string[], resources: Resource[], urgency: number }',
    outputSpec: '{ resolution: Resolution, resourcePlan: Plan[], agentStates: State[] }',
    mcpChannels: ['honeycomb', 'conflict-resolver', 'llm-analysis'],
    collabWith: ['D1', 'D3', 'X8'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '冲突解决满意度超过95%',
  },
  {
    no: 59, id: 'D3', name: '泽地萃', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '萃亨，王假有庙，利见大人，享神', duty: '用户沟通界面 · 指令解析',
    description: '自然语言理解+意图路由+指令解析+多轮对话。作为用户与虾群的唯一沟通界面，将自然语言指令精准路由到对应宫位。',
    skills: ['nlu', 'intent-router', 'instruction-parser', 'multi-turn-dialogue'],
    inputSpec: '{ userInput: string, context: Context, history: Message[] }',
    outputSpec: '{ intent: Intent, entities: Entity[], routingPlan: Plan, response: string }',
    mcpChannels: ['nlu-engine', 'task-orch', 'llm-analysis'],
    collabWith: ['D1', 'D4', 'Q1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '指令解析准确率超过95%',
  },
  {
    no: 60, id: 'D4', name: '泽山咸', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '咸亨利贞，取女吉', duty: '外部API对接 · 第三方服务集成',
    description: 'OpenAPI适配+协议转换+第三方集成+Webhook处理。统一管理所有外部集成，确保新服务快速接入蜂巢体系。',
    skills: ['openapi-adapter', 'protocol-converter', 'webhook-handler', 'third-party-integrator'],
    inputSpec: '{ service: Service, protocol: string, auth: Auth, events: string[] }',
    outputSpec: '{ integrationStatus: Status, endpoints: Endpoint[], webhookConfig: Config }',
    mcpChannels: ['integration-hub', 'webhook-handler', 'llm-analysis'],
    collabWith: ['D1', 'D3', 'G1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '集成服务超过20个',
  },
  {
    no: 61, id: 'D5', name: '雷山小过', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '小过亨利贞，可小事，不可大事', duty: '商务谈判支持 · 合同条款分析',
    description: '条款审查+风险提示+谈判策略+合同分析。在B2B商务谈判中提供智能辅助，识别合同风险，提供谈判话术。',
    skills: ['contract-analyzer', 'risk-detector', 'negotiation-strategist', 'clause-checker'],
    inputSpec: '{ document: Contract, negotiationPhase: string, counterpart: string }',
    outputSpec: '{ riskFlags: Risk[], negotiationPlan: Plan[], counterProposals: string[] }',
    mcpChannels: ['legal-assistant', 'llm-analysis', 'risk-alert'],
    collabWith: ['D1', 'Q8', 'L6'],
    lanes: ['外贸B2B'],
    evolveCondition: '合同风险识别超过10项',
  },
  {
    no: 62, id: 'D6', name: '雷泽归妹', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '归妹天地之大义，天地不交而万物不兴', duty: '长期战略规划 · 里程碑管理',
    description: '路线图可视化+目标追踪+里程碑管理+战略规划。将宏观战略分解为可执行里程碑，持续追踪执行进度。',
    skills: ['roadmap-visualizer', 'goal-tracker', 'milestone-manager', 'strategy-planner'],
    inputSpec: '{ vision: string, timeline: string, milestones: Milestone[], stakeholders: string[] }',
    outputSpec: '{ roadmap: Roadmap, trackingPlan: Plan[], riskFactors: string[] }',
    mcpChannels: ['strategy-orch', 'llm-analysis', 'open-space'],
    collabWith: ['D1', 'Q1', 'C1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '里程碑按时完成率超过90%',
  },
  {
    no: 63, id: 'D7', name: '火泽睽', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '睽小事吉，畜臣妾吉，不可大事', duty: '数字永生写入 · 决策路径归档',
    description: 'Brand Facts+知识图谱+决策归档+数字永生。记录每个关键决策的背景、选项和结果，构建可追溯的品牌数字资产。',
    skills: ['brand-facts-writer', 'knowledge-graph', 'decision-archiver', 'digital-immortal'],
    inputSpec: '{ decision: Decision, context: Context, alternatives: string[], chosen: string }',
    outputSpec: '{ entry: DigitalEntry, knowledgeGraph: Graph, immortalityScore: number }',
    mcpChannels: ['knowledge-graph', 'digital-immortal', 'open-space'],
    collabWith: ['D1', 'X8', 'K1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '数字永生档案超过100条',
  },
  {
    no: 64, id: 'D8', name: '水泽节', shrimp: '总控分身', palace: '兑宫', category: 'orchestrate',
    yaoText: '节亨，苦节不可贞，其道穷也', duty: '系统整体健康评估 · 进化方向决策',
    description: '全面审计+战略复盘+健康评估+进化决策。定期评估虾群整体健康状况，决定下一步进化方向，确保蜂巢持续向更优状态演进。',
    skills: ['system-auditor', 'strategy-reviewer', 'health-evaluator', 'evolution-decider'],
    inputSpec: '{ reviewType: "daily"|"weekly"|"monthly", focus: string[], stakeholders: string[] }',
    outputSpec: '{ healthReport: Report, evolutionPlan: Plan[], recommendations: string[] }',
    mcpChannels: ['system-orch', 'llm-analysis', 'open-space', 'honeycomb'],
    collabWith: ['D1', 'G2', 'L1', 'Q1'],
    lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    evolveCondition: '系统健康度持续提升',
  },
];

// ══════════════════════════════════════════════════════════
// 宫位元数据
// ══════════════════════════════════════════════════════════
export const PALACE_META: Record<string, {
  name: string; emoji: string; role: string;
  color: string; bg: string; border: string;
  description: string;
}> = {
  '乾宫': { name: '乾宫·天', emoji: '⚔️', role: '探微军师', color: 'text-red-400',
    bg: 'from-red-950/40 to-red-900/20', border: 'border-red-500/40',
    description: '情报收集、趋势洞察、市场研究' },
  '坤宫': { name: '坤宫·地', emoji: '📝', role: '文案女史', color: 'text-amber-400',
    bg: 'from-amber-950/40 to-amber-900/20', border: 'border-amber-500/40',
    description: '文案创作、脚本生成、知识整理' },
  '震宫': { name: '震宫·雷', emoji: '🎨', role: '镜画仙姬', color: 'text-purple-400',
    bg: 'from-purple-950/40 to-purple-900/20', border: 'border-purple-500/40',
    description: '图片/视频生成、视觉一致性' },
  '巽宫': { name: '巽宫·风', emoji: '⚙️', role: '记史官', color: 'text-emerald-400',
    bg: 'from-emerald-950/40 to-emerald-900/20', border: 'border-emerald-500/40',
    description: '浏览器操作、平台上架、RPA执行' },
  '坎宫': { name: '坎宫·水', emoji: '🚀', role: '营销虾', color: 'text-blue-400',
    bg: 'from-blue-950/40 to-blue-900/20', border: 'border-blue-500/40',
    description: '社媒发布、广告优化、流量分发' },
  '离宫': { name: '离宫·火', emoji: '📊', role: '验效掌事', color: 'text-orange-400',
    bg: 'from-orange-950/40 to-orange-900/20', border: 'border-orange-500/40',
    description: '数据分析、效果复盘、风险预警' },
  '艮宫': { name: '艮宫·山', emoji: '🏔️', role: '技术虾', color: 'text-gray-300',
    bg: 'from-gray-900/40 to-gray-800/20', border: 'border-gray-500/40',
    description: '系统架构、品牌资产、长期稳定' },
  '兑宫': { name: '兑宫·泽', emoji: '🦞', role: '总控分身', color: 'text-cyan-400',
    bg: 'from-cyan-950/40 to-cyan-900/20', border: 'border-cyan-500/40',
    description: '任务路由、虾群协作、自愈进化' },
};

// 按宫位分组
export function getHexagramsByPalace(palace: string): HexagramDetail[] {
  return HEXAGRAM_64.filter(h => h.palace === palace);
}

// 获取单卦详情
export function getHexagram(id: string): HexagramDetail | undefined {
  return HEXAGRAM_64.find(h => h.id === id);
}

// 获取协作链路
export function getCollabChain(ids: string[]): HexagramDetail[] {
  return ids.map(id => getHexagram(id)).filter(Boolean) as HexagramDetail[];
}
