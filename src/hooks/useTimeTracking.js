import { useState, useEffect, useRef, useCallback } from 'react';
import { attemptAPI } from '../services/api';

export const useTimeTracking = (attemptId) => {
  const [currentQuestionId, setCurrentQuestionId] = useState(null);
  const [questionTimes, setQuestionTimes] = useState({}); // questionId: totalSeconds
  const [isTracking, setIsTracking] = useState(false);
  
  // Refs for timer management
  const startTimeRef = useRef(null);
  const syncIntervalRef = useRef(null);
  const pendingSyncRef = useRef({});

  // Stop current timer and save time
  const stopCurrentTimer = useCallback(() => {
    // Use refs to get the current values instead of state
    const activeQuestionId = currentQuestionId;
    const activeStartTime = startTimeRef.current;
    const activeTracking = isTracking;
    
    if (!activeQuestionId || !activeStartTime || !activeTracking) {
      console.log('⏹️ No active timer to stop', { activeQuestionId, activeStartTime, activeTracking });
      return;
    }

    const timeSpent = Math.floor((Date.now() - activeStartTime) / 1000);
    
    if (timeSpent > 0) {
      // Update local state
      setQuestionTimes(prev => ({
        ...prev,
        [activeQuestionId]: (prev[activeQuestionId] || 0) + timeSpent
      }));

      // Add to pending sync
      pendingSyncRef.current[activeQuestionId] = 
        (pendingSyncRef.current[activeQuestionId] || 0) + timeSpent;

      console.log(`⏹️ Stopped timer for question: ${activeQuestionId}, Time: ${timeSpent}s, Total pending: ${Object.keys(pendingSyncRef.current).length}`);
    }

    // Reset timer state
    startTimeRef.current = null;
    setCurrentQuestionId(null);
    setIsTracking(false);
  }, [currentQuestionId, isTracking]);

  // Start tracking a question
  const startQuestionTimer = useCallback((questionId) => {
    if (!questionId || !attemptId) {
      console.log('❌ Cannot start timer - missing data:', { questionId, attemptId });
      return;
    }

    // Ensure any previous timer is stopped first
    if (startTimeRef.current || isTracking) {
      console.log('⚠️ Previous timer still active, stopping it first');
      stopCurrentTimer();
    }

    // Start new timer
    setCurrentQuestionId(questionId);
    startTimeRef.current = Date.now();
    setIsTracking(true);

    console.log(`⏱️ Started timer for question: ${questionId}`);
  }, [attemptId, isTracking, stopCurrentTimer]);

  // Sync time data to backend
  const syncTimeData = useCallback(async () => {
    if (!attemptId || Object.keys(pendingSyncRef.current).length === 0) {
      console.log('⏭️ Skipping sync - no data:', { attemptId, pendingData: Object.keys(pendingSyncRef.current).length });
      return;
    }

    try {
      const timeData = { ...pendingSyncRef.current };
      pendingSyncRef.current = {}; // Clear pending data

      console.log('🔄 Syncing time data:', timeData);
      await attemptAPI.syncTimeData(attemptId, { questionTimes: timeData });
      console.log('✅ Time data synced successfully', timeData);
    } catch (error) {
      console.error('❌ Failed to sync time data:', error);
      // Re-add failed data to pending sync
      Object.entries(pendingSyncRef.current).forEach(([questionId, time]) => {
        pendingSyncRef.current[questionId] = (pendingSyncRef.current[questionId] || 0) + time;
      });
    }
  }, [attemptId]);

  // Initialize sync interval
  useEffect(() => {
    if (!attemptId) return;

    // Sync every 15 seconds
    syncIntervalRef.current = setInterval(() => {
      syncTimeData();
    }, 15000);

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      // Ensure timer is stopped on cleanup
      if (startTimeRef.current) {
        stopCurrentTimer();
      }
    };
  }, [attemptId, syncTimeData, stopCurrentTimer]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - stop timer
        stopCurrentTimer();
        console.log('📱 Page hidden - timer paused');
      } else if (currentQuestionId) {
        // Page visible - resume timer for current question
        startQuestionTimer(currentQuestionId);
        console.log('📱 Page visible - timer resumed');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentQuestionId, startQuestionTimer, stopCurrentTimer]);

  // Handle page unload - final sync
  useEffect(() => {
    const handleBeforeUnload = () => {
      stopCurrentTimer();
      // Attempt final sync (may not complete due to page unload)
      if (Object.keys(pendingSyncRef.current).length > 0) {
        navigator.sendBeacon(
          `/api/attempts/${attemptId}/sync-times`,
          JSON.stringify({ questionTimes: pendingSyncRef.current })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [attemptId, stopCurrentTimer]);

  // Get current question time (including active timer)
  const getCurrentQuestionTime = useCallback((questionId) => {
    let totalTime = questionTimes[questionId] || 0;
    
    // Add current session time if this question is active
    if (questionId === currentQuestionId && startTimeRef.current && isTracking) {
      const currentSessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      totalTime += currentSessionTime;
    }
    
    return totalTime;
  }, [questionTimes, currentQuestionId, isTracking]);

  // Get total time for all questions
  const getTotalTime = useCallback(() => {
    return Object.values(questionTimes).reduce((sum, time) => sum + time, 0);
  }, [questionTimes]);

  // Final sync on component unmount
  useEffect(() => {
    return () => {
      stopCurrentTimer();
      syncTimeData();
    };
  }, [stopCurrentTimer, syncTimeData]);

  return {
    startQuestionTimer,
    stopCurrentTimer,
    syncTimeData,
    getCurrentQuestionTime,
    getTotalTime,
    questionTimes,
    currentQuestionId,
    isTracking
  };
};

// Utility function to format time
export const formatTime = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
};