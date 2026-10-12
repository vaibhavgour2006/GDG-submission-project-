import React, { useState, useEffect } from 'react';
import { Checkpoint, Participant, GPSPosition } from '../types/game';
import { isInsideGeofence } from '../services/geofenceService';
import { sounds } from '../services/soundEffects';
import { CheckCircle2, Lock, MapPin, Play, ShieldAlert, Zap, Coffee } from 'lucide-react';

interface CheckpointCardProps {
  checkpoint: Checkpoint;
  participant: Participant;
  currentPosition: GPSPosition | null;
  onEnter: (checkpoint: Checkpoint) => void;
  onTeleportTo: (checkpoint: Checkpoint) => void;
}

export const CheckpointCard: React.FC<CheckpointCardProps> = ({
  checkpoint,
  participant,
  currentPosition,
  onEnter,
  onTeleportTo
}) => {
  const isCompleted = participant.completedStages.includes(checkpoint.stageNumber);
  const isActive = checkpoint.stageNumber === participant.currentStage;
  const isLocked = checkpoint.stageNumber > participant.currentStage;

  // Character 10-second timeout cooldown
  const cooldownUntil = participant.characterCooldowns?.[checkpoint.id] || 0;
  const [cooldownSecs, setCooldownSecs] = useState<number>(() =>
    Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
  );

  useEffect(() => {
    if (cooldownUntil <= Date.now()) {
      setCooldownSecs(0);
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownSecs(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownUntil]);

  const boostMeters = participant.activeBoost && participant.activeBoost.expiresAt > Date.now()
    ? participant.activeBoost.boostMeters
    : 0;

  const geofenceStatus = currentPosition
    ? isInsideGeofence(
        currentPosition.latitude,
        currentPosition.longitude,
        checkpoint.latitude,
        checkpoint.longitude,
        checkpoint.radiusMeters,
        isActive ? boostMeters : 0
      )
    : null;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden ${
        isActive
          ? 'bg-gradient-to-br from-slate-900 to-cyan-950/60 border-cyan-500/50 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/30'
          : isCompleted
          ? 'bg-slate-900/50 border-emerald-900/40 opacity-90'
          : 'bg-slate-950/40 border-slate-800/60 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Avatar & Info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${
              isActive
                ? 'bg-cyan-950 border-cyan-400 shadow-md shadow-cyan-500/30'
                : isCompleted
                ? 'bg-emerald-950 border-emerald-400'
                : 'bg-slate-900 border-slate-700'
            }`}
          >
            {checkpoint.characterAvatar}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                STAGE {checkpoint.stageNumber}
              </span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                  <CheckCircle2 className="w-3 h-3" /> Completed
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-white mt-0.5">
              {checkpoint.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>{checkpoint.shortLocation}</span>
            </p>
          </div>
        </div>

        {/* Right: Distance / Status Indicator */}
        <div className="text-right shrink-0">
          {geofenceStatus && isActive ? (
            <div>
              <div
                className={`text-xs font-bold font-mono ${
                  geofenceStatus.inside ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {geofenceStatus.inside ? 'IN GEOFENCE' : `${geofenceStatus.distance}m away`}
              </div>
              <div className="text-[10px] text-slate-400">
                Radius: {geofenceStatus.effectiveRadius}m
              </div>
            </div>
          ) : (
            <span className="text-xs font-mono text-slate-400">
              {isCompleted ? 'Fragment Claimed' : isLocked ? 'Locked' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Character Role & Clue description */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 truncate">
          <strong className="text-slate-200">{checkpoint.characterName}</strong> • {checkpoint.characterRole}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isActive && (
            <button
              onClick={() => {
                sounds.playClick();
                onTeleportTo(checkpoint);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center gap-1 transition"
              title="Teleport to this location for demo testing"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Teleport</span>
            </button>
          )}

          {isActive && geofenceStatus?.inside && (
            cooldownSecs > 0 ? (
              <div
                className="px-3 py-1.5 rounded-xl bg-amber-950/90 border border-amber-500/70 text-amber-300 font-bold text-xs shadow-md flex items-center gap-1.5 select-none cursor-not-allowed animate-pulse"
                title={`${checkpoint.characterName} is taking a break! Wait ${cooldownSecs}s to re-challenge`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                <span>ON BREAK (00:0{cooldownSecs}s)</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  sounds.playCorrect();
                  onEnter(checkpoint);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
              >
                <Play className="w-3.5 h-3.5 fill-slate-950" />
                <span>TALK & QUIZ</span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
