// API 请求封装
import type { ChatMessage } from "@/types/message";
import type {
  CandidateStreamEvent,
  ModeEventData,
  StreamErrorData,
  StreamEvent,
} from "@/types/api";
import type { EditBaseSnapshot } from "@/lib/changeContract";
import type { MockConfig } from "@/types/mock";
import type { BackendFlowType, StepType } from "@/types/flow";
import { apiUrl } from "@/constants/config";

const STREAM_STEP_TYPES: readonly StepType[] = [
  "analysis", "intent", "capabilities", "ui", "components", "structure",
  "dependency", "types", "utils", "mockData", "service", "hooks",
  "componentsCode", "pagesCode", "layouts", "styles", "app", "files",
  "figmaRawCode", "figmaImageProcessed", "figmaAstParsed", "figmaBlockExtract",
  "figmaGeometryGroup", "figmaSectionNaming", "figmaComponentGen", "figmaAssembly",
];

export async function getReactTS_Template(): Promise<Record<string, { code: string }>> {
  const response = await fetch(apiUrl("/template/react-ts"));
  if (!response.ok) {
    throw new Error(`React 模板加载失败（HTTP ${response.status}）`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload)) {
    throw new Error("React 模板响应格式无效");
  }

  const entries = Object.entries(payload);
  if (entries.length === 0 || !entries.every(([, file]) => isTemplateFile(file))) {
    throw new Error("React 模板未返回有效文件");
  }
  return Object.fromEntries(entries) as Record<string, { code: string }>;
}

/**
 * 读取 /api/chat 的 SSE 流。协议错误直接抛出，让调用方展示失败原因。
 * 回调在解析保护区之外执行，因此回调自身的异常不会被转换成假成功事件。
 */
export async function generateAppStream(
  params: {
    messages: ChatMessage[];
    projectId?: string;
    mockConfig: MockConfig;
    operation?: "generate" | "edit";
    base?: EditBaseSnapshot;
    runId?: string;
  },
  onChunk: (event: StreamEvent) => void | Promise<void>,
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) {
    return;
  }

  const response = await fetch(apiUrl("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
    signal,
    body: JSON.stringify({
      messages: params.messages,
      projectId: params.projectId,
      mockConfig: params.mockConfig,
      operation: params.operation ?? "generate",
      base: params.base,
      runId: params.runId,
    }),
  });

  if (!response.ok) {
    throw new Error(`生成请求失败（HTTP ${response.status}）`);
  }
  if (response.body === null) {
    throw new Error("生成请求没有返回流式响应");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let receivedDone = false;
  const cancelReader = () => {
    void reader.cancel();
  };
  signal?.addEventListener("abort", cancelReader, { once: true });

  try {
    while (true) {
      if (signal?.aborted) {
        return;
      }
      const result = await reader.read();
      if (result.done) {
        buffer += decoder.decode();
        const finalFrames = splitSseFrames(buffer);
        buffer = finalFrames.remainder;
        for (const frame of finalFrames.frames) {
          const event = parseSseFrame(frame);
          if (event === null) continue;
          await onChunk(event);
          receivedDone ||= event.type === "done";
        }
        if (buffer.trim().length > 0) {
          throw new Error("SSE 响应在完整事件结束前结束");
        }
        break;
      }

      buffer += decoder.decode(result.value, { stream: true });
      const frames = splitSseFrames(buffer);
      buffer = frames.remainder;
      for (const frame of frames.frames) {
        const event = parseSseFrame(frame);
        if (event === null) continue;
        await onChunk(event);
        receivedDone ||= event.type === "done";
      }
    }
  } finally {
    signal?.removeEventListener("abort", cancelReader);
    reader.releaseLock();
  }

  if (!receivedDone) {
    throw new Error("SSE 响应缺少完成事件，生成结果不完整");
  }
}

function splitSseFrames(input: string): { frames: string[]; remainder: string } {
  const frames: string[] = [];
  let remainder = input;
  while (true) {
    const separator = findSseSeparator(remainder);
    if (separator === null) break;
    frames.push(remainder.slice(0, separator.index));
    remainder = remainder.slice(separator.index + separator.length);
  }
  return { frames, remainder };
}

function findSseSeparator(input: string): { index: number; length: number } | null {
  const candidates = [
    { index: input.indexOf("\r\n\r\n"), length: 4 },
    { index: input.indexOf("\n\n"), length: 2 },
    { index: input.indexOf("\r\r"), length: 2 },
  ].filter((candidate) => candidate.index >= 0);
  if (candidates.length === 0) return null;
  return candidates.reduce((first, candidate) =>
    candidate.index < first.index ? candidate : first,
  );
}

function parseSseFrame(frame: string): StreamEvent | null {
  const lines = frame.split(/\r?\n|\r/);
  const dataLines: string[] = [];
  for (const line of lines) {
    if (line.length === 0 || line.startsWith(":")) continue;
    if (!line.startsWith("data:")) {
      throw new Error("SSE 响应包含无法识别的事件行");
    }
    dataLines.push(line.slice(5).replace(/^ /, ""));
  }
  if (dataLines.length === 0) return null;

  const jsonText = dataLines.join("\n").trim();
  if (jsonText.length === 0) {
    throw new Error("SSE 事件缺少 JSON 数据");
  }
  let payload: unknown;
  try {
    payload = JSON.parse(jsonText) as unknown;
  } catch {
    throw new Error("SSE 事件不是有效的 JSON");
  }
  if (!isStreamEvent(payload)) {
    throw new Error("SSE 事件 payload 格式无效");
  }
  return payload;
}

function isStreamEvent(value: unknown): value is StreamEvent {
  if (!isRecord(value) || typeof value.type !== "string") return false;
  if (value.type === "flow") {
    return isRecord(value.data) && isBackendFlowType(value.data.flow) &&
      (value.data.operation === undefined || value.data.operation === "generate" || value.data.operation === "chat" || value.data.operation === "edit");
  }
  if (value.type === "chat") {
    return isRecord(value.data) && typeof value.data.delta === "string";
  }
  if (value.type === "mode") {
    return isModeEventData(value.data);
  }
  if (value.type === "candidate") {
    return isCandidateEventData(value.data);
  }
  if (value.type === "error") {
    return (value.data === undefined || isStreamErrorData(value.data)) &&
      (value.message === undefined || typeof value.message === "string");
  }
  if (value.type === "done") {
    return value.message === undefined || typeof value.message === "string";
  }
  return isStepType(value.type);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTemplateFile(value: unknown): value is { code: string } {
  return isRecord(value) && typeof value.code === "string";
}

function isBackendFlowType(value: unknown): value is BackendFlowType {
  return value === "traditional" || value === "chat";
}

function isStepType(value: unknown): value is StepType {
  return typeof value === "string" && STREAM_STEP_TYPES.includes(value as StepType);
}

function isModeEventData(value: unknown): value is ModeEventData {
  return isRecord(value) &&
    (value.mode === "mock" || value.mode === "real") &&
    typeof value.forced === "boolean" &&
    (value.message === undefined || typeof value.message === "string");
}

function isCandidateEventData(value: unknown): value is CandidateStreamEvent["data"] {
  if (!isRecord(value) || value.operation !== "edit" || typeof value.candidateId !== "string" || typeof value.runId !== "string" || typeof value.projectId !== "string" || !/^[0-9a-f]{64}$/.test(typeof value.baseHash === "string" ? value.baseHash : "") || typeof value.summary !== "string" || !isRecord(value.files) || !Array.isArray(value.resources) || !Array.isArray(value.changes)) {
    return false;
  }
  if (value.baseVersionId !== null && typeof value.baseVersionId !== "string") return false;
  if (!Object.values(value.files).every((file) => typeof file === "string")) return false;
  if (!value.resources.every((resource) => isRecord(resource) && typeof resource.id === "string" && typeof resource.kind === "string" && typeof resource.hostPath === "string" && typeof resource.sandpackPath === "string" && typeof resource.exportPath === "string" && typeof resource.contentType === "string" && (resource.contentHash === null || (typeof resource.contentHash === "string" && /^[0-9a-f]{64}$/.test(resource.contentHash))) && (resource.hashStatus === "known" || resource.hashStatus === "unknown"))) return false;
  return value.changes.every((change) => {
    if (!isRecord(change) || typeof change.path !== "string") return false;
    if (change.operation === "delete") return change.content === undefined;
    return (change.operation === "add" || change.operation === "modify") && typeof change.content === "string";
  });
}

function isStreamErrorData(value: unknown): value is StreamErrorData {
  return isRecord(value) &&
    (value.node === undefined || typeof value.node === "string") &&
    (value.message === undefined || typeof value.message === "string");
}

/** Legacy API is intentionally unavailable; all callers must use the stream API. */
export async function generateApp(): Promise<{ message: string }> {
  throw new Error("generateApp 已废弃，请使用 generateAppStream");
}
