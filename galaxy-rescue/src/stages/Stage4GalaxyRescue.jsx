/**
 * Stage4GalaxyRescue.jsx
 * Stage 4: Resource allocation to save planets.
 * Player must check the right resources for each planet's needs.
 */
import React, { useState } from 'react';
import { PLANETS, RESOURCES, PLANET_RESCUE_REQUIREMENTS, RPA_MESSAGES, SCORE_VALUES } from '../data/gameData';

export default function Stage4GalaxyRescue({ onComplete, pushMessages, onScore, onPlanetsSaved, disabled }) {
  // Track which resources are allocated to which planet
  // State: { planetId: Set<resourceId> }
  const [allocations, setAllocations] = useState(() => {
    const init = {};
    PLANETS.forEach(p => { init[p.id] = new Set(); });
    return init;
  });

  const [allocating, setAllocating] = useState(false);
  const [results, setResults] = useState(null);       // null | {savedIds, pointsAwarded}
  const [pointsAwarded, setPointsAwarded] = useState(false);

  function toggleResource(planetId, resourceId) {
    if (allocating || results || disabled) return;
    setAllocations(prev => {
      const updated = { ...prev };
      const set = new Set(prev[planetId]);
      if (set.has(resourceId)) set.delete(resourceId);
      else set.add(resourceId);
      updated[planetId] = set;
      return updated;
    });
  }

  function handleAllocate() {
    if (allocating || disabled) return;
    setAllocating(true);

    pushMessages(RPA_MESSAGES.stage4, 500, () => {
      // Evaluate which planets get saved
      const savedIds = [];
      PLANETS.forEach(p => {
        const required = PLANET_RESCUE_REQUIREMENTS[p.id] || [];
        const given = allocations[p.id];
        const allMet = required.every(r => given.has(r));
        if (allMet) savedIds.push(p.id);
      });

      // Score
      let pts = 0;
      if (!pointsAwarded) {
        pts = savedIds.length * SCORE_VALUES.STAGE4_PLANET_SAVED;
        if (pts > 0) onScore(pts);
        setPointsAwarded(true);
      }

      onPlanetsSaved(savedIds);
      setResults({ savedIds, pts });
      setAllocating(false);
    });
  }

  // Danger planets that need resources
  const dangerPlanets = PLANETS.filter(p => p.inDanger);
  const safePlanets = PLANETS.filter(p => !p.inDanger);

  return (
    <div className="animate-fadeIn">
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🛸</div>
        <h2 className="neon-purple" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: 8 }}>
          STAGE 4 — GALAXY RESCUE
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Allocate the correct rescue resources to each planet in danger.
          Match the <span className="neon-cyan">planet's needs</span> with the{' '}
          <span className="neon-yellow">available resources</span> to save them.
        </p>
      </div>

      {/* Resource inventory */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-yellow)', letterSpacing: '0.15em', marginBottom: 12 }}>
          📦 RESOURCE DEPOT INVENTORY
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {RESOURCES.map(r => (
            <div key={r.id} style={{ padding: '8px 16px', borderRadius: 8, background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>{r.emoji}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--neon-yellow)', fontFamily: 'var(--font-display)' }}>{r.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Qty: {r.quantity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Planet allocation panels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {PLANETS.map(planet => {
          const required = PLANET_RESCUE_REQUIREMENTS[planet.id] || [];
          const given = allocations[planet.id];
          const isSaved = results?.savedIds?.includes(planet.id);
          const isNotSaved = results && !isSaved;

          return (
            <div
              key={planet.id}
              className="card"
              style={{
                border: `1px solid ${isSaved ? 'var(--neon-green)' : isNotSaved ? 'var(--neon-red)' : planet.inDanger ? 'rgba(255,51,102,0.4)' : 'rgba(0,255,136,0.2)'}`,
                boxShadow: isSaved ? 'var(--border-glow-green)' : isNotSaved ? 'var(--border-glow-red)' : 'none',
                transition: 'all 0.4s ease',
                animation: isSaved ? 'successPop 0.5s ease' : undefined,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: '2rem' }}>{planet.emoji}</span>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: planet.color || 'var(--neon-cyan)', fontSize: '1rem' }}>{planet.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{planet.description}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {isSaved && <span className="badge badge-safe" style={{ fontSize: '0.8rem' }}>RESCUED ✓</span>}
                  {isNotSaved && <span className="badge badge-danger" style={{ fontSize: '0.8rem' }}>NOT SAVED ✗</span>}
                  {planet.inDanger && !results && <span className="badge badge-danger">DANGER</span>}
                  {!planet.inDanger && !results && <span className="badge badge-safe">STABLE</span>}
                </div>
              </div>

              {/* Required resources */}
              {required.length > 0 ? (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 6, fontFamily: 'var(--font-display)' }}>NEEDS:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {required.map(rid => {
                      const res = RESOURCES.find(r => r.id === rid);
                      return (
                        <span key={rid} style={{ fontSize: '0.78rem', padding: '3px 10px', borderRadius: 20, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.4)', color: 'var(--neon-red)' }}>
                          {res?.emoji} {res?.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.78rem', color: 'var(--neon-green)', marginBottom: 12 }}>✓ No resources needed (stable planet)</div>
              )}

              {/* Resource checkboxes */}
              {!results && (
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>ALLOCATE RESOURCES:</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {RESOURCES.map(res => {
                      const checked = given.has(res.id);
                      return (
                        <div
                          key={res.id}
                          className={`custom-checkbox ${checked ? 'checked' : ''}`}
                          onClick={() => toggleResource(planet.id, res.id)}
                          style={{ flex: '1 1 auto', minWidth: 140 }}
                        >
                          <div className="checkbox-box">
                            {checked && <span style={{ color: '#000', fontSize: '0.85rem', fontWeight: 900 }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '0.85rem' }}>{res.emoji} {res.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Results summary */}
      {results && (
        <div className={`feedback-banner ${results.savedIds.length === PLANETS.filter(p => p.inDanger).length ? 'feedback-success' : results.savedIds.length > 0 ? 'feedback-warning' : 'feedback-error'} animate-successPop`} style={{ marginBottom: 16 }}>
          {results.savedIds.length} / {PLANETS.length} planets rescued.
          {results.pts > 0 && ` +${results.pts} pts`}
          {results.savedIds.length < PLANETS.filter(p => p.inDanger).length && (
            <div style={{ marginTop: 6, fontSize: '0.85rem' }}>
              💡 Hint: Check which resources each danger planet requires.
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ textAlign: 'center' }}>
        {!results ? (
          <button
            className="btn btn-purple btn-large"
            onClick={handleAllocate}
            disabled={allocating || disabled}
          >
            {allocating ? '⚙️ ALLOCATING...' : '🛸 DISPATCH RESCUE DRONES'}
          </button>
        ) : (
          <button className="btn btn-green btn-large" onClick={onComplete} disabled={disabled}>
            VIEW MISSION RESULTS →
          </button>
        )}
      </div>
    </div>
  );
}
