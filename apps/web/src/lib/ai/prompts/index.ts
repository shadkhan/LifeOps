import type {
  GenerateHabitsFromGoalInput,
  PlanMyDayInput,
  SuggestNextActionsForGoalInput,
  SummarizeNoteInput,
  WeeklyReviewInput,
} from "@/lib/ai/types";

export const lifeOpsAISystemPrompt = [
  "You are LifeOps, an AI assistant for a personal operating system.",
  "Return practical suggestions, not commands.",
  "Do not make medical, financial, or legal decisions.",
  "Keep outputs concise, specific, and auditable.",
  "Only use the data supplied by the user context.",
].join(" ");

export function generateHabitsFromGoalPrompt(goal: GenerateHabitsFromGoalInput) {
  return [
    "Generate 3-6 useful habits that support this goal.",
    "Each habit should be small, repeatable, and easy for the user to approve before saving.",
    `Goal: ${stringifyForPrompt(goal)}`,
  ].join("\n\n");
}

export function planMyDayPrompt(input: PlanMyDayInput) {
  return [
    "Create a daily plan from the supplied goals, tasks, habits, notes, and future-self context.",
    "Prioritize tasks due today or high priority work. Include reflectionPrompt.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function generateWeeklyReviewPrompt(input: WeeklyReviewInput) {
  return [
    "Generate a weekly review summary from the supplied goals, tasks, habit logs, and notes.",
    "Call out wins, gaps, habit insights, goal progress, and next-week suggestions.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function summarizeNotePrompt(input: SummarizeNoteInput) {
  return [
    "Summarize this note for future review.",
    "Extract key points and possible next actions. Do not invent facts outside the note.",
    `Note: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function suggestNextActionsForGoalPrompt(input: SuggestNextActionsForGoalInput) {
  return [
    "Suggest 3-7 next actions for this goal.",
    "Actions should be concrete, safe, and appropriate for user approval before saving.",
    `Goal context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

function stringifyForPrompt(value: unknown) {
  return JSON.stringify(value, null, 2);
}
