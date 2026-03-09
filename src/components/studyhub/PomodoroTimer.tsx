import { useState, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { HoverTip } from '@/components/HoverTip';

export function PomodoroTimer() {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, seconds]);

  useEffect(() => {
    if (seconds <= 0) {
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, [seconds]);

  const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
  const secs = String(seconds % 60).padStart(2, '0');

  function reset() {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSeconds(25 * 60);
  }

  return (
    <div
      className={`flex items-center gap-4 px-5 py-3 rounded-xl border transition-all duration-300 ${
        running
          ? 'bg-purple-900/20 border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
          : 'bg-white/5 border-white/10'
      }`}
    >
      <span className="text-xl font-mono font-semibold text-white tabular-nums tracking-wider">
        {mins}:{secs}
      </span>
      <HoverTip label={running ? 'Pause timer' : 'Start timer'}>
        <button
          onClick={() => setRunning(!running)}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
          aria-label={running ? 'Pause' : 'Play'}
        >
          {running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </HoverTip>
      <HoverTip label="Reset timer">
        <button
          onClick={reset}
          className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </HoverTip>
    </div>
  );
}
