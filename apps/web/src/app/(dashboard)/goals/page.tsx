import type { GoalStatus } from "@lifeops/db";
import { goalStatusSchema, idSchema } from "@lifeops/shared";
import { ArrowRight, Filter, Target } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getGoalsForUser, getLifeAreasForGoalForms } from "@/lib/db/goals";
import { cn } from "@/lib/utils";
import { CreateGoalForm, DeleteGoalButton, GoalStatusForm } from "./forms";

const statusFilters = ["all", ...goalStatusSchema.options] as const;

export default async function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; lifeAreaId?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const status = parseStatusFilter(params.status);
  const lifeAreaId = parseLifeAreaFilter(params.lifeAreaId);
  const [lifeAreas, goals] = await Promise.all([
    getLifeAreasForGoalForms(user.id),
    getGoalsForUser(user.id, {
      status,
      lifeAreaId,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Goals</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Turn life-area vision into concrete outcomes with priority, target dates, status, and progress.
          </p>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Create goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <CreateGoalForm lifeAreas={lifeAreas} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Filters</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">Status</p>
              <div className="flex flex-wrap gap-2">
                {statusFilters.map((option) => (
                  <FilterLink
                    active={status === option}
                    href={buildGoalsHref({ status: option, lifeAreaId })}
                    key={option}
                    label={formatOption(option)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Life area</p>
              <div className="flex flex-wrap gap-2">
                <FilterLink
                  active={lifeAreaId === "all"}
                  href={buildGoalsHref({ status, lifeAreaId: "all" })}
                  label="All"
                />
                {lifeAreas.map((lifeArea) => (
                  <FilterLink
                    active={lifeAreaId === lifeArea.id}
                    href={buildGoalsHref({ status, lifeAreaId: lifeArea.id })}
                    key={lifeArea.id}
                    label={lifeArea.name}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">Goal list</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {goals.length} {goals.length === 1 ? "goal" : "goals"} shown
            </p>
          </div>
        </div>

        {goals.length ? (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" key={goal.id}>
                <CardContent className="p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PriorityBadge priority={goal.priority} />
                          <span className="rounded-md border bg-muted/60 px-2 py-1 text-xs capitalize text-muted-foreground">
                            {goal.lifeArea.name}
                          </span>
                          {goal.targetDate ? (
                            <span className="text-xs text-muted-foreground">
                              Target {formatDate(goal.targetDate)}
                            </span>
                          ) : null}
                        </div>
                        <Link className="group inline-flex items-center gap-2 text-lg font-semibold" href={`/goals/${goal.id}`}>
                          {goal.title}
                          <ArrowRight className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                        {goal.description ? (
                          <p className="line-clamp-2 max-w-3xl text-sm leading-6 text-muted-foreground">{goal.description}</p>
                        ) : null}
                      </div>

                      <GoalProgress progress={goal.progress} />
                    </div>

                    <div className="flex items-center gap-2">
                      <GoalStatusForm goalId={goal.id} status={goal.status} />
                      <DeleteGoalButton goalId={goal.id} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No goals yet</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Create your first goal after adding a Future Self life area. A good goal is specific, connected to a
                  life area, and measurable enough to update progress.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function FilterLink({
  active,
  href,
  label,
}: {
  active: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      className={cn(
        "rounded-md border bg-background px-3 py-1.5 text-sm capitalize text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "border-primary/40 bg-muted text-foreground",
      )}
      href={href}
    >
      {label}
    </Link>
  );
}

function GoalProgress({ progress }: { progress: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
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
      {priority} priority
    </span>
  );
}

function parseStatusFilter(value: string | undefined): GoalStatus | "all" {
  if (value === "all" || !value) {
    return "all";
  }

  const parsed = goalStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "all";
}

function parseLifeAreaFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return idSchema.safeParse(value).success ? value : "all";
}

function buildGoalsHref({
  status,
  lifeAreaId,
}: {
  status: GoalStatus | "all";
  lifeAreaId: string;
}) {
  const params = new URLSearchParams();

  if (status !== "all") {
    params.set("status", status);
  }

  if (lifeAreaId !== "all") {
    params.set("lifeAreaId", lifeAreaId);
  }

  const query = params.toString();
  return query ? `/goals?${query}` : "/goals";
}

function formatOption(value: string) {
  return value.replaceAll("_", " ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
