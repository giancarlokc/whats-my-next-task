import type { EffortLevel, ImpactLevel, Task } from './types';

export type PriorityBucket = 'QUICK_WIN' | 'MAJOR_PROJECT' | 'FILL_IN' | 'DEPRIORITIZE';

export type PrioritySection = {
  key: PriorityBucket;
  title: string;
  effort: EffortLevel;
  impact: ImpactLevel;
};

const PRIORITY_SECTIONS: PrioritySection[] = [
  { key: 'QUICK_WIN', title: 'Quick Win', effort: 'LOW', impact: 'HIGH' },
  { key: 'MAJOR_PROJECT', title: 'Major Project', effort: 'HIGH', impact: 'HIGH' },
  { key: 'FILL_IN', title: 'Fill-in', effort: 'LOW', impact: 'LOW' },
  { key: 'DEPRIORITIZE', title: 'Deprioritize', effort: 'HIGH', impact: 'LOW' },
];

export function getPrioritySections() {
  return PRIORITY_SECTIONS.map((section) => ({ ...section }));
}

export function getPriorityBucket(effort: EffortLevel, impact: ImpactLevel): PriorityBucket {
  if (effort === 'LOW' && impact === 'HIGH') {
    return 'QUICK_WIN';
  }
  if (effort === 'HIGH' && impact === 'HIGH') {
    return 'MAJOR_PROJECT';
  }
  if (effort === 'LOW' && impact === 'LOW') {
    return 'FILL_IN';
  }
  return 'DEPRIORITIZE';
}

export type PriorityListSection = {
  key: PriorityBucket;
  title: string;
  tasks: Task[];
};

export type NormalizedEffortImpact = {
  effort: EffortLevel;
  impact: ImpactLevel;
  isFallback: boolean;
};

export function groupTasksByPriority(tasks: Task[]): PriorityListSection[] {
  const sections: PriorityListSection[] = getPrioritySections().map((section) => ({
    key: section.key,
    title: section.title,
    tasks: [],
  }));
  const sectionMap = new Map<PriorityBucket, PriorityListSection>(
    sections.map((section) => [section.key as PriorityBucket, section]),
  );

  tasks.forEach((task) => {
    const { effort, impact } = normalizeEffortImpact(
      task as { effort?: unknown; impact?: unknown },
    );
    const bucket = getPriorityBucket(effort, impact);
    sectionMap.get(bucket)?.tasks.push(task);
  });

  return sections;
}

export function orderTasksByPriority(tasks: Task[]): Task[] {
  return groupTasksByPriority(tasks).flatMap((section) => section.tasks);
}

export function normalizeEffortImpact(value: {
  effort?: unknown;
  impact?: unknown;
}): NormalizedEffortImpact {
  const effort = parseEffortLevel(value.effort);
  const impact = parseImpactLevel(value.impact);
  const normalizedEffort = effort ?? 'HIGH';
  const normalizedImpact = impact ?? 'LOW';

  return {
    effort: normalizedEffort,
    impact: normalizedImpact,
    isFallback: !effort || !impact,
  };
}

function parseEffortLevel(value: unknown): EffortLevel | null {
  return value === 'LOW' || value === 'HIGH' ? value : null;
}

function parseImpactLevel(value: unknown): ImpactLevel | null {
  return value === 'LOW' || value === 'HIGH' ? value : null;
}
