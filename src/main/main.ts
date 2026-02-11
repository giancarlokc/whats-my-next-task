import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerTaskIpcHandlers, registerWindowIpcHandlers } from './ipc';
import { JsonTaskPersistence } from './taskPersistence';
import { TaskStore } from './store';

let taskStore: TaskStore | null = null;
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

app.whenReady().then(async () => {
  const tasksPath = path.join(app.getPath('userData'), 'tasks.json');
  taskStore = new TaskStore(new JsonTaskPersistence(tasksPath));
  await taskStore.ready;
  registerTaskIpcHandlers(taskStore);
  registerWindowIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('before-quit', async (event) => {
  if (isQuitting || !taskStore) {
    return;
  }
  isQuitting = true;
  event.preventDefault();
  try {
    await taskStore.waitForPersistence();
  } catch (error) {
    console.error('Failed to flush tasks before quit.', error);
  }
  app.quit();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
