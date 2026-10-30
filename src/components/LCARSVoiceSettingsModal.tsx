import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Play,
  Square,
  Upload,
  FileAudio,
  Trash2,
  FolderOpen,
  RefreshCw,
  Search,
  CheckCircle2,
  Disc3,
  Sliders,
} from 'lucide-react';
import { computerVoice } from '../audio/computerVoice';
import { customAudioBank } from '../audio/customAudioBank';
import { soundEffects } from '../audio/soundEffects';
import { STARFLEET_VOICE_PHRASES, VoicePhraseDefinition } from '../audio/voicePhrases';

interface LCARSVoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LCARSVoiceSettingsModal: React.FC<LCARSVoiceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(computerVoice.isVoiceEnabled());
  const [isSpeaking, setIsSpeaking] = useState<boolean>(computerVoice.isSpeakingNow());
  const [activePhrasePlaying, setActivePhrasePlaying] = useState<string | null>(null);
  const [loadedCount, setLoadedCount] = useState<number>(0);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [audioFeedback, setAudioFeedback] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const batchFileInputRef = useRef<HTMLInputElement>(null);
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const targetPhraseNumberRef = useRef<number | null>(null);

  // Sync state on open and listen to changes
  useEffect(() => {
    if (!isOpen) return;

    setIsVoiceEnabled(computerVoice.isVoiceEnabled());
    setIsSpeaking(computerVoice.isSpeakingNow());
    setLoadedCount(customAudioBank.getLoadedClipsCount());

    const unsubVoice = computerVoice.subscribe((speaking) => {
      setIsSpeaking(speaking);
      if (!speaking) {
        setActivePhrasePlaying(null);
      }
    });

    const unsubBank = customAudioBank.subscribe(() => {
      setLoadedCount(customAudioBank.getLoadedClipsCount());
      setActivePhrasePlaying(customAudioBank.getCurrentActiveId());
    });

    // Auto-probe public/audio directory when opening modal
    customAudioBank.probePublicAudioFiles().then(() => {
      setLoadedCount(customAudioBank.getLoadedClipsCount());
    });

    return () => {
      unsubVoice();
      unsubBank();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleVoiceEnabled = () => {
    const next = !isVoiceEnabled;
    setIsVoiceEnabled(next);
    computerVoice.setVoiceEnabled(next);
  };

  const handleTestVoice = () => {
    soundEffects.setMuted(false);
    const ctx = soundEffects.getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    computerVoice.testVoice();
    setActivePhrasePlaying('phrase_1');
  };

  const handleStopSpeech = () => {
    computerVoice.cancelSpeech();
    customAudioBank.stopCurrentClip();
    setActivePhrasePlaying(null);
  };

  const handleTestPhrase = (phrase: VoicePhraseDefinition) => {
    soundEffects.setMuted(false);
    const ctx = soundEffects.getAudioContext();
    if (ctx && ctx.state === 'suspended') ctx.resume();

    const phraseKey = `phrase_${phrase.number}`;

    // If this phrase is currently playing, clicking again stops it
    if (activePhrasePlaying === phraseKey || activePhrasePlaying === phrase.id) {
      handleStopSpeech();
      return;
    }

    // STRICT RULE: "if another voices start playing stop the first one"
    // customAudioBank.playClip automatically stops any playing clip first!
    setActivePhrasePlaying(phraseKey);
    const res = customAudioBank.playClip(phraseKey, () => {
      setActivePhrasePlaying(null);
    });

    if (!res) {
      // Try playing by ID
      const resById = customAudioBank.playClip(phrase.id, () => {
        setActivePhrasePlaying(null);
      });
      if (!resById) {
        // Fallback: announce text through computerVoice (shows banner)
        computerVoice.announce({
          id: phrase.id,
          text: phrase.text,
          priority: 4,
          category: phrase.category as 'tactical' | 'astrogation' | 'threat' | 'power',
        });
      }
    }
  };

  // Batch upload or dropped files
  const processFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsLoadingAudio(true);
    setAudioFeedback(null);

    try {
      soundEffects.setMuted(false);
      const ctx = soundEffects.getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        await ctx.resume();
      }

      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const num = customAudioBank.parseNumberFromFilename(file.name);
        if (num && num >= 1 && num <= STARFLEET_VOICE_PHRASES.length) {
          await customAudioBank.saveClipByNumber(num, file, file.name);
          successCount++;
        } else if (files.length === 1 && targetPhraseNumberRef.current) {
          await customAudioBank.saveClipByNumber(targetPhraseNumberRef.current, file, file.name);
          successCount++;
        } else if (
          file.name.toLowerCase().includes('primary') ||
          file.name.toLowerCase().includes('enterprise')
        ) {
          await customAudioBank.saveAudioClip('primary', file.name, file);
          await customAudioBank.saveClipByNumber(1, file, file.name);
          successCount++;
        }
      }

      if (successCount > 0) {
        setAudioFeedback(`Successfully loaded ${successCount} Starfleet MP3 audio clip(s)!`);
        // Audition first clip
        customAudioBank.playClip('phrase_1');
      } else {
        setAudioFeedback(
          `Could not detect phrase numbers. Name your files like 1.mp3, 2.mp3, up to ${STARFLEET_VOICE_PHRASES.length}.mp3.`
        );
      }
    } catch (err) {
      console.error('Batch audio upload error:', err);
      setAudioFeedback('Error processing audio files. Ensure files are valid .mp3 or .wav format.');
    } finally {
      setIsLoadingAudio(false);
      targetPhraseNumberRef.current = null;
      if (batchFileInputRef.current) batchFileInputRef.current.value = '';
      if (singleFileInputRef.current) singleFileInputRef.current.value = '';
    }
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleTriggerSingleUpload = (num: number) => {
    targetPhraseNumberRef.current = num;
    singleFileInputRef.current?.click();
  };

  const handleRemoveSingleClip = async (num: number) => {
    await customAudioBank.removeAudioClip(`phrase_${num}`);
    const phrase = STARFLEET_VOICE_PHRASES.find((p) => p.number === num);
    if (phrase) {
      await customAudioBank.removeAudioClip(phrase.id);
    }
    if (num === 1) {
      await customAudioBank.removeAudioClip('primary');
      await customAudioBank.removeAudioClip('test_voice');
    }
    setAudioFeedback(`Removed MP3 for phrase #${num}.`);
  };

  const handleScanPublicFolder = async () => {
    setIsLoadingAudio(true);
    setAudioFeedback('Scanning /public/audio/ directory...');
    try {
      soundEffects.setMuted(false);
      const ctx = soundEffects.getAudioContext();
      if (ctx && ctx.state === 'suspended') await ctx.resume();

      await customAudioBank.probePublicAudioFiles(true);
      const count = customAudioBank.getLoadedClipsCount();
      setAudioFeedback(
        count > 0
          ? `Scan complete: Found and loaded ${count} MP3 files from /public/audio/!`
          : `Scan complete: No numbered MP3 files detected in /public/audio/.`
      );
    } catch {
      setAudioFeedback('Failed scanning folder. You can upload files directly using the button above.');
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const filteredPhrases = STARFLEET_VOICE_PHRASES.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch =
      searchTerm === '' ||
      p.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.altFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.number.toString().includes(searchTerm);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-950 border border-sky-500/50 rounded-2xl shadow-2xl shadow-sky-950/70 overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Hidden File Inputs */}
        <input
          ref={batchFileInputRef}
          type="file"
          multiple
          accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
          onChange={handleBatchFileChange}
          className="hidden"
          id="batch-mp3-upload"
        />
        <input
          ref={singleFileInputRef}
          type="file"
          accept="audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/*"
          onChange={handleSingleFileChange}
          className="hidden"
          id="single-mp3-upload"
        />

        {/* LCARS Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sky-500/30 bg-slate-900/95">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-8 bg-sky-400 rounded-sm shadow-sm shadow-sky-400/50" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-trek text-xs tracking-widest text-sky-400 uppercase font-bold">
                  LCARS-7729 // AUDIO REPOSITORY
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 font-bold">
                  {loadedCount} / {STARFLEET_VOICE_PHRASES.length} MP3 CLIPS READY
                </span>
              </div>
              <h2 className="font-trek text-lg tracking-wider text-slate-100 font-bold uppercase">
                USS ENTERPRISE NCC-1701 SOUNDBANK
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close LCARS Console"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 bg-slate-900/50 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleVoiceEnabled}
              className={`px-3 py-1.5 rounded-lg font-trek uppercase tracking-wider font-bold text-xs flex items-center gap-2 transition-all cursor-pointer border ${
                isVoiceEnabled
                  ? 'bg-sky-500/20 border-sky-400/40 text-sky-300 hover:bg-sky-500/30'
                  : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
              }`}
            >
              {isVoiceEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Voice Telemetry Active</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Voice Telemetry Muted</span>
                </>
              )}
            </button>

            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Single-Voice Channel // Zero Overlap
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Test Voice (Phrase 1) */}
            <button
              onClick={handleTestVoice}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 font-trek uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Test Voice (Plays Phrase 1 / 01.mp3)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test Voice</span>
            </button>

            {/* Stop Voice */}
            <button
              onClick={handleStopSpeech}
              disabled={!isSpeaking && !activePhrasePlaying}
              className={`px-3 py-1.5 rounded-lg border font-trek uppercase tracking-wider text-xs font-bold flex items-center gap-1.5 transition-colors ${
                isSpeaking || activePhrasePlaying
                  ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/40 text-red-300 cursor-pointer animate-pulse'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-500 cursor-not-allowed'
              }`}
              title="Stop any playing voice immediately"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Audio</span>
            </button>
          </div>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Audio Feedback Alert */}
          {audioFeedback && (
            <div className="p-3 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-200 text-xs font-mono flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                <span>{audioFeedback}</span>
              </div>
              <button
                onClick={() => setAudioFeedback(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Actions & Drag-Drop Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`p-4 rounded-xl border transition-all text-xs ${
              dragOver
                ? 'bg-sky-950/40 border-sky-400 ring-2 ring-sky-400/50'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-trek uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
                  <Disc3 className="w-4 h-4 text-sky-400 animate-spin" style={{ animationDuration: '8s' }} />
                  <span>Starfleet Offline MP3 Repository</span>
                </div>
                <div className="text-slate-400 font-mono text-[11px]">
                  Files in <code className="text-sky-300 font-bold">/public/audio/</code> (1.mp3 to 29.mp3) are loaded automatically.
                  When any voice begins, preceding voice audio stops instantly.
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleScanPublicFolder}
                  disabled={isLoadingAudio}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-trek uppercase tracking-wider text-xs border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rescan public/audio directory for newly added MP3 files"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudio ? 'animate-spin' : ''}`} />
                  <span>Re-Scan Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => batchFileInputRef.current?.click()}
                  disabled={isLoadingAudio}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-trek uppercase tracking-wider text-xs border border-sky-400/40 flex items-center gap-1.5 transition-colors cursor-pointer font-bold"
                  title="Upload MP3 audio files directly into browser storage"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Upload MP3s</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search phrases by number, title, or dialogue..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60 font-mono"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Category Badges */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-[10px] font-mono">
              {['all', 'tactical', 'threat', 'astrogation', 'power', 'general'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md uppercase font-bold transition-all cursor-pointer whitespace-nowrap border ${
                    selectedCategory === cat
                      ? 'bg-sky-500/30 text-sky-200 border-sky-400/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Phrases Catalog List */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {filteredPhrases.map((phrase) => {
              const phraseKey = `phrase_${phrase.number}`;
              const hasCustom =
                customAudioBank.hasCustomClip(phraseKey) ||
                customAudioBank.hasCustomClip(phrase.id);

              const isPlayingThis =
                activePhrasePlaying === phraseKey ||
                activePhrasePlaying === phrase.id ||
                (isSpeaking && computerVoice.getCurrentText() === phrase.text);

              return (
                <div
                  key={phrase.number}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                    isPlayingThis
                      ? 'bg-amber-950/30 border-amber-400/60 ring-1 ring-amber-400/40'
                      : hasCustom
                      ? 'bg-emerald-950/20 border-emerald-500/40 hover:bg-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {/* Phrase Number & Title */}
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 border border-sky-400/40 text-sky-300 font-mono text-[10px] font-bold shrink-0">
                        #{phrase.altFilename}
                      </span>
                      <span className="font-trek uppercase tracking-wide text-[11px] font-bold text-sky-400 truncate">
                        {phrase.title}
                      </span>
                      {hasCustom ? (
                        <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-mono border border-emerald-500/30 font-bold shrink-0">
                          🟢 MP3 Ready
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 text-[9px] font-mono shrink-0">
                          ⚪ Missing
                        </span>
                      )}
                      {isPlayingThis && (
                        <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-mono border border-amber-500/40 font-bold shrink-0 animate-pulse">
                          ▶ Playing
                        </span>
                      )}
                    </div>

                    {/* Spoken Text */}
                    <div className="text-slate-200 text-[11px] font-mono leading-relaxed pl-0.5">
                      "{phrase.text}"
                    </div>

                    {/* Trigger description */}
                    <div className="text-slate-400 text-[10px] font-mono pl-0.5 opacity-80">
                      Trigger: {phrase.description}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Audition / Stop Button */}
                    <button
                      type="button"
                      onClick={() => handleTestPhrase(phrase)}
                      className={`px-2.5 py-1.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                        isPlayingThis
                          ? 'bg-amber-500/30 hover:bg-amber-500/50 text-amber-200 border-amber-400/50 animate-pulse'
                          : hasCustom
                          ? 'bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-200 border-emerald-400/40'
                          : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-400/40'
                      }`}
                      title={isPlayingThis ? 'Stop playback' : 'Audition audio clip (stops any playing voice first)'}
                    >
                      {isPlayingThis ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Audition</span>
                        </>
                      )}
                    </button>

                    {/* Replace / Upload Single File Button */}
                    <button
                      type="button"
                      onClick={() => handleTriggerSingleUpload(phrase.number)}
                      className="px-2 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Upload MP3 for #${phrase.altFilename}`}
                    >
                      <Upload className="w-2.5 h-2.5" />
                      <span>{hasCustom ? 'Replace' : 'Upload'}</span>
                    </button>

                    {/* Remove custom clip if exists */}
                    {hasCustom && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSingleClip(phrase.number)}
                        className="p-1.5 rounded-md bg-red-500/20 hover:bg-red-500/40 text-red-300 border border-red-500/30 transition-colors cursor-pointer"
                        title="Remove MP3 clip"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-slate-900/90 text-xs">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Starfleet Bridge Telemetry Engine // USS Enterprise NCC-1701</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-trek uppercase tracking-wider font-bold text-xs shadow-md shadow-sky-500/20 transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
