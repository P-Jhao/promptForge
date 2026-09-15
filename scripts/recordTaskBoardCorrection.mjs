#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { appendManualCorrection, parseArgs, RecorderError } from "./lib/realRunRecorder.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["--run-id"] ?? "";
  const scenarioId = args["--scenario"] ?? "";
  const summary = args["--summary"] ?? "";
  const paths = args["--paths"] === undefined ? [] : args["--paths"].split(",").map((item) => item.trim()).filter(Boolean);
  const outputRoot = path.resolve(ROOT_DIR, args["--output-dir"] ?? "artifacts/real-runs/task-board");
  const correction = await appendManualCorrection({ outputRoot, runId, scenarioId, summary, paths });
  console.log(JSON.stringify({ status: "recorded", runId, correction }, null, 2));
}

main().catch((error) => {
  const message = error instanceof RecorderError || error instanceof Error ? error.message : "人工修正记录失败";
  console.error(message);
  process.exitCode = 1;
});
