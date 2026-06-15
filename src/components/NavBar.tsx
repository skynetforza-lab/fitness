import { NavLink, useNavigate } from "react-router-dom";
import { Calendar, Dumbbell, BarChart3, Lightbulb, ListChecks, LogOut, Users, Utensils } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/cn";

export default function NavBar() {
  const navigate = useNavigate();
  const todayISO = format(new Date(), "yyyy-MM-dd");

  const links = [
    { to: "/", label: "Calendar", icon: Calendar, end: true },
    { to: "/exercises", label: "Exercises", icon: ListChecks },
    { to: `/nutrition/${todayISO}`, label: "Nutrition", icon: Utensils, end: false },
    { to: "/insights", label: "Insights", icon: Lightbulb },
    { to: "/stats", label: "Stats", icon: BarChart3 },
    { to: "/compare", label: "Compare", icon: Users },
  ];

  async function logout() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Dumbbell className="h-5 w-5 text-brand-600" />
          <span>Fitness Tracker</span>
        </div>
        <nav className="flex items-center gap-0.5">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium transition sm:px-3",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
                )
              }
              aria-label={label}
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={logout}
            className="flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 active:bg-slate-200 sm:px-3"
            aria-label="Sign out"
          >
            <LogOut className="h-5 w-5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
