#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import {
  buildEvaluationReport,
  evaluateCaseProvenance,
  flattenRunAttempts,
  readManualCorrections,
  readRunSummaries,
} from "./lib/taskBoardEvaluation.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runsRoot = path.resolve(ROOT_DIR, args["--runs-dir"] ?? "artifacts/real-runs/task-board");
  const caseDir = path.resolve(ROOT_DIR, args["--case-dir"] ?? "frontend/src/cases/task-board");
  const interactionPath = args["--interaction-report"] === undefined
    ? undefined
    : path.resolve(ROOT_DIR, args["--interaction-report"]);
  const summaries = await readRunSummaries(runsRoot);
  const attempts = flattenRunAttempts(summaries);
  const interactionReport = interactionPath === undefined ? undefined : await readJson(interactionPath);
  const caseProvenance = await evaluateCaseProvenance(caseDir, runsRoot);
  const report = buildEvaluationReport({
    attempts,
    caseProvenance,
    interactionReport,
    manualCorrections: await readManualCorrections(runsRoot),
  });
  const outputPath = args["--output"] === undefined
    ? undefined
    : path.resolve(ROOT_DIR, args["--output"]);
  if (outputPath !== undefined) {
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(outputPath === undefined ? report : { ...report, outputPath }, null, 2));
}

function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (key === undefined || !key.startsWith("--") || value === undefined || value.startsWith("--")) {
      throw new Error(`参数无效：${key ?? ""}`);
    }
    result[key] = value;
  }
  return result;
}

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "评测报告生成失败");
  process.exitCode = 1;
});
