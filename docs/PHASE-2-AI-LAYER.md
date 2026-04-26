# Phase 2 — AI Layer

## Objective

Phase 2 adds structured AI workflows to LifeOps.

The AI layer should help the user generate:

- Future Self profile
- Goals
- Goal breakdown
- Habits
- Habit suggestions
- Tasks
- Note summaries
- Idea expansions
- Daily plans
- Weekly reviews

## Principle

AI suggests. User decides.

No AI-generated content should be saved automatically unless the user explicitly clicks save.

## AI Provider Support

The system already supports:

- Groq
- OpenAI
- Anthropic
- Graceful fallback when no API key is available

Phase 2 should continue using the existing provider abstraction.

## Required Workflows

### 1. Future Self Generator

Input:

- Simple textbox prompt from user

Output:

- Future self title
- Identity statement
- Description
- Life areas
- Vision per area
- Current reality per area
- Suggested habits
- Suggested goals

### 2. Goals from Future Self

Input:

- Future Self profile
- Life areas

Output:

- 5 to 10 suggested goals
- Each goal linked to a life area
- Suggested priority
- Suggested target date
- Reason

### 3. Goal Breakdown

Input:

- Goal

Output:

- Milestones
- Tasks
- Habits
- Risks
- Success metrics

### 4. Habits from Goal

Input:

- Goal

Output:

- 3 to 7 habits
- Frequency
- Difficulty
- Reminder suggestion
- Reason

### 5. Habit Suggestions

Input:

- Future self
- Existing goals
- Existing habits

Output:

- Missing habits
- Improvement suggestions
- Replacement habits

### 6. Note Summarization

Input:

- Note body

Output:

- Short summary
- Key points
- Action items
- Related goal/task suggestions

### 7. Task Creation

Input can come from:

- Goal
- Habit
- Note
- Idea

Output:

- Suggested tasks
- Priority
- Due date suggestion
- Reason

### 8. Idea Expansion

Input:

- Idea title/body

Output:

- Problem
- Target user
- MVP
- Features
- Tasks
- Risks
- Monetization ideas

### 9. Daily Planner

Input:

- Future self
- Active goals
- Due tasks
- Overdue tasks
- Active habits
- Recent notes

Output:

- Daily focus
- Top 3 priorities
- Time blocks
- Habits to complete
- Avoid list
- Evening reflection question

### 10. Weekly Review

Input:

- Completed tasks
- Incomplete tasks
- Habit logs
- Goal progress
- Notes
- Daily plans

Output:

- Summary
- Wins
- Gaps
- Patterns
- Goal insights
- Habit insights
- Next week focus
- Suggested tasks
