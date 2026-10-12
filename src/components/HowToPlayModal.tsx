import React from 'react';
import { sounds } from '../services/soundEffects';
import { 
  HelpCircle, 
  MapPin, 
  Heart, 
  KeyRound, 
  ShieldCheck, 
  Compass, 
  AlertTriangle 
} from 'lucide-react';

interface HowToPlayModalProps {
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl shadow-cyan-950/70 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-xl">
              🗺️
            </div>
            <div>
              <h3 className="text-base font-bold text-white">How to Play Campus Quest</h3>
              <p className="text-xs text-slate-400">Rules & guidelines for freshers</p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          {/* Section 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-cyan-400 mb-1 text-xs uppercase tracking-wide">
              <Compass className="w-4 h-4" />
              <span>1. The 5 Campus Destinations</span>
            </div>
            <p className="text-slate-300 text-xs">
              Travel across the IET DAVV campus in sequence:
              <br />• <strong>Stage 1:</strong> Gatekeeper (Main College Gate)
              <br />• <strong>Stage 2:</strong> The Professor (M Block)
              <br />• <strong>Stage 3:</strong> Senior Student (Library Entrance)
              <br />• <strong>Stage 4:</strong> GDG Member (M Block 3rd Floor Lab)
              <br />• <strong>Stage 5:</strong> GDG Head (CSE Block)
            </p>
          </div>

          {/* Section 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-rose-400 mb-1 text-xs uppercase tracking-wide">
              <Heart className="w-4 h-4" />
              <span>2. Three Lives & Retry Discipline</span>
            </div>
            <p className="text-slate-300 text-xs">
              Every stage grants <strong>3 lives</strong>. Incorrect answers consume 1 life and trigger hilarious compiler jokes. If you run out of lives:
              <br />• You can <strong>retry the stage</strong> with 3 fresh lives.
              <br />• All previously earned code fragments remain completely safe!
              <br />• Failing the Professor stage returns you to the Gatekeeper for a humorous scolding scene before retrying.
            </p>
          </div>

          {/* Section 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-1 text-xs uppercase tracking-wide">
              <KeyRound className="w-4 h-4" />
              <span>3. Forge the GDG Application Key</span>
            </div>
            <p className="text-slate-300 text-xs">
              Each completed stage awards 1 secret code fragment. Once all 5 fragments are obtained, assemble and validate the virtual key to unlock the official GDG application form!
            </p>
          </div>

          {/* Section 4: Safety & Privacy */}
          <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-800/60">
            <div className="flex items-center gap-2 font-bold text-amber-400 mb-1 text-xs uppercase tracking-wide">
              <AlertTriangle className="w-4 h-4" />
              <span>Campus Safety & Fair Play</span>
            </div>
            <p className="text-amber-200/90 text-xs">
              Always watch your surroundings while walking with your phone. Never enter restricted or locked campus areas. Your GPS is checked only to confirm checkpoint proximity and is never stored continuously.
            </p>
          </div>
        </div>

        {/* Close CTA */}
        <div className="mt-5 pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-md transition"
          >
            I'M READY FOR THE QUEST
          </button>
        </div>
      </div>
    </div>
  );
};
