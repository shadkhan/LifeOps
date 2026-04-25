import { idSchema } from "@lifeops/shared";
import { ArrowLeft, CalendarDays, CheckSquare, Flame, Target } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getGoalForUser, getLifeAreasForGoalForms } from "@/lib/db/goals";
import { cn } from "@/lib/utils";
import { DeleteGoalButton, EditGoalForm, GoalStatusForm } from "../forms";

export default async function GoalDetailPage({
  params,
}: {
  params: Promise<{ goalId: string }>;
}) {
  const user = await requireCurrentUser();
  const { goalId } = await params;
  const parsedGoalId = idSchema.safeParse(goalId);

  if (!parsedGoalId.success) {
    notFound();
  }

  const [goal, lifeAreas] = await Promise.all([
    getGoalForUser(user.id, parsedGoalId.data),
    getLifeAreasForGoalForms(user.id),
  ]);

  if (!goal) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="-ml-3 mb-2">
            <Link href="/goals">
              <ArrowLeft className="h-4 w-4" />
              Back to goals
            </Link>
          </Button>
          <p className="text-sm font-medium text-muted-foreground">{goal.lifeArea.name}</p>
          <h2 className="mt-1 max-w-4xl text-3xl font-semibold tracking-normal">{goal.title}</h2>
          {goal.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{goal.description}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <GoalStatusForm goalId={goal.id} status={goal.status} />
          <DeleteGoalButton goalId={goal.id} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Progress" value={`${goal.progress}%`} tone="primary" />
        <MetricCard label="Priority" value={goal.priority} tone={goal.priority} />
        <MetricCard label="Status" value={goal.status.replaceAll("_", " ")} tone="muted" />
      </section>

      <Card>
        <CardContent className="p-5">
          <GoalProgress progress={goal.progress} />
          <div className="mt-4 grid gap-3 text-sm text-muted-foreground md:grid-cols-2">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {goal.targetDate ? `Target ${formatDate(goal.targetDate)}` : "No target date set"}
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Linked to {goal.lifeArea.name}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Edit goal</CardTitle>
          </CardHeader>
          <CardContent>
            <EditGoalForm goal={goal} lifeAreas={lifeAreas} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Linked habits</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {goal.habits.length ? (
                goal.habits.map((habit) => (
                  <div className="rounded-md border bg-muted/30 p-3" key={habit.id}>
                    <p className="text-sm font-medium">{habit.name}</p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {habit.frequency} · {habit.status} · {habit.streak} streak
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">No habits linked to this goal yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Linked tasks</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3">
              {goal.tasks.length ? (
                goal.tasks.map((task) => (
                  <div className="rounded-md border bg-muted/30 p-3" key={task.id}>
                    <p className="text-sm font-medium">{task.title}</p>
                    <p className="mt-1 text-xs capitalize text-muted-foreground">
                      {task.status.replaceAll("_", " ")} · {task.priority}
                      {task.dueDate ? ` · Due ${formatDate(task.dueDate)}` : ""}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">No tasks linked to this goal yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-2 text-2xl font-semibold capitalize",
            tone === "high" && "text-red-700",
            tone === "medium" && "text-amber-800",
            tone === "low" && "text-emerald-800",
            tone === "primary" && "text-primary",
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function GoalProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Goal progress</span>
        <span className="text-muted-foreground">{progress}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
