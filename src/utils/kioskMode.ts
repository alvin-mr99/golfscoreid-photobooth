/**
 * Kiosk Mode Utilities
 * Handles fullscreen mode and kiosk-specific features
 */

/**
 * Request fullscreen mode
 */
export function requestFullscreen(): void {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    elem.requestFullscreen().catch(err => {
      console.error('Error attempting to enable fullscreen:', err);
    });
  } else if ((elem as any).webkitRequestFullscreen) {
    // Safari
    (elem as any).webkitRequestFullscreen();
  } else if ((elem as any).msRequestFullscreen) {
    // IE11
    (elem as any).msRequestFullscreen();
  }
}

/**
 * Exit fullscreen mode
 */
export function exitFullscreen(): void {
  if (document.exitFullscreen) {
    document.exitFullscreen().catch(err => {
      console.error('Error attempting to exit fullscreen:', err);
    });
  } else if ((document as any).webkitExitFullscreen) {
    // Safari
    (document as any).webkitExitFullscreen();
  } else if ((document as any).msExitFullscreen) {
    // IE11
    (document as any).msExitFullscreen();
  }
}

/**
 * Toggle fullscreen mode
 */
export function toggleFullscreen(): void {
  if (isFullscreen()) {
    exitFullscreen();
  } else {
    requestFullscreen();
  }
}

/**
 * Check if currently in fullscreen mode
 */
export function isFullscreen(): boolean {
  return !!(
    document.fullscreenElement ||
    (document as any).webkitFullscreenElement ||
    (document as any).msFullscreenElement
  );
}

/**
 * Setup kiosk mode event listeners
 * Prevents common keyboard shortcuts and browser actions
 */
export function setupKioskMode(): () => void {
  // Prevent keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent) => {
    // Prevent F11 (fullscreen toggle)
    if (e.key === 'F11') {
      e.preventDefault();
    }
    
    // Prevent Alt+F4 (close window)
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+W (close tab)
    if (e.ctrlKey && e.key === 'w') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+Q (quit)
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+Shift+Q (quit all)
    if (e.ctrlKey && e.shiftKey && e.key === 'Q') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+N (new window)
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+T (new tab)
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
    }
    
    // Prevent Ctrl+Shift+T (reopen closed tab)
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
    }
    
    // Prevent Alt+Tab (switch window) - limited effectiveness
    if (e.altKey && e.key === 'Tab') {
      e.preventDefault();
    }
  };

  // Prevent context menu (right-click)
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
  };

  // Prevent beforeunload (closing/refreshing)
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    // Only prevent if not navigating within the app
    if (!window.location.href.includes('#')) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  // Add event listeners
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('contextmenu', handleContextMenu);
  window.addEventListener('beforeunload', handleBeforeUnload);

  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('contextmenu', handleContextMenu);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}

/**
 * Setup global error handler
 */
export function setupGlobalErrorHandler(): () => void {
  const handleError = (event: ErrorEvent) => {
    console.error('Global error:', event.error);
    // Error boundary will catch React errors
    // This catches non-React errors
  };

  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('Unhandled promise rejection:', event.reason);
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);

  return () => {
    window.removeEventListener('error', handleError);
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  };
}
