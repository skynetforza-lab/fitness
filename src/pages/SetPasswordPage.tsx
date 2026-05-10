import { useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function SetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    // Brief delay so the user sees the confirmation, then redirect home
    setTimeout(() => navigate("/", { replace: true }), 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-xl font-semibold">
          <Dumbbell className="h-6 w-6 text-brand-600" />
          Set your password
        </div>
        <p className="mb-4 text-center text-sm text-slate-600">
          Welcome! Pick a password for your account.
        </p>

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-center text-sm text-emerald-700">
            ✓ Password saved. Redirecting…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="new-password"
                autoFocus
              />
            </div>
            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="input"
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={busy || !password || !confirm}
              className="btn-primary w-full"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {busy ? "Saving…" : "Save password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
