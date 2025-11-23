'use client';

interface TimerBarProps {
  progress: number; // 0 to 1
  label?: string;
}

export function TimerBar({ progress, label }: TimerBarProps) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return (
    <div className="w-full">
      {label && <div className="text-xs text-slate-200 mb-1">{label}</div>}
      <div className="h-3 rounded-full bg-white/10 overflow-hidden neon-card">
        <div
          className="h-full rounded-full animate-gradient-bg"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
