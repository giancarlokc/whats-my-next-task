import React, { useEffect, useMemo, useState } from 'react';
import type { Task, TaskInput } from '../shared/types';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TaskView } from './components/TaskView/TaskView';
import { AddTaskDialog } from './components/AddTaskDialog/AddTaskDialog';
import { Titlebar } from './components/Titlebar/Titlebar';

export function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const platform = window.appInfo?.platform ?? ('win32' as NodeJS.Platform);

  useEffect(() => {
    let isMounted = true;
    let receivedChange = false;

    const unsubscribe = window.tasksApi.onChanged((updatedTasks) => {
      receivedChange = true;
      setTasks(updatedTasks);
      setSelectedId((current) => {
        if (!current) {
          return updatedTasks[0]?.id ?? null;
        }
        const stillExists = updatedTasks.some((task) => task.id === current);
        return stillExists ? current : (updatedTasks[0]?.id ?? null);
      });
    });

    const loadInitialTasks = async () => {
      try {
        const initialTasks = await window.tasksApi.list();
        if (!isMounted || receivedChange) {
          return;
        }
        setTasks(initialTasks);
        setSelectedId(initialTasks[0]?.id ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        console.error('Failed to load tasks', error);
      }
    };

    void loadInitialTasks();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const handleAddTask = async (input: TaskInput) => {
    const result = await window.tasksApi.add(input);
    if (result.ok) {
      setTasks(result.tasks);
      setSelectedId((current) => current ?? result.tasks[0]?.id ?? null);
      setIsDialogOpen(false);
      return { ok: true };
    }
    return { ok: false, error: result.error };
  };

  const handleDeleteTask = async (id: string) => {
    const result = await window.tasksApi.delete({ id });
    if (result.ok) {
      setTasks(result.tasks);
      setSelectedId((current) => {
        if (!current) {
          return result.tasks[0]?.id ?? null;
        }
        const stillExists = result.tasks.some((task) => task.id === current);
        return stillExists ? current : (result.tasks[0]?.id ?? null);
      });
    }
  };

  return (
    <div className="app-frame">
      <Titlebar platform={platform} appName="Tasks" />
      <div className="app-shell">
        <Sidebar
          tasks={tasks}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onAdd={() => setIsDialogOpen(true)}
        />
        <main className="main-view">
          <TaskView task={selectedTask} onDelete={handleDeleteTask} />
        </main>
        <AddTaskDialog
          isOpen={isDialogOpen}
          onAdd={handleAddTask}
          onCancel={() => setIsDialogOpen(false)}
        />
      </div>
    </div>
  );
}
