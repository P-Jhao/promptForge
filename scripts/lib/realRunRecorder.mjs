import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readCandidateEvidence } from "./realCandidateEvidence.mjs";

export class RecorderError extends Error {
  constructor(message, category = "recording") {
    super(message);
    this.name = "RecorderError";
    this.category = category;
  }
}

export async function createAttempt({ outputRoot, runId, request, configSummary, metadata = {} }) {
  const runDir = path.join(outputRoot, runId);
  const summaryPath = path.join(runDir, "record.json");
  const previous = await readJson(summaryPath);
  if (previous?.status === "success") {
    const latest = previous.latest ?? previous.attempts?.at(-1);
    if (metadata.scenarioId !== undefined && latest?.scenarioId !== metadata.scenarioId) {
      throw new RecorderError("成功 run ID 已用于其他评测场景，拒绝复用", "run-id");
    }
    if (latest?.request?.promptSha256 !== undefined && latest.request.promptSha256 !== sha256(request.prompt)) {
      throw new RecorderError("成功 run ID 的 prompt 不一致，拒绝复用", "run-id");
    }
    return { reused: true, previous, runDir, summaryPath };
  }
  const attempts = await readAttemptNumbers(runDir);
  const attempt = Math.max(...attempts, 0) + 1;
  const attemptDir = path.join(runDir, `attempt-${String(attempt).padStart(3, "0")}`);
  await mkdir(attemptDir, { recursive: true });
  const staleAttempts = await markStaleAttempt(previous, runDir);
  const runningEntry = {
    attempt, status: "running", startedAt: new Date().toISOString(),
    ...metadata,
    request: {
      baseUrl: request.baseUrl, operation: request.body.operation, projectId: request.body.projectId, runId: request.body.runId,
      base: summarizeBase(request.body.base), mockConfig: request.body.mockConfig,
      promptSha256: sha256(request.prompt), promptCharacters: request.prompt.length,
    },
    configSummary,
  };
  await writeJson(path.join(attemptDir, "record.json"), runningEntry);
  await writeJson(summaryPath, { schemaVersion: 1, runId, status: "running", currentAttempt: attempt, attempts: [...staleAttempts, runningEntry] });
  return { reused: false, previous, runDir, summaryPath, attempt, attemptDir, runningEntry, staleAttempts };
}

export async function finishAttempt(attempt, capture, terminal) {
  const rawPath = path.join(attempt.attemptDir, "raw-sse.txt");
  await writeFile(rawPath, redactSecrets(capture.raw.join("")), "utf8");
  const filesPath = capture.files === undefined ? undefined : path.join(attempt.attemptDir, "files.json");
  if (filesPath !== undefined) await writeJson(filesPath, redactFiles(capture.files));
  const status = terminal.category === "success" ? "success" : terminal.category === "interrupted" ? "interrupted" : "failed";
  const finalEntry = {
    ...attempt.runningEntry, status, endedAt: new Date().toISOString(), terminal,
    modeEvidence: capture.mode, flow: capture.flow, eventTypes: capture.events,
    candidateEvidence: capture.candidate,
    fileCount: capture.files === undefined ? 0 : Object.keys(capture.files).length,
    rawSsePath: path.relative(attempt.rootDir ?? process.cwd(), rawPath),
    filesPath: filesPath === undefined ? undefined : path.relative(attempt.rootDir ?? process.cwd(), filesPath),
  };
  await writeJson(path.join(attempt.attemptDir, "record.json"), finalEntry);
  const finishedAttempts = [...attempt.staleAttempts, finalEntry];
  await writeJson(attempt.summaryPath, { schemaVersion: 1, runId: path.basename(attempt.runDir), status, currentAttempt: attempt.attempt, attempts: finishedAttempts, latest: finalEntry });
  return { status, finalEntry };
}

export async function appendManualCorrection({ outputRoot, runId, scenarioId, summary, paths = [] }) {
  if (!/^[A-Za-z0-9._:-]{1,128}$/.test(runId)) throw new RecorderError("run ID 无效", "arguments");
  if (typeof scenarioId !== "string" || scenarioId.length === 0 || typeof summary !== "string" || summary.length === 0) {
    throw new RecorderError("人工修正记录缺少场景或说明", "arguments");
  }
  if (!Array.isArray(paths) || !paths.every((item) => typeof item === "string" && item.startsWith("/"))) {
    throw new RecorderError("人工修正路径列表无效", "arguments");
  }
  const runDir = path.join(outputRoot, runId);
  const correctionPath = path.join(runDir, "manual-corrections.json");
  const previous = await readJson(correctionPath);
  const corrections = Array.isArray(previous?.corrections) ? previous.corrections : [];
  const correction = {
    scenarioId,
    summary: redactSecrets(summary),
    paths: paths.map((item) => item.slice(0, 512)),
    recordedAt: new Date().toISOString(),
  };
  await writeJson(correctionPath, { schemaVersion: 1, corrections: [...corrections, correction] });
  return correction;
}

export function inspectEvent(event, capture) {
  if (!isRecord(event) || typeof event.type !== "string") throw new RecorderError("SSE 事件格式无效", "protocol");
  capture.events.push({ type: event.type, at: new Date().toISOString() });
  if (event.type === "mode") {
    if (!isRecord(event.data) || (event.data.mode !== "real" && event.data.mode !== "mock") || typeof event.data.forced !== "boolean") throw new RecorderError("mode 事件格式无效", "mode");
    capture.mode = { mode: event.data.mode, forced: event.data.forced };
  } else if (event.type === "flow" && isRecord(event.data) && typeof event.data.flow === "string") {
    capture.flow = event.data.flow;
  } else if (event.type === "files") {
    const files = readFiles(event.data);
    if (files === undefined) throw new RecorderError("files 事件格式无效", "protocol");
    capture.files = files;
  } else if (event.type === "candidate") {
    const candidate = readCandidateEvidence(event.data, readFiles, redactSecrets, sha256);
    if (candidate === undefined) throw new RecorderError("candidate 事件格式无效或缺少完整 files", "protocol");
    if (capture.candidate !== undefined) throw new RecorderError("SSE 重复 candidate 事件", "protocol");
    capture.candidate = candidate.evidence;
    capture.files = candidate.files;
  } else if (event.type === "error") {
    capture.streamError = redactSecrets(readEventMessage(event));
  } else if (event.type === "done") {
    capture.done = true;
  }
}

export async function readSse(body, capture, onEvent) {
  const reader = body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) {
        const tail = decoder.decode();
        capture.raw.push(tail);
        buffer += tail;
        break;
      }
      const chunk = decoder.decode(result.value, { stream: true });
      capture.raw.push(chunk);
      buffer += chunk;
      const split = consumeFrames(buffer);
      buffer = split.remainder;
      for (const frame of split.frames) {
        const event = parseFrame(frame);
        if (event !== undefined) onEvent(event);
      }
    }
    const split = consumeFrames(buffer);
    for (const frame of split.frames) {
      const event = parseFrame(frame);
      if (event !== undefined) onEvent(event);
    }
    if (split.remainder.trim().length > 0) throw new RecorderError("SSE 在事件边界前结束", "incomplete");
  } finally {
    reader.releaseLock();
  }
}

function consumeFrames(input) {
  const frames = [];
  let remainder = input;
  while (true) {
    const separators = ["\r\n\r\n", "\n\n", "\r\r"]
      .map((separator) => ({ separator, index: remainder.indexOf(separator) }))
      .filter((item) => item.index >= 0)
      .sort((first, second) => first.index - second.index);
    const first = separators[0];
    if (first === undefined) break;
    frames.push(remainder.slice(0, first.index));
    remainder = remainder.slice(first.index + first.separator.length);
  }
  return { frames, remainder };
}

function parseFrame(frame) {
  const dataLines = frame.split(/\r\n|\n|\r/)
    .filter((line) => line.length > 0 && !line.startsWith(":"))
    .map((line) => {
      if (!line.startsWith("data:")) throw new RecorderError("SSE 包含无法识别的事件行", "protocol");
      return line.slice(5).replace(/^ /, "");
    });
  if (dataLines.length === 0) return undefined;
  try {
    return JSON.parse(dataLines.join("\n"));
  } catch {
    throw new RecorderError("SSE data 不是有效 JSON", "protocol");
  }
}

function readFiles(data) {
  if (!isRecord(data) || !isRecord(data.files)) return undefined;
  const entries = Object.entries(data.files);
  if (!entries.every(([, value]) => typeof value === "string")) return undefined;
  return Object.fromEntries(entries);
}

function readEventMessage(event) {
  if (isRecord(event.data) && typeof event.data.message === "string") return event.data.message;
  if (typeof event.message === "string") return event.message;
  return "backend 返回生成错误";
}

async function readAttemptNumbers(runDir) {
  try {
    const entries = await readdir(runDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory() && /^attempt-\d{3}$/.test(entry.name)).map((entry) => Number(entry.name.slice("attempt-".length)));
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

async function markStaleAttempt(previous, runDir) {
  const existing = Array.isArray(previous?.attempts) ? previous.attempts : [];
  if (previous?.status !== "running" || typeof previous.currentAttempt !== "number") return existing;
  const message = "上一次进程没有留下终态，本次启动前标记为中断";
  const stale = existing.map((entry) => entry.attempt === previous.currentAttempt && entry.status === "running"
    ? { ...entry, status: "interrupted", endedAt: new Date().toISOString(), terminal: { category: "interrupted", message } }
    : entry);
  const stalePath = path.join(runDir, `attempt-${String(previous.currentAttempt).padStart(3, "0")}`, "record.json");
  const staleRecord = await readJson(stalePath);
  if (staleRecord?.status === "running") await writeJson(stalePath, { ...staleRecord, status: "interrupted", endedAt: new Date().toISOString(), terminal: { category: "interrupted", message } });
  return stale;
}

export async function readConfigSummary(rootDir) {
  const processValues = readSafeValues(process.env);
  const envPath = path.join(rootDir, "backend", ".env");
  let backendValues = {};
  let available = true;
  try {
    backendValues = readSafeValues(parseEnv(await readFile(envPath, "utf8")));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    available = false;
  }
  return {
    backendEnv: { source: "backend/.env (declared values only; not proof of live process)", available, values: backendValues },
    recorderEnv: { source: "recording process environment (not proof of live backend)", values: processValues },
    request: { mockConfig: { global: false }, modeEvidence: "must receive SSE mode={mode:real,forced:false}" },
  };
}

function parseEnv(text) {
  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match !== null && SAFE_CONFIG_KEYS.includes(match[1])) values[match[1]] = stripQuotes(match[2]);
  }
  return values;
}

function readSafeValues(values) {
  return Object.fromEntries(SAFE_CONFIG_KEYS.filter((key) => typeof values[key] === "string").map((key) => [key, values[key]]));
}

function stripQuotes(value) { return value.replace(/^(["'])(.*)\1$/, "$2"); }

function redactFiles(files) { return Object.fromEntries(Object.entries(files).map(([filePath, code]) => [filePath, redactSecrets(code)])); }

export function redactSecrets(value) {
  return String(value)
    .replace(/\b(?:sk|rk)-[A-Za-z0-9_-]{16,}\b/g, "[REDACTED_KEY]")
    .replace(/((?:api[_-]?key|secret|token|password|authorization)\s*[:=]\s*["']?)[^\s,"'}]+/gi, "$1[REDACTED]");
}

export function safeErrorMessage(error) { return redactSecrets(error instanceof Error ? error.message : "未知记录错误"); }
export function sha256(value) { return createHash("sha256").update(value, "utf8").digest("hex"); }

async function readJson(filePath) {
  try { return JSON.parse(await readFile(filePath, "utf8")); }
  catch (error) { if (error?.code === "ENOENT") return undefined; throw error; }
}

async function writeJson(filePath, value) { await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8"); }

export function parseArgs(args) {
  const result = {};
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    if (key === undefined || !key.startsWith("--")) throw new RecorderError(`无法识别参数：${key}`, "arguments");
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) throw new RecorderError(`参数缺少值：${key}`, "arguments");
    result[key] = value;
  }
  return result;
}

function isRecord(value) { return typeof value === "object" && value !== null && !Array.isArray(value); }

function summarizeBase(base) {
  if (!isRecord(base)) return undefined;
  return {
    projectId: base.projectId, versionId: base.versionId ?? null, hash: base.hash,
    fileCount: isRecord(base.files) ? Object.keys(base.files).length : undefined,
    resourceCount: Array.isArray(base.resources) ? base.resources.length : undefined,
  };
}

const SAFE_CONFIG_KEYS = [
  "MAIN_MODEL_PROVIDER", "MAIN_MODEL", "DEEPSEEK_MODEL", "OPENAI_MODEL", "MOCK_MODE", "NODE_ENV",
];
