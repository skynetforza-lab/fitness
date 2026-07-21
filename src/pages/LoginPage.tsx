import { useEffect, useState } from "react";
import { Dumbbell, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [signupSent, setSignupSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
  }, [navigate]);

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetSent(false);
    setSignupSent(false);
    setConfirm("");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
    else navigate("/", { replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    // If email confirmation is disabled in Supabase, a session is returned immediately.
    if (data.session) {
      navigate("/", { replace: true });
    } else {
      setSignupSent(true);
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const redirectTo = `${window.location.origin}/set-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm p-6">
        <div className="mb-4 flex items-center justify-center gap-2 text-xl font-semibold">
          <Dumbbell className="h-6 w-6 text-brand-600" />
          Fitness Tracker
        </div>

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("forgot")}
              className="block w-full text-center text-xs text-brand-600 hover:underline"
            >
              Forgot password?
            </button>
            <p className="text-center text-xs text-slate-500">
              No account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="text-brand-600 hover:underline"
              >
                Create one
              </button>
            </p>
          </form>
        )}

        {mode === "signup" && (
          signupSent ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                ✓ Check your inbox at <strong>{email}</strong> and click the
                confirmation link to activate your account.
              </div>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="btn-secondary w-full"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  autoComplete="new-password"
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
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : null}
                {busy ? "Creating account…" : "Create account"}
              </button>
              <p className="text-center text-xs text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-brand-600 hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          )
        )}

        {mode === "forgot" && (
          resetSent ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                ✓ Reset link sent to <strong>{email}</strong>. Check your inbox
                and click the link to set a new password.
              </div>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="btn-secondary w-full"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgot} className="space-y-3">
              <p className="text-sm text-slate-600">
                Enter your email and we'll send you a link to set a new password.
              </p>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-rose-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full">
                {busy ? <Loader2 className="mr-1 inline h-4 w-4 animate-spin" /> : null}
                {busy ? "Sending…" : "Send reset link"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="block w-full text-center text-xs text-slate-500 hover:underline"
              >
                Back to sign in
              </button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
