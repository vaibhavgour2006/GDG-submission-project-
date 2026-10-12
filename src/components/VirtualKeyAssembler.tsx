import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Participant, EventConfig } from '../types/game';
import { sounds } from '../services/soundEffects';
import { 
  KeyRound, 
  Sparkles, 
  ExternalLink, 
  Trophy, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  ArrowRight,
  Compass,
  MapPin
} from 'lucide-react';

interface VirtualKeyAssemblerProps {
  participant: Participant;
  eventConfig: EventConfig;
  onValidateKeySuccess: () => void;
  onOpenLeaderboard: () => void;
  onClose: () => void;
}

export const VirtualKeyAssembler: React.FC<VirtualKeyAssemblerProps> = ({
  participant,
  eventConfig,
  onValidateKeySuccess,
  onOpenLeaderboard,
  onClose
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [showJourney, setShowJourney] = useState(false);

  const expectedFragments = eventConfig.keyAssemblyOrder || ["GDG-", "IET-", "DAVV-", "QUEST-", "2026-KEY"];
  const collected = participant.collectedFragments || [];
  const hasAllFive = expectedFragments.every(f => collected.includes(f));
  const assembledKeyString = expectedFragments.join('');

  const handleValidate = () => {
    if (!hasAllFive) return;
    setIsValidating(true);
    sounds.playClick();

    setTimeout(() => {
      setIsValidating(false);
      sounds.playKeyUnlocked();
      onValidateKeySuccess();

      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch {
        // ignore
      }
    }, 1000);
  };

  const [appFormNotice, setAppFormNotice] = useState<string | null>(null);

  const handleOpenApplicationForm = () => {
    sounds.playClick();
    if (eventConfig.applicationUrl) {
      window.open(eventConfig.applicationUrl, '_blank', 'noopener,noreferrer');
    } else {
      setAppFormNotice("Official GDG On-Campus application form link is being announced by organizers. Check the leaderboard for live updates!");
    }
  };

  const isAccessGranted = participant.hasValidatedFinalKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-cyan-400/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/80 animate-in fade-in zoom-in-95 my-auto relative">
        
        {/* Close button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
        >
          ✕
        </button>

        {/* Top Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-600 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>THE MASTER GDG APPLICATION KEY</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isAccessGranted ? "ACCESS GRANTED!" : "Assemble Your GDG Key"}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-md mx-auto">
            {isAccessGranted
              ? "Congratulations, fresher! You explored the campus, survived compiler jokes, and unlocked the GDG application."
              : "Collect all 5 fragments from the campus characters to assemble the legendary key."}
          </p>
        </div>

        {/* THE VIRTUAL KEY GRAPHIC */}
        <div className="relative bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 mb-6 shadow-2xl overflow-hidden">
          {/* Subtle Cyber Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#33415510_1px,transparent_1px),linear-gradient(to_bottom,#33415510_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Virtual Key Vector/Graphic Illustration */}
          <div className="flex flex-col items-center justify-center relative z-10">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl mb-3 border-2 transition-all duration-500 ${
              isAccessGranted
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-200 border-white text-slate-950 ring-8 ring-amber-500/20 scale-105'
                : hasAllFive
                ? 'bg-amber-950/90 border-amber-400 text-amber-300 animate-pulse'
                : 'bg-slate-900 border-slate-700 text-slate-600'
            }`}>
              🔑
            </div>

            {/* Assembled Key Banner */}
            <div className="w-full bg-slate-950/90 rounded-2xl p-3 border border-amber-500/40 text-center shadow-inner">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-1">
                {isAccessGranted ? "AUTHENTICATED CODE SEQUENCE" : "CURRENT KEY STATUS"}
              </span>
              <div className="font-mono font-extrabold text-sm sm:text-lg text-amber-200 tracking-wider truncate">
                {hasAllFive ? assembledKeyString : `${collected.length} of 5 Fragments Collected`}
              </div>
            </div>
          </div>

          {/* Five Fragment Slot Indicators */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mt-5">
            {expectedFragments.map((frag, idx) => {
              const isSlotCollected = collected.includes(frag);
              return (
                <div
                  key={frag}
                  className={`p-2 rounded-xl text-center border transition-all ${
                    isSlotCollected
                      ? 'bg-amber-950/60 border-amber-400/80 shadow-md shadow-amber-500/10'
                      : 'bg-slate-950/60 border-slate-800 opacity-40'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-slate-400">
                    FRAG {idx + 1}
                  </div>
                  <div className="font-mono font-extrabold text-xs text-amber-300 truncate mt-0.5">
                    {isSlotCollected ? frag : '---'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Journey Views */}
        {!isAccessGranted ? (
          <div>
            {hasAllFive ? (
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5 fill-slate-950" />
                <span>{isValidating ? "VALIDATING KEY HASH..." : "VALIDATE SECRET KEY"}</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-xs text-slate-400 mb-3">
                  You need all 5 fragments to forge the key. Continue visiting campus checkpoints!
                </p>
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-bold transition inline-flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Resume Campus Adventure</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* CELEBRATION / UNLOCKED SCREEN */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">FINAL SCORE</span>
                <div className="font-mono font-black text-xl text-amber-300 mt-0.5">
                  {participant.score} PTS
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase">CHECKPOINTS</span>
                <div className="font-mono font-black text-xl text-emerald-400 mt-0.5">
                  5 / 5 CLEARED
                </div>
              </div>
            </div>

            {/* OPEN GDG APPLICATION BUTTON */}
            <button
              onClick={handleOpenApplicationForm}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-5 h-5 stroke-[2.5]" />
              <span>OPEN GDG APPLICATION FORM</span>
            </button>

            {appFormNotice && (
              <div className="p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-cyan-200 text-xs text-center animate-in fade-in">
                {appFormNotice}
              </div>
            )}

            {/* View Leaderboard & Journey */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  sounds.playClick();
                  onOpenLeaderboard();
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Leaderboard</span>
              </button>

              <button
                onClick={() => setShowJourney(!showJourney)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showJourney ? 'Hide Journey' : 'View Journey'}</span>
              </button>
            </div>

            {/* Journey Summary */}
            {showJourney && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-900/50 text-xs space-y-2 mt-3 animate-in fade-in">
                <strong className="text-cyan-300 block font-mono text-[11px] uppercase">
                  QUEST EXPEDITION LOG:
                </strong>
                <div className="text-slate-300 space-y-1">
                  <div>1. 👮‍♂️ Gatekeeper (Main Gate) — Solved IET DAVV history & debugging.</div>
                  <div>2. 👨‍🏫 The Professor (M Block) — Passed programming core principles.</div>
                  <div>3. 👩‍💻 The Senior (Library) — Mastered canteen economics & campus culture.</div>
                  <div>4. 🧑‍💻 GDG Member (3rd Fl Lab) — Proved Git & community mindset.</div>
                  <div>5. 🚀 GDG Head (CSE Block) — Mastered coding logic & joined mission.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
