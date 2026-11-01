/**
 * PlanetCard.jsx
 * Displays a single planet with health bars, danger status, and animations.
 */
import React from 'react';
import { DANGER_THRESHOLDS } from '../data/gameData';

function StatBar({ label, value, color, threshold }) {
  const danger = threshold && value < threshold;
  const barColor = danger ? 'var(--neon-red)' : color;
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ color: danger ? 'var(--neon-red)' : 'var(--text-primary)', fontWeight: 700 }}>{value}%</span>
      </div>
      <div className="progress-bar">
        <div
          style={{
            height: '100%', borderRadius: 3,
            width: `${value}%`,
            background: `linear-gradient(90deg, ${barColor}44, ${barColor})`,
            boxShadow: `0 0 6px ${barColor}`,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function PlanetCard({ planet, selected, onClick, showStats = false, saved, animated }) {
  const { name, emoji, color, glowColor, description, oxygen, energy, shield, inDanger } = planet;
  const isDanger = inDanger;

  return (
    <div
      className={`card ${animated ? 'animate-fadeIn' : ''}`}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
        border: `1px solid ${selected ? 'var(--neon-cyan)' : saved ? 'var(--neon-green)' : isDanger ? 'var(--neon-red)' : 'rgba(77,166,255,0.25)'}`,
        boxShadow: selected
          ? 'var(--border-glow-cyan)'
          : saved
          ? 'var(--border-glow-green)'
          : isDanger
          ? '0 0 12px rgba(255,51,102,0.4)'
          : 'none',
        transition: 'all 0.25s ease',
        transform: selected ? 'translateY(-4px)' : 'none',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
        animation: saved ? 'successPop 0.5s ease' : undefined,
      }}
    >
      {/* Planet glow behind */}
      <div
        style={{
          position: 'absolute', top: -20, right: -20,
          width: 100, height: 100, borderRadius: '50%',
          background: `radial-gradient(circle, ${glowColor}, transparent 70%)`,
          opacity: 0.4, pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{emoji}</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color, marginTop: 4, textShadow: `0 0 8px ${color}` }}>
            {name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{description}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          {isDanger && !saved && <span className="badge badge-danger">DANGER</span>}
          {!isDanger && !saved && <span className="badge badge-safe">STABLE</span>}
          {saved && <span className="badge badge-safe">RESCUED ✓</span>}
          {selected && <span style={{ fontSize: '1.1rem' }}>✅</span>}
        </div>
      </div>

      {/* Stats */}
      {showStats && (
        <div style={{ marginTop: 12 }}>
          <StatBar label="💨 Oxygen" value={oxygen} color="var(--neon-cyan)" threshold={DANGER_THRESHOLDS.oxygen} />
          <StatBar label="⚡ Energy" value={energy} color="var(--neon-yellow)" threshold={DANGER_THRESHOLDS.energy} />
          <StatBar label="🛡️ Shield" value={shield} color="var(--neon-blue)" threshold={DANGER_THRESHOLDS.shield} />
        </div>
      )}
    </div>
  );
}
