/**
 * Electron 预加载脚本 — 安全桥接主进程与渲染进程
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 系统信息
  getPlatform: () => process.platform,
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
});
