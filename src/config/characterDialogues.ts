import { Checkpoint } from '../types/game';

export const CHARACTER_TIMEOUT_COOLDOWN_SEC = 10;

/**
 * Special failure message when quiz fails due to timeout:
 * - Guard: You wasted my time, I want to go on my chai break
 * - Professor: You wasted my time, I want to go to my next class
 * - Senior / Member / Lead: Character-specific humorous campus timeout dialogues
 */
export const getCharacterTimeoutFailureMessage = (checkpoint: Checkpoint): string => {
  const role = (checkpoint.characterRole || '').toLowerCase();
  const name = (checkpoint.characterName || '').toLowerCase();
  const stage = checkpoint.stageNumber;

  if (stage === 1 || role.includes('security') || role.includes('guard') || name.includes('ramesh')) {
    return 'You wasted my time! I want to go on my chai break. Chai thandi ho rahi hai meri canteen par!';
  }

  if (stage === 2 || role.includes('professor') || role.includes('faculty') || name.includes('sharma')) {
    return 'You wasted my precious time! I want to go to my next class now. Come back when your logic is actually prepared!';
  }

  if (stage === 3 || role.includes('senior') || name.includes('priya')) {
    return 'Arre yaar, pura placement prep ka time barbaad kar diya! I want to go to the canteen and library now!';
  }

  if (stage === 4 || role.includes('member') || name.includes('kabir')) {
    return 'Server timed out waiting for your thoughts! I want to go to my GDG sprint sync meeting now!';
  }

  if (stage === 5 || role.includes('lead') || role.includes('head') || name.includes('ananya')) {
    return 'The keynote auditorium doors are opening! I want to go to the stage now, no time for slow debuggers!';
  }

  return `You wasted my time! I need to take a quick break now. Come back when you can respond faster!`;
};

/**
 * Added comeback dialogue when the player lost once in timeout
 * and tries again after the 10-second cooldown ("Arre tum fir aa gaye"):
 * Unique Indian college humorous comeback lines for each character
 */
export const getCharacterComebackDialogue = (checkpoint: Checkpoint): string => {
  const role = (checkpoint.characterRole || '').toLowerCase();
  const name = (checkpoint.characterName || '').toLowerCase();
  const stage = checkpoint.stageNumber;

  if (stage === 1 || role.includes('security') || role.includes('guard') || name.includes('ramesh')) {
    return 'Arre tum fir aa gaye?! Abhi toh ek ghunt chai pi thi maine! Chalo jaldi batao ab, is baar mera time mat khana!';
  }

  if (stage === 2 || role.includes('professor') || role.includes('faculty') || name.includes('sharma')) {
    return 'Arre tum fir aa gaye? Agli class shuru hone hi wali thi! Is baar binary search jitna tezz sochna, time waste mat karna bilkul!';
  }

  if (stage === 3 || role.includes('senior') || name.includes('priya')) {
    return 'Arre tum fir aa gaye bhai?! Canteen mein abhi samosa order hi kiya tha! Ab jaldi fast answers do warna meri placement prep reh jayegi!';
  }

  if (stage === 4 || role.includes('member') || name.includes('kabir')) {
    return 'Arre tum fir aa gaye? Terminal restart karke aaye ho ya fir wahi scene hai? Quick commit karo is baar bina freeze hue!';
  }

  if (stage === 5 || role.includes('lead') || role.includes('head') || name.includes('ananya')) {
    return 'Arre tum fir aa gaye? Keynote slide change hone se pehle answer crack karo, poora auditorium wait kar raha hai!';
  }

  return 'Arre tum fir aa gaye? Break abhi abhi khatam hua hai, is baar jaldi sochna!';
};
