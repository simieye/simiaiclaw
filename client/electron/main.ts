/**
 * Electron 主进程 — 龙虾集群控制台
 * 支持 macOS / Windows / Linux 桌面应用
 */
import { app, BrowserWindow, Menu, Tray, nativeImage, shell, ipcMain, clipboard } from 'electron';
import * as path from 'path';

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

const API_URL = process.env.API_URL || 'http://localhost:3000';
const APP_NAME = '🦞 龙虾集群控制台';

// ── IPC 处理器 ────────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('window-minimize', () => mainWindow?.minimize());
  ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window-close', () => mainWindow?.close());
  ipcMain.handle('window-isMaximized', () => mainWindow?.isMaximized());
  ipcMain.handle('clipboard-write', (_e, text: string) => clipboard.writeText(text));
  ipcMain.handle('open-external', (_e, url: string) => shell.openExternal(url));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: APP_NAME,
    backgroundColor: '#0a0e1a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
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

  // 最小化到系统托盘
  mainWindow.on('close', (event) => {
    if (tray) {
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
  const isMac = process.platform === 'darwin';
  const template: Electron.MenuItemConstructorOptions[] = [
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
    {
      label: '文件',
      submenu: [
        {
          label: '刷新',
          accelerator: 'CmdOrCtrl+R',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: '全屏',
          accelerator: isMac ? 'CmdOrCtrl+F' : 'F11',
          click: () => {
            const isFull = mainWindow?.isFullScreen();
            mainWindow?.setFullScreen(!isFull);
          },
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' },
      ],
    },
    {
      label: '编辑',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: '视图',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: '窗口',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        ...(isMac ? [
          { type: 'separator' as const },
          { role: 'front' as const },
        ] : [
          { role: 'close' as const },
        ]),
      ],
    },
    {
      label: '帮助',
      submenu: [
        {
          label: '关于 龙虾集群',
          click: () => {
            const { dialog } = require('electron');
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '关于 龙虾集群控制台',
              message: '🦞 SIMIAICLAW 龙虾集群太极64卦系统',
              detail: '版本 1.0.0\n64个AI智能体 · 八宫协同\nMCP连接器 · 全球大模型市场',
            });
          },
        },
        {
          label: '打开 API 服务器',
          click: () => shell.openExternal(API_URL),
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createTray() {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABdklEQVR4nO2WzUrDQBSFv1tLcWoSXBgZGMSFQhdnPgA3xszDcGIg6BAHBg6cOAQHB8KFiCAiIv4FLo2kTdukLly44IHLn9zknHvOuUkKhUKhUChIDYBeoA8YATqBLdPqP6AOOAUugH1gH1gHNp1uQoVC8QuoqgE3wDewDSwD00CfRdsVCoU2oKoGPANvgVVgBpgAul0tU6FQyEFVDXgCroAZ4N4YoFAoFDoEqwG3wDUwBXw5A4RK5Q+1Y8qXgBfgEpgFzIBpYMSuVKlUfFMrwAXgGbgE5oAxoNuuplAo5KBWgPOA8b/HQqFQaBM6wBngxK5QKBS6ADrAKeDarlAoFLoEOsBJ4MquUCgUugQ6wBHgxq5QKBS6BDrAYeDKrlAoFLoE8oJgCrgHfF1gKfAHmANeO9qEQqFQKBQKhUKhUCgUCoVCoVAoFP4J/gHq7mQ4qJf0agAAAABJRU5ErkJggg=='
  );
  tray = new Tray(icon);
  tray.setToolTip(APP_NAME);
  tray.on('click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
  const contextMenu = Menu.buildFromTemplate([
    { label: '显示', click: () => mainWindow?.show() },
    { label: '全屏', click: () => mainWindow?.setFullScreen(true) },
    { type: 'separator' },
    { label: '退出', click: () => { tray?.destroy(); app.quit(); } },
  ]);
  tray.setContextMenu(contextMenu);
}

// 应用生命周期
app.whenReady().then(() => {
  setupIPC();
  createWindow();
  createTray();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  tray?.destroy();
  tray = null;
});
