import React, { useMemo } from 'react';
import type { Task } from '../../../shared/types';
import { groupTasksByPriority } from '../../../shared/priority';
import './Sidebar.css';

interface SidebarProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function Sidebar({ tasks, selectedId, onSelect, onAdd }: SidebarProps) {
  const sections = useMemo(() => groupTasksByPriority(tasks), [tasks]);
  const hasTasks = tasks.length > 0;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Tasks</h1>
        <button className="primary" type="button" onClick={onAdd}>
          Add Task
        </button>
      </div>
      <div className="task-list">
        {sections.map((section, index) => (
          <div key={section.key} className="task-section">
            <div className="task-section__header">{section.title}</div>
            {section.tasks.length === 0 ? (
              !hasTasks && index === 0 ? (
                <p className="task-section__empty">No tasks yet.</p>
              ) : null
            ) : (
              section.tasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className={task.id === selectedId ? 'task-item task-item--active' : 'task-item'}
                  onClick={() => onSelect(task.id)}
                >
                  <span className="task-name">{task.name}</span>
                  <span className="task-description">{task.description || 'No description'}</span>
                </button>
              ))
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
