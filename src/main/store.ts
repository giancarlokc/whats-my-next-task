import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';
import type { EffortLevel, ImpactLevel, Task, TaskInput } from '../shared/types';

export class TaskStore {
  private tasks = new Map<string, Task>();
  private storagePath?: string;
  private persistTimer?: NodeJS.Timeout;
  private persistInFlight = false;
  private persistRequested = false;
  private persistPromise?: Promise<void>;

  constructor(options?: { storagePath?: string }) {
    this.storagePath = options?.storagePath;
    this.loadFromDisk();
  }

  list(): Task[] {
    return Array.from(this.tasks.values());
  }

  add(input: TaskInput): Task[] {
    const name = input.name.trim();
    const description = input.description.trim();
    const effort = normalizeLevel(input.effort, 'LOW');
    const impact = normalizeLevel(input.impact, 'HIGH');
    if (!name) {
      throw new Error('Task name is required.');
    }

    const task: Task = {
      id: randomUUID(),
      name,
      description,
      effort,
      impact,
    };

    this.tasks.set(task.id, task);
    this.schedulePersist();
    return this.list();
  }

  delete(id: string): Task[] {
    this.tasks.delete(id);
    this.schedulePersist();
    return this.list();
  }

  async flush() {
    if (!this.storagePath) {
      return;
    }
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = undefined;
    }
    this.persistRequested = true;
    while (this.persistInFlight || this.persistRequested) {
      if (this.persistInFlight && this.persistPromise) {
        await this.persistPromise;
      } else {
        await this.persistAsync();
      }
    }
  }

  private loadFromDisk() {
    if (!this.storagePath) {
      return;
    }
    const primaryPath = this.storagePath;
    const backupPath = `${primaryPath}.bak`;
    const tempPath = `${primaryPath}.tmp`;

    const loadFrom = (filePath: string, label: string) => {
      const result = readTasksFromFile(filePath, label);
      if (!result) {
        return false;
      }
      this.tasks.clear();
      for (const task of result.tasks) {
        this.tasks.set(task.id, task);
      }
      if (result.dropped > 0) {
        console.warn(`Dropped ${result.dropped} invalid task(s) from ${label}.`);
      }
      return true;
    };

    let loaded = false;
    let shouldCleanupAux = false;

    if (fs.existsSync(primaryPath)) {
      loaded = loadFrom(primaryPath, 'storage file');
      if (loaded) {
        shouldCleanupAux = true;
      }
    }

    if (!loaded && fs.existsSync(backupPath) && loadFrom(backupPath, 'storage backup')) {
      const restored = restoreFile(backupPath, primaryPath);
      shouldCleanupAux = restored || fs.existsSync(primaryPath);
      loaded = true;
    }

    if (!loaded && fs.existsSync(tempPath) && loadFrom(tempPath, 'storage temp file')) {
      const restored = restoreFile(tempPath, primaryPath);
      shouldCleanupAux = restored || fs.existsSync(primaryPath);
      loaded = true;
    }

    if (loaded) {
      if (shouldCleanupAux) {
        cleanupAuxFile(backupPath);
        cleanupAuxFile(tempPath);
      }
      return;
    }

    if (shouldCleanupAux) {
      cleanupAuxFile(backupPath);
      cleanupAuxFile(tempPath);
    }
  }

  private schedulePersist() {
    if (!this.storagePath) {
      return;
    }
    this.persistRequested = true;
    if (this.persistTimer || this.persistInFlight) {
      return;
    }
    this.persistTimer = setTimeout(() => {
      this.persistTimer = undefined;
      void this.persistAsync();
    }, 150);
  }

  private async persistAsync() {
    const storagePath = this.storagePath;
    if (!storagePath) {
      return;
    }
    if (this.persistInFlight) {
      this.persistRequested = true;
      return;
    }
    this.persistInFlight = true;
    this.persistPromise = (async () => {
      while (this.persistRequested) {
        this.persistRequested = false;
        const payload = {
          version: 1,
          tasks: this.list(),
        };
        const directory = path.dirname(storagePath);
        try {
          await fs.promises.mkdir(directory, { recursive: true });
          const tempPath = `${storagePath}.tmp`;
          await fs.promises.writeFile(tempPath, JSON.stringify(payload, null, 2), 'utf8');
          await replaceFileAsync(tempPath, storagePath);
        } catch (error) {
          console.warn('Failed to persist tasks to disk.', error);
        }
      }
    })();

    try {
      await this.persistPromise;
    } finally {
      this.persistPromise = undefined;
      this.persistInFlight = false;
      if (this.persistRequested) {
        this.schedulePersist();
      }
    }
  }
}

function normalizeLevel(
  value: EffortLevel | ImpactLevel | undefined,
  fallback: EffortLevel | ImpactLevel,
): EffortLevel | ImpactLevel {
  if (value === 'LOW' || value === 'HIGH') {
    return value;
  }
  return fallback;
}

function isTask(value: unknown): value is Task {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string') {
    return false;
  }
  if (typeof record.name !== 'string' || typeof record.description !== 'string') {
    return false;
  }
  if (record.effort !== 'LOW' && record.effort !== 'HIGH') {
    return false;
  }
  if (record.impact !== 'LOW' && record.impact !== 'HIGH') {
    return false;
  }
  return true;
}

function readTasksFromFile(
  filePath: string,
  label: string,
): { tasks: Task[]; dropped: number } | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') {
      console.warn(`Task ${label} is invalid. Starting with empty tasks.`);
      return null;
    }
    const record = parsed as { tasks?: unknown };
    if (!Array.isArray(record.tasks)) {
      console.warn(`Task ${label} is missing tasks array. Starting with empty tasks.`);
      return null;
    }
    const tasks: Task[] = [];
    let dropped = 0;
    for (const item of record.tasks) {
      if (isTask(item)) {
        tasks.push(item);
      } else {
        dropped += 1;
      }
    }
    return { tasks, dropped };
  } catch (error) {
    console.warn(`Failed to read task ${label}. Starting with empty tasks.`, error);
    return null;
  }
}

function restoreFile(source: string, destination: string) {
  try {
    if (fs.existsSync(destination)) {
      fs.rmSync(destination, { force: true });
    }
    fs.renameSync(source, destination);
    return true;
  } catch (error) {
    console.warn('Failed to restore task storage file.', error);
    return false;
  }
}

function cleanupAuxFile(filePath: string) {
  try {
    if (fs.existsSync(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  } catch (error) {
    console.warn(`Failed to clean up task aux file at ${filePath}.`, error);
  }
}

async function replaceFileAsync(tempPath: string, destination: string) {
  if (process.platform !== 'win32') {
    try {
      await fs.promises.rename(tempPath, destination);
    } catch (error) {
      try {
        await fs.promises.rm(tempPath, { force: true });
      } catch (cleanupError) {
        console.warn('Failed to clean up task temp file.', cleanupError);
      }
      throw error;
    }
    return;
  }

  const backupPath = `${destination}.bak`;
  try {
    if (await existsAsync(destination)) {
      if (await existsAsync(backupPath)) {
        await fs.promises.rm(backupPath, { force: true });
      }
      await fs.promises.rename(destination, backupPath);
    }
    await fs.promises.rename(tempPath, destination);
    if (await existsAsync(backupPath)) {
      await fs.promises.rm(backupPath, { force: true });
    }
  } catch (error) {
    try {
      if (!(await existsAsync(destination)) && (await existsAsync(backupPath))) {
        await fs.promises.rename(backupPath, destination);
      }
    } catch (restoreError) {
      console.warn('Failed to restore task storage backup.', restoreError);
    }
    try {
      await fs.promises.rm(tempPath, { force: true });
    } catch (cleanupError) {
      console.warn('Failed to clean up task temp file.', cleanupError);
    }
    throw error;
  }
}

async function existsAsync(filePath: string) {
  try {
    await fs.promises.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
