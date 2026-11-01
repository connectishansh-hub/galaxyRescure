/**
 * WelcomeScreen.jsx
 * Stage 0: Title screen, player name input, instructions.
 * Features an autoplaying, looping, muted local space video background
 * and centered game logo image.
 */
import React, { useState, useRef, useEffect } from 'react';
import gameLogo from '../assets/game-logo.png';

export default function WelcomeScreen({ onStart }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(err => {
        console.warn('Video background autoplay blocked or waiting for interaction:', err);
      });
    }
  }, []);

  function handleStart() {
    const trimmed = name.trim();
    if (!trimmed) { setError('Enter your commander name to begin!'); return; }
    if (trimmed.length < 2) { setError('Name must be at least 2 characters.'); return; }
    if (trimmed.length > 20) { setError('Name too long (max 20 characters).'); return; }
    setError('');
    onStart(trimmed);
  }

  function handleKey(e) { if (e.key === 'Enter') handleStart(); }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Autoplaying, looping, muted video background */}
      <div className="menu-video-container" aria-hidden="true">
        <video
          ref={videoRef}
          className="menu-video-bg"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
        >
          <source src={`${import.meta.env.BASE_URL}space-bg.mp4`} type="video/mp4" />
          <source src="/space-bg.mp4" type="video/mp4" />
          <source src="space-bg.mp4" type="video/mp4" />
        </video>
        {/* Subtle dark radial overlay for optimal text contrast and neon glow */}
        <div className="menu-video-overlay" />
      </div>

      {/* Menu Layout */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '40px 20px',
          textAlign: 'center',
        }}
      >
        {/* Centered Game Logo Image */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            animation: 'fadeIn 0.6s ease both',
          }}
        >
          <img
            src={gameLogo}
            alt="Robotics Process Automation - Galaxy Rescue"
            style={{
              maxWidth: 'clamp(280px, 50vw, 440px)',
              width: '100%',
              height: 'auto',
              display: 'block',
              margin: '0 auto',
              objectFit: 'contain',
              mixBlendMode: 'screen',
              filter: 'drop-shadow(0 0 22px rgba(0, 245, 255, 0.45))',
            }}
          />
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
            color: 'var(--neon-cyan)',
            letterSpacing: '0.2em',
            marginBottom: 32,
            textShadow: '0 0 12px var(--neon-cyan)',
          }}
        >
          RPA MISSION — SAVE THE GALAXY IN 5 MINUTES!
        </div>

        {/* Mission briefing */}
        <div
          className="card"
          style={{ maxWidth: 680, width: '100%', marginBottom: 32, textAlign: 'left', animation: 'fadeIn 0.6s ease 0.2s both' }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', color: 'var(--neon-purple)', letterSpacing: '0.15em', marginBottom: 16 }}>
            📋 MISSION BRIEFING
          </div>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Three planets in the Cygnus Sector are under threat. You have been selected as commander of{' '}
            <span className="neon-cyan">Galaxy Bot</span>, an AI-powered RPA (Robotic Process Automation) system.
          </div>
          <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { icon: '🚀', title: 'Stage 1', desc: 'Mission Launch — assign RPA tasks' },
              { icon: '🔭', title: 'Stage 2', desc: 'Planet Scanner — identify danger zones' },
              { icon: '🔮', title: 'Stage 3', desc: 'Campus Intel & Memory Meltdown' },
              { icon: '🛸', title: 'Stage 4', desc: 'Galaxy Rescue — allocate resources' },
            ].map(s => (
              <div key={s.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 12px', borderRadius: 8, background: 'rgba(77,166,255,0.05)', border: '1px solid rgba(77,166,255,0.1)' }}>
                <span style={{ fontSize: '1.4rem' }}>{s.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--neon-cyan)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, fontSize: '0.82rem', color: 'var(--neon-yellow)', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏱ Timer starts when you click START MISSION. You have <strong>5 minutes</strong>.
          </div>
        </div>

        {/* Name input */}
        <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.6s ease 0.4s both' }}>
          <label style={{ display: 'block', fontFamily: 'var(--font-display)', fontSize: '0.7rem', color: 'var(--neon-cyan)', letterSpacing: '0.15em', marginBottom: 8 }}>
            ENTER COMMANDER NAME
          </label>
          <input
            className="input-field"
            type="text"
            placeholder="e.g. Captain Nova"
            value={name}
            onChange={e => { setName(e.target.value); setError(''); }}
            onKeyDown={handleKey}
            maxLength={20}
            autoFocus
            style={{ marginBottom: 8 }}
          />
          {error && (
            <div className="feedback-banner feedback-error" style={{ marginBottom: 12, fontSize: '0.8rem' }}>{error}</div>
          )}
          <button
            className="btn btn-cyan btn-large"
            onClick={handleStart}
            style={{ width: '100%', marginTop: 8 }}
          >
            🚀 START MISSION
          </button>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 40, fontSize: '0.72rem', color: 'var(--text-dim)', animation: 'fadeIn 0.6s ease 0.6s both' }}>
          Built for college event stalls · Powered by RPA simulation · No internet required
        </div>
      </div>
    </div>
  );
}
