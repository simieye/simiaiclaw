/**
 * Zustand 全局状态管理
 */
import { create } from 'zustand';
import type { SystemStatus, HealthReport } from '../api/client';

interface DashboardState {
  status: SystemStatus | null;
  health: HealthReport | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  commandOutput: string;
  isExecuting: boolean;
  activeTab: 'dashboard' | 'payments' | 'agents' | 'logs';
  setStatus: (s: SystemStatus) => void;
  setHealth: (h: HealthReport) => void;
  setLoading: (b: boolean) => void;
  setCommandOutput: (s: string) => void;
  setIsExecuting: (b: boolean) => void;
  setActiveTab: (t: DashboardState['activeTab']) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  status: null,
  health: null,
  isLoading: true,
  lastUpdated: null,
  commandOutput: '',
  isExecuting: false,
  activeTab: 'dashboard',
  setStatus: (s) => set({ status: s, lastUpdated: new Date(), isLoading: false }),
  setHealth: (h) => set({ health: h }),
  setLoading: (b) => set({ isLoading: b }),
  setCommandOutput: (s) => set({ commandOutput: s }),
  setIsExecuting: (b) => set({ isExecuting: b }),
  setActiveTab: (t) => set({ activeTab: t }),
}));
