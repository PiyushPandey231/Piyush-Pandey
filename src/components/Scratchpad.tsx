import React, { useState, useEffect } from 'react';
import { Copy, Download, Trash2, Check, FileText } from 'lucide-react';

export const Scratchpad: React.FC = () => {
  const [content, setContent] = useState<string>(() => {
    return localStorage.getItem('aura_focus_scratchpad') || '# Daily Focus Log\n\n- [ ] Core deliverable for today\n- Key reference or insight: ';
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem('aura_focus_scratchpad', content);
  }, [content]);

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const chars = content.length;
  const readingTimeMin = Math.ceil(words / 200);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focus-notes-${new Date().toISOString().slice(0, 10)}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (window.confirm('Clear all scratchpad contents?')) {
      setContent('');
    }
  };

  return (
    <div className="flex flex-col h-full p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-neutral-200">Session Scratchpad</h3>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownload}
            title="Download markdown notes"
            className="p-1.5 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleClear}
            title="Clear notes"
            className="p-1.5 text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Record thoughts, rapid outlines, or transient notes without switching windows..."
        className="flex-1 w-full p-3 text-xs font-mono leading-relaxed bg-neutral-950/70 border border-neutral-800 rounded-xl text-neutral-200 placeholder:text-neutral-600 focus:outline-hidden focus:border-amber-500/60 resize-none min-h-[160px]"
      />

      <div className="flex items-center justify-between text-[11px] text-neutral-500 mt-2.5">
        <div className="flex items-center gap-2">
          <span className="tabular-nums font-mono">{words} words</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums font-mono">{chars} chars</span>
          <span aria-hidden="true">·</span>
          <span>~{readingTimeMin} min read</span>
        </div>
        <span className="text-[10px] text-neutral-500">Auto-saved</span>
      </div>
    </div>
  );
};
