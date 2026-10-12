import React, { useState, useEffect } from 'react';
import { Participant, EventConfig } from '../types/game';
import { sounds } from '../services/soundEffects';
import { 
  Trophy, 
  Volume1,
  Volume2, 
  VolumeX, 
  Music,
  ShieldCheck, 
  HelpCircle, 
  Users, 
  MapPin, 
  KeyRound,
  RotateCcw,
  FileText
} from 'lucide-react';

interface NavbarProps {
  participant: Participant | null;
  eventConfig: EventConfig;
  onOpenLeaderboard: () => void;
  onOpenHowToPlay: () => void;
  onOpenAdmin: () => void;
  onOpenTeam: () => void;
  onOpenKeyAssembler: () => void;
  onOpenDoc: () => void;
  onResetQuest?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  participant,
  eventConfig,
  onOpenLeaderboard,
  onOpenHowToPlay,
  onOpenAdmin,
  onOpenTeam,
  onOpenKeyAssembler,
  onOpenDoc,
  onResetQuest
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());
  const [volume, setVolume] = useState(sounds.getVolume());
  const [isPlaying, setIsPlaying] = useState(sounds.getIsPlaying());

  useEffect(() => {
    return sounds.subscribe((muted, vol, playing) => {
      setIsMuted(muted);
      setVolume(vol);
      setIsPlaying(playing);
    });
  }, []);

  const handleSoundToggle = () => {
    sounds.playClick();
    sounds.toggleMute();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) / 100.0;
    sounds.setVolume(val);
  };

  const allFragmentsCollected = participant && participant.collectedFragments.length >= 5;

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-cyan-900/40 px-3 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Logo / Branding */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-bold text-lg ring-1 ring-cyan-400/30">
            Q
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                CAMPUS QUEST
              </span>
              <span className="hidden xs:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                GDG IET DAVV
              </span>
            </div>
            {participant && (
              <p className="text-[11px] text-slate-400 truncate max-w-[130px] sm:max-w-[200px]">
                {participant.displayName} <span className="text-cyan-400 font-mono">({participant.rollNumber})</span>
              </p>
            )}
          </div>
        </div>

        {/* Live Status Indicators (Lives, Score, Fragments) */}
        {participant && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Lives counter */}
            <div 
              className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-red-950/60 shadow-inner"
              title={`${participant.lives} lives remaining in current stage`}
            >
              <span className="text-xs font-semibold text-slate-400 hidden sm:inline">LIVES</span>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3].map((heart) => (
                  <span
                    key={heart}
                    className={`text-sm transition-all duration-300 ${
                      heart <= participant.lives 
                        ? 'opacity-100 scale-100 drop-shadow-[0_0_6px_rgba(239,68,68,0.7)]' 
                        : 'opacity-20 grayscale scale-75'
                    }`}
                  >
                    ❤️
                  </span>
                ))}
              </div>
            </div>

            {/* Score */}
            <div 
              className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-cyan-900/50 shadow-inner"
              title="Current score"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-mono font-bold text-xs sm:text-sm text-amber-300">
                {participant.score}
              </span>
            </div>

            {/* Key / Fragment status button */}
            <button
              onClick={() => {
                sounds.playClick();
                onOpenKeyAssembler();
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
                allFragmentsCollected
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 border-amber-300 font-bold animate-pulse shadow-lg shadow-amber-500/30'
                  : 'bg-slate-950/80 text-cyan-300 border-cyan-900/60 hover:border-cyan-500'
              }`}
              title="Collected Fragments & Final Key"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>{participant.collectedFragments.length}/5</span>
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Integrated Sound Turn On/Off & Volume Slider Bar */}
          <div className="flex items-center bg-slate-950/80 rounded-xl border border-cyan-900/50 p-1 sm:px-2 shadow-inner">
            <button
              onClick={handleSoundToggle}
              className={`p-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isMuted
                  ? 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                  : 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60'
              }`}
              title={isMuted ? "Turn Sound ON (Pokémon Theme BGM)" : "Turn Sound OFF (Mute)"}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : volume < 0.4 ? (
                <Volume1 className="w-4 h-4 text-cyan-400 animate-pulse" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400 animate-pulse" />
              )}
              <span className="text-[10px] font-bold font-mono hidden md:inline text-slate-300">
                {isMuted ? 'MUTE' : `${Math.round(volume * 100)}%`}
              </span>
            </button>

            {/* Volume Slide Bar */}
            <div className="flex items-center gap-1 pl-1 sm:pl-1.5 border-l border-slate-800" title={`Theme BGM Volume: ${Math.round(volume * 100)}%`}>
              <Music className={`w-3 h-3 hidden sm:inline ${!isMuted && isPlaying ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : Math.round(volume * 100)}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 md:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Leaderboard button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenLeaderboard();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            title="Leaderboard"
          >
            <Trophy className="w-4 h-4" />
          </button>

          {/* Team button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenTeam();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            title="Team Mode"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* How to play */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenHowToPlay();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
            title="How to Play & Rules"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Docs & Repo Download */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenDoc();
            }}
            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 transition border border-emerald-900/50 text-xs font-semibold flex items-center gap-1"
            title="Task 3 Documentation & Repository Download"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">Doc & ZIP</span>
          </button>

          {/* Reset button (demo test helper) */}
          {participant && onResetQuest && (
            <button
              onClick={() => {
                if (window.confirm("Restart quest from stage 1? Your fragments and score will be reset.")) {
                  sounds.playClick();
                  onResetQuest();
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700"
              title="Reset Quest for Demo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Admin Dashboard */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenAdmin();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-400 hover:bg-slate-800 transition border border-transparent hover:border-slate-700 text-xs font-semibold flex items-center gap-1"
            title="Organizer / Admin Dashboard"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden md:inline text-xs">Organizer</span>
          </button>
        </div>
      </div>
    </header>
  );
};
