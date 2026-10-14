import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, SkipForward, Settings2, CheckCircle2, Flame } from 'lucide-react';
import { TimerMode, TaskItem } from '../types';
import { soundEngine } from '../audio/soundEngine';

interface Props {
  activeTask: TaskItem | null;
  onSessionComplete: (durationMinutes: number, mode: TimerMode, taskId?: string) => void;
  onClearActiveTask: () => void;
}

export const PomodoroTimer: React.FC<Props> = ({
  activeTask,
  onSessionComplete,
  onClearActiveTask,
}) => {
  const [mode, setMode] = useState<TimerMode>('focus');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [focusDuration, setFocusDuration] = useState<number>(25);
  const [deepSprintDuration, setDeepSprintDuration] = useState<number>(50);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [elapsedFlowSeconds, setElapsedFlowSeconds] = useState<number>(0);
  const [autoStartBreaks, setAutoStartBreaks] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Interval reference
  const timerRef = useRef<number | null>(null);

  const getTargetSeconds = useCallback((m: TimerMode): number => {
    switch (m) {
      case 'focus':
        return focusDuration * 60;
      case 'short_break':
        return shortBreakDuration * 60;
      case 'long_break':
        return longBreakDuration * 60;
      case 'flowtime':
        return 0;
    }
  }, [focusDuration, shortBreakDuration, longBreakDuration]);

  // Handle mode change
  const handleModeChange = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    if (newMode === 'flowtime') {
      setElapsedFlowSeconds(0);
    } else {
      setTimeLeft(getTargetSeconds(newMode));
    }
  };

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        if (mode === 'flowtime') {
          setElapsedFlowSeconds((prev) => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              // Timer completed!
              clearInterval(timerRef.current!);
              setIsRunning(false);
              soundEngine.playChime();

              const durationMins =
                mode === 'focus'
                  ? focusDuration
                  : mode === 'short_break'
                  ? shortBreakDuration
                  : longBreakDuration;

              onSessionComplete(durationMins, mode, activeTask?.id);

              if (mode === 'focus' && autoStartBreaks) {
                setMode('short_break');
                setTimeLeft(shortBreakDuration * 60);
                setIsRunning(true);
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode, focusDuration, shortBreakDuration, longBreakDuration, autoStartBreaks, activeTask, onSessionComplete]);

  // Play / Pause toggle
  const toggleRunning = () => {
    setIsRunning((prev) => !prev);
  };

  // Reset
  const handleReset = () => {
    setIsRunning(false);
    if (mode === 'flowtime') {
      if (elapsedFlowSeconds > 60) {
        onSessionComplete(Math.round(elapsedFlowSeconds / 60), 'flowtime', activeTask?.id);
      }
      setElapsedFlowSeconds(0);
    } else {
      setTimeLeft(getTargetSeconds(mode));
    }
  };

  // Skip
  const handleSkip = () => {
    setIsRunning(false);
    if (mode === 'focus') {
      setMode('short_break');
      setTimeLeft(shortBreakDuration * 60);
    } else {
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  // Formatting minutes and seconds
  const currentTotal = getTargetSeconds(mode);
  const displaySeconds = mode === 'flowtime' ? elapsedFlowSeconds : timeLeft;
  const mins = Math.floor(displaySeconds / 60);
  const secs = displaySeconds % 60;
  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Circular progress calculation
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = mode === 'flowtime' ? 1 : Math.max(0, timeLeft / (currentTotal || 1));
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-neutral-900/80 border border-neutral-800">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-950/80 border border-neutral-800 rounded-xl mb-6">
        <button
          onClick={() => handleModeChange('focus')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'focus' ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => {
            setFocusDuration(deepSprintDuration);
            handleModeChange('focus');
          }}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'focus' && focusDuration === 50
              ? 'bg-amber-500 text-neutral-950 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Deep Sprint (50m)
        </button>
        <button
          onClick={() => handleModeChange('short_break')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'short_break'
              ? 'bg-neutral-800 text-emerald-400 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Short Rest
        </button>
        <button
          onClick={() => handleModeChange('long_break')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'long_break'
              ? 'bg-neutral-800 text-blue-400 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Long Rest
        </button>
        <button
          onClick={() => handleModeChange('flowtime')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            mode === 'flowtime'
              ? 'bg-neutral-800 text-amber-300 font-semibold shadow-xs'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Open Flow
        </button>
      </div>

      {/* Active Task Callout */}
      {activeTask && (
        <div className="flex items-center gap-2 px-3 py-1.5 mb-4 rounded-lg bg-amber-500/10 border border-amber-500/20 max-w-sm">
          <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-xs text-amber-300 truncate font-medium">Focusing on: {activeTask.title}</span>
          <button
            onClick={onClearActiveTask}
            title="Deselect active task"
            className="text-[10px] text-neutral-400 hover:text-neutral-200 ml-auto shrink-0"
          >
            Clear
          </button>
        </div>
      )}

      {/* Circular Progress Gauge */}
      <div className="relative flex items-center justify-center my-2">
        <svg className="w-64 h-64 transform -rotate-90" viewBox="0 0 260 260">
          {/* Background Track */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            className="stroke-neutral-800/80 fill-none"
            strokeWidth="8"
          />
          {/* Progress Indicator */}
          <circle
            cx="130"
            cy="130"
            r={radius}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`fill-none transition-all duration-500 ${
              mode === 'focus'
                ? 'stroke-amber-500'
                : mode === 'short_break'
                ? 'stroke-emerald-400'
                : mode === 'long_break'
                ? 'stroke-blue-400'
                : 'stroke-amber-300'
            }`}
            strokeWidth="8"
          />
        </svg>

        {/* Central Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-mono font-bold tracking-tight text-neutral-100 tabular-nums">
            {formattedTime}
          </span>
          <span className="text-xs text-neutral-400 uppercase tracking-widest mt-1 font-medium">
            {mode === 'focus'
              ? 'Deep Focus'
              : mode === 'short_break'
              ? 'Rest & Recharge'
              : mode === 'long_break'
              ? 'Extended Break'
              : 'Flow Session'}
          </span>
          {activeTask && (
            <span className="text-[11px] text-neutral-500 mt-1 font-mono tabular-nums">
              {activeTask.completedPomodoros} / {activeTask.estimatedPomodoros} completed
            </span>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={handleReset}
          title="Reset timer"
          className="p-3 text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-700/50"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={toggleRunning}
          className={`flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all shadow-md ${
            isRunning
              ? 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700'
              : 'bg-amber-500 text-neutral-950 hover:bg-amber-400 shadow-amber-500/20'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause Focus</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{mode === 'focus' ? 'Begin Session' : 'Start Rest'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleSkip}
          title="Skip to next session"
          className="p-3 text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 rounded-xl transition-colors border border-neutral-700/50"
        >
          <SkipForward className="w-4 h-4" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          title="Timer preferences"
          className={`p-3 rounded-xl transition-colors border ${
            showSettings
              ? 'bg-neutral-800 text-amber-400 border-amber-500/40'
              : 'text-neutral-400 hover:text-neutral-100 bg-neutral-800/60 hover:bg-neutral-800 border-neutral-700/50'
          }`}
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="w-full max-w-sm mt-6 p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-3">
          <div className="flex items-center justify-between text-neutral-300 font-medium">
            <span>Timer Durations</span>
            <span className="text-[10px] text-neutral-500">Minutes</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-neutral-400 text-[10px] block mb-1">Focus</label>
              <input
                type="number"
                min="1"
                max="90"
                value={focusDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 25);
                  setFocusDuration(val);
                  if (mode === 'focus' && !isRunning) setTimeLeft(val * 60);
                }}
                className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-100 font-mono text-center"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-[10px] block mb-1">Short Break</label>
              <input
                type="number"
                min="1"
                max="30"
                value={shortBreakDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 5);
                  setShortBreakDuration(val);
                  if (mode === 'short_break' && !isRunning) setTimeLeft(val * 60);
                }}
                className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-100 font-mono text-center"
              />
            </div>
            <div>
              <label className="text-neutral-400 text-[10px] block mb-1">Long Break</label>
              <input
                type="number"
                min="1"
                max="60"
                value={longBreakDuration}
                onChange={(e) => {
                  const val = Math.max(1, parseInt(e.target.value) || 15);
                  setLongBreakDuration(val);
                  if (mode === 'long_break' && !isRunning) setTimeLeft(val * 60);
                }}
                className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-100 font-mono text-center"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-850">
            <span className="text-neutral-400">Auto-start Breaks</span>
            <button
              onClick={() => setAutoStartBreaks(!autoStartBreaks)}
              className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                autoStartBreaks ? 'bg-amber-500' : 'bg-neutral-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-neutral-950 transition-transform ${
                  autoStartBreaks ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
