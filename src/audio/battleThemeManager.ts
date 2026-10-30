// Star Trek Heroic Combat Theme Manager
// Plays the iconic Star Trek Theme from YouTube (ID: oIyo8oC2cCE) from the beginning (0:00) and loops continuously
// Supports manual toggle (B key) that stays playing when not under attack, auto-combat wave trigger,
// volume controls, and Web Audio API synthesized brass fanfare fallback.

type ThemeStateListener = (state: {
  isPlaying: boolean;
  isReady: boolean;
  isMuted: boolean;
  isManualActive: boolean;
  volume: number;
  autoPlayOnCombat: boolean;
}) => void;

class BattleThemeManager {
  private static instance: BattleThemeManager;
  private player: any = null;
  private isReady = false;
  private isPlaying = false;
  private isMuted = false;
  private isManualActive = false; // When true, user explicitly pressed B; do NOT auto-pause when peaceful!
  private volume = 75;
  private autoPlayOnCombat = false; // Turned off: Do not autoplay theme music in battle unless explicitly triggered!
  private listeners = new Set<ThemeStateListener>();
  private pendingPlay = false;
  private startOffsetSeconds = 0; // Starts from the very beginning (0:00)
  private lastPausedTime = 0; // Remembers exact second when paused to resume from where it was paused
  private iframeContainerId = 'star-trek-battle-theme-iframe-host';

  // Web Audio Fallback Synthesizer
  private fallbackAudioCtx: AudioContext | null = null;
  private fallbackGain: GainNode | null = null;
  private isFallbackPlaying = false;
  private fallbackTimeout: number | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initYouTubeAPI();
      this.setupUserInteractionListener();
    }
  }

  public static getInstance(): BattleThemeManager {
    if (!BattleThemeManager.instance) {
      BattleThemeManager.instance = new BattleThemeManager();
    }
    return BattleThemeManager.instance;
  }

  private notify() {
    const state = {
      isPlaying: this.isPlaying || this.isFallbackPlaying,
      isReady: this.isReady,
      isMuted: this.isMuted,
      isManualActive: this.isManualActive,
      volume: this.volume,
      autoPlayOnCombat: this.autoPlayOnCombat,
    };
    this.listeners.forEach((listener) => listener(state));
  }

  public subscribe(listener: ThemeStateListener): () => void {
    this.listeners.add(listener);
    listener({
      isPlaying: this.isPlaying || this.isFallbackPlaying,
      isReady: this.isReady,
      isMuted: this.isMuted,
      isManualActive: this.isManualActive,
      volume: this.volume,
      autoPlayOnCombat: this.autoPlayOnCombat,
    });
    return () => this.listeners.delete(listener);
  }

  private setupUserInteractionListener() {
    const handleFirstInteraction = () => {
      if (this.pendingPlay) {
        this.pendingPlay = false;
        this.play(this.startOffsetSeconds);
      }
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
  }

  private initYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      document.head.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      this.createPlayer();
    };

    // If API was already loaded before
    if ((window as any).YT && (window as any).YT.Player) {
      this.createPlayer();
    }
  }

  public attachPlayerHost(elementId: string) {
    this.iframeContainerId = elementId;
    if ((window as any).YT && (window as any).YT.Player && !this.player) {
      this.createPlayer();
    }
  }

  private createPlayer() {
    if (typeof window === 'undefined' || !((window as any).YT && (window as any).YT.Player)) return;

    let targetEl = document.getElementById(this.iframeContainerId);
    if (!targetEl) {
      targetEl = document.createElement('div');
      targetEl.id = this.iframeContainerId;
      targetEl.style.position = 'fixed';
      targetEl.style.bottom = '-9999px';
      targetEl.style.left = '-9999px';
      targetEl.style.width = '1px';
      targetEl.style.height = '1px';
      targetEl.style.opacity = '0.01';
      targetEl.style.pointerEvents = 'none';
      document.body.appendChild(targetEl);
    }

    try {
      this.player = new (window as any).YT.Player(this.iframeContainerId, {
        height: '1',
        width: '1',
        videoId: 'oIyo8oC2cCE',
        playerVars: {
          autoplay: 0,
          controls: 0,
          start: 0,
          loop: 1,
          playlist: 'oIyo8oC2cCE', // required by YouTube for iframe looping
          disablekb: 1,
          fs: 0,
          playsinline: 1,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: (event: any) => {
            this.isReady = true;
            event.target.setVolume(this.volume);
            if (this.isMuted) {
              event.target.mute();
            }
            if (this.pendingPlay) {
              this.pendingPlay = false;
              this.play(this.startOffsetSeconds);
            }
            this.notify();
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.PLAYING = 1, PAUSED = 2, ENDED = 0
            if (event.data === 1) {
              this.isPlaying = true;
            } else if (event.data === 2) {
              this.isPlaying = false;
            } else if (event.data === 0) {
              // Track ended -> Loop from the beginning seamlessly!
              if (this.isPlaying || this.isManualActive) {
                try {
                  this.player.seekTo(0, true);
                  this.player.playVideo();
                  this.isPlaying = true;
                } catch {
                  this.isPlaying = false;
                }
              } else {
                this.isPlaying = false;
              }
            }
            this.notify();
          },
          onError: () => {
            // If YouTube is blocked by ad-blocker or network, engage synthesized audio fallback
            if (this.pendingPlay || this.isPlaying) {
              this.playSynthesizedFallback();
            }
          },
        },
      });
    } catch (e) {
      console.warn('Failed to initialize YouTube Battle Theme player', e);
    }
  }

  // User manually presses [B] key or clicks the Theme ON/OFF button
  public manualToggle() {
    if (this.isPlaying || this.isFallbackPlaying) {
      this.isManualActive = false;
      this.pause();
    } else {
      this.isManualActive = true;
      // Resume from paused position instead of restarting from 0
      this.resume();
    }
  }

  // Alias for manualToggle
  public toggle() {
    this.manualToggle();
  }

  // Play or resume from exact paused position
  public resume() {
    if (this.isMuted) return;

    if (!this.player || !this.isReady) {
      this.pendingPlay = true;
      this.playSynthesizedFallback();
      this.notify();
      return;
    }

    try {
      this.player.setVolume(this.volume);
      if (this.lastPausedTime > 0) {
        this.player.seekTo(this.lastPausedTime, true);
      }
      this.player.playVideo();
      this.isPlaying = true;
      this.stopSynthesizedFallback();
      this.notify();
    } catch {
      this.playSynthesizedFallback();
    }
  }

  // Play from specific timestamp (e.g. 38 seconds or 0 seconds)
  public playFromTime(seconds: number) {
    this.isManualActive = true;
    this.lastPausedTime = seconds;
    this.startOffsetSeconds = seconds;
    this.play(seconds);
  }

  private whiteHoleStopTimer: number | null = null;

  // Triggered when entering the Black Hole: plays the theme song starting from 42 seconds
  public playBlackHoleTransitTheme() {
    if (this.whiteHoleStopTimer !== null) {
      clearTimeout(this.whiteHoleStopTimer);
      this.whiteHoleStopTimer = null;
    }
    this.startOffsetSeconds = 42;
    this.lastPausedTime = 42;
    this.play(42);
  }

  // Triggered when coming out of the White Dwarf / White Hole: stops the theme song after 3 seconds
  public stopAfterWhiteHoleEjection(delayMs: number = 3000) {
    if (this.whiteHoleStopTimer !== null) {
      clearTimeout(this.whiteHoleStopTimer);
    }
    this.whiteHoleStopTimer = window.setTimeout(() => {
      this.whiteHoleStopTimer = null;
      this.isManualActive = false;
      this.pause();
    }, delayMs);
  }

  // Called automatically when fighting hostile wave
  public handleCombatStart() {
    if (!this.autoPlayOnCombat) return; // Honour autoplay disabled setting!
    if (this.isPlaying || this.isFallbackPlaying) return;
    if (this.lastPausedTime > 0) {
      this.resume();
    } else {
      this.play(0);
    }
  }

  // Called automatically when combat wave is cleared or peaceful
  public handleCombatEnd() {
    // If the user manually turned the music on with [B], DO NOT stop it!
    if (this.isManualActive) return;
    if (this.isPlaying || this.isFallbackPlaying) {
      this.pause();
    }
  }

  // Called when Enterprise is destroyed
  public handleShipDestroyed() {
    this.isManualActive = false;
    this.stop();
  }

  public play(startTimeSeconds?: number) {
    if (this.isMuted) return;

    if (startTimeSeconds !== undefined) {
      this.startOffsetSeconds = startTimeSeconds;
      this.lastPausedTime = startTimeSeconds;
    }

    if (!this.player || !this.isReady) {
      this.pendingPlay = true;
      // Start fallback synthesized theme temporarily until YouTube loads
      this.playSynthesizedFallback();
      this.notify();
      return;
    }

    try {
      this.player.setVolume(this.volume);
      if (startTimeSeconds !== undefined) {
        this.player.seekTo(startTimeSeconds, true);
      } else if (this.lastPausedTime > 0) {
        this.player.seekTo(this.lastPausedTime, true);
      }
      this.player.playVideo();
      this.isPlaying = true;
      this.stopSynthesizedFallback();
      this.notify();
    } catch {
      this.playSynthesizedFallback();
    }
  }

  public pause() {
    if (!this.isPlaying && !this.isFallbackPlaying && !this.pendingPlay) return;
    this.pendingPlay = false;
    this.stopSynthesizedFallback();
    if (this.player && this.isReady) {
      try {
        const curr = this.player.getCurrentTime?.();
        if (typeof curr === 'number' && !isNaN(curr) && curr >= 0) {
          this.lastPausedTime = curr;
        }
        this.player.pauseVideo();
        this.isPlaying = false;
        this.notify();
      } catch {
        // ignore
      }
    } else {
      this.isPlaying = false;
      this.notify();
    }
  }

  public stop() {
    if (!this.isPlaying && !this.isFallbackPlaying && !this.pendingPlay) return;
    this.pendingPlay = false;
    this.isManualActive = false;
    this.lastPausedTime = 0;
    this.stopSynthesizedFallback();
    if (this.player && this.isReady) {
      try {
        this.player.pauseVideo();
        this.player.seekTo(0, true);
        this.isPlaying = false;
        this.notify();
      } catch {
        // ignore
      }
    } else {
      this.isPlaying = false;
      this.notify();
    }
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(100, volume));
    if (this.player && this.isReady) {
      try {
        this.player.setVolume(this.volume);
      } catch {
        // ignore
      }
    }
    if (this.fallbackGain && this.fallbackAudioCtx) {
      this.fallbackGain.gain.setValueAtTime((this.volume / 100) * 0.15, this.fallbackAudioCtx.currentTime);
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.isMuted) {
      if (this.player && this.isReady) {
        try {
          this.player.mute();
        } catch {
          // ignore
        }
      }
      this.stopSynthesizedFallback();
    } else {
      if (this.player && this.isReady) {
        try {
          this.player.unMute();
          this.player.setVolume(this.volume);
        } catch {
          // ignore
        }
      }
    }
    this.notify();
  }

  public setAutoPlayOnCombat(auto: boolean) {
    this.autoPlayOnCombat = auto;
    this.notify();
  }

  public getAutoPlayOnCombat(): boolean {
    return this.autoPlayOnCombat;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying || this.isFallbackPlaying;
  }

  public getIsManualActive(): boolean {
    return this.isManualActive;
  }

  // --- Synthesized Star Trek Theme March Fallback with Endless Loop Support ---
  private playSynthesizedFallback() {
    if (this.isMuted || this.isFallbackPlaying) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!this.fallbackAudioCtx) {
        this.fallbackAudioCtx = new AudioCtx();
      }
      if (this.fallbackAudioCtx.state === 'suspended') {
        this.fallbackAudioCtx.resume();
      }

      this.fallbackGain = this.fallbackAudioCtx.createGain();
      this.fallbackGain.gain.setValueAtTime((this.volume / 100) * 0.12, this.fallbackAudioCtx.currentTime);
      this.fallbackGain.connect(this.fallbackAudioCtx.destination);
      this.isFallbackPlaying = true;

      // Iconic Star Trek Heroic Theme Fanfare notes
      const notes = [
        { note: 466.16, duration: 0.7 }, // Bb4
        { note: 622.25, duration: 1.1 }, // Eb5
        { note: 783.99, duration: 0.5 }, // G5
        { note: 698.46, duration: 0.4 }, // F5
        { note: 622.25, duration: 0.5 }, // Eb5
        { note: 466.16, duration: 0.8 }, // Bb4
        { note: 523.25, duration: 0.6 }, // C5
        { note: 466.16, duration: 0.5 }, // Bb4
        { note: 415.30, duration: 0.4 }, // Ab4
        { note: 466.16, duration: 1.2 }, // Bb4
      ];

      let currentTime = this.fallbackAudioCtx.currentTime + 0.05;
      notes.forEach((item) => {
        if (!this.fallbackAudioCtx || !this.fallbackGain) return;
        const osc = this.fallbackAudioCtx.createOscillator();
        const noteGain = this.fallbackAudioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(item.note, currentTime);

        noteGain.gain.setValueAtTime(0, currentTime);
        noteGain.gain.linearRampToValueAtTime(0.7, currentTime + 0.04);
        noteGain.gain.exponentialRampToValueAtTime(0.001, currentTime + item.duration - 0.02);

        osc.connect(noteGain);
        noteGain.connect(this.fallbackGain);

        osc.start(currentTime);
        osc.stop(currentTime + item.duration);
        currentTime += item.duration;
      });

      // Loop synthesized fallback if user still wants it playing
      this.fallbackTimeout = window.setTimeout(() => {
        this.isFallbackPlaying = false;
        if (this.isPlaying || this.isManualActive) {
          this.playSynthesizedFallback();
        } else {
          this.notify();
        }
      }, 7000);
    } catch {
      // Audio context not allowed
    }
  }

  private stopSynthesizedFallback() {
    this.isFallbackPlaying = false;
    if (this.fallbackTimeout) {
      clearTimeout(this.fallbackTimeout);
      this.fallbackTimeout = null;
    }
    if (this.fallbackGain && this.fallbackAudioCtx) {
      try {
        this.fallbackGain.gain.setValueAtTime(0, this.fallbackAudioCtx.currentTime);
      } catch {
        // ignore
      }
    }
  }
}

export const battleThemeManager = BattleThemeManager.getInstance();
