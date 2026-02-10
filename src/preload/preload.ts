import { contextBridge, ipcRenderer } from 'electron';
import type { Task, TaskActionResult, TaskInput } from '../shared/types';

const tasksApi = {
  list: (): Promise<Task[]> => ipcRenderer.invoke('tasks:list'),
  add: (input: TaskInput): Promise<TaskActionResult> => ipcRenderer.invoke('tasks:add', input),
  delete: (payload: { id: string }): Promise<TaskActionResult> =>
    ipcRenderer.invoke('tasks:delete', payload),
  onChanged: (callback: (tasks: Task[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tasks: Task[]) => {
      callback(tasks);
    };

    ipcRenderer.on('tasks:changed', handler);

    return () => {
      ipcRenderer.removeListener('tasks:changed', handler);
    };
  },
};

contextBridge.exposeInMainWorld('tasksApi', tasksApi);

contextBridge.exposeInMainWorld('appInfo', {
  platform: process.platform,
  isWindows: process.platform === 'win32',
  isMac: process.platform === 'darwin',
  isLinux: process.platform === 'linux',
});

const windowControls = {
  minimize: () => ipcRenderer.invoke('window:minimize'),
  toggleMaximize: () => ipcRenderer.invoke('window:toggle-maximize'),
  toggleFullScreen: () => ipcRenderer.invoke('window:toggle-fullscreen'),
  close: () => ipcRenderer.invoke('window:close'),
  isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:is-maximized'),
  isFullScreen: (): Promise<boolean> => ipcRenderer.invoke('window:is-fullscreen'),
  onStateChanged: (callback: (state: { isMaximized: boolean; isFullScreen: boolean }) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      state: { isMaximized: boolean; isFullScreen: boolean },
    ) => {
      callback(state);
    };

    ipcRenderer.on('window:state-changed', handler);

    return () => {
      ipcRenderer.removeListener('window:state-changed', handler);
    };
  },
};

contextBridge.exposeInMainWorld('windowControls', windowControls);
