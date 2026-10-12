import { 
  Participant, 
  Checkpoint, 
  Question, 
  EventConfig, 
  Team, 
  LeaderboardEntry,
  BranchOption 
} from '../types/game';
import { 
  DEFAULT_CHECKPOINTS, 
  DEFAULT_QUESTIONS, 
  DEFAULT_EVENT_CONFIG,
  TECHNICAL_WRONG_JOKES 
} from '../config/defaultData';
import { 
  db, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot 
} from '../config/firebase';

const STORAGE_KEYS = {
  PARTICIPANT: 'cq_current_participant',
  EVENT_CONFIG: 'cq_event_config',
  CHECKPOINTS: 'cq_checkpoints',
  QUESTIONS: 'cq_questions',
  TEAMS: 'cq_teams',
  LEADERBOARD: 'cq_leaderboard'
};

export class GameStorageService {
  private static instance: GameStorageService;

  private constructor() {
    this.ensureInitialized();
  }

  public static getInstance(): GameStorageService {
    if (!GameStorageService.instance) {
      GameStorageService.instance = new GameStorageService();
    }
    return GameStorageService.instance;
  }

  private ensureInitialized() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG)) {
      localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(DEFAULT_EVENT_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CHECKPOINTS)) {
      localStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(DEFAULT_CHECKPOINTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.QUESTIONS)) {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.LEADERBOARD)) {
      // Seed with engaging mock participants for initial leaderboard demonstration
      const initialLeaderboard: LeaderboardEntry[] = [
        { id: "p_demo_1", name: "Aarav (24CS012)", isTeam: false, score: 530, completedStagesCount: 5, currentStage: 5, rank: 1 },
        { id: "p_demo_2", name: "Ananya S. (24IT045)", isTeam: false, score: 420, completedStagesCount: 4, currentStage: 5, rank: 2 },
        { id: "p_demo_3", name: "Team ByteBusters", isTeam: true, score: 380, completedStagesCount: 3, currentStage: 4, rank: 3 },
        { id: "p_demo_4", name: "Rohan M. (24EC019)", isTeam: false, score: 260, completedStagesCount: 2, currentStage: 3, rank: 4 }
      ];
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(initialLeaderboard));
    }
  }

  // ===================== EVENT CONFIG =====================
  public getEventConfig(): EventConfig {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
    return raw ? JSON.parse(raw) : DEFAULT_EVENT_CONFIG;
  }

  public async saveEventConfig(config: EventConfig): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(config));
    if (db) {
      try {
        await setDoc(doc(db, "events", config.id), config, { merge: true });
      } catch (err) {
        console.warn("Could not save event config to Firestore (using local storage):", err);
      }
    }
  }

  // ===================== CHECKPOINTS =====================
  public getCheckpoints(): Checkpoint[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CHECKPOINTS);
    return raw ? JSON.parse(raw) : DEFAULT_CHECKPOINTS;
  }

  public async saveCheckpoints(checkpoints: Checkpoint[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CHECKPOINTS, JSON.stringify(checkpoints));
    if (db) {
      try {
        const eventId = this.getEventConfig().id;
        for (const cp of checkpoints) {
          await setDoc(doc(db, "events", eventId, "checkpoints", cp.id), cp, { merge: true });
        }
      } catch (err) {
        console.warn("Could not sync checkpoints to Firestore:", err);
      }
    }
  }

  // ===================== QUESTIONS =====================
  public getQuestions(): Question[] {
    const raw = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
    return raw ? JSON.parse(raw) : DEFAULT_QUESTIONS;
  }

  public async saveQuestions(questions: Question[]): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
    if (db) {
      try {
        const eventId = this.getEventConfig().id;
        for (const q of questions) {
          await setDoc(doc(db, "events", eventId, "questions", q.id), q, { merge: true });
        }
      } catch (err) {
        console.warn("Could not sync questions to Firestore:", err);
      }
    }
  }

  // ===================== PARTICIPANT SESSION =====================
  public getParticipant(): Participant | null {
    const raw = localStorage.getItem(STORAGE_KEYS.PARTICIPANT);
    return raw ? JSON.parse(raw) : null;
  }

  public saveParticipant(participant: Participant): void {
    localStorage.setItem(STORAGE_KEYS.PARTICIPANT, JSON.stringify(participant));
    this.updateLeaderboardEntry(participant);
    
    // Sync to Firestore in background
    if (db) {
      try {
        const eventId = this.getEventConfig().id;
        setDoc(doc(db, "events", eventId, "participants", participant.id), participant, { merge: true })
          .catch(e => console.warn("Firestore participant sync deferred:", e));
      } catch {
        // Safe fallback
      }
    }
  }

  public initializeParticipant(rollNumber: string, displayName: string, branch?: BranchOption): Participant {
    const existing = this.getParticipant();
    if (existing && existing.rollNumber.toUpperCase() === rollNumber.toUpperCase()) {
      existing.lastActiveAt = Date.now();
      if (branch) existing.branch = branch;
      this.saveParticipant(existing);
      return existing;
    }

    const config = this.getEventConfig();
    const newParticipant: Participant = {
      id: `p_${rollNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString(36)}`,
      rollNumber: rollNumber.trim().toUpperCase(),
      displayName: displayName.trim() || `Fresher ${rollNumber.toUpperCase()}`,
      branch: branch || 'Computer Science and Engineering',
      currentStage: 1,
      currentQuestionIndex: 0,
      lives: config.defaultLives,
      score: 0,
      completedStages: [],
      collectedFragments: [],
      powerUps: {
        hint_reveal: 2, // 2 free hints to start
        radius_boost: 2, // 2 radius boosts
        time_bonus: 1   // 1 time bonus
      },
      hasValidatedFinalKey: false,
      joinedAt: Date.now(),
      lastActiveAt: Date.now()
    };

    this.saveParticipant(newParticipant);
    return newParticipant;
  }

  // Reset stage attempt on retry (keeps completed stages & fragments intact!)
  public retryStage(participant: Participant, stageNumber: number): Participant {
    const config = this.getEventConfig();
    const updated: Participant = {
      ...participant,
      currentStage: stageNumber,
      currentQuestionIndex: 0,
      lives: config.defaultLives,
      lastAttemptFailed: false,
      isGatekeeperScolding: false,
      lastActiveAt: Date.now()
    };
    this.saveParticipant(updated);
    return updated;
  }

  // Clear scolding state and retry Professor stage
  public dismissScoldingAndRetryProfessor(participant: Participant): Participant {
    return this.retryStage(participant, 2);
  }

  // Complete game reset when all 3 hearts/lives are lost:
  // Starts player again from the Guard (Gatekeeper / Stage 1), resets completed stages, collected fragments, currentStage=1, lives=3
  public resetCompleteGame(participant: Participant): Participant {
    const config = this.getEventConfig();
    const updated: Participant = {
      ...participant,
      currentStage: 1,
      currentQuestionIndex: 0,
      lives: config.defaultLives, // 3 fresh hearts for the new restart from Stage 1
      score: 0,
      completedStages: [],
      collectedFragments: [],
      powerUps: {
        hint_reveal: 2,
        radius_boost: 2,
        time_bonus: 1
      },
      activeBoost: undefined,
      hasValidatedFinalKey: false,
      lastAttemptFailed: false,
      isGatekeeperScolding: false,
      characterCooldowns: {},
      characterTimeoutFailures: {},
      lastActiveAt: Date.now()
    };
    this.saveParticipant(updated);
    this.updateLeaderboardEntry(updated);
    return updated;
  }

  // ===================== LEADERBOARD =====================
  public getLeaderboard(): LeaderboardEntry[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
    // Sort descending by score, then by completedStagesCount descending
    return list.sort((a, b) => b.score - a.score || b.completedStagesCount - a.completedStagesCount)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }

  private updateLeaderboardEntry(participant: Participant) {
    try {
      const list = this.getLeaderboard();
      const existingIdx = list.findIndex(e => e.id === participant.id);
      const entry: LeaderboardEntry = {
        id: participant.id,
        name: `${participant.displayName} (${participant.rollNumber})`,
        isTeam: !!participant.teamId,
        score: participant.score,
        completedStagesCount: participant.completedStages.length,
        currentStage: participant.currentStage,
        completedAt: participant.hasValidatedFinalKey ? Date.now() : undefined
      };

      if (existingIdx >= 0) {
        list[existingIdx] = entry;
      } else {
        list.push(entry);
      }

      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(list));

      if (db) {
        const eventId = this.getEventConfig().id;
        setDoc(doc(db, "events", eventId, "leaderboard", participant.id), entry, { merge: true })
          .catch(() => {});
      }
    } catch {
      // ignore
    }
  }

  // ===================== TEAMS =====================
  public getTeams(): Team[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    return raw ? JSON.parse(raw) : [];
  }

  public createTeam(name: string, participant: Participant): Team {
    const code = `GDG-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: name.trim(),
      code,
      leaderRollNumber: participant.rollNumber,
      memberRollNumbers: [participant.rollNumber],
      score: participant.score,
      completedStages: [...participant.completedStages],
      collectedFragments: [...participant.collectedFragments],
      createdAt: Date.now()
    };

    const teams = this.getTeams();
    teams.push(newTeam);
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));

    const updatedParticipant = {
      ...participant,
      teamId: newTeam.id
    };
    this.saveParticipant(updatedParticipant);

    return newTeam;
  }

  public joinTeam(code: string, participant: Participant): Team | null {
    const teams = this.getTeams();
    const team = teams.find(t => t.code.toUpperCase() === code.trim().toUpperCase());
    if (!team) return null;

    if (!team.memberRollNumbers.includes(participant.rollNumber)) {
      team.memberRollNumbers.push(participant.rollNumber);
      // Sync team progress with participant
      team.score = Math.max(team.score, participant.score);
      team.completedStages = Array.from(new Set([...team.completedStages, ...participant.completedStages]));
      team.collectedFragments = Array.from(new Set([...team.collectedFragments, ...participant.collectedFragments]));
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    }

    const updatedParticipant = {
      ...participant,
      teamId: team.id,
      score: team.score,
      completedStages: team.completedStages,
      collectedFragments: team.collectedFragments
    };
    this.saveParticipant(updatedParticipant);
    return team;
  }

  // Random technical joke generator
  public getRandomWrongJoke(): string {
    const idx = Math.floor(Math.random() * TECHNICAL_WRONG_JOKES.length);
    return TECHNICAL_WRONG_JOKES[idx];
  }

  // Reset entire quest for demo/testing
  public resetQuest(participant: Participant): Participant {
    const config = this.getEventConfig();
    const resetUser: Participant = {
      ...participant,
      currentStage: 1,
      currentQuestionIndex: 0,
      lives: config.defaultLives,
      score: 0,
      completedStages: [],
      collectedFragments: [],
      hasValidatedFinalKey: false,
      lastAttemptFailed: false,
      isGatekeeperScolding: false,
      powerUps: {
        hint_reveal: 2,
        radius_boost: 2,
        time_bonus: 1
      },
      lastActiveAt: Date.now()
    };
    this.saveParticipant(resetUser);
    return resetUser;
  }
}

export const gameStorage = GameStorageService.getInstance();
