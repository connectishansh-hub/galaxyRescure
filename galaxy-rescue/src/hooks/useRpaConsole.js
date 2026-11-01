/**
 * useRpaConsole.js
 * Hook that manages the RPA console message queue with realistic timing delays.
 */
import { useState, useRef, useCallback } from 'react';

export function useRpaConsole() {
  const [logs, setLogs] = useState([
    { id: 0, text: 'Galaxy Bot v3.1 online.', status: 'IDLE', ts: new Date().toLocaleTimeString() },
    { id: 1, text: 'Awaiting mission commands...', status: 'IDLE', ts: new Date().toLocaleTimeString() },
  ]);
  const [botStatus, setBotStatus] = useState('IDLE');
  const idRef = useRef(100);
  const timeoutsRef = useRef([]);

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  /**
   * Push a sequence of messages with realistic delays.
   * @param {Array<{text, status}>} messages
   * @param {number} baseDelay - ms between messages
   * @param {Function} onComplete - called when all messages are shown
   */
  const pushMessages = useCallback((messages, baseDelay = 600, onComplete) => {
    clearTimeouts();
    setBotStatus('RUNNING');

    messages.forEach((msg, i) => {
      const delay = baseDelay + i * (baseDelay + Math.random() * 200);
      const tid = setTimeout(() => {
        const entry = {
          id: idRef.current++,
          text: msg.text,
          status: msg.status,
          ts: new Date().toLocaleTimeString(),
        };
        setLogs(prev => [...prev.slice(-40), entry]); // keep last 40 lines
        if (msg.status === 'COMPLETED' || msg.status === 'FAILED') {
          setBotStatus(msg.status);
        }
        if (i === messages.length - 1) {
          onComplete?.();
        }
      }, delay);
      timeoutsRef.current.push(tid);
    });
  }, [clearTimeouts]);

  const addLog = useCallback((text, status = 'INFO') => {
    const entry = {
      id: idRef.current++,
      text,
      status,
      ts: new Date().toLocaleTimeString(),
    };
    setLogs(prev => [...prev.slice(-40), entry]);
    if (status !== 'INFO') setBotStatus(status);
  }, []);

  const reset = useCallback(() => {
    clearTimeouts();
    idRef.current = 100;
    setLogs([
      { id: 0, text: 'Galaxy Bot v3.1 online.', status: 'IDLE', ts: new Date().toLocaleTimeString() },
      { id: 1, text: 'System reset. Ready for new mission.', status: 'IDLE', ts: new Date().toLocaleTimeString() },
    ]);
    setBotStatus('IDLE');
  }, [clearTimeouts]);

  return { logs, botStatus, pushMessages, addLog, reset, clearTimeouts };
}
