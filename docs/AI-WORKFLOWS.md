# AI Workflows — LifeOps

## General Flow

```txt
User opens module
→ User clicks AI action
→ App gathers relevant context
→ Server sends structured prompt to AI provider
→ AI returns JSON
→ Zod validates output
→ UI shows review screen
→ User selects what to save
→ Server saves selected items
```
