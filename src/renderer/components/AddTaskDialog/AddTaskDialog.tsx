import React, { useEffect, useRef, useState } from 'react';
import type { TaskInput } from '../../../shared/types';
import './AddTaskDialog.css';

interface AddTaskDialogProps {
  isOpen: boolean;
  onAdd: (input: TaskInput) => Promise<{ ok: boolean; error?: string }>;
  onCancel: () => void;
}

export function AddTaskDialog({ isOpen, onAdd, onCancel }: AddTaskDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setError(null);
      requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Task name is required.');
      return;
    }
    try {
      const result = await onAdd({ name: trimmedName, description });
      if (!result.ok) {
        setError(result.error ?? 'Unable to create task.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create task.');
    }
  };

  return (
    <div className="dialog-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        aria-describedby="add-task-desc"
        ref={dialogRef}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key !== 'Tab') {
            return;
          }
          const container = dialogRef.current;
          if (!container) {
            return;
          }
          const focusable = Array.from(
            container.querySelectorAll<HTMLElement>(
              'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])',
            ),
          ).filter((element) => !element.hasAttribute('disabled'));
          if (focusable.length === 0) {
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <header>
          <h2 id="add-task-title">New Task</h2>
        </header>
        <p id="add-task-desc" className="sr-only">
          Provide a name and description for the new task.
        </p>
        <form onSubmit={handleSubmit}>
          <label>
            Task name
            <input
              ref={nameInputRef}
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) {
                  setError(null);
                }
              }}
              required
            />
          </label>
          <label>
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </label>
          {error ? <p className="dialog-error">{error}</p> : null}
          <div className="dialog-actions">
            <button type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="primary" type="submit">
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
