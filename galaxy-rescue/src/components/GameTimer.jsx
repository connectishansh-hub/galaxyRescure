/**
 * GameTimer.jsx
 * Displays the countdown with colour-coded urgency levels.
 */
import React from 'react';
import { formatTime } from '../utils/leaderboard';

export default function GameTimer({ secondsLeft, duration }) {
  const pct = Math.max(0, Math.min(100, (secondsLeft / duration) * 100));
  const isUrgent = secondsLeft <= 60;
  const isCritical = secondsLeft <= 20;

  let colorClass = 'progress-fill-cyan';
  let textClass = 'neon-cyan';
  if (isUrgent) { colorClass = 'progress-fill-red'; textClass = 'neon-red'; }

  return (
    <div className="card" style={{ minWidth: 160, textAlign: 'center' }}>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', marginBottom: 6 }}>
        TIME REMAINING
      </div>
      <div
        className={textClass}
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2rem',
          fontWeight: 900,
          animation: isCritical ? 'blink 0.6s ease-in-out infinite' : 'none',
          marginBottom: 8,
        }}
      >
        {formatTime(secondsLeft)}
      </div>
      <div className="progress-bar">
        <div
          className={`progress-fill ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
