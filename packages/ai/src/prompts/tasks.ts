import "server-only";

import { buildAIPrompt, type JsonObject } from "../prompt-builder";

export type TaskCreationSource = {
  sourceType: "goal" | "habit" | "note" | "idea";
  sourceTitle: string;
  sourceBody?: string | null;
  linkedGoalId?: string | null;
  context?: string | null;
};

const taskOutputShape: JsonObject = {
  tasks: [
    {
      title: "Concrete task",
      description: "Optional save-ready task detail",
      priority: "medium",
      dueDate: "Optional ISO date",
      sourceType: "idea",
      reason: "Why this task is useful",
    },
  ],
};

export function buildTaskCreationPrompt(source: TaskCreationSource) {
  return buildAIPrompt({
    workflow: "Task Creation",
    task: "Create 3-8 practical tasks from the supplied source.",
    context: source,
    outputShape: taskOutputShape,
    extraRules: [
      "sourceType must match the supplied sourceType.",
      "Priority must be low, medium, or high.",
      "Tasks should be concrete enough to save directly after review.",
    ],
  });
}
