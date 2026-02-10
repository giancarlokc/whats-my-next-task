import React from 'react';
import type { Task } from '../../../shared/types';
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
    </section>
  );
}
