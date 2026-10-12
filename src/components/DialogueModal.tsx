import React, { useState, useEffect, useMemo } from 'react';
import { Checkpoint, Participant, BranchOption } from '../types/game';
import { DEFAULT_BRANCHES } from '../config/defaultData';
import { 
  getCharacterTimeoutFailureMessage, 
  getCharacterComebackDialogue 
} from '../config/characterDialogues';
import { sounds } from '../services/soundEffects';
import { 
  ChevronRight, 
  RotateCcw, 
  CheckCircle2, 
  GraduationCap,
  FastForward,
  Coffee
} from 'lucide-react';

interface DialogueModalProps {
  checkpoint: Checkpoint;
  participant: Participant;
  isGatekeeperScolding?: boolean;
  onAcceptChallenge: () => void;
  onRetryProfessorAgain?: () => void;
  onReviewProgress?: () => void;
  onClose: () => void;
}

export const DialogueModal: React.FC<DialogueModalProps> = ({
  checkpoint,
  participant,
  isGatekeeperScolding = false,
  onAcceptChallenge,
  onRetryProfessorAgain,
  onReviewProgress,
  onClose
}) => {
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [selectedBranch, setSelectedBranch] = useState<BranchOption>(
    participant.branch || 'Computer Science and Engineering'
  );

  // Character 10-second Cooldown Check
  const cooldownUntil = participant.characterCooldowns?.[checkpoint.id] || 0;
  const [cooldownRemainingSecs, setCooldownRemainingSecs] = useState<number>(() =>
    Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  );

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownRemainingSecs(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemainingSecs(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  // Dialogue lines: if player previously timed out, inject the added comeback dialogue ("Arre tum fir aa gaye?!")
  const dialogueLines = useMemo(() => {
    const baseLines = checkpoint.introDialogue || [];
    if (participant.characterTimeoutFailures?.[checkpoint.id] && !isGatekeeperScolding) {
      return [
        {
          speaker: checkpoint.characterName,
          text: getCharacterComebackDialogue(checkpoint)
        },
        ...baseLines
      ];
    }
    return baseLines;
  }, [checkpoint, participant.characterTimeoutFailures, isGatekeeperScolding]);

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  const currentLine = dialogueLines[dialogueIndex] || dialogueLines[0];
  const isLastLine = dialogueIndex >= dialogueLines.length - 1;
  const isProfessorBranchPrompt = checkpoint.stageNumber === 2 && dialogueIndex === 0;

  const activeText = isGatekeeperScolding
    ? "Phir se? Professor ne tumhara answer reject kar diya? Koi baat nahi, fresher. Retry karna bhi engineering ka part hai. Chalo, logic revise karo aur dobara challenge do!"
    : (currentLine?.text || '');

  // Typewriter typing effect
  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);

    if (!activeText) return;

    let charIndex = 0;
    const interval = setInterval(() => {
      charIndex++;
      if (charIndex <= activeText.length) {
        setDisplayedText(activeText.slice(0, charIndex));
        // Retro Pokémon Game Boy dialogue blip every 2 non-space characters
        if (charIndex % 2 === 0 && activeText[charIndex - 1] !== ' ') {
          sounds.playTypewriterBlip();
        }
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, 22); // 22ms per character for brisk, natural RPG typing

    return () => clearInterval(interval);
  }, [activeText, dialogueIndex, isGatekeeperScolding]);

  // Click on dialogue box fast-forwards typewriter
  const handleBoxClick = () => {
    if (isTyping) {
      setDisplayedText(activeText);
      setIsTyping(false);
      sounds.playClick();
    }
  };

  const handleNext = () => {
    sounds.playClick();
    if (isTyping) {
      // If typing, first click fast-forwards immediately
      setDisplayedText(activeText);
      setIsTyping(false);
      return;
    }

    if (isLastLine) {
      onAcceptChallenge();
    } else {
      setDialogueIndex(prev => prev + 1);
    }
  };

  // ===================== COOLDOWN PENALTY ACTIVE (10 SECONDS BREAK) =====================
  if (cooldownRemainingSecs > 0) {
    const timeoutQuote = getCharacterTimeoutFailureMessage(checkpoint);
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          <div className="relative bg-slate-900 border-2 border-amber-500 shadow-2xl rounded-xl p-5 sm:p-7">
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-r" />
            <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-l" />

            <div className="absolute -top-4 left-6 bg-slate-950 border border-amber-500 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-400 block" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                ☕ {checkpoint.characterName.toUpperCase()} • ON BREAK
              </span>
            </div>

            <div className="mt-2 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-2xl shadow-lg shrink-0">
                  {checkpoint.characterAvatar}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>{checkpoint.characterName} is on a break!</span>
                  </h3>
                  <span className="text-[11px] text-amber-400 font-mono">10-second timeout penalty active</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded-lg border border-amber-900/60 leading-relaxed">
                "{timeoutQuote}"
              </p>
            </div>

            <div className="p-3 bg-slate-950 rounded-lg border border-amber-800/60 mb-4">
              <div className="flex justify-between items-center text-xs font-bold text-amber-300 mb-1.5">
                <span>Cooldown Remaining:</span>
                <span className="font-mono text-amber-400 text-sm font-black animate-pulse">00:0{cooldownRemainingSecs}s</span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-amber-950">
                <div
                  className="bg-gradient-to-r from-amber-500 to-orange-400 h-2 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(cooldownRemainingSecs / 10) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-full py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700 transition"
            >
              Return to Campus Map
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================== SPECIAL GATEKEEPER SCOLDING SCENE =====================
  if (isGatekeeperScolding) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
        <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Top Character Badge floating above box */}
          <div className="flex items-center gap-3 mb-2 px-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border-2 border-amber-500 shadow-xl flex items-center justify-center text-3xl shrink-0">
              👮‍♂️
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-800">
                SCENE REVISION • MAIN GATE
              </span>
              <h3 className="text-white font-extrabold text-base">Ramesh Bhaiya (Gatekeeper)</h3>
            </div>
          </div>

          {/* Pokémon Style Rectangular Dialogue Frame */}
          <div 
            onClick={handleBoxClick}
            className="relative bg-slate-900 border-2 border-amber-500/80 shadow-2xl rounded-xl p-5 sm:p-7 cursor-pointer select-none"
          >
            {/* Left & Right Gold Accent Bars */}
            <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-r" />
            <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-l" />

            {/* Rectangular Nameplate Tab */}
            <div className="absolute -top-4 left-6 bg-slate-950 border border-amber-500 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-amber-400 block" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                RAMESH BHAIYA
              </span>
            </div>

            {/* Dialogue text with Typewriter animation */}
            <div className="mt-2 mb-4 text-slate-100 text-sm sm:text-base font-medium leading-relaxed min-h-[4rem]">
              <p className="italic">
                "{displayedText}"
                {isTyping && (
                  <span className="inline-block w-2 h-4 bg-amber-400 ml-1 animate-pulse align-middle" />
                )}
              </p>
              {!isTyping && (
                <div className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 animate-in fade-in">
                  💡 <em>Your Gatekeeper Fragment (1/5) is safely saved. Retrying will restore 3 fresh lives for M Block!</em>
                </div>
              )}
            </div>

            {/* Rectangular Choices Menu */}
            <div className="space-y-2.5 pt-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => {
                  sounds.playCorrect();
                  if (onRetryProfessorAgain) onRetryProfessorAgain();
                }}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-between transition border border-amber-400"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-slate-950" />
                  <span>1. Try the Professor Again (Restore 3 Lives)</span>
                </span>
                <span className="text-slate-950 font-mono font-bold text-xs">▶</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  if (onReviewProgress) onReviewProgress();
                }}
                className="w-full py-3 px-4 bg-slate-950 hover:bg-slate-800 text-slate-200 font-bold text-xs sm:text-sm border border-slate-700 transition flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                  <span>2. Review My Progress & Inventory</span>
                </span>
                <span className="text-slate-400 font-mono text-xs">▶</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== STANDARD CHECKPOINT DIALOGUE =====================
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-6 duration-300">
        
        {/* Floating Character Avatar & Location Ribbon */}
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950 border-2 border-cyan-400 shadow-xl flex items-center justify-center text-3xl shrink-0">
              {checkpoint.characterAvatar}
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                STAGE {checkpoint.stageNumber} • {checkpoint.name}
              </span>
              <h3 className="text-white font-extrabold text-sm sm:text-base">
                {checkpoint.characterName} <span className="text-slate-400 text-xs font-normal">({checkpoint.characterRole})</span>
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold transition"
            title="Close dialogue"
          >
            ✕
          </button>
        </div>

        {/* POKÉMON STYLE RECTANGULAR DIALOGUE BOX (Per Reference Images) */}
        <div 
          onClick={handleBoxClick}
          className="relative bg-slate-900 border-2 border-cyan-500/80 shadow-2xl rounded-xl p-5 sm:p-7 min-h-[175px] flex flex-col justify-between cursor-pointer select-none"
        >
          {/* Left & Right Gold/Cyan Accent Stripes */}
          <div className="absolute left-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-r" />
          <div className="absolute right-0 top-3 bottom-3 w-1.5 bg-amber-400 rounded-l" />

          {/* Rectangular Nameplate Tab overlapping top-left edge */}
          <div className="absolute -top-4 left-6 bg-slate-950 border border-cyan-500 px-4 py-1 rounded-sm shadow-md flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-amber-400 block" />
            <span className="text-xs font-black uppercase tracking-wider text-cyan-300">
              {currentLine.speaker === 'PLAYER' ? participant.displayName : checkpoint.characterName}
            </span>
          </div>

          {/* Main Dialogue Content with Typewriter Text Animation */}
          <div className="pt-2 pr-6">
            <p className="text-sm sm:text-base md:text-lg text-slate-100 font-medium leading-relaxed tracking-wide min-h-[3.5rem]">
              "{displayedText}"
              {isTyping && (
                <span className="inline-block w-2 h-4 bg-cyan-400 ml-1 animate-pulse align-middle" />
              )}
            </p>

            {/* Professor Branch Prompt */}
            {isProfessorBranchPrompt && !isTyping && (
              <div className="mt-4 pt-3 border-t border-slate-800 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Select your engineering branch:
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value as BranchOption)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm font-medium focus:outline-none focus:border-cyan-400"
                >
                  {DEFAULT_BRANCHES.map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Bottom Bar: Animated Bouncing Triangle Prompt & Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
            {/* Step Counter Dots */}
            <div className="flex items-center gap-1.5">
              {dialogueLines.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 transition-all rounded-full ${
                    i === dialogueIndex ? 'bg-cyan-400 w-5' : 'bg-slate-700 w-2'
                  }`}
                />
              ))}
              <span className="text-[10px] text-slate-500 font-mono ml-2">
                {dialogueIndex + 1}/{dialogueLines.length}
              </span>
            </div>

            {/* Action Buttons & Bouncing Pokemon Prompt Glyph */}
            <div className="flex items-center gap-2">
              {/* If currently typing, show fast forward button hint */}
              {isTyping ? (
                <button
                  onClick={handleBoxClick}
                  className="px-2.5 py-1 rounded bg-slate-950 hover:bg-slate-800 text-amber-400 text-[11px] font-bold border border-amber-500/40 transition flex items-center gap-1"
                  title="Skip typing"
                >
                  <FastForward className="w-3 h-3 text-amber-400" />
                  <span>Skip</span>
                </button>
              ) : (
                !isLastLine && (
                  <span className="text-amber-400 text-sm font-black animate-bounce mr-1" title="Press to continue">
                    ▼
                  </span>
                )
              )}

              <button
                onClick={() => {
                  sounds.playClick();
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold border border-slate-800 transition"
              >
                Leave
              </button>

              <button
                onClick={handleNext}
                className={`px-5 py-2 rounded-lg text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center gap-1.5 shadow-md ${
                  isLastLine && !isTyping
                    ? 'bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 hover:scale-102 active:scale-98'
                    : 'bg-gradient-to-r from-cyan-400 to-sky-400 hover:scale-102'
                }`}
              >
                <span>{isTyping ? 'Fast-Forward ▶' : isLastLine ? 'ACCEPT THE CHALLENGE' : 'Continue'}</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
