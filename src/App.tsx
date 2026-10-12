/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Participant, 
  Checkpoint, 
  Question, 
  EventConfig, 
  Team, 
  LeaderboardEntry, 
  GPSPosition,
  BranchOption 
} from './types/game';
import { gameStorage } from './services/storageService';
import { sounds } from './services/soundEffects';
import { Navbar } from './components/Navbar';
import { RollNumberScreen } from './components/RollNumberScreen';
import { CampusMap } from './components/CampusMap';
import { CheckpointCard } from './components/CheckpointCard';
import { DialogueModal } from './components/DialogueModal';
import { QuizModal } from './components/QuizModal';
import { VirtualKeyAssembler } from './components/VirtualKeyAssembler';
import { PowerUpBar } from './components/PowerUpBar';
import { FragmentInventory } from './components/FragmentInventory';
import { LeaderboardModal } from './components/LeaderboardModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { TeamModal } from './components/TeamModal';
import { AdminDashboard } from './components/AdminDashboard';
import { SubmissionDocModal } from './components/SubmissionDocModal';
import { Sparkles, MapPin, ListFilter, Compass, Trophy } from 'lucide-react';

export default function App() {
  const [participant, setParticipant] = useState<Participant | null>(() => gameStorage.getParticipant());
  const [eventConfig, setEventConfig] = useState<EventConfig>(() => gameStorage.getEventConfig());
  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>(() => gameStorage.getCheckpoints());
  const [questions, setQuestions] = useState<Question[]>(() => gameStorage.getQuestions());
  const [teams, setTeams] = useState<Team[]>(() => gameStorage.getTeams());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => gameStorage.getLeaderboard());

  // Location state
  const activeCheckpoint = checkpoints.find(c => c.stageNumber === (participant?.currentStage || 1)) || checkpoints[0];
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(() => ({
    // Initialize right near Gatekeeper for immediate ready-to-play testing
    latitude: activeCheckpoint.latitude + 0.00002,
    longitude: activeCheckpoint.longitude + 0.00002,
    accuracy: 5,
    timestamp: Date.now(),
    isSimulated: true
  }));
  const [isSimulated, setIsSimulated] = useState<boolean>(true);

  // Modals state
  const [selectedCheckpointForDialogue, setSelectedCheckpointForDialogue] = useState<Checkpoint | null>(null);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showKeyAssembler, setShowKeyAssembler] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);

  // Active view toggle on mobile (Map vs Checkpoint List)
  const [mobileViewTab, setMobileViewTab] = useState<'map' | 'list'>('map');

  // Check if player failed Professor and needs Gatekeeper scolding
  useEffect(() => {
    if (participant?.isGatekeeperScolding) {
      const gatekeeperCp = checkpoints.find(c => c.stageNumber === 1) || checkpoints[0];
      setSelectedCheckpointForDialogue(gatekeeperCp);
    }
  }, [participant?.isGatekeeperScolding, checkpoints]);

  // Handle start quest from RollNumberScreen
  const handleStartQuest = (rollNumber: string, displayName: string, branch: BranchOption) => {
    const newParticipant = gameStorage.initializeParticipant(rollNumber, displayName, branch);
    setParticipant(newParticipant);
    setLeaderboard(gameStorage.getLeaderboard());
  };

  // Position update from Map or GPS
  const handlePositionUpdate = (pos: GPSPosition, simulated: boolean) => {
    setCurrentPosition(pos);
    setIsSimulated(simulated);
  };

  // Enter checkpoint dialog
  const handleEnterCheckpoint = (checkpoint: Checkpoint) => {
    const cooldownUntil = participant?.characterCooldowns?.[checkpoint.id] || 0;
    if (cooldownUntil > Date.now()) {
      sounds.playWrong();
      return;
    }
    setSelectedCheckpointForDialogue(checkpoint);
  };

  // Accept challenge and start quiz
  const handleAcceptChallenge = () => {
    setIsQuizActive(true);
  };

  // Handle Answer Submission
  const handleAnswerSubmit = (
    isCorrect: boolean, 
    _questionIndex: number, 
    remainingLives: number, 
    isStageComplete: boolean
  ) => {
    if (!participant) return;

    let updatedScore = participant.score;
    if (isCorrect) {
      updatedScore += 20; // 20 pts per correct answer
    }

    const updated: Participant = {
      ...participant,
      lives: remainingLives,
      score: updatedScore,
      lastActiveAt: Date.now()
    };

    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    setLeaderboard(gameStorage.getLeaderboard());
  };

  // Stage Failed (0 lives)
  const handleStageFailed = (stageNumber: number) => {
    if (!participant) return;

    setIsQuizActive(false);

    // If out of hearts (all 3 hearts lost), total reset back to Stage 1 Guard
    // The player is required to do everything again from the guard section
    if ((participant.lives || 0) <= 0) {
      handleResetCompleteGame();
      return;
    }

    // Special state when failing Professor (stage 2) with hearts safeguarded: Gatekeeper scolding scene
    if (stageNumber === 2) {
      const updated: Participant = {
        ...participant,
        isGatekeeperScolding: true,
        lastAttemptFailed: true,
        lastActiveAt: Date.now()
      };
      gameStorage.saveParticipant(updated);
      setParticipant(updated);

      const gatekeeper = checkpoints.find(c => c.stageNumber === 1) || checkpoints[0];
      setSelectedCheckpointForDialogue(gatekeeper);
    } else {
      // Any other stage failing out of lives -> complete reset to Guard
      handleResetCompleteGame();
    }
  };

  // Professor retry from Gatekeeper scolding scene
  const handleRetryProfessorFromScolding = () => {
    if (!participant) return;
    const retried = gameStorage.dismissScoldingAndRetryProfessor(participant);
    setParticipant(retried);

    // Reopen Professor checkpoint
    const professor = checkpoints.find(c => c.stageNumber === 2) || checkpoints[1];
    setSelectedCheckpointForDialogue(professor);
  };

  // Review progress from Gatekeeper scolding scene
  const handleReviewProgressFromScolding = () => {
    if (!participant) return;
    const updated = {
      ...participant,
      isGatekeeperScolding: false
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    setSelectedCheckpointForDialogue(null);
    setShowKeyAssembler(true);
  };

  // Complete Game Reset (triggered when all 3 hearts/lives are lost)
  // Resets player completely back to The Guard (Gatekeeper / Stage 1) with 3 fresh lives
  const handleResetCompleteGame = () => {
    if (!participant) return;
    const reset = gameStorage.resetCompleteGame(participant);
    setParticipant(reset);
    setLeaderboard(gameStorage.getLeaderboard());
    setIsQuizActive(false);

    // Re-target Gatekeeper (Stage 1)
    const gatekeeper = checkpoints.find(c => c.stageNumber === 1) || checkpoints[0];
    setSelectedCheckpointForDialogue(gatekeeper);
  };

  // Timeout failure cooldown and comeback flag trigger (10s cooldown)
  const handleTriggerTimeoutCooldown = (checkpointId: string, cooldownUntil: number) => {
    if (!participant) return;
    const cooldowns = { ...(participant.characterCooldowns || {}), [checkpointId]: cooldownUntil };
    const timeoutFailures = { ...(participant.characterTimeoutFailures || {}), [checkpointId]: true };
    const updated: Participant = {
      ...participant,
      characterCooldowns: cooldowns,
      characterTimeoutFailures: timeoutFailures,
      lastActiveAt: Date.now()
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
  };

  // Stage Success (Award fragment & +100 bonus & advance stage)
  const handleStageSuccess = (stageNumber: number, fragmentCode: string) => {
    if (!participant) return;

    const newCompletedStages = Array.from(new Set([...participant.completedStages, stageNumber]));
    const newFragments = Array.from(new Set([...participant.collectedFragments, fragmentCode]));

    const nextStage = stageNumber < 5 ? stageNumber + 1 : 5;

    const updated: Participant = {
      ...participant,
      completedStages: newCompletedStages,
      collectedFragments: newFragments,
      currentStage: nextStage,
      currentQuestionIndex: 0,
      lives: eventConfig.defaultLives, // fresh 3 lives for next stage
      score: participant.score + eventConfig.pointsPerStage, // +100 stage completion bonus
      lastAttemptFailed: false,
      isGatekeeperScolding: false,
      lastActiveAt: Date.now()
    };

    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    setLeaderboard(gameStorage.getLeaderboard());

    setIsQuizActive(false);
    setSelectedCheckpointForDialogue(null);

    // If stage 5 completed, automatically prompt key assembler
    if (stageNumber === 5) {
      setShowKeyAssembler(true);
    }
  };

  // Consume Hint Power-Up
  const handleConsumeHint = (): boolean => {
    if (!participant) return false;
    const currentHints = participant.powerUps.hint_reveal || 0;
    if (currentHints <= 0) return false;

    const updated: Participant = {
      ...participant,
      powerUps: {
        ...participant.powerUps,
        hint_reveal: currentHints - 1
      }
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    return true;
  };

  // Activate Radius Boost Power-Up (+25m for 60s)
  const handleActivateRadiusBoost = () => {
    if (!participant) return;
    const currentRadiusBoosts = participant.powerUps.radius_boost || 0;
    if (currentRadiusBoosts <= 0) return;

    const updated: Participant = {
      ...participant,
      powerUps: {
        ...participant.powerUps,
        radius_boost: currentRadiusBoosts - 1
      },
      activeBoost: {
        type: 'radius_boost',
        boostMeters: eventConfig.radiusBoostMeters,
        expiresAt: Date.now() + eventConfig.radiusBoostDurationSec * 1000
      }
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
  };

  // Activate Time Bonus Power-Up (+30 pts)
  const handleActivateTimeBonus = () => {
    if (!participant) return;
    const currentTimeBonuses = participant.powerUps.time_bonus || 0;
    if (currentTimeBonuses <= 0) return;

    const updated: Participant = {
      ...participant,
      score: participant.score + eventConfig.timeBonusPoints,
      powerUps: {
        ...participant.powerUps,
        time_bonus: currentTimeBonuses - 1
      }
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    setLeaderboard(gameStorage.getLeaderboard());
  };

  // Key validated successfully
  const handleValidateKeySuccess = () => {
    if (!participant) return;
    const updated: Participant = {
      ...participant,
      hasValidatedFinalKey: true,
      score: participant.score + 250 // Master key unlocked bonus
    };
    gameStorage.saveParticipant(updated);
    setParticipant(updated);
    setLeaderboard(gameStorage.getLeaderboard());
  };

  // Create & Join Team
  const handleCreateTeam = (name: string) => {
    if (!participant) return;
    const newTeam = gameStorage.createTeam(name, participant);
    setTeams(gameStorage.getTeams());
    setParticipant(gameStorage.getParticipant());
  };

  const handleJoinTeam = (code: string): boolean => {
    if (!participant) return false;
    const team = gameStorage.joinTeam(code, participant);
    if (team) {
      setTeams(gameStorage.getTeams());
      setParticipant(gameStorage.getParticipant());
      return true;
    }
    return false;
  };

  // Admin Save Callbacks
  const handleSaveConfig = async (newConfig: EventConfig) => {
    await gameStorage.saveEventConfig(newConfig);
    setEventConfig(newConfig);
  };

  const handleSaveCheckpoints = async (newCheckpoints: Checkpoint[]) => {
    await gameStorage.saveCheckpoints(newCheckpoints);
    setCheckpoints(newCheckpoints);
  };

  const handleSaveQuestions = async (newQuestions: Question[]) => {
    await gameStorage.saveQuestions(newQuestions);
    setQuestions(newQuestions);
  };

  // Reset quest for demonstration
  const handleResetQuest = () => {
    if (!participant) return;
    const resetUser = gameStorage.resetQuest(participant);
    setParticipant(resetUser);
    setLeaderboard(gameStorage.getLeaderboard());
    setSelectedCheckpointForDialogue(null);
    setIsQuizActive(false);
  };

  // If player hasn't registered roll number yet, show the dedicated start screen
  if (!participant) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          participant={null}
          eventConfig={eventConfig}
          onOpenLeaderboard={() => setShowLeaderboard(true)}
          onOpenHowToPlay={() => setShowHowToPlay(true)}
          onOpenAdmin={() => setShowAdmin(true)}
          onOpenTeam={() => setShowTeamModal(true)}
          onOpenKeyAssembler={() => setShowKeyAssembler(true)}
          onOpenDoc={() => setShowDocModal(true)}
        />
        <main className="flex-1">
          <RollNumberScreen
            onStartQuest={handleStartQuest}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
            onOpenDoc={() => setShowDocModal(true)}
          />
        </main>
        {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
        {showDocModal && (
          <SubmissionDocModal
            appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
            onClose={() => setShowDocModal(false)}
          />
        )}
        {showLeaderboard && (
          <LeaderboardModal
            entries={leaderboard}
            currentParticipant={{ id: 'guest', rollNumber: 'GUEST', displayName: 'Guest', currentStage: 1, currentQuestionIndex: 0, lives: 3, score: 0, completedStages: [], collectedFragments: [], powerUps: {}, hasValidatedFinalKey: false, joinedAt: Date.now(), lastActiveAt: Date.now() }}
            onClose={() => setShowLeaderboard(false)}
          />
        )}
        {showAdmin && (
          <AdminDashboard
            eventConfig={eventConfig}
            checkpoints={checkpoints}
            questions={questions}
            onSaveConfig={handleSaveConfig}
            onSaveCheckpoints={handleSaveCheckpoints}
            onSaveQuestions={handleSaveQuestions}
            onClose={() => setShowAdmin(false)}
          />
        )}
      </div>
    );
  }

  // Active stage questions
  const activeStageQuestions = questions.filter(
    q => q.stageNumber === (selectedCheckpointForDialogue?.stageNumber || participant.currentStage)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        participant={participant}
        eventConfig={eventConfig}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenHowToPlay={() => setShowHowToPlay(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onOpenTeam={() => setShowTeamModal(true)}
        onOpenKeyAssembler={() => setShowKeyAssembler(true)}
        onOpenDoc={() => setShowDocModal(true)}
        onResetQuest={handleResetQuest}
      />

      {/* Main Exploration Screen */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-4">
        
        {/* Mobile View Switcher (Map vs Checkpoint List) */}
        <div className="flex md:hidden rounded-2xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setMobileViewTab('map')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mobileViewTab === 'map'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Campus GPS Map</span>
          </button>

          <button
            onClick={() => setMobileViewTab('list')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mobileViewTab === 'list'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>5 Checkpoints List</span>
          </button>
        </div>

        {/* Desktop Two-Column / Mobile Tabbed Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Left Column (Map & Powerups) */}
          <div className={`lg:col-span-7 space-y-4 ${mobileViewTab === 'list' ? 'hidden md:block' : 'block'}`}>
            <CampusMap
              checkpoints={checkpoints}
              participant={participant}
              activeCheckpoint={activeCheckpoint}
              currentPosition={currentPosition}
              isSimulated={isSimulated}
              onPositionUpdate={handlePositionUpdate}
              onEnterCheckpoint={handleEnterCheckpoint}
            />

            {/* Power-Up bar */}
            <PowerUpBar
              participant={participant}
              eventConfig={eventConfig}
              onActivateRadiusBoost={handleActivateRadiusBoost}
              onActivateTimeBonus={handleActivateTimeBonus}
            />
          </div>

          {/* Right Column (Accessible Checkpoint Cards & Mission Details) */}
          <div className={`lg:col-span-5 space-y-3 ${mobileViewTab === 'map' ? 'hidden md:block' : 'block'}`}>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>Story Destinations ({checkpoints.length})</span>
              </span>
              <span className="text-[11px] font-mono text-cyan-400">
                Active: Stage {participant.currentStage}/5
              </span>
            </div>

            <div className="space-y-3">
              {checkpoints.map((cp) => (
                <CheckpointCard
                  key={cp.id}
                  checkpoint={cp}
                  participant={participant}
                  currentPosition={currentPosition}
                  onEnter={handleEnterCheckpoint}
                  onTeleportTo={(targetCp) => {
                    handlePositionUpdate({
                      latitude: targetCp.latitude + 0.00002,
                      longitude: targetCp.longitude + 0.00002,
                      accuracy: 5,
                      timestamp: Date.now(),
                      isSimulated: true
                    }, true);
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Full-Width: 5-Fragment Inventory Bar */}
        <FragmentInventory
          participant={participant}
          checkpoints={checkpoints}
          eventConfig={eventConfig}
          onOpenKeyAssembler={() => setShowKeyAssembler(true)}
        />
      </main>

      {/* Modals & Dialogues */}

      {/* 1. Character Dialogue Modal */}
      {selectedCheckpointForDialogue && !isQuizActive && (
        <DialogueModal
          checkpoint={selectedCheckpointForDialogue}
          participant={participant}
          isGatekeeperScolding={participant.isGatekeeperScolding && selectedCheckpointForDialogue.stageNumber === 1}
          onAcceptChallenge={handleAcceptChallenge}
          onRetryProfessorAgain={handleRetryProfessorFromScolding}
          onReviewProgress={handleReviewProgressFromScolding}
          onClose={() => setSelectedCheckpointForDialogue(null)}
        />
      )}

      {/* 2. 5-Question Quiz Challenge Modal */}
      {isQuizActive && selectedCheckpointForDialogue && (
        <QuizModal
          checkpoint={selectedCheckpointForDialogue}
          questions={activeStageQuestions}
          participant={participant}
          onAnswerSubmit={handleAnswerSubmit}
          onStageFailed={handleStageFailed}
          onResetCompleteGame={handleResetCompleteGame}
          onTriggerTimeoutCooldown={handleTriggerTimeoutCooldown}
          onStageSuccess={handleStageSuccess}
          onConsumeHint={handleConsumeHint}
          onClose={() => {
            setIsQuizActive(false);
            setSelectedCheckpointForDialogue(null);
          }}
        />
      )}

      {/* 3. Master Key Assembler & Climax Ending Screen */}
      {showKeyAssembler && (
        <VirtualKeyAssembler
          participant={participant}
          eventConfig={eventConfig}
          onValidateKeySuccess={handleValidateKeySuccess}
          onOpenLeaderboard={() => {
            setShowKeyAssembler(false);
            setShowLeaderboard(true);
          }}
          onClose={() => setShowKeyAssembler(false)}
        />
      )}

      {/* 4. Live Leaderboard */}
      {showLeaderboard && (
        <LeaderboardModal
          entries={leaderboard}
          currentParticipant={participant}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* 5. Team Modal */}
      {showTeamModal && (
        <TeamModal
          participant={participant}
          teams={teams}
          onCreateTeam={handleCreateTeam}
          onJoinTeam={handleJoinTeam}
          onClose={() => setShowTeamModal(false)}
        />
      )}

      {/* 6. How To Play & Rules */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* 7. Organizer & Admin Console */}
      {showAdmin && (
        <AdminDashboard
          eventConfig={eventConfig}
          checkpoints={checkpoints}
          questions={questions}
          onSaveConfig={handleSaveConfig}
          onSaveCheckpoints={handleSaveCheckpoints}
          onSaveQuestions={handleSaveQuestions}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* 8. Task 3 Solution Guide & Repo ZIP Modal */}
      {showDocModal && (
        <SubmissionDocModal
          appUrl={typeof window !== 'undefined' ? window.location.origin : ''}
          onClose={() => setShowDocModal(false)}
        />
      )}
    </div>
  );
}
