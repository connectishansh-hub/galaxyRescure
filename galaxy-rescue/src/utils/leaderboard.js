/**
 * leaderboard.js
 * Utilities for reading/writing the localStorage leaderboard.
 */
import { GAME_CONFIG } from '../data/gameData';

const KEY = GAME_CONFIG.LEADERBOARD_KEY;

/**
 * Load and parse the leaderboard from localStorage.
 * Returns an empty array on any error.
 */
export function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize entries
    return parsed.filter(
      e => e && typeof e.name === 'string' && typeof e.score === 'number'
    );
  } catch {
    return [];
  }
}

/**
 * Add a new entry and persist the top-10 by score.
 */
export function saveToLeaderboard(entry) {
  const board = loadLeaderboard();
  board.push({
    name: String(entry.name).trim().slice(0, 30),
    score: Number(entry.score) || 0,
    planetsRescued: Number(entry.planetsRescued) || 0,
    completionTime: Number(entry.completionTime) || 0,
    rating: entry.rating || 'Cadet',
    date: new Date().toLocaleDateString(),
  });
  board.sort((a, b) => b.score - a.score);
  const top = board.slice(0, GAME_CONFIG.MAX_LEADERBOARD_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(top));
  } catch {
    // Storage full or unavailable — silently ignore
  }
  return top;
}

/**
 * Clear the leaderboard (useful for testing).
 */
export function clearLeaderboard() {
  localStorage.removeItem(KEY);
}

/**
 * Format seconds as MM:SS string.
 */
export function formatTime(seconds) {
  const m = Math.floor(Math.abs(seconds) / 60).toString().padStart(2, '0');
  const s = (Math.abs(seconds) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Compute mission rating based on score and planets rescued.
 */
export function computeRating(score, planetsRescued, accuracy) {
  if (planetsRescued === 3 && accuracy >= 80 && score >= 600) return 'GALACTIC HERO ⭐⭐⭐';
  if (planetsRescued >= 2 && score >= 400) return 'STAR COMMANDER ⭐⭐';
  if (planetsRescued >= 1 && score >= 200) return 'SPACE PILOT ⭐';
  return 'GALAXY CADET';
}
