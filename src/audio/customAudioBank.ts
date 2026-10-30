// LCARS Custom MP3 & Offline Audio Bank
// Stores pre-recorded Starfleet computer audio clips locally in IndexedDB, Web Audio memory,
// and automatically loads dropped MP3 files from /public/audio/ (1.mp3 to 29.mp3)
// 100% offline, zero latency, Web Audio API playback
// STRICT SINGLE-VOICE ENFORCEMENT: If another voice starts playing, the first one is immediately stopped!

import { soundEffects } from './soundEffects';
import { STARFLEET_VOICE_PHRASES, VoicePhraseDefinition } from './voicePhrases';

const DB_NAME = 'lcars_audio_bank_v2';
const STORE_NAME = 'audio_clips';

export interface StoredClipRecord {
  id: string;             // e.g. "phrase_1", "condition_red", "primary"
  name: string;           // filename
  mimeType: string;
  arrayBuffer: ArrayBuffer;
  duration: number;
  updatedAt: number;
}

export interface CachedAudioClip {
  buffer: AudioBuffer;
  name: string;
  duration: number;
}

type AudioBankListener = () => void;

class CustomAudioBank {
  private db: IDBDatabase | null = null;
  private cachedBuffers: Map<string, CachedAudioClip> = new Map();
  private listeners: Set<AudioBankListener> = new Set();
  private isLoaded: boolean = false;
  private isProbing: boolean = false;

  // Single active playback tracker to guarantee NO overlapping voices:
  // "if another voices start playing stop the first one"
  private currentActiveSource: AudioBufferSourceNode | null = null;
  private currentActiveGain: GainNode | null = null;
  private currentActiveOnEnd: (() => void) | null = null;
  private currentActiveId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadAllFromDB().then(() => {
        this.probePublicAudioFiles();
      });
    }
  }

  public subscribe(listener: AudioBankListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch {}
    });
  }

  private async initDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Load all saved clips from IndexedDB into memory
  public async loadAllFromDB(): Promise<void> {
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      const records: StoredClipRecord[] = await new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const ctx = soundEffects.getAudioContext();
      if (!ctx) return;

      for (const rec of records) {
        try {
          const copy = rec.arrayBuffer.slice(0);
          const decoded = await ctx.decodeAudioData(copy);
          this.cachedBuffers.set(rec.id, {
            buffer: decoded,
            name: rec.name,
            duration: decoded.duration,
          });
        } catch (err) {
          console.warn(`[Audio Bank] Could not decode cached clip ${rec.id}:`, err);
        }
      }
      this.isLoaded = true;
      this.notify();
    } catch {
      // IndexedDB fallback
    }
  }

  // Proactively probe /public/audio/ (served at /audio/) for numbered MP3 files (1.mp3 to 29.mp3)
  public async probePublicAudioFiles(force: boolean = false): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isProbing) return;
    this.isProbing = true;

    try {
      const ctx = soundEffects.getAudioContext();
      if (!ctx) return;

      // Check all registered phrases (1 to 29)
      for (const phrase of STARFLEET_VOICE_PHRASES) {
        const numStr2 = phrase.filename; // e.g. "01.mp3"
        const numStr1 = phrase.altFilename; // e.g. "1.mp3"
        const phraseKey = `phrase_${phrase.number}`;

        // Skip if already in memory and not forced
        if (!force && this.cachedBuffers.has(phraseKey) && this.cachedBuffers.has(phrase.id)) {
          continue;
        }

        // Try 1-digit first (since user created 1.mp3, 2.mp3...), then 2-digit format
        const urlsToTry = Array.from(
          new Set([
            `/audio/${numStr1}`,
            `/audio/${phrase.number}.mp3`,
            `/audio/${numStr2}`,
            `/audio/${phrase.number < 10 ? '0' + phrase.number : phrase.number}.mp3`,
          ])
        );

        for (const url of urlsToTry) {
          try {
            const res = await fetch(url, { method: 'GET' });
            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              // Make sure it didn't return an HTML index page (404 fallback in SPA)
              if (contentType.includes('text/html')) {
                continue;
              }
              const arrayBuf = await res.arrayBuffer();
              if (arrayBuf.byteLength > 1024) {
                const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
                this.cachedBuffers.set(phraseKey, {
                  buffer: decoded,
                  name: phrase.filename,
                  duration: decoded.duration,
                });
                this.cachedBuffers.set(phrase.id, {
                  buffer: decoded,
                  name: phrase.filename,
                  duration: decoded.duration,
                });
                if (phrase.number === 1) {
                  this.cachedBuffers.set('primary', {
                    buffer: decoded,
                    name: phrase.filename,
                    duration: decoded.duration,
                  });
                  this.cachedBuffers.set('test_voice', {
                    buffer: decoded,
                    name: phrase.filename,
                    duration: decoded.duration,
                  });
                }
                break; // Found file for this phrase
              }
            }
          } catch {
            // File not present in folder yet
          }
        }
      }
      this.notify();
    } finally {
      this.isProbing = false;
    }
  }

  // Store a user-uploaded MP3/WAV file
  public async saveAudioClip(id: string, name: string, fileOrBlob: Blob): Promise<AudioBuffer> {
    const arrayBuffer = await fileOrBlob.arrayBuffer();
    const ctx = soundEffects.getAudioContext();
    if (!ctx) {
      throw new Error('Web Audio Context unavailable');
    }

    // Decode audio data for immediate memory cache
    const copyForDecode = arrayBuffer.slice(0);
    const decoded = await ctx.decodeAudioData(copyForDecode);

    // Save into IndexedDB for offline persistence
    const db = await this.initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const record: StoredClipRecord = {
      id,
      name,
      mimeType: fileOrBlob.type || 'audio/mp3',
      arrayBuffer,
      duration: decoded.duration,
      updatedAt: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const putReq = store.put(record);
      putReq.onsuccess = () => resolve();
      putReq.onerror = () => reject(putReq.error);
    });

    this.cachedBuffers.set(id, {
      buffer: decoded,
      name,
      duration: decoded.duration,
    });

    // Also link by phrase number or phrase ID if ID is numeric or matched
    const num = parseInt(id.replace('phrase_', ''), 10);
    if (!isNaN(num)) {
      const phrase = STARFLEET_VOICE_PHRASES.find((p) => p.number === num);
      if (phrase) {
        this.cachedBuffers.set(phrase.id, {
          buffer: decoded,
          name,
          duration: decoded.duration,
        });
      }
      if (num === 1) {
        this.cachedBuffers.set('primary', {
          buffer: decoded,
          name,
          duration: decoded.duration,
        });
        this.cachedBuffers.set('test_voice', {
          buffer: decoded,
          name,
          duration: decoded.duration,
        });
      }
    }

    this.notify();
    return decoded;
  }

  // Save by phrase number (1 to 29)
  public async saveClipByNumber(
    phraseNumber: number,
    fileOrBlob: Blob,
    filename: string
  ): Promise<AudioBuffer> {
    const phraseKey = `phrase_${phraseNumber}`;
    const decoded = await this.saveAudioClip(phraseKey, filename, fileOrBlob);

    const phrase = STARFLEET_VOICE_PHRASES.find((p) => p.number === phraseNumber);
    if (phrase) {
      this.cachedBuffers.set(phrase.id, {
        buffer: decoded,
        name: filename,
        duration: decoded.duration,
      });
    }
    if (phraseNumber === 1) {
      this.cachedBuffers.set('primary', {
        buffer: decoded,
        name: filename,
        duration: decoded.duration,
      });
      this.cachedBuffers.set('test_voice', {
        buffer: decoded,
        name: filename,
        duration: decoded.duration,
      });
    }
    this.notify();
    return decoded;
  }

  // Parse filename like "01.mp3", "1.mp3", "02_condition_red.mp3" to extract number
  public parseNumberFromFilename(fileName: string): number | null {
    const match = fileName.match(/^0?(\d+)/);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (num >= 1 && num <= 50) return num;
    }
    return null;
  }

  // Check if a custom MP3 is loaded for a given key, id, or number
  public hasCustomClip(idOrNum: string | number = 'primary'): boolean {
    if (typeof idOrNum === 'number') {
      return this.cachedBuffers.has(`phrase_${idOrNum}`);
    }
    return this.cachedBuffers.has(idOrNum);
  }

  public getCachedClip(
    idOrNum: string | number = 'primary'
  ): { buffer: AudioBuffer; name: string; duration: number } | null {
    if (typeof idOrNum === 'number') {
      return this.cachedBuffers.get(`phrase_${idOrNum}`) || null;
    }
    return this.cachedBuffers.get(idOrNum) || null;
  }

  // Find clip matching announcement ID or spoken text
  public getClipForAnnouncement(
    announcementId?: string,
    spokenText?: string
  ): { buffer: AudioBuffer; name: string; duration: number; id: string } | null {
    if (announcementId) {
      // 1. Direct match on announcementId (e.g. 'condition_red', 'shields_50')
      const clip = this.cachedBuffers.get(announcementId);
      if (clip) return { ...clip, id: announcementId };

      // 2. Test voice match -> Phrase 1
      if (announcementId.startsWith('test_voice')) {
        const testClip =
          this.cachedBuffers.get('phrase_1') ||
          this.cachedBuffers.get('test_voice') ||
          this.cachedBuffers.get('primary');
        if (testClip) return { ...testClip, id: 'phrase_1' };
      }

      // 3. Known tactical event aliases
      if (announcementId === 'shields_dropped') {
        const c =
          this.cachedBuffers.get('phrase_6') || this.cachedBuffers.get('shields_lowered');
        if (c) return { ...c, id: 'phrase_6' };
      }
      if (announcementId.startsWith('classify_')) {
        const c =
          this.cachedBuffers.get('phrase_22') || this.cachedBuffers.get('classify_elite');
        if (c) return { ...c, id: 'phrase_22' };
      }

      // 4. Match against STARFLEET_VOICE_PHRASES by id
      const matchedPhrase = STARFLEET_VOICE_PHRASES.find(
        (p) =>
          p.id === announcementId ||
          announcementId.includes(p.id) ||
          p.id.includes(announcementId)
      );
      if (matchedPhrase) {
        const numClip =
          this.cachedBuffers.get(`phrase_${matchedPhrase.number}`) ||
          this.cachedBuffers.get(matchedPhrase.id);
        if (numClip) return { ...numClip, id: `phrase_${matchedPhrase.number}` };
      }
    }

    // 5. Match by spoken text if provided
    if (spokenText) {
      const cleanSpoken = spokenText.toLowerCase().replace(/[^a-z0-9]/g, '');
      const matchedPhrase = STARFLEET_VOICE_PHRASES.find((p) => {
        const cleanP = p.text.toLowerCase().replace(/[^a-z0-9]/g, '');
        return cleanSpoken.includes(cleanP) || cleanP.includes(cleanSpoken);
      });
      if (matchedPhrase) {
        const numClip =
          this.cachedBuffers.get(`phrase_${matchedPhrase.number}`) ||
          this.cachedBuffers.get(matchedPhrase.id);
        if (numClip) return { ...numClip, id: `phrase_${matchedPhrase.number}` };
      }
    }

    // Fallback: If only primary is loaded and it's test voice
    if (announcementId?.startsWith('test_voice') && this.cachedBuffers.has('primary')) {
      const primaryClip = this.cachedBuffers.get('primary')!;
      return { ...primaryClip, id: 'primary' };
    }

    return null;
  }

  // Total loaded MP3 count
  public getLoadedClipsCount(): number {
    let count = 0;
    for (const phrase of STARFLEET_VOICE_PHRASES) {
      if (
        this.hasCustomClip(`phrase_${phrase.number}`) ||
        this.hasCustomClip(phrase.id)
      ) {
        count++;
      }
    }
    return count;
  }

  // Check which clip is currently playing (if any)
  public getCurrentActiveId(): string | null {
    return this.currentActiveId;
  }

  // Stop currently playing voice clip immediately
  // "solve that if another voices start playing stop the first one"
  public stopCurrentClip(): void {
    const ctx = soundEffects.getAudioContext();
    if (this.currentActiveGain && ctx) {
      try {
        // Instant micro-fade (10ms) to prevent audio clicks
        this.currentActiveGain.gain.setValueAtTime(
          this.currentActiveGain.gain.value,
          ctx.currentTime
        );
        this.currentActiveGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.012);
      } catch {}
    }

    if (this.currentActiveSource) {
      try {
        const src = this.currentActiveSource;
        this.currentActiveSource = null;
        src.onended = null;
        src.stop(ctx ? ctx.currentTime + 0.015 : 0);
        setTimeout(() => {
          try {
            src.disconnect();
          } catch {}
        }, 25);
      } catch {}
    }

    this.currentActiveSource = null;
    this.currentActiveGain = null;
    this.currentActiveId = null;

    if (this.currentActiveOnEnd) {
      const cb = this.currentActiveOnEnd;
      this.currentActiveOnEnd = null;
      try {
        cb();
      } catch {}
    }
  }

  // Remove a custom MP3 clip
  public async removeAudioClip(id: string = 'primary'): Promise<void> {
    this.cachedBuffers.delete(id);

    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const delReq = store.delete(id);
        delReq.onsuccess = () => resolve();
        delReq.onerror = () => reject(delReq.error);
      });
    } catch {}

    this.notify();
  }

  // Remove all custom clips
  public async clearAllClips(): Promise<void> {
    this.stopCurrentClip();
    this.cachedBuffers.clear();
    try {
      const db = await this.initDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      await new Promise<void>((resolve, reject) => {
        const clearReq = store.clear();
        clearReq.onsuccess = () => resolve();
        clearReq.onerror = () => reject(clearReq.error);
      });
    } catch {}
    this.notify();
  }

  // Play a custom MP3 buffer with bridge acoustic mastering
  // STRICT RULE: If another voice is already playing, STOP THE FIRST ONE IMMEDIATELY!
  public playClip(
    id: string = 'primary',
    onEnd?: () => void
  ): { stop: () => void; duration: number } | null {
    // 1. Immediately stop any active voice playing right now!
    this.stopCurrentClip();

    const clip = this.cachedBuffers.get(id);
    if (!clip) return null;

    const ctx = soundEffects.getAudioContext();
    if (!ctx) return null;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    try {
      const source = ctx.createBufferSource();
      source.buffer = clip.buffer;

      // Master output gain with gentle anti-pop envelope
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 0.015);

      source.connect(gain);
      gain.connect(ctx.destination);

      this.currentActiveSource = source;
      this.currentActiveGain = gain;
      this.currentActiveOnEnd = onEnd || null;
      this.currentActiveId = id;

      let ended = false;
      const handleEnd = () => {
        if (ended) return;
        ended = true;
        if (this.currentActiveSource === source) {
          this.currentActiveSource = null;
          this.currentActiveGain = null;
          this.currentActiveOnEnd = null;
          this.currentActiveId = null;
        }
        try {
          source.disconnect();
          gain.disconnect();
        } catch {}
        onEnd?.();
      };

      source.onended = handleEnd;
      source.start(ctx.currentTime);

      return {
        stop: () => {
          this.stopCurrentClip();
        },
        duration: clip.duration,
      };
    } catch (err) {
      console.warn('[Audio Bank] Error playing custom clip:', err);
      return null;
    }
  }

  // Load an MP3 from a remote or local URL (e.g., /audio/1.mp3)
  public async loadFromUrl(id: string, name: string, url: string): Promise<AudioBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch MP3 from ${url}: ${response.statusText}`);
    }
    const blob = await response.blob();
    return this.saveAudioClip(id, name, blob);
  }
}

export const customAudioBank = new CustomAudioBank();
