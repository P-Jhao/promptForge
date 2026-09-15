#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { inspectRealRun } from "./lib/realRunReadiness.mjs";
import { promptDescriptor, readRunSummaries } from "./lib/taskBoardEvaluation.mjs";
import { redactSecrets } from "./lib/realRunRecorder.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RECORD_SCRIPT = path.join(ROOT_DIR, "scripts", "recordRealTaskBoard.mjs");
const REPORT_SCRIPT = path.join(ROOT_DIR, "scripts", "reportTaskBoardEvaluation.mjs");
const MAX_OUTPUT = 8_192;
const EVAL01_PROMPT_HASH = promptDescriptor("EVAL-01").sha256;

/**
 * Builds the fixed serial plan without making a network request. The EVAL-02
 * jobs are deliberately absent until a reusable EVAL-01 baseline is found.
 */
export function createEvaluationPlan({ count = 3, baselineRunId = null } = {}) {
  if (!Number.isInteger(count) || count < 1 || count > 3) {
    throw new Error("评测次数必须是 1 到 3 之间的整数");
  }
  const eval01 = Array.from({ length: count }, (_, index) => ({
    scenarioId: "EVAL-01",
    runId: `task-board-eval-01-${String(index + 1).padStart(3, "0")}`,
  }));
  const eval02 = baselineRunId === null
    ? []
    : Array.from({ length: count }, (_, index) => ({
      scenarioId: "EVAL-02",
      runId: `task-board-eval-02-${String(index + 1).padStart(3, "0")}`,
      baseRunId: baselineRunId,
    }));
  const notExecuted = baselineRunId === null
    ? [{ scenarioId: "EVAL-02", count, reason: "没有可复用的 EVAL-01 real success 基线" }]
    : [];
  return { serial: true, eval01, eval02, notExecuted, baselineRunId };
}

export function isReusableEval01Summary(summary) {
  return summary?.status === "success"
    && summary?.latest?.scenarioId === "EVAL-01"
    && summary.latest?.request?.promptSha256 === EVAL01_PROMPT_HASH;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const count = parseCount(args["--count"]);
  const runsRoot = path.resolve(ROOT_DIR, args["--output-dir"] ?? "artifacts/real-runs/task-board");
  await mkdir(runsRoot, { recursive: true });
  const baseUrl = args["--base-url"];
  const initialPlan = createEvaluationPlan({ count });
  const eval01Results = [];
  for (const job of initialPlan.eval01) {
    eval01Results.push(await runRecorder(job, { runsRoot, baseUrl }));
  }

  const baselineRunId = await findReusableBaseline(runsRoot, initialPlan.eval01.map((job) => job.runId));
  const plan = createEvaluationPlan({ count, baselineRunId });
  const eval02Results = [];
  for (const job of plan.eval02) {
    eval02Results.push(await runRecorder(job, { runsRoot, baseUrl }));
  }

  const reportOutput = path.resolve(ROOT_DIR, args["--report-output"] ?? path.join(args["--output-dir"] ?? "artifacts/real-runs/task-board", "evaluation-report.json"));
  const reportArgs = ["--runs-dir", runsRoot, "--output", reportOutput];
  if (args["--case-dir"] !== undefined) reportArgs.push("--case-dir", args["--case-dir"]);
  if (args["--interaction-report"] !== undefined) reportArgs.push("--interaction-report", args["--interaction-report"]);
  const reportResult = await runNodeScript(REPORT_SCRIPT, reportArgs);
  const report = parseJson(reportResult.stdout);
  const result = {
    schemaVersion: 1,
    status: typeof report?.status === "string" ? report.status : "NOT_READY",
    serial: true,
    count,
    baselineRunId,
    scenarios: { "EVAL-01": eval01Results, "EVAL-02": eval02Results },
    notExecuted: plan.notExecuted,
    report: {
      exitCode: reportResult.exitCode,
      status: typeof report?.status === "string" ? report.status : "not-verified",
      outputPath: reportOutput,
      stderr: reportResult.stderr.length === 0 ? undefined : reportResult.stderr,
    },
  };
  if (args["--output"] !== undefined) {
    const orchestrationOutput = path.resolve(ROOT_DIR, args["--output"]);
    await mkdir(path.dirname(orchestrationOutput), { recursive: true });
    await writeFile(orchestrationOutput, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  }
  console.log(JSON.stringify(result, null, 2));
}

async function findReusableBaseline(runsRoot, runIds) {
  const allowed = new Set(runIds);
  const summaries = await readRunSummaries(runsRoot);
  for (const summary of summaries) {
    if (typeof summary?.runId !== "string" || !allowed.has(summary.runId)) continue;
    if (!isReusableEval01Summary(summary)) continue;
    const readiness = await inspectRealRun(summary, runsRoot);
    if (readiness.ready) return summary.runId;
  }
  return null;
}

async function runRecorder(job, options) {
  const args = [
    "--scenario", job.scenarioId,
    "--run-id", job.runId,
    "--output-dir", options.runsRoot,
  ];
  if (options.baseUrl !== undefined) args.push("--base-url", options.baseUrl);
  if (job.baseRunId !== undefined) args.push("--base-run-id", job.baseRunId);
  const result = await runNodeScript(RECORD_SCRIPT, args);
  const recorderState = await readRecorderState(options.runsRoot, job.runId);
  return {
    scenarioId: job.scenarioId,
    runId: job.runId,
    baseRunId: job.baseRunId,
    exitCode: result.exitCode,
    status: recorderState.status,
    terminalCategory: recorderState.terminalCategory,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

export async function readRecorderState(runsRoot, runId) {
  try {
    const record = JSON.parse(await readFile(path.join(runsRoot, runId, "record.json"), "utf8"));
    const latest = record?.latest;
    const status = typeof latest?.status === "string" ? latest.status : record?.status;
    return {
      status: typeof status === "string" ? status : "not-verified",
      terminalCategory: typeof latest?.terminal?.category === "string" ? latest.terminal.category : undefined,
    };
  } catch (error) {
    return {
      status: "not-verified",
      terminalCategory: error?.code === "ENOENT" ? "record-missing" : "record-invalid",
    };
  }
}

function runNodeScript(scriptPath, args) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let settled = false;
    const child = spawn(process.execPath, [scriptPath, ...args], {
      cwd: ROOT_DIR,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    const finish = (exitCode, errorMessage = "") => {
      if (settled) return;
      settled = true;
      resolve({
        exitCode,
        stdout: redactSecrets(stdout).slice(-MAX_OUTPUT),
        stderr: redactSecrets(`${stderr}${errorMessage.length === 0 ? "" : `\n${errorMessage}`}`).slice(-MAX_OUTPUT),
      });
    };
    child.stdout.on("data", (chunk) => { stdout += String(chunk); });
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", (error) => finish(1, error instanceof Error ? error.message : "子进程启动失败"));
    child.once("close", (code) => finish(typeof code === "number" ? code : 1));
  });
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

function parseCount(value) {
  if (value === undefined) return 3;
  const count = Number(value);
  if (!Number.isInteger(count) || count < 1 || count > 3) throw new Error("--count 必须是 1 到 3 之间的整数");
  return count;
}

function parseJson(value) {
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

const isDirectRun = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) main().catch((error) => {
  console.error(redactSecrets(error instanceof Error ? error.message : "任务板评测编排失败"));
  process.exitCode = 1;
});
