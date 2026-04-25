import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function main() {
  const today = startOfDay();
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@lifeops.local" },
    update: {
      username: "admin",
      name: "Admin",
      passwordHash,
    },
    create: {
      email: "admin@lifeops.local",
      username: "admin",
      name: "Admin",
      passwordHash,
    },
  });

  await prisma.weeklyReview.deleteMany({ where: { userId: user.id } });
  await prisma.dailyPlan.deleteMany({ where: { userId: user.id } });
  await prisma.note.deleteMany({ where: { userId: user.id } });
  await prisma.habitLog.deleteMany({ where: { userId: user.id } });
  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.habit.deleteMany({ where: { userId: user.id } });
  await prisma.goal.deleteMany({ where: { userId: user.id } });
  await prisma.lifeArea.deleteMany({ where: { userId: user.id } });
  await prisma.futureSelf.deleteMany({ where: { userId: user.id } });

  const futureSelf = await prisma.futureSelf.create({
    data: {
      userId: user.id,
      title: "Calm, healthy builder",
      identityStatement:
        "I am a focused, healthy, and calm builder who keeps promises to myself and makes steady progress on meaningful work.",
      description:
        "A future self oriented around deep work, strong health, honest reflection, and consistent daily execution.",
    },
  });

  const health = await prisma.lifeArea.create({
    data: {
      userId: user.id,
      futureSelfId: futureSelf.id,
      name: "Health and energy",
      type: "health",
      vision: "I train consistently, sleep well, and have steady energy through the day.",
      currentReality: "Energy is good on planned days but inconsistent when work runs late.",
      gap: "Protect evening shutdown and make workouts non-negotiable.",
    },
  });

  const career = await prisma.lifeArea.create({
    data: {
      userId: user.id,
      futureSelfId: futureSelf.id,
      name: "Deep work career",
      type: "career",
      vision: "I build valuable products through focused weekly execution.",
      currentReality: "Many ideas exist, but daily priorities need tighter sequencing.",
      gap: "Choose fewer important tasks and finish them before expanding scope.",
    },
  });

  const fitnessGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      lifeAreaId: health.id,
      title: "Build a 4-day strength routine",
      description: "Train before work four days per week and improve baseline energy.",
      status: "active",
      priority: "high",
      targetDate: addDays(today, 45),
      progress: 35,
    },
  });

  const productGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      lifeAreaId: career.id,
      title: "Ship LifeOps MVP",
      description: "Complete the core dashboard, CRUD modules, AI planner, and weekly review.",
      status: "active",
      priority: "high",
      targetDate: addDays(today, 21),
      progress: 70,
    },
  });

  const strengthHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      goalId: fitnessGoal.id,
      name: "Strength training",
      description: "Complete a focused workout before work.",
      frequency: "weekdays",
      reminderTime: "07:00",
      streak: 2,
      status: "active",
    },
  });

  const planningHabit = await prisma.habit.create({
    data: {
      userId: user.id,
      goalId: productGoal.id,
      name: "Daily planning review",
      description: "Review dashboard and choose the top priorities for the day.",
      frequency: "daily",
      reminderTime: "08:30",
      streak: 4,
      status: "active",
    },
  });

  await prisma.habitLog.createMany({
    data: [
      { userId: user.id, habitId: strengthHabit.id, date: addDays(today, -2), completed: true },
      { userId: user.id, habitId: strengthHabit.id, date: addDays(today, -1), completed: true },
      { userId: user.id, habitId: planningHabit.id, date: addDays(today, -3), completed: true },
      { userId: user.id, habitId: planningHabit.id, date: addDays(today, -2), completed: true },
      { userId: user.id, habitId: planningHabit.id, date: addDays(today, -1), completed: true },
      { userId: user.id, habitId: planningHabit.id, date: today, completed: true, note: "Started with dashboard review." },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user.id,
        goalId: productGoal.id,
        title: "Review dashboard data cards",
        description: "Confirm tasks, habits, goals, notes, and AI placeholder all render cleanly.",
        dueDate: today,
        priority: "high",
        status: "todo",
      },
      {
        userId: user.id,
        goalId: fitnessGoal.id,
        title: "Log today strength workout",
        dueDate: today,
        priority: "medium",
        status: "todo",
      },
      {
        userId: user.id,
        goalId: productGoal.id,
        title: "Write weekly review notes",
        dueDate: addDays(today, -1),
        priority: "medium",
        status: "in_progress",
      },
      {
        userId: user.id,
        goalId: productGoal.id,
        title: "Create seed data",
        dueDate: addDays(today, -2),
        priority: "low",
        status: "done",
      },
    ],
  });

  await prisma.note.createMany({
    data: [
      {
        userId: user.id,
        goalId: productGoal.id,
        title: "MVP polish notes",
        body: "Keep the interface calm, card-based, and focused on daily execution. Avoid adding non-MVP modules.",
        tags: ["mvp", "polish", "focus"],
        aiSummary: "Prioritize polish and avoid feature creep.",
      },
      {
        userId: user.id,
        habitId: planningHabit.id,
        title: "Planning reflection",
        body: "The day feels easier when the top three priorities are chosen before opening messages.",
        tags: ["planning", "reflection"],
      },
    ],
  });

  await prisma.dailyPlan.create({
    data: {
      userId: user.id,
      date: today,
      priorities: ["Finish MVP polish", "Complete today habits", "Review weekly progress"],
      plan: {
        dailyFocus: "Make the MVP coherent and demo-ready.",
        blocks: [
          { title: "Deep work", startTime: "09:00", endTime: "11:00", focus: "Polish dashboard and docs." },
          { title: "Review", startTime: "16:00", endTime: "16:30", focus: "Check tests and routes." },
        ],
        habitsToComplete: ["Strength training", "Daily planning review"],
        improvementSuggestion: "Stop after the core polish checklist is complete.",
      },
      suggestedTasks: [{ title: "Run typecheck", reason: "Catch regressions before pushing." }],
      reflectionPrompt: "What made today feel aligned with the future self?",
      aiProvider: "seed",
      aiModel: "seed",
    },
  });

  const weekStart = addDays(today, -(today.getDay() === 0 ? 6 : today.getDay() - 1));
  const weekEnd = addDays(weekStart, 7);

  await prisma.weeklyReview.create({
    data: {
      userId: user.id,
      weekStart,
      weekEnd,
      summary: "A focused week of MVP buildout with good progress on core LifeOps modules.",
      wins: ["Dashboard became data-driven.", "Core CRUD modules are connected.", "AI flows are user-triggered."],
      gaps: ["Need more automated coverage.", "Some AI actions still need end-to-end usage testing."],
      habitInsights: ["Planning habit supports better task selection."],
      goalProgress: ["LifeOps MVP moved materially closer to demo readiness."],
      nextWeekSuggestions: ["Keep scope tight.", "Test AI flows with real provider settings.", "Improve route-level QA."],
      aiContent: { patterns: ["Best progress happened during focused morning blocks."] },
      aiProvider: "seed",
      aiModel: "seed",
    },
  });

  await prisma.aiSettings.upsert({
    where: { id: "global" },
    update: {},
    create: {
      id: "global",
      provider: "groq",
      model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
