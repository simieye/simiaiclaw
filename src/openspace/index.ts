/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * OpenSpace 知识进化模块
 * 
 * 职责：
 * 1. 任务完成后自动提炼 Skill 存入知识库
 * 2. 全群知识共享（任何虾可以查询其他虾的经验）
 * 3. 告别重复造轮子，新任务自动检索最佳实践
 */

import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import { KnowledgeEntry, Lane } from '../types';

// ============================================================
// OpenSpace 存储
// ============================================================
class OpenSpaceStore {
  private entries: Map<string, KnowledgeEntry> = new Map();
  private dataPath: string;

  constructor(dataDir: string = './data/openspace') {
    this.dataPath = dataDir;
    this.ensureDir();
    this.load();
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  private load(): void {
    const indexPath = path.join(this.dataPath, 'index.json');
    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        data.entries?.forEach((e: KnowledgeEntry) => {
          this.entries.set(e.id, { ...e, createdAt: new Date(e.createdAt), lastUsed: e.lastUsed ? new Date(e.lastUsed) : undefined });
        });
        console.log(`[OpenSpace] 加载了 ${this.entries.size} 条知识条目`);
      } catch (e) {
        console.warn('[OpenSpace] 加载失败，从头开始', e);
      }
    }
  }

  save(): void {
    const indexPath = path.join(this.dataPath, 'index.json');
    const data = { entries: Array.from(this.entries.values()), savedAt: new Date().toISOString() };
    fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
  }

  add(entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'usageCount' | 'approved'>): KnowledgeEntry {
    const fullEntry: KnowledgeEntry = {
      ...entry,
      id: uuidv4(),
      createdAt: new Date(),
      usageCount: 0,
      approved: false, // 待审核
    };
    this.entries.set(fullEntry.id, fullEntry);
    this.save();
    console.log(`[OpenSpace] 新增知识: ${fullEntry.type} - ${fullEntry.title}`);
    return fullEntry;
  }

  get(id: string): KnowledgeEntry | undefined {
    const entry = this.entries.get(id);
    if (entry) {
      entry.lastUsed = new Date();
      entry.usageCount++;
    }
    return entry;
  }

  /** 检索相关知识条目 */
  search(query: string, lanes?: Lane[], type?: KnowledgeEntry['type'], limit = 10): KnowledgeEntry[] {
    const q = query.toLowerCase();
    return Array.from(this.entries.values())
      .filter(e => {
        const textMatch = e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q);
        const laneMatch = !lanes || lanes.length === 0 || e.lanes.some(l => lanes.includes(l));
        const typeMatch = !type || e.type === type;
        return textMatch && laneMatch && typeMatch && e.approved;
      })
      .sort((a, b) => b.usageCount - a.usageCount || b.confidence - a.confidence)
      .slice(0, limit);
  }

  /** 获取某智能体的所有知识 */
  getByAgent(agentId: string): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(e => e.sourceAgent === agentId);
  }

  /** 审批知识条目 */
  approve(id: string): boolean {
    const entry = this.entries.get(id);
    if (entry) { entry.approved = true; this.save(); return true; }
    return false;
  }

  get size(): number { return this.entries.size; }

  /** 获取统计摘要 */
  getStats() {
    const entries = Array.from(this.entries.values());
    const byType = entries.reduce((acc, e) => { acc[e.type] = (acc[e.type] || 0) + 1; return acc; }, {} as Record<string, number>);
    const byLane = entries.reduce((acc, e) => {
      e.lanes.forEach(l => acc[l] = (acc[l] || 0) + 1);
      return acc;
    }, {} as Record<string, number>);
    return { total: entries.length, byType, byLane };
  }
}

// ============================================================
// Skill 进化引擎
// ============================================================
export class SkillEvolver {
  constructor(private store: OpenSpaceStore) {}

  /**
   * 任务完成后自动提炼 Skill
   * 从任务经验中提炼可复用的模式存入 OpenSpace
   */
  async evolveFromTask(
    agentId: string,
    taskTitle: string,
    taskInput: Record<string, unknown>,
    taskOutput: Record<string, unknown>,
    lanes: Lane[]
  ): Promise<KnowledgeEntry[]> {
    const newEntries: KnowledgeEntry[] = [];

    // 1. 提炼技能模式（Skill）
    if (taskOutput && typeof taskOutput === 'object') {
      const skillPattern = this.extractSkillPattern(agentId, taskTitle, taskOutput);
      if (skillPattern) {
        newEntries.push(this.store.add(skillPattern));
      }
    }

    // 2. 提炼洞察（Insight）
    const insight = this.extractInsight(agentId, taskTitle, taskInput, taskOutput);
    if (insight) {
      newEntries.push(this.store.add(insight));
    }

    // 3. 提炼教训（Lesson）
    const lesson = this.extractLesson(agentId, taskTitle, taskOutput);
    if (lesson) {
      newEntries.push(this.store.add(lesson));
    }

    return newEntries;
  }

  private extractSkillPattern(
    agentId: string, title: string, output: Record<string, unknown>
  ): Omit<KnowledgeEntry, 'id' | 'createdAt' | 'usageCount' | 'approved'> | null {
    // 从输出中提取可复用的模式
    const patterns = output.patterns || output.skills || output.templates;
    if (!patterns) return null;

    return {
      type: 'skill',
      title: `[Skill] ${title}`,
      content: JSON.stringify(patterns, null, 2),
      sourceAgent: agentId,
      sourceTask: title,
      confidence: 0.8,
      tags: ['auto-evolved', 'skill'],
      lanes: [],
    };
  }

  private extractInsight(
    agentId: string, title: string,
    input: Record<string, unknown>, output: Record<string, unknown>
  ): Omit<KnowledgeEntry, 'id' | 'createdAt' | 'usageCount' | 'approved'> | null {
    // 生成关键洞察
    const insight = output.insight || output.keyFinding || output.learning;
    if (!insight) return null;

    return {
      type: 'insight',
      title: `[洞察] ${title}`,
      content: String(insight),
      sourceAgent: agentId,
      sourceTask: title,
      confidence: 0.7,
      tags: ['auto-evolved', 'insight'],
      lanes: [],
    };
  }

  private extractLesson(
    agentId: string, title: string, output: Record<string, unknown>
  ): Omit<KnowledgeEntry, 'id' | 'createdAt' | 'usageCount' | 'approved'> | null {
    const lessons = output.lessons || output.lessonsLearned;
    if (!lessons) return null;

    return {
      type: 'lesson',
      title: `[教训] ${title}`,
      content: Array.isArray(lessons) ? lessons.join('\n') : String(lessons),
      sourceAgent: agentId,
      sourceTask: title,
      confidence: 0.6,
      tags: ['auto-evolved', 'lesson'],
      lanes: [],
    };
  }

  /** 评估某智能体是否应该进化 */
  shouldEvolve(stats: { tasksCompleted: number; evolutions: number }): boolean {
    // 每完成10个任务触发一次进化评估
    return stats.tasksCompleted > 0 && stats.tasksCompleted % 10 === 0;
  }
}

// ============================================================
// 导出单例
// ============================================================
export const openSpace = new OpenSpaceStore(
  process.env.OPENSPACE_DATA_DIR || './data/openspace'
);
export const skillEvolver = new SkillEvolver(openSpace);
