import { Activity, Brain, DollarSign, KeyRound, LockKeyhole, Settings, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@lifeops/db";
import { getAISettings, getAIUsageDashboard } from "@/server/services/ai-service";
import { ChangePasswordForm, ProfileDetailsForm } from "./account-forms";
import { AISettingsForm } from "./ai-settings-form";

const keyStatuses = [
  { label: "OpenAI", env: "OPENAI_API_KEY" },
  { label: "Anthropic", env: "ANTHROPIC_API_KEY" },
  { label: "Groq", env: "GROQ_API_KEY" },
];

export default async function AdminPage() {
  const [settings, currentUser] = await Promise.all([
    getAISettings(),
    requireCurrentUser(),
  ]);
  const [user, usage] = await Promise.all([
    db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        email: true,
        name: true,
        username: true,
        passwordHash: true,
      },
    }),
    getAIUsageDashboard(),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-muted-foreground">LifeOps</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">Admin</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Manage global AI provider settings. API keys stay server-side in environment variables and are never shown in
          the browser.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>User details</CardTitle>
            <UserRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ProfileDetailsForm
              email={user?.email ?? currentUser.email}
              name={user?.name ?? currentUser.name}
              username={user?.username ?? currentUser.username}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Change password</CardTitle>
            <LockKeyhole className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <ChangePasswordForm hasPassword={Boolean(user?.passwordHash)} />
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Global AI settings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <AISettingsForm model={settings.model} provider={settings.provider} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Server key status</CardTitle>
            <KeyRound className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            {keyStatuses.map((item) => {
              const configured = Boolean(process.env[item.env]);
              return (
                <div className="flex items-center justify-between rounded-md border bg-muted/30 p-3" key={item.env}>
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.env}</p>
                  </div>
                  <span
                    className={
                      configured
                        ? "rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-800"
                        : "rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-800"
                    }
                  >
                    {configured ? "Configured" : "Missing"}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>AI execution policy</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
            AI calls are not automatic. LifeOps service functions are server-only and should only be invoked from explicit
            user actions such as Generate habits, Plan my day, Generate weekly review, Summarize note, or Suggest next
            actions.
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard icon={Activity} label="AI calls" value={usage.summary.total.toLocaleString()} />
        <MetricCard icon={Brain} label="Fallbacks" value={usage.summary.fallback.toLocaleString()} />
        <MetricCard icon={KeyRound} label="Errors" value={usage.summary.failed.toLocaleString()} />
        <MetricCard icon={DollarSign} label="Estimated cost" value={formatUsd(usage.summary.estimatedCostUsd)} />
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>AI access log</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Input tokens</p>
              <p className="mt-1 font-semibold">{usage.summary.inputTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Output tokens</p>
              <p className="mt-1 font-semibold">{usage.summary.outputTokens.toLocaleString()}</p>
            </div>
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">Total tokens</p>
              <p className="mt-1 font-semibold">{usage.summary.totalTokens.toLocaleString()}</p>
            </div>
          </div>

          {usage.logs.length ? (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Time</th>
                    <th className="px-3 py-2 font-medium">Feature</th>
                    <th className="px-3 py-2 font-medium">Provider</th>
                    <th className="px-3 py-2 font-medium">Model</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Tokens</th>
                    <th className="px-3 py-2 font-medium">Cost</th>
                    <th className="px-3 py-2 font-medium">Latency</th>
                    <th className="px-3 py-2 font-medium">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {usage.logs.map((log) => (
                    <tr className="border-t" key={log.id}>
                      <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-3 py-2 font-medium">{formatFeature(log.feature)}</td>
                      <td className="px-3 py-2 capitalize">{log.provider}</td>
                      <td className="px-3 py-2 text-muted-foreground">{log.model}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {(log.totalTokens ?? 0).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{formatUsd(Number(log.estimatedCostUsd ?? 0))}</td>
                      <td className="px-3 py-2 text-muted-foreground">{log.latencyMs} ms</td>
                      <td className="max-w-[340px] px-3 py-2 text-muted-foreground">
                        <span className="line-clamp-2">{log.errorMessage ?? "Request completed."}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-md border border-dashed bg-muted/30 p-6 text-sm text-muted-foreground">
              No AI calls have been logged yet. Generate a plan, summary, or suggestion to populate this access log.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "fallback"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-red-200 bg-red-50 text-red-700";

  return <span className={`rounded-md border px-2 py-1 text-xs capitalize ${className}`}>{status}</span>;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 4,
    maximumFractionDigits: 6,
  }).format(value);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function formatFeature(feature: string) {
  return feature.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}
