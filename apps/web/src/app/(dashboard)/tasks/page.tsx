import { idSchema, taskStatusSchema } from "@lifeops/shared";
import { CalendarDays, CheckSquare, Filter, Sparkles } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getGoalOptionsForTasks, getTasksForUser, type TaskView } from "@/lib/db/tasks";
import { cn } from "@/lib/utils";
import { AITaskGenerator } from "./ai-task-generator";
import { CompleteTaskButton, DeleteTaskButton, EditTaskPanel, NewTaskPanel } from "./forms";

const taskViews: Array<{ value: TaskView; label: string }> = [
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "overdue", label: "Overdue" },
];

const statusFilters = ["all", ...taskStatusSchema.options] as const;

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; goalId?: string; status?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const view = parseView(params.view);
  const goalId = parseGoalFilter(params.goalId);
  const status = parseStatusFilter(params.status);
  const [goals, tasks] = await Promise.all([
    getGoalOptionsForTasks(user.id),
    getTasksForUser(user.id, {
      view,
      goalId,
      status,
    }),
  ]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">Tasks</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage concrete work by due date, priority, status, and linked goal.
          </p>
        </div>
      </section>

      <NewTaskPanel goals={goals} />

      <section className="space-y-4">
        <div className="rounded-md border bg-card p-4">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filters
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.8fr_0.9fr_1.3fr]">
            <FilterGroup label="View">
              {taskViews.map((item) => (
                <FilterLink
                  active={view === item.value}
                  href={buildTasksHref({ view: item.value, goalId, status })}
                  key={item.value}
                  label={item.label}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Status">
              {statusFilters.map((option) => (
                <FilterLink
                  active={status === option}
                  href={buildTasksHref({ view, goalId, status: option })}
                  key={option}
                  label={formatOption(option)}
                />
              ))}
            </FilterGroup>

            <FilterGroup label="Linked goal">
              <FilterLink active={goalId === "all"} href={buildTasksHref({ view, goalId: "all", status })} label="All" />
              {goals.map((goal) => (
                <FilterLink
                  active={goalId === goal.id}
                  href={buildTasksHref({ view, goalId: goal.id, status })}
                  key={goal.id}
                  label={goal.title}
                />
              ))}
            </FilterGroup>
          </div>
        </div>

        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold">{taskViews.find((item) => item.value === view)?.label} tasks</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {tasks.length} {tasks.length === 1 ? "task" : "tasks"} shown
            </p>
          </div>
        </div>

        {tasks.length ? (
          <div className="grid gap-4">
            {tasks.map((task) => (
              <Card className="overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" key={task.id}>
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                        {task.goal ? (
                          <span className="rounded-md border bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
                            {task.goal.title}
                          </span>
                        ) : null}
                      </div>
                      <h4 className={cn("text-lg font-semibold", task.status === "done" && "text-muted-foreground line-through")}>
                        {task.title}
                      </h4>
                      {task.description ? (
                        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{task.description}</p>
                      ) : null}
                      <p className={cn("flex items-center gap-2 text-sm text-muted-foreground", isOverdue(task.dueDate, task.status) && "text-red-700")}>
                        <CalendarDays className="h-4 w-4" />
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <CompleteTaskButton completed={task.status === "done"} taskId={task.id} />
                      <DeleteTaskButton taskId={task.id} />
                    </div>
                  </div>

                  <EditTaskPanel goals={goals} task={task} />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-muted">
                <CheckSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">No tasks in this view</p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Create a task, set a due date, and link it to a goal when it supports a larger outcome.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>AI task creator</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Use this when you want LifeOps to turn an idea, note, goal, or habit into reviewable task suggestions.
            </p>
          </div>
          <Sparkles className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <AITaskGenerator goals={goals} />
        </CardContent>
      </Card>
    </div>
  );
}

function FilterGroup({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
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
        "max-w-full truncate rounded-md border bg-background px-3 py-1.5 text-sm capitalize text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        active && "border-primary/40 bg-muted text-foreground",
      )}
      href={href}
    >
      {label}
    </Link>
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

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-md border bg-muted/60 px-2 py-1 text-xs capitalize text-muted-foreground">
      {formatOption(status)}
    </span>
  );
}

function parseView(value: string | undefined): TaskView {
  if (value === "upcoming" || value === "completed" || value === "overdue") {
    return value;
  }

  return "today";
}

function parseGoalFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  return idSchema.safeParse(value).success ? value : "all";
}

function parseStatusFilter(value: string | undefined) {
  if (!value || value === "all") {
    return "all";
  }

  const parsed = taskStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "all";
}

function buildTasksHref({
  view,
  goalId,
  status,
}: {
  view: TaskView;
  goalId: string;
  status: string;
}) {
  const params = new URLSearchParams();

  if (view !== "today") {
    params.set("view", view);
  }

  if (goalId !== "all") {
    params.set("goalId", goalId);
  }

  if (status !== "all") {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/tasks?${query}` : "/tasks";
}

function isOverdue(dueDate: Date | null, status: string) {
  if (!dueDate || status === "done") {
    return false;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return dueDate < today;
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
