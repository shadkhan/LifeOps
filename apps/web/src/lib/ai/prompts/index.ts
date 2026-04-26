import type {
  BreakDownGoalInput,
  CreateTasksInput,
  ExpandIdeaInput,
  GenerateFutureSelfInput,
  GenerateGoalsFromFutureSelfInput,
  GenerateHabitsFromGoalInput,
  PlanMyDayInput,
  SuggestHabitsFromContextInput,
  SuggestNextActionsForGoalInput,
  SummarizeNoteInput,
  WeeklyReviewInput,
} from "@/lib/ai/types";

export const lifeOpsAISystemPrompt = [
  "You are LifeOps, an AI assistant for a personal operating system.",
  "Return practical suggestions, not commands.",
  "Do not make medical, financial, or legal decisions.",
  "Return JSON only that matches the requested schema.",
  "The user must review every suggestion before saving, so keep suggestions easy to inspect.",
  "Keep outputs concise, specific, and auditable.",
  "Only use the data supplied by the user context.",
].join(" ");

export function generateFutureSelfProfilePrompt(input: GenerateFutureSelfInput) {
  return [
    "Generate a Future Self profile from the user's textbox prompt.",
    "Return a concise profile with life areas. Do not assume sensitive details not supplied.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function generateGoalsFromFutureSelfPrompt(input: GenerateGoalsFromFutureSelfInput) {
  return [
    "Generate 3-8 goals that translate the future self and life areas into concrete outcomes.",
    "Match lifeAreaName to one of the supplied life areas when possible. Avoid duplicating existing goals.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function breakDownGoalPrompt(input: BreakDownGoalInput) {
  return [
    "Break this goal into reviewable milestones, habits, tasks, risks, and success metrics.",
    "Tasks should be concrete next actions. Habits should be small and repeatable.",
    `Goal context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function generateHabitsFromGoalPrompt(goal: GenerateHabitsFromGoalInput) {
  return [
    "Generate 3-6 useful habits that support this goal.",
    "Each habit should be small, repeatable, and easy for the user to approve before saving.",
    `Goal: ${stringifyForPrompt(goal)}`,
  ].join("\n\n");
}

export function suggestHabitsFromContextPrompt(input: SuggestHabitsFromContextInput) {
  return [
    "Suggest 3-6 habits from the user's current LifeOps context.",
    "Prefer missing or reinforcing habits that connect to active goals. Do not duplicate current habits.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function createTasksPrompt(input: CreateTasksInput) {
  return [
    "Create 3-8 practical tasks from the supplied source.",
    "Tasks must be reviewable before saving and should not require AI to make final decisions for the user.",
    `Source: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function expandIdeaPrompt(input: ExpandIdeaInput) {
  return [
    "Expand the user's idea into a concise LifeOps planning note.",
    "Include next steps, possible supporting habits, and clarifying questions. Keep it safe and practical.",
    `Idea context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function planMyDayPrompt(input: PlanMyDayInput) {
  return [
    "Create a daily plan from the supplied goals, tasks, habits, notes, and future-self context.",
    "Prioritize tasks due today or high priority work. Include avoidList and reflectionPrompt.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function generateWeeklyReviewPrompt(input: WeeklyReviewInput) {
  return [
    "Generate a weekly review summary from the supplied goals, tasks, habit logs, notes, and daily plans.",
    "Call out wins, gaps, habit insights, goal progress, and next-week suggestions.",
    `Context: ${stringifyForPrompt(input)}`,
  ].join("\n\n");
}

export function summarizeNotePrompt(input: SummarizeNoteInput) {
  return [
    "Summarize this note for future review.",
    "Extract key points, possible next actions, and possible related goal/task suggestions. Do not invent facts outside the note.",
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
