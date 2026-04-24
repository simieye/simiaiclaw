/**
 * 跨平台检测工具
 * 在 Electron 渲染进程 / Web 浏览器中均可使用
 */
export interface PlatformInfo {
  /** 'electron' | 'web' | 'capacitor' */
  runtime: 'electron' | 'web' | 'capacitor';
  /** 'darwin' | 'win32' | 'linux' */
  platform: string;
  isMac: boolean;
  isWin: boolean;
  isLinux: boolean;
  /** 是否为 Linux 桌面环境（排除服务器） */
  isLinuxDesktop: boolean;
  isElectron: boolean;
  isCapacitor: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  isDev: boolean;
  arch: string;
  version: string;
  name: string;
  appId: string;
}

declare global {
  interface Window {
    electronAPI?: {
      getPlatform: () => Promise<PlatformInfo>;
      [key: string]: (...args: unknown[]) => unknown;
    };
    electronPlatform?: string;
  }
}

/** 跨平台平台信息获取（自动适配 Electron / Capacitor / Web） */
export async function getPlatformInfo(): Promise<PlatformInfo> {
  // ── Electron 环境 ──────────────────────────────────────────
  if (window.electronAPI?.getPlatform) {
    try {
      const info = await window.electronAPI.getPlatform();
      return {
        ...info,
        runtime: 'electron' as const,
        isElectron: true,
        isCapacitor: false,
        isMobile: false,
        isDesktop: true,
      };
    } catch {
      // 降级到 Web
    }
  }

  // ── Capacitor 环境 ──────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Cap = (window as any).Capacitor;
  if (Cap?.isNativeAvailable?.()) {
    const plat = Cap.getPlatform?.();
    return {
      runtime: 'capacitor',
      platform: plat === 'ios' ? 'darwin' : plat === 'android' ? 'linux' : 'unknown',
      isMac: plat === 'ios',
      isWin: false,
      isLinux: plat === 'android',
      isLinuxDesktop: false,
      isElectron: false,
      isCapacitor: true,
      isMobile: true,
      isDesktop: false,
      isDev: false,
      arch: 'arm64',
      version: Cap.getVersion?.() || '',
      name: '龙虾集群',
      appId: 'com.simiaiclaw.lobster',
    };
  }

  // ── Web 浏览器环境 ─────────────────────────────────────────
  const ua = navigator.userAgent.toLowerCase();
  const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  const isWin = /windows|win32/i.test(navigator.userAgent);
  const isLinux = /linux/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
  const isMobile = /android|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent);

  return {
    runtime: 'web',
    platform: isMac ? 'darwin' : isWin ? 'win32' : isLinux ? 'linux' : 'unknown',
    isMac,
    isWin,
    isLinux,
    isLinuxDesktop: isLinux,
    isElectron: false,
    isCapacitor: false,
    isMobile,
    isDesktop: !isMobile,
    isDev: import.meta.env?.DEV === true || import.meta.env?.MODE === 'development',
    arch: '',
    version: '',
    name: '',
    appId: '',
  };
}

/** 同步版本（Web 环境快速判断，Electron 需调用 async getPlatformInfo） */
export function getPlatformSync(): PlatformInfo {
  if (typeof window === 'undefined') {
    return getDefaultPlatform();
  }

  // Electron 同步路径（通过 window.electronPlatform 已知平台）
  if (window.electronPlatform) {
    const p = window.electronPlatform;
    return {
      runtime: 'electron',
      platform: p,
      isMac: p === 'darwin',
      isWin: p === 'win32',
      isLinux: p === 'linux',
      isLinuxDesktop: p === 'linux',
      isElectron: true,
      isCapacitor: false,
      isMobile: false,
      isDesktop: true,
      isDev: false,
      arch: '',
      version: '',
      name: '',
      appId: '',
    };
  }

  // Web 同步
  const isMac = /macintosh|mac os x/i.test(navigator.userAgent);
  const isWin = /windows|win32/i.test(navigator.userAgent);
  const isLinux = /linux/i.test(navigator.userAgent) && !/android/i.test(navigator.userAgent);
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);

  return {
    runtime: 'web',
    platform: isMac ? 'darwin' : isWin ? 'win32' : isLinux ? 'linux' : 'unknown',
    isMac,
    isWin,
    isLinux,
    isLinuxDesktop: isLinux,
    isElectron: false,
    isCapacitor: false,
    isMobile,
    isDesktop: !isMobile,
    isDev: import.meta.env?.DEV === true || import.meta.env?.MODE === 'development',
    arch: '',
    version: '',
    name: '',
    appId: '',
  };
}

function getDefaultPlatform(): PlatformInfo {
  return {
    runtime: 'web',
    platform: 'unknown',
    isMac: false,
    isWin: false,
    isLinux: false,
    isLinuxDesktop: false,
    isElectron: false,
    isCapacitor: false,
    isMobile: false,
    isDesktop: true,
    isDev: false,
    arch: '',
    version: '',
    name: '',
    appId: '',
  };
}

/** 平台特定工具函数 */
export const is = {
  mac:   () => getPlatformSync().isMac,
  win:   () => getPlatformSync().isWin,
  linux: () => getPlatformSync().isLinux,
  mobile: () => getPlatformSync().isMobile,
  desktop: () => getPlatformSync().isDesktop,
  electron: () => getPlatformSync().isElectron,
  capacitor: () => getPlatformSync().isCapacitor,
  dev:   () => getPlatformSync().isDev,
};
