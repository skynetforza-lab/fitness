import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";

interface Props {
  /** Starting duration in seconds. */
  seconds: number;
  /** Short heading, e.g. "Rest" or "Next exercise". */
  label: string;
  /** Bumped by the parent to restart the countdown for a new set. */
  runKey: number;
  /** Called on cancel, and automatically when the countdown reaches zero. */
  onDismiss: () => void;
}

/** Short two-tone beep. Built with Web Audio so there's no asset to ship. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = (at: number, freq: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      // Quick fade out, otherwise the note ends on a click.
      gain.gain.setValueAtTime(0.25, ctx.currentTime + at);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + at + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + at);
      osc.stop(ctx.currentTime + at + 0.2);
    };
    play(0, 880);
    play(0.22, 1175);
    setTimeout(() => void ctx.close(), 800);
  } catch {
    // Audio is a nicety — never let it break the timer.
  }
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RestTimer({ seconds, label, runKey, onDismiss }: Props) {
  // The deadline is the single source of truth: remaining time is derived from
  // the wall clock, never accumulated from interval ticks. Mobile browsers
  // throttle timers in background tabs, so a tick-counting timer drifts badly
  // the moment the screen locks mid-rest.
  const [total, setTotal] = useState(seconds);
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  // Keep the latest onDismiss without making it an effect dependency, so the
  // parent re-rendering can't re-trigger the finish handler.
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Restart whenever the parent signals a new set, or the duration changes.
  useEffect(() => {
    setTotal(seconds);
    setEndAt(Date.now() + seconds * 1000);
    setNow(Date.now());
    firedRef.current = false;
  }, [seconds, runKey]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const left = Math.max(0, Math.ceil((endAt - now) / 1000));

  // Alert and close once the countdown lands on zero.
  useEffect(() => {
    if (left === 0 && !firedRef.current) {
      firedRef.current = true;
      beep();
      navigator.vibrate?.([200, 100, 200]);
      dismissRef.current();
    }
  }, [left]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const fraction = total > 0 ? left / total : 0;

  function addTime(extra: number) {
    setTotal((t) => t + extra);
    setEndAt((e) => Math.max(e, Date.now()) + extra * 1000);
    firedRef.current = false;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} timer`}
    >
      <div className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-xl">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-brand-600">
          {label}
        </p>

        <div className="relative mx-auto mb-5 h-32 w-32">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-100"
            />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-brand-500 transition-[stroke-dashoffset] duration-300"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-4xl font-bold tabular-nums text-slate-800"
              aria-live="polite"
            >
              {mins}:{String(secs).padStart(2, "0")}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addTime(15)}
            className="btn-secondary flex-1"
          >
            <Plus className="h-4 w-4" /> 15s
          </button>
          <button type="button" onClick={onDismiss} className="btn-primary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
