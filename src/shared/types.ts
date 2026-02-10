export interface Task {
  id: string;
  name: string;
  description: string;
  effort: EffortLevel;
  impact: ImpactLevel;
}

export interface TaskInput {
  name: string;
  description: string;
  effort: EffortLevel;
  impact: ImpactLevel;
}

export type TaskActionResult =
  | { ok: true; tasks: Task[] }
  | { ok: false; error: string; tasks: Task[] };

export type EffortLevel = 'LOW' | 'HIGH';
export type ImpactLevel = 'LOW' | 'HIGH';
