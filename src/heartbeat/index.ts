/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * Heartbeat 自愈监控模块
 * 
 * 职责：
 * 1. 每5秒对所有64卦智能体发送心跳
 * 2. 连续3次失败 → 自动重启该节点
 * 3. 连续10次失败 → 告警通知人工介入
 * 4. 每日全面健康检查 → 写入数字永生
 */

import { v4 as uuidv4 } from 'uuid';
import { HeartbeatNode, SystemHealthReport, Palace } from '../types';
import { ALL_HEXAGRAM_AGENTS, AGENTS_BY_PALACE } from '../agents/registry';
import { openSpace } from '../openspace';

// ============================================================
// 心跳节点模拟
// ============================================================
class HeartbeatNodeSim {
  palace: Palace;
  agentId: string;
  status: 'up' | 'down' | 'restarting' = 'up';
  lastPing = new Date();
  consecutiveFailures = 0;
  totalRestarts = 0;
  responseTime = Math.random() * 100 + 10; // 模拟响应时间 10-110ms

  constructor(agentId: string, palace: Palace) {
    this.agentId = agentId;
    this.palace = palace;
  }

  ping(): boolean {
    this.lastPing = new Date();
    // 模拟：95% 成功率
    const success = Math.random() > 0.05;
    if (success) {
      this.consecutiveFailures = 0;
      this.status = 'up';
      this.responseTime = Math.random() * 100 + 10;
    } else {
      this.consecutiveFailures++;
      if (this.consecutiveFailures >= 3) {
        this.status = 'down';
      }
    }
    return success;
  }

  toReport(): HeartbeatNode {
    return {
      palace: this.palace,
      agentId: this.agentId,
      status: this.status,
      lastPing: this.lastPing,
      consecutiveFailures: this.consecutiveFailures,
      totalRestarts: this.totalRestarts,
      responseTime: Math.round(this.responseTime),
    };
  }
}

// ============================================================
// Heartbeat 监控器
// ============================================================
export class HeartbeatMonitor {
  private nodes: Map<string, HeartbeatNodeSim> = new Map();
  private interval: ReturnType<typeof setInterval> | null = null;
  private dailyInterval: ReturnType<typeof setInterval> | null = null;
  private alerts: Array<{ palace: Palace; agentId: string; level: 'warning' | 'critical'; message: string; time: Date }> = [];
  
  // 配置
  private readonly FAILURE_THRESHOLD = parseInt(process.env.HEARTBEAT_FAILURE_THRESHOLD || '3');
  private readonly MAX_FAILURES = parseInt(process.env.HEARTBEAT_MAX_FAILURES || '10');
  private readonly CHECK_INTERVAL = parseInt(process.env.HEARTBEAT_INTERVAL_MS || '5000');

  private startTime = Date.now();

  constructor() {
    this.initNodes();
  }

  private initNodes(): void {
    ALL_HEXAGRAM_AGENTS.forEach(agent => {
      const key = `${agent.palace}-${agent.id}`;
      this.nodes.set(key, new HeartbeatNodeSim(agent.id, agent.palace));
    });
    console.log(`[Heartbeat] 初始化了 ${this.nodes.size} 个节点监控`);
  }

  /** 启动监控 */
  start(): void {
    if (this.interval) return;

    console.log(`[Heartbeat] 启动监控，间隔 ${this.CHECK_INTERVAL}ms`);

    // 常规心跳检查
    this.interval = setInterval(() => {
      this.checkAll();
    }, this.CHECK_INTERVAL);

    // 每日全面健康检查
    this.dailyInterval = setInterval(() => {
      this.dailyHealthCheck();
    }, 24 * 60 * 60 * 1000); // 每24小时
  }

  /** 停止监控 */
  stop(): void {
    if (this.interval) { clearInterval(this.interval); this.interval = null; }
    if (this.dailyInterval) { clearInterval(this.dailyInterval); this.dailyInterval = null; }
    console.log('[Heartbeat] 监控已停止');
  }

  /** 对所有节点执行心跳检查 */
  private checkAll(): void {
    const now = new Date();
    this.nodes.forEach((node, key) => {
      const success = node.ping();

      if (!success && node.consecutiveFailures === this.FAILURE_THRESHOLD) {
        this.autoRestart(node);
      }

      if (node.consecutiveFailures >= this.MAX_FAILURES) {
        this.alert(node, 'critical', `节点连续 ${node.consecutiveFailures} 次心跳失败，请立即检查`);
      }
    });
  }

  /** 自动重启故障节点 */
  private autoRestart(node: HeartbeatNodeSim): void {
    node.status = 'restarting';
    console.warn(`[Heartbeat] 🚨 ${node.agentId} 心跳失败 ${this.FAILURE_THRESHOLD} 次，正在重启...`);
    
    setTimeout(() => {
      node.status = 'up';
      node.consecutiveFailures = 0;
      node.totalRestarts++;
      console.log(`[Heartbeat] ✅ ${node.agentId} 重启成功（累计重启 ${node.totalRestarts} 次）`);
    }, 2000 + Math.random() * 3000); // 模拟2-5秒重启
  }

  /** 发送告警 */
  private alert(node: HeartbeatNodeSim, level: 'warning' | 'critical', message: string): void {
    this.alerts.push({ palace: node.palace, agentId: node.agentId, level, message, time: new Date() });
    const emoji = level === 'critical' ? '🔴' : '🟡';
    console.error(`[Heartbeat] ${emoji} [${level.toUpperCase()}] ${node.agentId}: ${message}`);
  }

  /** 每日全面健康检查 */
  private dailyHealthCheck(): void {
    const report = this.generateHealthReport();
    console.log('[Heartbeat] 📊 每日健康报告:', JSON.stringify({
      overallStatus: report.overallStatus,
      activeAgents: report.activeAgents,
      failedAgents: report.failedAgents,
      totalTasks: report.totalTasksCompleted,
    }, null, 2));

    // 写入数字永生档案
    openSpace.add({
      type: 'insight',
      title: `[系统健康] 每日健康报告 ${new Date().toISOString().split('T')[0]}`,
      content: JSON.stringify(report, null, 2),
      sourceAgent: '艮2',
      sourceTask: 'daily-health-check',
      confidence: 1.0,
      tags: ['system-health', 'daily', 'heartbeat'],
      lanes: ['跨境电商', '外贸B2B', '国内电商', '自媒体'],
    });
  }

  /** 生成系统健康报告 */
  generateHealthReport(): SystemHealthReport {
    const nodes = Array.from(this.nodes.values()).map(n => n.toReport());
    const activeAgents = nodes.filter(n => n.status === 'up').length;
    const failedAgents = nodes.filter(n => n.status === 'down').length;

    let overallStatus: SystemHealthReport['overallStatus'] = 'healthy';
    if (failedAgents > 8) overallStatus = 'critical';
    else if (failedAgents > 0) overallStatus = 'degraded';

    return {
      timestamp: new Date(),
      overallStatus,
      uptime: Date.now() - this.startTime,
      totalTasksCompleted: 0, // 由任务管理器填充
      totalRevenue: 0,        // 由ClawTip填充
      activeAgents,
      failedAgents,
      nodes,
      queueDepth: 0,          // 由任务队列填充
      openSpaceSize: openSpace.size,
    };
  }

  /** 获取按宫位分组的健康状态 */
  getHealthByPalace(): Record<Palace, { up: number; down: number; total: number }> {
    const result = {} as Record<Palace, { up: number; down: number; total: number }>;
    Object.values(Palace).forEach(p => result[p] = { up: 0, down: 0, total: 0 });
    
    this.nodes.forEach(node => {
      result[node.palace].total++;
      if (node.status === 'up') result[node.palace].up++;
      else result[node.palace].down++;
    });
    return result;
  }

  /** 获取最近告警 */
  getRecentAlerts(limit = 20): typeof this.alerts {
    return this.alerts.slice(-limit);
  }

  get nodeCount(): number { return this.nodes.size; }
}

// 导出单例
export const heartbeatMonitor = new HeartbeatMonitor();
