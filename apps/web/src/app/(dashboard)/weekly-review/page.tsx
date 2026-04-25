import { CalendarCheck, CheckSquare, Flame, NotebookText, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { formatDateInput, getWeeklyReviewContext, parseWeekStart } from "@/lib/db/weekly-review";
import { WeeklyReviewPanel } from "./weekly-review-panel";

export default async function WeeklyReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ weekStart?: string }>;
}) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const weekStart = parseWeekStart(params.weekStart);
  const context = await getWeeklyReviewContext(user.id, weekStart);
  const completedHabitLogs = context.habitLogs.filter((log) => log.completed).length;

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">LifeOps AI</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">Weekly Review</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Generate a review from tasks, habits, goals, and notes for the selected week.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard icon={CheckSquare} label="Completed tasks" value={context.completedTasks.length} />
        <MetricCard icon={CalendarCheck} label="Incomplete tasks" value={context.incompleteTasks.length} />
        <MetricCard icon={Flame} label="Habit logs" value={`${completedHabitLogs}/${context.habitLogs.length}`} />
        <MetricCard icon={Target} label="Goals reviewed" value={context.goals.length} />
        <MetricCard icon={NotebookText} label="Notes this week" value={context.notes.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Generate review</CardTitle>
          </CardHeader>
          <CardContent>
            <WeeklyReviewPanel
              selectedWeekStart={formatDateInput(context.weekStart)}
              weekEnd={formatDateInput(context.weekEnd)}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Selected week</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-muted-foreground">
                {formatDate(context.weekStart)} through {formatDate(addDays(context.weekEnd, -1))}
              </p>
            </CardContent>
          </Card>

          {context.existingReview ? (
            <Card>
              <CardHeader>
                <CardTitle>Saved review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-muted-foreground">{context.existingReview.summary}</p>
                <ReviewList title="Wins" items={context.existingReview.wins} />
                <ReviewList title="Next week suggestions" items={context.existingReview.nextWeekSuggestions} />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="p-6">
                <p className="text-sm font-medium">No saved review for this week</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Generate a review, inspect the output, then save it when it looks useful.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function ReviewList({ items, title }: { items: string[]; title: string }) {
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-2">
          {items.slice(0, 3).map((item, index) => (
            <li className="rounded-md border bg-muted/30 p-3 text-sm leading-6" key={`${item}-${index}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">No saved items.</p>
      )}
    </div>
  );
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
