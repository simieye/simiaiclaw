/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * Skill 类型定义
 */

export type SkillSource = 'official' | 'community' | 'custom';
export type SkillCategory = 'developer' | 'productivity' | 'creative' | 'business' | 'ai' | 'integration';

export interface SkillReview {
  userId: string;
  userName: string;
  rating: number;       // 1-5
  comment: string;
  createdAt: string;
}

export interface Skill {
  id: string;
  name: string;                    // 技能名称，如 "12306 Train Assistant"
  description: string;              // 简短描述
  longDescription?: string;        // 详细说明
  source: SkillSource;             // 来源
  category: SkillCategory;
  author?: {                        // 自定义/社区技能有作者
    userId: string;
    displayName: string;
    avatar?: string;
  };
  tags: string[];
  icon?: string;                    // emoji 或图标
  instructions?: string;           // skill prompt 文本（自定义skill）
  scriptPath?: string;              // 脚本路径（自定义skill）
  installCount: number;            // 安装次数
  rating: number;                   // 平均评分 1-5
  reviewCount: number;
  reviews: SkillReview[];
  rewardPool: number;              // 打赏池金额 (clawtip积分)
  rewardCount: number;              // 打赏次数
  isInstalled: boolean;            // 当前租户是否已安装
  isFeatured: boolean;             // 官方推荐
  createdAt: string;
  updatedAt: string;
  officialHubUrl?: string;          // 官方 hub 链接
}

export interface SkillInstall {
  skillId: string;
  tenantId: string;
  installedAt: string;
  enabled: boolean;
}

/** SkillHub 技能安装记录 */
export interface SkillHubInstall {
  slug: string;           // SkillHub 技能标识
  targetAgent: string;    // 安装目标 agent (claude, cursor, etc.)
  targetType: string;     // 'agent' | 'workflow' | 'hexagram'
  hexagramId?: string;    // 关联的64卦节点（如果有）
  installedAt: string;
  source: 'skillhub';
}

/** SkillHub 技能搜索结果 */
export interface SkillHubSkill {
  id: string;
  slug: string;
  name: string;
  description: string;
  author?: string;
  stars?: number;
  rating?: number;
  category?: string;
  tags?: string[];
  icon?: string;
  installCommand?: string;
  previewUrl?: string;
}

export interface CustomAgent {
  id: string;
  tenantId: string;
  userId: string;
  name: string;                    // Agent 名称
  description: string;             // 描述
  systemPrompt: string;            // 系统提示词
  instructions?: string;           // 附加指令
  skills: string[];               // 关联的 skill id
  icon?: string;
  color?: string;                  // UI 颜色
  isActive: boolean;
  stats: {
    totalChats: number;
    totalMessages: number;
    createdAt: string;
    lastUsed?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillInput {
  name: string;
  description: string;
  longDescription?: string;
  category: SkillCategory;
  tags: string[];
  instructions?: string;
  icon?: string;
}

export interface CreateCustomAgentInput {
  name: string;
  description: string;
  systemPrompt?: string;
  instructions?: string;
  skills?: string[];
  icon?: string;
  color?: string;
}
