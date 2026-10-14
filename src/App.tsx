/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Maximize2,
  Sliders,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Sparkles,
  Command,
  LayoutGrid,
  Headphones,
  CheckSquare,
  BarChart2,
  SlidersHorizontal,
} from 'lucide-react';
import {
  SoundChannel,
  SoundPreset,
  TaskItem,
  FocusSessionLog,
  VisualizerMode,
  BackdropTheme,
  TimerMode,
} from './types';
import { INITIAL_CHANNELS, DEFAULT_PRESETS } from './audio/defaultAudioData';
import { soundEngine } from './audio/soundEngine';
import { PomodoroTimer } from './components/PomodoroTimer';
import { AudioMixer } from './components/AudioMixer';
import { TaskQueue } from './components/TaskQueue';
import { Scratchpad } from './components/Scratchpad';
import { FocusAnalytics } from './components/FocusAnalytics';
import { AmbientVisualizer } from './components/AmbientVisualizer';
import { AtmosphereBackground } from './components/AtmosphereBackground';
import { ZenOverlay } from './components/ZenOverlay';
import { ShortcutsModal } from './components/ShortcutsModal';

export default function App() {
  // Navigation active tab
  const [activeTab, setActiveTab] = useState<'workstation' | 'soundscape' | 'queue' | 'insights'>('workstation');

  // Audio Channels State
  const [channels, setChannels] = useState<SoundChannel[]>(() => {
    const saved = localStorage.getItem('aura_channels');
    return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  });

  // Presets State
  const [presets, setPresets] = useState<SoundPreset[]>(() => {
    const saved = localStorage.getItem('aura_presets');
    return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
  });

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>('preset_deep_code');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [isMasterMuted, setIsMasterMuted] = useState<boolean>(false);

  // Visualizer and Backdrop Theme State
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('waves');
  const [backdropTheme, setBackdropTheme] = useState<BackdropTheme>('nordic');
  const [dimLevel, setDimLevel] = useState<number>(40);

  // Tasks State
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('aura_tasks');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'task_1',
            title: 'Design resilient distributed architecture',
            category: 'Architecture',
            estimatedPomodoros: 4,
            completedPomodoros: 2,
            completed: false,
            createdAt: Date.now() - 3600000,
          },
          {
            id: 'task_2',
            title: 'Draft systems engineering technical specification',
            category: 'Deep Writing',
            estimatedPomodoros: 3,
            completedPomodoros: 1,
            completed: false,
            createdAt: Date.now() - 7200000,
          },
          {
            id: 'task_3',
            title: 'Audit core memory allocation benchmarks',
            category: 'Engineering',
            estimatedPomodoros: 2,
            completedPomodoros: 2,
            completed: true,
            createdAt: Date.now() - 86400000,
          },
        ];
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>('task_1');

  // Logs State
  const [logs, setLogs] = useState<FocusSessionLog[]>(() => {
    const saved = localStorage.getItem('aura_session_logs');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'log_0',
            timestamp: Date.now() - 1000 * 60 * 45,
            durationMinutes: 25,
            taskId: 'task_1',
            taskTitle: 'Design resilient distributed architecture',
            category: 'Architecture',
            mode: 'focus' as TimerMode,
          },
          {
            id: 'log_1',
            timestamp: Date.now() - 1000 * 60 * 110,
            durationMinutes: 50,
            taskId: 'task_2',
            taskTitle: 'Draft systems engineering technical specification',
            category: 'Deep Writing',
            mode: 'focus' as TimerMode,
          },
        ];
  });

  // Modal / Overlays
  const [isZenOpen, setIsZenOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('aura_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('aura_presets', JSON.stringify(presets));
  }, [presets]);

  useEffect(() => {
    localStorage.setItem('aura_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('aura_session_logs', JSON.stringify(logs));
  }, [logs]);

  // Audio Handlers
  const handleTogglePlayAudio = useCallback(() => {
    if (!isPlayingAudio) {
      soundEngine.startAllChannels(channels);
      setIsPlayingAudio(true);
    } else {
      soundEngine.stopAllChannels();
      setIsPlayingAudio(false);
    }
  }, [isPlayingAudio, channels]);

  const handleMasterVolumeChange = useCallback((vol: number) => {
    setMasterVolume(vol);
    soundEngine.setMasterVolume(vol);
  }, []);

  const handleToggleMasterMute = useCallback(() => {
    setIsMasterMuted((prev) => {
      const next = !prev;
      soundEngine.setMasterMute(next);
      return next;
    });
  }, []);

  const handleChannelVolumeChange = (id: string, vol: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, volume: vol } : c))
    );
    soundEngine.setChannelVolume(id, vol);
    if (!isPlayingAudio && vol > 0) {
      // Auto-start audio if user tweaks a slider
      soundEngine.startAllChannels(
        channels.map((c) => (c.id === id ? { ...c, volume: vol } : c))
      );
      setIsPlayingAudio(true);
    }
  };

  const handleChannelPanChange = (id: string, pan: number) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pan } : c))
    );
    soundEngine.setChannelPan(id, pan);
  };

  const handleChannelMuteToggle = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextMuted = !c.muted;
          soundEngine.setChannelVolume(id, nextMuted ? 0 : c.volume);
          return { ...c, muted: nextMuted };
        }
        return c;
      })
    );
  };

  const handleSelectPreset = (preset: SoundPreset) => {
    setSelectedPresetId(preset.id);
    const updated = channels.map((c) => {
      const vol = preset.channels[c.id] ?? 0;
      soundEngine.setChannelVolume(c.id, vol);
      return { ...c, volume: vol, muted: false };
    });
    setChannels(updated);

    if (!isPlayingAudio) {
      soundEngine.startAllChannels(updated);
      setIsPlayingAudio(true);
    }
  };

  const handleSaveCustomPreset = (name: string, description: string) => {
    const channelMap: Record<string, number> = {};
    channels.forEach((c) => {
      channelMap[c.id] = c.muted ? 0 : c.volume;
    });
    const newPreset: SoundPreset = {
      id: `custom_${Date.now()}`,
      name,
      description,
      isCustom: true,
      channels: channelMap,
    };
    setPresets((prev) => [...prev, newPreset]);
    setSelectedPresetId(newPreset.id);
  };

  const handleDeleteCustomPreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    if (selectedPresetId === id) {
      setSelectedPresetId(null);
    }
  };

  // Task Handlers
  const handleAddTask = (title: string, category: TaskItem['category'], est: number) => {
    const newTask: TaskItem = {
      id: `task_${Date.now()}`,
      title,
      category,
      estimatedPomodoros: est,
      completedPomodoros: 0,
      completed: false,
      createdAt: Date.now(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (!activeTaskId) {
      setActiveTaskId(newTask.id);
    }
  };

  const handleToggleTaskComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) {
      setActiveTaskId(null);
    }
  };

  const handleSelectActiveTask = (task: TaskItem) => {
    setActiveTaskId(task.id);
  };

  // Timer Session Log Handler
  const handleSessionComplete = (durationMinutes: number, mode: TimerMode, taskId?: string) => {
    const currentTask = tasks.find((t) => t.id === taskId);
    const newLog: FocusSessionLog = {
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      durationMinutes,
      taskId,
      taskTitle: currentTask?.title,
      category: currentTask?.category || 'Focus Session',
      mode,
    };
    setLogs((prev) => [newLog, ...prev]);

    // Increment completed pomodoro count for active task
    if (taskId && (mode === 'focus' || mode === 'flowtime')) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completedPomodoros: t.completedPomodoros + 1 } : t))
      );
    }
  };

  // Keyboard shortcut listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        handleToggleMasterMute();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsZenOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsZenOpen(false);
        setIsShortcutsOpen(false);
      } else if (e.key === '?') {
        setIsShortcutsOpen((prev) => !prev);
      } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (presets[idx]) {
          handleSelectPreset(presets[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleMasterMute, presets]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  return (
    <div className="relative min-h-screen text-neutral-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-200">
      {/* Dynamic Atmospheric Backdrop */}
      <AtmosphereBackground theme={backdropTheme} dimLevel={dimLevel} />

      {/* Strict Top Bar Contract: 3 Zones Separated by gap-8 */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-8 px-6 py-3.5 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-850">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-bold tracking-tight text-neutral-100 whitespace-nowrap">
            Aura Studio
          </span>
          <span className="text-xs text-neutral-500 hidden sm:inline">· Focus Lab</span>
        </div>

        {/* Zone 2: Concise navigation links (single line, subtle hover underline) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
          <button
            onClick={() => setActiveTab('workstation')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'workstation'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            Workstation
          </button>
          <button
            onClick={() => setActiveTab('soundscape')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'soundscape'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            Soundscape
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'queue'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            Queue ({tasks.filter((t) => !t.completed).length})
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeTab === 'insights'
                ? 'text-amber-400 font-semibold'
                : 'hover:text-neutral-200'
            }`}
          >
            Insights
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Quick Sound Toggle */}
          <button
            onClick={handleTogglePlayAudio}
            title={isPlayingAudio ? 'Pause ambient audio' : 'Start ambient audio'}
            className={`p-2 rounded-lg text-xs transition-colors ${
              isPlayingAudio
                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850'
            }`}
          >
            {isPlayingAudio ? <Headphones className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsShortcutsOpen(true)}
            title="Keyboard shortcuts (?)"
            className="hidden sm:flex p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-850 rounded-lg transition-colors"
          >
            <Command className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsZenOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-sm shadow-amber-500/20 transition-all whitespace-nowrap shrink-0"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Zen Mode</span>
          </button>
        </div>
      </header>

      {/* Mobile Tab Strip */}
      <div className="md:hidden flex items-center justify-around border-b border-neutral-850 bg-neutral-950/90 text-xs py-2 px-4">
        <button
          onClick={() => setActiveTab('workstation')}
          className={`px-3 py-1 rounded-md ${activeTab === 'workstation' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-400'}`}
        >
          Timer
        </button>
        <button
          onClick={() => setActiveTab('soundscape')}
          className={`px-3 py-1 rounded-md ${activeTab === 'soundscape' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-400'}`}
        >
          Audio
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3 py-1 rounded-md ${activeTab === 'queue' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-400'}`}
        >
          Tasks
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-3 py-1 rounded-md ${activeTab === 'insights' ? 'bg-neutral-850 text-amber-400' : 'text-neutral-400'}`}
        >
          Stats
        </button>
      </div>

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Atmosphere & Visualizer Settings Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-neutral-850/80 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <span className="font-medium text-neutral-300">Environment:</span>
            <div className="flex items-center gap-1.5">
              {(['nordic', 'zen', 'observatory', 'obsidian'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setBackdropTheme(theme)}
                  className={`px-2 py-1 rounded text-[11px] capitalize transition-colors ${
                    backdropTheme === theme
                      ? 'bg-neutral-800 text-amber-300 border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Visualizer Mode selector */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">Waveform:</span>
              <select
                value={visualizerMode}
                onChange={(e) => setVisualizerMode(e.target.value as VisualizerMode)}
                className="bg-neutral-900 border border-neutral-800 text-neutral-300 px-2 py-1 rounded text-xs focus:outline-hidden"
              >
                <option value="waves">Silky Waves</option>
                <option value="particles">Cosmic Dust</option>
                <option value="zen_ripples">Zen Ripples</option>
                <option value="spectrum">Spectrum</option>
              </select>
            </div>

            {/* Atmosphere dim slider */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-neutral-400">Dim:</span>
              <input
                type="range"
                min="10"
                max="80"
                value={dimLevel}
                onChange={(e) => setDimLevel(parseInt(e.target.value, 10))}
                className="w-16 h-1 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* View Switcher Content */}
        {activeTab === 'workstation' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Pomodoro Flow Engine (lg: 6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <PomodoroTimer
                activeTask={activeTask}
                onSessionComplete={handleSessionComplete}
                onClearActiveTask={() => setActiveTaskId(null)}
              />

              {/* Quick Ambient Soundscape Bar */}
              <div className="p-4 rounded-xl bg-neutral-900/80 border border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-neutral-200">Ambient Soundscape</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('soundscape')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                  >
                    Open Studio →
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={handleTogglePlayAudio}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isPlayingAudio
                        ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
                        : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-750'
                    }`}
                  >
                    {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingAudio ? 'Sound Playing' : 'Start Audio'}</span>
                  </button>

                  <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                    <Volume2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={isMasterMuted ? 0 : masterVolume}
                      onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-neutral-800 rounded appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>

                  <span className="text-xs font-mono tabular-nums text-neutral-400">
                    {Math.round(masterVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Visualizer, Active Focus Queue & Scratchpad (lg: 6 cols) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              {/* Responsive Audio-Reactive Canvas Container */}
              <div className="relative h-44 rounded-2xl bg-neutral-900/60 border border-neutral-800 overflow-hidden flex items-center justify-center">
                <AmbientVisualizer mode={visualizerMode} isActive={isPlayingAudio} />
                <div className="absolute bottom-3 left-4 text-[11px] text-neutral-500 font-mono">
                  {isPlayingAudio ? 'Harmonic audio modulation active' : 'Audio paused · Idle resonance'}
                </div>
              </div>

              {/* Task Queue Quick Access */}
              <TaskQueue
                tasks={tasks}
                activeTaskId={activeTaskId}
                onSelectActiveTask={handleSelectActiveTask}
                onAddTask={handleAddTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onDeleteTask={handleDeleteTask}
              />

              {/* Scratchpad */}
              <Scratchpad />
            </div>
          </div>
        )}

        {activeTab === 'soundscape' && (
          <div className="space-y-6">
            <AudioMixer
              channels={channels}
              presets={presets}
              isPlaying={isPlayingAudio}
              masterVolume={masterVolume}
              isMuted={isMasterMuted}
              selectedPresetId={selectedPresetId}
              onTogglePlay={handleTogglePlayAudio}
              onMasterVolumeChange={handleMasterVolumeChange}
              onToggleMasterMute={handleToggleMasterMute}
              onChannelVolumeChange={handleChannelVolumeChange}
              onChannelPanChange={handleChannelPanChange}
              onChannelMuteToggle={handleChannelMuteToggle}
              onSelectPreset={handleSelectPreset}
              onSaveCustomPreset={handleSaveCustomPreset}
              onDeleteCustomPreset={handleDeleteCustomPreset}
            />

            {/* Full Visualizer Stage */}
            <div className="p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-neutral-200">Acoustic Resonance Visualizer</h3>
                <span className="text-xs text-neutral-400">Real-time Web Audio Analyser node</span>
              </div>
              <div className="h-48 rounded-xl bg-neutral-950 border border-neutral-850 overflow-hidden">
                <AmbientVisualizer mode={visualizerMode} isActive={isPlayingAudio} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8">
              <TaskQueue
                tasks={tasks}
                activeTaskId={activeTaskId}
                onSelectActiveTask={handleSelectActiveTask}
                onAddTask={handleAddTask}
                onToggleTaskComplete={handleToggleTaskComplete}
                onDeleteTask={handleDeleteTask}
              />
            </div>
            <div className="lg:col-span-4">
              <Scratchpad />
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <FocusAnalytics
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}
      </main>

      {/* Zen Fullscreen Modal */}
      {isZenOpen && (
        <ZenOverlay
          activeTask={activeTask}
          isPlayingAudio={isPlayingAudio}
          masterVolume={masterVolume}
          isMuted={isMasterMuted}
          presets={presets}
          selectedPresetId={selectedPresetId}
          backdropTheme={backdropTheme}
          onCloseZen={() => setIsZenOpen(false)}
          onTogglePlayAudio={handleTogglePlayAudio}
          onMasterVolumeChange={handleMasterVolumeChange}
          onToggleMasterMute={handleToggleMasterMute}
          onSelectPreset={handleSelectPreset}
          onThemeChange={setBackdropTheme}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Quiet, clean footer adhering to constitution (No fake engines, clean text) */}
      <footer className="mt-auto border-t border-neutral-850/80 py-4 px-6 text-xs text-neutral-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span>Aura Deep Work Environment</span>
          <span aria-hidden="true">·</span>
          <span>Procedural Web Audio API</span>
          <span aria-hidden="true">·</span>
          <span>Offline-Ready Client Engine</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="hover:text-neutral-300 transition-colors"
          >
            Shortcuts [?]
          </button>
          <span aria-hidden="true">·</span>
          <span>Distraction-free</span>
        </div>
      </footer>
    </div>
  );
}
