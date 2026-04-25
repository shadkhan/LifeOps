import { z } from "zod";

export const idSchema = z.string().cuid();

export const prioritySchema = z.enum(["low", "medium", "high"]);
export const goalStatusSchema = z.enum(["active", "paused", "completed", "archived"]);
export const taskStatusSchema = z.enum(["todo", "in_progress", "done", "archived"]);
export const habitFrequencySchema = z.enum(["daily", "weekdays", "weekly", "monthly", "custom"]);
export const habitStatusSchema = z.enum(["active", "paused", "archived"]);
export const lifeAreaTypeSchema = z.enum([
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

export const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120).optional(),
});

export const futureSelfSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  identityStatement: z.string().min(1).max(5000),
});

export const lifeAreaSchema = z.object({
  futureSelfId: idSchema.optional(),
  name: z.string().min(1).max(120),
  type: lifeAreaTypeSchema.default("other"),
  vision: z.string().max(5000).optional(),
  currentReality: z.string().max(5000).optional(),
  gap: z.string().max(5000).optional(),
});

export const goalSchema = z.object({
  lifeAreaId: idSchema,
  title: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  status: goalStatusSchema.default("active"),
  priority: prioritySchema.default("medium"),
  targetDate: z.coerce.date().optional(),
  progress: z.number().int().min(0).max(100).default(0),
});

const habitBaseSchema = z.object({
  goalId: idSchema.optional(),
  name: z.string().min(1).max(160),
  description: z.string().max(5000).optional(),
  frequency: habitFrequencySchema,
  customFrequency: z.string().max(240).optional(),
  reminderTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:mm format.")
    .optional(),
  streak: z.number().int().min(0).default(0),
  status: habitStatusSchema.default("active"),
});

export const habitSchema = habitBaseSchema.superRefine((value, ctx) => {
  if (value.frequency === "custom" && !value.customFrequency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Custom habits require customFrequency.",
      path: ["customFrequency"],
    });
  }
});

export const habitLogSchema = z.object({
  habitId: idSchema,
  date: z.coerce.date(),
  completed: z.boolean().default(true),
  note: z.string().max(1000).optional(),
});

export const taskSchema = z.object({
  goalId: idSchema.optional(),
  title: z.string().min(1).max(180),
  description: z.string().max(5000).optional(),
  dueDate: z.coerce.date().optional(),
  priority: prioritySchema.default("medium"),
  status: taskStatusSchema.default("todo"),
});

export const noteSchema = z.object({
  goalId: idSchema.optional(),
  habitId: idSchema.optional(),
  taskId: idSchema.optional(),
  lifeAreaId: idSchema.optional(),
  title: z.string().min(1).max(180),
  body: z.string().min(1).max(50000),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
  aiSummary: z.string().max(5000).optional(),
});

export const dailyPlanEntrySchema = z.object({
  title: z.string().min(1).max(160),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  focus: z.string().min(1).max(1000),
  linkedGoalId: idSchema.optional(),
});

export const dailyPlanSchema = z.object({
  date: z.coerce.date(),
  priorities: z.array(z.string().min(1).max(160)).max(5).default([]),
  plan: z.array(dailyPlanEntrySchema).min(1),
  suggestedTasks: z
    .array(
      z.object({
        title: z.string().min(1).max(180),
        reason: z.string().min(1).max(1000),
        linkedGoalId: idSchema.optional(),
      }),
    )
    .default([]),
  reflectionPrompt: z.string().max(1000).optional(),
  aiProvider: z.string().max(80).optional(),
  aiModel: z.string().max(120).optional(),
});

export const weeklyReviewSchema = z.object({
  weekStart: z.coerce.date(),
  weekEnd: z.coerce.date(),
  summary: z.string().min(1).max(10000),
  wins: z.array(z.string().min(1).max(1000)).default([]),
  gaps: z.array(z.string().min(1).max(1000)).default([]),
  habitInsights: z.array(z.string().min(1).max(1000)).default([]),
  goalProgress: z.array(z.string().min(1).max(1000)).default([]),
  nextWeekSuggestions: z.array(z.string().min(1).max(1000)).default([]),
  aiContent: z.record(z.unknown()).optional(),
  aiProvider: z.string().max(80).optional(),
  aiModel: z.string().max(120).optional(),
});

export const updateFutureSelfSchema = futureSelfSchema.partial();
export const updateLifeAreaSchema = lifeAreaSchema.partial();
export const updateGoalSchema = goalSchema.partial();
export const updateHabitSchema = habitBaseSchema.partial();
export const updateTaskSchema = taskSchema.partial();
export const updateNoteSchema = noteSchema.partial();

export type UserInput = z.infer<typeof userSchema>;
export type FutureSelfInput = z.infer<typeof futureSelfSchema>;
export type LifeAreaInput = z.infer<typeof lifeAreaSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
export type HabitLogInput = z.infer<typeof habitLogSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type DailyPlanInput = z.infer<typeof dailyPlanSchema>;
export type WeeklyReviewInput = z.infer<typeof weeklyReviewSchema>;
