import { randomUUID } from 'crypto';
import type { EffortLevel, ImpactLevel, Task, TaskInput } from '../shared/types';
import type { TaskPersistence } from './taskPersistence';

export class TaskStore {
  private tasks = new Map<string, Task>();
  private persistChain: Promise<void> = Promise.resolve();
  readonly ready: Promise<void>;

  constructor(private persistence: TaskPersistence) {
    this.ready = this.load();
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
    this.queueSave();
    return this.list();
  }

  delete(id: string): Task[] {
    this.tasks.delete(id);
    this.queueSave();
    return this.list();
  }

  async waitForPersistence(): Promise<void> {
    await this.persistChain;
  }

  private async load(): Promise<void> {
    try {
      const tasks = await this.persistence.load();
      for (const task of tasks) {
        this.tasks.set(task.id, task);
      }
    } catch (error) {
      console.error('Failed to load tasks.', error);
    }
  }

  private queueSave(): void {
    const snapshot = this.list();
    this.persistChain = this.persistChain
      .then(() => this.persistence.save(snapshot))
      .catch((error) => {
        console.error('Failed to persist tasks.', error);
      });
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
