import { z } from "zod";

export const generatedHabitSchema = z.object({
  name: z.string().min(1),
  frequency: z.string().min(1),
  suggestedReminderTime: z.string().optional(),
  reason: z.string().min(1),
});

export const habitGenerationResponseSchema = z.object({
  habits: z.array(generatedHabitSchema).min(1).max(10),
});

export const dailyPlanBlockSchema = z.object({
  title: z.string().min(1),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  focus: z.string().min(1),
  linkedGoalId: z.string().optional(),
});

export const dailyPlannerResponseSchema = z.object({
  date: z.string().min(1),
  priorities: z.array(z.string().min(1)).min(1).max(5),
  plan: z.array(dailyPlanBlockSchema).min(1),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string().min(1),
        reason: z.string().min(1),
        linkedGoalId: z.string().optional(),
      }),
    )
    .default([]),
  reflectionPrompt: z.string().min(1),
});

export const weeklyReviewResponseSchema = z.object({
  summary: z.string().min(1),
  wins: z.array(z.string().min(1)).default([]),
  gaps: z.array(z.string().min(1)).default([]),
  habitInsights: z.array(z.string().min(1)).default([]),
  goalProgress: z.array(z.string().min(1)).default([]),
  nextWeekSuggestions: z.array(z.string().min(1)).default([]),
});

export const noteSummaryResponseSchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).default([]),
  possibleNextActions: z.array(z.string().min(1)).default([]),
});

export const nextActionsResponseSchema = z.object({
  actions: z
    .array(
      z.object({
        title: z.string().min(1),
        reason: z.string().min(1),
        effort: z.enum(["low", "medium", "high"]),
      }),
    )
    .min(1)
    .max(10),
});

export type HabitGenerationResponse = z.infer<typeof habitGenerationResponseSchema>;
export type DailyPlannerResponse = z.infer<typeof dailyPlannerResponseSchema>;
export type WeeklyReviewResponse = z.infer<typeof weeklyReviewResponseSchema>;
export type NoteSummaryResponse = z.infer<typeof noteSummaryResponseSchema>;
export type NextActionsResponse = z.infer<typeof nextActionsResponseSchema>;
