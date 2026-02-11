import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  const listRef = useRef<HTMLDivElement>(null);
  const updateScrollStateRef = useRef<(() => void) | null>(null);
  const [scrollState, setScrollState] = useState({
    canScrollUp: false,
    canScrollDown: false,
    stuckKey: null as string | null,
  });

  useLayoutEffect(() => {
    const node = listRef.current;
    if (!node) {
      return;
    }

    let frame = 0;
    const updateScrollState = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = requestAnimationFrame(() => {
        const { scrollTop, scrollHeight, clientHeight } = node;
        const canScrollUp = scrollTop > 0;
        const canScrollDown = scrollTop + clientHeight < scrollHeight - 1;
        let stuckKey: string | null = null;

        if (canScrollUp) {
          const headers = node.querySelectorAll<HTMLElement>('.task-section__header');
          for (const header of headers) {
            if (header.offsetTop <= scrollTop + 1) {
              stuckKey = header.dataset.sectionKey ?? null;
            } else {
              break;
            }
          }
        }

        setScrollState((prev) =>
          prev.canScrollUp === canScrollUp &&
          prev.canScrollDown === canScrollDown &&
          prev.stuckKey === stuckKey
            ? prev
            : { canScrollUp, canScrollDown, stuckKey },
        );
      });
    };

    updateScrollState();
    updateScrollStateRef.current = updateScrollState;
    node.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState);
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(updateScrollState);
    resizeObserver?.observe(node);

    return () => {
      node.removeEventListener('scroll', updateScrollState);
      window.removeEventListener('resize', updateScrollState);
      resizeObserver?.disconnect();
      if (frame) {
        cancelAnimationFrame(frame);
      }
      updateScrollStateRef.current = null;
    };
  }, []);

  useEffect(() => {
    updateScrollStateRef.current?.();
  }, [tasks]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Tasks</h1>
        <button className="primary" type="button" onClick={onAdd}>
          Add Task
        </button>
      </div>
      <div
        className={`task-list-shell${
          scrollState.canScrollUp ? ' task-list-shell--scroll-top' : ''
        }${scrollState.canScrollDown ? ' task-list-shell--scroll-bottom' : ''}`}
      >
        <div ref={listRef} className="task-list">
          {sections.map((section, index) => (
            <div key={section.key} className="task-section">
              {section.tasks.length > 0 ? (
                <div
                  className={
                    scrollState.stuckKey === section.key
                      ? 'task-section__header is-stuck'
                      : 'task-section__header'
                  }
                  data-section-key={section.key}
                >
                  {section.title}
                </div>
              ) : null}
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
      </div>
    </aside>
  );
}
