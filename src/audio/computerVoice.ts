// Ship's LCARS Computer Voice Telemetry & Tactical Co-Pilot System
// USS Enterprise NCC-1701 Preset Voice Engine
// 100% OFFLINE PRE-RECORDED STARFLEET MP3 SOUNDBANK (1.mp3 to 29.mp3)
// Old synthetic voices (speechSynthesis / SAM-JS) completely removed.
// ZERO OVERLAP: If another voice starts playing, the first one is immediately stopped!

import { soundEffects } from './soundEffects';
import { customAudioBank } from './customAudioBank';
import { STARFLEET_VOICE_PHRASES } from './voicePhrases';

export enum VoicePriority {
  NAVIGATION = 1, // Course, warp, orbits, docking (suppressed during Red Alert)
  SYSTEM = 2,     // Shield toggle, EPS boost, alert condition changes
  TACTICAL = 3,   // Shields < 50%, ordnance depletion, decloak detected, battlegroup
  CRITICAL = 4,   // Shields < 20%, structural breach, torpedo collision lock
}

export interface VoiceAnnouncement {
  id: string;
  text: string;
  priority: VoicePriority;
  category: 'tactical' | 'astrogation' | 'threat' | 'power';
  cooldownKey?: string;
  cooldownSeconds?: number;
}

export type VoiceStateListener = (speaking: boolean, text: string) => void;

class ShipComputerVoiceSystem {
  private isEnabled: boolean = true;
  private currentAlertLevel: 'green' | 'yellow' | 'red' = 'green';
  private isSpeaking: boolean = false;
  private currentSpeechText: string = '';
  private cooldowns: Map<string, number> = new Map();
  private stateListeners: Set<VoiceStateListener> = new Set();
  private onEnabledChangeCallback: ((enabled: boolean) => void) | null = null;

  // Active clip playback stopper
  private activeCustomPlaybackStop: (() => void) | null = null;

  // Watchdogs
  private watchdogTimer: number | null = null;

  // Combat status trackers
  private shieldWarned50: boolean = false;
  private shieldWarned20: boolean = false;
  private ordnanceWarnedEmpty: boolean = false;
  private lastHullBreachWarnPercent: number = 100;

  constructor() {
    try {
      const savedEnabled = localStorage.getItem('lcars_computer_voice_enabled');
      if (savedEnabled !== null) {
        this.isEnabled = savedEnabled === 'true';
      }
    } catch {}

    // Ensure audio clips are probed upon first user gesture
    if (typeof window !== 'undefined') {
      const initAudio = () => {
        soundEffects.setMuted(false);
        const ctx = soundEffects.getAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        customAudioBank.probePublicAudioFiles();
        window.removeEventListener('pointerdown', initAudio);
        window.removeEventListener('keydown', initAudio);
      };
      window.addEventListener('pointerdown', initAudio, { once: true });
      window.addEventListener('keydown', initAudio, { once: true });
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.isSpeaking, this.currentSpeechText);
    return () => this.stateListeners.delete(listener);
  }

  private notifyListeners() {
    this.stateListeners.forEach((fn) => {
      try {
        fn(this.isSpeaking, this.currentSpeechText);
      } catch {}
    });
  }

  public onEnabledChange(cb: (enabled: boolean) => void) {
    this.onEnabledChangeCallback = cb;
  }

  public isVoiceEnabled(): boolean {
    return this.isEnabled;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    try {
      localStorage.setItem('lcars_computer_voice_enabled', enabled ? 'true' : 'false');
    } catch {}
    if (!enabled) {
      this.cancelSpeech();
    }
    this.onEnabledChangeCallback?.(enabled);
  }

  public toggle(): boolean {
    this.setVoiceEnabled(!this.isEnabled);
    return this.isEnabled;
  }

  public isSpeakingNow(): boolean {
    return this.isSpeaking;
  }

  public getCurrentText(): string {
    return this.currentSpeechText;
  }

  // Signature Starfleet Intercom Chime (subtle Web Audio chime before announcement)
  private playBridgeIntercomChime(isCritical: boolean = false) {
    const ctx = soundEffects.getAudioContext();
    if (!ctx) return;

    try {
      const t = ctx.currentTime;
      if (isCritical) {
        // Red alert chime
        [880, 698.46, 880].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.05);
          gain.gain.setValueAtTime(0.18, t + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + idx * 0.05);
          osc.stop(t + idx * 0.05 + 0.075);
        });
      } else {
        // Standard Starfleet intercom chime
        [659.25, 987.77].forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t + idx * 0.06);
          gain.gain.setValueAtTime(0.16, t + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(t + idx * 0.06);
          osc.stop(t + idx * 0.06 + 0.075);
        });
      }
    } catch {}
  }

  // Stop currently playing voice completely
  // "solve that if another voices start playing stop the first one"
  public cancelSpeech() {
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    if (this.activeCustomPlaybackStop) {
      try {
        this.activeCustomPlaybackStop();
      } catch {}
      this.activeCustomPlaybackStop = null;
    }

    // Stop clip in custom audio bank immediately
    customAudioBank.stopCurrentClip();

    this.isSpeaking = false;
    this.currentSpeechText = '';
    this.notifyListeners();
  }

  public stopSpeech() {
    this.cancelSpeech();
  }

  // Explicit test voice trigger (plays Phrase #1 / 01.mp3)
  public testVoice(phrase?: string) {
    soundEffects.setMuted(false);
    const ctx = soundEffects.getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // Stop any currently playing voice immediately!
    this.cancelSpeech();

    // Check if sound bank needs probing
    if (customAudioBank.getLoadedClipsCount() === 0) {
      customAudioBank.probePublicAudioFiles();
    }

    // Find phrase definition if a specific phrase was passed
    let announcementId = 'test_voice';
    let text = 'USS Enterprise computer online. Tactical telemetry and flight systems nominal.';

    if (phrase) {
      const match = STARFLEET_VOICE_PHRASES.find(
        (p) => p.text.toLowerCase() === phrase.toLowerCase() || p.id === phrase
      );
      if (match) {
        announcementId = match.id;
        text = match.text;
      } else {
        text = phrase;
      }
    }

    this.announce({
      id: announcementId,
      text,
      priority: VoicePriority.CRITICAL,
      category: 'power',
    });
  }

  // --- CORE ANNOUNCEMENT DISPATCHER ---
  // STRICT RULE: "if another voices start playing stop the first one"
  public announce(announcement: VoiceAnnouncement) {
    if (!this.isEnabled) return;

    // RULE 1: Non-essential navigational chatter is suppressed during Red Alert
    if (this.currentAlertLevel === 'red' && announcement.priority <= VoicePriority.NAVIGATION) {
      return;
    }

    // RULE 2: Cooldown check to prevent spam
    const now = performance.now();
    if (announcement.cooldownKey) {
      const lastTrigger = this.cooldowns.get(announcement.cooldownKey) || 0;
      const cooldownMs = (announcement.cooldownSeconds ?? 10) * 1000;
      if (now - lastTrigger < cooldownMs) {
        return;
      }
      this.cooldowns.set(announcement.cooldownKey, now);
    }

    // RULE 3: ZERO OVERLAP: If another voice is playing, STOP THE FIRST ONE IMMEDIATELY!
    this.cancelSpeech();

    // Dispatch speech immediately
    this.dispatchSpeech(
      announcement.text,
      announcement.priority >= VoicePriority.CRITICAL,
      announcement.id
    );
  }

  // --- DISPATCH SPEECH FROM MP3 SOUNDBANK ---
  // Completely eliminates old synthetic speech / browser TTS!
  private dispatchSpeech(text: string, isCritical: boolean, announcementId?: string) {
    this.currentSpeechText = text;
    this.isSpeaking = true;
    this.notifyListeners();

    // Play subtle Starfleet intercom bridge chime
    this.playBridgeIntercomChime(isCritical);

    let isFinished = false;
    const onFinish = () => {
      if (isFinished) return;
      isFinished = true;

      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }

      this.activeCustomPlaybackStop = null;
      this.isSpeaking = false;
      this.currentSpeechText = '';
      this.notifyListeners();
    };

    // 1. Look up matching MP3 in the Starfleet Soundbank
    const customClip = customAudioBank.getClipForAnnouncement(announcementId, text);

    if (customClip) {
      const durationMs = Math.round(customClip.duration * 1000);

      // Play the MP3 clip cleanly with zero latency
      const clipResult = customAudioBank.playClip(customClip.id, onFinish);
      if (clipResult) {
        this.activeCustomPlaybackStop = clipResult.stop;

        // Safety watchdog: reset banner if end event is dropped
        this.watchdogTimer = window.setTimeout(() => {
          if (this.isSpeaking) {
            onFinish();
          }
        }, durationMs + 600);

        return;
      }
    }

    // 2. If clip is still loading from disk, probe audio bank and display LCARS on-screen banner
    customAudioBank.probePublicAudioFiles();

    // Visual on-screen duration (no robotic TTS)
    const visualDurationMs = Math.max(2800, (text.length / 14) * 1000 + 800);
    this.watchdogTimer = window.setTimeout(() => {
      onFinish();
    }, visualDurationMs);
  }

  // =========================================================================
  // OPERATIONAL ROLE 1: INSTANTANEOUS TACTICAL WARNINGS
  // =========================================================================

  public onShieldsChanged(currentPercent: number, prevPercent: number) {
    if (currentPercent > 55) {
      this.shieldWarned50 = false;
    }
    if (currentPercent > 35) {
      this.shieldWarned20 = false;
    }

    // Shield below 50%
    if (currentPercent <= 50 && prevPercent > 50 && !this.shieldWarned50) {
      this.shieldWarned50 = true;
      this.announce({
        id: 'shields_50',
        text: 'Warning. Deflector shields reduced to fifty percent.',
        priority: VoicePriority.TACTICAL,
        category: 'tactical',
        cooldownKey: 'shields_50',
        cooldownSeconds: 15,
      });
    }

    // Shield below 20%
    if (currentPercent <= 20 && currentPercent > 0 && prevPercent > 20 && !this.shieldWarned20) {
      this.shieldWarned20 = true;
      this.announce({
        id: 'shields_20',
        text: 'Warning. Shield collapse imminent. Deflector integrity below twenty percent.',
        priority: VoicePriority.CRITICAL,
        category: 'tactical',
        cooldownKey: 'shields_20',
        cooldownSeconds: 12,
      });
    }

    // Total shield collapse
    if (currentPercent <= 0 && prevPercent > 0) {
      this.announce({
        id: 'shields_down',
        text: 'Alert. Deflector shields collapsed. Starship taking direct fire.',
        priority: VoicePriority.CRITICAL,
        category: 'tactical',
        cooldownKey: 'shields_collapsed',
        cooldownSeconds: 10,
      });
    }
  }

  public onStructuralBreach(hullPercent: number) {
    const rounded = Math.round(hullPercent);
    if (rounded <= 0) {
      this.announce({
        id: 'core_breach',
        text: 'Catastrophic core containment failure. Evacuate ship.',
        priority: VoicePriority.CRITICAL,
        category: 'tactical',
        cooldownKey: 'core_breach',
        cooldownSeconds: 6,
      });
      return;
    }

    if (rounded <= 25 && this.lastHullBreachWarnPercent > 25) {
      this.lastHullBreachWarnPercent = rounded;
      this.announce({
        id: 'hull_breach_critical',
        text: 'Critical structural breach detected. Primary hull integrity at twenty-five percent.',
        priority: VoicePriority.CRITICAL,
        category: 'tactical',
        cooldownKey: 'hull_breach_25',
        cooldownSeconds: 10,
      });
    } else if (rounded <= 50 && this.lastHullBreachWarnPercent > 50) {
      this.lastHullBreachWarnPercent = rounded;
      this.announce({
        id: 'hull_breach_major',
        text: 'Alert. Structural compromise on multiple decks. Hull integrity fifty percent.',
        priority: VoicePriority.TACTICAL,
        category: 'tactical',
        cooldownKey: 'hull_breach_50',
        cooldownSeconds: 10,
      });
    } else if (rounded <= 75 && this.lastHullBreachWarnPercent > 75) {
      this.lastHullBreachWarnPercent = rounded;
      this.announce({
        id: 'hull_breach_minor',
        text: 'Structural integrity breach detected on secondary hull.',
        priority: VoicePriority.TACTICAL,
        category: 'tactical',
        cooldownKey: 'hull_breach_75',
        cooldownSeconds: 12,
      });
    }

    if (rounded >= 95) {
      this.lastHullBreachWarnPercent = 100;
    }
  }

  public onTorpedoFired(remainingCount: number) {
    if (remainingCount <= 0 && !this.ordnanceWarnedEmpty) {
      this.ordnanceWarnedEmpty = true;
      this.announce({
        id: 'ordnance_depleted',
        text: 'Photon torpedo ordnance depleted. Zero warheads remaining in magazine.',
        priority: VoicePriority.TACTICAL,
        category: 'tactical',
        cooldownKey: 'torpedo_empty',
        cooldownSeconds: 15,
      });
    } else if (remainingCount === 2) {
      this.announce({
        id: 'ordnance_critical',
        text: 'Warning. Photon torpedo reserves critical. Two warheads remaining.',
        priority: VoicePriority.TACTICAL,
        category: 'tactical',
        cooldownKey: 'torpedo_critical',
        cooldownSeconds: 20,
      });
    } else if (remainingCount > 5) {
      this.ordnanceWarnedEmpty = false;
    }
  }

  public onIncomingTorpedoLock() {
    this.announce({
      id: 'torpedo_incoming',
      text: 'Warning. Hostile torpedo lock detected. Evasive action advised.',
      priority: VoicePriority.CRITICAL,
      category: 'tactical',
      cooldownKey: 'incoming_torpedo',
      cooldownSeconds: 6,
    });
  }

  // =========================================================================
  // OPERATIONAL ROLE 2: ASTROGATION CONFIRMATIONS
  // =========================================================================

  public onCourseLocked(_targetName: string, _distanceKm?: number) {
    this.announce({
      id: 'course_locked',
      text: 'Course laid in. Heading confirmed.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'course_lock',
      cooldownSeconds: 4,
    });
  }

  public onWarpEngaged(_factor: number = 4.5) {
    this.announce({
      id: 'warp_engaged',
      text: 'Warp drive engaged. Subspace displacement active.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'warp_engage',
      cooldownSeconds: 3,
    });
  }

  public onWarpFactorChanged(factor: number, etaSeconds?: number) {
    const etaText = etaSeconds !== undefined && etaSeconds > 0
      ? ` Estimated arrival in ${etaSeconds} seconds.`
      : '';
    this.announce({
      id: `warp_factor_${factor}`,
      text: `Warp factor adjusted to ${factor.toFixed(1)}.${etaText}`,
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'warp_factor_change',
      cooldownSeconds: 2,
    });
  }

  public onWarpDropped() {
    this.announce({
      id: 'warp_dropped',
      text: 'Dropping out of warp. Starship returning to standard impulse velocity.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'warp_drop',
      cooldownSeconds: 3,
    });
  }

  public onOrbitalEntry(_planetName: string) {
    this.announce({
      id: 'orbital_entry',
      text: 'Entering standard planetary orbit. Astrogation holding.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'orbit_holding',
      cooldownSeconds: 20,
    });
  }

  public onDockingInitiated(_stationName: string) {
    this.announce({
      id: 'docking_engaged',
      text: 'Mooring clamps locked. Starbase refit and ordnance reload initiated.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'docking_locked',
      cooldownSeconds: 8,
    });
  }

  public onUndockingDepart() {
    this.announce({
      id: 'undocking_clear',
      text: 'Mooring clamps released. Thrusters clear of drydock superstructure.',
      priority: VoicePriority.NAVIGATION,
      category: 'astrogation',
      cooldownKey: 'undock_clear',
      cooldownSeconds: 5,
    });
  }

  // =========================================================================
  // OPERATIONAL ROLE 3: SENSOR THREAT INTELLIGENCE
  // =========================================================================

  public onDecloakDetected(_shipType: string = 'Klingon Bird-of-Prey') {
    this.announce({
      id: 'decloak_detected',
      text: 'Sensors detect tactical decloak signature. Hostile uncloaking on tactical grid.',
      priority: VoicePriority.TACTICAL,
      category: 'threat',
      cooldownKey: 'decloak',
      cooldownSeconds: 8,
    });
  }

  public onHostileWaveArrived(waveLevel: number, _enemyCount: number, hasMothership: boolean) {
    if (hasMothership) {
      this.announce({
        id: 'wave_mothership',
        text: 'Tactical alert. Hostile dreadnought flagship entering sector with battlegroup escort.',
        priority: VoicePriority.CRITICAL,
        category: 'threat',
        cooldownKey: `wave_${waveLevel}`,
        cooldownSeconds: 20,
      });
    } else {
      this.announce({
        id: 'wave_hostile',
        text: 'Long-range sensors detect hostile battlegroup. Enemy combatants confirmed.',
        priority: VoicePriority.TACTICAL,
        category: 'threat',
        cooldownKey: `wave_${waveLevel}`,
        cooldownSeconds: 15,
      });
    }
  }

  public onTargetDestroyed() {
    this.announce({
      id: 'target_destroyed',
      text: 'Target vessel destroyed. Threat neutralized.',
      priority: VoicePriority.TACTICAL,
      category: 'threat',
      cooldownKey: 'target_destroyed',
      cooldownSeconds: 3,
    });
  }

  public onSectorClear() {
    this.announce({
      id: 'sector_clear',
      text: 'Sector clear. All hostile signatures eliminated from tactical grid.',
      priority: VoicePriority.TACTICAL,
      category: 'threat',
      cooldownKey: 'sector_clear',
      cooldownSeconds: 8,
    });
  }

  public onHostileClassified(_shipName: string, isElite: boolean) {
    if (isElite) {
      this.announce({
        id: 'classify_elite',
        text: 'Target locked. Reinforced armor and high-yield armaments confirmed.',
        priority: VoicePriority.TACTICAL,
        category: 'threat',
        cooldownKey: 'classify_target',
        cooldownSeconds: 12,
      });
    }
  }

  // =========================================================================
  // OPERATIONAL ROLE 4: POWER MANAGEMENT & CONDITION FEEDBACK
  // =========================================================================

  public onAlertStatusShift(newAlert: 'green' | 'yellow' | 'red') {
    this.currentAlertLevel = newAlert;

    if (newAlert === 'red') {
      this.announce({
        id: 'condition_red',
        text: 'Red Alert',
        priority: VoicePriority.SYSTEM,
        category: 'power',
        cooldownKey: 'alert_red',
        cooldownSeconds: 8,
      });
    } else if (newAlert === 'yellow') {
      this.announce({
        id: 'condition_yellow',
        text: 'Yellow Alert',
        priority: VoicePriority.SYSTEM,
        category: 'power',
        cooldownKey: 'alert_yellow',
        cooldownSeconds: 8,
      });
    } else {
      this.announce({
        id: 'condition_green',
        text: 'Condition Green.',
        priority: VoicePriority.SYSTEM,
        category: 'power',
        cooldownKey: 'alert_green',
        cooldownSeconds: 8,
      });
    }
  }

  public onShieldsToggled(raised: boolean) {
    this.announce({
      id: raised ? 'shields_raised' : 'shields_lowered',
      text: raised ? 'Deflector shields raised.' : 'Deflector shields lowered.',
      priority: VoicePriority.SYSTEM,
      category: 'power',
      cooldownKey: 'shields_toggle',
      cooldownSeconds: 3,
    });
  }

  public onEvasiveBoostTriggered() {
    this.announce({
      id: 'boost_engaged',
      text: 'EPS power rerouted to emergency thruster overdrive.',
      priority: VoicePriority.SYSTEM,
      category: 'power',
      cooldownKey: 'eps_boost',
      cooldownSeconds: 12,
    });
  }
}

export const computerVoice = new ShipComputerVoiceSystem();
