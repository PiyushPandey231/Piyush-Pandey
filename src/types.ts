export type TimerMode = 'focus' | 'short_break' | 'long_break' | 'flowtime';

export interface SoundChannel {
  id: string;
  name: string;
  category: 'nature' | 'focus' | 'ambient';
  volume: number; // 0 to 100
  muted: boolean;
  pan: number; // -1 to 1
  description: string;
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  channels: Record<string, number>; // id -> volume (0-100)
}

export interface TaskItem {
  id: string;
  title: string;
  category: 'Engineering' | 'Deep Writing' | 'Research' | 'Architecture' | 'Review';
  estimatedPomodoros: number;
  completedPomodoros: number;
  completed: boolean;
  createdAt: number;
}

export interface FocusSessionLog {
  id: string;
  timestamp: number;
  durationMinutes: number;
  taskId?: string;
  taskTitle?: string;
  category: string;
  mode: TimerMode;
}

export type VisualizerMode = 'waves' | 'particles' | 'zen_ripples' | 'spectrum';

export type BackdropTheme = 'obsidian' | 'nordic' | 'zen' | 'observatory' | 'forest';
