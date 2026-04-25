"use client";

import type { dailyPlannerResponseSchema } from "@lifeops/shared";
import { LoaderCircle, Sparkles } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { generateDailyPlanAction, saveDailyPlanAction, type GeneratedPlanState, type SavePlanState } from "./actions";

const initialSaveState: SavePlanState = {
  ok: true,
  message: "",
};

export function AIPlannerPanel({
  existingPlan,
}: {
  existingPlan: {
    id: string;
  } | null;
}) {
  const [generated, setGenerated] = useState<GeneratedPlanState | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [saveState, saveAction, isSaving] = useActionState(saveDailyPlanAction, initialSaveState);

  function generatePlan() {
    startGenerate(async () => {
      setGenerated(await generateDailyPlanAction());
    });
  }

  return (
    <div className="space-y-4">
      <Button disabled={isGenerating} onClick={generatePlan} type="button">
        {isGenerating ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Planning...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Plan My Day
          </>
        )}
      </Button>

      {isGenerating ? (
        <div className="space-y-3 rounded-md border bg-muted/30 p-4" role="status">
          <div className="loader-progress" />
          <div className="skeleton-shimmer h-4 w-2/3 rounded bg-muted" />
          <div className="skeleton-shimmer h-4 w-full rounded bg-muted" />
          <div className="skeleton-shimmer h-4 w-5/6 rounded bg-muted" />
        </div>
      ) : null}

      {generated?.message ? (
        <p
          className={
            generated.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {generated.message}
        </p>
      ) : null}

      {generated?.ok && generated.plan ? (
        <PlanReview
          existingPlan={existingPlan}
          isSaving={isSaving}
          model={generated.model}
          plan={generated.plan}
          provider={generated.provider}
          saveAction={saveAction}
          saveMessage={saveState}
        />
      ) : (
        <p className="rounded-md border border-dashed bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          Click Plan My Day to generate a suggested plan. Nothing is saved until you review and save it.
        </p>
      )}
    </div>
  );
}

function PlanReview({
  existingPlan,
  isSaving,
  model,
  plan,
  provider,
  saveAction,
  saveMessage,
}: {
  existingPlan: { id: string } | null;
  isSaving: boolean;
  model?: string;
  plan: z.infer<typeof dailyPlannerResponseSchema>;
  provider?: string;
  saveAction: (formData: FormData) => void;
  saveMessage: SavePlanState;
}) {
  return (
    <form action={saveAction} className="space-y-4">
      <input name="plan" type="hidden" value={JSON.stringify(plan)} />
      <input name="provider" type="hidden" value={provider ?? ""} />
      <input name="model" type="hidden" value={model ?? ""} />

      <div className="space-y-4 rounded-md border bg-card p-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">Daily focus</p>
          <p className="mt-1 text-lg font-semibold">{plan.dailyFocus}</p>
        </div>

        <Section title="Top priorities">
          <ol className="space-y-2">
            {plan.priorities.slice(0, 3).map((priority, index) => (
              <li className="rounded-md border bg-muted/30 p-3 text-sm" key={`${priority}-${index}`}>
                {index + 1}. {priority}
              </li>
            ))}
          </ol>
        </Section>

        <Section title="Suggested schedule blocks">
          <div className="space-y-2">
            {plan.plan.map((block, index) => (
              <div className="rounded-md border bg-muted/30 p-3" key={`${block.title}-${index}`}>
                <p className="text-sm font-medium">{block.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {[block.startTime, block.endTime].filter(Boolean).join(" - ") || "Flexible"}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{block.focus}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Habits to complete">
          {plan.habitsToComplete.length ? (
            <div className="flex flex-wrap gap-2">
              {plan.habitsToComplete.map((habit) => (
                <span className="rounded-md border bg-muted/30 px-2 py-1 text-sm" key={habit}>
                  {habit}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No habits suggested.</p>
          )}
        </Section>

        <Section title="One improvement suggestion">
          <p className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
            {plan.improvementSuggestion}
          </p>
        </Section>

        <Section title="Reflection prompt">
          <p className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
            {plan.reflectionPrompt}
          </p>
        </Section>
      </div>

      {existingPlan ? (
        <label className="flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <input className="h-4 w-4 accent-primary" name="overwriteConfirmed" type="checkbox" />
          A plan already exists for today. Confirm overwrite to replace it.
        </label>
      ) : null}

      {saveMessage.message ? (
        <p
          className={
            saveMessage.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {saveMessage.message}
        </p>
      ) : null}

      <Button disabled={isSaving} type="submit">
        {isSaving ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save plan"
        )}
      </Button>
    </form>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium">{title}</p>
      {children}
    </div>
  );
}
