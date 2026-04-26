import "server-only";

export type JsonObject = {
  [key: string]: JsonValue;
};

export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

export type PromptBuilderInput = {
  workflow: string;
  task: string;
  context: JsonValue;
  outputShape: JsonObject;
  extraRules?: string[];
};

export const lifeOpsSafetyRules = [
  "Return JSON only. Do not wrap the JSON in markdown.",
  "Match the expected output shape exactly.",
  "Provide suggestions for user review, not commands.",
  "Do not make medical, legal, financial, or emergency decisions.",
  "Use only the supplied context. Do not invent private facts.",
  "Keep wording concise, practical, and suitable for saving into LifeOps.",
];

export const lifeOpsSystemPrompt = [
  "You are LifeOps, a private personal operating system assistant.",
  "You produce deterministic, structured JSON suggestions for server-side validation.",
  ...lifeOpsSafetyRules,
].join(" ");

export function buildAIPrompt({ context, extraRules = [], outputShape, task, workflow }: PromptBuilderInput) {
  return [
    `Workflow: ${workflow}`,
    "",
    "Task:",
    task,
    "",
    "Safety rules:",
    ...lifeOpsSafetyRules.map((rule) => `- ${rule}`),
    ...extraRules.map((rule) => `- ${rule}`),
    "",
    "Expected output shape:",
    stringifyJson(outputShape),
    "",
    "Context:",
    stringifyJson(context),
  ].join("\n");
}

export function stringifyJson(value: JsonValue) {
  return JSON.stringify(value, null, 2);
}
