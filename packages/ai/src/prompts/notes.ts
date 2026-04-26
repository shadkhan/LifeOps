import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type NoteSummaryPromptInput = {
  title: string;
  body: string;
  tags?: string[];
};

const noteSummaryOutputShape: JsonObject = {
  summary: "Concise summary",
  keyPoints: ["Important point"],
  possibleNextActions: ["Possible next action"],
  relatedGoalSuggestions: ["Optional related goal idea"],
  relatedTaskSuggestions: ["Optional related task idea"],
};

export function buildNoteSummaryPrompt(note: NoteSummaryPromptInput) {
  return buildAIPrompt({
    workflow: "Note Summary",
    task: "Summarize the note and extract reviewable next-action suggestions.",
    context: note,
    outputShape: noteSummaryOutputShape,
    extraRules: [
      "Do not add facts that are not present in the note.",
      "Keep the summary short enough to display inside a note card.",
    ],
  });
}
