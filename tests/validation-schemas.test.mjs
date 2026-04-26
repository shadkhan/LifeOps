import assert from "node:assert/strict";
import test from "node:test";

import {
  dailyPlannerResponseSchema,
  futureSelfGenerationResponseSchema,
  goalBreakdownResponseSchema,
  taskCreationResponseSchema,
  weeklyReviewResponseSchema,
} from "../packages/shared/src/schemas/ai.ts";
import {
  goalSchema,
  habitSchema,
  noteSchema,
  taskSchema,
} from "../packages/shared/src/schemas/lifeops.ts";

test("goal schema accepts valid MVP goal input", () => {
  const parsed = goalSchema.parse({
    lifeAreaId: "clx0000000000000000000000",
    title: "Ship LifeOps MVP",
    description: "Complete the core operating system modules.",
    status: "active",
    priority: "high",
    targetDate: "2026-05-30",
    progress: 40,
  });

  assert.equal(parsed.title, "Ship LifeOps MVP");
  assert.equal(parsed.progress, 40);
});

test("habit schema requires custom frequency details for custom habits", () => {
  const parsed = habitSchema.safeParse({
    name: "Custom review cadence",
    frequency: "custom",
    status: "active",
  });

  assert.equal(parsed.success, false);
});

test("task schema rejects invalid status values", () => {
  const parsed = taskSchema.safeParse({
    title: "Review dashboard",
    status: "blocked",
  });

  assert.equal(parsed.success, false);
});

test("note schema normalizes default tags and requires body", () => {
  const parsed = noteSchema.safeParse({
    title: "Planning note",
    body: "Use notes as review context.",
  });

  assert.equal(parsed.success, true);
  assert.deepEqual(parsed.data.tags, []);
});

test("daily planner AI schema requires reviewable structured output", () => {
  const parsed = dailyPlannerResponseSchema.parse({
    date: "2026-04-25",
    dailyFocus: "Protect deep work.",
    priorities: ["Finish polish"],
    plan: [{ title: "Deep work", focus: "Finish MVP polish" }],
    habitsToComplete: ["Daily planning"],
    suggestedTasks: [],
    improvementSuggestion: "Stop after the checklist is done.",
    reflectionPrompt: "What created alignment today?",
  });

  assert.equal(parsed.dailyFocus, "Protect deep work.");
});

test("weekly review AI schema includes patterns for aiContent storage", () => {
  const parsed = weeklyReviewResponseSchema.parse({
    summary: "Good progress.",
    wins: ["Shipped modules"],
    gaps: ["Need tests"],
    patterns: ["Morning focus helped"],
    habitInsights: ["Planning worked"],
    goalProgress: ["MVP moved forward"],
    nextWeekSuggestions: ["Keep scope tight"],
  });

  assert.deepEqual(parsed.patterns, ["Morning focus helped"]);
});

test("phase 2 future self AI schema requires reviewable life areas", () => {
  const parsed = futureSelfGenerationResponseSchema.parse({
    title: "Calm builder",
    description: "A focused future self profile.",
    identityStatement: "I build steadily and protect what matters.",
    lifeAreas: [
      {
        name: "Health",
        type: "health",
        vision: "Have enough energy for focused work.",
      },
    ],
  });

  assert.equal(parsed.lifeAreas[0].type, "health");
});

test("phase 2 goal breakdown AI schema validates selectable tasks and habits", () => {
  const parsed = goalBreakdownResponseSchema.parse({
    summary: "Break the goal into steady progress.",
    milestones: ["First milestone"],
    habits: [{ name: "Daily review", frequency: "daily", reason: "Keeps the goal visible." }],
    tasks: [{ title: "Pick next step", priority: "medium", sourceType: "goal", reason: "Clarifies action." }],
    risks: [],
    successMetrics: ["Weekly progress update"],
  });

  assert.equal(parsed.tasks[0].sourceType, "goal");
});

test("phase 2 task creation AI schema validates source-aware tasks", () => {
  const parsed = taskCreationResponseSchema.parse({
    tasks: [{ title: "Write first draft", priority: "low", sourceType: "idea", reason: "Creates a starting point." }],
  });

  assert.equal(parsed.tasks[0].priority, "low");
});
