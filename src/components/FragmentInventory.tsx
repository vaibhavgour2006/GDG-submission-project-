import React from 'react';
import { Participant, EventConfig, Checkpoint } from '../types/game';
import { sounds } from '../services/soundEffects';
import { KeyRound, Sparkles, CheckCircle2, Lock } from 'lucide-react';

interface FragmentInventoryProps {
  participant: Participant;
  checkpoints: Checkpoint[];
  eventConfig: EventConfig;
  onOpenKeyAssembler: () => void;
}

export const FragmentInventory: React.FC<FragmentInventoryProps> = ({
  participant,
  checkpoints,
  eventConfig,
  onOpenKeyAssembler
}) => {
  const collected = participant.collectedFragments || [];
  const allCollected = collected.length >= 5;

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-900/40 rounded-3xl p-4 sm:p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
            CODE FRAGMENT INVENTORY
          </h4>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-950 text-cyan-400 border border-cyan-900">
            {collected.length} / 5 Collected
          </span>
        </div>

        <button
          onClick={() => {
            sounds.playClick();
            onOpenKeyAssembler();
          }}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
            allCollected
              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{allCollected ? 'Assemble Key!' : 'Inspect Key'}</span>
        </button>
      </div>

      {/* 5 Slots */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {checkpoints.map((cp) => {
          const isCollected = collected.includes(cp.fragmentCode);
          return (
            <div
              key={cp.id}
              onClick={() => {
                sounds.playClick();
                onOpenKeyAssembler();
              }}
              className={`p-2 sm:p-3 rounded-2xl text-center border cursor-pointer transition-all duration-300 ${
                isCollected
                  ? 'bg-gradient-to-b from-amber-950/80 to-slate-950 border-amber-400/80 shadow-md shadow-amber-500/20 scale-102 ring-1 ring-amber-400/30'
                  : 'bg-slate-950/50 border-slate-800/80 opacity-50 hover:opacity-80'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 uppercase font-mono">
                SLOT {cp.stageNumber}
              </div>
              <div className="text-xl sm:text-2xl my-1">
                {isCollected ? '🔑' : '🔒'}
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-amber-300 truncate">
                {isCollected ? cp.fragmentText : '???'}
              </div>
              <div className="text-[9px] text-slate-400 truncate mt-0.5 hidden xs:block">
                {cp.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
