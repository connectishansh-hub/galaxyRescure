/**
 * Stage2Scanner.jsx  —  REAL RPA Planet Scanner
 * ==============================================
 * Flow:
 *  1. Player sees 3 planets with HIDDEN stats (??? readings)
 *  2. Player clicks "ACTIVATE ROBOTIC PROCESS AUTOMATION"
 *  3. Frontend connects to /api/scan/stream (SSE)
 *     → receives real-time log messages as the bot processes Excel row-by-row
 *     → robot animation plays during scan
 *  4. Bot results are displayed: which planets are in danger + WHY
 *  5. Player manually selects the planets to rescue, then confirms
 *  6. Points awarded based on correctness vs bot's findings
 *
 * If the backend is offline the component falls back to a client-side
 * simulation so the game always works at an event stall.
 */
import React, { useState, useRef, useEffect } from 'react';
import { PLANETS, SCORE_VALUES } from '../data/gameData';

// ── Sub-component: Robot animation ───────────────────────────────────────────
function RobotAnimation({ scanning }) {
  const eyeColor = scanning ? '#00f5ff' : '#4da6ff';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        padding: '16px 20px',
        border: `1px solid ${scanning ? 'var(--neon-cyan)' : 'rgba(77,166,255,0.25)'}`,
        borderRadius: 12,
        background: 'rgba(0,10,30,0.8)',
        boxShadow: scanning ? 'var(--border-glow-cyan)' : 'none',
        transition: 'all 0.3s ease',
        minWidth: 120,
      }}
    >
      {/* Robot SVG */}
      <svg width="64" height="80" viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Antenna */}
        <line x1="32" y1="2" x2="32" y2="12" stroke={eyeColor} strokeWidth="2" />
        <circle cx="32" cy="2" r="3" fill={eyeColor}
          style={{ animation: scanning ? 'blink 0.6s ease-in-out infinite' : 'none' }} />
        {/* Head */}
        <rect x="14" y="12" width="36" height="26" rx="6" fill="#0a1a40"
          stroke={eyeColor} strokeWidth="1.5" />
        {/* Eyes */}
        <circle cx="24" cy="25" r="5" fill={eyeColor} opacity={scanning ? 0.9 : 0.5}
          style={{ animation: scanning ? 'pulse-glow 1s ease-in-out infinite' : 'none' }} />
        <circle cx="40" cy="25" r="5" fill={eyeColor} opacity={scanning ? 0.9 : 0.5}
          style={{ animation: scanning ? 'pulse-glow 1s ease-in-out infinite 0.3s' : 'none' }} />
        {/* Mouth */}
        <rect x="22" y="33" width="20" height="3" rx="1.5"
          fill={scanning ? 'var(--neon-green)' : 'rgba(77,166,255,0.4)'} />
        {/* Body */}
        <rect x="10" y="42" width="44" height="28" rx="6" fill="#0a1a40"
          stroke={eyeColor} strokeWidth="1.5" />
        {/* Chest panel */}
        <rect x="18" y="48" width="12" height="10" rx="2"
          fill={scanning ? 'rgba(0,245,255,0.2)' : 'rgba(77,166,255,0.1)'}
          stroke={eyeColor} strokeWidth="1" />
        <rect x="34" y="48" width="12" height="10" rx="2"
          fill={scanning ? 'rgba(0,255,136,0.2)' : 'rgba(77,166,255,0.1)'}
          stroke="var(--neon-green)" strokeWidth="1" />
        {/* Arms */}
        <rect x="0" y="44" width="8" height="20" rx="4" fill="#0a1a40"
          stroke={eyeColor} strokeWidth="1.5"
          style={{ animation: scanning ? 'bounce 0.8s ease-in-out infinite' : 'none' }} />
        <rect x="56" y="44" width="8" height="20" rx="4" fill="#0a1a40"
          stroke={eyeColor} strokeWidth="1.5"
          style={{ animation: scanning ? 'bounce 0.8s ease-in-out infinite 0.4s' : 'none' }} />
      </svg>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '0.6rem',
        color: scanning ? 'var(--neon-cyan)' : 'var(--text-dim)',
        letterSpacing: '0.1em',
        animation: scanning ? 'blink 1.2s ease-in-out infinite' : 'none',
      }}>
        {scanning ? 'SCANNING...' : 'STANDBY'}
      </div>
    </div>
  );
}

// ── Sub-component: Hidden planet card (before scan) ──────────────────────────
function HiddenPlanetCard({ planet, scanned, botResult, selected, onSelect, scanPhase }) {
  const isScanning = scanPhase === planet.id;

  return (
    <div
      className={`card ${selected ? 'card-glow-cyan' : ''}`}
      onClick={scanned && !selected ? onSelect : (selected ? onSelect : undefined)}
      style={{
        cursor: scanned ? 'pointer' : 'default',
        border: `1px solid ${
          selected ? 'var(--neon-cyan)'
          : botResult?.in_danger ? 'rgba(255,51,102,0.5)'
          : scanned ? 'rgba(0,255,136,0.4)'
          : isScanning ? 'var(--neon-cyan)'
          : 'rgba(77,166,255,0.2)'
        }`,
        boxShadow: isScanning ? 'var(--border-glow-cyan)' : selected ? 'var(--border-glow-cyan)' : 'none',
        transform: selected ? 'translateY(-4px)' : isScanning ? 'translateY(-2px) scale(1.01)' : 'none',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
        position: 'relative',
        animation: botResult ? 'successPop 0.5s ease' : undefined,
      }}
    >
      {/* Scan beam animation */}
      {isScanning && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3, top: 0,
          background: 'linear-gradient(90deg, transparent, var(--neon-cyan), transparent)',
          boxShadow: '0 0 20px var(--neon-cyan)',
          animation: 'scanLine 1s linear infinite',
          zIndex: 10,
        }} />
      )}

      {/* Planet header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: '2rem', lineHeight: 1 }}>{planet.emoji}</div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 700,
            fontSize: '1rem', color: planet.color, marginTop: 4,
            textShadow: `0 0 8px ${planet.color}`,
          }}>
            {planet.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {planet.description}
          </div>
        </div>
        <div>
          {!scanned && !isScanning && (
            <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>UNSCANNED</span>
          )}
          {isScanning && (
            <span className="badge badge-info" style={{ fontSize: '0.65rem', animation: 'blink 0.6s infinite' }}>
              SCANNING
            </span>
          )}
          {scanned && botResult?.in_danger && !selected && (
            <span className="badge badge-danger">DANGER</span>
          )}
          {scanned && !botResult?.in_danger && (
            <span className="badge badge-safe">SAFE</span>
          )}
          {selected && (
            <span className="badge badge-info">SELECTED ✓</span>
          )}
        </div>
      </div>

      {/* Stats — hidden until scanned */}
      <div style={{ marginTop: 8 }}>
        {[
          { label: '💨 Oxygen',  key: 'oxygen',  color: 'var(--neon-cyan)',   threshold: 35 },
          { label: '⚡ Energy',  key: 'energy',  color: 'var(--neon-yellow)', threshold: 25 },
          { label: '🛡️ Shield', key: 'shield',  color: 'var(--neon-blue)',   threshold: 30 },
        ].map(stat => {
          const val = scanned ? planet[stat.key] : null;
          const danger = val !== null && val < stat.threshold;
          return (
            <div key={stat.key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                <span>{stat.label}</span>
                <span style={{ color: danger ? 'var(--neon-red)' : scanned ? 'var(--text-primary)' : 'var(--text-dim)', fontWeight: 700 }}>
                  {scanned ? `${val}%` : isScanning ? '...' : '???'}
                </span>
              </div>
              <div className="progress-bar">
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: scanned ? `${val}%` : '0%',
                  background: danger
                    ? `linear-gradient(90deg, #440011, var(--neon-red))`
                    : `linear-gradient(90deg, ${stat.color}44, ${stat.color})`,
                  boxShadow: `0 0 6px ${danger ? 'var(--neon-red)' : stat.color}`,
                  transition: 'width 0.8s ease',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bot findings */}
      {scanned && botResult && (
        <div style={{
          marginTop: 12, padding: '8px 10px', borderRadius: 6,
          background: botResult.in_danger ? 'rgba(255,51,102,0.08)' : 'rgba(0,255,136,0.08)',
          border: `1px solid ${botResult.in_danger ? 'rgba(255,51,102,0.3)' : 'rgba(0,255,136,0.3)'}`,
        }}>
          <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-display)', color: 'var(--text-secondary)', marginBottom: 4 }}>
            🤖 BOT REPORT:
          </div>
          {botResult.in_danger ? (
            <div>
              {botResult.danger_reasons.map((r, i) => (
                <div key={i} style={{ fontSize: '0.75rem', color: 'var(--neon-red)', marginBottom: 2 }}>
                  ⚠ {r}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: 'var(--neon-green)' }}>
              ✓ All readings within safe parameters
            </div>
          )}
        </div>
      )}

      {/* Select hint */}
      {scanned && botResult?.in_danger && (
        <div style={{
          marginTop: 10, fontSize: '0.72rem',
          color: selected ? 'var(--neon-cyan)' : 'var(--text-dim)',
          textAlign: 'center', fontFamily: 'var(--font-display)', letterSpacing: '0.05em',
        }}>
          {selected ? '✓ MARKED FOR RESCUE' : 'Click to mark for rescue →'}
        </div>
      )}
    </div>
  );
}

// ── Main Stage 2 component ───────────────────────────────────────────────────
export default function Stage2Scanner({ onComplete, pushMessages, onScore, disabled }) {
  // Phase: 'idle' | 'activating' | 'scanning' | 'results' | 'selecting' | 'done'
  const [phase, setPhase] = useState('idle');

  // Live SSE log messages
  const [streamLogs, setStreamLogs] = useState([]);

  // Planet scanned one-by-one — which planetId is currently being scanned
  const [scanPhase, setScanPhase] = useState(null);   // planet.id being highlighted

  // Bot results from backend (or fallback)
  const [botResults, setBotResults] = useState(null); // { P01: {...}, ... } keyed by planet id

  // Which planets the player selects after seeing bot results
  const [playerSelected, setPlayerSelected] = useState([]);

  // Feedback after confirm
  const [scoreFeedback, setScoreFeedback] = useState(null);
  const [pointsAwarded, setPointsAwarded] = useState(false);

  // Backend status
  const [backendMode, setBackendMode] = useState(null);  // string from health check

  const eventSourceRef = useRef(null);
  const scanTimerRef   = useRef(null);

  // Check backend health on mount
  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setBackendMode(d.rpa_mode || 'Python RPA'))
      .catch(() => setBackendMode('Offline — using simulation'));
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(scanTimerRef.current);
    };
  }, []);

  // ── Activate RPA ──────────────────────────────────────────────────────────
  function handleActivate() {
    if (phase !== 'idle' || disabled) return;
    setPhase('activating');
    setStreamLogs([]);

    // Push activation messages to the global RPA console
    pushMessages([
      { text: 'ACTIVATE RPA — Connecting to Galaxy Bot...', status: 'RUNNING' },
      { text: 'Establishing link to planet_data.xlsx...', status: 'RUNNING' },
    ], 500);

    // Small delay then start streaming scan
    scanTimerRef.current = setTimeout(() => startScan(), 1200);
  }

  // ── SSE streaming scan ────────────────────────────────────────────────────
  function startScan() {
    setPhase('scanning');

    // Try SSE streaming from backend
    const es = new EventSource('/api/scan/stream');
    eventSourceRef.current = es;

    // Map to detect per-planet scanning
    const planetNames = { zephyra: 'p1', volcanis: 'p2', crystara: 'p3' };
    const collected = {};

    es.addEventListener('log', e => {
      const data = JSON.parse(e.data);
      setStreamLogs(prev => [...prev, { id: Date.now() + Math.random(), ...data }]);

      // Highlight the planet being scanned
      const lower = data.text.toLowerCase();
      for (const [name, pid] of Object.entries(planetNames)) {
        if (lower.includes(name)) {
          setScanPhase(pid);
          break;
        }
      }

      // Mirror key messages to global console
      if (data.text.includes('Initializing') || data.text.includes('complete') || data.text.includes('Analysis')) {
        pushMessages([{ text: data.text, status: data.status }], 100);
      }
    });

    es.addEventListener('done', e => {
      const data = JSON.parse(e.data);
      es.close();
      setScanPhase(null);
      processBotResults(data.planets, data.rpa_mode || 'Python RPA');
    });

    es.addEventListener('error', () => {
      es.close();
      // Backend offline — run client-side simulation
      runFallbackScan();
    });

    // Timeout safety — if SSE hangs, fall back
    scanTimerRef.current = setTimeout(() => {
      if (phase === 'scanning') {
        es.close();
        runFallbackScan();
      }
    }, 20000);
  }

  // ── Fallback: client-side simulation ─────────────────────────────────────
  function runFallbackScan() {
    setBackendMode('Simulation (backend offline)');

    // Simulate scanning planet-by-planet with delays
    const steps = [
      { text: 'Initializing Galaxy Bot v3.1 (simulation mode)...', status: 'RUNNING', delay: 600 },
      { text: 'Reading planet_data.xlsx (local dataset)...', status: 'RUNNING', delay: 700 },
      { text: 'Thresholds: O2<35% | Energy<25% | Shield<30%', status: 'RUNNING', delay: 600 },
      { text: '[Row 1] Scanning planet: Zephyra...', status: 'RUNNING', delay: 700, planet: 'p1' },
      { text: '  -> Zephyra: IN DANGER — O2=28% critical', status: 'RUNNING', delay: 600 },
      { text: '[Row 2] Scanning planet: Volcanis...', status: 'RUNNING', delay: 700, planet: 'p2' },
      { text: '  -> Volcanis: IN DANGER — Energy=18% critical | Shield=22% critical', status: 'RUNNING', delay: 600 },
      { text: '[Row 3] Scanning planet: Crystara...', status: 'RUNNING', delay: 700, planet: 'p3' },
      { text: '  -> Crystara: SAFE — All readings nominal', status: 'RUNNING', delay: 600 },
      { text: 'Analysis complete. 2 planet(s) require immediate rescue.', status: 'RUNNING', delay: 800 },
      { text: 'RPA scan completed successfully.', status: 'COMPLETED', delay: 500 },
    ];

    let accDelay = 0;
    steps.forEach(step => {
      accDelay += step.delay;
      scanTimerRef.current = setTimeout(() => {
        setStreamLogs(prev => [...prev, { id: Date.now() + Math.random(), text: step.text, status: step.status }]);
        if (step.planet) setScanPhase(step.planet);
      }, accDelay);
    });

    const totalDelay = accDelay + 500;
    setTimeout(() => {
      setScanPhase(null);
      // Fallback results — match gameData.js exactly
      const fallbackPlanets = [
        { id: 'P01', name: 'Zephyra',  oxygen: 28, energy: 72, shield: 85,
          in_danger: true,  danger_reasons: ['O2=28% critical (<35%)'] },
        { id: 'P02', name: 'Volcanis', oxygen: 61, energy: 18, shield: 22,
          in_danger: true,  danger_reasons: ['Energy=18% critical (<25%)', 'Shield=22% critical (<30%)'] },
        { id: 'P03', name: 'Crystara', oxygen: 78, energy: 64, shield: 71,
          in_danger: false, danger_reasons: [] },
      ];
      processBotResults(fallbackPlanets, 'Simulation (backend offline)');
    }, totalDelay);
  }

  // ── Process results from bot ─────────────────────────────────────────────
  function processBotResults(rawPlanets, mode) {
    setBackendMode(mode);
    // Build a lookup keyed by game planet id (p1/p2/p3)
    const nameToId = { zephyra: 'p1', volcanis: 'p2', crystara: 'p3' };
    const resultMap = {};
    rawPlanets.forEach(rp => {
      const key = nameToId[rp.name?.toLowerCase()] || rp.id?.toLowerCase();
      resultMap[key] = rp;
    });
    setBotResults(resultMap);
    setPhase('results');

    pushMessages([
      { text: 'Bot scan complete. Displaying planetary threat assessment.', status: 'COMPLETED' },
      { text: 'Awaiting commander rescue confirmation...', status: 'IDLE' },
    ], 400);
  }

  // ── Player confirms rescue selection ─────────────────────────────────────
  function handleConfirmRescue() {
    if (disabled || pointsAwarded) return;

    // Correct answers = planets the bot identified as in-danger
    const dangerIds = botResults
      ? Object.entries(botResults)
          .filter(([, r]) => r.in_danger)
          .map(([pid]) => pid)
      : [];

    const correctSelections = playerSelected.filter(id => dangerIds.includes(id));
    const falsePositives    = playerSelected.filter(id => !dangerIds.includes(id));

    let pts = correctSelections.length * SCORE_VALUES.STAGE2_CORRECT_PLANET;
    onScore(pts);
    setPointsAwarded(true);

    const allCorrect = correctSelections.length === dangerIds.length && falsePositives.length === 0;
    const anyCorrect = correctSelections.length > 0;

    setScoreFeedback({
      type: allCorrect ? 'success' : anyCorrect ? 'warning' : 'error',
      text: allCorrect
        ? `Perfect! You confirmed all ${dangerIds.length} danger planets. +${pts} pts`
        : anyCorrect
        ? `Partial: ${correctSelections.length}/${dangerIds.length} correct${falsePositives.length ? `, ${falsePositives.length} false positive(s)` : ''}. +${pts} pts`
        : `Incorrect selections. Review the bot report carefully. +0 pts`,
    });

    pushMessages([
      { text: 'Operator rescue confirmation received.', status: 'RUNNING' },
      { text: `Correct identifications: ${correctSelections.length}/${dangerIds.length}`, status: 'RUNNING' },
      { text: allCorrect ? 'Excellent mission accuracy!' : 'Partial accuracy — proceeding.', status: 'COMPLETED' },
    ], 300);

    setPhase('done');
  }

  function toggleSelect(pid) {
    if (phase !== 'results' || disabled) return;
    setPlayerSelected(prev =>
      prev.includes(pid) ? prev.filter(x => x !== pid) : [...prev, pid]
    );
  }

  // ── ID mapping: game planet id → bot result ──────────────────────────────
  function getBotResult(planet) {
    if (!botResults) return null;
    // Try direct key (p1/p2/p3) or by name
    return botResults[planet.id] ||
      botResults[planet.name.toLowerCase()] ||
      null;
  }

  const isScanned = (planet) => !!getBotResult(planet);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fadeIn">
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 6 }}>🔭</div>
        <h2 className="neon-cyan" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: 6 }}>
          STAGE 2 — PLANET SCANNER
        </h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 580, margin: '0 auto', lineHeight: 1.6, fontSize: '0.9rem' }}>
          {phase === 'idle'
            ? 'Planet data is classified. Activate the RPA bot to scan the planetary database and reveal which worlds are in danger.'
            : phase === 'scanning' || phase === 'activating'
            ? '⚙️ Galaxy Bot is scanning the planetary database. Watch the bot read each planet\'s vitals from the Excel file…'
            : 'Bot scan complete. Review the RPA report, then select the planets that need rescuing and confirm.'}
        </p>
      </div>

      {/* Backend mode badge */}
      {backendMode && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <div style={{
            padding: '4px 14px', borderRadius: 20, fontSize: '0.7rem',
            fontFamily: 'var(--font-display)', letterSpacing: '0.08em',
            background: backendMode.includes('Offline') || backendMode.includes('Simulation')
              ? 'rgba(255,215,0,0.1)' : 'rgba(0,255,136,0.1)',
            border: `1px solid ${backendMode.includes('Offline') || backendMode.includes('Simulation')
              ? 'rgba(255,215,0,0.4)' : 'rgba(0,255,136,0.4)'}`,
            color: backendMode.includes('Offline') || backendMode.includes('Simulation')
              ? 'var(--neon-yellow)' : 'var(--neon-green)',
          }}>
            🤖 RPA Engine: {backendMode}
          </div>
        </div>
      )}

      {/* ── IDLE: Show locked planets + Activate button ── */}
      {(phase === 'idle') && (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16, marginBottom: 28,
          }}>
            {PLANETS.map(planet => (
              <HiddenPlanetCard
                key={planet.id}
                planet={planet}
                scanned={false}
                botResult={null}
                selected={false}
                onSelect={() => {}}
                scanPhase={null}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-purple btn-large"
              onClick={handleActivate}
              disabled={disabled}
              style={{ fontSize: '1rem', padding: '18px 40px', letterSpacing: '0.15em' }}
            >
              🤖 ACTIVATE ROBOTIC PROCESS AUTOMATION
            </button>
            <div style={{ marginTop: 10, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              The bot will read planet_data.xlsx and evaluate each planet's oxygen, energy, and shield levels.
            </div>
          </div>
        </>
      )}

      {/* ── SCANNING: Robot animation + live log ── */}
      {(phase === 'scanning' || phase === 'activating') && (
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left: robot + planet cards */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <RobotAnimation scanning />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-display)', color: 'var(--neon-cyan)', fontSize: '0.8rem', letterSpacing: '0.1em', marginBottom: 8 }}>
                  SCANNING IN PROGRESS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {PLANETS.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', gap: 8, alignItems: 'center', padding: '6px 10px',
                      borderRadius: 6,
                      background: scanPhase === p.id ? 'rgba(0,245,255,0.08)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${scanPhase === p.id ? 'var(--neon-cyan)' : 'rgba(77,166,255,0.1)'}`,
                      transition: 'all 0.3s ease',
                    }}>
                      <span>{p.emoji}</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.78rem', color: scanPhase === p.id ? 'var(--neon-cyan)' : 'var(--text-secondary)' }}>
                        {p.name}
                      </span>
                      {scanPhase === p.id && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: 'var(--neon-cyan)', animation: 'blink 0.5s infinite' }}>
                          ◉ READING...
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right: live stream log */}
          <div style={{
            flex: 1, minWidth: 260,
            background: 'rgba(0,5,20,0.95)', borderRadius: 8,
            border: '1px solid rgba(0,245,255,0.2)',
            padding: '12px 14px', fontFamily: 'monospace', fontSize: '0.78rem',
            maxHeight: 220, overflowY: 'auto',
          }}>
            <div style={{ color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: 8, borderBottom: '1px solid rgba(0,245,255,0.1)', paddingBottom: 6 }}>
              📡 LIVE RPA STREAM
            </div>
            {streamLogs.map(log => (
              <div key={log.id} style={{
                color: log.status === 'COMPLETED' ? 'var(--neon-green)'
                     : log.status === 'FAILED' ? 'var(--neon-red)'
                     : 'var(--text-secondary)',
                marginBottom: 3, animation: 'slideIn 0.2s ease',
              }}>
                {log.status === 'COMPLETED' ? '✓' : '›'} {log.text}
              </div>
            ))}
            <div style={{ color: 'var(--neon-cyan)', animation: 'blink 0.8s step-end infinite' }}>▋</div>
          </div>
        </div>
      )}

      {/* ── RESULTS + SELECTING: Show all planets with bot data ── */}
      {(phase === 'results' || phase === 'done') && (
        <>
          {/* Result summary banner */}
          {phase === 'results' && (
            <div className="feedback-banner feedback-info animate-successPop" style={{ marginBottom: 20 }}>
              🤖 RPA scan complete! The bot has identified the planetary threat status.
              Now select which planets need rescuing and click <strong>CONFIRM RESCUE</strong>.
            </div>
          )}

          {/* Planet grid with full data */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16, marginBottom: 24,
          }}>
            {PLANETS.map(planet => (
              <HiddenPlanetCard
                key={planet.id}
                planet={planet}
                scanned={isScanned(planet)}
                botResult={getBotResult(planet)}
                selected={playerSelected.includes(planet.id)}
                onSelect={() => toggleSelect(planet.id)}
                scanPhase={null}
              />
            ))}
          </div>

          {/* Selection summary */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 16 }}>
            {playerSelected.length === 0 ? (
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                Click on a danger planet card to mark it for rescue
              </span>
            ) : (
              playerSelected.map(id => {
                const p = PLANETS.find(x => x.id === id);
                return (
                  <span key={id} className="badge badge-warning" style={{ fontSize: '0.8rem', padding: '5px 14px' }}>
                    {p?.emoji} {p?.name} — marked for rescue
                  </span>
                );
              })
            )}
          </div>

          {/* Score feedback */}
          {scoreFeedback && (
            <div className={`feedback-banner feedback-${scoreFeedback.type} animate-successPop`} style={{ marginBottom: 16 }}>
              {scoreFeedback.text}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {phase === 'results' && (
              <>
                <button
                  className="btn btn-cyan btn-large"
                  onClick={handleConfirmRescue}
                  disabled={playerSelected.length === 0 || disabled}
                >
                  🛸 CONFIRM RESCUE SELECTION
                </button>
                {playerSelected.length > 0 && (
                  <button className="btn btn-blue btn-sm" onClick={() => setPlayerSelected([])}>
                    Clear Selection
                  </button>
                )}
              </>
            )}
            {phase === 'done' && (
              <button className="btn btn-green btn-large" onClick={onComplete} disabled={disabled}>
                PROCEED TO ALIEN ATTACK →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
