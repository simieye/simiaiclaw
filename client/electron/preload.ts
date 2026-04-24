/**
 * Electron 预加载脚本 — 安全桥接主进程与渲染进程
 * 支持 macOS / Windows / Linux
 */
import { contextBridge, ipcRenderer } from 'electron';

// ── 平台信息 ────────────────────────────────────────────────
contextBridge.exposeInMainWorld('electronPlatform', process.platform);
contextBridge.exposeInMainWorld('electronAPI', {
  // 完整平台信息（async，兼容 main.ts 新增 IPC）
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getVersion: () => require('electron').app.getVersion(),
  // 窗口控制
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-isMaximized'),
  // 事件监听
  onMaximizeChange: (cb: (isMaximized: boolean) => void) => {
    ipcRenderer.on('maximize-change', (_e, val) => cb(val));
  },
  // 剪贴板
  copyToClipboard: (text: string) => ipcRenderer.invoke('clipboard-write', text),
  // 打开外部链接
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),
  // Linux 专用：在文件管理器中显示
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath),
  // 系统信息
  getOSVersion: () => ipcRenderer.invoke('get-os-version'),
});
