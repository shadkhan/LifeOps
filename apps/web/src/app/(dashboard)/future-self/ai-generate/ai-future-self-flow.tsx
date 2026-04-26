"use client";

import type { FutureSelfGenerationResponse } from "@lifeops/shared";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AIGenerateCard } from "@/components/ai/ai-generate-card";
import { AIProviderStatus } from "@/components/ai/ai-provider-status";
import { AIReviewSavePanel } from "@/components/ai/ai-review-save-panel";
import { AISuggestionList, type AISuggestionListItem } from "@/components/ai/ai-suggestion-list";
import { Button } from "@/components/ui/button";
import {
  generateFutureSelfAction,
  saveGeneratedFutureSelfAction,
} from "@/server/actions/ai/generate-future-self";
import type { ActionResult } from "@/server/actions/ai/_utils";

type GenerateResult = ActionResult<FutureSelfGenerationResponse>;
type SaveResult = ActionResult<{ futureSelfId: string; goalsCreated: number; habitsCreated: number }>;

export function AIFutureSelfFlow() {
  const [prompt, setPrompt] = useState("");
  const [generated, setGenerated] = useState<GenerateResult | null>(null);
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null);
  const [selectedLifeAreas, setSelectedLifeAreas] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [isGenerating, startGenerate] = useTransition();
  const [isSaving, startSave] = useTransition();

  const profile = generated?.ok ? generated.data : null;

  useEffect(() => {
    if (!profile) {
      return;
    }

    setSelectedLifeAreas(profile.lifeAreas.map((_, index) => String(index)));
    setSelectedGoals(profile.suggestedGoals.map((_, index) => String(index)));
    setSelectedHabits(profile.suggestedHabits.map((_, index) => String(index)));
  }, [profile]);

  function generate() {
    const formData = new FormData();
    formData.set("prompt", prompt);
    setSaveResult(null);
    startGenerate(async () => {
      setGenerated(await generateFutureSelfAction(formData));
    });
  }

  function saveSelected() {
    if (!profile) {
      return;
    }

    const formData = new FormData();
    formData.set("generated", JSON.stringify(profile));
    formData.set("selectedLifeAreas", JSON.stringify(toNumberList(selectedLifeAreas)));
    formData.set("selectedGoals", JSON.stringify(toNumberList(selectedGoals)));
    formData.set("selectedHabits", JSON.stringify(toNumberList(selectedHabits)));
    startSave(async () => {
      setSaveResult(await saveGeneratedFutureSelfAction(formData));
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <Button asChild className="-ml-3 mb-2" variant="ghost">
          <Link href="/future-self">
            <ArrowLeft className="h-4 w-4" />
            Back to Future Self
          </Link>
        </Button>
        <p className="text-sm font-medium text-muted-foreground">LifeOps AI</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">Future Self Generator</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Describe the person you want to become. Review the generated profile, then choose which life areas,
          goals, and habits to save.
        </p>
      </div>

      <AIGenerateCard
        actions={{
          generateLabel: "Generate",
          regenerateLabel: "Regenerate",
          onCancel: profile ? () => setGenerated(null) : undefined,
          onGenerate: generate,
          showRegenerate: Boolean(profile),
        }}
        description="AI suggestions are never saved automatically."
        error={!isGenerating && generated && !generated.ok ? generated.message : null}
        isGenerating={isGenerating}
        provider={
          generated?.meta
            ? {
                name: generated.meta.provider,
                model: generated.meta.model,
                status: generated.meta.model === "fallback" ? "fallback" : "ready",
              }
            : undefined
        }
        title="Generate from a simple prompt"
      >
        <label className="block space-y-2 text-sm font-medium">
          <span>Future self prompt</span>
          <textarea
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary"
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="I want to become a disciplined AI engineer, healthy, financially stable, and consistent writer."
            value={prompt}
          />
        </label>
      </AIGenerateCard>

      {profile ? (
        <AIReviewSavePanel
          isSaving={isSaving}
          onCancel={() => setGenerated(null)}
          onSaveSelected={saveSelected}
          saveLabel="Save reviewed profile"
          selectedIds={[...selectedLifeAreas, ...selectedGoals, ...selectedHabits]}
          title="Review Future Self profile"
        >
          <div className="space-y-4">
            <section className="rounded-md border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">{profile.title}</p>
                  <p className="mt-2 text-base font-medium leading-7">{profile.identityStatement}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{profile.description}</p>
                </div>
                {generated?.meta ? (
                  <AIProviderStatus
                    model={generated.meta.model}
                    provider={generated.meta.provider}
                    status={generated.meta.model === "fallback" ? "fallback" : "ready"}
                  />
                ) : null}
              </div>
            </section>

            <ReviewSection
              items={profile.lifeAreas.map((area, index) => ({
                id: String(index),
                title: area.name,
                meta: area.type,
                description: [area.vision, area.currentReality ? `Current: ${area.currentReality}` : null, area.gap ? `Gap: ${area.gap}` : null]
                  .filter(Boolean)
                  .join("\n"),
              }))}
              onSelectionChange={setSelectedLifeAreas}
              selectedIds={selectedLifeAreas}
              title="Life areas"
            />

            <ReviewSection
              emptyDescription="The generated profile did not include suggested goals."
              items={profile.suggestedGoals.map((goal, index) => ({
                id: String(index),
                title: goal.title,
                meta: `${goal.lifeAreaName} · ${goal.priority} priority`,
                description: `${goal.description}\n${goal.reason}`,
              }))}
              onSelectionChange={setSelectedGoals}
              selectedIds={selectedGoals}
              title="Suggested goals"
            />

            <ReviewSection
              emptyDescription="The generated profile did not include suggested habits."
              items={profile.suggestedHabits.map((habit, index) => ({
                id: String(index),
                title: habit.name,
                meta: [habit.frequency, habit.goalTitle, habit.suggestedReminderTime].filter(Boolean).join(" · "),
                description: habit.description ?? habit.reason,
              }))}
              onSelectionChange={setSelectedHabits}
              selectedIds={selectedHabits}
              title="Suggested habits"
            />
          </div>
        </AIReviewSavePanel>
      ) : null}

      {saveResult?.message ? (
        <div
          className={
            saveResult.ok
              ? "rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
              : "rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          }
        >
          <div className="flex gap-2">
            {saveResult.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : null}
            <div>
              <p className="font-medium">{saveResult.message}</p>
              {saveResult.ok ? (
                <p className="mt-1 text-emerald-800">
                  Saved {saveResult.data.goalsCreated} goals and {saveResult.data.habitsCreated} habits.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReviewSection({
  emptyDescription,
  items,
  onSelectionChange,
  selectedIds,
  title,
}: {
  emptyDescription?: string;
  items: AISuggestionListItem[];
  onSelectionChange: (ids: string[]) => void;
  selectedIds: string[];
  title: string;
}) {
  return (
    <section className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <AISuggestionList
        emptyDescription={emptyDescription}
        emptyTitle={`No ${title.toLowerCase()}`}
        items={items}
        onSelectionChange={onSelectionChange}
        selectedIds={selectedIds}
      />
    </section>
  );
}

function toNumberList(values: string[]) {
  return values.map((value) => Number(value)).filter((value) => Number.isInteger(value) && value >= 0);
}
