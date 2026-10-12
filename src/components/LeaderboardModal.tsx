import React from 'react';
import { LeaderboardEntry, Participant } from '../types/game';
import { sounds } from '../services/soundEffects';
import { Trophy, Medal, Users, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';

interface LeaderboardModalProps {
  entries: LeaderboardEntry[];
  currentParticipant: Participant;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  entries,
  currentParticipant,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl shadow-amber-950/60 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-xl shadow-md">
              🏆
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>CAMPUS QUEST LEADERBOARD</span>
              </h3>
              <p className="text-xs text-slate-400">Live rankings across IET DAVV</p>
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

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {entries.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No participants recorded yet. Start exploring campus checkpoints to score!
            </div>
          ) : (
            entries.map((entry, index) => {
              const rank = index + 1;
              const isCurrentUser =
                entry.id === currentParticipant.id ||
                entry.name.includes(currentParticipant.rollNumber);

              let rankBadge = (
                <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-mono text-xs font-bold">
                  {rank}
                </span>
              );

              if (rank === 1) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-black shadow-md shadow-amber-500/50">
                    🥇
                  </span>
                );
              } else if (rank === 2) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center text-xs font-black">
                    🥈
                  </span>
                );
              } else if (rank === 3) {
                rankBadge = (
                  <span className="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-xs font-black">
                    🥉
                  </span>
                );
              }

              return (
                <div
                  key={entry.id || index}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isCurrentUser
                      ? 'bg-cyan-950/70 border-cyan-400 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-400'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  {/* Left: Rank & Name */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {rankBadge}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{entry.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.2 rounded font-semibold">
                            YOU
                          </span>
                        )}
                        {entry.isTeam && (
                          <span className="text-[10px] bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded border border-indigo-800">
                            Team
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{entry.completedStagesCount}/5 Checkpoints</span>
                        {entry.completedStagesCount >= 5 && (
                          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                            <KeyRound className="w-2.5 h-2.5" /> Key Forged
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score */}
                  <div className="text-right shrink-0">
                    <div className="text-sm sm:text-base font-extrabold font-mono text-amber-300">
                      {entry.score}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">PTS</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-xs text-slate-400">
          Rankings update in real-time with verified stage completions.
        </div>
      </div>
    </div>
  );
};
