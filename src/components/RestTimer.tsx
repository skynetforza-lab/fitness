import { useEffect, useRef, useState } from "react";
import { Plus, Timer } from "lucide-react";

interface Props {
  /** Starting duration in seconds. */
  seconds: number;
  /** Short heading, e.g. "Rest" or "Next exercise". */
  label: string;
  /** Bumped by the parent to restart the countdown for a new set. */
  runKey: number;
  /** Collapsed to a floating pill instead of the full popup. */
  minimized: boolean;
  /** Tapping the backdrop / pressing Escape — keeps counting, just gets out of the way. */
  onMinimize: () => void;
  /** Tapping the pill. */
  onExpand: () => void;
  /** Cancel, and automatically when the countdown reaches zero. */
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

export default function RestTimer({
  seconds,
  label,
  runKey,
  minimized,
  onMinimize,
  onExpand,
  onDismiss,
}: Props) {
  // The deadline is the single source of truth: remaining time is derived from
  // the wall clock, never accumulated from interval ticks. Mobile browsers
  // throttle timers in background tabs, so a tick-counting timer drifts badly
  // the moment the screen locks mid-rest.
  const [total, setTotal] = useState(seconds);
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  // Keep the latest callbacks without making them effect dependencies, so the
  // parent re-rendering can't re-trigger the finish handler.
  const dismissRef = useRef(onDismiss);
  const minimizeRef = useRef(onMinimize);
  useEffect(() => {
    dismissRef.current = onDismiss;
    minimizeRef.current = onMinimize;
  }, [onDismiss, onMinimize]);

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

  // Escape gets the popup out of the way without stopping the countdown.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") minimizeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const clock = `${mins}:${String(secs).padStart(2, "0")}`;
  const fraction = total > 0 ? left / total : 0;

  function addTime(extra: number) {
    setTotal((t) => t + extra);
    setEndAt((e) => Math.max(e, Date.now()) + extra * 1000);
    firedRef.current = false;
  }

  // ─── Collapsed: floating pill, still counting ──────────────────────────────
  if (minimized) {
    return (
      <button
        type="button"
        onClick={onExpand}
        aria-label={`${label} timer, ${clock} remaining. Tap to expand.`}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-brand-200 bg-white px-4 py-2.5 shadow-lg transition hover:bg-brand-50"
      >
        <Timer className="h-4 w-4 text-brand-600" />
        <span className="text-base font-bold tabular-nums text-slate-800">
          {clock}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </span>
      </button>
    );
  }

  // ─── Expanded: popup ───────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`${label} timer`}
      // Tap the backdrop to get back to the log. The countdown keeps running as
      // a pill. The check keeps clicks inside the card — and drags that end on
      // the backdrop — from collapsing it.
      onClick={(e) => {
        if (e.target === e.currentTarget) onMinimize();
      }}
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
              {clock}
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

        <p className="mt-3 text-[11px] text-slate-400">
          Tap outside — the timer keeps running in the corner
        </p>
      </div>
    </div>
  );
}
