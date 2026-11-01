/**
 * Starfield.jsx
 * Animated star background rendered once and fixed behind all content.
 */
import React, { useMemo } from 'react';

export default function Starfield() {
  const stars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: (Math.random() * 4 + 2).toFixed(1),
      delay: (Math.random() * 5).toFixed(1),
      opacity: Math.random() * 0.6 + 0.2,
    }));
  }, []);

  // A few large "nebula" blobs for depth
  const nebulae = useMemo(() => [
    { x: 15, y: 20, color: 'rgba(191,95,255,0.04)', size: 400 },
    { x: 75, y: 60, color: 'rgba(0,245,255,0.03)', size: 500 },
    { x: 50, y: 80, color: 'rgba(77,166,255,0.04)', size: 350 },
  ], []);

  return (
    <div className="starfield" aria-hidden="true">
      {/* Nebula blobs */}
      {nebulae.map((n, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${n.x}%`,
            top: `${n.y}%`,
            width: n.size,
            height: n.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${n.color}, transparent 70%)`,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      ))}
      {/* Stars */}
      {stars.map(s => (
        <div
          key={s.id}
          className="star"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: s.size,
            height: s.size,
            '--duration': `${s.duration}s`,
            '--delay': `${s.delay}s`,
            opacity: s.opacity,
          }}
        />
      ))}
    </div>
  );
}
