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
