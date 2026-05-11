import { useEffect } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import WorkoutPage from "./pages/WorkoutPage";
import ExercisesPage from "./pages/ExercisesPage";
import NutritionPage from "./pages/NutritionPage";
import StatsPage from "./pages/StatsPage";
import ComparePage from "./pages/ComparePage";
import SetPasswordPage from "./pages/SetPasswordPage";
import { supabase } from "./lib/supabase";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  const navigate = useNavigate();

  // When Supabase emits PASSWORD_RECOVERY (user clicked recovery link in email),
  // route them to /set-password so they can choose a new password.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/set-password", { replace: true });
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/set-password"
        element={
          <AuthGate>
            <SetPasswordPage />
          </AuthGate>
        }
      />
      <Route
        path="/"
        element={
          <AuthGate>
            <AppShell>
              <CalendarPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route
        path="/workout/:date"
        element={
          <AuthGate>
            <AppShell>
              <WorkoutPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route
        path="/exercises"
        element={
          <AuthGate>
            <AppShell>
              <ExercisesPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route
        path="/nutrition/:date"
        element={
          <AuthGate>
            <AppShell>
              <NutritionPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route
        path="/stats"
        element={
          <AuthGate>
            <AppShell>
              <StatsPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route
        path="/compare"
        element={
          <AuthGate>
            <AppShell>
              <ComparePage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
