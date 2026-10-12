import React, { useState } from 'react';
import { BranchOption } from '../types/game';
import { DEFAULT_BRANCHES } from '../config/defaultData';
import { sounds } from '../services/soundEffects';
import { 
  Sparkles, 
  MapPin, 
  ShieldAlert, 
  Play, 
  HelpCircle, 
  Compass, 
  KeyRound,
  GraduationCap
} from 'lucide-react';

interface RollNumberScreenProps {
  onStartQuest: (rollNumber: string, displayName: string, branch: BranchOption) => void;
  onOpenHowToPlay: () => void;
  onOpenDoc: () => void;
}

export const RollNumberScreen: React.FC<RollNumberScreenProps> = ({
  onStartQuest,
  onOpenHowToPlay,
  onOpenDoc
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [branch, setBranch] = useState<BranchOption>('Computer Science and Engineering');
  const [error, setError] = useState('');

  const quickDemoProfiles = [
    { roll: '24CS101', name: 'Aarav Sharma', branch: 'Computer Science and Engineering' as BranchOption },
    { roll: '24IT042', name: 'Riya Verma', branch: 'Information Technology' as BranchOption },
    { roll: '24EC019', name: 'Kabir Patel', branch: 'Electronics and Communication Engineering' as BranchOption },
    { roll: '24CB007', name: 'Isha Gupta', branch: 'Computer Science and Business Systems' as BranchOption }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      setError('Please enter your IET DAVV college roll number');
      sounds.playWrong();
      return;
    }
    if (cleanRoll.length < 4) {
      setError('Please enter a valid college roll number (e.g. 24CS101)');
      sounds.playWrong();
      return;
    }

    setError('');
    sounds.playCorrect();
    onStartQuest(cleanRoll, displayName.trim() || `Fresher ${cleanRoll}`, branch);
  };

  const handleSelectDemo = (demo: typeof quickDemoProfiles[0]) => {
    setRollNumber(demo.roll);
    setDisplayName(demo.name);
    setBranch(demo.branch);
    setError('');
    sounds.playClick();
  };

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-xl mx-auto z-10">
        {/* Hero Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-cyan-950/50">
          
          {/* Badge & GDG Header */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>IET DAVV INDORE • ORIENTATION 2026</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs">
              <KeyRound className="w-3 h-3 text-amber-400" />
              <span>GDG On Campus</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">
              Welcome, Fresher. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                Your GDG Quest Begins Here.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed">
              Five locations. Five characters. Twenty-five challenges. Three lives per stage. One secret application key.
            </p>
          </div>

          {/* Quick Demo Identities for seamless testing */}
          <div className="mb-6 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ⚡ Quick Demo Identities (1-Click Fill)
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">Test Mode Ready</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickDemoProfiles.map((p) => (
                <button
                  key={p.roll}
                  type="button"
                  onClick={() => handleSelectDemo(p)}
                  className={`px-2.5 py-1.5 rounded-xl text-left border text-xs font-medium transition-all ${
                    rollNumber === p.roll
                      ? 'bg-cyan-950 text-cyan-200 border-cyan-500 shadow-sm'
                      : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-bold font-mono text-cyan-400">{p.roll}</div>
                  <div className="text-[10px] text-slate-400 truncate">{p.name}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                College Roll Number <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="e.g. 24CS101 or 24IT042"
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono tracking-wide text-base uppercase"
                />
                <GraduationCap className="absolute right-3.5 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Display Name / Nickname
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Aarav (Fresher)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Engineering Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value as BranchOption)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm"
                >
                  {DEFAULT_BRANCHES.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Start Button */}
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-slate-950 font-bold text-base shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>START MY QUEST</span>
            </button>
          </form>

          {/* Secondary Action & Rules briefing */}
          <div className="mt-5 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <button
              type="button"
              onClick={onOpenHowToPlay}
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition font-semibold"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How to Play & Game Rules</span>
            </button>

            <button
              type="button"
              onClick={onOpenDoc}
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition font-semibold"
            >
              <span>📄 Task 3 Solution Doc & Repo ZIP</span>
            </button>
          </div>
        </div>

        {/* Location & Fair Play Notice */}
        <div className="mt-4 text-center text-xs text-slate-400 max-w-md mx-auto">
          <p>
            🔒 Privacy First: Your roll number is used only for game ranking. Continuous GPS is never stored or tracked.
          </p>
        </div>
      </div>
    </div>
  );
};
