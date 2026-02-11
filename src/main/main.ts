import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerTaskIpcHandlers, registerWindowIpcHandlers } from './ipc';
import { TaskStore } from './store';

let taskStore: TaskStore | undefined;
let isQuitting = false;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    // Frameless window with custom controls rendered in the renderer.
    backgroundColor: '#f6f4ee',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, '../../preload/preload/preload.js'),
    },
  });

  const sendWindowState = () => {
    if (mainWindow.isDestroyed()) {
      return;
    }
    mainWindow.webContents.send('window:state-changed', {
      isMaximized: mainWindow.isMaximized(),
      isFullScreen: mainWindow.isFullScreen(),
    });
  };

  mainWindow.on('maximize', sendWindowState);
  mainWindow.on('unmaximize', sendWindowState);
  mainWindow.on('enter-full-screen', sendWindowState);
  mainWindow.on('leave-full-screen', sendWindowState);

  mainWindow.webContents.on('did-finish-load', sendWindowState);

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
}

app.whenReady().then(() => {
  taskStore = new TaskStore({
    storagePath: path.join(app.getPath('userData'), 'tasks.json'),
  });
  registerTaskIpcHandlers(taskStore);
  registerWindowIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  if (isQuitting || !taskStore) {
    return;
  }
  event.preventDefault();
  isQuitting = true;
  taskStore
    .flush()
    .catch((error) => {
      console.warn('Failed to flush tasks before quit.', error);
    })
    .finally(() => {
      app.quit();
    });
});
