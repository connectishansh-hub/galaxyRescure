/**
 * gameData.js
 * All static challenge data, planet definitions, and configuration.
 * Separated from game logic to make data easy to edit.
 */

// ── Game configuration ──────────────────────────────────────────────────────
export const GAME_CONFIG = {
  DURATION_SECONDS: 300,        // 5 minutes default
  DEV_DURATION_SECONDS: 120,    // shorter for dev testing (set USE_DEV below)
  USE_DEV_DURATION: false,      // flip to true during development
  MAX_LEADERBOARD_ENTRIES: 10,
  LEADERBOARD_KEY: 'galaxy_rescue_leaderboard_v2',
};

// ── Planet definitions ───────────────────────────────────────────────────────
export const PLANETS = [
  {
    id: 'p1',
    name: 'Zephyra',
    emoji: '🌍',
    color: '#4da6ff',
    glowColor: 'rgba(77,166,255,0.6)',
    description: 'Ocean world with dense atmosphere',
    oxygen: 28,      // % (critical < 35)
    energy: 72,
    shield: 85,
    inDanger: true,  // used in Stage 2 answer key
  },
  {
    id: 'p2',
    name: 'Volcanis',
    emoji: '🪐',
    color: '#ff6633',
    glowColor: 'rgba(255,102,51,0.6)',
    description: 'Volcanic gas giant, unstable core',
    oxygen: 61,
    energy: 18,      // critical < 25
    shield: 22,      // critical < 30
    inDanger: true,
  },
  {
    id: 'p3',
    name: 'Crystara',
    emoji: '💜',
    color: '#bf5fff',
    glowColor: 'rgba(191,95,255,0.6)',
    description: 'Crystal nebula, stable conditions',
    oxygen: 78,
    energy: 64,
    shield: 71,
    inDanger: false,
  },
];

// ── Stage 2: Which planets are in danger? ─────────────────────────────────
// Danger thresholds
export const DANGER_THRESHOLDS = { oxygen: 35, energy: 25, shield: 30 };
// Correct answer: planet IDs that are in danger
export const DANGER_ANSWER_KEY = PLANETS.filter(p => p.inDanger).map(p => p.id);

// ── Stage 3: Alien attack puzzle pool ─────────────────────────────────────
export const PUZZLES = [
  {
    id: 'puzzle1',
    type: 'math',
    question: 'The alien mothership fires in a Fibonacci sequence. After 8, 13 the next value is:',
    options: ['18', '21', '24', '20'],
    correctIndex: 1,
    explanation: '8 + 13 = 21 (Fibonacci sequence)',
  },
  {
    id: 'puzzle2',
    type: 'logic',
    question: 'Galaxy Bot encrypts its auth-code: if A=1, B=2 … Z=26, decode "RPA" (sum of values):',
    options: ['47', '51', '49', '53'],
    correctIndex: 1,
    // R=18, P=16, A=1 → 35... wait, sum = 35. Let's fix.
    // R=18, P=16, A=1 => 35. Choose option accordingly.
    explanation: 'R=18, P=16, A=1 → 18+16+1 = 35',
  },
  {
    id: 'puzzle3',
    type: 'sequence',
    question: 'The distress beacon repeats: 3, 6, 12, 24, __ What comes next?',
    options: ['36', '48', '42', '60'],
    correctIndex: 1,
    explanation: 'Each term doubles: 24 × 2 = 48',
  },
  {
    id: 'puzzle4',
    type: 'math',
    question: 'An RPA bot processes 5 planets per minute. How many can it process in 45 seconds?',
    options: ['3', '4', '3.75', '5'],
    correctIndex: 2,
    explanation: '5 × (45/60) = 3.75 planets',
  },
];

// Fix puzzle2 — recalculate so options are correct
// R=18, P=16, A=1 => 35
PUZZLES[1] = {
  id: 'puzzle2',
  type: 'logic',
  question: 'Galaxy Bot encrypts its auth-code: if A=1, B=2 … Z=26, what is R+P+A?',
  options: ['33', '35', '37', '31'],
  correctIndex: 1,
  explanation: 'R=18, P=16, A=1 → 18+16+1 = 35',
};

// ── Stage 4: Resource allocation ─────────────────────────────────────────
export const RESOURCES = [
  { id: 'energy_cell', name: 'Energy Cell', emoji: '⚡', color: '#ffd700', quantity: 3 },
  { id: 'shield_gen',  name: 'Shield Gen',  emoji: '🛡️', color: '#4da6ff', quantity: 2 },
  { id: 'repair_kit',  name: 'Repair Kit',  emoji: '🔧', color: '#00ff88', quantity: 2 },
  { id: 'oxygen_tank', name: 'Oxygen Tank', emoji: '💨', color: '#00f5ff', quantity: 2 },
];

// Which resources each planet needs (must pick at least these to save it)
export const PLANET_RESCUE_REQUIREMENTS = {
  p1: ['oxygen_tank'],              // Zephyra needs oxygen
  p2: ['energy_cell', 'shield_gen'], // Volcanis needs energy + shield
  p3: [],                           // Crystara is safe, no resources needed
};

// ── Scoring ──────────────────────────────────────────────────────────────
export const SCORE_VALUES = {
  STAGE2_CORRECT_PLANET: 100,   // per correctly identified danger planet
  STAGE3_CORRECT_ANSWER: 200,   // puzzle correct
  STAGE4_PLANET_SAVED: 150,     // per planet saved
  SPEED_BONUS_THRESHOLD: 240,   // seconds remaining for speed bonus
  SPEED_BONUS: 100,
};

// ── RPA console messages by stage ────────────────────────────────────────
export const RPA_MESSAGES = {
  idle: [
    { text: 'Galaxy Bot v3.1 online.', status: 'IDLE' },
    { text: 'Awaiting mission commands...', status: 'IDLE' },
  ],
  stage1: [
    { text: 'Initializing Galaxy Bot...', status: 'RUNNING' },
    { text: 'Loading mission parameters...', status: 'RUNNING' },
    { text: 'Connecting to galactic network...', status: 'RUNNING' },
    { text: 'Scanning for distress signals...', status: 'RUNNING' },
    { text: '3 planets located in danger zone.', status: 'RUNNING' },
    { text: 'Assigning rescue tasks to RPA workflows...', status: 'RUNNING' },
    { text: 'Task 001: Planet Zephyra → ASSIGNED', status: 'RUNNING' },
    { text: 'Task 002: Planet Volcanis → ASSIGNED', status: 'RUNNING' },
    { text: 'Task 003: Planet Crystara → ASSIGNED', status: 'RUNNING' },
    { text: 'All tasks dispatched. Awaiting operator confirmation.', status: 'COMPLETED' },
  ],
  stage2: [
    { text: 'Initiating planetary scan protocol...', status: 'RUNNING' },
    { text: 'Reading oxygen levels across systems...', status: 'RUNNING' },
    { text: 'Reading energy core readings...', status: 'RUNNING' },
    { text: 'Reading shield integrity values...', status: 'RUNNING' },
    { text: 'Cross-referencing danger thresholds...', status: 'RUNNING' },
    { text: 'Verifying operator selection...', status: 'RUNNING' },
    { text: 'RPA validation complete.', status: 'COMPLETED' },
  ],
  stage3: [
    { text: 'ALERT: Alien fleet detected on radar!', status: 'RUNNING' },
    { text: 'Deploying counter-intelligence protocols...', status: 'RUNNING' },
    { text: 'Generating cryptographic challenge...', status: 'RUNNING' },
    { text: 'Verifying operator response...', status: 'RUNNING' },
    { text: 'Cross-checking with mission database...', status: 'RUNNING' },
    { text: 'Response validation complete.', status: 'COMPLETED' },
  ],
  stage4: [
    { text: 'Accessing resource depot inventory...', status: 'RUNNING' },
    { text: 'Calculating planetary rescue requirements...', status: 'RUNNING' },
    { text: 'Validating resource allocation plan...', status: 'RUNNING' },
    { text: 'Dispatching rescue drones...', status: 'RUNNING' },
    { text: 'Resource delivery in progress...', status: 'RUNNING' },
    { text: 'Updating planet health metrics...', status: 'RUNNING' },
    { text: 'Generating mission report...', status: 'COMPLETED' },
  ],
  final: [
    { text: 'Calculating final mission score...', status: 'RUNNING' },
    { text: 'Compiling accuracy metrics...', status: 'RUNNING' },
    { text: 'Generating Galaxy Rescue certificate...', status: 'RUNNING' },
    { text: 'Uploading results to command center...', status: 'COMPLETED' },
  ],
};
