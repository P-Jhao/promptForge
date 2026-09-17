#!/usr/bin/env node

import process from "node:process";
import path from "node:path";
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

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = requiredArg(args, "--run-id");
  const caseId = requiredArg(args, "--case-id");
  const prompt = requiredArg(args, "--prompt");
  const baseUrl = (args["--base-url"] ?? process.env.PROMPTFORGE_BACKEND_URL ?? "http://localhost:7001/api").replace(/\/+$/, "");
  const outputRoot = path.resolve(ROOT_DIR, args["--output-dir"] ?? "artifacts/real-runs/workspace-demos");
  const request = {
    baseUrl,
    prompt,
    body: {
      messages: [{ role: "user", content: prompt }],
      projectId: runId,
      operation: "generate",
      mockConfig: { global: false },
    },
  };
  const attempt = await createAttempt({
    outputRoot,
    runId,
    request,
    configSummary: await readConfigSummary(ROOT_DIR),
    metadata: { caseId, samplePool: "WORKSPACE-DEMO", kind: "real-generation" },
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
  console.log(`${result.status}: case=${caseId}, runID=${runId}, files=${result.finalEntry.fileCount}`);
  if (result.status !== "success") process.exitCode = 1;
}

function requiredArg(args, name) {
  const value = args[name];
  if (typeof value !== "string" || value.trim().length === 0) throw new RecorderError(`必须通过 ${name} 提供值`, "arguments");
  return value.trim();
}

main().catch((error) => {
  console.error(redactSecrets(error instanceof Error ? error.message : "未知记录错误"));
  process.exitCode = 1;
});
