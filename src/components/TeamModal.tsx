import React, { useState } from 'react';
import { Participant, Team } from '../types/game';
import { sounds } from '../services/soundEffects';
import { Users, UserPlus, Shield, Copy, Check, Sparkles } from 'lucide-react';

interface TeamModalProps {
  participant: Participant;
  teams: Team[];
  onCreateTeam: (name: string) => void;
  onJoinTeam: (code: string) => boolean;
  onClose: () => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  participant,
  teams,
  onCreateTeam,
  onJoinTeam,
  onClose
}) => {
  const [teamName, setTeamName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'create' | 'join'>('status');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentTeam = teams.find(t => t.id === participant.teamId || t.memberRollNumbers.includes(participant.rollNumber));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    sounds.playCorrect();
    onCreateTeam(teamName.trim());
    setActiveTab('status');
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!joinCode.trim()) return;
    const success = onJoinTeam(joinCode.trim());
    if (success) {
      sounds.playCorrect();
      setActiveTab('status');
    } else {
      sounds.playWrong();
      setErrorMsg("Invalid team code! Please check and try again.");
    }
  };

  const handleCopyCode = (code: string) => {
    sounds.playClick();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 shadow-2xl shadow-indigo-950/70 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-xl">
              👥
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Team Collaboration</h3>
              <p className="text-xs text-slate-400">Share progress with college peers</p>
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

        {/* Current Team Status */}
        {currentTeam ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                YOUR SQUAD
              </span>
              <h4 className="text-xl font-extrabold text-white mb-2">{currentTeam.name}</h4>

              {/* Team Code Chip */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-indigo-500/40 font-mono text-sm font-bold text-indigo-300">
                <span>Code: {currentTeam.code}</span>
                <button
                  onClick={() => handleCopyCode(currentTeam.code)}
                  className="hover:text-white"
                  title="Copy team invite code"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Team Members List */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Team Roster ({currentTeam.memberRollNumbers.length})
              </span>
              <div className="space-y-1.5">
                {currentTeam.memberRollNumbers.map((roll, idx) => (
                  <div
                    key={roll}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <span className="font-mono text-cyan-300 font-bold">{roll}</span>
                    <span className="text-slate-400">
                      {roll === currentTeam.leaderRollNumber ? '👑 Squad Leader' : `Member #${idx + 1}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              💡 In team mode, checkpoint completions, fragments, and leaderboard rankings are shared collaboratively!
            </p>
          </div>
        ) : (
          <div>
            {/* Tab switch */}
            <div className="flex rounded-xl bg-slate-950 p-1 mb-4 border border-slate-800">
              <button
                onClick={() => setActiveTab('create')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'create' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Team
              </button>
              <button
                onClick={() => setActiveTab('join')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'join' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Join via Code
              </button>
            </div>

            {activeTab === 'create' ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Team / Squad Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. ByteBusters or Indore Hackers"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white font-bold text-sm shadow-md transition"
                >
                  CREATE SQUAD
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Enter Invite Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="e.g. GDG-W9A2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-indigo-400"
                  />
                  {errorMsg && (
                    <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs text-center mt-2 font-medium">
                      {errorMsg}
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-md transition"
                >
                  JOIN SQUAD
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
