/**
 * RpaConsole.jsx
 * Live task log panel that mimics an RPA automation console.
 * Purely visual — all logic is client-side.
 */
import React, { useEffect, useRef } from 'react';

const STATUS_COLORS = {
  IDLE:      'var(--text-dim)',
  RUNNING:   'var(--neon-cyan)',
  COMPLETED: 'var(--neon-green)',
  FAILED:    'var(--neon-red)',
  INFO:      'var(--neon-blue)',
};

const STATUS_ICONS = {
  IDLE:      '○',
  RUNNING:   '◉',
  COMPLETED: '✓',
  FAILED:    '✗',
  INFO:      '◈',
};

export default function RpaConsole({ logs, botStatus }) {
  const bottomRef = useRef(null);

  // Auto-scroll to latest log
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div
      className="card"
      style={{
        background: 'rgba(0, 5, 20, 0.95)',
        border: '1px solid rgba(0,245,255,0.2)',
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        minHeight: 220,
        maxHeight: 280,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Console header */}
      <div
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingBottom: 10, borderBottom: '1px solid rgba(0,245,255,0.1)',
          marginBottom: 10,
        }}
      >
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '0.1em' }}>
          🤖 RPA CONSOLE — GALAXY BOT v3.1
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: STATUS_COLORS[botStatus] || 'var(--text-dim)',
              boxShadow: `0 0 8px ${STATUS_COLORS[botStatus] || 'transparent'}`,
              animation: botStatus === 'RUNNING' ? 'blink 0.8s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: '0.7rem', color: STATUS_COLORS[botStatus], fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            {botStatus}
          </span>
        </div>
      </div>

      {/* Log entries */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {logs.map(log => (
          <div
            key={log.id}
            style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '2px 0',
              color: log.status === 'COMPLETED' ? 'var(--neon-green)'
                   : log.status === 'FAILED'    ? 'var(--neon-red)'
                   : log.status === 'IDLE'      ? 'var(--text-dim)'
                   : 'var(--text-secondary)',
              animation: 'slideIn 0.2s ease',
            }}
          >
            <span style={{ color: STATUS_COLORS[log.status], flexShrink: 0, marginTop: 1 }}>
              {STATUS_ICONS[log.status] || '·'}
            </span>
            <span style={{ color: 'var(--text-dim)', flexShrink: 0 }}>[{log.ts}]</span>
            <span>{log.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Blinking cursor */}
      {botStatus === 'RUNNING' && (
        <div style={{ color: 'var(--neon-cyan)', marginTop: 4, animation: 'blink 0.8s step-end infinite' }}>
          ▋
        </div>
      )}

      <div style={{ borderTop: '1px solid rgba(0,245,255,0.08)', marginTop: 8, paddingTop: 6, fontSize: '0.65rem', color: 'var(--text-dim)' }}>
        ⚠ Prototype: All automation is simulated client-side. No external RPA service is connected.
      </div>
    </div>
  );
}
