import { promises as fs } from 'fs';
import path from 'path';
import type { Task } from '../shared/types';

const TASKS_VERSION = 1;

type StoredTasks = {
  version: number;
  tasks: Task[];
};

export interface TaskPersistence {
  load(): Promise<Task[]>;
  save(tasks: Task[]): Promise<void>;
}

export class JsonTaskPersistence implements TaskPersistence {
  constructor(private filePath: string) {}

  async load(): Promise<Task[]> {
    let raw: string;
    try {
      raw = await fs.readFile(this.filePath, 'utf-8');
    } catch (error) {
      if (isErrno(error, 'ENOENT')) {
        return [];
      }
      throw error;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      console.warn('Tasks file is unreadable. Backing up and starting fresh.', error);
      await this.backupCorruptFile();
      return [];
    }

    if (!parsed || typeof parsed !== 'object') {
      console.warn('Tasks file is invalid. Backing up and starting fresh.');
      await this.backupCorruptFile();
      return [];
    }

    const record = parsed as Record<string, unknown>;
    const version = record.version;
    if (version !== TASKS_VERSION) {
      console.warn(
        `Tasks file version ${String(version)} does not match expected ${TASKS_VERSION}. ` +
          'Backing up and starting fresh.',
      );
      await this.backupCorruptFile();
      return [];
    }

    if (!Array.isArray(record.tasks)) {
      console.warn('Tasks file is invalid. Backing up and starting fresh.');
      await this.backupCorruptFile();
      return [];
    }

    if (!record.tasks.every(isTask)) {
      console.warn('Tasks file contains invalid tasks. Backing up and starting fresh.');
      await this.backupCorruptFile();
      return [];
    }

    return record.tasks;
  }

  async save(tasks: Task[]): Promise<void> {
    const payload: StoredTasks = {
      version: TASKS_VERSION,
      tasks,
    };
    const json = `${JSON.stringify(payload, null, 2)}\n`;
    const dir = path.dirname(this.filePath);
    await fs.mkdir(dir, { recursive: true });

    const tempPath = `${this.filePath}.tmp`;
    await fs.writeFile(tempPath, json, 'utf-8');
    try {
      await fs.rename(tempPath, this.filePath);
    } catch (error) {
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        if (!isErrno(cleanupError, 'ENOENT')) {
          console.warn('Failed to clean up temp tasks file.', cleanupError);
        }
      }
      throw error;
    }
  }

  private async backupCorruptFile(): Promise<void> {
    const backupPath = `${this.filePath}.bak-${Date.now()}`;
    try {
      await fs.rename(this.filePath, backupPath);
    } catch (error) {
      if (!isErrno(error, 'ENOENT')) {
        console.warn('Failed to back up corrupt tasks file.', error);
      }
    }
  }
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.description === 'string' &&
    (record.effort === 'LOW' || record.effort === 'HIGH') &&
    (record.impact === 'LOW' || record.impact === 'HIGH')
  );
}

function isErrno(error: unknown, code: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  return (error as { code?: string }).code === code;
}
