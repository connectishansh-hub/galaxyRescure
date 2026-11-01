/**
 * ProgressBar.jsx
 * Stage progress indicator (5 stages shown as steps).
 */
import React from 'react';

const STAGES = [
  { n: 1, label: 'Launch', emoji: '🚀' },
  { n: 2, label: 'Scan',   emoji: '🔭' },
  { n: 3, label: 'Attack', emoji: '👾' },
  { n: 4, label: 'Rescue', emoji: '🛸' },
  { n: 5, label: 'Done',   emoji: '🏆' },
];

export default function ProgressBar({ currentStage }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
      {STAGES.map((s, i) => {
        const done = currentStage > s.n;
        const active = currentStage === s.n;
        return (
          <React.Fragment key={s.n}>
            {/* Step node */}
            <div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                position: 'relative', zIndex: 1,
              }}
            >
              <div
                style={{
                  width: 40, height: 40, borderRadius: '50%',
                  border: `2px solid ${done ? 'var(--neon-green)' : active ? 'var(--neon-cyan)' : 'rgba(77,166,255,0.3)'}`,
                  background: done ? 'rgba(0,255,136,0.15)' : active ? 'rgba(0,245,255,0.1)' : 'transparent',
                  boxShadow: done ? 'var(--border-glow-green)' : active ? 'var(--border-glow-cyan)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem',
                  transition: 'all 0.4s ease',
                }}
              >
                {done ? '✓' : s.emoji}
              </div>
              <div
                style={{
                  fontSize: '0.6rem', fontFamily: 'var(--font-display)',
                  color: done ? 'var(--neon-green)' : active ? 'var(--neon-cyan)' : 'var(--text-dim)',
                  letterSpacing: '0.05em',
                }}
              >
                {s.label}
              </div>
            </div>
            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <div
                style={{
                  flex: 1, height: 2, marginBottom: 20,
                  background: done
                    ? 'linear-gradient(90deg, var(--neon-green), rgba(0,255,136,0.4))'
                    : 'rgba(77,166,255,0.15)',
                  transition: 'background 0.4s ease',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
