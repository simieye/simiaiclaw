/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * 总控分身 Orchestrator — 兑宫核心
 * 
 * 职责：
 * 1. 接收用户自然语言指令，解析意图
 * 2. 将任务路由到对应宫位（八卦路由）
 * 3. 协调多宫协作（蜂巢协作）
 * 4. 任务执行与状态跟踪
 * 5. 调用 OpenSpace + ClawTip + Heartbeat 三大模块
 */

import { v4 as uuidv4 } from 'uuid';
import { Task, TaskType, AgentStatus, TaskStatus, TaskPriority, Palace, Lane } from '../types';
import { ALL_HEXAGRAM_AGENTS, AGENTS_BY_PALACE, getAgent, getAvailableAgents } from '../agents/registry';
import { openSpace, skillEvolver } from '../openspace';
import { clawTip } from '../clawtip';
import { heartbeatMonitor } from '../heartbeat';
import { llmClient } from '../llm';

// ============================================================
// 指令解析器
// ============================================================
interface ParsedIntent {
  intent: string;
  palace: Palace;
  lane: Lane;
  priority: TaskPriority;
  raw: string;
}

/** 内置指令映射表 */
const BUILTIN_INTENTS: Record<string, Partial<ParsedIntent>> = {
  '跨境选品上架': { intent: '跨境电商选品上架闭环', palace: Palace.QIAN, lane: '跨境电商', priority: TaskPriority.HIGH },
  '外贸GEO可见性': { intent: '外贸B2B GEO可见性提升', palace: Palace.LI, lane: '外贸B2B', priority: TaskPriority.MEDIUM },
  '国内短视频': { intent: '国内电商短视频流量闭环', palace: Palace.KAN, lane: '国内电商', priority: TaskPriority.HIGH },
  '自媒体爆款': { intent: '自媒体爆款内容+打赏进化', palace: Palace.KUN, lane: '自媒体', priority: TaskPriority.MEDIUM },
  'Prompt Gap': { intent: 'Prompt Gap发现与修复', palace: Palace.LI, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  '技能变现': { intent: '技能变现与ClawTip收款', palace: Palace.XUN, lane: '自媒体', priority: TaskPriority.LOW },
  '蜂巢永生': { intent: '蜂巢协作+数字永生储备', palace: Palace.DUI, lane: '跨境电商', priority: TaskPriority.LOW },
  '选品': { intent: '选品分析', palace: Palace.QIAN, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  '内容': { intent: '内容生成', palace: Palace.KUN, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  '视觉': { intent: '视觉制作', palace: Palace.ZHEN, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  '上架': { intent: '批量上架', palace: Palace.XUN, lane: '跨境电商', priority: TaskPriority.HIGH },
  '推广': { intent: '营销推广', palace: Palace.KAN, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  '复盘': { intent: 'ROI复盘', palace: Palace.LI, lane: '跨境电商', priority: TaskPriority.MEDIUM },
  'healthcheck': { intent: '系统健康检查', palace: Palace.GEN, lane: '跨境电商', priority: TaskPriority.LOW },
  '状态': { intent: '查看状态', palace: Palace.GEN, lane: '跨境电商', priority: TaskPriority.LOW },
};

// ============================================================
// 任务管理器
// ============================================================
class TaskManager {
  private tasks = new Map<string, Task>();
  private queue: string[] = []; // 优先级队列（taskId 列表）

  create(params: {
    title: string; description: string; type: TaskType;
    palace: Palace; lane: Lane; priority?: TaskPriority; input?: Record<string, unknown>;
  }): Task {
    const task: Task = {
      id: uuidv4(), title: params.title, description: params.description,
      type: params.type, palace: params.palace, lane: params.lane,
      priority: params.priority || TaskPriority.MEDIUM,
      status: TaskStatus.PENDING, input: params.input || {},
      createdAt: new Date(), retryCount: 0,
    };
    this.tasks.set(task.id, task);
    this.queueTask(task);
    console.log(`[Orchestrator] 📋 任务创建: ${task.id} - ${task.title} (优先级: ${task.priority})`);
    return task;
  }

  private queueTask(task: Task): void {
    // 按优先级插入队列
    const idx = this.queue.findIndex(id => {
      const t = this.tasks.get(id);
      return t && t.priority < task.priority;
    });
    if (idx === -1) this.queue.push(task.id);
    else this.queue.splice(idx, 0, task.id);
  }

  get(id: string): Task | undefined { return this.tasks.get(id); }

  getNextTask(palace?: Palace): Task | undefined {
    for (const id of this.queue) {
      const task = this.tasks.get(id);
      if (task && task.status === TaskStatus.PENDING) {
        if (!palace || task.palace === palace) return task;
      }
    }
    return undefined;
  }

  complete(id: string, output: Record<string, unknown>): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.status = TaskStatus.COMPLETED;
    task.output = output;
    task.completedAt = new Date();
    this.queue = this.queue.filter(tid => tid !== id);

    // 触发 OpenSpace 进化
    skillEvolver.evolveFromTask(
      task.assignedTo || 'unknown',
      task.title, task.input, task.output, [task.lane]
    );
    console.log(`[Orchestrator] ✅ 任务完成: ${task.id} - ${task.title}`);
  }

  fail(id: string, error: string): void {
    const task = this.tasks.get(id);
    if (!task) return;
    task.retryCount++;
    if (task.retryCount >= 3) {
      task.status = TaskStatus.FAILED;
      task.error = error;
      this.queue = this.queue.filter(tid => tid !== id);
    }
    console.error(`[Orchestrator] ❌ 任务失败: ${task.id} - ${error} (重试: ${task.retryCount}/3)`);
  }

  getStats() {
    const tasks = Array.from(this.tasks.values());
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      running: tasks.filter(t => t.status === TaskStatus.RUNNING).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
    };
  }
}

// ============================================================
// 总控分身 Orchestrator
// ============================================================
export class Orchestrator {
  private taskManager = new TaskManager();

  constructor() {
    console.log('[Orchestrator] 🦞 SIMIAICLAW 龙虾集群太极64卦系统 — 总控分身启动');
    console.log(`[Orchestrator] 注册了 ${ALL_HEXAGRAM_AGENTS.length} 个智能体`);
  }

  /** 解析用户指令 */
  parseIntent(userInput: string): ParsedIntent {
    const lower = userInput.toLowerCase();

    // 精确匹配
    for (const [keyword, config] of Object.entries(BUILTIN_INTENTS)) {
      if (lower.includes(keyword.toLowerCase())) {
        return {
          intent: config.intent || keyword,
          palace: config.palace || Palace.QIAN,
          lane: config.lane || '跨境电商',
          priority: config.priority || TaskPriority.MEDIUM,
          raw: userInput,
        };
      }
    }

    // 宫位关键词推断
    const palaceKeywords: Record<string, Palace> = {
      '研究': Palace.QIAN, '选品': Palace.QIAN, '趋势': Palace.QIAN, '战略': Palace.QIAN,
      '内容': Palace.KUN, '文案': Palace.KUN, '写作': Palace.KUN, '文章': Palace.KUN,
      '视觉': Palace.ZHEN, '图片': Palace.ZHEN, '视频': Palace.ZHEN, '设计': Palace.ZHEN,
      '上架': Palace.XUN, '执行': Palace.XUN, '自动化': Palace.XUN, '运营': Palace.XUN,
      '营销': Palace.KAN, '推广': Palace.KAN, '广告': Palace.KAN, '流量': Palace.KAN,
      '分析': Palace.LI, '复盘': Palace.LI, '监控': Palace.LI, 'ROI': Palace.LI,
      '技术': Palace.GEN, '系统': Palace.GEN, '部署': Palace.GEN,
      '协调': Palace.DUI, '总控': Palace.DUI, '协作': Palace.DUI, '永生': Palace.DUI,
    };

    for (const [keyword, palace] of Object.entries(palaceKeywords)) {
      if (lower.includes(keyword)) {
        return { intent: userInput, palace, lane: '跨境电商', priority: TaskPriority.MEDIUM, raw: userInput };
      }
    }

    // 默认：总控分身处理
    return { intent: userInput, palace: Palace.DUI, lane: '跨境电商', priority: TaskPriority.MEDIUM, raw: userInput };
  }

  /** 执行完整任务闭环（核心编排方法）*/
  async executeFullLoop(params: {
    title: string; description: string; lane: Lane; palace: Palace;
    priority?: TaskPriority; input?: Record<string, unknown>;
  }): Promise<{ taskId: string; assignedAgent: string; status: string }> {
    const { palace, lane, title, description, priority, input } = params;

    // Step 1: 路由到对应宫位
    console.log(`[Orchestrator] 🧭 路由任务「${title}」→ ${palace}`);

    // Step 2: 查找空闲智能体
    const available = getAvailableAgents(palace);
    if (available.length === 0) {
      throw new Error(`${palace}所有智能体均忙碌，请稍后重试`);
    }

    // Step 3: 分配任务（Round-robin: 选择完成任务最少的）
    const agent = available.sort((a, b) => a.stats.tasksCompleted - b.stats.tasksCompleted)[0];

    // Step 4: 创建任务
    const taskTypeMap: Record<Palace, TaskType> = {
      [Palace.QIAN]: 'research', [Palace.KUN]: 'content', [Palace.ZHEN]: 'visual',
      [Palace.XUN]: 'execute', [Palace.KAN]: 'marketing', [Palace.LI]: 'analysis',
      [Palace.GEN]: 'infra', [Palace.DUI]: 'orchestrate',
    };

    const task = this.taskManager.create({
      title, description, type: taskTypeMap[palace],
      palace, lane, priority: priority || TaskPriority.MEDIUM, input,
    });

    // Step 5: 模拟任务执行
    agent.status = AgentStatus.WORKING;
    agent.lastActive = new Date();
    task.assignedTo = agent.id;
    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date();

    // 模拟AI执行（实际接入LLM时替换此部分）
    const output = await this.simulateAgentExecution(agent.id, palace, title, lane);

    // Step 6: 完成任务
    this.taskManager.complete(task.id, output);
    agent.status = AgentStatus.IDLE;
    agent.stats.tasksCompleted++;
    agent.lastActive = new Date();

    // Step 7: 协调后续宫位（如需要）
    await this.coordinateSubsequentPalaces(palace, task.id, output, lane);

    return { taskId: task.id, assignedAgent: `${agent.role}·${agent.id}`, status: 'completed' };
  }

  /** 真实 LLM 智能体执行 */
  private async simulateAgentExecution(
    agentId: string, palace: Palace, title: string, lane: Lane
  ): Promise<Record<string, unknown>> {
    const agent = getAgent(agentId);

    console.log(`[Orchestrator] 🧠 调用 LLM: ${agent?.name || agentId} (${palace})`);

    try {
      // 调用统一 LLM 客户端（自动路由 Claude → OpenAI → 模拟）
      const response = await llmClient.complete({
        agentId,
        palace,
        task: title,
        context: {
          lane,
          agentName: agent?.name,
          agentRole: agent?.role,
          timestamp: new Date().toISOString(),
        },
      });

      console.log(`[Orchestrator] ✅ LLM 响应 (${response.model}, ${response.latencyMs}ms, ${response.usage.totalTokens} tokens)`);

      return {
        result: response.content,
        llmMeta: {
          model: response.model,
          provider: response.provider,
          latencyMs: response.latencyMs,
          tokens: response.usage.totalTokens,
          costUSD: response.usage.totalTokens / 1_000_000 * 10, // approximate
        },
        agentName: agent?.name || agentId,
        palace,
      };
    } catch (error) {
      console.error(`[Orchestrator] ❌ LLM 调用失败:`, error);
      // 降级到内建响应
      return {
        result: `【${palace}】${agentId} 执行「${title}」时 LLM 调用失败，使用内建响应。`,
        error: String(error),
        agentName: agent?.name || agentId,
        palace,
      };
    }
  }

  /** 协调后续宫位 */
  private async coordinateSubsequentPalaces(
    completedPalace: Palace, taskId: string, output: Record<string, unknown>, lane: Lane
  ): Promise<void> {
    // 典型工作流：乾宫选品 → 坤宫文案 → 震宫视觉 → 巽宫上架 → 坎宫推广 → 离宫监控
    const workflows: Record<string, Palace[]> = {
      [Palace.QIAN]: [Palace.KUN],          // 选品 → 内容
      [Palace.KUN]: [Palace.ZHEN],           // 文案 → 视觉
      [Palace.ZHEN]: [Palace.XUN],          // 视觉 → 上架
      [Palace.XUN]: [Palace.KAN],           // 上架 → 推广
      [Palace.KAN]: [Palace.LI],            // 推广 → 复盘
    };

    const nextPalaces = workflows[completedPalace];
    if (!nextPalaces || !nextPalaces.length) return;

    console.log(`[Orchestrator] 🔗 触发后续宫位: ${nextPalaces.join(' → ')}`);

    // 自动创建后续任务（实际场景可改为人工确认）
    for (const palace of nextPalaces) {
      this.taskManager.create({
        title: `自动触发: ${palace}后续任务`,
        description: `由${completedPalace}完成后自动生成`,
        type: 'orchestrate',
        palace, lane,
        priority: TaskPriority.LOW,
        input: { upstreamTaskId: taskId, upstreamOutput: output },
      });
    }
  }

  /** 执行内置指令 */
  async executeBuiltin(command: string, lane?: Lane): Promise<{ success: boolean; message: string; data?: unknown }> {
    const intent = this.parseIntent(command);
    const targetLane = lane || intent.lane;

    try {
      const result = await this.executeFullLoop({
        title: intent.intent,
        description: intent.raw,
        palace: intent.palace,
        lane: targetLane,
        priority: intent.priority,
      });
      return { success: true, message: `✅ 「${intent.intent}」执行完成`, data: result };
    } catch (e) {
      return { success: false, message: `❌ 执行失败: ${e}` };
    }
  }

  /** 获取系统完整状态 */
  getSystemStatus() {
    return {
      timestamp: new Date().toISOString(),
      agents: {
        total: ALL_HEXAGRAM_AGENTS.length,
        byPalace: Object.values(Palace).map(p => ({
          palace: p, count: AGENTS_BY_PALACE[p]?.length || 0,
        })),
      },
      tasks: this.taskManager.getStats(),
      heartbeat: {
        nodeCount: heartbeatMonitor.nodeCount,
        healthByPalace: heartbeatMonitor.getHealthByPalace(),
      },
      openspace: openSpace.getStats(),
      clawtip: clawTip.getStats(),
      llm: {
        simulateMode: llmClient.isSimulating(),
        ...llmClient.getStats(),
      },
      payments: undefined, // 由主入口补充
    };
  }
}

// 导出单例
export const orchestrator = new Orchestrator();
