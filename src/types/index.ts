/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 核心类型定义
 */

// ==================== 八卦宫位 ====================
export enum Palace {
  QIAN = '乾宫',   // 天 · 头 · 战略研究
  KUN  = '坤宫',   // 地 · 腹 · 内容生成
  ZHEN = '震宫',   // 雷 · 行动 · 视觉视频
  XUN  = '巽宫',   // 风 · 执行 · 上架RPA
  KAN  = '坎宫',   // 水 · 流通 · 营销推广
  LI   = '离宫',   // 火 · 分析 · 监控复盘
  GEN  = '艮宫',   // 山 · 守成 · 基础设施
  DUI  = '兑宫',   // 泽 · 总控 · 协调进化
}

// ==================== 赛道类型 ====================
export type Lane = '跨境电商' | '外贸B2B' | '国内电商' | '自媒体';

// ==================== 智能体状态 ====================
export enum AgentStatus {
  IDLE       = 'idle',       // 空闲待命
  WORKING    = 'working',    // 执行任务中
  EVOLVING   = 'evolving',   // 自我进化中
  ERROR      = 'error',      // 异常状态
  OFFLINE    = 'offline',    // 下线
}

// ==================== 任务优先级 ====================
export enum TaskPriority {
  LOW    = 1,
  MEDIUM = 5,
  HIGH   = 10,
  URGENT = 20,
}

// ==================== 任务状态 ====================
export enum TaskStatus {
  PENDING    = 'pending',
  RUNNING    = 'running',
  COMPLETED  = 'completed',
  FAILED     = 'failed',
  CANCELLED  = 'cancelled',
}

// ==================== 支付状态 ====================
export enum PaymentStatus {
  PENDING    = 'pending',
  PROCESSING = 'processing',
  COMPLETED  = 'completed',
  FAILED     = 'failed',
  REFUNDED   = 'refunded',
}

// ==================== 核心接口定义 ====================

/** 64卦智能体接口 */
export interface HexagramAgent {
  id: string;                 // 唯一标识：乾1、坤2...兑8
  name: string;               // 卦名：潜龙勿用、直方大...
  palace: Palace;              // 所属宫位
  role: string;               // 虾名/角色名
  description: string;        // 职责描述
  capabilities: string[];     // 加载的关键能力
  lanes: Lane[];             // 适配的赛道
  status: AgentStatus;        // 当前状态
  skills: string[];          // 当前掌握技能
  evolutionLevel: number;     // 进化等级
  lastActive: Date;           // 最后活跃时间
  stats: AgentStats;          // 统计数据
}

export interface AgentStats {
  tasksCompleted: number;
  tasksFailed: number;
  avgResponseTime: number;    // ms
  evolutions: number;
  revenue: number;            // ClawTip 变现金额
  tips: number;              // 打赏次数
}

/** 任务接口 */
export interface Task {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  palace: Palace;             // 应由哪个宫处理
  priority: TaskPriority;
  status: TaskStatus;
  lane: Lane;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  assignedTo?: string;        // HexagramAgent.id
  parentTaskId?: string;      // 父任务（用于子任务链）
  retryCount: number;
  error?: string;
}

export type TaskType =
  | 'research'       // 乾宫研究任务
  | 'content'        // 坤宫内容任务
  | 'visual'         // 震宫视觉任务
  | 'execute'        // 巽宫执行任务
  | 'marketing'      // 坎宫营销任务
  | 'analysis'       // 离宫分析任务
  | 'infra'           // 艮宫技术任务
  | 'orchestrate';   // 兑宫协调任务

/** OpenSpace 知识条目 */
export interface KnowledgeEntry {
  id: string;
  type: 'skill' | 'pattern' | 'insight' | 'lesson' | 'brand-fact';
  title: string;
  content: string;
  sourceAgent: string;        // 来源智能体
  sourceTask: string;         // 来源任务
  confidence: number;          // 置信度 0-1
  tags: string[];
  lanes: Lane[];
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  approved: boolean;
}

/** Brand Facts - 品牌数字档案 */
export interface BrandFacts {
  brandName: string;
  coreValues: string[];
  buyerPersonas: BuyerPersona[];
  productAdvantages: string[];
  toneOfVoice: string;
  targetKeywords: string[];
  competitors: string[];
  lastUpdated: Date;
  decisions: DecisionRecord[];
}

export interface BuyerPersona {
  name: string;
  demographics: Record<string, string>;
  painPoints: string[];
  motivations: string[];
  preferredChannels: string[];
}

export interface DecisionRecord {
  id: string;
  timestamp: Date;
  context: string;
  options: string[];
  chosen: string;
  result: string;
  success: boolean;
  agent: string;
  lesson?: string;
}

/** ClawTip 支付记录 */
export interface PaymentRecord {
  id: string;
  type: 'skill' | 'tip' | 'refund' | 'split';
  amount: number;
  currency: string;
  status: PaymentStatus;
  from: string;
  to: string;
  taskId?: string;
  skillId?: string;
  note?: string;
  createdAt: Date;
  confirmedAt?: Date;
}

/** 蜂巢协作协议 */
export interface HoneycombProtocol {
  id: string;
  name: string;
  description: string;
  tasks: string[];            // 参与的任务类型
  splitRules: Record<string, number>; // 各虾分润比例
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
  totalRevenue: number;
}

/** 数字永生档案 */
export interface DigitalImmortal {
  userId: string;
  monthlyReports: MonthlyReport[];
  brandFacts: BrandFacts;
  decisionJournal: DecisionRecord[];
  agentTemplates: AgentTemplate[];
  createdAt: Date;
  lastUpdated: Date;
}

export interface MonthlyReport {
  month: string;               // 2026-04
  summary: string;
  keyDecisions: DecisionRecord[];
  topPerformers: string[];    // 最有效的技能/策略
  evolutions: EvolutionRecord[];
  revenue: number;
  tasksCompleted: number;
}

export interface EvolutionRecord {
  agent: string;
  beforeSkills: string[];
  afterSkills: string[];
  trigger: string;
  timestamp: Date;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  palace: Palace;
  skills: string[];
  usageCount: number;
  effectiveness: number;
}

/** Heartbeat 节点状态 */
export interface HeartbeatNode {
  palace: Palace;
  agentId: string;
  status: 'up' | 'down' | 'restarting';
  lastPing: Date;
  consecutiveFailures: number;
  totalRestarts: number;
  responseTime: number;        // ms
}

/** 系统整体健康报告 */
export interface SystemHealthReport {
  timestamp: Date;
  overallStatus: 'healthy' | 'degraded' | 'critical';
  uptime: number;               // 系统运行时间 ms
  totalTasksCompleted: number;
  totalRevenue: number;
  activeAgents: number;
  failedAgents: number;
  nodes: HeartbeatNode[];
  queueDepth: number;
  openSpaceSize: number;        // 知识条目数
}

// ==================== 多租户认证类型 ====================
export type UserRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  role: UserRole;
  memberCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  tenants: TenantInfo[];
  activeTenant?: TenantInfo;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
