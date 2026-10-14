import React from 'react';
import { FocusSessionLog } from '../types';
import { BarChart3, Clock, Flame, Award, Trash2 } from 'lucide-react';

interface Props {
  logs: FocusSessionLog[];
  onClearLogs: () => void;
}

export const FocusAnalytics: React.FC<Props> = ({ logs, onClearLogs }) => {
  const today = new Date().toDateString();

  const todayLogs = logs.filter(
    (l) => new Date(l.timestamp).toDateString() === today && l.mode !== 'short_break' && l.mode !== 'long_break'
  );

  const todayMinutes = todayLogs.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const totalSessions = logs.filter((l) => l.mode === 'focus' || l.mode === 'flowtime').length;

  // Calculate 7-day daily minutes
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayStr = d.toDateString();
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const mins = logs
      .filter((l) => new Date(l.timestamp).toDateString() === dayStr && (l.mode === 'focus' || l.mode === 'flowtime'))
      .reduce((acc, c) => acc + c.durationMinutes, 0);
    return { dayName, mins, isToday: i === 6 };
  });

  const maxDailyMin = Math.max(...past7Days.map((d) => d.mins), 60);

  // Category breakdown
  const categoryStats: Record<string, number> = {};
  todayLogs.forEach((l) => {
    categoryStats[l.category] = (categoryStats[l.category] || 0) + l.durationMinutes;
  });

  return (
    <div className="flex flex-col gap-6 p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-200">Focus Intelligence</h3>
          <p className="text-xs text-neutral-400 mt-0.5">Session metrics and daily momentum</p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Reset all focus session history?')) {
                onClearLogs();
              }
            }}
            className="flex items-center gap-1 text-[11px] text-neutral-500 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            <span>Reset History</span>
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-medium">Today's Focus</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {todayMinutes} <span className="text-xs font-normal text-neutral-500">mins</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {Math.round((todayMinutes / 60) * 10) / 10} hours of deep attention
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] font-medium">Completed Cycles</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {todayLogs.length} <span className="text-xs font-normal text-neutral-500">blocks</span>
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            {totalSessions} lifetime logged sessions
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-850">
          <div className="flex items-center gap-2 text-neutral-400 mb-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] font-medium">Cadence Target</span>
          </div>
          <div className="text-2xl font-bold font-mono text-neutral-100 tabular-nums">
            {Math.min(100, Math.round((todayMinutes / 180) * 100))}%
          </div>
          <div className="text-[10px] text-neutral-500 mt-1">
            Baseline: 180 mins / day target
          </div>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-850">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-neutral-300">7-Day Momentum</span>
          <span className="text-neutral-500 font-mono tabular-nums">Peak: {maxDailyMin}m</span>
        </div>

        <div className="flex items-end justify-between h-24 pt-2 px-2 gap-2">
          {past7Days.map((day, idx) => {
            const heightPercent = Math.max(8, (day.mins / maxDailyMin) * 100);
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-mono tabular-nums text-neutral-400">
                  {day.mins > 0 ? `${day.mins}m` : '-'}
                </span>
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[28px] rounded-t-sm transition-all duration-300 ${
                    day.isToday ? 'bg-amber-500' : day.mins > 0 ? 'bg-neutral-700' : 'bg-neutral-850'
                  }`}
                />
                <span className="text-[10px] font-medium text-neutral-500">{day.dayName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Session Logs */}
      <div>
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
          Recent Focus Entries
        </h4>

        {logs.length === 0 ? (
          <div className="py-6 text-center border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
            Complete your first timer interval to record activity
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {logs
              .slice(-8)
              .reverse()
              .map((log) => {
                const date = new Date(log.timestamp);
                const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                  <div
                    key={log.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-neutral-950/50 border border-neutral-850 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono tabular-nums text-neutral-400 text-[11px] shrink-0">
                        {timeStr}
                      </span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-neutral-200 truncate font-medium">
                        {log.taskTitle || (log.mode === 'focus' ? 'Deep Work Interval' : 'Rest Break')}
                      </span>
                      <span aria-hidden="true" className="text-neutral-600">·</span>
                      <span className="text-neutral-500 text-[11px] shrink-0">{log.category}</span>
                    </div>
                    <span className="font-mono tabular-nums font-semibold text-amber-400 shrink-0 ml-2">
                      +{log.durationMinutes}m
                    </span>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};
