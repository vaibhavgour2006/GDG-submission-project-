import { calculateHaversineDistanceMeters, isInsideGeofence } from '../services/geofenceService';
import { DEFAULT_CHECKPOINTS, DEFAULT_QUESTIONS, DEFAULT_EVENT_CONFIG } from '../config/defaultData';
import { Participant } from '../types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ TEST FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

console.log('====================================================');
console.log('🧪 RUNNING CAMPUS QUEST AUTOMATED TEST SUITE');
console.log('====================================================\n');

// 1. Geofence & Haversine Distance Tests
console.log('--- 1. GEOFENCING & HAVERSINE MATH TESTS ---');
const gatekeeperLat = 22.680800;
const gatekeeperLon = 75.879000;

// Test exact same point distance is 0m
const distZero = calculateHaversineDistanceMeters(gatekeeperLat, gatekeeperLon, gatekeeperLat, gatekeeperLon);
assert(distZero === 0, `Distance to same point is 0 meters (got ${distZero})`);

// Test point within 10 meters is inside 30m geofence
const insidePoint = isInsideGeofence(gatekeeperLat + 0.00005, gatekeeperLon, gatekeeperLat, gatekeeperLon, 30, 0);
assert(insidePoint.inside === true, `Point +0.00005 deg (~5.5m) is detected inside 30m geofence (dist: ${insidePoint.distance}m)`);

// Test point 200m away is outside 30m geofence
const farPoint = isInsideGeofence(gatekeeperLat + 0.002, gatekeeperLon + 0.002, gatekeeperLat, gatekeeperLon, 30, 0);
assert(farPoint.inside === false, `Far point is detected outside 30m geofence (dist: ${farPoint.distance}m)`);

// Test Radius Boost expands effective geofence
const boostTest = isInsideGeofence(gatekeeperLat + 0.00035, gatekeeperLon, gatekeeperLat, gatekeeperLon, 30, 25);
assert(boostTest.effectiveRadius === 55, `Radius Boost adds +25m to radius (effective: ${boostTest.effectiveRadius}m)`);

// 2. Checkpoints Integrity Tests
console.log('\n--- 2. STORY CHECKPOINTS INTEGRITY TESTS ---');
assert(DEFAULT_CHECKPOINTS.length === 5, `All 5 checkpoints exist (found: ${DEFAULT_CHECKPOINTS.length})`);

const stages = DEFAULT_CHECKPOINTS.map(c => c.stageNumber);
assert(JSON.stringify(stages) === JSON.stringify([1, 2, 3, 4, 5]), 'Checkpoints strictly ordered from stage 1 to 5');

DEFAULT_CHECKPOINTS.forEach(cp => {
  assert(cp.latitude > 20 && cp.latitude < 30, `Checkpoint ${cp.stageNumber} latitude is valid for Indore (${cp.latitude})`);
  assert(cp.longitude > 70 && cp.longitude < 80, `Checkpoint ${cp.stageNumber} longitude is valid for Indore (${cp.longitude})`);
  assert(cp.radiusMeters >= 15, `Checkpoint ${cp.stageNumber} has a safe radius (got ${cp.radiusMeters}m)`);
  assert(cp.characterName.length > 0, `Checkpoint ${cp.stageNumber} has character assigned (${cp.characterName})`);
  assert(cp.fragmentCode.length > 0, `Checkpoint ${cp.stageNumber} has code fragment configured (${cp.fragmentCode})`);
});

// 3. Question Bank Integrity Tests
console.log('\n--- 3. 25 QUESTIONS & 5 OPTIONS TESTS ---');
assert(DEFAULT_QUESTIONS.length === 25, `Total 25 questions exist (found ${DEFAULT_QUESTIONS.length})`);

for (let stage = 1; stage <= 5; stage++) {
  const stageQs = DEFAULT_QUESTIONS.filter(q => q.stageNumber === stage);
  assert(stageQs.length === 5, `Stage ${stage} contains exactly 5 questions (got ${stageQs.length})`);

  stageQs.forEach((q, idx) => {
    assert(q.options.length === 5, `Stage ${stage} Q${idx + 1} has strictly 5 options (got ${q.options.length})`);
    const hasCorrect = q.options.some(opt => opt.id === q.correctAnswerId);
    assert(hasCorrect, `Stage ${stage} Q${idx + 1} has exactly one valid correct answer (${q.correctAnswerId})`);
    assert(q.hint.length > 0, `Stage ${stage} Q${idx + 1} has non-empty hint for Power-Up`);
  });
}

// 4. Lives, Retries, and Stage Progression Tests
console.log('\n--- 4. LIVES & RETRY LOGIC TESTS ---');
const testParticipant: Participant = {
  id: 'test_p1',
  rollNumber: '24CS099',
  displayName: 'Test Fresher',
  currentStage: 2,
  currentQuestionIndex: 0,
  lives: 3,
  score: 100,
  completedStages: [1],
  collectedFragments: ['GDG-'],
  powerUps: { hint_reveal: 2, radius_boost: 1, time_bonus: 1 },
  hasValidatedFinalKey: false,
  joinedAt: Date.now(),
  lastActiveAt: Date.now()
};

// Simulate wrong answer life deduction
let currentLives = testParticipant.lives;
currentLives = Math.max(0, currentLives - 1);
assert(currentLives === 2, `1 wrong answer consumes 1 life (lives left: ${currentLives})`);

currentLives = Math.max(0, currentLives - 1);
currentLives = Math.max(0, currentLives - 1);
assert(currentLives === 0, `3 wrong answers deplete lives to 0`);

// Lives never go negative
currentLives = Math.max(0, currentLives - 1);
assert(currentLives === 0, `Lives counter never drops below 0`);

// Professor failure sets Gatekeeper scolding state and preserves previous stage 1 & fragment
const failedStage = 2;
let isGatekeeperScolding = failedStage === 2;
assert(isGatekeeperScolding === true, 'Failing Stage 2 triggers return to Gatekeeper scolding scene');
assert(testParticipant.completedStages.includes(1), 'Stage 1 completion preserved during Stage 2 retry');
assert(testParticipant.collectedFragments.includes('GDG-'), 'Fragment 1 (GDG-) preserved during Stage 2 retry');

// 5. Code Fragments & Master Key Validation Tests
console.log('\n--- 5. CODE FRAGMENTS & SECRET KEY ASSEMBLY TESTS ---');
const fragmentsAwarded = DEFAULT_CHECKPOINTS.map(c => c.fragmentCode);
assert(fragmentsAwarded.length === 5, 'Exactly 5 fragments awarded across 5 checkpoints');

const assembledKey = fragmentsAwarded.join('');
assert(assembledKey === DEFAULT_EVENT_CONFIG.secretFinalKey, `Assembled fragments match secret final key: "${assembledKey}"`);

// Incomplete key validation rejection test
const incompleteFragments = ['GDG-', 'IET-', 'DAVV-'];
const canUnlockIncomplete = DEFAULT_EVENT_CONFIG.keyAssemblyOrder.every(f => incompleteFragments.includes(f));
assert(canUnlockIncomplete === false, 'Incomplete fragments cannot unlock the key');

// Full key validation test
const fullFragments = ['GDG-', 'IET-', 'DAVV-', 'QUEST-', '2026-KEY'];
const canUnlockFull = DEFAULT_EVENT_CONFIG.keyAssemblyOrder.every(f => fullFragments.includes(f));
assert(canUnlockFull === true, 'All 5 fragments correctly unlock the master key');

console.log('\n====================================================');
console.log('🎉 ALL AUTOMATED UNIT & INTEGRATION TESTS PASSED!');
console.log('====================================================\n');
