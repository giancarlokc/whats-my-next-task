import React from 'react';
import type { EffortLevel, ImpactLevel, Task } from '../../../shared/types';
import './TaskView.css';

interface TaskViewProps {
  task: Task | null;
  onDelete: (id: string) => void;
}

export function TaskView({ task, onDelete }: TaskViewProps) {
  if (!task) {
    return (
      <section className="task-view empty-state">
        <h2>Select a task</h2>
        <p>Create a new task from the sidebar to get started.</p>
      </section>
    );
  }

  const matrix = getEffortImpactMatrix();
  const effort = normalizeLevel(task.effort, 'LOW');
  const impact = normalizeLevel(task.impact, 'HIGH');
  const activeCell = matrix[effort][impact];

  return (
    <section className="task-view">
      <header>
        <h2>{task.name}</h2>
        <button className="danger" type="button" onClick={() => onDelete(task.id)}>
          Delete Task
        </button>
      </header>
      <div className="task-details">
        <h3>Description</h3>
        <p>{task.description || 'No description provided.'}</p>
      </div>
      <div className="task-details">
        <h3>Effort/Impact Matrix</h3>
        <div className="matrix-summary">
          Resulting priority: <span>{activeCell.title}</span>
        </div>
        <div className="matrix-grid" role="grid" aria-label="Effort and impact matrix">
          <div className="matrix-corner" aria-hidden="true" />
          <div className="matrix-axis matrix-axis--x">Low impact</div>
          <div className="matrix-axis matrix-axis--x">High impact</div>
          <div className="matrix-axis matrix-axis--y">High effort</div>
          <div className={getCellClass(effort, impact, 'HIGH', 'LOW')} role="gridcell">
            <span>{matrix.HIGH.LOW.title}</span>
            <small>{matrix.HIGH.LOW.subtitle}</small>
          </div>
          <div className={getCellClass(effort, impact, 'HIGH', 'HIGH')} role="gridcell">
            <span>{matrix.HIGH.HIGH.title}</span>
            <small>{matrix.HIGH.HIGH.subtitle}</small>
          </div>
          <div className="matrix-axis matrix-axis--y">Low effort</div>
          <div className={getCellClass(effort, impact, 'LOW', 'LOW')} role="gridcell">
            <span>{matrix.LOW.LOW.title}</span>
            <small>{matrix.LOW.LOW.subtitle}</small>
          </div>
          <div className={getCellClass(effort, impact, 'LOW', 'HIGH')} role="gridcell">
            <span>{matrix.LOW.HIGH.title}</span>
            <small>{matrix.LOW.HIGH.subtitle}</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function getEffortImpactMatrix() {
  return {
    HIGH: {
      LOW: { title: 'Deprioritize', subtitle: 'Time Sink' },
      HIGH: { title: 'Major Project', subtitle: 'Medium-High Priority' },
    },
    LOW: {
      LOW: { title: 'Fill-in', subtitle: 'Low Priority' },
      HIGH: { title: 'Quick Win', subtitle: 'High Priority' },
    },
  } satisfies Record<EffortLevel, Record<ImpactLevel, { title: string; subtitle: string }>>;
}

function normalizeLevel(
  value: EffortLevel | ImpactLevel | undefined,
  fallback: EffortLevel | ImpactLevel,
) {
  return value === 'HIGH' || value === 'LOW' ? value : fallback;
}

function getCellClass(
  activeEffort: EffortLevel,
  activeImpact: ImpactLevel,
  effort: EffortLevel,
  impact: ImpactLevel,
) {
  const isActive = activeEffort === effort && activeImpact === impact;
  return isActive ? 'matrix-cell matrix-cell--active' : 'matrix-cell';
}
