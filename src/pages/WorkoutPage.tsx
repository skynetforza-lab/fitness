import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import WorkoutLogger from "@/components/WorkoutLogger";

export default function WorkoutPage() {
  const { date } = useParams<{ date: string }>();
  if (!date) return null;
  let pretty = date;
  try {
    pretty = format(parseISO(date), "EEEE, MMM d, yyyy");
  } catch {
    /* ignore */
  }
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
      <div className="flex items-center gap-2">
        <Link to="/" className="btn-ghost">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-xl font-semibold">Workout — {pretty}</h1>
      </div>
      <WorkoutLogger dateISO={date} />
    </div>
  );
}
