/**
 * useGameTimer.js
 * Custom hook: countdown timer using deadline timestamps to avoid drift.
 * Returns { secondsLeft, isRunning, startTimer, stopTimer, resetTimer }
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { GAME_CONFIG } from '../data/gameData';

export function useGameTimer(onExpire) {
  const duration = GAME_CONFIG.USE_DEV_DURATION
    ? GAME_CONFIG.DEV_DURATION_SECONDS
    : GAME_CONFIG.DURATION_SECONDS;

  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const deadlineRef = useRef(null);
  const intervalRef = useRef(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const stopTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    if (intervalRef.current) return; // already running
    deadlineRef.current = Date.now() + secondsLeft * 1000;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsRunning(false);
        onExpireRef.current?.();
      }
    }, 500); // tick every 500ms for smooth display
  }, [secondsLeft]);

  const resetTimer = useCallback(() => {
    stopTimer();
    setSecondsLeft(duration);
    deadlineRef.current = null;
  }, [stopTimer, duration]);

  // Cleanup on unmount
  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return { secondsLeft, isRunning, startTimer, stopTimer, resetTimer, duration };
}
