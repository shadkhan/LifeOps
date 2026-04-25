import {
  ArrowRight,
  BookOpenText,
  Brain,
  CalendarCheck,
  CheckCircle2,
  CheckSquare,
  Flame,
  Sparkles,
  Target,
} from "lucide-react";
import Link from "next/link";
import { CompleteHabitButton } from "@/app/(dashboard)/habits/forms";
import { CompleteTaskButton } from "@/app/(dashboard)/tasks/forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getDashboardData } from "@/lib/db/dashboard";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const data = await getDashboardData(user.id);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">{user.name ?? "LifeOps User"}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            A calm command center for today&apos;s actions, long-term goals, and weekly reflection.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={CheckSquare}
          label="Weekly tasks"
          supportingText="Completed this week"
          value={`${data.weeklyCompletedTasks}/${data.weeklyTotalTasks}`}
        />
        <MetricCard
          icon={Flame}
          label="Habit completion"
          supportingText={`${data.weeklyHabitLogs} habit logs this week`}
          value={`${data.habitCompletionPercentage}%`}
        />
        <MetricCard
          icon={Target}
          label="Active goals"
          supportingText="Currently in motion"
          value={String(data.activeGoals.length)}
        />
        <MetricCard
          icon={BookOpenText}
          label="Recent notes"
          supportingText="Latest captured context"
          value={String(data.recentNotes.length)}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todayTasks.length ? (
              data.todayTasks.map((task) => (
                <div className="flex items-start justify-between gap-3 rounded-md border bg-card p-3" key={task.id}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={task.priority} />
                      {task.goal ? <span className="text-xs text-muted-foreground">{task.goal.title}</span> : null}
                    </div>
                    <p className="mt-2 text-sm font-medium">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{task.description}</p>
                    ) : null}
                  </div>
                  <CompleteTaskButton completed={false} taskId={task.id} />
                </div>
              ))
            ) : (
              <EmptyCardText
                actionHref="/tasks"
                actionLabel="Create a task"
                text="No tasks due today. Add one if there is a concrete action that needs attention."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Future self identity</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {data.futureSelf ? (
              <div className="rounded-md border bg-muted/50 p-4">
                <p className="text-sm font-medium">{data.futureSelf.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{data.futureSelf.identityStatement}</p>
              </div>
            ) : (
              <EmptyCardText
                actionHref="/future-self"
                actionLabel="Define future self"
                text="Create your future self profile so today’s work has a clear identity anchor."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Today&apos;s habits</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.todayHabits.length ? (
              data.todayHabits.map((habit) => {
                const completedToday = habit.logs.some((log) => log.completed);

                return (
                  <div className="flex items-start justify-between gap-3 rounded-md border bg-card p-3" key={habit.id}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{habit.name}</p>
                        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800">
                          {habit.streak} streak
                        </span>
                      </div>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">
                        {habit.frequency}
                        {habit.goal ? ` · ${habit.goal.title}` : ""}
                        {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
                      </p>
                    </div>
                    <CompleteHabitButton completedToday={completedToday} habitId={habit.id} />
                  </div>
                );
              })
            ) : (
              <EmptyCardText
                actionHref="/habits"
                actionLabel="Create a habit"
                text="No active habits yet. Add one repeatable action to start building consistency."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Active goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.activeGoals.length ? (
              data.activeGoals.map((goal) => (
                <Link
                  className="group block rounded-md border bg-card p-3 transition-colors hover:bg-muted/60"
                  href={`/goals/${goal.id}`}
                  key={goal.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={goal.priority} />
                        <span className="text-xs text-muted-foreground">{goal.lifeArea.name}</span>
                      </div>
                      <p className="mt-2 text-sm font-medium">{goal.title}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${goal.progress}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{goal.progress}% complete</p>
                </Link>
              ))
            ) : (
              <EmptyCardText
                actionHref="/goals"
                actionLabel="Create a goal"
                text="No active goals yet. Create a goal connected to a life area to give your dashboard direction."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Recent notes</CardTitle>
            <BookOpenText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentNotes.length ? (
              data.recentNotes.map((note) => (
                <Link className="block rounded-md border bg-card p-3 transition-colors hover:bg-muted/60" href="/notes" key={note.id}>
                  <p className="text-sm font-medium">{note.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{note.body}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {note.tags.slice(0, 3).map((tag) => (
                      <span className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground" key={tag}>
                        #{tag}
                      </span>
                    ))}
                    {note.goal ? <span className="text-xs text-muted-foreground">Goal: {note.goal.title}</span> : null}
                    {note.habit ? <span className="text-xs text-muted-foreground">Habit: {note.habit.name}</span> : null}
                    {note.task ? <span className="text-xs text-muted-foreground">Task: {note.task.title}</span> : null}
                  </div>
                </Link>
              ))
            ) : (
              <EmptyCardText
                actionHref="/notes"
                actionLabel="Create a note"
                text="No notes yet. Capture reflections, decisions, or observations as context for review."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>AI suggestion</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-dashed bg-muted/40 p-4">
              <div className="flex items-start gap-3">
                <LightbulbIcon />
                <div>
                  <p className="text-sm font-medium">Suggestion placeholder</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Once AI planning is connected here, LifeOps can suggest a next action from your active goals,
                    today&apos;s tasks, habit consistency, and recent notes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  supportingText,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  supportingText: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{supportingText}</p>
      </CardContent>
    </Card>
  );
}

function EmptyCardText({
  actionHref,
  actionLabel,
  text,
}: {
  actionHref: string;
  actionLabel: string;
  text: string;
}) {
  return (
    <div className="rounded-md border border-dashed bg-muted/30 p-4">
      <p className="text-sm leading-6 text-muted-foreground">{text}</p>
      <Link className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary" href={actionHref}>
        {actionLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={cn(
        "rounded-md border px-2 py-1 text-xs capitalize",
        priority === "high" && "border-red-200 bg-red-50 text-red-700",
        priority === "medium" && "border-amber-200 bg-amber-50 text-amber-800",
        priority === "low" && "border-emerald-200 bg-emerald-50 text-emerald-800",
      )}
    >
      {priority}
    </span>
  );
}

function LightbulbIcon() {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
      <Brain className="h-4 w-4" />
    </span>
  );
}
