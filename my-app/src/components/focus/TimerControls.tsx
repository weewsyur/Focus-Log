import { CirclePause, Play, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from '../ui/Button';
import type { TimerMode, TimerStatus } from '../../types';

interface TimerControlsProps {
  status: TimerStatus; mode: TimerMode; canReset: boolean;
  onStart: () => void; onPause: () => void; onReset: () => void; onSkipBreak?: () => void;
}

export function TimerControls({ status, mode, canReset, onStart, onPause, onReset, onSkipBreak }: TimerControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {status === 'running'
        ? <Button variant="secondary" icon={<CirclePause size={16} strokeWidth={2} aria-hidden="true" />} onClick={onPause}>Pause</Button>
        : <Button icon={<Play size={16} strokeWidth={2} aria-hidden="true" />} onClick={onStart}>{status === 'paused' ? 'Resume' : mode === 'focus' ? 'Start session' : 'Start break'}</Button>}
      {canReset && <Button variant="ghost" icon={<RotateCcw size={15} strokeWidth={2} aria-hidden="true" />} onClick={onReset}>Reset</Button>}
      {mode === 'break' && onSkipBreak && <Button variant="ghost" icon={<SkipForward size={15} strokeWidth={2} aria-hidden="true" />} onClick={onSkipBreak}>Skip break</Button>}
    </div>
  );
}
