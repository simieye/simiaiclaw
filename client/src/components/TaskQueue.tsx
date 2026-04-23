/**
 * 任务队列看板
 */
import React from 'react';

interface TaskStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

interface Props {
  tasks: TaskStats;
}

export function TaskQueue({ tasks }: Props) {
  const items = [
    { label: '总计', value: tasks.total, color: 'text-white', bg: 'bg-slate-700' },
    { label: '待处理', value: tasks.pending, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    { label: '运行中', value: tasks.running, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { label: '已完成', value: tasks.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
    { label: '失败', value: tasks.failed, color: 'text-red-400', bg: 'bg-red-500/20' },
  ];

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-medium text-slate-400 mb-3">📋 任务队列</h3>
      <div className="grid grid-cols-5 gap-2">
        {items.map(item => (
          <div key={item.label} className={`${item.bg} rounded-lg p-3 text-center`}>
            <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
            <div className="text-xs text-slate-500 mt-1">{item.label}</div>
          </div>
        ))}
      </div>
      {/* 进度条 */}
      {tasks.total > 0 && (
        <div className="mt-3">
          <div className="flex h-2 overflow-hidden rounded-full bg-slate-700">
            {tasks.completed > 0 && (
              <div className="bg-emerald-500" style={{ width: `${(tasks.completed / tasks.total) * 100}%` }} />
            )}
            {tasks.running > 0 && (
              <div className="bg-blue-500" style={{ width: `${(tasks.running / tasks.total) * 100}%` }} />
            )}
            {tasks.pending > 0 && (
              <div className="bg-yellow-500" style={{ width: `${(tasks.pending / tasks.total) * 100}%` }} />
            )}
            {tasks.failed > 0 && (
              <div className="bg-red-500" style={{ width: `${(tasks.failed / tasks.total) * 100}%` }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
