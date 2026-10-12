import React, { useState } from 'react';
import { Checkpoint, Question, EventConfig, Participant } from '../types/game';
import { sounds } from '../services/soundEffects';
import { MapPlacementPickerModal } from './MapPlacementPickerModal';
import { 
  ShieldCheck, 
  Settings, 
  MapPin, 
  HelpCircle, 
  MessageSquare, 
  KeyRound, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Save, 
  Lock, 
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Move
} from 'lucide-react';

interface AdminDashboardProps {
  eventConfig: EventConfig;
  checkpoints: Checkpoint[];
  questions: Question[];
  onSaveConfig: (config: EventConfig) => Promise<void>;
  onSaveCheckpoints: (checkpoints: Checkpoint[]) => Promise<void>;
  onSaveQuestions: (questions: Question[]) => Promise<void>;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  eventConfig,
  checkpoints,
  questions,
  onSaveConfig,
  onSaveCheckpoints,
  onSaveQuestions,
  onClose
}) => {
  // Passcode gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active admin tab
  const [activeTab, setActiveTab] = useState<'settings' | 'checkpoints' | 'questions' | 'fragments' | 'checklist'>('settings');

  // Local draft states
  const [configDraft, setConfigDraft] = useState<EventConfig>({ ...eventConfig });
  const [checkpointsDraft, setCheckpointsDraft] = useState<Checkpoint[]>([...checkpoints]);
  const [questionsDraft, setQuestionsDraft] = useState<Question[]>([...questions]);
  const [selectedStage, setSelectedStage] = useState<number>(1);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Map Placement Modal state
  const [showMapPlacement, setShowMapPlacement] = useState(false);
  const [placementTargetId, setPlacementTargetId] = useState<string | undefined>(undefined);

  const handleOpenMapPlacement = (checkpointId?: string) => {
    sounds.playClick();
    setPlacementTargetId(checkpointId);
    setShowMapPlacement(true);
  };

  const handleSavePlacedCheckpoints = (updatedList: Checkpoint[]) => {
    setCheckpointsDraft(updatedList);
    setSaveSuccessMsg('Coordinates updated from Interactive Satellite Map! Remember to click "Save Changes".');
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Add a new character / checkpoint
  const handleAddNewCharacter = () => {
    sounds.playCorrect();
    const nextStageNum = checkpointsDraft.length + 1;
    const baseLat = checkpointsDraft[checkpointsDraft.length - 1]?.latitude || 22.6808;
    const baseLng = checkpointsDraft[checkpointsDraft.length - 1]?.longitude || 75.8790;
    
    const newCp: Checkpoint = {
      id: `checkpoint_${Date.now()}`,
      stageNumber: nextStageNum,
      name: `Special Mentor Stage ${nextStageNum}`,
      shortLocation: "Campus Hub, IET DAVV",
      characterName: "GDG Lead / AI Mentor",
      characterRole: "Lead Community Architect & Innovation Guide",
      characterAvatar: "🤖",
      latitude: parseFloat((baseLat + 0.00015).toFixed(6)),
      longitude: parseFloat((baseLng + 0.00015).toFixed(6)),
      radiusMeters: 30,
      active: true,
      introDialogue: [
        { speaker: "MENTOR", text: "Welcome developer! You have unlocked a special mentor challenge." },
        { speaker: "PLAYER", text: "Ready to test my skills and claim the next clue!" }
      ],
      successDialogue: {
        speaker: "MENTOR",
        text: "Outstanding execution! You understand Google developer ecosystems well."
      },
      failureDialogue: {
        speaker: "MENTOR",
        text: "Keep experimenting! Every failed attempt is valuable data."
      },
      fragmentText: `Code Fragment #${nextStageNum}: INNOVATE`,
      fragmentName: `Fragment #${nextStageNum}`,
      fragmentCode: `INNOVATE-${nextStageNum}`
    };

    setCheckpointsDraft(prev => [...prev, newCp]);
    setSaveSuccessMsg(`Added new character (${newCp.characterName})! Tap "Place on Map" to position.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  // Delete an added character (allow deleting if more than 1)
  const handleDeleteCharacter = (id: string) => {
    sounds.playClick();
    if (checkpointsDraft.length <= 1) {
      setSaveSuccessMsg("At least 1 character is required for the quest!");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      return;
    }
    const filtered = checkpointsDraft.filter(c => c.id !== id).map((c, i) => ({
      ...c,
      stageNumber: i + 1
    }));
    setCheckpointsDraft(filtered);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toUpperCase() === eventConfig.adminPasscode.toUpperCase()) {
      setIsAuthenticated(true);
      setAuthError('');
      sounds.playCorrect();
    } else {
      setAuthError('Invalid passcode! Hint: default is GDG2026ADMIN');
      sounds.playWrong();
    }
  };

  const handleSaveAll = async () => {
    sounds.playCorrect();
    await onSaveConfig(configDraft);
    await onSaveCheckpoints(checkpointsDraft);
    await onSaveQuestions(questionsDraft);
    setSaveSuccessMsg('All configurations, checkpoints, and questions saved successfully!');
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Validation Checklist computation
  const checklistItems = [
    {
      title: "All 5 Story Checkpoints Configured",
      passed: checkpointsDraft.length === 5,
      detail: `${checkpointsDraft.length}/5 checkpoints present`
    },
    {
      title: "Campus GPS Coordinates Validated",
      passed: checkpointsDraft.every(c => c.latitude > 20 && c.longitude > 70 && c.radiusMeters >= 10),
      detail: "All checkpoints have positive coordinates & radius >= 10m"
    },
    {
      title: "Exact 25 Questions Configured (5 per stage)",
      passed: [1, 2, 3, 4, 5].every(s => questionsDraft.filter(q => q.stageNumber === s).length === 5),
      detail: "Exactly 5 questions per stage"
    },
    {
      title: "Exact 5 Answer Choices per MCQ with 1 Correct",
      passed: questionsDraft.every(q => q.options.length === 5 && q.options.some(o => o.id === q.correctAnswerId)),
      detail: "Every question contains exactly 5 options with valid answer ID"
    },
    {
      title: "All 5 Secret Code Fragments & Master Key Set",
      passed: checkpointsDraft.every(c => c.fragmentCode && c.fragmentCode.length > 0) && !!configDraft.secretFinalKey,
      detail: `Master key: ${configDraft.secretFinalKey}`
    },
    {
      title: "Official GDG Application URL Configured",
      passed: configDraft.applicationUrl.startsWith("http"),
      detail: configDraft.applicationUrl ? configDraft.applicationUrl : "URL not specified"
    }
  ];

  const allPassed = checklistItems.every(i => i.passed);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="w-full max-w-md bg-slate-900 border-2 border-purple-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-purple-950/70 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-950 border border-purple-500/60 flex items-center justify-center text-3xl mx-auto mb-4">
            🔐
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Organizer Dashboard</h2>
          <p className="text-xs text-slate-400 mb-6">
            Enter administrative passcode to configure IET DAVV checkpoints, questions, and event rules.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-white text-center font-mono text-sm tracking-widest focus:outline-none focus:border-purple-400"
              />
              <span className="text-[10px] text-slate-500 block mt-1">Default passcode: GDG2026ADMIN</span>
            </div>

            {authError && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {authError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-xs shadow-lg"
              >
                UNLOCK DASHBOARD
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900 border border-purple-500/40 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-purple-950/80 my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500 flex items-center justify-center text-xl shadow-md">
              🛠️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">Event Organizer Console</h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-mono font-bold">
                  AUTHORIZED
                </span>
              </div>
              <p className="text-xs text-slate-400">Campus Quest: The GDG Application Key (IET DAVV)</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:scale-105 active:scale-95 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-slate-800 shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Event Settings</span>
          </button>

          <button
            onClick={() => setActiveTab('checkpoints')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'checkpoints' ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>5 Checkpoints & GPS</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'questions' ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>25 Challenge Questions</span>
          </button>

          <button
            onClick={() => setActiveTab('fragments')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'fragments' ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Secret Fragments & Key</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'checklist' ? 'bg-purple-600 text-white' : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Publish Checklist</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs space-y-4">
          
          {/* ================= TAB 1: SETTINGS ================= */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Name</label>
                  <input
                    type="text"
                    value={configDraft.eventName}
                    onChange={(e) => setConfigDraft({ ...configDraft, eventName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">College / Institution</label>
                  <input
                    type="text"
                    value={configDraft.collegeName}
                    onChange={(e) => setConfigDraft({ ...configDraft, collegeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Status</label>
                  <select
                    value={configDraft.status}
                    onChange={(e) => setConfigDraft({ ...configDraft, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="active">Active (Playable)</option>
                    <option value="paused">Paused</option>
                    <option value="ended">Ended</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Default Lives Per Stage</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={configDraft.defaultLives}
                    onChange={(e) => setConfigDraft({ ...configDraft, defaultLives: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Mode</label>
                  <select
                    value={configDraft.mode}
                    onChange={(e) => setConfigDraft({ ...configDraft, mode: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="individual">Individual Mode</option>
                    <option value="team">Team Mode</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Official GDG Application Form URL (Unlocked by Master Key)
                </label>
                <input
                  type="url"
                  value={configDraft.applicationUrl}
                  onChange={(e) => setConfigDraft({ ...configDraft, applicationUrl: e.target.value })}
                  placeholder="https://gdg.community.dev/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Admin Passcode</label>
                <input
                  type="text"
                  value={configDraft.adminPasscode}
                  onChange={(e) => setConfigDraft({ ...configDraft, adminPasscode: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* ================= TAB 2: CHECKPOINTS ================= */}
          {activeTab === 'checkpoints' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <span>Characters & Campus Checkpoints</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono">
                      {checkpointsDraft.length} ACTIVE
                    </span>
                  </h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Configure character avatars, locations, and geofence radii. Tap <b>"Place on Map"</b> to move characters by dragging on the satellite view!
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenMapPlacement()}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-950/40 transition active:scale-95"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>Place All on Map</span>
                  </button>

                  <button
                    onClick={handleAddNewCharacter}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Character</span>
                  </button>
                </div>
              </div>

              {checkpointsDraft.map((cp, idx) => (
                <div key={cp.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 relative group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">
                        Stage {cp.stageNumber} — {cp.name}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-mono">
                        ID: {cp.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cp.characterAvatar}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].characterAvatar = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        title="Character Avatar Emoji"
                        className="w-10 h-10 text-center text-xl rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 focus:outline-none"
                      />
                      {checkpointsDraft.length > 1 && (
                        <button
                          onClick={() => handleDeleteCharacter(cp.id)}
                          className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-700 flex items-center justify-center transition"
                          title="Delete this character"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Character Name</label>
                      <input
                        type="text"
                        value={cp.characterName}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].characterName = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        placeholder="e.g. Ramesh Bhaiya"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Character Role / Title</label>
                      <input
                        type="text"
                        value={cp.characterRole}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].characterRole = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        placeholder="e.g. Campus Security Officer"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Checkpoint / Story Name</label>
                      <input
                        type="text"
                        value={cp.name}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].name = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Campus Location Name</label>
                      <input
                        type="text"
                        value={cp.shortLocation}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].shortLocation = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Secret Key Fragment</label>
                      <input
                        type="text"
                        value={cp.fragmentCode || ''}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].fragmentCode = e.target.value;
                          setCheckpointsDraft(updated);
                        }}
                        placeholder="e.g. GDG-"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Geofence & Place On Map section */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-1 border-t border-slate-800/80">
                    <div className="sm:col-span-3">
                      <label className="block text-slate-400 mb-1">Latitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={cp.latitude}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].latitude = parseFloat(e.target.value) || 0;
                          setCheckpointsDraft(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-slate-400 mb-1">Longitude</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={cp.longitude}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].longitude = parseFloat(e.target.value) || 0;
                          setCheckpointsDraft(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-slate-400 mb-1">Geofence Radius (m)</label>
                      <input
                        type="number"
                        value={cp.radiusMeters}
                        onChange={(e) => {
                          const updated = [...checkpointsDraft];
                          updated[idx].radiusMeters = parseInt(e.target.value) || 30;
                          setCheckpointsDraft(updated);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                      />
                    </div>

                    {/* Place On Map Button right after geofence blank */}
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => handleOpenMapPlacement(cp.id)}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/40 hover:scale-[1.02] active:scale-95 transition"
                        title={`Open map to tap and drag ${cp.characterName} to a new location`}
                      >
                        <Move className="w-3.5 h-3.5" />
                        <span>Place on Map</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ================= TAB 3: QUESTIONS ================= */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-slate-400">Select Stage:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedStage(s)}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      selectedStage === s
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Stage {s}
                  </button>
                ))}
              </div>

              {questionsDraft
                .filter((q) => q.stageNumber === selectedStage)
                .map((q, qIndex) => {
                  const actualIdx = questionsDraft.findIndex((x) => x.id === q.id);
                  return (
                    <div key={q.id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-cyan-400">
                          Question {q.questionNumber} of 5
                        </span>
                        <span className="text-[10px] text-slate-500">ID: {q.id}</span>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1">Prompt</label>
                        <textarea
                          rows={2}
                          value={q.prompt}
                          onChange={(e) => {
                            const updated = [...questionsDraft];
                            updated[actualIdx].prompt = e.target.value;
                            setQuestionsDraft(updated);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white"
                        />
                      </div>

                      {/* 5 Options */}
                      <div className="space-y-2">
                        <label className="block text-slate-400 font-bold">
                          5 Options (Mark radio for correct answer):
                        </label>
                        {q.options.map((opt, optIdx) => (
                          <div key={opt.id} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${q.id}`}
                              checked={q.correctAnswerId === opt.id}
                              onChange={() => {
                                const updated = [...questionsDraft];
                                updated[actualIdx].correctAnswerId = opt.id;
                                setQuestionsDraft(updated);
                              }}
                              className="accent-cyan-400"
                              title="Mark as correct answer"
                            />
                            <span className="font-mono text-cyan-400 font-bold w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => {
                                const updated = [...questionsDraft];
                                updated[actualIdx].options[optIdx].text = e.target.value;
                                setQuestionsDraft(updated);
                              }}
                              className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-slate-400 mb-0.5">Hint (Power-Up Clue)</label>
                          <input
                            type="text"
                            value={q.hint}
                            onChange={(e) => {
                              const updated = [...questionsDraft];
                              updated[actualIdx].hint = e.target.value;
                              setQuestionsDraft(updated);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-400 mb-0.5">Explanation</label>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) => {
                              const updated = [...questionsDraft];
                              updated[actualIdx].explanation = e.target.value;
                              setQuestionsDraft(updated);
                            }}
                            className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ================= TAB 4: FRAGMENTS ================= */}
          {activeTab === 'fragments' && (
            <div className="space-y-4">
              <p className="text-slate-400">
                Configure the five code fragments awarded by the campus characters and the master assembled key.
              </p>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <label className="block font-bold text-amber-300">
                  Master Key Hash (Expected Assembled String)
                </label>
                <input
                  type="text"
                  value={configDraft.secretFinalKey}
                  onChange={(e) => setConfigDraft({ ...configDraft, secretFinalKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-600/50 text-amber-200 font-mono text-sm tracking-wider"
                />
              </div>

              {checkpointsDraft.map((cp, idx) => (
                <div key={cp.id} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold">Slot {cp.stageNumber}:</span>
                    <span className="text-slate-300">{cp.characterName} ({cp.name})</span>
                  </div>
                  <input
                    type="text"
                    value={cp.fragmentCode}
                    onChange={(e) => {
                      const updated = [...checkpointsDraft];
                      updated[idx].fragmentCode = e.target.value;
                      updated[idx].fragmentText = e.target.value;
                      setCheckpointsDraft(updated);
                    }}
                    className="w-36 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* ================= TAB 5: PUBLISH CHECKLIST ================= */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-white text-sm">Pre-Event Publish Validation</h4>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    allPassed ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-amber-950 text-amber-300 border border-amber-600'
                  }`}>
                    {allPassed ? "ALL READY FOR EVENT" : "ACTION REQUIRED"}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Every item must pass before students start the orientation quest at IET DAVV.
                </p>
              </div>

              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-xl border flex items-start gap-3 ${
                      item.passed
                        ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-900/50 text-rose-200'
                    }`}
                  >
                    {item.passed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-xs sm:text-sm text-white">{item.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{item.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Interactive Map Placement & Dragging Modal */}
      {showMapPlacement && (
        <MapPlacementPickerModal
          checkpoints={checkpointsDraft}
          targetCheckpointId={placementTargetId}
          onSaveCheckpoints={handleSavePlacedCheckpoints}
          onClose={() => setShowMapPlacement(false)}
        />
      )}
    </div>
  );
};
