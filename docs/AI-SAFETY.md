# AI Safety — LifeOps

## Core Rules

- AI must never make final life decisions for the user.
- AI should provide suggestions, not commands.
- AI output must be reviewed before saving.
- AI output must be validated with Zod.
- AI output should be explainable.
- AI should not produce medical, legal, or financial advice as final instruction.

## Privacy

Only send the minimum required context to AI providers.

Avoid sending:

- Full private journal history
- Sensitive notes not needed for the current action
- Secrets
- Authentication data
- Raw environment variables

## Fallback Behavior

If AI provider is unavailable:

- Show helpful message
- Allow manual creation
- Do not break the workflow

## AI Output Handling

All AI outputs must:

- Be structured JSON where possible
- Be parsed safely
- Be validated
- Be displayed to user before saving

## Auditability

Store optional metadata:

- AI provider
- AI model
- Prompt version
- Created at
- User action type
