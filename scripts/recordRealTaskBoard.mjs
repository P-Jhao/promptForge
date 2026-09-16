#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  createAttempt,
  finishAttempt,
  inspectEvent,
  parseArgs,
  readConfigSummary,
  readSse,
  RecorderError,
  redactSecrets,
  safeErrorMessage,
} from "./lib/realRunRecorder.mjs";
import { inspectRealRun } from "./lib/realRunReadiness.mjs";
import { EVAL_PROMPTS, EVAL_SCENARIOS, hashEditBase, sha256 } from "./lib/taskBoardEvaluation.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXED_PROMPT = EVAL_PROMPTS["EVAL-01"];

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["--run-id"] ?? "";
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(runId)) throw new RecorderError("必须通过 --run-id 提供安全的运行 ID", "arguments");
  const scenarioId = args["--scenario"] ?? "EVAL-01";
  if (scenarioId !== "EVAL-01" && scenarioId !== "EVAL-02") throw new RecorderError("记录器只接受 EVAL-01 或 EVAL-02", "arguments");
  const baseUrl = (args["--base-url"] ?? process.env.PROMPTFORGE_BACKEND_URL ?? "http://localhost:7001/api").replace(/\/+$/, "");
  if (baseUrl.length === 0) throw new RecorderError("backend URL 不能为空", "arguments");
  const outputRoot = path.resolve(ROOT_DIR, args["--output-dir"] ?? "artifacts/real-runs/task-board");
  const request = await buildRequest({ args, scenarioId, runId, outputRoot, baseUrl });
  const attempt = await createAttempt({
    outputRoot, runId, request, configSummary: await readConfigSummary(ROOT_DIR),
    metadata: { scenarioId, samplePool: EVAL_SCENARIOS[scenarioId].samplePool, kind: EVAL_SCENARIOS[scenarioId].kind },
  });
  if (attempt.reused) {
    console.log(`runID=${runId} 已有成功记录，复用 attempt-${String(attempt.previous.currentAttempt).padStart(3, "0")}`);
    return;
  }

  const controller = new AbortController();
  let interrupted = false;
  const stop = () => { interrupted = true; controller.abort(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const capture = { raw: [], events: [], files: undefined, candidate: undefined, mode: undefined, flow: undefined, streamError: undefined, done: false };
  let terminal;
  try {
    const response = await fetch(`${baseUrl}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(request.body),
      signal: controller.signal,
    });
    if (!response.ok) throw new RecorderError(`backend 返回 HTTP ${response.status}`, "http");
    if (response.body === null) throw new RecorderError("backend 没有返回 SSE 流", "protocol");
    await readSse(response.body, capture, (event) => inspectEvent(event, capture));
    if (capture.mode === undefined) throw new RecorderError("缺少 mode 事件，拒绝将结果记录为真实生成", "mode");
    if (capture.mode.mode !== "real" || capture.mode.forced !== false) throw new RecorderError("mode 不是明确的 real 且 forced=false，拒绝记录为真实生成", "mode");
    if (capture.streamError !== undefined) throw new RecorderError(capture.streamError, "backend");
    if (!capture.done) throw new RecorderError("SSE 响应缺少 done，结果不完整", "incomplete");
    if (capture.files === undefined || Object.keys(capture.files).length === 0) throw new RecorderError("SSE 响应缺少完整 files，结果不完整", "protocol");
    terminal = { category: "success", message: "收到 real/forced=false、完整 files 和 done" };
  } catch (error) {
    controller.abort();
    terminal = { category: interrupted ? "interrupted" : (error instanceof RecorderError ? error.category : "request"), message: safeErrorMessage(error) };
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }

  const result = await finishAttempt({ ...attempt, rootDir: ROOT_DIR }, capture, terminal);
  console.log(`${result.status}: scenario=${scenarioId}, runID=${runId}, attempt=${attempt.attempt}, files=${result.finalEntry.fileCount}, promptSha256=${sha256(request.prompt)}`);
  if (result.status !== "success") process.exitCode = 1;
}

async function buildRequest({ args, scenarioId, runId, outputRoot, baseUrl }) {
  const prompt = scenarioId === "EVAL-01" ? FIXED_PROMPT : EVAL_PROMPTS[scenarioId];
  if (scenarioId === "EVAL-01") {
    return {
      prompt, baseUrl,
      body: { messages: [{ role: "user", content: prompt }], projectId: runId, operation: "generate", mockConfig: { global: false } },
    };
  }
  const baseRunId = args["--base-run-id"] ?? "";
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(baseRunId)) throw new RecorderError("EVAL-02 必须通过 --base-run-id 提供成功的 EVAL-01 run", "readiness");
  const baseFiles = await readRecordedFiles(outputRoot, baseRunId);
  const projectId = args["--project-id"] ?? baseRunId;
  const versionId = args["--base-version-id"] ?? null;
  const baseHash = hashEditBase(baseFiles, []);
  return {
    prompt, baseUrl,
    body: {
      messages: [{ role: "user", content: prompt }], projectId, operation: "edit", runId,
      base: { projectId, versionId, hash: baseHash, files: baseFiles, resources: [] }, mockConfig: { global: false },
    },
  };
}

async function readRecordedFiles(outputRoot, runId) {
  const summary = await readJson(path.join(outputRoot, runId, "record.json"));
  const readiness = await inspectRealRun(summary, outputRoot);
  if (!readiness.ready || readiness.files === undefined) throw new RecorderError(`EVAL-02 的 EVAL-01 基线不可用：${readiness.reason ?? "files 不完整"}`, "readiness");
  return readiness.files;
}

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

main().catch((error) => {
  console.error(redactSecrets(error instanceof Error ? error.message : "未知记录错误"));
  process.exitCode = 1;
});
