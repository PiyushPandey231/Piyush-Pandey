import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Square,
  Sliders,
  BookmarkPlus,
  Trash2,
  CloudRain,
  Waves as WavesIcon,
  Flame,
  Wind as WindIcon,
  Radio,
  Music,
  Coffee,
  Clock as ClockIcon,
} from 'lucide-react';
import { SoundChannel, SoundPreset } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  channels: SoundChannel[];
  presets: SoundPreset[];
  isPlaying: boolean;
  masterVolume: number;
  isMuted: boolean;
  selectedPresetId: string | null;
  onTogglePlay: () => void;
  onMasterVolumeChange: (vol: number) => void;
  onToggleMasterMute: () => void;
  onChannelVolumeChange: (id: string, vol: number) => void;
  onChannelPanChange: (id: string, pan: number) => void;
  onChannelMuteToggle: (id: string) => void;
  onSelectPreset: (preset: SoundPreset) => void;
  onSaveCustomPreset: (name: string, description: string) => void;
  onDeleteCustomPreset: (id: string) => void;
}

export const AudioMixer: React.FC<Props> = ({
  channels,
  presets,
  isPlaying,
  masterVolume,
  isMuted,
  selectedPresetId,
  onTogglePlay,
  onMasterVolumeChange,
  onToggleMasterMute,
  onChannelVolumeChange,
  onChannelPanChange,
  onChannelMuteToggle,
  onSelectPreset,
  onSaveCustomPreset,
  onDeleteCustomPreset,
}) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [binauralWave, setBinauralWave] = useState<'alpha' | 'theta' | 'gamma' | 'delta'>('alpha');

  const getChannelIcon = (id: string) => {
    switch (id) {
      case 'rain':
        return <CloudRain className="w-4 h-4 text-amber-400" />;
      case 'waves':
        return <WavesIcon className="w-4 h-4 text-blue-400" />;
      case 'campfire':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'wind':
        return <WindIcon className="w-4 h-4 text-teal-400" />;
      case 'binaural':
        return <Radio className="w-4 h-4 text-amber-300" />;
      case 'pad':
        return <Music className="w-4 h-4 text-indigo-400" />;
      case 'cafe':
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case 'clock':
        return <ClockIcon className="w-4 h-4 text-stone-400" />;
      default:
        return <Sliders className="w-4 h-4 text-neutral-400" />;
    }
  };

  const handleBinauralDeltaChange = (type: 'delta' | 'theta' | 'alpha' | 'gamma') => {
    setBinauralWave(type);
    const deltas = { delta: 2.5, theta: 6.0, alpha: 10.0, gamma: 40.0 };
    soundEngine.setBinauralBeatDelta(deltas[type]);
  };

  const activeChannelCount = channels.filter((c) => c.volume > 0 && !c.muted).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Mixer Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
        <div className="flex items-center gap-4">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              isPlaying
                ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-md shadow-amber-500/20'
                : 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Pause Ambient Sound</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Ambient Sound</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
            <span>{activeChannelCount} active {activeChannelCount === 1 ? 'sound' : 'sounds'}</span>
            <span aria-hidden="true">·</span>
            <span>Synthesized 44.1kHz</span>
          </div>
        </div>

        {/* Master Volume Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMasterMute}
            aria-label={isMuted ? 'Unmute master' : 'Mute master'}
            className="p-2 text-neutral-400 hover:text-neutral-100 rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {isMuted || masterVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              aria-label="Master volume"
              className="w-24 sm:w-32 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-xs font-mono tabular-nums text-neutral-400 w-8">
              {Math.round((isMuted ? 0 : masterVolume) * 100)}%
            </span>
          </div>

          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700/60 rounded-lg transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Save Mix</span>
          </button>
        </div>
      </div>

      {/* Preset Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-400 tracking-wider">SOUNDSCAPE PRESETS</span>
          <span className="text-xs text-neutral-500">1-click acoustic environments</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {presets.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <div key={preset.id} className="relative group shrink-0">
                <button
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg transition-all text-left flex flex-col gap-0.5 border ${
                    isSelected
                      ? 'bg-neutral-800 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-neutral-900/60 hover:bg-neutral-850 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <span className="font-semibold whitespace-nowrap">{preset.name}</span>
                  <span className="text-[11px] text-neutral-400 max-w-[140px] truncate">
                    {preset.description}
                  </span>
                </button>
                {preset.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPreset(preset.id);
                    }}
                    title="Delete custom preset"
                    className="absolute -top-1.5 -right-1.5 p-1 bg-neutral-850 border border-neutral-700 rounded-full text-neutral-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sound Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {channels.map((channel) => {
          const isActive = channel.volume > 0 && !channel.muted;
          return (
            <div
              key={channel.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isActive
                  ? 'bg-neutral-900/90 border-neutral-700 shadow-sm'
                  : 'bg-neutral-900/40 border-neutral-850 opacity-80 hover:opacity-100'
              }`}
            >
              {/* Channel Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded-lg bg-neutral-800/80 shrink-0">
                    {getChannelIcon(channel.id)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-neutral-200 truncate">{channel.name}</h4>
                    <div className="text-[10px] text-neutral-400 truncate">{channel.description}</div>
                  </div>
                </div>

                <button
                  onClick={() => onChannelMuteToggle(channel.id)}
                  title={channel.muted ? 'Unmute track' : 'Mute track'}
                  className={`p-1.5 rounded-md text-xs transition-colors shrink-0 ${
                    channel.muted
                      ? 'text-rose-400 bg-rose-500/10'
                      : isActive
                      ? 'text-amber-400 hover:bg-neutral-800'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                >
                  {channel.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-neutral-400">Volume</span>
                  <span className="font-mono tabular-nums text-neutral-300">
                    {channel.muted ? '0' : channel.volume}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={channel.volume}
                  onChange={(e) => onChannelVolumeChange(channel.id, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Special Controls: Binaural Waves */}
              {channel.id === 'binaural' && (
                <div className="mt-3 pt-2.5 border-t border-neutral-800/80">
                  <div className="flex items-center justify-between mb-1.5 text-[10px] text-neutral-400">
                    <span>Brainwave Band</span>
                    <span className="text-amber-400 font-mono">
                      {binauralWave === 'alpha' && '10Hz Alpha (Focus)'}
                      {binauralWave === 'theta' && '6Hz Theta (Insight)'}
                      {binauralWave === 'gamma' && '40Hz Gamma (Logic)'}
                      {binauralWave === 'delta' && '2.5Hz Delta (Rest)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 p-0.5 bg-neutral-950/70 rounded-md border border-neutral-800">
                    {(['alpha', 'theta', 'gamma', 'delta'] as const).map((band) => (
                      <button
                        key={band}
                        onClick={() => handleBinauralDeltaChange(band)}
                        className={`py-1 text-[10px] font-medium rounded transition-colors uppercase ${
                          binauralWave === band
                            ? 'bg-neutral-800 text-amber-300 shadow-xs'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        {band}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stereo Pan Slider */}
              {channel.id !== 'binaural' && (
                <div className="mt-2.5 pt-2 border-t border-neutral-800/50 flex items-center justify-between text-[10px] text-neutral-400">
                  <span>Pan</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px]">L</span>
                    <input
                      type="range"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={channel.pan}
                      onChange={(e) => onChannelPanChange(channel.id, parseFloat(e.target.value))}
                      className="w-14 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-neutral-400"
                    />
                    <span className="text-[9px]">R</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save Custom Mix Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">
            <h3 className="text-base font-semibold text-neutral-100 mb-1">Save Current Acoustic Mix</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Save your current volume and spatial configuration as a reusable preset.
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">Preset Name</label>
                <input
                  type="text"
                  placeholder="e.g. Midnight Deep Sprint"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-200 placeholder:text-neutral-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setNewPresetName('');
                }}
                className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200 bg-neutral-800 rounded-lg hover:bg-neutral-750 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!newPresetName.trim()}
                onClick={() => {
                  if (newPresetName.trim()) {
                    onSaveCustomPreset(newPresetName.trim(), 'Custom user environment');
                    setShowSaveModal(false);
                    setNewPresetName('');
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
              >
                Save Preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
