import type { AIProvider } from "@lifeops/db";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse } from "node:path";
import type { AIClient } from "@/lib/ai/types";
import { createAnthropicClient } from "./anthropic";
import { createGroqClient } from "./groq";
import { createOpenAIClient } from "./openai";

export function createAIClient(provider: AIProvider): AIClient {
  if (provider === "openai") {
    return createOpenAIClient(requireEnv("OPENAI_API_KEY"));
  }

  if (provider === "anthropic") {
    return createAnthropicClient(requireEnv("ANTHROPIC_API_KEY"));
  }

  return createGroqClient(requireEnv("GROQ_API_KEY"));
}

function requireEnv(name: string) {
  const value = getServerEnv(name);
  if (!value) {
    throw new Error(`${name} is required for the selected AI provider.`);
  }

  return value;
}

export function getServerEnv(name: string) {
  return process.env[name] ?? readWorkspaceEnv(name);
}

function readWorkspaceEnv(name: string) {
  let current = process.cwd();
  const root = parse(current).root;

  while (true) {
    const envPath = join(current, ".env");
    if (existsSync(envPath)) {
      const value = readEnvFileValue(envPath, name);
      if (value) {
        process.env[name] = value;
        return value;
      }
    }

    if (current === root) {
      return undefined;
    }

    current = dirname(current);
  }
}

function readEnvFileValue(path: string, name: string) {
  const line = readFileSync(path, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${name}=`));

  if (!line) {
    return undefined;
  }

  const rawValue = line.slice(line.indexOf("=") + 1).trim();
  return rawValue.replace(/^['"]|['"]$/g, "");
}
