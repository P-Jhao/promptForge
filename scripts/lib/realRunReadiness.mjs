import { readFile } from "node:fs/promises";
import path from "node:path";

export function isCompleteRealAttempt(attempt) {
  return attempt?.samplePool === "REAL-EVAL"
    && attempt?.status === "success"
    && attempt?.modeEvidence?.mode === "real"
    && attempt.modeEvidence.forced === false
    && Array.isArray(attempt.eventTypes)
    && hasDoneEvent(attempt.eventTypes)
    && typeof attempt.filesPath === "string"
    && attempt.filesPath.length > 0
    && typeof attempt.fileCount === "number"
    && Number.isInteger(attempt.fileCount)
    && attempt.fileCount > 0;
}

export async function inspectRealRun(summary, runsRoot) {
  if (!summary || summary.status !== "success") return { ready: false, reason: "REAL_RUN_NOT_SUCCESS" };
  const attempt = summary?.latest;
  const reason = incompleteReason(attempt);
  if (reason !== undefined) return { ready: false, reason };
  const files = await readFilesArtifact(attempt, summary.runId, runsRoot);
  if (files === undefined) return { ready: false, reason: "REAL_RUN_FILES_MISSING" };
  if (Object.keys(files).length !== attempt.fileCount) {
    return { ready: false, reason: "REAL_RUN_FILES_COUNT_MISMATCH" };
  }
  return { ready: true, files };
}

function incompleteReason(attempt) {
  if (!attempt || attempt.status !== "success") return "REAL_RUN_NOT_SUCCESS";
  if (attempt.samplePool !== "REAL-EVAL") return "REAL_RUN_SAMPLE_POOL_INVALID";
  if (attempt.modeEvidence?.mode !== "real" || attempt.modeEvidence.forced !== false) return "REAL_RUN_MODE_INVALID";
  if (!Array.isArray(attempt.eventTypes) || !hasDoneEvent(attempt.eventTypes)) return "REAL_RUN_DONE_MISSING";
  if (typeof attempt.filesPath !== "string" || attempt.filesPath.length === 0 || attempt.fileCount < 1) return "REAL_RUN_FILES_INCOMPLETE";
  return undefined;
}

async function readFilesArtifact(attempt, runId, runsRoot) {
  const candidates = new Set();
  if (path.isAbsolute(attempt.filesPath)) candidates.add(attempt.filesPath);
  else {
    candidates.add(path.resolve(process.cwd(), attempt.filesPath));
    candidates.add(path.resolve(runsRoot, attempt.filesPath));
    if (typeof runId === "string") candidates.add(path.resolve(runsRoot, runId, attempt.filesPath));
  }
  for (const filePath of candidates) {
    try {
      const parsed = JSON.parse(await readFile(filePath, "utf8"));
      if (isFileMap(parsed)) return parsed;
    } catch (error) {
      if (error?.code !== "ENOENT" && !(error instanceof SyntaxError)) return undefined;
    }
  }
  return undefined;
}

function isFileMap(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    && Object.keys(value).length > 0
    && Object.values(value).every((content) => typeof content === "string");
}

function hasDoneEvent(events) {
  return events.some((event) => event === "done" || event?.type === "done");
}
