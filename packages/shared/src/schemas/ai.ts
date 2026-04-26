import { z } from "zod";

export const aiSourceTypeSchema = z.enum(["goal", "habit", "note", "idea"]);
export const aiPrioritySchema = z.enum(["low", "medium", "high"]);
export const aiHabitFrequencySchema = z.enum(["daily", "weekdays", "weekly", "monthly", "custom"]);
export const aiLifeAreaTypeSchema = z.enum([
  "health",
  "career",
  "relationships",
  "finance",
  "learning",
  "creativity",
  "spirituality",
  "home",
  "other",
]);

export const generatedHabitSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().optional(),
    frequency: aiHabitFrequencySchema,
    suggestedReminderTime: z.string().optional(),
    reason: z.string().min(1),
  })
  .strict();

export const generatedGoalSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    lifeAreaName: z.string().min(1),
    priority: aiPrioritySchema.default("medium"),
    targetDate: z.string().optional(),
    reason: z.string().min(1),
  })
  .strict();

export const generatedTaskSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().optional(),
    priority: aiPrioritySchema.default("medium"),
    dueDate: z.string().optional(),
    sourceType: aiSourceTypeSchema.default("idea"),
    reason: z.string().min(1),
  })
  .strict();

export const futureSelfHabitSuggestionSchema = generatedHabitSchema
  .extend({
    lifeAreaName: z.string().optional(),
    goalTitle: z.string().optional(),
  })
  .strict();

export const futureSelfLifeAreaSuggestionSchema = z
  .object({
    name: z.string().min(1),
    type: aiLifeAreaTypeSchema,
    vision: z.string().min(1),
    currentReality: z.string().optional(),
    gap: z.string().optional(),
  })
  .strict();

export const futureSelfGenerationResponseSchema = z
  .object({
    title: z.string().min(1),
    description: z.string().min(1),
    identityStatement: z.string().min(1),
    lifeAreas: z.array(futureSelfLifeAreaSuggestionSchema).min(1).max(8),
    suggestedGoals: z.array(generatedGoalSchema).default([]),
    suggestedHabits: z.array(futureSelfHabitSuggestionSchema).default([]),
  })
  .strict();

export const futureSelfProfileGenerationSchema = futureSelfGenerationResponseSchema;

export const goalsFromFutureSelfResponseSchema = z
  .object({
    goals: z.array(generatedGoalSchema).min(1).max(10),
  })
  .strict();

export const goalsFromFutureSelfSchema = goalsFromFutureSelfResponseSchema;

export const goalBreakdownResponseSchema = z
  .object({
    summary: z.string().min(1),
    milestones: z.array(z.string().min(1)).default([]),
    habits: z.array(generatedHabitSchema).default([]),
    tasks: z.array(generatedTaskSchema).default([]),
    risks: z.array(z.string().min(1)).default([]),
    successMetrics: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const goalBreakdownSchema = goalBreakdownResponseSchema;

export const habitGenerationResponseSchema = z
  .object({
    habits: z.array(generatedHabitSchema).min(1).max(10),
  })
  .strict();

export const habitSuggestionResponseSchema = habitGenerationResponseSchema;

export const habitSuggestionsSchema = habitSuggestionResponseSchema;

export const taskCreationResponseSchema = z
  .object({
    tasks: z.array(generatedTaskSchema).min(1).max(10),
  })
  .strict();

export const taskCreationSchema = taskCreationResponseSchema;

export const ideaExpansionResponseSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    whyItMatters: z.string().min(1),
    nextSteps: z.array(generatedTaskSchema).default([]),
    relatedHabits: z.array(generatedHabitSchema).default([]),
    questions: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const ideaExpansionSchema = ideaExpansionResponseSchema;

export const dailyPlanBlockSchema = z
  .object({
    title: z.string().min(1),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    focus: z.string().min(1),
    linkedGoalId: z.string().optional(),
  })
  .strict();

export const dailyPlannerSuggestedTaskSchema = z
  .object({
        title: z.string().min(1),
        reason: z.string().min(1),
        linkedGoalId: z.string().optional(),
      })
  .strict();

export const dailyPlannerResponseSchema = z
  .object({
    date: z.string().min(1),
    dailyFocus: z.string().min(1),
    priorities: z.array(z.string().min(1)).min(1).max(5),
    plan: z.array(dailyPlanBlockSchema).min(1),
    habitsToComplete: z.array(z.string().min(1)).default([]),
    suggestedTasks: z.array(dailyPlannerSuggestedTaskSchema).default([]),
    avoidList: z.array(z.string().min(1)).default([]),
    improvementSuggestion: z.string().min(1),
    reflectionPrompt: z.string().min(1),
  })
  .strict();

export const dailyPlannerSchema = dailyPlannerResponseSchema;

export const weeklyReviewResponseSchema = z
  .object({
    summary: z.string().min(1),
    wins: z.array(z.string().min(1)).default([]),
    gaps: z.array(z.string().min(1)).default([]),
    patterns: z.array(z.string().min(1)).default([]),
    habitInsights: z.array(z.string().min(1)).default([]),
    goalProgress: z.array(z.string().min(1)).default([]),
    nextWeekSuggestions: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const noteSummaryResponseSchema = z
  .object({
    summary: z.string().min(1),
    keyPoints: z.array(z.string().min(1)).default([]),
    possibleNextActions: z.array(z.string().min(1)).default([]),
    relatedGoalSuggestions: z.array(z.string().min(1)).default([]),
    relatedTaskSuggestions: z.array(z.string().min(1)).default([]),
  })
  .strict();

export const noteSummarySchema = noteSummaryResponseSchema;

export const nextActionSuggestionSchema = z
  .object({
        title: z.string().min(1),
        reason: z.string().min(1),
    effort: aiPrioritySchema,
  })
  .strict();

export const nextActionsResponseSchema = z
  .object({
    actions: z.array(nextActionSuggestionSchema).min(1).max(10),
  })
  .strict();

export type HabitGenerationResponse = z.infer<typeof habitGenerationResponseSchema>;
export type FutureSelfGenerationResponse = z.infer<typeof futureSelfGenerationResponseSchema>;
export type FutureSelfProfileGeneration = z.infer<typeof futureSelfProfileGenerationSchema>;
export type FutureSelfHabitSuggestion = z.infer<typeof futureSelfHabitSuggestionSchema>;
export type GoalsFromFutureSelfResponse = z.infer<typeof goalsFromFutureSelfResponseSchema>;
export type GoalsFromFutureSelf = z.infer<typeof goalsFromFutureSelfSchema>;
export type GoalBreakdownResponse = z.infer<typeof goalBreakdownResponseSchema>;
export type GoalBreakdown = z.infer<typeof goalBreakdownSchema>;
export type HabitSuggestionResponse = z.infer<typeof habitSuggestionResponseSchema>;
export type HabitSuggestions = z.infer<typeof habitSuggestionsSchema>;
export type TaskCreationResponse = z.infer<typeof taskCreationResponseSchema>;
export type TaskCreation = z.infer<typeof taskCreationSchema>;
export type IdeaExpansionResponse = z.infer<typeof ideaExpansionResponseSchema>;
export type IdeaExpansion = z.infer<typeof ideaExpansionSchema>;
export type DailyPlannerResponse = z.infer<typeof dailyPlannerResponseSchema>;
export type DailyPlanner = z.infer<typeof dailyPlannerSchema>;
export type WeeklyReviewResponse = z.infer<typeof weeklyReviewResponseSchema>;
export type WeeklyReview = z.infer<typeof weeklyReviewResponseSchema>;
export type NoteSummaryResponse = z.infer<typeof noteSummaryResponseSchema>;
export type NoteSummary = z.infer<typeof noteSummarySchema>;
export type NextActionsResponse = z.infer<typeof nextActionsResponseSchema>;
export type AISourceType = z.infer<typeof aiSourceTypeSchema>;
