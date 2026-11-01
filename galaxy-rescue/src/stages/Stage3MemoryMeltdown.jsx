/**
 * Stage3MemoryMeltdown.jsx
 * Stage 3: Campus Intel & Memory Meltdown
 * =======================================
 * 1. Two random campus questions appear first (from the 5 campus questions).
 *    - Each question has strict correct answers:
 *      * Best tea: Infinity (Kathi) -> Wrong: "you have bad taste "
 *      * Pretending to study: Hostel Rooms -> Wrong: "you are delusional"
 *      * Best event so far: Halloween -> Wrong: "bruh , you got bad vibes "
 *      * Secret 2-hour nap: Rangeela Lounge -> Wrong: "do not record anything "
 *      * Worst food: Laal Masoor Dal -> Wrong: "best of luck to your taste buds "
 *    - Correct answers award +50 pts.
 * 2. Final Level: Memory Meltdown
 *    - 5 colored balls (Blue, Red, Yellow, Green, White) flash in random sequence for 3 seconds.
 *    - Recreate the exact sequence to rescue the planet (+100 pts).
 *
 * NOTE: EMOJIS ARE STRICTLY FORBIDDEN IN THIS COMPONENT.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MEMORY_BALLS,
  MEMORY_CONFIG,
  CAMPUS_QUESTIONS,
  RPA_MESSAGES,
  SCORE_VALUES,
} from '../data/gameData';

// ── Sphere Ball Visual Component (No Emojis) ─────────────────────────────────
function SphereBall({
  ball,
  size = 58,
  onClick,
  selected = false,
  disabled = false,
  showLabel = true,
  badge = null,
  pulse = false,
}) {
  if (!ball) return null;

  return (
    <div
      onClick={!disabled && onClick ? onClick : undefined}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: !disabled && onClick ? 'pointer' : 'default',
        transform: selected ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          position: 'relative',
          background: `radial-gradient(circle at 35% 30%, #ffffff 0%, ${ball.color} 46%, #020714 100%)`,
          boxShadow: `0 0 ${Math.round(size * 0.35)}px ${ball.glow}, inset -3px -3px 8px rgba(0,0,0,0.7), inset 3px 3px 6px rgba(255,255,255,0.75)`,
          border: selected ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: pulse ? 'pulse-glow 1.5s ease-in-out infinite' : undefined,
          flexShrink: 0,
        }}
      >
        {/* Specular curved reflection */}
        <div
          style={{
            position: 'absolute',
            top: '14%',
            left: '20%',
            width: size * 0.25,
            height: size * 0.15,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.85)',
            transform: 'rotate(-32deg)',
            filter: 'blur(0.5px)',
            pointerEvents: 'none',
          }}
        />

        {/* Optional status badge */}
        {badge && (
          <div
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              background: badge.bg || 'var(--neon-green)',
              color: badge.color || '#000',
              borderRadius: '50%',
              width: 22,
              height: 22,
              fontSize: '0.72rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 8px rgba(0,0,0,0.8)',
              border: '1px solid #fff',
            }}
          >
            {badge.text}
          </div>
        )}
      </div>

      {showLabel && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: size < 50 ? '0.62rem' : '0.75rem',
            color: ball.color,
            letterSpacing: '0.08em',
            fontWeight: 700,
            textShadow: `0 0 8px ${ball.color}`,
          }}
        >
          {ball.name}
        </span>
      )}
    </div>
  );
}

// ── Fisher-Yates Shuffle ─────────────────────────────────────────────────────
function createRandomSequence() {
  const pool = [...MEMORY_BALLS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

// ── Helper: Pick 2 distinct random questions ─────────────────────────────────
function pickRandomTwoQuestions() {
  const shuffled = [...CAMPUS_QUESTIONS].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

// ── Main Stage 3 Component ───────────────────────────────────────────────────
export default function Stage3MemoryMeltdown({ onComplete, pushMessages, onScore, disabled }) {
  // Select 2 random questions once per session
  const [questions] = useState(() => pickRandomTwoQuestions());

  // Stage 3 level progression:
  // 0 = Campus Trivia Q1
  // 1 = Campus Trivia Q2
  // 2 = Final Level: Memory Meltdown Ball Game
  const [levelIndex, setLevelIndex] = useState(0);

  // ── Trivia Question State ──
  const [selectedOption, setSelectedOption] = useState(null);
  const [triviaSubmitted, setTriviaSubmitted] = useState(false);
  const [triviaIsCorrect, setTriviaIsCorrect] = useState(false);
  const [triviaAwarded, setTriviaAwarded] = useState([false, false]);

  // ── Ball Game State ──
  // 'ready' | 'memorizing' | 'recall' | 'verifying' | 'result'
  const [ballPhase, setBallPhase] = useState('ready');
  const [targetSequence, setTargetSequence] = useState(() => createRandomSequence());
  const [playerSequence, setPlayerSequence] = useState([]);
  const [timeLeft, setTimeLeft] = useState(MEMORY_CONFIG.DISPLAY_DURATION_SECONDS);
  const [ballResult, setBallResult] = useState(null);
  const [ballPointsAwarded, setBallPointsAwarded] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const timerRef = useRef(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  const currentQuestion = questions[levelIndex] || null;

  // ── Trivia Actions ────────────────────────────────────────────────────────
  function handleSelectTriviaOption(index) {
    if (triviaSubmitted || disabled) return;
    setSelectedOption(index);
  }

  function handleSubmitTrivia() {
    if (selectedOption === null || triviaSubmitted || disabled || !currentQuestion) return;

    const isCorrect = selectedOption === currentQuestion.correctIndex;
    setTriviaIsCorrect(isCorrect);
    setTriviaSubmitted(true);

    // Push RPA telemetry
    pushMessages(RPA_MESSAGES.stage3_trivia || RPA_MESSAGES.stage3, 350, () => {
      // Award trivia points (50 pts per question) only if correct
      if (isCorrect && !triviaAwarded[levelIndex]) {
        onScore(SCORE_VALUES.STAGE3_TRIVIA_POINTS || 50);
        setTriviaAwarded(prev => {
          const next = [...prev];
          next[levelIndex] = true;
          return next;
        });
      }
    });
  }

  function handleRetryTrivia() {
    if (disabled) return;
    setSelectedOption(null);
    setTriviaSubmitted(false);
    setTriviaIsCorrect(false);
  }

  function handleNextFromTrivia() {
    if (disabled) return;
    if (levelIndex === 0) {
      // Move to Question 2
      setLevelIndex(1);
      setSelectedOption(null);
      setTriviaSubmitted(false);
      setTriviaIsCorrect(false);
    } else {
      // Move to Final Level: Memory Meltdown Ball Game
      setLevelIndex(2);
    }
  }

  // ── Ball Game Actions ─────────────────────────────────────────────────────
  const startMemorize = useCallback(() => {
    if (disabled) return;
    setBallPhase('memorizing');
    setTimeLeft(MEMORY_CONFIG.DISPLAY_DURATION_SECONDS);

    const startTime = Date.now();
    const durationMs = MEMORY_CONFIG.DISPLAY_DURATION_SECONDS * 1000;

    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, durationMs - elapsed);
      const remainingSec = (remainingMs / 1000).toFixed(1);

      setTimeLeft(parseFloat(remainingSec));

      if (remainingMs <= 0) {
        clearInterval(timerRef.current);
        setBallPhase('recall');
      }
    }, 50);
  }, [disabled]);

  function handleSelectBallColor(ball) {
    if (ballPhase !== 'recall' || disabled) return;
    if (playerSequence.length >= MEMORY_CONFIG.TOTAL_BALLS) return;
    setPlayerSequence(prev => [...prev, ball]);
  }

  function handleRemoveSlot(index) {
    if (ballPhase !== 'recall' || disabled) return;
    setPlayerSequence(prev => prev.filter((_, i) => i !== index));
  }

  function handleClearBalls() {
    if (ballPhase !== 'recall' || disabled) return;
    setPlayerSequence([]);
  }

  function handleVerifyBallSequence() {
    if (playerSequence.length !== MEMORY_CONFIG.TOTAL_BALLS || disabled || ballPhase !== 'recall') return;
    setBallPhase('verifying');
    setAttempts(a => a + 1);

    pushMessages(RPA_MESSAGES.stage3, 450, () => {
      const matches = playerSequence.map((ball, i) => ball.id === targetSequence[i].id);
      const isCorrect = matches.every(Boolean);

      setBallResult({ isCorrect, matches });

      if (isCorrect && !ballPointsAwarded) {
        onScore(SCORE_VALUES.STAGE3_BALL_GAME_POINTS || 100);
        setBallPointsAwarded(true);
      }

      setBallPhase('result');
    });
  }

  function handleRetryBallGame() {
    clearInterval(timerRef.current);
    setTargetSequence(createRandomSequence());
    setPlayerSequence([]);
    setBallResult(null);
    setBallPhase('ready');
  }

  return (
    <div className="animate-fadeIn">
      {/* ── Level Stepper Header (No Emojis) ── */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2 className="neon-purple" style={{ fontSize: '1.45rem', letterSpacing: '0.1em', marginBottom: 8 }}>
          STAGE 3 — CAMPUS INTEL AND MEMORY MELTDOWN
        </h2>

        {/* 3-Step Level Pill Indicators */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            background: 'rgba(5, 15, 50, 0.7)',
            padding: '6px 16px',
            borderRadius: 30,
            border: '1px solid rgba(77, 166, 255, 0.25)',
            marginBottom: 12,
          }}
        >
          {[
            { idx: 0, label: 'Intel Q1', num: '1' },
            { idx: 1, label: 'Intel Q2', num: '2' },
            { idx: 2, label: 'Final: Memory Meltdown', num: '3' },
          ].map(s => {
            const isCompleted = levelIndex > s.idx;
            const isCurrent = levelIndex === s.idx;
            return (
              <div
                key={s.idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-display)',
                  color: isCurrent
                    ? 'var(--neon-cyan)'
                    : isCompleted
                    ? 'var(--neon-green)'
                    : 'var(--text-dim)',
                  fontWeight: isCurrent ? 700 : 500,
                  textShadow: isCurrent ? '0 0 8px var(--neon-cyan)' : 'none',
                }}
              >
                <span>[{isCompleted ? 'OK' : s.num}]</span>
                <span>{s.label}</span>
                {s.idx < 2 && <span style={{ color: 'var(--text-dim)', opacity: 0.5 }}>-</span>}
              </div>
            );
          })}
        </div>

        <p style={{ color: 'var(--text-secondary)', maxWidth: 600, margin: '0 auto', fontSize: '0.9rem', lineHeight: 1.5 }}>
          {levelIndex < 2
            ? 'Answer the campus intel questions to unlock the planetary memory core.'
            : 'Planetary core memory is melting down! Memorize the 5 colored balls before they disappear in 3 seconds to rescue the planet.'}
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── LEVELS 1 & 2: CAMPUS TRIVIA QUESTIONS (NO EMOJIS) ───────────── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {levelIndex < 2 && currentQuestion && (
        <div
          className="card card-glow-purple"
          style={{
            maxWidth: 680,
            margin: '0 auto 24px',
            padding: '24px 22px',
            animation: 'warpIn 0.4s ease',
          }}
        >
          {/* Question Level Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              borderBottom: '1px solid rgba(191, 95, 255, 0.2)',
              paddingBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                color: 'var(--neon-purple)',
                letterSpacing: '0.12em',
                fontWeight: 700,
              }}
            >
              CAMPUS INTEL CHECK {levelIndex + 1} OF 2
            </span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
              +50 PTS
            </span>
          </div>

          {/* Question Text */}
          <div
            style={{
              fontSize: '1.12rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.6,
              marginBottom: 22,
            }}
          >
            {currentQuestion.question}
          </div>

          {/* Options (A, B, C, D) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {currentQuestion.options.map((opt, i) => {
              const letter = String.fromCharCode(65 + i);
              const isSelected = selectedOption === i;
              const isCorrectChoice = i === currentQuestion.correctIndex;

              let borderStyle = '1px solid rgba(77, 166, 255, 0.25)';
              let bgStyle = 'rgba(5, 15, 50, 0.5)';
              let textColor = 'var(--text-primary)';
              let tagText = '';

              if (isSelected && !triviaSubmitted) {
                borderStyle = '1.5px solid var(--neon-cyan)';
                bgStyle = 'rgba(0, 245, 255, 0.1)';
                textColor = 'var(--neon-cyan)';
              } else if (triviaSubmitted) {
                if (isSelected && triviaIsCorrect) {
                  borderStyle = '1.5px solid var(--neon-green)';
                  bgStyle = 'rgba(0, 255, 136, 0.12)';
                  textColor = 'var(--neon-green)';
                  tagText = '[CORRECT]';
                } else if (isSelected && !triviaIsCorrect) {
                  borderStyle = '1.5px solid var(--neon-red)';
                  bgStyle = 'rgba(255, 51, 102, 0.15)';
                  textColor = 'var(--neon-red)';
                  tagText = '[WRONG]';
                } else if (isCorrectChoice && !triviaIsCorrect) {
                  borderStyle = '1.5px dashed var(--neon-green)';
                  textColor = 'var(--neon-green)';
                  tagText = '[CORRECT ANSWER]';
                }
              }

              return (
                <div
                  key={i}
                  onClick={() => handleSelectTriviaOption(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 16px',
                    borderRadius: 8,
                    background: bgStyle,
                    border: borderStyle,
                    cursor: triviaSubmitted || disabled ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(0, 245, 255, 0.2)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: isSelected ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)',
                      color: isSelected ? '#000' : 'var(--neon-cyan)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {letter}
                  </div>
                  <span style={{ fontSize: '0.98rem', color: textColor, fontWeight: isSelected ? 600 : 400 }}>
                    {opt}
                  </span>
                  {tagText && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: isSelected && !triviaIsCorrect ? 'var(--neon-red)' : 'var(--neon-green)',
                        fontSize: '0.78rem',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                      }}
                    >
                      {tagText}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* User-defined feedback message on submission */}
          {triviaSubmitted && (
            <div
              className="animate-successPop"
              style={{
                marginTop: 14,
                padding: '12px 16px',
                borderRadius: 8,
                background: triviaIsCorrect ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 51, 102, 0.1)',
                border: `1px solid ${triviaIsCorrect ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 51, 102, 0.4)'}`,
                color: triviaIsCorrect ? 'var(--neon-green)' : 'var(--neon-red)',
                fontSize: '0.95rem',
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              {triviaIsCorrect
                ? `${currentQuestion.correctMessage} (+50 pts)`
                : `${currentQuestion.wrongMessage} (+0 pts)`}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ textAlign: 'center', marginTop: 22, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {!triviaSubmitted ? (
              <button
                className="btn btn-purple btn-large"
                onClick={handleSubmitTrivia}
                disabled={selectedOption === null || disabled}
                style={{ minWidth: 220 }}
              >
                SUBMIT INTEL
              </button>
            ) : (
              <>
                {!triviaIsCorrect && (
                  <button
                    className="btn btn-red"
                    onClick={handleRetryTrivia}
                    disabled={disabled}
                    style={{ minWidth: 160 }}
                  >
                    RETRY
                  </button>
                )}
                <button
                  className="btn btn-green btn-large animate-pulse-glow"
                  onClick={handleNextFromTrivia}
                  disabled={disabled}
                  style={{ minWidth: 240 }}
                >
                  {levelIndex === 0 ? 'NEXT QUESTION (2/2) ->' : 'PROCEED TO FINAL LEVEL: MEMORY MELTDOWN ->'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ── LEVEL 3: FINAL LEVEL — MEMORY MELTDOWN BALL GAME (NO EMOJIS) ── */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {levelIndex === 2 && (
        <div
          className="card card-glow-purple"
          style={{
            maxWidth: 680,
            margin: '0 auto 24px',
            padding: '24px 20px',
            animation: 'warpIn 0.5s ease',
          }}
        >
          {/* Level Header Banner */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              borderBottom: '1px solid rgba(191, 95, 255, 0.2)',
              paddingBottom: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.72rem',
                color: 'var(--neon-yellow)',
                letterSpacing: '0.12em',
                fontWeight: 700,
              }}
            >
              FINAL LEVEL: MEMORY MELTDOWN
            </span>
            <span className="badge badge-safe" style={{ fontSize: '0.7rem' }}>
              +100 PTS
            </span>
          </div>

          {/* ── BALL PHASE: READY / BRIEFING ── */}
          {ballPhase === 'ready' && (
            <div style={{ textAlign: 'center', padding: '12px 6px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.15em',
                  marginBottom: 16,
                }}
              >
                5-COLOR SPECTRUM DETECTED
              </div>

              {/* Preview the 5 colors */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  marginBottom: 24,
                }}
              >
                {MEMORY_BALLS.map(ball => (
                  <SphereBall key={ball.id} ball={ball} size={50} showLabel />
                ))}
              </div>

              <div
                style={{
                  background: 'rgba(0, 245, 255, 0.05)',
                  border: '1px solid rgba(0, 245, 255, 0.2)',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 24,
                  color: 'var(--text-secondary)',
                  fontSize: '0.88rem',
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ color: 'var(--neon-cyan)' }}>Final Mission Objective:</strong> When you click below,
                a randomized sequence of all 5 balls will appear for{' '}
                <strong style={{ color: 'var(--neon-yellow)' }}>exactly 3.0 seconds</strong> and then disappear.
                Memorize their exact order to stabilize the planetary core.
              </div>

              <button
                className="btn btn-purple btn-large animate-pulse-glow"
                onClick={startMemorize}
                disabled={disabled}
                style={{ minWidth: 260 }}
              >
                INITIATE MEMORY SCAN (3s)
              </button>
            </div>
          )}

          {/* ── BALL PHASE: MEMORIZING (3 SECONDS DISPLAY) ── */}
          {ballPhase === 'memorizing' && (
            <div style={{ textAlign: 'center' }}>
              {/* Countdown timer & progress bar */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.85rem',
                  }}
                >
                  <span className="neon-red" style={{ letterSpacing: '0.1em' }}>
                    MEMORIZING SEQUENCE...
                  </span>
                  <span
                    style={{
                      color: 'var(--neon-yellow)',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                    }}
                  >
                    {timeLeft.toFixed(1)}s
                  </span>
                </div>

                {/* Depleting progress bar */}
                <div
                  style={{
                    width: '100%',
                    height: 10,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 5,
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 51, 102, 0.4)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.max(0, (timeLeft / MEMORY_CONFIG.DISPLAY_DURATION_SECONDS) * 100)}%`,
                      background: 'linear-gradient(90deg, var(--neon-red), var(--neon-yellow), var(--neon-cyan))',
                      boxShadow: '0 0 12px var(--neon-red)',
                      transition: 'width 0.05s linear',
                    }}
                  />
                </div>
              </div>

              {/* Active sequence display */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  flexWrap: 'wrap',
                  padding: '16px 0',
                }}
              >
                {targetSequence.map((ball, idx) => (
                  <div
                    key={idx}
                    className="animate-successPop"
                    style={{
                      animationDelay: `${idx * 0.08}s`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '0.68rem',
                        color: 'var(--text-dim)',
                        marginBottom: 6,
                      }}
                    >
                      #{idx + 1}
                    </div>
                    <SphereBall
                      ball={ball}
                      size={62}
                      showLabel
                      pulse
                      badge={{ text: String(idx + 1), bg: 'var(--neon-cyan)', color: '#000' }}
                    />
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: 16,
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-yellow)',
                  letterSpacing: '0.1em',
                }}
              >
                LOCK THE SEQUENCE IN YOUR MEMORY
              </div>
            </div>
          )}

          {/* ── BALL PHASE: RECALL & VERIFYING ── */}
          {(ballPhase === 'recall' || ballPhase === 'verifying') && (
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.75rem',
                  color: 'var(--neon-cyan)',
                  letterSpacing: '0.15em',
                  marginBottom: 14,
                  textAlign: 'center',
                }}
              >
                RECREATE THE 5-BALL SEQUENCE
              </div>

              {/* Target Slots: 5 slots to fill */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 24,
                  minHeight: 105,
                  alignItems: 'center',
                  padding: '12px 8px',
                  background: 'rgba(0, 10, 30, 0.6)',
                  borderRadius: 12,
                  border: '1px dashed rgba(0, 245, 255, 0.3)',
                }}
              >
                {Array.from({ length: MEMORY_CONFIG.TOTAL_BALLS }).map((_, idx) => {
                  const placedBall = playerSequence[idx];

                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '0.65rem',
                          color: placedBall ? 'var(--neon-cyan)' : 'var(--text-dim)',
                        }}
                      >
                        SLOT {idx + 1}
                      </div>

                      {placedBall ? (
                        <div
                          onClick={() => handleRemoveSlot(idx)}
                          title="Click to remove"
                          className="animate-successPop"
                          style={{ cursor: ballPhase === 'recall' ? 'pointer' : 'default' }}
                        >
                          <SphereBall
                            ball={placedBall}
                            size={54}
                            showLabel={false}
                            badge={
                              ballPhase === 'recall'
                                ? { text: 'X', bg: 'rgba(255, 51, 102, 0.9)', color: '#fff' }
                                : null
                            }
                          />
                        </div>
                      ) : (
                        <div
                          style={{
                            width: 54,
                            height: 54,
                            borderRadius: '50%',
                            border: '2px dashed rgba(77, 166, 255, 0.4)',
                            background: 'rgba(0, 20, 50, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--text-dim)',
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.9rem',
                          }}
                        >
                          ?
                        </div>
                      )}

                      {placedBall && (
                        <span
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '0.65rem',
                            color: placedBall.color,
                          }}
                        >
                          {placedBall.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Slot controls: Undo & Clear */}
              {ballPhase === 'recall' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 16,
                    padding: '0 8px',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Selected: <strong>{playerSequence.length}</strong> / {MEMORY_CONFIG.TOTAL_BALLS}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className="btn btn-blue btn-sm"
                      onClick={() => handleRemoveSlot(playerSequence.length - 1)}
                      disabled={playerSequence.length === 0}
                    >
                      Undo
                    </button>
                    <button
                      className="btn btn-red btn-sm"
                      onClick={handleClearBalls}
                      disabled={playerSequence.length === 0}
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}

              {/* Color selection palette */}
              {ballPhase === 'recall' && (
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      color: 'var(--neon-yellow)',
                      letterSpacing: '0.1em',
                      marginBottom: 12,
                      textAlign: 'center',
                    }}
                  >
                    CLICK BALLS TO INSERT INTO SEQUENCE:
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 16,
                      flexWrap: 'wrap',
                      padding: '12px 10px',
                      background: 'rgba(5, 15, 50, 0.6)',
                      borderRadius: 10,
                      border: '1px solid rgba(77, 166, 255, 0.2)',
                    }}
                  >
                    {MEMORY_BALLS.map(ball => {
                      const isUsed = playerSequence.some(b => b.id === ball.id);

                      return (
                        <div
                          key={ball.id}
                          style={{
                            opacity: isUsed ? 0.75 : 1,
                            transition: 'opacity 0.2s ease',
                          }}
                        >
                          <SphereBall
                            ball={ball}
                            size={52}
                            onClick={() => handleSelectBallColor(ball)}
                            disabled={playerSequence.length >= MEMORY_CONFIG.TOTAL_BALLS}
                            badge={isUsed ? { text: 'OK', bg: 'var(--neon-green)', color: '#000' } : null}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Verifying loader */}
              {ballPhase === 'verifying' && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 0',
                    color: 'var(--neon-cyan)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  <div className="animate-spin" style={{ fontSize: '2rem', marginBottom: 12 }}>
                    *
                  </div>
                  <div style={{ letterSpacing: '0.1em', fontSize: '0.9rem' }}>
                    GALAXY BOT VERIFYING NEURAL SEQUENCE...
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── BALL PHASE: RESULT DISPLAY ── */}
          {ballPhase === 'result' && ballResult && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.25rem',
                  color: ballResult.isCorrect ? 'var(--neon-green)' : 'var(--neon-red)',
                  letterSpacing: '0.1em',
                  marginBottom: 16,
                }}
              >
                {ballResult.isCorrect ? 'CORE STABILIZED — PLANET SAVED!' : 'MEMORY MELTDOWN! SEQUENCE MISMATCH'}
              </div>

              {/* Comparison view: Player's sequence with status badges */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '0.7rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 10,
                  }}
                >
                  YOUR SUBMITTED SEQUENCE:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  {playerSequence.map((ball, idx) => {
                    const match = ballResult.matches[idx];
                    return (
                      <SphereBall
                        key={idx}
                        ball={ball}
                        size={50}
                        showLabel
                        badge={{
                          text: match ? 'OK' : 'X',
                          bg: match ? 'var(--neon-green)' : 'var(--neon-red)',
                          color: match ? '#000' : '#fff',
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* If wrong, reveal correct sequence */}
              {!ballResult.isCorrect && (
                <div
                  style={{
                    background: 'rgba(255, 51, 102, 0.08)',
                    border: '1px solid rgba(255, 51, 102, 0.3)',
                    borderRadius: 10,
                    padding: '14px',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '0.7rem',
                      color: 'var(--neon-cyan)',
                      letterSpacing: '0.1em',
                      marginBottom: 10,
                    }}
                  >
                    CORRECT CORE SEQUENCE WAS:
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                    {targetSequence.map((ball, idx) => (
                      <SphereBall key={idx} ball={ball} size={44} showLabel />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons inside Ball Game */}
          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {ballPhase === 'recall' && (
              <button
                className="btn btn-purple btn-large animate-pulse-glow"
                onClick={handleVerifyBallSequence}
                disabled={playerSequence.length !== MEMORY_CONFIG.TOTAL_BALLS || disabled}
              >
                VERIFY SEQUENCE AND RESCUE
              </button>
            )}

            {ballPhase === 'result' && !ballResult.isCorrect && (
              <>
                <button className="btn btn-red" onClick={handleRetryBallGame} disabled={disabled}>
                  TRY AGAIN (NEW SEQUENCE)
                </button>
                <button className="btn btn-blue" onClick={onComplete} disabled={disabled}>
                  SKIP &rarr; GALAXY RESCUE
                </button>
              </>
            )}

            {ballPhase === 'result' && ballResult.isCorrect && (
              <button className="btn btn-green btn-large" onClick={onComplete} disabled={disabled}>
                PROCEED TO GALAXY RESCUE &rarr;
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Feedback Banner ── */}
      {levelIndex === 2 && ballResult && (
        <div
          className={`feedback-banner ${ballResult.isCorrect ? 'feedback-success' : 'feedback-error'} animate-successPop`}
          style={{ maxWidth: 680, margin: '0 auto 20px', textAlign: 'center' }}
        >
          {ballResult.isCorrect
            ? `Perfect Recall! Core resonance stabilized. +${SCORE_VALUES.STAGE3_BALL_GAME_POINTS || 100} pts`
            : `Sequence mismatch (Attempt ${attempts}). The core suffered unstable resonance! Try again with a new sequence.`}
        </div>
      )}
    </div>
  );
}
