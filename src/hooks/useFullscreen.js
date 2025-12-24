import { useState, useEffect, useCallback, useRef } from 'react';

export const useFullscreen = (onWarning, onShowModal, onAutoSubmit) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const warningTimeoutRef = useRef(null);
  const lastFocusTime = useRef(Date.now());

  const enterFullscreen = useCallback(() => {
    const element = document.documentElement;
    try {
      if (element.requestFullscreen) {
        element.requestFullscreen().catch(err => {
          console.warn('Fullscreen request failed:', err);
        });
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } catch (error) {
      console.warn('Fullscreen not supported or permission denied:', error);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }, []);

  const triggerWarning = useCallback((reason = 'fullscreen violation') => {
    if (warningCount >= 5) {
      // Auto-submit immediately if already at 5 warnings
      if (onAutoSubmit) {
        onAutoSubmit();
      }
      return;
    }

    const newWarningCount = warningCount + 1;
    setWarningCount(newWarningCount);
    
    console.log('Test violation warning:', newWarningCount, 'Reason:', reason);
    
    if (onWarning) {
      onWarning(newWarningCount);
    }

    // Show warning modal with countdown
    setShowWarningModal(true);

    // Auto-submit after 60 seconds if user doesn't respond
    warningTimeoutRef.current = setTimeout(() => {
      console.log('Warning timeout - auto-submitting test');
      setShowWarningModal(false);
      if (onAutoSubmit) {
        onAutoSubmit();
      }
    }, 60000);

    // If this is the 5th warning, auto-submit immediately
    if (newWarningCount >= 5) {
      setTimeout(() => {
        setShowWarningModal(false);
        if (onAutoSubmit) {
          onAutoSubmit();
        }
      }, 1000);
    }
  }, [warningCount, onWarning, onAutoSubmit]);

  const handleWarningOk = useCallback(() => {
    // Clear the timeout
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    
    setShowWarningModal(false);
    
    // Re-enter fullscreen if not in fullscreen
    if (!isFullscreen) {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen]);

  const handleWarningTimeout = useCallback(() => {
    console.log('Warning modal timeout - auto-submitting test');
    setShowWarningModal(false);
    if (onAutoSubmit) {
      onAutoSubmit();
    }
  }, [onAutoSubmit]);

  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    setIsFullscreen(isCurrentlyFullscreen);

    // If user exited fullscreen during test and not showing warning modal
    if (!isCurrentlyFullscreen && !showWarningModal) {
      triggerWarning('exiting fullscreen mode');
    }
  }, [showWarningModal, triggerWarning]);

  // Handle window focus/blur events to detect Alt+Tab and window switching
  const handleWindowBlur = useCallback(() => {
    lastFocusTime.current = Date.now();
    console.log('Window lost focus - potential Alt+Tab or window switch');
  }, []);

  const handleWindowFocus = useCallback(() => {
    const focusLostDuration = Date.now() - lastFocusTime.current;
    
    // If focus was lost for more than 500ms, consider it a violation
    if (focusLostDuration > 500 && !showWarningModal) {
      console.log('Window regained focus after', focusLostDuration, 'ms');
      triggerWarning('window switching or Alt+Tab');
    }
  }, [showWarningModal, triggerWarning]);

  // Handle visibility change (when tab becomes hidden/visible)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && !showWarningModal) {
      console.log('Tab became hidden - potential tab switching');
      triggerWarning('tab switching');
    }
  }, [showWarningModal, triggerWarning]);

  useEffect(() => {
    // Fullscreen change events
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    // Window focus/blur events for Alt+Tab detection
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    // Visibility change for tab switching detection
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear any pending timeouts
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [handleFullscreenChange, handleWindowBlur, handleWindowFocus, handleVisibilityChange]);

  // Prevent common exit methods
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent F11, Escape, Alt+Tab, Ctrl+Shift+I, F12
      if (
        e.key === 'F11' ||
        e.key === 'Escape' ||
        (e.altKey && e.key === 'Tab') ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'F12'
      ) {
        e.preventDefault();
        return false;
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  return {
    isFullscreen,
    warningCount,
    showWarningModal,
    enterFullscreen,
    exitFullscreen,
    handleWarningOk,
    handleWarningTimeout
  };
};