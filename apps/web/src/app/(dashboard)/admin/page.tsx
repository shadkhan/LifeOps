import { Brain, KeyRound, LockKeyhole, Settings, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCurrentUser } from "@/lib/auth/current-user";
import { db } from "@lifeops/db";
import { getAISettings } from "@/server/services/ai-service";
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
  const user = await db.user.findUnique({
    where: { id: currentUser.id },
    select: {
      email: true,
      name: true,
      username: true,
      passwordHash: true,
    },
  });

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
    </div>
  );
}
