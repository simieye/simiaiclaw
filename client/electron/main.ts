/**
 * Electron 主进程 — 龙虾集群控制台
 * 支持 macOS / Windows / Linux 桌面应用
 */
import { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain, clipboard, MenuItemConstructorOptions } from 'electron';
import * as path from 'path';

// ── 平台检测常量 ────────────────────────────────────────────────
const isMac   = process.platform === 'darwin';
const isWin   = process.platform === 'win32';
const isLinux = process.platform === 'linux';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const API_URL = process.env.API_URL || 'http://localhost:3000';
const APP_NAME = '🦞 龙虾集群控制台';
const APP_ID   = 'com.simiaiclaw.lobster';

// ── Linux Chrome Sandbox 修复 ───────────────────────────────────
// Linux 上某些无 root 环境需要 --no-sandbox 参数
if (isLinux) {
  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('disable-setuid-sandbox');
}

// ── IPC 处理器 ────────────────────────────────────────────────
function setupIPC() {
  // 平台信息
  ipcMain.handle('get-platform', () => ({
    platform: process.platform,    // 'darwin' | 'win32' | 'linux'
    isMac,
    isWin,
    isLinux,
    isDev,
    arch: process.arch,            // 'x64' | 'arm64' | 'ia32'
    version: app.getVersion(),
    name: APP_NAME,
    appId: APP_ID,
  }));

  ipcMain.handle('window-minimize', () => mainWindow?.minimize());
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window-close', () => mainWindow?.close());
  ipcMain.handle('window-isMaximized', () => mainWindow?.isMaximized());
  ipcMain.handle('clipboard-write', (_e, text: string) => clipboard.writeText(text));
  ipcMain.handle('open-external', (_e, url: string) => shell.openExternal(url));

  // Linux 文件管理器打开（处理桌面入口）
  ipcMain.handle('show-in-folder', (_e, filePath: string) => {
    shell.showItemInFolder(filePath);
  });

  // 系统信息
  ipcMain.handle('get-os-version', () => {
    return isWin ? process.getSystemVersion() : undefined;
  });
}

function createWindow() {
  // Linux 默认窗口大小适配
  const winWidth  = isLinux ? 1280 : 1400;
  const winHeight = isLinux ? 800  : 900;

  mainWindow = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#0a0e1a',
    show: false,
    // Linux 自动隐藏菜单栏（DE 集成）
    ...(isLinux && { autoHideMenuBar: true }),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // 允许 file:// 页面请求 http://localhost（安全由 contextIsolation 保障）
      // Linux arm64 软渲染兼容
      ...(isLinux && process.arch === 'arm64' ? { offscreen: true } : {}),
    },
  });

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/client/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // 最小化到系统托盘（非 macOS）
  mainWindow.on('close', (event) => {
    if (tray && !isMac) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 打开外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  buildMenu();
}

function buildMenu() {
  const template: MenuItemConstructorOptions[] = [
    // ── macOS 专属 Apple 菜单 ──────────────────────────────────
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' as const },
        { type: 'separator' as const },
        { role: 'services' as const },
        { type: 'separator' as const },
        { role: 'hide' as const },
        { role: 'hideOthers' as const },
        { role: 'unhide' as const },
        { type: 'separator' as const },
        { role: 'quit' as const },
      ],
    }] : []),

    // ── 通用文件菜单 ────────────────────────────────────────────
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: '开发者工具',
          accelerator: isMac ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
          click: () => mainWindow?.webContents.toggleDevTools(),
        },
        { type: 'separator' },
        {
          label: '全屏模式',
          accelerator: isMac ? 'Cmd+Ctrl+F' : 'F11',
          click: () => {
            const isFull = mainWindow?.isFullScreen();
            mainWindow?.setFullScreen(!isFull);
          },
        },
        ...(isLinux ? [
          { type: 'separator' as const },
          {
            label: '退出',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              tray?.destroy();
              tray = null;
              app.quit();
            },
          },
        ] : []),
        isMac ? { role: 'close' as const } : { role: 'quit' as const },
      ],
    },

    // ── 编辑菜单 ────────────────────────────────────────────────
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'pasteAndMatchStyle' as const },
          { role: 'delete' as const },
          { role: 'selectAll' as const },
        ] : [
          { role: 'delete' as const },
          { type: 'separator' as const },
          { role: 'selectAll' as const },
        ]),
      ],
    },

    // ── 视图菜单 ────────────────────────────────────────────────
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(isLinux ? [
          { type: 'separator' as const },
          {
            label: '置顶窗口',
            type: 'checkbox' as const,
            checked: false,
            click: (menuItem: Electron.MenuItem) => {
              mainWindow?.setAlwaysOnTop(menuItem.checked);
            },
          },
        ] : []),
      ],
    },

    // ── 窗口菜单 ────────────────────────────────────────────────
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
          { type: 'separator' as const },
          { role: 'window' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },

    // ── 帮助菜单 ────────────────────────────────────────────────
    {
      label: '帮助',
      submenu: [
        {
          label: `关于 ${APP_NAME}`,
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: `关于 ${APP_NAME}`,
              message: '🦞 SIMIAICLAW 龙虾集群太极64卦系统',
              detail: `版本 ${app.getVersion()}\n64个AI智能体 · 八宫协同\nMCP连接器 · 全球大模型市场\n桌面平台: ${process.platform} (${process.arch})`,
            });
          },
        },
        { type: 'separator' },
        {
          label: '打开 API 服务器',
          click: () => shell.openExternal(API_URL),
        },
        ...(isLinux ? [
          { type: 'separator' as const },
          {
            label: '报告问题',
            click: () => shell.openExternal('https://github.com/simiaiclaw/lobster/issues'),
          },
        ] : []),
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  // 创建托盘图标（Base64 透明龙虾图标）
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABdklEQVR4nO2WzUrDQBSFv1tLcWoSXBgZGMSFQhdnPgA3xszDcGIg6BAHBg6cOAQHB8KFiCAiIv4FLo2kTdukLly44IHLn9zknHvOuUkKhUKhUChIDYBeoA8YATqBLdPqP6AOOAUugH1gH1gHNp1uQoVC8QuoqgE3wDewDSwD00CfRdsVCoU2oKoGPANvgVVgBpgAul0tU6FQyEFVDXgCroAZ4N4YoFAoFDoEqwG3wDUwBXw5A4RK5Q+1Y8qXgBfgEpgFzIBpYMSuVKlUfFMrwAXgGbgE5oAxoNuuplAo5KBWgPOA8b/HQqFQaBM6wBngxK5QKBS6ADrAKeDarlAoFLoEOsBJ4MquUCgUugQ6wBHgxq5QKBS6BDrAYeDKrlAoFLoE8oJgCrgHfF1gKfAHmANeO9qEQqFQqFQKBQKhUKhUCgUCoVCofAP8A8Q+0Q4lWzH6gAAAABJRU5ErkJggg=='
  );

  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });

  // 托盘右键菜单（跨平台统一）
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示主窗口',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      },
    },
    ...(isMac ? [{
      label: '进入全屏',
      click: () => mainWindow?.setFullScreen(true),
    }] : []),
    { type: 'separator' },
    {
      label: `版本 ${app.getVersion()}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        tray?.destroy();
        tray = null;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
}

// ── Linux 单实例锁 ─────────────────────────────────────────────
if (isLinux) {
  const gotTheLock = app.requestSingleInstanceLock();
  if (!gotTheLock) app.quit();
}

// ── 应用生命周期 ──────────────────────────────────────────────
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  createTray();

  // macOS dock 点击恢复窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else {
      mainWindow?.show();
      mainWindow?.focus();
    }
  });

  // Linux DE 启动时恢复窗口
  if (isLinux) {
    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
      }
    });
  }
});

// 所有窗口关闭
app.on('window-all-closed', () => {
  if (!isMac) app.quit();
});

app.on('before-quit', () => {
  tray?.destroy();
  tray = null;
});
