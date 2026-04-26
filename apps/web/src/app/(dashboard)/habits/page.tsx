import { CalendarCheck, Flame, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getGoalOptionsForHabits, getHabitsForUser, getTodayDate } from "@/lib/db/habits";
import { cn } from "@/lib/utils";
import {
  CompleteHabitButton,
  DeleteHabitButton,
  EditHabitPanel,
  MissedHabitReflectionForm,
  NewHabitPanel,
} from "./forms";
import { AIHabitSuggestions } from "./ai-habit-suggestions";

export default async function HabitsPage() {
  const user = await requireCurrentUser();
  const [habits, goals] = await Promise.all([getHabitsForUser(user.id), getGoalOptionsForHabits(user.id)]);
  const today = getTodayDate();
  const activeHabits = habits.filter((habit) => habit.status === "active");

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Habits</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Build repeatable actions linked to goals, complete today&apos;s habits, and reflect when something gets missed.
          </p>
        </div>
      </section>

      <section>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s habits</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-4">
            {activeHabits.length ? (
              activeHabits.map((habit) => {
                const todayLog = habit.logs.find((log) => isSameDay(log.date, today));
                const completedToday = todayLog?.completed ?? false;

                return (
                  <div className="rounded-md border bg-muted/30 p-4" key={habit.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{habit.name}</p>
                          <StreakBadge streak={habit.streak} />
                        </div>
                        <p className="mt-1 text-sm capitalize text-muted-foreground">
                          {formatOption(habit.frequency)}
                          {habit.goal ? ` · ${habit.goal.title}` : ""}
                          {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
                        </p>
                      </div>
                      <CompleteHabitButton completedToday={completedToday} habitId={habit.id} />
                    </div>

                    {!completedToday ? (
                      <div className="mt-4 border-t pt-4">
                        <MissedHabitReflectionForm habitId={habit.id} />
                      </div>
                    ) : todayLog?.note ? (
                      <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                        Reflection: {todayLog.note}
                      </p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No active habits for today"
                description="Create an active habit to start tracking daily completion and streaks."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <NewHabitPanel goals={goals} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>AI habit suggestions</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AIHabitSuggestions goals={goals} />
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold">Habit list</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {habits.length} {habits.length === 1 ? "habit" : "habits"} tracked
          </p>
        </div>

        {habits.length ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {habits.map((habit) => (
              <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" key={habit.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="leading-6">{habit.name}</CardTitle>
                      <StatusBadge status={habit.status} />
                    </div>
                    <p className="mt-1 text-sm capitalize text-muted-foreground">
                      {formatOption(habit.frequency)}
                      {habit.customFrequency ? ` · ${habit.customFrequency}` : ""}
                    </p>
                  </div>
                  <DeleteHabitButton habitId={habit.id} />
                </CardHeader>
                <CardContent className="space-y-5">
                  {habit.description ? <p className="text-sm leading-6 text-muted-foreground">{habit.description}</p> : null}

                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniMetric label="Streak" value={`${habit.streak}`} />
                    <MiniMetric label="Goal" value={habit.goal?.title ?? "Unlinked"} />
                    <MiniMetric label="Reminder" value={habit.reminderTime ?? "None"} />
                  </div>

                  <div className="space-y-3">
                    <p className="text-sm font-medium">Recent logs</p>
                    {habit.logs.length ? (
                      <div className="space-y-2">
                        {habit.logs.map((log) => (
                          <div className="rounded-md border bg-background p-3" key={log.id}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-medium">{formatDate(log.date)}</p>
                              <span
                                className={cn(
                                  "rounded-md border px-2 py-1 text-xs",
                                  log.completed
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-amber-200 bg-amber-50 text-amber-800",
                                )}
                              >
                                {log.completed ? "Completed" : "Missed"}
                              </span>
                            </div>
                            {log.note ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{log.note}</p> : null}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm leading-6 text-muted-foreground">No logs yet. Complete or reflect on today to begin.</p>
                    )}
                  </div>

                  <EditHabitPanel goals={goals} habit={habit} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No habits yet"
            description="Create a small repeatable action, optionally link it to a goal, and use today completion to build momentum."
          />
        )}
      </section>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
          <Flame className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium">{value}</p>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
      <Flame className="h-3 w-3" />
      {streak} streak
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs capitalize",
        status === "active" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        status === "paused" && "border-amber-200 bg-amber-50 text-amber-800",
        status === "archived" && "border-slate-200 bg-slate-50 text-slate-700",
      )}
    >
      {status}
    </span>
  );
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}
