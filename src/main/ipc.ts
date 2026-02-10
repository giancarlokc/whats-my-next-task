import { BrowserWindow, ipcMain } from 'electron';
import type { EffortLevel, ImpactLevel, TaskActionResult, TaskInput } from '../shared/types';
import { TaskStore } from './store';

export function registerTaskIpcHandlers(store: TaskStore) {
  ipcMain.handle('tasks:list', () => store.list());

  ipcMain.handle('tasks:add', (_event, input: unknown): TaskActionResult => {
    const parsedInput = parseTaskInput(input);
    if (!parsedInput.ok) {
      return { ok: false, error: parsedInput.error, tasks: store.list() };
    }
    try {
      const tasks = store.add(parsedInput.value);
      broadcastTasksChanged(tasks);
      return { ok: true, tasks };
    } catch (error) {
      return { ok: false, error: toErrorMessage(error), tasks: store.list() };
    }
  });

  ipcMain.handle('tasks:delete', (_event, payload: unknown): TaskActionResult => {
    const parsedPayload = parseTaskDeletePayload(payload);
    if (!parsedPayload.ok) {
      return { ok: false, error: parsedPayload.error, tasks: store.list() };
    }
    const tasks = store.delete(parsedPayload.value.id);
    broadcastTasksChanged(tasks);
    return { ok: true, tasks };
  });
}

function broadcastTasksChanged(tasks: ReturnType<TaskStore['list']>) {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('tasks:changed', tasks);
  }
}

function parseTaskInput(
  input: unknown,
): { ok: true; value: TaskInput } | { ok: false; error: string } {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'Task payload is required.' };
  }
  const record = input as Record<string, unknown>;
  if (typeof record.name !== 'string' || typeof record.description !== 'string') {
    return { ok: false, error: 'Task payload is invalid.' };
  }
  const effort = parseLevel(record.effort, 'LOW');
  if (!effort) {
    return { ok: false, error: 'Task effort is invalid.' };
  }
  const impact = parseLevel(record.impact, 'HIGH');
  if (!impact) {
    return { ok: false, error: 'Task impact is invalid.' };
  }
  return {
    ok: true,
    value: { name: record.name, description: record.description, effort, impact },
  };
}

function parseTaskDeletePayload(
  payload: unknown,
): { ok: true; value: { id: string } } | { ok: false; error: string } {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Delete payload is required.' };
  }
  const record = payload as Record<string, unknown>;
  if (typeof record.id !== 'string') {
    return { ok: false, error: 'Delete payload is invalid.' };
  }
  return { ok: true, value: { id: record.id } };
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unexpected error.';
}

function parseLevel(
  value: unknown,
  fallback: EffortLevel | ImpactLevel,
): EffortLevel | ImpactLevel | null {
  if (value === undefined || value === null) {
    return fallback;
  }
  if (value === 'LOW' || value === 'HIGH') {
    return value;
  }
  return null;
}
