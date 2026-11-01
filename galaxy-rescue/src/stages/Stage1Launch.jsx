/**
 * Stage1Launch.jsx
 * Stage 1: Mission Launch — RPA task assignment simulation.
 * Player clicks "Launch Mission" to trigger the bot sequence.
 */
import React, { useState } from 'react';
import { PLANETS, RPA_MESSAGES } from '../data/gameData';
import PlanetCard from '../components/PlanetCard';

export default function Stage1Launch({ onComplete, pushMessages, disabled }) {
  const [launched, setLaunched] = useState(false);
  const [done, setDone] = useState(false);

  function handleLaunch() {
    if (launched || disabled) return;
    setLaunched(true);
    pushMessages(RPA_MESSAGES.stage1, 500, () => {
      setDone(true);
    });
  }

  return (
    <div className="animate-fadeIn">
      {/* Stage header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🚀</div>
        <h2 className="neon-cyan" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: 8 }}>
          STAGE 1 — MISSION LAUNCH
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
          The Galaxy Bot will assign rescue tasks to each planet. Click{' '}
          <strong style={{ color: 'var(--neon-cyan)' }}>LAUNCH MISSION</strong> to initiate the RPA workflow.
        </p>
      </div>

      {/* Planet overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {PLANETS.map((planet, i) => (
          <div key={planet.id} style={{ animationDelay: `${i * 0.1}s` }}>
            <PlanetCard planet={planet} animated />
          </div>
        ))}
      </div>

      {/* Task assignment display */}
      {launched && (
        <div className="card animate-slideIn" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-purple)', letterSpacing: '0.15em', marginBottom: 12 }}>
            📋 TASK ASSIGNMENT LOG
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PLANETS.map(p => (
              <div key={p.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', borderRadius: 6, background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.1)' }}>
                <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', color: p.color || 'var(--neon-cyan)', flex: 1 }}>{p.name}</span>
                <span className="badge badge-info">TASK ASSIGNED</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action button / Continue */}
      <div style={{ textAlign: 'center' }}>
        {!launched ? (
          <button
            className="btn btn-cyan btn-large"
            onClick={handleLaunch}
            disabled={disabled}
          >
            🚀 LAUNCH MISSION
          </button>
        ) : !done ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--neon-cyan)' }}>
            <div className="animate-spin" style={{ fontSize: '1.5rem' }}>⚙️</div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', letterSpacing: '0.1em' }}>
              GALAXY BOT IS ASSIGNING TASKS...
            </span>
          </div>
        ) : (
          <div className="animate-successPop">
            <div className="feedback-banner feedback-success" style={{ marginBottom: 16 }}>
              ✓ All tasks assigned! Galaxy Bot is ready. Proceeding to Planet Scanner...
            </div>
            <button
              className="btn btn-green btn-large"
              onClick={onComplete}
              disabled={disabled}
            >
              PROCEED TO PLANET SCANNER →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
