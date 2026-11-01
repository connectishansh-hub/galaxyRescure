/**
 * Stage3AlienAttack.jsx
 * Stage 3: Random logic/math puzzle, multiple choice, one attempt + retry.
 * Scoring awarded once per correct answer.
 */
import React, { useState, useEffect, useRef } from 'react';
import { PUZZLES, RPA_MESSAGES, SCORE_VALUES } from '../data/gameData';

export default function Stage3AlienAttack({ onComplete, pushMessages, onScore, disabled }) {
  // Pick a random puzzle once per mount
  const puzzle = useRef(PUZZLES[Math.floor(Math.random() * PUZZLES.length)]).current;

  const [selected, setSelected] = useState(null);      // index
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);           // null | 'correct' | 'wrong'
  const [canContinue, setCanContinue] = useState(false);
  const [pointsAwarded, setPointsAwarded] = useState(false);
  const [attempts, setAttempts] = useState(0);

  function handleSubmit() {
    if (selected === null || verifying || disabled) return;
    setVerifying(true);
    setAttempts(a => a + 1);

    pushMessages(RPA_MESSAGES.stage3, 500, () => {
      const correct = selected === puzzle.correctIndex;
      setResult(correct ? 'correct' : 'wrong');
      if (correct && !pointsAwarded) {
        onScore(SCORE_VALUES.STAGE3_CORRECT_ANSWER);
        setPointsAwarded(true);
      }
      setVerifying(false);
      if (correct) setCanContinue(true);
    });
  }

  function handleRetry() {
    setSelected(null);
    setResult(null);
  }

  const ALIEN_COLORS = ['#ff3366', '#ff6633', '#ff33aa', '#ff9900'];

  return (
    <div className="animate-fadeIn">
      {/* Alien attack animation */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 6, animation: 'bounce 1s ease-in-out infinite' }}>👾</div>
        <h2 className="neon-red" style={{ fontSize: '1.5rem', letterSpacing: '0.1em', marginBottom: 8 }}>
          STAGE 3 — ALIEN ATTACK
        </h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} style={{ fontSize: '1.4rem', animation: `bounce ${0.8 + i * 0.15}s ease-in-out infinite`, color: ALIEN_COLORS[i % 4] }}>
              👾
            </span>
          ))}
        </div>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          The alien fleet has scrambled our systems! Solve the challenge to restore communications.
          Galaxy Bot is standing by to verify your answer.
        </p>
      </div>

      {/* Puzzle card */}
      <div className="card card-glow-purple" style={{ maxWidth: 620, margin: '0 auto 24px', animation: 'warpIn 0.5s ease' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-purple)', letterSpacing: '0.15em', marginBottom: 12 }}>
          🧩 CHALLENGE — {puzzle.type.toUpperCase()}
        </div>
        <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 20, fontWeight: 600 }}>
          {puzzle.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {puzzle.options.map((opt, i) => {
            let cls = 'custom-radio';
            if (selected === i) cls += ' selected';
            if (result === 'correct' && i === puzzle.correctIndex) cls += ' correct';
            if (result === 'wrong' && selected === i) cls += ' wrong';
            if (result && i === puzzle.correctIndex && result === 'wrong') cls += ' correct';

            return (
              <div
                key={i}
                className={cls}
                onClick={() => {
                  if (!verifying && !canContinue && !disabled && result !== 'correct') setSelected(i);
                }}
                style={{ cursor: canContinue || verifying ? 'default' : 'pointer' }}
              >
                <div className="radio-dot">
                  <div className="radio-inner" style={{ transform: selected === i ? 'scale(1)' : 'scale(0)' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {String.fromCharCode(65 + i)}. {opt}
                </span>
                {result && i === puzzle.correctIndex && (
                  <span style={{ marginLeft: 'auto', color: 'var(--neon-green)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    ✓ CORRECT
                  </span>
                )}
                {result === 'wrong' && selected === i && i !== puzzle.correctIndex && (
                  <span style={{ marginLeft: 'auto', color: 'var(--neon-red)', fontSize: '0.8rem', fontFamily: 'var(--font-display)' }}>
                    ✗ WRONG
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Explanation */}
        {result && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 6, background: 'rgba(77,166,255,0.08)', border: '1px solid rgba(77,166,255,0.2)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            💡 <strong style={{ color: 'var(--neon-blue)' }}>Explanation:</strong> {puzzle.explanation}
          </div>
        )}
      </div>

      {/* Feedback */}
      {result && (
        <div
          className={`feedback-banner ${result === 'correct' ? 'feedback-success' : 'feedback-error'} animate-successPop`}
          style={{ maxWidth: 620, margin: '0 auto 16px' }}
        >
          {result === 'correct'
            ? `✓ Correct! Galaxy Bot verified. +${SCORE_VALUES.STAGE3_CORRECT_ANSWER} pts`
            : `✗ Incorrect. Alien systems are scrambling signals!${attempts < 2 ? ' Try again!' : ''}`}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!result ? (
          <button
            className="btn btn-purple btn-large"
            onClick={handleSubmit}
            disabled={selected === null || verifying || disabled}
          >
            {verifying ? '⚙️ BOT VERIFYING...' : '👾 SUBMIT ANSWER'}
          </button>
        ) : result === 'wrong' && !canContinue ? (
          <>
            <button className="btn btn-red" onClick={handleRetry} disabled={disabled}>
              🔄 TRY AGAIN
            </button>
            <button className="btn btn-blue" onClick={onComplete} disabled={disabled}>
              SKIP → GALAXY RESCUE
            </button>
          </>
        ) : (
          <button className="btn btn-green btn-large" onClick={onComplete} disabled={disabled}>
            PROCEED TO GALAXY RESCUE →
          </button>
        )}
      </div>
    </div>
  );
}
