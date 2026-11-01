/**
 * Stage5Results.jsx
 * Stage 5: Mission Complete screen — final score, stats, and leaderboard.
 */
import React, { useEffect, useState } from 'react';
import { formatTime, computeRating, saveToLeaderboard, loadLeaderboard } from '../utils/leaderboard';
import { PLANETS, SCORE_VALUES } from '../data/gameData';

export default function Stage5Results({
  playerName,
  score,
  planetsRescued,
  secondsLeft,
  duration,
  timedOut,
  onReplay,
  pushMessages,
}) {
  const [board, setBoard] = useState([]);
  const [saved, setSaved] = useState(false);

  const completionTime = duration - secondsLeft;
  const totalPossible = SCORE_VALUES.STAGE2_CORRECT_PLANET * 2 + SCORE_VALUES.STAGE3_CORRECT_ANSWER + SCORE_VALUES.STAGE4_PLANET_SAVED * 2;
  const accuracy = totalPossible > 0 ? Math.round((score / totalPossible) * 100) : 0;
  const rating = computeRating(score, planetsRescued, accuracy);
  const isSuccess = planetsRescued >= 1 && !timedOut;
  const isPerfect = planetsRescued === PLANETS.filter(p => p.inDanger).length;

  // Speed bonus check
  const speedBonus = secondsLeft >= SCORE_VALUES.SPEED_BONUS_THRESHOLD ? SCORE_VALUES.SPEED_BONUS : 0;
  const finalScore = score + speedBonus;

  useEffect(() => {
    // Simulate final RPA log sequence
    pushMessages(
      [
        { text: 'Calculating final mission score...', status: 'RUNNING' },
        { text: `Score computed: ${finalScore} pts`, status: 'RUNNING' },
        { text: `Planets rescued: ${planetsRescued}`, status: 'RUNNING' },
        { text: `Accuracy: ${accuracy}%`, status: 'RUNNING' },
        { text: `Rating: ${rating}`, status: 'RUNNING' },
        { text: 'Saving to leaderboard...', status: 'RUNNING' },
        { text: 'Mission report generated.', status: 'COMPLETED' },
      ],
      400
    );

    // Save to leaderboard once
    if (!saved) {
      const newBoard = saveToLeaderboard({
        name: playerName,
        score: finalScore,
        planetsRescued,
        completionTime,
        rating,
      });
      setBoard(newBoard);
      setSaved(true);
    } else {
      setBoard(loadLeaderboard());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="animate-warpIn" style={{ position: 'relative', zIndex: 10, padding: '20px 0' }}>
      {/* Victory / Failure header */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '4rem', marginBottom: 12, animation: isSuccess ? 'bounce 1.5s ease-in-out infinite' : 'none' }}>
          {isPerfect ? '🏆' : isSuccess ? '🌟' : timedOut ? '⏰' : '💀'}
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.4rem, 4vw, 2rem)',
            letterSpacing: '0.08em',
            color: isPerfect ? 'var(--neon-yellow)' : isSuccess ? 'var(--neon-green)' : 'var(--neon-red)',
            textShadow: `0 0 20px ${isPerfect ? 'var(--neon-yellow)' : isSuccess ? 'var(--neon-green)' : 'var(--neon-red)'}`,
            marginBottom: 8,
          }}
        >
          {isPerfect ? 'PERFECT MISSION!' : isSuccess ? 'MISSION ACCOMPLISHED!' : timedOut ? 'TIME EXPIRED!' : 'MISSION FAILED'}
        </h2>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.9rem', color: 'var(--text-secondary)', letterSpacing: '0.15em' }}>
          {rating}
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'FINAL SCORE', value: finalScore.toLocaleString(), color: 'var(--neon-yellow)', icon: '⭐' },
          { label: 'PLANETS RESCUED', value: `${planetsRescued} / ${PLANETS.filter(p => p.inDanger).length}`, color: 'var(--neon-green)', icon: '🌍' },
          { label: 'ACCURACY', value: `${accuracy}%`, color: 'var(--neon-cyan)', icon: '🎯' },
          { label: 'TIME TAKEN', value: formatTime(completionTime), color: 'var(--neon-blue)', icon: '⏱' },
          ...(speedBonus > 0 ? [{ label: 'SPEED BONUS', value: `+${speedBonus}`, color: 'var(--neon-purple)', icon: '⚡' }] : []),
        ].map(stat => (
          <div key={stat.label} className="card" style={{ textAlign: 'center', border: `1px solid ${stat.color}44` }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>{stat.icon}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: stat.color, textShadow: `0 0 10px ${stat.color}` }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Planet outcome */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 12 }}>
          🌍 PLANET STATUS REPORT
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {PLANETS.map(p => {
            const needsRescue = p.inDanger;
            const rescued = !needsRescue || planetsRescued > 0; // simplified — real state from parent
            return (
              <div key={p.id} style={{ flex: '1 1 160px', padding: '12px 16px', borderRadius: 8, background: `${p.glowColor.replace('0.6', '0.06')}`, border: `1px solid ${p.glowColor.replace('0.6', '0.3')}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.5rem' }}>{p.emoji}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: p.color }}>{p.name}</div>
                  <div style={{ fontSize: '0.72rem', color: needsRescue ? 'var(--neon-yellow)' : 'var(--neon-green)' }}>
                    {needsRescue ? '⚠ Was in danger' : '✓ Stable'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-yellow)', letterSpacing: '0.15em' }}>
            🏆 LEADERBOARD — TOP 10
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
            📱 Stored in this browser only · Not shared across devices
          </div>
        </div>
        {board.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No entries yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(77,166,255,0.15)' }}>
                  {['#', 'Commander', 'Score', 'Rescued', 'Time', 'Date'].map(h => (
                    <th key={h} style={{ padding: '6px 12px', fontFamily: 'var(--font-display)', fontSize: '0.65rem', color: 'var(--text-secondary)', letterSpacing: '0.1em', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board.map((entry, i) => {
                  const isCurrentPlayer = entry.name === playerName && entry.score === finalScore;
                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: '1px solid rgba(77,166,255,0.05)',
                        background: isCurrentPlayer ? 'rgba(0,245,255,0.05)' : 'transparent',
                        animation: isCurrentPlayer ? 'pulse-glow 2s ease-in-out' : 'none',
                      }}
                    >
                      <td style={{ padding: '8px 12px', color: i === 0 ? 'var(--neon-yellow)' : 'var(--text-dim)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td style={{ padding: '8px 12px', color: isCurrentPlayer ? 'var(--neon-cyan)' : 'var(--text-primary)', fontWeight: isCurrentPlayer ? 700 : 400 }}>
                        {entry.name} {isCurrentPlayer && '← YOU'}
                      </td>
                      <td style={{ padding: '8px 12px', color: 'var(--neon-yellow)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>{entry.score.toLocaleString()}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--neon-green)' }}>{entry.planetsRescued}/2</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{formatTime(entry.completionTime || 0)}</td>
                      <td style={{ padding: '8px 12px', color: 'var(--text-dim)', fontSize: '0.75rem' }}>{entry.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Replay */}
      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-cyan btn-large" onClick={onReplay}>
          🔄 PLAY AGAIN
        </button>
        <div style={{ marginTop: 12, fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          Starts a fresh mission with a new timer and clean score.
        </div>
      </div>
    </div>
  );
}
