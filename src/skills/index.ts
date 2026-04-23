/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * Skill 商店服务
 */

import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import type { Skill, SkillInstall, CustomAgent, CreateSkillInput, CreateCustomAgentInput, SkillReview } from '../types/skill';

// ============================================================
// 数据存储路径
// ============================================================
const DATA_DIR = path.join(process.cwd(), 'data', 'skills');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const INSTALLS_FILE = path.join(DATA_DIR, 'installs.json');
const CUSTOM_AGENTS_FILE = path.join(DATA_DIR, 'custom_agents.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSON<T>(file: string, fallback: T): T {
  ensureDir();
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJSON(file: string, data: unknown) {
  ensureDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// 初始数据：官方 Skill 商店示例
// ============================================================
const OFFICIAL_SKILLS: Omit<Skill, 'isInstalled' | 'reviews'>[] = [
  {
    id: 'skill-pdf',
    name: 'PDF 处理',
    description: '读取、分析、提取 PDF 文件内容，支持表格和图片识别',
    source: 'official',
    category: 'developer',
    tags: ['pdf', '文档', '提取', 'ocr'],
    icon: '📄',
    installCount: 1243,
    rating: 4.7,
    reviewCount: 89,
    rewardPool: 8560,
    rewardCount: 234,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-xlsx',
    name: 'Excel 文件处理',
    description: '创建、读取、分析 Excel 电子表格，支持公式和图表',
    source: 'official',
    category: 'developer',
    tags: ['excel', 'xlsx', 'csv', '表格', '数据分析'],
    icon: '📊',
    installCount: 2108,
    rating: 4.8,
    reviewCount: 156,
    rewardPool: 15200,
    rewardCount: 445,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-ai-drawing',
    name: 'AI 绘图',
    description: '使用 Nano Banana Pro (Gemini 3 Pro Image) 生成和编辑图片',
    source: 'official',
    category: 'creative',
    tags: ['图像', 'ai绘图', '生成', 'midjourney'],
    icon: '🎨',
    installCount: 3567,
    rating: 4.6,
    reviewCount: 312,
    rewardPool: 32000,
    rewardCount: 890,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-12306',
    name: '12306 火车票助手',
    description: '查询余票、经停站、中转换乘、候补查询与提交/取消',
    source: 'official',
    category: 'productivity',
    tags: ['火车票', '12306', '高铁', '余票', '候补'],
    icon: '🚄',
    installCount: 892,
    rating: 4.5,
    reviewCount: 67,
    rewardPool: 4200,
    rewardCount: 156,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-ecommerce',
    name: '电商选品助手',
    description: '跨境电商选品分析、竞品监控、热销趋势发现',
    source: 'official',
    category: 'business',
    tags: ['电商', '选品', '跨境', 'tiktok', '亚马逊'],
    icon: '🛒',
    installCount: 1523,
    rating: 4.4,
    reviewCount: 98,
    rewardPool: 11000,
    rewardCount: 320,
    isFeatured: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-code-review',
    name: '代码审查',
    description: 'AI 驱动的代码审查工具，发现漏洞、优化建议、代码质量评分',
    source: 'official',
    category: 'developer',
    tags: ['代码', '审查', '安全', 'lint', '优化'],
    icon: '🔍',
    installCount: 789,
    rating: 4.6,
    reviewCount: 54,
    rewardPool: 6800,
    rewardCount: 178,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-deepresearch',
    name: 'Deep Research',
    description: '结构化深度研究工作流，支持学术、商业、技术调查',
    source: 'official',
    category: 'ai',
    tags: ['研究', 'ai', '调查', '报告', '学术'],
    icon: '🔬',
    installCount: 634,
    rating: 4.3,
    reviewCount: 41,
    rewardPool: 5500,
    rewardCount: 145,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-figma',
    name: 'Figma 集成',
    description: '从 Figma 文件提取设计数据，下载 UI 图片和组件信息',
    source: 'official',
    category: 'creative',
    tags: ['figma', '设计', 'ui', '组件', '下载'],
    icon: '🎯',
    installCount: 445,
    rating: 4.2,
    reviewCount: 33,
    rewardPool: 3200,
    rewardCount: 98,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-github',
    name: 'GitHub 热门项目',
    description: '追踪 GitHub AI/ML/LLM 热门仓库，生成趋势排行榜',
    source: 'official',
    category: 'ai',
    tags: ['github', 'trending', 'ai', '开源', 'ml'],
    icon: '🐙',
    installCount: 567,
    rating: 4.5,
    reviewCount: 44,
    rewardPool: 4300,
    rewardCount: 112,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'skill-excalidraw',
    name: 'Excalidraw 图表',
    description: '创建 Excalidraw 工作流、架构图、协议图和系统说明图',
    source: 'official',
    category: 'creative',
    tags: ['图表', 'excalidraw', '架构', '流程图', '画图'],
    icon: '✏️',
    installCount: 320,
    rating: 4.1,
    reviewCount: 28,
    rewardPool: 2100,
    rewardCount: 67,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// ============================================================
// 服务类
// ============================================================
class SkillService {
  // ── Skills CRUD ───────────────────────────────────────────

  /** 获取所有 Skills（含安装状态） */
  getAllSkills(tenantId: string, filters?: { source?: string; category?: string; search?: string }): Skill[] {
    const baseSkills: Skill[] = readJSON<Skill[]>(SKILLS_FILE, []);
    const installs: SkillInstall[] = readJSON<SkillInstall[]>(INSTALLS_FILE, []);

    const installedIds = new Set(
      installs.filter(i => i.tenantId === tenantId && i.enabled).map(i => i.skillId)
    );

    // 合并官方 + 自定义/社区
    const officialMap = new Map(OFFICIAL_SKILLS.map(s => [s.id, s]));
    const allSkills = [
      ...OFFICIAL_SKILLS.map(s => ({ ...s, isInstalled: installedIds.has(s.id), reviews: [] as SkillReview[] })),
      ...baseSkills.filter(s => !officialMap.has(s.id)).map(s => ({
        ...s,
        isInstalled: installedIds.has(s.id),
      })),
    ] as Skill[];

    let result = allSkills;

    if (filters?.source) {
      result = result.filter(s => s.source === filters.source);
    }
    if (filters?.category) {
      result = result.filter(s => s.category === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }

    return result;
  }

  /** 获取单个 Skill */
  getSkill(skillId: string, tenantId: string): Skill | null {
    const skills = this.getAllSkills(tenantId);
    return skills.find(s => s.id === skillId) || null;
  }

  /** 创建自定义 Skill（需认证） */
  createSkill(userId: string, userName: string, input: CreateSkillInput): Skill {
    const skills: Skill[] = readJSON<Skill[]>(SKILLS_FILE, []);
    const newSkill: Skill = {
      id: `skill-custom-${uuid().slice(0, 8)}`,
      name: input.name,
      description: input.description,
      longDescription: input.longDescription,
      source: 'custom',
      category: input.category,
      author: { userId, displayName: userName },
      tags: input.tags,
      icon: input.icon || '🔧',
      instructions: input.instructions,
      installCount: 0,
      rating: 0,
      reviewCount: 0,
      reviews: [],
      rewardPool: 0,
      rewardCount: 0,
      isInstalled: false,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    skills.push(newSkill);
    writeJSON(SKILLS_FILE, skills);
    return newSkill;
  }

  /** 安装 Skill */
  installSkill(skillId: string, tenantId: string): boolean {
    const installs: SkillInstall[] = readJSON<SkillInstall[]>(INSTALLS_FILE, []);
    const existing = installs.findIndex(i => i.skillId === skillId && i.tenantId === tenantId);
    if (existing >= 0) {
      installs[existing].enabled = true;
    } else {
      installs.push({ skillId, tenantId, installedAt: new Date().toISOString(), enabled: true });
    }
    writeJSON(INSTALLS_FILE, installs);
    return true;
  }

  /** 卸载 Skill */
  uninstallSkill(skillId: string, tenantId: string): boolean {
    const installs: SkillInstall[] = readJSON<SkillInstall[]>(INSTALLS_FILE, []);
    const idx = installs.findIndex(i => i.skillId === skillId && i.tenantId === tenantId);
    if (idx >= 0) {
      installs.splice(idx, 1);
      writeJSON(INSTALLS_FILE, installs);
    }
    return true;
  }

  /** 获取已安装的 Skills */
  getInstalledSkills(tenantId: string): Skill[] {
    return this.getAllSkills(tenantId).filter(s => s.isInstalled);
  }

  /** 保存 SkillHub 安装记录 */
  saveInstalledSkill(tenantId: string, record: import('../types/skill').SkillHubInstall): void {
    const file = path.join(DATA_DIR, 'skillhub_installs.json');
    const installs: import('../types/skill').SkillHubInstall[] = readJSON(file, []);
    const existing = installs.findIndex(i => i.slug === record.slug && i.targetAgent === record.targetAgent);
    if (existing >= 0) {
      installs[existing] = record;
    } else {
      installs.push(record);
    }
    writeJSON(file, installs);
  }

  /** 获取 SkillHub 已安装技能 */
  getSkillHubInstalls(tenantId: string): import('../types/skill').SkillHubInstall[] {
    const file = path.join(DATA_DIR, 'skillhub_installs.json');
    return readJSON<import('../types/skill').SkillHubInstall[]>(file, []);
  }

  /** 打赏 Skill */
  rewardSkill(skillId: string, tenantId: string, amount: number): boolean {
    const skills: Skill[] = readJSON<Skill[]>(SKILLS_FILE, []);
    const officialIdx = OFFICIAL_SKILLS.findIndex(s => s.id === skillId);
    let target: Skill | null = null;

    if (officialIdx >= 0) {
      // 更新官方技能统计数据
      OFFICIAL_SKILLS[officialIdx].rewardCount += 1;
      target = { ...OFFICIAL_SKILLS[officialIdx], rewardPool: (OFFICIAL_SKILLS[officialIdx].rewardPool || 0) + amount } as Skill;
    } else {
      const customIdx = skills.findIndex(s => s.id === skillId);
      if (customIdx >= 0) {
        skills[customIdx].rewardCount += 1;
        skills[customIdx].rewardPool = (skills[customIdx].rewardPool || 0) + amount;
        writeJSON(SKILLS_FILE, skills);
        target = skills[customIdx];
      }
    }

    // 记录打赏到全局池
    const rewards: { skillId: string; tenantId: string; amount: number; createdAt: string }[] =
      readJSON(path.join(DATA_DIR, 'rewards.json'), []);
    rewards.push({ skillId, tenantId, amount, createdAt: new Date().toISOString() });
    writeJSON(path.join(DATA_DIR, 'rewards.json'), rewards);

    return true;
  }

  /** 获取已安装的 Custom Agents */
  getCustomAgents(tenantId: string): CustomAgent[] {
    const agents: CustomAgent[] = readJSON<CustomAgent[]>(CUSTOM_AGENTS_FILE, []);
    return agents.filter(a => a.tenantId === tenantId && a.isActive);
  }

  /** 创建自定义 Agent */
  createCustomAgent(tenantId: string, userId: string, input: CreateCustomAgentInput): CustomAgent {
    const agents: CustomAgent[] = readJSON<CustomAgent[]>(CUSTOM_AGENTS_FILE, []);
    const agent: CustomAgent = {
      id: `agent-${uuid().slice(0, 8)}`,
      tenantId,
      userId,
      name: input.name,
      description: input.description,
      systemPrompt: input.systemPrompt || `你是一个 ${input.name}，${input.description}`,
      instructions: input.instructions,
      skills: input.skills || [],
      icon: input.icon || '🤖',
      color: input.color || '#6366f1',
      isActive: true,
      stats: {
        totalChats: 0,
        totalMessages: 0,
        createdAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    agents.push(agent);
    writeJSON(CUSTOM_AGENTS_FILE, agents);
    return agent;
  }

  /** 从自然语言创建 Agent（AI 解析） */
  createAgentFromNaturalLanguage(tenantId: string, userId: string, naturalLanguage: string): CustomAgent {
    // 简单的规则解析（后续可接入 LLM 做更智能的解析）
    const ql = naturalLanguage.toLowerCase();

    let name = '自定义助手';
    let description = '由自然语言创建';
    let category: 'ai' | 'business' | 'creative' | 'productivity' | 'developer' | 'integration' = 'ai';
    let icon = '🤖';

    // 关键词匹配
    if (ql.includes('选品') || ql.includes('电商') || ql.includes('跨境')) {
      name = '选品分析助手'; description = '专注跨境电商选品研究、热销趋势发现'; category = 'business'; icon = '🛒';
    } else if (ql.includes('文案') || ql.includes('内容') || ql.includes('写作')) {
      name = '内容创作助手'; description = '社交媒体文案、品牌故事、视频脚本创作'; category = 'creative'; icon = '✍️';
    } else if (ql.includes('数据') || ql.includes('分析') || ql.includes('报告')) {
      name = '数据分析助手'; description = '商业数据洞察、报告生成、趋势分析'; category = 'business'; icon = '📊';
    } else if (ql.includes('代码') || ql.includes('开发') || ql.includes('编程')) {
      name = '代码开发助手'; description = '代码生成、审查、优化和技术问题解答'; category = 'developer'; icon = '💻';
    } else if (ql.includes('设计') || ql.includes('ui') || ql.includes('figma')) {
      name = '设计协作助手'; description = 'UI 设计协作、Figma 组件提取、设计系统维护'; category = 'creative'; icon = '🎨';
    } else if (ql.includes('营销') || ql.includes('推广') || ql.includes('广告')) {
      name = '营销策划助手'; description = '全渠道营销策略、广告投放优化、增长黑客'; category = 'business'; icon = '📣';
    } else if (ql.includes('客服') || ql.includes('售后')) {
      name = '智能客服助手'; description = '自动回复客户咨询、FAQ 生成、情感分析'; category = 'productivity'; icon = '💬';
    } else if (ql.includes('翻译') || ql.includes('多语言')) {
      name = '翻译专家助手'; description = '多语言精准翻译、本地化建议、文化适配'; category = 'productivity'; icon = '🌐';
    } else if (naturalLanguage.length > 3) {
      // 通用提取：用前20字符作为名字
      name = naturalLanguage.slice(0, 15).trim();
      description = `执行: ${naturalLanguage}`;
    }

    return this.createCustomAgent(tenantId, userId, {
      name, description,
      instructions: `用户原始需求: "${naturalLanguage}"\n请根据上述需求提供专业帮助。`,
      icon,
    });
  }

  /** 更新自定义 Agent */
  updateCustomAgent(agentId: string, tenantId: string, updates: Partial<CustomAgent>): CustomAgent | null {
    const agents: CustomAgent[] = readJSON<CustomAgent[]>(CUSTOM_AGENTS_FILE, []);
    const idx = agents.findIndex(a => a.id === agentId && a.tenantId === tenantId);
    if (idx < 0) return null;
    agents[idx] = { ...agents[idx], ...updates, updatedAt: new Date().toISOString() };
    writeJSON(CUSTOM_AGENTS_FILE, agents);
    return agents[idx];
  }

  /** 删除自定义 Agent */
  deleteCustomAgent(agentId: string, tenantId: string): boolean {
    const agents: CustomAgent[] = readJSON<CustomAgent[]>(CUSTOM_AGENTS_FILE, []);
    const idx = agents.findIndex(a => a.id === agentId && a.tenantId === tenantId);
    if (idx < 0) return false;
    agents[idx].isActive = false;
    writeJSON(CUSTOM_AGENTS_FILE, agents);
    return true;
  }
}

export const skillService = new SkillService();
