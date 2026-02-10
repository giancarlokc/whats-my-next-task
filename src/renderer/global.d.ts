import type { Task, TaskActionResult, TaskInput } from '../shared/types';

export {};

declare global {
  interface Window {
    tasksApi: {
      list: () => Promise<Task[]>;
      add: (input: TaskInput) => Promise<TaskActionResult>;
      delete: (payload: { id: string }) => Promise<TaskActionResult>;
      onChanged: (callback: (tasks: Task[]) => void) => () => void;
    };
  }
}
