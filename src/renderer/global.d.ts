import type { Task, TaskActionResult, TaskInput } from '../shared/types';

export {};

declare global {
  interface Window {
    tasksApi: {
      list: () => Promise<Task[]>;
      add: (input: TaskInput) => Promise<TaskActionResult>;
      delete: (payload: { id: string }) => Promise<TaskActionResult>;
      onChanged: (callback: (tasks: Task[]) => void) => () => void;
    };
    appInfo: {
      platform: NodeJS.Platform;
      isWindows: boolean;
      isMac: boolean;
      isLinux: boolean;
    };
    windowControls: {
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<boolean>;
      toggleFullScreen: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      isFullScreen: () => Promise<boolean>;
      onStateChanged: (
        callback: (state: { isMaximized: boolean; isFullScreen: boolean }) => void,
      ) => () => void;
    };
  }
}
