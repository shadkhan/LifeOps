import { Brain, CalendarCheck, CheckSquare, Flame, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { getAIPlannerContext } from "@/lib/db/ai-planner";
import { AIPlannerPanel } from "./ai-planner-panel";

export default async function AiPlannerPage() {
  const user = await requireCurrentUser();
  const context = await getAIPlannerContext(user.id);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">LifeOps AI</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">AI Daily Planner</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Generate a suggested plan from your future self, active goals, today&apos;s tasks, overdue tasks, and active habits.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Target} label="Active goals" value={context.activeGoals.length} />
        <MetricCard icon={CheckSquare} label="Today tasks" value={context.todayTasks.length} />
        <MetricCard icon={CalendarCheck} label="Overdue tasks" value={context.overdueTasks.length} />
        <MetricCard icon={Flame} label="Active habits" value={context.activeHabits.length} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Plan generator</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AIPlannerPanel existingPlan={context.existingPlan ? { id: context.existingPlan.id } : null} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Future self context</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {context.futureSelf ? (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium">{context.futureSelf.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{context.futureSelf.identityStatement}</p>
                </div>
              ) : (
                <p className="rounded-md border border-dashed bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
                  No future self profile yet. The planner will still work, but identity context improves the result.
                </p>
              )}
            </CardContent>
          </Card>

          {context.existingPlan ? <ExistingPlanCard existingPlan={context.existingPlan} /> : null}
        </div>
      </section>
    </div>
  );
}

function ExistingPlanCard({
  existingPlan,
}: {
  existingPlan: {
    priorities: string[];
    reflectionPrompt: string | null;
    aiProvider: string | null;
    aiModel: string | null;
    updatedAt: Date;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Saved plan for today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Last updated {formatDateTime(existingPlan.updatedAt)}
          {existingPlan.aiProvider ? ` · ${existingPlan.aiProvider}` : ""}
          {existingPlan.aiModel ? ` · ${existingPlan.aiModel}` : ""}
        </p>
        <div className="space-y-2">
          {existingPlan.priorities.map((priority, index) => (
            <div className="rounded-md border bg-muted/30 p-3 text-sm" key={`${priority}-${index}`}>
              {index + 1}. {priority}
            </div>
          ))}
        </div>
        {existingPlan.reflectionPrompt ? (
          <p className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
            {existingPlan.reflectionPrompt}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
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

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
