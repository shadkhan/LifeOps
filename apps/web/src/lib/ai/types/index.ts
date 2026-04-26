import type { z } from "zod";
import {
  dailyPlannerResponseSchema,
  futureSelfGenerationResponseSchema,
  goalBreakdownResponseSchema,
  goalsFromFutureSelfResponseSchema,
  habitGenerationResponseSchema,
  habitSuggestionResponseSchema,
  ideaExpansionResponseSchema,
  nextActionsResponseSchema,
  noteSummaryResponseSchema,
  taskCreationResponseSchema,
  weeklyReviewResponseSchema,
} from "@lifeops/shared";

export type AIProviderId = "openai" | "anthropic" | "groq";

export const aiProviderOptions: Array<{ value: AIProviderId; label: string }> = [
  { value: "groq", label: "Groq" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
];

export const aiModelOptions: Record<AIProviderId, string[]> = {
  groq: ["llama-3.1-8b-instant", "llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct"],
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
  anthropic: ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
};

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
};

export type GenerateJsonInput<TSchema extends z.ZodType> = {
  messages: AIMessage[];
  model: string;
  output: JsonSchema;
  schema: TSchema;
  temperature?: number;
  maxTokens?: number;
};

export type AIClient = {
  provider: AIProviderId;
  generateJson<TSchema extends z.ZodType>(input: GenerateJsonInput<TSchema>): Promise<z.infer<TSchema>>;
};

export type AIServiceResult<T> =
  | {
      ok: true;
      data: T;
      provider: AIProviderId;
      model: string;
    }
  | {
      ok: false;
      error: string;
      provider: AIProviderId;
      model: string;
    };

export type GenerateHabitsFromGoalInput = {
  title: string;
  description?: string | null;
  targetDate?: Date | string | null;
};

export type GenerateFutureSelfInput = {
  prompt: string;
  existingFutureSelf?: string | null;
};

export type GenerateGoalsFromFutureSelfInput = {
  futureSelf: string;
  lifeAreas: Array<{ id: string; name: string; type: string; vision?: string | null; gap?: string | null }>;
  existingGoals?: Array<{ title: string; status: string }>;
};

export type BreakDownGoalInput = {
  id?: string;
  title: string;
  description?: string | null;
  lifeArea?: string | null;
  priority?: string;
  progress?: number;
  targetDate?: Date | string | null;
  tasks?: Array<{ title: string; status: string }>;
  habits?: Array<{ name: string; status: string; streak?: number }>;
};

export type SuggestHabitsFromContextInput = {
  futureSelf?: string | null;
  goals: Array<{ id: string; title: string; lifeArea?: string; priority?: string; progress?: number }>;
  currentHabits: Array<{ name: string; frequency: string; goal?: string | null; streak?: number }>;
  recentNotes?: Array<{ title: string; body: string }>;
};

export type CreateTasksInput = {
  sourceType: "goal" | "habit" | "note" | "idea";
  sourceTitle: string;
  sourceBody?: string | null;
  linkedGoalId?: string | null;
  context?: string | null;
};

export type ExpandIdeaInput = {
  idea: string;
  futureSelf?: string | null;
  activeGoals?: Array<{ title: string; lifeArea?: string; progress?: number }>;
};

export type PlanMyDayInput = {
  date: string;
  futureSelf?: string | null;
  goals: Array<{ id: string; title: string; priority?: string; progress?: number }>;
  tasks: Array<{ id: string; title: string; priority?: string; dueDate?: string | null }>;
  overdueTasks?: Array<{ id: string; title: string; priority?: string; dueDate?: string | null }>;
  habits: Array<{ id: string; name: string; streak?: number }>;
  notes?: Array<{ title: string; body: string }>;
  dailyPlans?: Array<{ date: string; priorities: string[]; reflectionPrompt?: string | null }>;
};

export type WeeklyReviewInput = {
  weekStart: string;
  weekEnd: string;
  goals: Array<{ title: string; progress: number; status: string }>;
  completedTasks: Array<{ title: string }>;
  incompleteTasks?: Array<{ title: string; status: string; dueDate?: string | null }>;
  habitLogs: Array<{ habitName: string; completed: boolean; date: string; reflection?: string | null }>;
  notes: Array<{ title: string; body: string }>;
  dailyPlans?: Array<{ date: string; priorities: string[]; reflectionPrompt?: string | null }>;
};

export type SummarizeNoteInput = {
  title: string;
  body: string;
  tags?: string[];
};

export type SuggestNextActionsForGoalInput = {
  title: string;
  description?: string | null;
  progress?: number;
  targetDate?: Date | string | null;
  tasks?: Array<{ title: string; status: string }>;
  habits?: Array<{ name: string; status: string; streak?: number }>;
  notes?: Array<{ title: string; body: string }>;
};

export const aiOutputSchemas = {
  futureSelfProfile: {
    name: "generate_future_self_profile",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "description", "identityStatement", "lifeAreas"],
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        identityStatement: { type: "string" },
        lifeAreas: {
          type: "array",
          minItems: 1,
          maxItems: 8,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "type", "vision"],
            properties: {
              name: { type: "string" },
              type: {
                type: "string",
                enum: ["health", "career", "relationships", "finance", "learning", "creativity", "spirituality", "home", "other"],
              },
              vision: { type: "string" },
              currentReality: { type: "string" },
              gap: { type: "string" },
            },
          },
        },
      },
    },
  },
  goalsFromFutureSelf: {
    name: "generate_goals_from_future_self",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["goals"],
      properties: {
        goals: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "description", "lifeAreaName", "priority", "reason"],
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              lifeAreaName: { type: "string" },
              priority: { type: "string", enum: ["low", "medium", "high"] },
              targetDate: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
  goalBreakdown: {
    name: "break_down_goal",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "milestones", "habits", "tasks", "risks", "successMetrics"],
      properties: {
        summary: { type: "string" },
        milestones: { type: "array", items: { type: "string" } },
        habits: { type: "array", items: generatedHabitJsonSchema() },
        tasks: { type: "array", items: generatedTaskJsonSchema() },
        risks: { type: "array", items: { type: "string" } },
        successMetrics: { type: "array", items: { type: "string" } },
      },
    },
  },
  habits: {
    name: "generate_habits_from_goal",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["habits"],
      properties: {
        habits: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["name", "frequency", "reason"],
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              frequency: { type: "string", enum: ["daily", "weekdays", "weekly", "monthly", "custom"] },
              suggestedReminderTime: { type: "string" },
              reason: { type: "string" },
            },
          },
        },
      },
    },
  },
  habitSuggestions: {
    name: "suggest_habits_from_context",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["habits"],
      properties: {
        habits: { type: "array", minItems: 1, maxItems: 10, items: generatedHabitJsonSchema() },
      },
    },
  },
  taskCreation: {
    name: "create_tasks_from_source",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["tasks"],
      properties: {
        tasks: { type: "array", minItems: 1, maxItems: 10, items: generatedTaskJsonSchema() },
      },
    },
  },
  ideaExpansion: {
    name: "expand_idea",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "summary", "whyItMatters", "nextSteps", "relatedHabits", "questions"],
      properties: {
        title: { type: "string" },
        summary: { type: "string" },
        whyItMatters: { type: "string" },
        nextSteps: { type: "array", items: generatedTaskJsonSchema() },
        relatedHabits: { type: "array", items: generatedHabitJsonSchema() },
        questions: { type: "array", items: { type: "string" } },
      },
    },
  },
  dayPlan: {
    name: "plan_my_day",
    schema: {
      type: "object",
      additionalProperties: false,
      required: [
        "date",
        "dailyFocus",
        "priorities",
        "plan",
        "habitsToComplete",
        "suggestedTasks",
        "improvementSuggestion",
        "reflectionPrompt",
      ],
      properties: {
        date: { type: "string" },
        dailyFocus: { type: "string" },
        priorities: { type: "array", minItems: 1, maxItems: 5, items: { type: "string" } },
        plan: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "focus"],
            properties: {
              title: { type: "string" },
              startTime: { type: "string" },
              endTime: { type: "string" },
              focus: { type: "string" },
              linkedGoalId: { type: "string" },
            },
          },
        },
        habitsToComplete: { type: "array", items: { type: "string" } },
        suggestedTasks: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "reason"],
            properties: {
              title: { type: "string" },
              reason: { type: "string" },
              linkedGoalId: { type: "string" },
            },
          },
        },
        avoidList: { type: "array", items: { type: "string" } },
        improvementSuggestion: { type: "string" },
        reflectionPrompt: { type: "string" },
      },
    },
  },
  weeklyReview: {
    name: "generate_weekly_review",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "wins", "gaps", "patterns", "habitInsights", "goalProgress", "nextWeekSuggestions"],
      properties: {
        summary: { type: "string" },
        wins: { type: "array", items: { type: "string" } },
        gaps: { type: "array", items: { type: "string" } },
        patterns: { type: "array", items: { type: "string" } },
        habitInsights: { type: "array", items: { type: "string" } },
        goalProgress: { type: "array", items: { type: "string" } },
        nextWeekSuggestions: { type: "array", items: { type: "string" } },
      },
    },
  },
  noteSummary: {
    name: "summarize_note",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "keyPoints", "possibleNextActions"],
      properties: {
        summary: { type: "string" },
        keyPoints: { type: "array", items: { type: "string" } },
        possibleNextActions: { type: "array", items: { type: "string" } },
        relatedGoalSuggestions: { type: "array", items: { type: "string" } },
        relatedTaskSuggestions: { type: "array", items: { type: "string" } },
      },
    },
  },
  nextActions: {
    name: "suggest_next_actions_for_goal",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["actions"],
      properties: {
        actions: {
          type: "array",
          minItems: 1,
          maxItems: 10,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["title", "reason", "effort"],
            properties: {
              title: { type: "string" },
              reason: { type: "string" },
              effort: { type: "string", enum: ["low", "medium", "high"] },
            },
          },
        },
      },
    },
  },
} satisfies Record<string, JsonSchema>;

export const aiZodSchemas = {
  futureSelfProfile: futureSelfGenerationResponseSchema,
  goalsFromFutureSelf: goalsFromFutureSelfResponseSchema,
  goalBreakdown: goalBreakdownResponseSchema,
  habits: habitGenerationResponseSchema,
  habitSuggestions: habitSuggestionResponseSchema,
  taskCreation: taskCreationResponseSchema,
  ideaExpansion: ideaExpansionResponseSchema,
  dayPlan: dailyPlannerResponseSchema,
  weeklyReview: weeklyReviewResponseSchema,
  noteSummary: noteSummaryResponseSchema,
  nextActions: nextActionsResponseSchema,
};

function generatedHabitJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["name", "frequency", "reason"],
    properties: {
      name: { type: "string" },
      description: { type: "string" },
      frequency: { type: "string", enum: ["daily", "weekdays", "weekly", "monthly", "custom"] },
      suggestedReminderTime: { type: "string" },
      reason: { type: "string" },
    },
  };
}

function generatedTaskJsonSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "priority", "sourceType", "reason"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      priority: { type: "string", enum: ["low", "medium", "high"] },
      dueDate: { type: "string" },
      sourceType: { type: "string", enum: ["goal", "habit", "note", "idea"] },
      reason: { type: "string" },
    },
  };
}
