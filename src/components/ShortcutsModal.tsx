import React from 'react';
import { X, Command } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Space', desc: 'Start or Pause current timer session' },
    { key: 'M', desc: 'Toggle ambient audio mute' },
    { key: 'F', desc: 'Toggle Fullscreen Zen Focus mode' },
    { key: '1 - 5', desc: 'Quick-switch ambient sound presets' },
    { key: 'Esc', desc: 'Exit modal or Zen mode' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-xs">
      <div className="w-full max-w-sm p-6 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-100">Workstation Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {shortcuts.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850 text-xs"
            >
              <span className="text-neutral-400">{s.desc}</span>
              <kbd className="px-2 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-200 font-mono text-[11px] font-semibold">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
