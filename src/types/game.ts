export type BranchOption =
  | 'Computer Science and Business Systems'
  | 'Computer Science and Engineering'
  | 'Information Technology'
  | 'Electronics and Communication Engineering'
  | 'Electronics and Instrumentation'
  | 'Mechanical Engineering'
  | 'Civil Engineering'
  | 'Other';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  stageNumber: number; // 1 to 5
  questionNumber: number; // 1 to 5
  prompt: string;
  options: QuestionOption[]; // Exactly 5 options
  correctAnswerId: string;
  hint: string;
  explanation: string;
  isNarrativeOnly?: boolean; // For narrative questions like "Why are you here?"
}

export interface Checkpoint {
  id: string;
  stageNumber: number; // 1 to 5
  name: string;
  shortLocation: string;
  characterName: string;
  characterRole: string;
  characterAvatar: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
  introDialogue: {
    speaker: string;
    text: string;
  }[];
  successDialogue: {
    speaker: string;
    text: string;
  };
  failureDialogue: {
    speaker: string;
    text: string;
  };
  fragmentText: string;
  fragmentName: string;
  fragmentCode: string;
}

export interface PowerUp {
  id: 'hint_reveal' | 'radius_boost' | 'time_bonus';
  name: string;
  description: string;
  icon: string;
  count: number;
  durationSeconds?: number;
}

export interface ActiveBoost {
  type: 'radius_boost';
  boostMeters: number;
  expiresAt: number; // timestamp ms
}

export interface Participant {
  id: string;
  rollNumber: string;
  displayName: string;
  branch?: BranchOption;
  teamId?: string;
  currentStage: number; // 1 to 5
  currentQuestionIndex: number; // 0 to 4
  lives: number; // default 3
  score: number;
  completedStages: number[]; // e.g. [1, 2]
  collectedFragments: string[]; // e.g. ['GDG-', 'QUEST-', ...]
  powerUps: Record<string, number>;
  activeBoost?: ActiveBoost;
  lastAttemptFailed?: boolean;
  isGatekeeperScolding?: boolean; // special state when failing Professor
  hasValidatedFinalKey: boolean;
  characterCooldowns?: Record<string, number>; // checkpointId -> timestamp when 10s cooldown ends
  characterTimeoutFailures?: Record<string, boolean>; // checkpointId/stage -> true if lost due to timeout
  joinedAt: number;
  lastActiveAt: number;
}

export interface Team {
  id: string;
  name: string;
  code: string;
  leaderRollNumber: string;
  memberRollNumbers: string[];
  score: number;
  completedStages: number[];
  collectedFragments: string[];
  createdAt: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  isTeam: boolean;
  score: number;
  completedStagesCount: number;
  currentStage: number;
  completedAt?: number;
  rank?: number;
}

export interface EventConfig {
  id: string;
  eventName: string;
  collegeName: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  mode: 'individual' | 'team';
  defaultLives: number;
  pointsPerStage: number;
  timeBonusPoints: number;
  radiusBoostMeters: number;
  radiusBoostDurationSec: number;
  applicationUrl: string;
  adminPasscode: string;
  secretFinalKey: string; // "GDG-IET-DAVV-KEY-2026"
  keyAssemblyOrder: string[]; // ['FRAG1', 'FRAG2', 'FRAG3', 'FRAG4', 'FRAG5']
}

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  isSimulated?: boolean;
}
