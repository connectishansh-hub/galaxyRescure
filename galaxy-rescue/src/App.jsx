/**
 * App.jsx
 * Root game controller.
 * Manages overall game state, stage transitions, scoring, and timer.
 */
import React, { useState, useCallback } from 'react';
import './styles/global.css';

import Starfield from './components/Starfield';
import GameTimer from './components/GameTimer';
import ScorePanel from './components/ScorePanel';
import ProgressBar from './components/ProgressBar';
import RpaConsole from './components/RpaConsole';

import WelcomeScreen from './stages/WelcomeScreen';
import Stage1Launch from './stages/Stage1Launch';
import Stage2Scanner from './stages/Stage2Scanner';
import Stage3AlienAttack from './stages/Stage3AlienAttack';
import Stage4GalaxyRescue from './stages/Stage4GalaxyRescue';
import Stage5Results from './stages/Stage5Results';

import { useGameTimer } from './hooks/useGameTimer';
import { useRpaConsole } from './hooks/useRpaConsole';

// Game phase constants
const PHASE = {
  WELCOME: 0,
  PLAYING: 1,
  RESULTS: 2,
};

export default function App() {
  const [phase, setPhase] = useState(PHASE.WELCOME);
  const [playerName, setPlayerName] = useState('');
  const [stage, setStage] = useState(1);       // 1–5
  const [score, setScore] = useState(0);
  const [planetsRescued, setPlanetsRescued] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [savedPlanetIds, setSavedPlanetIds] = useState([]);

  // Timer
  const handleExpire = useCallback(() => {
    if (!gameEnded) {
      setTimedOut(true);
      setGameEnded(true);
      setPhase(PHASE.RESULTS);
    }
  }, [gameEnded]);

  const { secondsLeft, isRunning, startTimer, stopTimer, resetTimer, duration } = useGameTimer(handleExpire);

  // RPA console
  const { logs, botStatus, pushMessages, addLog, reset: resetConsole } = useRpaConsole();

  // ── Start game ──────────────────────────────────────────────────────────
  function handleStart(name) {
    setPlayerName(name);
    setStage(1);
    setScore(0);
    setPlanetsRescued(0);
    setTimedOut(false);
    setGameEnded(false);
    setSavedPlanetIds([]);
    resetConsole();
    resetTimer();
    setPhase(PHASE.PLAYING);
    // Small delay so the dashboard mounts, then start timer
    setTimeout(() => startTimer(), 100);
  }

  // ── Stage advancement (guard against double-calls) ───────────────────────
  const stageLockedRef = React.useRef(false);
  function advanceStage() {
    if (gameEnded || stageLockedRef.current) return;
    stageLockedRef.current = true;
    setTimeout(() => { stageLockedRef.current = false; }, 800);

    setStage(prev => {
      const next = prev + 1;
      if (next > 4) {
        // Final results
        stopTimer();
        setGameEnded(true);
        setPhase(PHASE.RESULTS);
        return 5;
      }
      return next;
    });
  }

  // ── Scoring guard (prevent duplicate awards) ──────────────────────────
  function addScore(pts) {
    if (gameEnded) return;
    setScore(prev => prev + pts);
  }

  // ── Planets rescued ───────────────────────────────────────────────────
  function handlePlanetsSaved(ids) {
    setSavedPlanetIds(ids);
    setPlanetsRescued(ids.length);
  }

  // ── Replay ───────────────────────────────────────────────────────────
  function handleReplay() {
    stageLockedRef.current = false;
    setPhase(PHASE.WELCOME);
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Starfield />

      {/* WELCOME */}
      {phase === PHASE.WELCOME && <WelcomeScreen onStart={handleStart} />}

      {/* PLAYING */}
      {phase === PHASE.PLAYING && (
        <div
          style={{
            position: 'relative', zIndex: 10,
            maxWidth: 1100, margin: '0 auto',
            padding: '24px 16px',
            display: 'flex', flexDirection: 'column', gap: 16,
          }}
        >
          {/* Top HUD */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch' }}>
            <GameTimer secondsLeft={secondsLeft} duration={duration} />
            <div style={{ flex: 1 }}>
              <ScorePanel score={score} stage={stage} playerName={playerName} />
            </div>
          </div>

          {/* Progress bar */}
          <div className="card" style={{ padding: '16px 20px' }}>
            <ProgressBar currentStage={stage} />
          </div>

          {/* Main content + RPA console */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr min(340px, 35%)', gap: 16, alignItems: 'start' }}>
            {/* Challenge area */}
            <div className="card" style={{ padding: 28 }}>
              {stage === 1 && (
                <Stage1Launch
                  onComplete={advanceStage}
                  pushMessages={pushMessages}
                  disabled={gameEnded}
                />
              )}
              {stage === 2 && (
                <Stage2Scanner
                  onComplete={advanceStage}
                  pushMessages={pushMessages}
                  onScore={addScore}
                  disabled={gameEnded}
                />
              )}
              {stage === 3 && (
                <Stage3AlienAttack
                  onComplete={advanceStage}
                  pushMessages={pushMessages}
                  onScore={addScore}
                  disabled={gameEnded}
                />
              )}
              {stage === 4 && (
                <Stage4GalaxyRescue
                  onComplete={advanceStage}
                  pushMessages={pushMessages}
                  onScore={addScore}
                  onPlanetsSaved={handlePlanetsSaved}
                  disabled={gameEnded}
                />
              )}
              {stage === 5 && (
                <div style={{ textAlign: 'center', color: 'var(--neon-cyan)', fontFamily: 'var(--font-display)', padding: 40 }}>
                  ⚙️ Calculating results...
                </div>
              )}
            </div>

            {/* RPA console */}
            <div>
              <RpaConsole logs={logs} botStatus={botStatus} />

              {/* Mini planet status */}
              <div className="card" style={{ marginTop: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--neon-purple)', letterSpacing: '0.1em', marginBottom: 10 }}>
                  🌍 PLANET STATUS
                </div>
                {[
                  { name: 'Zephyra',  emoji: '🌍', id: 'p1', inDanger: true },
                  { name: 'Volcanis', emoji: '🪐', id: 'p2', inDanger: true },
                  { name: 'Crystara', emoji: '💜', id: 'p3', inDanger: false },
                ].map(p => {
                  const saved = savedPlanetIds.includes(p.id);
                  return (
                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span>{p.emoji}</span>
                      <span style={{ fontSize: '0.8rem', flex: 1, color: 'var(--text-secondary)' }}>{p.name}</span>
                      <span className={`badge ${saved ? 'badge-safe' : p.inDanger ? 'badge-danger' : 'badge-safe'}`} style={{ fontSize: '0.65rem' }}>
                        {saved ? 'RESCUED' : p.inDanger ? 'DANGER' : 'STABLE'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS */}
      {phase === PHASE.RESULTS && (
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
          {/* Show timer (stopped) */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'stretch', marginBottom: 16 }}>
            <GameTimer secondsLeft={secondsLeft} duration={duration} />
            <div style={{ flex: 1 }}>
              <ScorePanel score={score} stage={5} playerName={playerName} />
            </div>
          </div>
          <div className="card" style={{ padding: '28px 24px', marginBottom: 16 }}>
            <Stage5Results
              playerName={playerName}
              score={score}
              planetsRescued={planetsRescued}
              secondsLeft={secondsLeft}
              duration={duration}
              timedOut={timedOut}
              onReplay={handleReplay}
              pushMessages={pushMessages}
            />
          </div>
          {/* RPA console on results screen */}
          <RpaConsole logs={logs} botStatus={botStatus} />
        </div>
      )}
    </div>
  );
}
