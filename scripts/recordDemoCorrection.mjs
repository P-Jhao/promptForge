#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { appendManualCorrection, parseArgs, RecorderError, redactSecrets } from "./lib/realRunRecorder.mjs";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = parseArgs(process.argv.slice(2));
const runId = required(args, "--run-id");
const caseId = required(args, "--case-id");
const summary = required(args, "--summary");
const outputRoot = path.resolve(rootDir, args["--output-dir"] ?? "artifacts/real-runs/workspace-demos");
const paths = (args["--paths"] ?? "/App.tsx,/index.tsx,/styles.css").split(",").map((value) => value.trim()).filter(Boolean);

appendManualCorrection({ outputRoot, runId, scenarioId: caseId, summary, paths })
  .then((correction) => console.log(`manual correction recorded: ${correction.caseId ?? caseId}`))
  .catch((error) => {
    const message = error instanceof Error ? error.message : "人工修正记录失败";
    console.error(redactSecrets(message));
    process.exitCode = error instanceof RecorderError ? 1 : 1;
  });

function required(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.trim().length === 0) throw new RecorderError(`必须通过 ${name} 提供值`, "arguments");
  return value.trim();
}
