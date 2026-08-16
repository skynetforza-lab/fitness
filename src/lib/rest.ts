export const REST_BETWEEN_SETS = 30;
export const REST_BETWEEN_EXERCISES = 60;

/** The subset of a logged set this decision depends on. */
export interface RestInput {
  id: string;
  exercise_id: string;
  superset_group: string | null;
  is_done: boolean;
  exercise: { name: string };
}

export type RestDecision =
  | { kind: "timer"; seconds: number; label: string }
  /** Superset mid-round: go straight to the partner exercise, no rest. */
  | { kind: "cue"; text: string };

/**
 * Decides what happens after a set is ticked complete.
 *
 * `sets` must already reflect the tick. Plain exercises rest between sets and
 * longer once the exercise is finished. Supersets are different: the exercises
 * are performed back-to-back with no rest, and the break only comes once every
 * exercise in the group has finished that round — so a partner still owing a
 * set in this round yields a cue, not a timer.
 */
export function decideRest(
  sets: RestInput[],
  ticked: Pick<RestInput, "exercise_id" | "superset_group">,
): RestDecision {
  const group = ticked.superset_group;

  if (!group) {
    const exerciseComplete = !sets.some(
      (s) => s.exercise_id === ticked.exercise_id && !s.is_done,
    );
    return exerciseComplete
      ? { kind: "timer", seconds: REST_BETWEEN_EXERCISES, label: "Next exercise" }
      : { kind: "timer", seconds: REST_BETWEEN_SETS, label: "Rest" };
  }

  const groupSets = sets.filter((s) => s.superset_group === group);
  if (groupSets.every((s) => s.is_done)) {
    return { kind: "timer", seconds: REST_BETWEEN_EXERCISES, label: "Next exercise" };
  }

  const exerciseIds = [...new Set(groupSets.map((s) => s.exercise_id))];
  const doneCount = (id: string) =>
    groupSets.filter((s) => s.exercise_id === id && s.is_done).length;
  const mine = doneCount(ticked.exercise_id);

  // A partner with fewer completed sets is still owed one in this round.
  const behind = exerciseIds.find((id) => doneCount(id) < mine);
  if (behind) {
    const name =
      groupSets.find((s) => s.exercise_id === behind)?.exercise.name ??
      "the next exercise";
    return { kind: "cue", text: `No rest — straight into ${name}` };
  }

  // Every exercise in the group is level: the round is done, so rest.
  return { kind: "timer", seconds: REST_BETWEEN_SETS, label: "Rest" };
}
