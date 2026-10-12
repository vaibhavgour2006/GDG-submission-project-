import React, { useState, useEffect } from 'react';
import { Participant, EventConfig } from '../types/game';
import { sounds } from '../services/soundEffects';
import { Lightbulb, Radio, Clock, Sparkles } from 'lucide-react';

interface PowerUpBarProps {
  participant: Participant;
  eventConfig: EventConfig;
  onActivateRadiusBoost: () => void;
  onActivateTimeBonus: () => void;
}

export const PowerUpBar: React.FC<PowerUpBarProps> = ({
  participant,
  eventConfig,
  onActivateRadiusBoost,
  onActivateTimeBonus
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Monitor active radius boost countdown
  useEffect(() => {
    const boost = participant.activeBoost;
    if (!boost || boost.expiresAt <= Date.now()) {
      setSecondsRemaining(0);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((boost.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);
      if (diff <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [participant.activeBoost]);

  const powerUps = participant.powerUps || {};
  const hintCount = powerUps.hint_reveal || 0;
  const radiusCount = powerUps.radius_boost || 0;
  const timeBonusCount = powerUps.time_bonus || 0;

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Campus Power-Ups</span>
        </span>
        <span className="text-[10px] text-slate-400">
          Earn charges via stage completions
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* 1. Hint Reveal (Passive count indicator during quiz) */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-mono font-bold text-amber-300">
              x{hintCount}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-[11px] font-bold text-slate-200 truncate">Hint Reveal</div>
            <div className="text-[9px] text-slate-400">In question quiz</div>
          </div>
        </div>

        {/* 2. Radius Boost */}
        <button
          onClick={() => {
            if (secondsRemaining > 0) return;
            if (radiusCount <= 0) {
              sounds.playWrong();
              return;
            }
            sounds.playCorrect();
            onActivateRadiusBoost();
          }}
          disabled={secondsRemaining > 0 || radiusCount <= 0}
          className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
            secondsRemaining > 0
              ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
              : radiusCount > 0
              ? 'bg-slate-950/80 border-slate-800 hover:border-cyan-500 hover:bg-slate-900'
              : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between">
            <Radio className={`w-4 h-4 ${secondsRemaining > 0 ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'}`} />
            <span className="text-xs font-mono font-bold text-cyan-300">
              {secondsRemaining > 0 ? `${secondsRemaining}s` : `x${radiusCount}`}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-[11px] font-bold text-slate-200 truncate">
              {secondsRemaining > 0 ? '+25m Active!' : 'Radius Boost'}
            </div>
            <div className="text-[9px] text-slate-400">
              {secondsRemaining > 0 ? 'Expanded Geofence' : '+25m for 60s'}
            </div>
          </div>
        </button>

        {/* 3. Time Bonus */}
        <button
          onClick={() => {
            if (timeBonusCount <= 0) {
              sounds.playWrong();
              return;
            }
            sounds.playCorrect();
            onActivateTimeBonus();
          }}
          disabled={timeBonusCount <= 0}
          className={`p-2 sm:p-2.5 rounded-xl text-left border transition-all flex flex-col justify-between ${
            timeBonusCount > 0
              ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500 hover:bg-slate-900'
              : 'bg-slate-950/40 border-slate-900 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center justify-between">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-emerald-300">
              x{timeBonusCount}
            </span>
          </div>
          <div className="mt-1">
            <div className="text-[11px] font-bold text-slate-200 truncate">Time Bonus</div>
            <div className="text-[9px] text-slate-400">+30 Score Pts</div>
          </div>
        </button>
      </div>
    </div>
  );
};
