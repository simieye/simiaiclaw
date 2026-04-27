/**
 * SIMIAICLAW 龙虾集群太极64卦系统
 * CLI 命令行工具
 * 
 * 用法:
 *   npx tsx src/cli/index.ts status
 *   npx tsx src/cli/index.ts execute "跨境选品上架"
 *   npx tsx src/cli/index.ts heartbeat
 *   npx tsx src/cli/index.ts knowledge search "选品"
 */

import { orchestrator } from '../orchestrator';
import { heartbeatMonitor } from '../heartbeat';
import { openSpace } from '../openspace';
import { clawTip } from '../clawtip';
import { ALL_HEXAGRAM_AGENTS, AGENTS_BY_PALACE } from '../agents/registry';
import { Palace } from '../types';

const args = process.argv.slice(2);
const command = args[0] || 'help';

async function main() {
  console.log('\n🦞 SIMIAICLAW 龙虾集群太极64卦系统\n');
  console.log('─'.repeat(60));

  switch (command) {
    case 'status': {
      const status = orchestrator.getSystemStatus();
      console.log('📊 系统状态报告');
      console.log(`   时间: ${status.timestamp}`);
      console.log(`   智能体总数: ${status.agents.total}`);
      status.agents.byPalace.forEach(p => {
        console.log(`   ${p.palace.padEnd(6)}: ${p.count}卦`);
      });
      console.log('\n📋 任务统计:');
      console.log(`   总计: ${status.tasks.total} | 待处理: ${status.tasks.pending} | 运行中: ${status.tasks.running} | 完成: ${status.tasks.completed} | 失败: ${status.tasks.failed}`);
      console.log('\n🧠 OpenSpace:');
      console.log(`   知识条目: ${status.openspace.total}`);
      Object.entries(status.openspace.byType || {}).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
      console.log('\n💰 ClawTip:');
      const cs = status.clawtip;
      console.log(`   总交易: ${cs.total} | 完成: ${cs.completed} | 待审批: ${cs.pending}`);
      console.log(`   总流水: ¥${cs.revenue?.toLocaleString() || 0}`);
      break;
    }

    case 'execute': {
      const cmd = args.slice(1).join(' ') || args[1];
      if (!cmd) {
        console.log('用法: cli execute <指令>');
        console.log('示例: cli execute "跨境选品上架"');
        break;
      }
      console.log(`🎯 执行指令: ${cmd}`);
      const result = await orchestrator.executeBuiltin(cmd);
      console.log(result.message);
      if (result.data) console.log(JSON.stringify(result.data, null, 2));
      break;
    }

    case 'heartbeat': {
      const report = heartbeatMonitor.generateHealthReport();
      console.log('💓 Heartbeat 健康报告');
      console.log(`   系统状态: ${report.overallStatus}`);
      console.log(`   在线智能体: ${report.activeAgents}`);
      const palaceHealth = heartbeatMonitor.getHealthByPalace();
      Object.entries(palaceHealth).forEach(([palace, h]) => {
        const pct = h.total > 0 ? Math.round(h.up / h.total * 100) : 0;
        const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
        console.log(`   ${palace.padEnd(6)} [${bar}] ${pct}% (${h.up}/${h.total})`);
      });
      const alerts = heartbeatMonitor.getRecentAlerts(5);
      if (alerts.length > 0) {
        console.log('\n⚠️  最近告警:');
        alerts.forEach(a => console.log(`   [${a.level}] ${a.agentId}: ${a.message}`));
      }
      break;
    }

    case 'knowledge':
    case 'openspace': {
      const sub = args[1];
      if (sub === 'stats') {
        console.log('📚 OpenSpace 知识库统计');
        const stats = openSpace.getStats();
        console.log(`总条目: ${stats.total}`);
        console.log('按类型:', JSON.stringify(stats.byType, null, 2));
        console.log('按赛道:', JSON.stringify(stats.byLane, null, 2));
      } else if (sub === 'search') {
        const query = args.slice(2).join(' ');
        const results = openSpace.search(query);
        console.log(`🔍 搜索「${query}」: ${results.length} 条结果`);
        results.forEach(r => console.log(`  - [${r.type}] ${r.title} (置信度: ${r.confidence})`));
      } else {
        console.log('用法: cli knowledge stats|search <关键词>');
      }
      break;
    }

    case 'clawtip': {
      const stats = clawTip.getStats();
      console.log('💰 ClawTip 支付统计');
      console.log(`总交易: ${stats.total} | 完成: ${stats.completed} | 待审批: ${stats.pending}`);
      console.log(`总流水: ¥${stats.revenue?.toLocaleString() || 0}`);
      console.log('各智能体余额:', JSON.stringify(stats.balances, null, 2));
      break;
    }

    case 'agents': {
      const palaceArg = args[1] as Palace | undefined;
      const agents = palaceArg ? AGENTS_BY_PALACE[palaceArg] : ALL_HEXAGRAM_AGENTS;
      console.log(`🦐 智能体列表${palaceArg ? ` (${palaceArg})` : ' (全部)'}: ${agents.length}个`);
      if (palaceArg) {
        AGENTS_BY_PALACE[palaceArg]?.forEach(a => {
          console.log(`  ${a.id} ${a.name} - ${a.description}`);
          console.log(`    状态: ${a.status} | 技能: ${a.skills.length} | 已完成任务: ${a.stats.tasksCompleted}`);
          console.log(`    能力: ${a.capabilities.join(' | ')}`);
        });
      } else {
        Object.values(Palace).forEach(p => {
          const list = AGENTS_BY_PALACE[p];
          console.log(`\n  【${p}】${list.length}卦`);
          list.slice(0, 3).forEach(a => {
            console.log(`    ${a.id} ${a.name} - ${a.description}`);
          });
          if (list.length > 3) console.log(`    ... 另有${list.length - 3}卦`);
        });
      }
      break;
    }

    case 'help':
    default: {
      console.log('🦞 SIMIAICLAW 龙虾集群太极64卦系统 CLI\n');
      console.log('可用命令:');
      console.log('  status       查看系统完整状态');
      console.log('  execute <指令>  执行任务指令');
      console.log('  heartbeat    查看心跳健康报告');
      console.log('  knowledge    查看知识库统计');
      console.log('  knowledge search <词>  搜索知识');
      console.log('  clawtip      查看支付统计');
      console.log('  agents       查看所有智能体');
      console.log('  agents <宫名> 查看指定宫位智能体');
      console.log('\n快捷指令示例:');
      console.log('  execute "跨境选品上架"');
      console.log('  execute "外贸GEO可见性"');
      console.log('  execute "国内短视频"');
      console.log('  execute "自媒体爆款"');
      console.log('  execute "Prompt Gap"');
    }
  }
  console.log('─'.repeat(60) + '\n');
}

main().catch(console.error);
