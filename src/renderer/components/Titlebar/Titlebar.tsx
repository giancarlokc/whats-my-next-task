import React, { useEffect, useState } from 'react';
import './Titlebar.css';

interface TitlebarProps {
  platform: NodeJS.Platform;
  appName: string;
}

export function Titlebar({ platform, appName }: TitlebarProps) {
  const isMac = platform === 'darwin';
  const [isMaximized, setIsMaximized] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const maximizeLabel = isMaximized ? 'Restore window' : 'Maximize window';

  useEffect(() => {
    let isActive = true;

    const updateWindowState = async () => {
      if (!isActive) {
        return;
      }
      if (isMac) {
        const value = await window.windowControls?.isFullScreen();
        if (typeof value === 'boolean') {
          setIsFullScreen(value);
        }
        return;
      }
      const value = await window.windowControls?.isMaximized();
      if (typeof value === 'boolean') {
        setIsMaximized(value);
      }
    };

    const handleStateChanged = (state: { isMaximized: boolean; isFullScreen: boolean }) => {
      if (!isActive) {
        return;
      }
      setIsMaximized(state.isMaximized);
      setIsFullScreen(state.isFullScreen);
    };

    void updateWindowState();

    const unsubscribe = window.windowControls?.onStateChanged?.(handleStateChanged);

    return () => {
      isActive = false;
      unsubscribe?.();
    };
  }, [isMac]);

  const handleMinimize = () => {
    void window.windowControls?.minimize();
  };

  const handleToggleMaximize = async () => {
    const nextState = await window.windowControls?.toggleMaximize();
    if (typeof nextState === 'boolean') {
      setIsMaximized(nextState);
    }
  };

  const handleToggleFullScreen = async () => {
    const nextState = await window.windowControls?.toggleFullScreen();
    if (typeof nextState === 'boolean') {
      setIsFullScreen(nextState);
    }
  };

  const handleClose = () => {
    void window.windowControls?.close();
  };

  return (
    <header className={`titlebar titlebar--${platform}`}>
      <div className="titlebar__left">
        {isMac ? (
          <div className="titlebar__controls titlebar__controls--mac">
            <button
              className="titlebar__mac-button titlebar__mac-button--close"
              type="button"
              aria-label="Close window"
              onClick={handleClose}
            />
            <button
              className="titlebar__mac-button titlebar__mac-button--minimize"
              type="button"
              aria-label="Minimize window"
              onClick={handleMinimize}
            />
            <button
              className="titlebar__mac-button titlebar__mac-button--maximize"
              type="button"
              aria-label={isFullScreen ? 'Exit full screen' : 'Enter full screen'}
              onClick={handleToggleFullScreen}
            />
          </div>
        ) : (
          <div className="titlebar__title titlebar__title--left">{appName}</div>
        )}
      </div>
      <div className="titlebar__center">
        {isMac ? <span className="titlebar__title">{appName}</span> : null}
      </div>
      <div className="titlebar__right">
        {!isMac ? (
          <div className="titlebar__controls titlebar__controls--windows">
            <button
              className="titlebar__button titlebar__button--minimize"
              type="button"
              aria-label="Minimize window"
              onClick={handleMinimize}
            >
              <svg className="titlebar__icon" viewBox="0 0 10 10" aria-hidden="true">
                <line x1="1" y1="5" x2="9" y2="5" />
              </svg>
            </button>
            <button
              className="titlebar__button titlebar__button--maximize"
              type="button"
              aria-label={maximizeLabel}
              onClick={handleToggleMaximize}
            >
              {isMaximized ? (
                <svg className="titlebar__icon" viewBox="0 0 10 10" aria-hidden="true">
                  <rect x="2.5" y="1.5" width="6" height="6" rx="0.5" />
                  <rect x="1.5" y="2.5" width="6" height="6" rx="0.5" />
                </svg>
              ) : (
                <svg className="titlebar__icon" viewBox="0 0 10 10" aria-hidden="true">
                  <rect x="1.5" y="1.5" width="7" height="7" rx="0.5" />
                </svg>
              )}
            </button>
            <button
              className="titlebar__button titlebar__button--close"
              type="button"
              aria-label="Close window"
              onClick={handleClose}
            >
              <svg className="titlebar__icon" viewBox="0 0 10 10" aria-hidden="true">
                <line x1="2" y1="2" x2="8" y2="8" />
                <line x1="8" y1="2" x2="2" y2="8" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="titlebar__spacer" aria-hidden="true" />
        )}
      </div>
    </header>
  );
}
