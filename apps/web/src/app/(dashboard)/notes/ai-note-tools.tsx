"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  expandIdeaAction,
  saveExpandedIdeaAction,
  saveNoteSummaryAction,
  summarizeNoteAction,
  type IdeaExpansionState,
  type NoteActionState,
  type NoteSummaryState,
} from "./actions";

const initialSummaryState: NoteSummaryState = {
  ok: false,
  message: "",
  summary: null,
};

const initialIdeaState: IdeaExpansionState = {
  ok: false,
  message: "",
  expansion: null,
};

const initialSaveState: NoteActionState = {
  ok: false,
  message: "",
};

export function AINoteSummary({ noteId }: { noteId: string }) {
  const [summaryState, summaryAction, isGenerating] = useActionState(summarizeNoteAction, initialSummaryState);
  const [saveState, saveAction, isSaving] = useActionState(saveNoteSummaryAction, initialSaveState);

  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3">
      <form action={summaryAction}>
        <input name="noteId" type="hidden" value={noteId} />
        <Button className="h-9 px-3" disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Summarizing..." : "Summarize note"}
        </Button>
      </form>
      {summaryState.message ? (
        <p className={summaryState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{summaryState.message}</p>
      ) : null}
      {summaryState.summary ? (
        <form action={saveAction} className="space-y-3">
          <input name="noteId" type="hidden" value={noteId} />
          <input name="summary" type="hidden" value={JSON.stringify(summaryState.summary)} />
          <p className="text-sm leading-6 text-muted-foreground">{summaryState.summary.summary}</p>
          {summaryState.summary.keyPoints.length ? (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {summaryState.summary.keyPoints.map((point) => (
                <li key={point}>- {point}</li>
              ))}
            </ul>
          ) : null}
          <Button className="h-9 px-3" disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save summary"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}

export function AIIdeaExpander() {
  const [ideaState, ideaAction, isGenerating] = useActionState(expandIdeaAction, initialIdeaState);
  const [saveState, saveAction, isSaving] = useActionState(saveExpandedIdeaAction, initialSaveState);

  return (
    <div className="space-y-4">
      <form action={ideaAction} className="space-y-3">
        <label className="block space-y-2 text-sm font-medium">
          <span>Idea</span>
          <textarea
            className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            name="idea"
            placeholder="Drop a rough thought here and review the expansion before saving it as a note."
            required
          />
        </label>
        <Button disabled={isGenerating} type="submit" variant="outline">
          <Sparkles className="h-4 w-4" />
          {isGenerating ? "Expanding..." : "Expand idea"}
        </Button>
      </form>
      {ideaState.message ? (
        <p className={ideaState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{ideaState.message}</p>
      ) : null}
      {ideaState.expansion ? (
        <form action={saveAction} className="space-y-3 rounded-md border bg-muted/30 p-4">
          <input name="expansion" type="hidden" value={JSON.stringify(ideaState.expansion)} />
          <p className="text-sm font-semibold">{ideaState.expansion.title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{ideaState.expansion.summary}</p>
          <p className="text-sm leading-6 text-muted-foreground">{ideaState.expansion.whyItMatters}</p>
          {ideaState.expansion.nextSteps.length ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input name="saveTasks" type="checkbox" />
              Save suggested next steps as tasks
            </label>
          ) : null}
          <Button disabled={isSaving} type="submit">
            {isSaving ? "Saving..." : "Save reviewed idea"}
          </Button>
          {saveState.message ? (
            <p className={saveState.ok ? "text-sm text-emerald-700" : "text-sm text-red-700"}>{saveState.message}</p>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
