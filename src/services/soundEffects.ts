// Web Audio API Retro Sound Effects Engine, BGM Manager & Haptics

export type BgmTrack = 'overworld' | 'battle';

type AudioChangeListener = (muted: boolean, volume: number, isPlaying: boolean, currentTrack?: BgmTrack) => void;

class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7; // 0.0 to 1.0

  // Two dedicated background tracks: Overworld Theme (Route 1) and Trainer Battle Theme
  private overworldAudio: HTMLAudioElement | null = null;
  private battleAudio: HTMLAudioElement | null = null;
  private activeTrack: BgmTrack = 'overworld';
  private isBgmPlaying: boolean = false;

  private listeners: Set<AudioChangeListener> = new Set();
  private lastTypewriterSoundTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('cq_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }

      const storedVol = localStorage.getItem('cq_volume');
      if (storedVol !== null) {
        const parsed = parseFloat(storedVol);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
          this.volume = parsed;
        }
      }

      this.initBgm();
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initBgm() {
    try {
      // Overworld theme (Route 1 chiptune)
      const owAudio = new Audio('/audio/pokemon-theme.mp3');
      owAudio.loop = true;
      owAudio.preload = 'auto';
      owAudio.volume = this.isMuted ? 0 : this.volume;
      this.overworldAudio = owAudio;

      // Trainer Battle theme (Plays specifically when quiz challenge starts after dialogue)
      const btAudio = new Audio('/audio/battle-theme.mp3');
      btAudio.loop = true;
      btAudio.preload = 'auto';
      btAudio.volume = this.isMuted ? 0 : this.volume;
      this.battleAudio = btAudio;

      const syncPlayState = () => {
        const active = this.getActiveAudio();
        this.isBgmPlaying = Boolean(active && !active.paused);
        this.notifyListeners();
      };

      owAudio.addEventListener('play', syncPlayState);
      owAudio.addEventListener('pause', syncPlayState);
      btAudio.addEventListener('play', syncPlayState);
      btAudio.addEventListener('pause', syncPlayState);

      // Browser autoplay policy handler: start on first user interaction
      const handleFirstInteraction = () => {
        this.initContext();
        if (!this.isMuted) {
          const active = this.getActiveAudio();
          if (!active || active.paused) {
            this.playCurrentTrack();
          }
        }
        window.removeEventListener('pointerdown', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      };

      window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
      window.addEventListener('keydown', handleFirstInteraction, { passive: true });
      window.addEventListener('touchstart', handleFirstInteraction, { passive: true });
    } catch (e) {
      console.warn('BGM initialization notice:', e);
    }
  }

  private getActiveAudio(): HTMLAudioElement | null {
    return this.activeTrack === 'battle' ? this.battleAudio : this.overworldAudio;
  }

  public subscribe(listener: AudioChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.isMuted, this.volume, this.isBgmPlaying, this.activeTrack);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      listener(this.isMuted, this.volume, this.isBgmPlaying, this.activeTrack);
    });
  }

  private playCurrentTrack() {
    this.initContext();
    const current = this.getActiveAudio();
    if (!current) return;

    current.volume = this.isMuted ? 0 : this.volume;
    current.play().then(() => {
      this.isBgmPlaying = true;
      this.notifyListeners();
    }).catch(() => {
      // Autoplay prevented until user gestures
    });
  }

  // Start Overworld BGM loop
  public startBgm() {
    this.playTrack('overworld');
  }

  // Switch to specific track ('overworld' | 'battle')
  public playTrack(track: BgmTrack) {
    this.initContext();
    const prevActive = this.getActiveAudio();
    if (prevActive && this.activeTrack !== track) {
      prevActive.pause();
      prevActive.currentTime = 0;
    }

    this.activeTrack = track;
    const nextActive = this.getActiveAudio();
    if (!nextActive) return;

    nextActive.volume = this.isMuted ? 0 : this.volume;
    nextActive.play().then(() => {
      this.isBgmPlaying = true;
      this.notifyListeners();
    }).catch(() => {
      // Waiting for interaction
    });
  }

  // Start battle theme (called right when quiz starts after dialogue)
  public startBattleTheme() {
    this.playTrack('battle');
  }

  // Stop battle theme and return to overworld theme (called when quiz ends or user closes quiz)
  public stopBattleTheme() {
    this.playTrack('overworld');
  }

  public pauseBgm() {
    const active = this.getActiveAudio();
    if (active) {
      active.pause();
      this.isBgmPlaying = false;
      this.notifyListeners();
    }
  }

  public setVolume(newVolume: number) {
    const clamped = Math.max(0, Math.min(1, newVolume));
    this.volume = clamped;
    localStorage.setItem('cq_volume', clamped.toFixed(2));

    const effectiveVol = this.isMuted ? 0 : clamped;
    if (this.overworldAudio) this.overworldAudio.volume = effectiveVol;
    if (this.battleAudio) this.battleAudio.volume = effectiveVol;

    if (clamped > 0 && this.isMuted) {
      this.isMuted = false;
      localStorage.setItem('cq_muted', 'false');
    }

    if (clamped > 0 && !this.isBgmPlaying) {
      this.playCurrentTrack();
    }

    this.notifyListeners();
  }

  public getVolume(): number {
    return this.volume;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('cq_muted', String(this.isMuted));

    const effectiveVol = this.isMuted ? 0 : this.volume;
    if (this.overworldAudio) this.overworldAudio.volume = effectiveVol;
    if (this.battleAudio) this.battleAudio.volume = effectiveVol;

    const active = this.getActiveAudio();
    if (!this.isMuted && active && active.paused) {
      this.playCurrentTrack();
    }

    this.notifyListeners();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getIsPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public getCurrentTrack(): BgmTrack {
    return this.activeTrack;
  }

  // Pokémon Game Boy dialogue typewriter bleep
  public playTypewriterBlip() {
    if (this.isMuted) return;
    const nowMs = Date.now();
    // Throttle sound so it doesn't clip
    if (nowMs - this.lastTypewriterSoundTime < 45) return;
    this.lastTypewriterSoundTime = nowMs;

    try {
      this.initContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      // Retro pitch variation for realistic speech simulation
      const baseFreq = 780 + (Math.random() * 80 - 40);
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.setValueAtTime(baseFreq * 0.92, now + 0.012);

      const amp = this.volume * 0.07;
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.028);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.028);
    } catch {
      // ignore
    }
  }

  // Play click / tap sound
  public playClick() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);

      const amp = this.volume * 0.18;
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context error ignore
    }
  }

  // Play correct answer chime
  public playCorrect() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        const amp = this.volume * 0.22;
        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(amp, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.25);
      });

      if (navigator.vibrate) {
        navigator.vibrate([40, 30, 40]);
      }
    } catch {
      // ignore
    }
  }

  // Play wrong answer buzzer
  public playWrong() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.28);

      const amp = this.volume * 0.25;
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);

      if (navigator.vibrate) {
        navigator.vibrate([150, 50, 150]);
      }
    } catch {
      // ignore
    }
  }

  // Play countdown timer tick warning
  public playTimerTick(isUrgent: boolean = false) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = isUrgent ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(isUrgent ? 880 : 540, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(isUrgent ? 440 : 270, this.ctx.currentTime + 0.04);

      const amp = this.volume * (isUrgent ? 0.14 : 0.07);
      gain.gain.setValueAtTime(amp, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // ignore
    }
  }

  // Stage victory fanfare
  public playVictoryFanfare() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const fanfare = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 523.25, t: 0.15, d: 0.15 },
        { f: 523.25, t: 0.3, d: 0.15 },
        { f: 659.25, t: 0.45, d: 0.3 },
        { f: 587.33, t: 0.75, d: 0.15 },
        { f: 659.25, t: 0.9, d: 0.15 },
        { f: 783.99, t: 1.05, d: 0.45 }
      ];

      fanfare.forEach(({ f, t, d }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + t);

        const amp = this.volume * 0.18;
        gain.gain.setValueAtTime(amp, this.ctx!.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + t + d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + t);
        osc.stop(this.ctx!.currentTime + t + d);
      });
    } catch {
      // ignore
    }
  }

  // Game over sound
  public playGameOver() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const notes = [
        { f: 392.00, t: 0.0, d: 0.2 },
        { f: 369.99, t: 0.2, d: 0.2 },
        { f: 349.23, t: 0.4, d: 0.2 },
        { f: 329.63, t: 0.6, d: 0.4 }
      ];

      notes.forEach(({ f, t, d }) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + t);

        const amp = this.volume * 0.22;
        gain.gain.setValueAtTime(amp, this.ctx!.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + t + d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + t);
        osc.stop(this.ctx!.currentTime + t + d);
      });
    } catch {
      // ignore
    }
  }

  // Fragment Key Unlock
  public playUnlockFragment() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, this.ctx!.currentTime + i * 0.06);

        const amp = this.volume * 0.2;
        gain.gain.setValueAtTime(amp, this.ctx!.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + i * 0.06 + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(this.ctx!.currentTime + i * 0.06);
        osc.stop(this.ctx!.currentTime + i * 0.06 + 0.15);
      });
    } catch {
      // ignore
    }
  }

  // Stage Completion alias
  public playStageComplete() {
    this.playVictoryFanfare();
  }

  // Virtual Key Unlocked alias
  public playKeyUnlocked() {
    this.playUnlockFragment();
  }
}

export const sounds = new SoundManager();
