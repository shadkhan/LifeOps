import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const [workspace, script] = process.argv.slice(2);
const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));

if (!workspace || !script) {
  console.error("Usage: node scripts/run-workspace.mjs <workspace> <script>");
  process.exit(1);
}

loadRootEnv();

const packageManager = getPackageManager();
const command =
  packageManager === "pnpm"
    ? { bin: "pnpm", args: ["--filter", workspace, script] }
    : { bin: "npm", args: ["--workspace", workspace, "run", script] };

const result = spawnSync(command.bin, command.args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);

function getPackageManager() {
  const userAgent = process.env.npm_config_user_agent ?? "";

  if (userAgent.startsWith("pnpm/")) {
    return "pnpm";
  }

  if (userAgent.startsWith("npm/")) {
    return "npm";
  }

  if (canRun("pnpm", ["--version"])) {
    return "pnpm";
  }

  return "npm";
}

function canRun(bin, args) {
  const result = spawnSync(bin, args, {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  return result.status === 0;
}

function loadRootEnv() {
  const envPath = join(rootDir, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const envFile = readFileSync(envPath, "utf8");

  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = parseEnvValue(rawValue);
  }
}

function parseEnvValue(value) {
  const quote = value.at(0);

  if (
    (quote === '"' || quote === "'") &&
    value.endsWith(quote) &&
    value.length >= 2
  ) {
    return value.slice(1, -1);
  }

  return value;
}
