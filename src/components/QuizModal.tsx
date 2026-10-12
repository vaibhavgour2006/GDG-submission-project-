import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Checkpoint, Question, Participant, QuestionOption } from '../types/game';
import { FINAL_MOTIVATION_QUESTION } from '../config/defaultData';
import { 
  getCharacterTimeoutFailureMessage, 
  getCharacterComebackDialogue, 
  CHARACTER_TIMEOUT_COOLDOWN_SEC 
} from '../config/characterDialogues';
import { sounds } from '../services/soundEffects';
import { 
  Lightbulb, 
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  KeyRound,
  Sparkles,
  Clock,
  Timer,
  Zap,
  AlertTriangle,
  Coffee
} from 'lucide-react';

// Total seconds allowed for the whole 5 questions quiz per character (FASTER):
// Guard / Gatekeeper: 50s
// Professor: 42s
// Senior Student: 36s
// GDG Member: 30s
// GDG Lead / Head: 25s
// Decreases progressively by character stage
export const getStageTotalTimeLimit = (stageNumber: number): number => {
  const limits: Record<number, number> = {
    1: 50, // Guard / Gatekeeper
    2: 42, // Professor
    3: 36, // Senior Student
    4: 30, // GDG Member
    5: 25  // GDG Lead
  };
  return limits[stageNumber] || Math.max(20, 50 - (stageNumber - 1) * 6);
};

// Base question timeout per question index within the quiz (FASTER):
// Starts with 20s for Question 1, then progressively hardens (20s, 16s, 13s, 11s, 9s).
// Also gradually reduces by 1s per higher character stage.
export const getBaseQuestionTimeout = (stageNumber: number, questionIndex: number): number => {
  const baseSchedule = [20, 16, 13, 11, 9];
  const base = baseSchedule[Math.min(questionIndex, baseSchedule.length - 1)] || 10;
  const characterOffset = stageNumber - 1;
  return Math.max(7, base - characterOffset);
};

// Calculate moderate next-question timeout adjustment based on how fast the previous answer was given.
// Kept moderate (-1s to +3s) so it's snappy and rewarding without being chaotic.
export const calculateModeratePaceAdjustment = (allocated: number, remaining: number): number => {
  const timeSpent = Math.max(0, allocated - remaining);
  const timeSaved = Math.max(0, allocated - timeSpent);

  if (timeSaved >= allocated * 0.5) {
    // Fast answer (saved half or more time): moderate bonus (+2s to +3s)
    return Math.min(3, Math.max(2, Math.round(timeSaved * 0.25)));
  } else if (timeSaved > 2) {
    // Moderately prompt answer: +1s
    return 1;
  } else if (timeSpent >= allocated * 0.8) {
    // Sluggish answer / close call: slight pressure (-1s)
    return -1;
  }
  return 0;
};

interface QuizModalProps {
  checkpoint: Checkpoint;
  questions: Question[];
  participant: Participant;
  onAnswerSubmit: (
    isCorrect: boolean, 
    questionIndex: number, 
    remainingLives: number, 
    isStageComplete: boolean
  ) => void;
  onStageFailed: (stageNumber: number) => void;
  onStageSuccess: (stageNumber: number, fragmentCode: string) => void;
  onConsumeHint: () => boolean;
  onResetCompleteGame?: () => void;
  onTriggerTimeoutCooldown?: (checkpointId: string, cooldownUntil: number) => void;
  onClose: () => void;
}

export const QuizModal: React.FC<QuizModalProps> = ({
  checkpoint,
  questions,
  participant,
  onAnswerSubmit,
  onStageFailed,
  onStageSuccess,
  onConsumeHint,
  onResetCompleteGame,
  onTriggerTimeoutCooldown,
  onClose
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [lives, setLives] = useState(participant.lives || 3);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isLastAnswerCorrect, setIsLastAnswerCorrect] = useState<boolean | null>(null);
  const [feedbackJoke, setFeedbackJoke] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [failReason, setFailReason] = useState<string | null>(null);
  const [isTotalGameOver, setIsTotalGameOver] = useState(false);

  // Special Timeout Failure & 10s Cooldown State
  const [isTimeoutFailure, setIsTimeoutFailure] = useState(false);
  const [cooldownSecondsLeft, setCooldownSecondsLeft] = useState<number>(0);
  const [activeComebackDialogue, setActiveComebackDialogue] = useState<string | null>(() => {
    if (participant.characterTimeoutFailures?.[checkpoint.id]) {
      return getCharacterComebackDialogue(checkpoint);
    }
    return null;
  });

  // Total Stage Quiz Time Budget (50s for Guard, 42s for Professor, 36s for Senior, 30s for Member, 25s for Lead)
  const totalStageBudget = getStageTotalTimeLimit(checkpoint.stageNumber);
  const [totalSecondsLeft, setTotalSecondsLeft] = useState<number>(totalStageBudget);

  // Current Question Timeout (starts at 20s for Q1, progressively hardens)
  const initialQTime = Math.min(
    getBaseQuestionTimeout(checkpoint.stageNumber, 0),
    totalStageBudget
  );
  const [qAllocatedSeconds, setQAllocatedSeconds] = useState<number>(initialQTime);
  const [qSecondsLeft, setQSecondsLeft] = useState<number>(initialQTime);
  const [paceModifier, setPaceModifier] = useState<number>(0);

  // Stage 5 Motivation Question State
  const [showMotivationQ, setShowMotivationQ] = useState(false);
  const [motivationAnswerId, setMotivationAnswerId] = useState<string | null>(null);
  const [motivationFeedback, setMotivationFeedback] = useState<string | null>(null);

  // Switch to Pokémon Battle Theme when entering the Quiz Challenge
  useEffect(() => {
    sounds.startBattleTheme();
    return () => {
      sounds.stopBattleTheme();
    };
  }, []);

  // 10s Cooldown countdown interval
  useEffect(() => {
    if (cooldownSecondsLeft <= 0) return;
    const timer = setInterval(() => {
      setCooldownSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSecondsLeft]);

  // Unified Timeout Failure Handler (Triggered on Question Timeout OR Total Stage Quiz Timeout)
  const triggerTimeoutFailure = (reason: 'stage' | 'question') => {
    sounds.playWrong();
    setIsAnswerChecked(true);
    setIsLastAnswerCorrect(false);

    // Lose 1 heart on timeout
    const newLives = Math.max(0, lives - 1);
    setLives(newLives);
    setIsFailed(true);
    setIsTimeoutFailure(true);

    if (newLives <= 0) {
      // 0 Hearts remaining -> Complete Game Over back to Guard (Stage 1)
      setIsTotalGameOver(true);
      setFailReason(
        `Time limit expired and all 3 hearts lost (0/3 ❤️)! You took too long to compile an answer. Complete game resets back to The Guard at Stage 1!`
      );
    } else {
      // Hearts remain -> Safeguarded! Apply 10s Cooldown & Special Chai/Class break message
      setIsTotalGameOver(false);
      setFailReason(
        reason === 'stage'
          ? `Overall Quiz Time Expired! ${checkpoint.characterName}'s limit of ${totalStageBudget}s ran out (-1 ❤️). Your remaining ${newLives} ❤️ safeguard you from a full reset. Take a 10s breather while they take their break!`
          : `Question Time Expired! (-1 ❤️). You took too long to compile an answer. Your remaining ${newLives} ❤️ safeguard you from a full reset. Wait for their 10s break to finish before restarting!`
      );
      setCooldownSecondsLeft(CHARACTER_TIMEOUT_COOLDOWN_SEC);
      if (onTriggerTimeoutCooldown) {
        onTriggerTimeoutCooldown(checkpoint.id, Date.now() + CHARACTER_TIMEOUT_COOLDOWN_SEC * 1000);
      }
    }

    onAnswerSubmit(false, currentQIndex, newLives, false);
  };

  // Countdown timer effect for both Current Question and Total Stage Quiz Budget
  useEffect(() => {
    if (isAnswerChecked || isFailed || isSuccess || showMotivationQ) return;

    const interval = setInterval(() => {
      // Audio warning tick when question timer runs low (urgent when <= 2s)
      if (qSecondsLeft <= 5 && qSecondsLeft > 1) {
        sounds.playTimerTick(qSecondsLeft <= 2);
      }

      // 1. Total Stage Quiz Limit Expired
      if (totalSecondsLeft <= 1) {
        clearInterval(interval);
        setTotalSecondsLeft(0);
        setQSecondsLeft(0);
        triggerTimeoutFailure('stage');
        return;
      }

      // 2. Current Question Timeout Expired
      if (qSecondsLeft <= 1) {
        clearInterval(interval);
        setQSecondsLeft(0);
        triggerTimeoutFailure('question');
        return;
      }

      setTotalSecondsLeft(prev => Math.max(0, prev - 1));
      setQSecondsLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [
    isAnswerChecked, 
    isFailed, 
    isSuccess, 
    showMotivationQ, 
    qSecondsLeft, 
    totalSecondsLeft, 
    checkpoint.characterName, 
    totalStageBudget,
    lives
  ]);

  const currentQuestion = questions[currentQIndex] || questions[0];
  const isLastQuestion = currentQIndex >= questions.length - 1;

  // Handle Option Click
  const handleSelectOption = (option: QuestionOption) => {
    if (isAnswerChecked || isFailed || isSuccess) return;
    sounds.playClick();
    setSelectedOptionId(option.id);
  };

  // Submit Answer
  const handleConfirmAnswer = () => {
    if (!selectedOptionId || isAnswerChecked) return;

    const isCorrect = selectedOptionId === currentQuestion.correctAnswerId;
    setIsAnswerChecked(true);
    setIsLastAnswerCorrect(isCorrect);

    // Calculate moderate speed adjustment for the next question based on how fast this answer was given
    const nextMod = calculateModeratePaceAdjustment(qAllocatedSeconds, qSecondsLeft);
    setPaceModifier(nextMod);

    if (isCorrect) {
      sounds.playCorrect();
      setFeedbackJoke(null);

      // Check if this is the final question of the stage
      if (isLastQuestion) {
        if (checkpoint.stageNumber === 5) {
          setShowMotivationQ(true);
        } else {
          handleTriggerStageSuccess();
        }
      }
    } else {
      // Wrong answer: user CANNOT go to the next question, loses 1 heart, must restart quiz!
      sounds.playWrong();
      const newLives = Math.max(0, lives - 1);
      setLives(newLives);

      // Pick funny compiler joke
      const jokes = [
        "Access denied! Your answer failed to compile.",
        "Bhai, itna confidence aur output galat?",
        "Wrong output. Please update your brain's firmware.",
        "Shabash! Compiler bhi tumse explanation maang raha hai.",
        "Request rejected. Your logic is currently under maintenance.",
        "Interesting answer. Confidence toh hai, bas logic vacation par hai.",
        "Ye logic dekh ke compiler ne sick leave maang li."
      ];
      const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];

      if (newLives <= 0) {
        setIsTotalGameOver(true);
        setIsFailed(true);
        setFailReason(
          "Out of lives! All 3 hearts lost (0/3). As per quest rules, you must start again from The Guard (Gatekeeper) at Stage 1 as the complete game resets!"
        );
      } else {
        setFeedbackJoke(
          `Incorrect logic! (-1 ❤️). You cannot go to the next question. You must restart ${checkpoint.characterName}'s quiz from Question 1! Your remaining ${newLives} ❤️ safeguard you from a full game reset. (${randomJoke})`
        );
      }
    }

    onAnswerSubmit(isCorrect, currentQIndex, isCorrect ? lives : Math.max(0, lives - 1), isCorrect && isLastQuestion);
  };

  // Trigger Stage Success & Confetti
  const handleTriggerStageSuccess = () => {
    setIsSuccess(true);
    sounds.playStageComplete();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // ignore
    }
  };

  // Next Question
  const handleNextQuestion = () => {
    sounds.playClick();
    setIsAnswerChecked(false);
    setSelectedOptionId(null);
    setIsLastAnswerCorrect(null);
    setFeedbackJoke(null);
    setShowHint(false);

    const nextIndex = currentQIndex + 1;
    setCurrentQIndex(nextIndex);

    // Progressively hardening base timeout + moderate speed adjustment
    const nextBase = getBaseQuestionTimeout(checkpoint.stageNumber, nextIndex);
    // Adjusted timeout clamped moderately to remaining total stage seconds
    const adjusted = Math.max(
      12,
      Math.min(nextBase + paceModifier, totalSecondsLeft)
    );
    setQAllocatedSeconds(adjusted);
    setQSecondsLeft(adjusted);
  };

  // Use Hint Power-Up
  const handleUseHint = () => {
    const success = onConsumeHint();
    if (success) {
      sounds.playCorrect();
      setShowHint(true);
    } else {
      sounds.playWrong();
      setFeedbackJoke("⚠️ No Hint Reveal charges left! Complete stages to earn more power-ups.");
    }
  };

  // Stage 5 Motivation Option Selected
  const handleSelectMotivation = (optId: string) => {
    sounds.playCorrect();
    setMotivationAnswerId(optId);
    const feedback = (FINAL_MOTIVATION_QUESTION.responses as Record<string, string>)[optId] || "Great choice!";
    setMotivationFeedback(feedback);
  };

  const handleFinishMotivationAndComplete = () => {
    sounds.playClick();
    setShowMotivationQ(false);
    handleTriggerStageSuccess();
  };

  // Restart this character's quiz attempt from Question 1 (keeping remaining lives)
  const handleRestartQuizAttempt = (remainingHearts: number) => {
    sounds.playClick();
    if (remainingHearts <= 0) {
      if (onResetCompleteGame) {
        onResetCompleteGame();
      } else {
        onStageFailed(1);
        onClose();
      }
      return;
    }

    const freshTotal = getStageTotalTimeLimit(checkpoint.stageNumber);
    setTotalSecondsLeft(freshTotal);
    const freshQ = Math.min(
      getBaseQuestionTimeout(checkpoint.stageNumber, 0),
      freshTotal
    );
    setQAllocatedSeconds(freshQ);
    setQSecondsLeft(freshQ);
    setPaceModifier(0);
    setFailReason(null);
    setIsFailed(false);
    setIsTotalGameOver(false);
    setIsTimeoutFailure(false);
    setCurrentQIndex(0);
    setIsAnswerChecked(false);
    setSelectedOptionId(null);
    setIsLastAnswerCorrect(null);
    setFeedbackJoke(null);
    setShowHint(false);
    setLives(remainingHearts);

    // If player experienced timeout failure, show the added comeback dialogue ("Arre tum fir aa gaye?!")
    setActiveComebackDialogue(getCharacterComebackDialogue(checkpoint));
  };

  // Retry stage fallback (restores full lives if needed)
  const handleRetryStage = () => {
    sounds.playClick();
    handleRestartQuizAttempt(lives > 0 ? lives : 3);
  };

  // Finish and claim fragment
  const handleClaimFragmentAndContinue = () => {
    sounds.playCorrect();
    onStageSuccess(checkpoint.stageNumber, checkpoint.fragmentCode);
  };

  // ===================== STAGE 5 MOTIVATION RECTANGULAR DIALOGUE BOX =====================
  if (showMotivationQ) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Rectangular Pokémon Dialogue Frame */}
          <div className="relative bg-slate-900 border-2 border-cyan-400 shadow-2xl rounded-xl p-5 sm:p-7">
            {/* Gold Accent Bars on Left/Right */}
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-r" />
            <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-l" />

            {/* Nameplate tab */}
            <div className="absolute -top-4 left-6 bg-slate-950 border border-cyan-400 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-400 block" />
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
                🚀 ANANYA • GDG HEAD
              </span>
            </div>

            <div className="mt-2 mb-4">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-1">
                FINAL CHALLENGE: GDG MOTIVATION
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                "{FINAL_MOTIVATION_QUESTION.prompt}"
              </h3>
            </div>

            {/* Rectangular Choices */}
            <div className="space-y-2 mb-4">
              {FINAL_MOTIVATION_QUESTION.options.map((opt, idx) => (
                <button
                  key={opt.id}
                  onClick={() => handleSelectMotivation(opt.id)}
                  className={`w-full p-3 text-left border rounded-lg text-xs sm:text-sm font-medium transition flex items-center justify-between ${
                    motivationAnswerId === opt.id
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-400 shadow-md ring-1 ring-cyan-400 font-bold'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span>
                    <strong className="text-cyan-400 font-mono mr-2">{idx + 1}.</strong>
                    {opt.text}
                  </span>
                  {motivationAnswerId === opt.id && <span className="text-cyan-400">✓</span>}
                </button>
              ))}
            </div>

            {motivationFeedback && (
              <div className="bg-slate-950 border border-cyan-800 rounded-lg p-3.5 mb-4 text-xs sm:text-sm text-cyan-200 italic">
                <strong className="text-cyan-400 not-italic block mb-0.5">GDG Head:</strong>
                "{motivationFeedback}"
              </div>
            )}

            {motivationAnswerId && (
              <button
                onClick={handleFinishMotivationAndComplete}
                className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm shadow-xl hover:scale-101 active:scale-99 transition flex items-center justify-center gap-2 border border-amber-300"
              >
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>CLAIM THE 5TH FRAGMENT & KEY ▶</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===================== FAILED STAGE / GAME OVER SCREEN (RECTANGULAR) =====================
  if (isFailed) {
    const isTotalReset = lives <= 0 || isTotalGameOver;
    const timeoutQuote = getCharacterTimeoutFailureMessage(checkpoint);

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          <div className="relative bg-slate-900 border-2 border-rose-500 shadow-2xl rounded-xl p-5 sm:p-7">
            {/* Red Accent Stripes */}
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-rose-500 rounded-r" />
            <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-rose-500 rounded-l" />

            {/* Nameplate tab */}
            <div className="absolute -top-4 left-6 bg-slate-950 border border-rose-500 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-rose-500 block" />
              <span className="text-xs font-black uppercase tracking-wider text-rose-300">
                {isTotalReset
                  ? '💔 ALL 3 HEARTS LOST • COMPLETE GAME RESET'
                  : isTimeoutFailure
                  ? `☕ ${checkpoint.characterName.toUpperCase()} • TIMEOUT BREAK`
                  : `⚠️ QUIZ FAILED (${lives}/3 ❤️ SAFEGUARDED)`}
              </span>
            </div>

            <div className="mt-2 mb-4">
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                {isTotalReset ? (
                  <span>All 3 Hearts Lost! Resetting to Guard</span>
                ) : isTimeoutFailure ? (
                  <>
                    <Coffee className="w-5 h-5 text-amber-400 animate-pulse" />
                    <span>Time Expired! (-1 ❤️ Lost)</span>
                  </>
                ) : (
                  <span>Quiz Attempt Failed (-1 ❤️ Lost)</span>
                )}
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {isTotalReset
                  ? 'You lost all 3 hearts! The three hearts were your safeguards to protect you from going back to the start. With 0 hearts left, the entire game resets back to The Guard (Gatekeeper) at Stage 1!'
                  : isTimeoutFailure
                  ? `Time ran out before you could confirm the answer (-1 ❤️ deducted). Your remaining ${lives} heart${lives > 1 ? 's' : ''} safeguard you from a full game reset! Wait for ${checkpoint.characterName}'s 10-second break before retrying.`
                  : failReason || `You lost 1 heart on this attempt. Your remaining ${lives} heart${lives > 1 ? 's' : ''} safeguard you from going completely back to the start! Restart ${checkpoint.characterName}'s quiz from Question 1.`}
              </p>
            </div>

            {/* Special Failure Message from Character */}
            <div className="bg-slate-950 border border-rose-900 rounded-lg p-3.5 mb-4 text-xs sm:text-sm text-rose-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{checkpoint.characterAvatar}</span>
                <strong className="text-rose-400 not-italic font-bold">
                  {isTotalReset ? 'The Gatekeeper (Ramesh Bhaiya):' : `${checkpoint.characterName}:`}
                </strong>
              </div>
              <p className="italic">
                "{isTotalReset 
                  ? 'Rules of the campus quest: All 3 hearts lost means complete game reset back to the Main Gate with me! Let\'s see if you can make it this time.' 
                  : isTimeoutFailure
                  ? timeoutQuote
                  : checkpoint.failureDialogue?.text || 'Compilation failed. You cannot proceed to the next question. Use your remaining hearts to restart from Question 1!'}"
              </p>
            </div>

            {/* 10-Second Cooldown Penalty Box (on Timeout) */}
            {!isTotalReset && isTimeoutFailure && (
              <div className="mb-4 p-3 rounded-lg bg-amber-950/50 border border-amber-600/70 text-amber-200 text-xs">
                <div className="flex items-center justify-between mb-1.5 font-bold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <Coffee className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>{checkpoint.characterName} is on break...</span>
                  </span>
                  <span className="font-mono text-amber-300 font-extrabold text-sm">
                    {cooldownSecondsLeft > 0 ? `00:0${cooldownSecondsLeft}s` : '✅ Ready!'}
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-amber-900/60">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-1000 ease-linear"
                    style={{ width: `${(Math.max(0, cooldownSecondsLeft) / CHARACTER_TIMEOUT_COOLDOWN_SEC) * 100}%` }}
                  />
                </div>
                <p className="text-[11px] text-amber-300/90 mt-1.5">
                  {cooldownSecondsLeft > 0
                    ? `10-second penalty active to make the challenge tough. Character will not speak until break ends!`
                    : `Break over! You can now restart ${checkpoint.characterName}'s quiz.`}
                </p>
              </div>
            )}

            <div className="space-y-2.5">
              {isTotalReset ? (
                <button
                  onClick={() => {
                    sounds.playClick();
                    if (onResetCompleteGame) {
                      onResetCompleteGame();
                    } else {
                      onStageFailed(1);
                      onClose();
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition hover:scale-101 active:scale-99 animate-pulse"
                >
                  <RotateCcw className="w-4 h-4 stroke-[3]" />
                  <span>START AGAIN FROM GUARD (STAGE 1 - COMPLETE RESET)</span>
                </button>
              ) : (
                <button
                  disabled={cooldownSecondsLeft > 0}
                  onClick={() => handleRestartQuizAttempt(lives)}
                  className={`w-full py-3.5 px-6 rounded-lg font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                    cooldownSecondsLeft > 0
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-90'
                      : 'bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 text-slate-950 hover:scale-101 active:scale-99 shadow-rose-950/50'
                  }`}
                >
                  {cooldownSecondsLeft > 0 ? (
                    <>
                      <Coffee className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span>ON BREAK • WAIT FOR COOLDOWN (00:0{cooldownSecondsLeft}s)</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4 stroke-[3]" />
                      <span>
                        RESTART {checkpoint.characterName.toUpperCase()} QUIZ ({lives}/3 ❤️ SAFEGUARDED)
                      </span>
                    </>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  sounds.playClick();
                  if (isTotalReset && onResetCompleteGame) {
                    onResetCompleteGame();
                  } else {
                    onClose();
                  }
                }}
                className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold border border-slate-800 transition"
              >
                {isTotalReset ? 'Return to Main Gate (Restart at Gatekeeper)' : 'Return to Campus Map'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== STAGE SUCCESS RECTANGULAR BOX =====================
  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          <div className="relative bg-slate-900 border-2 border-emerald-400 shadow-2xl rounded-xl p-5 sm:p-7 text-center">
            {/* Green Accent Stripes */}
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-emerald-400 rounded-r" />
            <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-emerald-400 rounded-l" />

            {/* Nameplate tab */}
            <div className="absolute -top-4 left-6 bg-slate-950 border border-emerald-400 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-emerald-400 block" />
              <span className="text-xs font-black uppercase tracking-wider text-emerald-300">
                🎉 STAGE {checkpoint.stageNumber} COMPLETED • +100 PTS
              </span>
            </div>

            <div className="mt-3 mb-4">
              <h2 className="text-xl font-black text-white">Challenge Cleared!</h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 italic">
                "{checkpoint.successDialogue?.text}"
              </p>
            </div>

            {/* Fragment Box */}
            <div className="bg-slate-950 border-2 border-dashed border-emerald-400 rounded-lg p-4 mb-5">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                SECRET REWARD UNLOCKED
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-widest my-1 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">
                {checkpoint.fragmentText}
              </div>
              <span className="text-xs text-slate-400">{checkpoint.fragmentName}</span>
            </div>

            <button
              onClick={handleClaimFragmentAndContinue}
              className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 hover:scale-101 active:scale-99 transition"
            >
              <span>CONTINUE TO NEXT DESTINATION</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== ACTIVE QUESTIONING BOX (POKÉMON STYLE RECTANGULAR) =====================
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl my-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* Floating Top Ribbon: Avatar, Stage, Lives, Hint */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-2xl shadow-lg shrink-0">
              {checkpoint.characterAvatar}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{checkpoint.characterName}</span>
                <span className="text-slate-500">•</span>
                <span className="text-cyan-400 font-mono">Stage {checkpoint.stageNumber}/5</span>
              </div>
              <div className="text-[10px] text-slate-400">
                Question {currentQIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          {/* Lives & Hint Power-Up */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUseHint}
              disabled={showHint}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition ${
                showHint
                  ? 'bg-amber-950 text-amber-300 border-amber-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-slate-700'
              }`}
              title="Use Hint Reveal Power-Up"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Hint ({participant.powerUps.hint_reveal || 0})</span>
            </button>

            <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              {[1, 2, 3].map((heart) => (
                <span
                  key={heart}
                  className={`text-xs transition-all ${
                    heart <= lives ? 'opacity-100 scale-100' : 'opacity-20 grayscale scale-75'
                  }`}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* POKÉMON STYLE RECTANGULAR QUESTION BOX (Per Reference Images) */}
        <div className="relative bg-slate-900 border-2 border-cyan-500/80 shadow-2xl rounded-xl p-5 sm:p-7">
          
          {/* Left & Right Gold Accent Bars (from Pokemon Scarlet / Let's Go reference photos) */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-r" />
          <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-l" />

          {/* Rectangular Nameplate Tab overlapping top-left edge */}
          <div className="absolute -top-4 left-6 bg-slate-950 border border-cyan-500 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-400 block" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
              {checkpoint.characterName} • Q{currentQIndex + 1}/{questions.length}
            </span>
          </div>

          {/* Dual Timer HUD: Current Question Timeout & Character's Total Quiz Budget */}
          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              
              {/* Question Countdown Timer */}
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs transition-all shadow-sm ${
                  qSecondsLeft <= 7
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse ring-2 ring-rose-500/30'
                    : qSecondsLeft <= 15
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/60'
                }`}>
                  <Timer className={`w-3.5 h-3.5 ${qSecondsLeft <= 7 ? 'animate-ping text-rose-400' : 'text-cyan-400'}`} />
                  <span>Q{currentQIndex + 1} Time: {qSecondsLeft}s</span>
                </div>

                {/* Moderate Pace Adjustment Badge */}
                {paceModifier !== 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 animate-in fade-in ${
                    paceModifier > 0 
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/70 shadow-sm' 
                      : 'bg-amber-950/80 text-amber-300 border-amber-600/70 shadow-sm'
                  }`}>
                    {paceModifier > 0 ? (
                      <>
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span>+{paceModifier}s Speed Bonus!</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>-{Math.abs(paceModifier)}s Tightened</span>
                      </>
                    )}
                  </span>
                )}
              </div>

              {/* Total Character Quiz Limit */}
              <div className="flex items-center gap-1.5">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono font-bold text-xs ${
                  totalSecondsLeft <= 15
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500 animate-pulse'
                    : totalSecondsLeft <= 30
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                    : 'bg-slate-950 text-slate-200 border-slate-700'
                }`}>
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quiz Budget: {totalSecondsLeft}s / {totalStageBudget}s</span>
                </div>
              </div>
            </div>

            {/* Dual Visual Meters: Question Bar + Stage Total Meter */}
            <div className="space-y-1.5">
              {/* Question Countdown Bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800 p-[1px]">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    qSecondsLeft <= 7
                      ? 'bg-gradient-to-r from-rose-500 to-rose-400 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                      : qSecondsLeft <= 15
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, (qSecondsLeft / qAllocatedSeconds) * 100))}%` }}
                />
              </div>

              {/* Total Stage Budget Progress Tracker */}
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono px-0.5">
                <span className="flex items-center gap-1">
                  <span>{checkpoint.characterName} Total Quiz Budget ({totalStageBudget}s)</span>
                </span>
                <span>{totalSecondsLeft}s left ({Math.round((totalSecondsLeft / totalStageBudget) * 100)}%)</span>
              </div>
              <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-850">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-cyan-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, (totalSecondsLeft / totalStageBudget) * 100))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comeback Dialogue Banner when retrying after timeout ("Arre tum fir aa gaye?!") */}
          {activeComebackDialogue && (
            <div className="mb-4 p-3 rounded-lg bg-amber-950/85 border border-amber-500/80 text-amber-200 text-xs sm:text-sm flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0">{checkpoint.characterAvatar}</span>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-900/90 px-2 py-0.5 rounded border border-amber-700 inline-block mb-1">
                    {checkpoint.characterName} • BREAK OVER
                  </span>
                  <p className="font-semibold italic text-amber-100">
                    "{activeComebackDialogue}"
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveComebackDialogue(null)}
                className="text-[11px] text-amber-300 hover:text-white px-2 py-1 rounded bg-amber-900/80 border border-amber-600/60 font-bold shrink-0 transition"
                title="Dismiss message"
              >
                Dismiss ✕
              </button>
            </div>
          )}

          {/* Question Prompt inside the rectangular dialogue frame */}
          <div className="pt-1 mb-4">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-100 whitespace-pre-line leading-relaxed tracking-wide">
              {currentQuestion.prompt}
            </h3>

            {/* Hint Box (if revealed) */}
            {showHint && (
              <div className="mt-3 p-3 rounded-lg bg-amber-950/60 border border-amber-600/80 text-amber-200 text-xs flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-300 font-bold">CLUE:</strong>
                  {currentQuestion.hint}
                </div>
              </div>
            )}
          </div>

          {/* 5 RECTANGULAR ANSWER OPTIONS (Pokémon Battle Move Layout) */}
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedOptionId === option.id;
              const isCorrectOption = option.id === currentQuestion.correctAnswerId;

              let btnStyle = 'bg-slate-950 text-slate-200 border-slate-800 hover:border-slate-700 hover:bg-slate-800/90';

              if (isAnswerChecked) {
                if (isCorrectOption) {
                  btnStyle = 'bg-emerald-950/90 text-emerald-200 border-emerald-400 ring-1 ring-emerald-400 font-bold';
                } else if (isSelected && !isCorrectOption) {
                  btnStyle = 'bg-rose-950/90 text-rose-200 border-rose-500 font-bold';
                } else {
                  btnStyle = 'bg-slate-950/40 text-slate-500 border-slate-900 opacity-40';
                }
              } else if (isSelected) {
                btnStyle = 'bg-cyan-950 text-cyan-200 border-cyan-400 ring-1 ring-cyan-400 font-bold';
              }

              return (
                <button
                  key={option.id}
                  onClick={() => handleSelectOption(option)}
                  disabled={isAnswerChecked}
                  className={`w-full p-3 rounded-lg text-left border text-xs sm:text-sm transition-all flex items-start gap-3 ${btnStyle}`}
                >
                  <span className="font-mono font-black text-cyan-400 shrink-0 mt-0.5 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-1 leading-relaxed">{option.text}</span>
                  {isAnswerChecked && isCorrectOption && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  )}
                  {isAnswerChecked && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Wrong Answer Feedback / Quiz Restart Warning */}
          {isAnswerChecked && !isLastAnswerCorrect && (
            <div className="p-3 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-200 text-xs sm:text-sm mb-4 flex items-start gap-2.5 animate-in fade-in shadow-lg">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-300 block">
                  {lives > 0 
                    ? `⚠️ ATTEMPT FAILED (-1 ❤️) • ${lives}/3 SAFEGUARD HEARTS LEFT`
                    : '💔 ALL 3 HEARTS LOST (0/3)'}
                </span>
                <p className="text-xs text-rose-200 leading-relaxed">
                  {lives > 0
                    ? `You cannot advance to the next question. You must restart ${checkpoint.characterName}'s quiz from Question 1! Your remaining ${lives} ❤️ safeguard you from going completely back to the start.`
                    : 'All 3 hearts lost! Complete game resets back to The Guard at Stage 1.'}
                </p>
                {feedbackJoke && (
                  <p className="text-[11px] text-rose-300/80 italic mt-0.5">"{feedbackJoke}"</p>
                )}
              </div>
            </div>
          )}

          {/* Bottom Controls Bar: Bouncing indicator & Confirmation */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition"
            >
              Leave
            </button>

            {/* Bouncing Prompt Arrow */}
            {!isAnswerChecked && selectedOptionId && (
              <span className="text-cyan-400 text-sm font-black animate-bounce hidden sm:inline" title="Selection ready">
                ▼
              </span>
            )}

            {!isAnswerChecked ? (
              <button
                onClick={handleConfirmAnswer}
                disabled={!selectedOptionId}
                className={`px-6 py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all shadow-md ${
                  selectedOptionId
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:scale-102 active:scale-98 shadow-cyan-500/25'
                    : 'bg-slate-950 text-slate-600 border border-slate-800 cursor-not-allowed'
                }`}
              >
                CONFIRM ANSWER ▶
              </button>
            ) : isLastAnswerCorrect ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition flex items-center gap-1.5"
              >
                <span>{isLastQuestion ? 'FINISH STAGE' : 'NEXT QUESTION'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={() => handleRestartQuizAttempt(lives)}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-rose-500 via-rose-400 to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-md hover:scale-102 active:scale-98 transition flex items-center gap-1.5 animate-pulse"
              >
                <RotateCcw className="w-4 h-4 stroke-[3]" />
                <span>RESTART QUIZ ({lives}/3 ❤️ LEFT)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
