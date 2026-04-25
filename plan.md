Follow this exact order:

Project setup
Database schema
Auth
App shell/layout
Future Self module
Goals module
Habits module
Tasks module
Notes module
Dashboard
AI Daily Planner
Weekly Review

Testing Expectations

Add basic tests for:

Validation schemas
Server actions
AI prompt input/output structure
Critical database operations

AI Flow

Example: AI Daily Planner

User clicks "Plan My Day"
→ Server fetches goals, tasks, habits, future self
→ Data is converted into clean context
→ AI prompt is generated
→ AI returns structured plan
→ User reviews plan
→ User can save selected tasks

Security Principles
All AI calls happen server-side.
API keys are never exposed to client.
User can only access own data.
Validate all input with Zod.
Use authentication middleware.
