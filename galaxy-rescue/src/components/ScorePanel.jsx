/**
 * ScorePanel.jsx
 * Shows current score, stage label, and player name.
 */
import React from 'react';

const STAGE_LABELS = ['', 'Mission Launch', 'Planet Scanner', 'Alien Attack', 'Galaxy Rescue', 'Mission Complete'];

export default function ScorePanel({ score, stage, playerName }) {
  return (
    <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>COMMANDER</div>
        <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>
          {playerName}
        </div>
      </div>
      <div style={{ width: 1, height: 36, background: 'rgba(77,166,255,0.2)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>SCORE</div>
        <div style={{ color: 'var(--neon-yellow)', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.6rem', textShadow: '0 0 15px var(--neon-yellow)' }}>
          {score.toLocaleString()}
        </div>
      </div>
      <div style={{ width: 1, height: 36, background: 'rgba(77,166,255,0.2)' }} />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em' }}>STAGE</div>
        <div style={{ color: 'var(--neon-purple)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', marginTop: 4 }}>
          {stage}/5 · {STAGE_LABELS[stage] || ''}
        </div>
      </div>
    </div>
  );
}
