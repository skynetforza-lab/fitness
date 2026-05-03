import { Navigate, Route, Routes } from "react-router-dom";
import AuthGate from "./components/AuthGate";
import NavBar from "./components/NavBar";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import WorkoutPage from "./pages/WorkoutPage";
import ExercisesPage from "./pages/ExercisesPage";
import StatsPage from "./pages/StatsPage";

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <NavBar />
      <main>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
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
        path="/stats"
        element={
          <AuthGate>
            <AppShell>
              <StatsPage />
            </AppShell>
          </AuthGate>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
