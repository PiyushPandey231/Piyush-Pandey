import React, { useState, useEffect } from 'react';
import { Minimize2, Play, Pause, Volume2, VolumeX, Flame } from 'lucide-react';
import { TaskItem, SoundPreset, BackdropTheme } from '../types';
import { AmbientVisualizer } from './AmbientVisualizer';

interface Props {
  activeTask: TaskItem | null;
  isPlayingAudio: boolean;
  masterVolume: number;
  isMuted: boolean;
  presets: SoundPreset[];
  selectedPresetId: string | null;
  backdropTheme: BackdropTheme;
  onCloseZen: () => void;
  onTogglePlayAudio: () => void;
  onMasterVolumeChange: (val: number) => void;
  onToggleMasterMute: () => void;
  onSelectPreset: (preset: SoundPreset) => void;
  onThemeChange: (theme: BackdropTheme) => void;
}

export const ZenOverlay: React.FC<Props> = ({
  activeTask,
  isPlayingAudio,
  masterVolume,
  isMuted,
  presets,
  selectedPresetId,
  backdropTheme,
  onCloseZen,
  onTogglePlayAudio,
  onMasterVolumeChange,
  onToggleMasterMute,
  onSelectPreset,
  onThemeChange,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    let interval: number;
    if (isTimerRunning && secondsLeft > 0) {
      interval = window.setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-8 bg-neutral-950/95 backdrop-blur-md select-none">
      {/* Visualizer Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <AmbientVisualizer mode="waves" isActive={isPlayingAudio} />
      </div>

      {/* Top Bar in Zen */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-wider text-neutral-400 uppercase">
            Aura Zen Immersion
          </span>
          <span aria-hidden="true" className="text-neutral-700">·</span>
          <div className="flex items-center gap-1.5 text-xs">
            {(['obsidian', 'nordic', 'zen', 'observatory'] as const).map((t) => (
              <button
                key={t}
                onClick={() => onThemeChange(t)}
                className={`px-2 py-0.5 rounded text-[11px] capitalize transition-colors ${
                  backdropTheme === t ? 'bg-neutral-800 text-amber-300' : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onCloseZen}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-neutral-100 hover:bg-neutral-850 transition-colors"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Exit Zen (Esc)</span>
        </button>
      </div>

      {/* Center Clock & Focus Anchor */}
      <div className="relative z-10 flex flex-col items-center justify-center my-auto text-center">
        {activeTask && (
          <div className="flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="font-medium">{activeTask.title}</span>
            <span className="text-neutral-500 text-xs">({activeTask.category})</span>
          </div>
        )}

        <div className="text-8xl sm:text-9xl font-mono font-bold tracking-tighter text-neutral-100 tabular-nums my-4">
          {timeFormatted}
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button
            onClick={() => setIsTimerRunning(!isTimerRunning)}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-semibold text-sm transition-all ${
              isTimerRunning
                ? 'bg-neutral-900 text-neutral-200 border border-neutral-700 hover:bg-neutral-850'
                : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20'
            }`}
          >
            {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isTimerRunning ? 'Pause Focus' : 'Resume Flow'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Audio Control Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
        {/* Presets */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {presets.slice(0, 4).map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedPresetId === p.id
                  ? 'bg-neutral-800 text-amber-300 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Master Sound & Volume */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlayAudio}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              isPlayingAudio ? 'bg-amber-500 text-neutral-950' : 'bg-neutral-800 text-neutral-300'
            }`}
          >
            {isPlayingAudio ? 'Sound Active' : 'Sound Muted'}
          </button>

          <button
            onClick={onToggleMasterMute}
            className="p-1.5 text-neutral-400 hover:text-neutral-200"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : masterVolume}
            onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>
      </div>
    </div>
  );
};
