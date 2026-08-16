import { useEffect, useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  /** Starting duration in seconds. */
  seconds: number;
  /** Short heading, e.g. "Rest" or "Next exercise". */
  label: string;
  /** Bumped by the parent to restart the countdown for a new set. */
  runKey: number;
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

export default function RestTimer({ seconds, label, runKey, onDismiss }: Props) {
  // The deadline is the single source of truth: remaining time is derived from
  // the wall clock, never accumulated from interval ticks. Mobile browsers
  // throttle timers in background tabs, so a tick-counting timer drifts badly
  // the moment the screen locks mid-rest.
  const [total, setTotal] = useState(seconds);
  const [endAt, setEndAt] = useState(() => Date.now() + seconds * 1000);
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

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
  const done = left === 0;

  // Alert once when the countdown lands on zero.
  useEffect(() => {
    if (done && !firedRef.current) {
      firedRef.current = true;
      beep();
      navigator.vibrate?.([200, 100, 200]);
    }
  }, [done]);

  const mins = Math.floor(left / 60);
  const secs = left % 60;
  const pct = total > 0 ? Math.min(100, ((total - left) / total) * 100) : 100;

  function addTime(extra: number) {
    setTotal((t) => t + extra);
    // Extend from the deadline, or from now if the timer already ran out.
    setEndAt((e) => Math.max(e, Date.now()) + extra * 1000);
    firedRef.current = false;
  }

  return (
    <div
      className={cn(
        "sticky top-2 z-40 overflow-hidden rounded-xl border shadow-sm transition",
        done ? "border-emerald-300 bg-emerald-50" : "border-brand-200 bg-white",
      )}
      role="status"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 transition-all duration-300",
          done ? "bg-emerald-100" : "bg-brand-50",
        )}
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-3 px-3 py-2.5">
        <div className="flex flex-col leading-tight">
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-wide",
              done ? "text-emerald-600" : "text-brand-600",
            )}
          >
            {done ? "Rest over" : label}
          </span>
          <span
            className={cn(
              "text-xl font-bold tabular-nums",
              done ? "text-emerald-700" : "text-slate-800",
            )}
          >
            {mins}:{String(secs).padStart(2, "0")}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {!done && (
            <button
              type="button"
              onClick={() => addTime(15)}
              className="flex items-center gap-0.5 rounded-lg bg-slate-100 px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
            >
              <Plus className="h-3 w-3" />
              15s
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
              done
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200",
            )}
          >
            {done ? "Done" : <X className="h-3.5 w-3.5" />}
            {!done && "Skip"}
          </button>
        </div>
      </div>
    </div>
  );
}
