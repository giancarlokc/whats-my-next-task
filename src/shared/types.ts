export interface Task {
  id: string;
  name: string;
  description: string;
}

export interface TaskInput {
  name: string;
  description: string;
}

export type TaskActionResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; error: string; tasks: Task[] };
