#!/usr/bin/env node

import path from "node:path";
import process from "node:process";
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
  sha256,
} from "./lib/realRunRecorder.mjs";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIXED_PROMPT = "做一个 React/TypeScript 任务看板，展示任务标题、描述、负责人、截止日期和优先级字段；按待办、进行中、已完成三列展示任务；用户可以新增任务、编辑任务、切换任务状态，并用关键词筛选任务。请保留清晰的看板标题、空状态和表单校验。初始版本只需要展示优先级字段，不要求提供按优先级筛选。";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const runId = args["--run-id"] ?? "";
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(runId)) throw new RecorderError("必须通过 --run-id 提供安全的运行 ID", "arguments");
  const baseUrl = (args["--base-url"] ?? process.env.PROMPTFORGE_BACKEND_URL ?? "http://localhost:7001/api").replace(/\/+$/, "");
  if (baseUrl.length === 0) throw new RecorderError("backend URL 不能为空", "arguments");
  const outputRoot = path.resolve(ROOT_DIR, args["--output-dir"] ?? "artifacts/real-runs/task-board");
  const request = {
    prompt: FIXED_PROMPT,
    baseUrl,
    body: { messages: [{ role: "user", content: FIXED_PROMPT }], projectId: runId, mockConfig: { global: false } },
  };
  const attempt = await createAttempt({ outputRoot, runId, request, configSummary: await readConfigSummary(ROOT_DIR) });
  if (attempt.reused) {
    console.log(`runID=${runId} 已有成功记录，复用 attempt-${String(attempt.previous.currentAttempt).padStart(3, "0")}`);
    return;
  }

  const controller = new AbortController();
  let interrupted = false;
  const stop = () => { interrupted = true; controller.abort(); };
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
  const capture = { raw: [], events: [], files: undefined, mode: undefined, flow: undefined, streamError: undefined, done: false };
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
    terminal = { category: "success", message: "收到 real/forced=false、files 和 done" };
  } catch (error) {
    controller.abort();
    terminal = { category: interrupted ? "interrupted" : (error instanceof RecorderError ? error.category : "request"), message: safeErrorMessage(error) };
  } finally {
    process.removeListener("SIGINT", stop);
    process.removeListener("SIGTERM", stop);
  }

  const result = await finishAttempt({ ...attempt, rootDir: ROOT_DIR }, capture, terminal);
  console.log(`${result.status}: runID=${runId}, attempt=${attempt.attempt}, files=${result.finalEntry.fileCount}, promptSha256=${sha256(FIXED_PROMPT)}`);
  if (result.status !== "success") process.exitCode = 1;
}

main().catch((error) => {
  console.error(redactSecrets(error instanceof Error ? error.message : "未知记录错误"));
  process.exitCode = 1;
});
