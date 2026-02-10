import React from 'react';
import type { Task } from '../../../shared/types';
import './Sidebar.css';

interface SidebarProps {
  tasks: Task[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
}

export function Sidebar({ tasks, selectedId, onSelect, onAdd }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Tasks</h1>
        <button className="primary" type="button" onClick={onAdd}>
          Add Task
        </button>
      </div>
      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="empty">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
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
    </aside>
  );
}
