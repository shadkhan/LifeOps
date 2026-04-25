"use client";

import type { weeklyReviewResponseSchema } from "@lifeops/shared";
import { LoaderCircle, RefreshCw, Save } from "lucide-react";
import { useActionState, useState, useTransition } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  generateWeeklyReviewAction,
  saveWeeklyReviewAction,
  type GeneratedWeeklyReviewState,
  type SaveWeeklyReviewState,
} from "./actions";

const initialSaveState: SaveWeeklyReviewState = {
  ok: true,
  message: "",
};

export function WeeklyReviewPanel({
  selectedWeekStart,
  weekEnd,
}: {
  selectedWeekStart: string;
  weekEnd: string;
}) {
  const [generated, setGenerated] = useState<GeneratedWeeklyReviewState | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [saveState, saveAction, isSaving] = useActionState(saveWeeklyReviewAction, initialSaveState);

  function generateReview(formData: FormData) {
    startGenerate(async () => {
      setGenerated(await generateWeeklyReviewAction(formData));
    });
  }

  return (
    <div className="space-y-4">
      <form action={generateReview} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="block space-y-2 text-sm font-medium">
          <span>Week of</span>
          <input
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            defaultValue={selectedWeekStart}
            name="weekStart"
            type="date"
          />
        </label>
        <Button disabled={isGenerating} type="submit">
          {isGenerating ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Generate review
            </>
          )}
        </Button>
      </form>

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

      {generated?.ok && generated.review ? (
        <ReviewResult
          isSaving={isSaving}
          model={generated.model}
          provider={generated.provider}
          review={generated.review}
          saveAction={saveAction}
          saveState={saveState}
          weekEnd={weekEnd}
          weekStart={selectedWeekStart}
        />
      ) : (
        <p className="rounded-md border border-dashed bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
          Generate or regenerate a weekly review. Nothing is saved until you click save.
        </p>
      )}
    </div>
  );
}

function ReviewResult({
  isSaving,
  model,
  provider,
  review,
  saveAction,
  saveState,
  weekEnd,
  weekStart,
}: {
  isSaving: boolean;
  model?: string;
  provider?: string;
  review: z.infer<typeof weeklyReviewResponseSchema>;
  saveAction: (formData: FormData) => void;
  saveState: SaveWeeklyReviewState;
  weekEnd: string;
  weekStart: string;
}) {
  return (
    <form action={saveAction} className="space-y-4">
      <input name="weekStart" type="hidden" value={weekStart} />
      <input name="weekEnd" type="hidden" value={weekEnd} />
      <input name="review" type="hidden" value={JSON.stringify(review)} />
      <input name="provider" type="hidden" value={provider ?? ""} />
      <input name="model" type="hidden" value={model ?? ""} />

      <div className="space-y-4 rounded-md border bg-card p-4">
        <Section title="Weekly summary">
          <p className="rounded-md border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">{review.summary}</p>
        </Section>
        <ListSection items={review.wins} title="Wins" />
        <ListSection items={review.gaps} title="Gaps" />
        <ListSection items={review.patterns} title="Patterns" />
        <ListSection items={review.goalProgress} title="Goal progress insight" />
        <ListSection items={review.habitInsights} title="Habit insight" />
        <ListSection items={review.nextWeekSuggestions} title="Next week suggestions" />
      </div>

      {saveState.message ? (
        <p
          className={
            saveState.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          }
        >
          {saveState.message}
        </p>
      ) : null}

      <Button disabled={isSaving} type="submit">
        {isSaving ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save review
          </>
        )}
      </Button>
    </form>
  );
}

function ListSection({ items, title }: { items: string[]; title: string }) {
  return (
    <Section title={title}>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li className="rounded-md border bg-muted/30 p-3 text-sm leading-6" key={`${item}-${index}`}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No items generated.</p>
      )}
    </Section>
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
