import express, { type NextFunction, type Request, type Response } from "express";
import { createServer } from "node:http";
import templateRouter from "../routes/template.js";
/** Local-only SSE fixture; run `pnpm exec tsx test/feedbackFixture.ts`. */
/**
 * It listens only on 127.0.0.1:7002, never calls an LLM, and serves the
 * template route for browser checks. Markers: [fixture:success] (default),
 * [fixture:fail:<node>], [fixture:eof], [fixture:delay], [fixture:chat],
 * and [fixture:429].
 */
const HOST = "127.0.0.1";
const PORT = 7002;
const DELAY_MS = 10_000;
const CHAT_DELTA_MS = 100;

type UnknownRecord = Record<string, unknown>;
type FixtureScenario =
  | { kind: "success" } | { kind: "failure"; node: string }
  | { kind: "eof" } | { kind: "delay" } | { kind: "chat" }
  | { kind: "http429" };
const SUCCESS_FILES: Record<string, string> = {
  "/App.tsx": `export default function App() { return <main>Feedback fixture</main>; }
`,
  "/index.tsx": `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing root element");
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
  "/styles.css": "body { margin: 0; font-family: system-ui, sans-serif; }\n",
  "/package.json": JSON.stringify({ name: "feedback-fixture", private: true,
    dependencies: { react: "latest", "react-dom": "latest" } }, null, 2),
};
function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPrompt(body: unknown): string {
  if (!isRecord(body) || !Array.isArray(body.messages)) {
    return "";
  }

  const lastMessage = body.messages.at(-1);
  return isRecord(lastMessage) && typeof lastMessage.content === "string"
    ? lastMessage.content
    : "";
}
function hasMarker(prompt: string, marker: string): boolean {
  return prompt.toLowerCase().includes(marker);
}

function selectScenario(prompt: string): FixtureScenario {
  const failure = prompt.match(
    /\[fixture:(?:fail|failure):([A-Za-z][A-Za-z0-9_-]*)\]/i,
  );
  if (failure?.[1] !== undefined) {
    return { kind: "failure", node: failure[1] };
  }

  if (hasMarker(prompt, "[fixture:429]")) return { kind: "http429" };
  if (hasMarker(prompt, "[fixture:eof]")) return { kind: "eof" };
  if (hasMarker(prompt, "[fixture:delay]")) return { kind: "delay" };
  if (hasMarker(prompt, "[fixture:chat]")) return { kind: "chat" };

  return { kind: "success" };
}
function setCorsHeaders(response: Response): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type,Accept");
}
function setSseHeaders(response: Response): void {
  setCorsHeaders(response);
  response.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  response.setHeader("Cache-Control", "no-cache, no-transform");
  response.setHeader("Connection", "keep-alive");
  response.setHeader("X-Accel-Buffering", "no");
  response.flushHeaders();
}

function writeSse(response: Response, payload: unknown): boolean {
  if (response.writableEnded || response.destroyed) {
    return false;
  }

  response.write(`data: ${JSON.stringify(payload)}\n\n`);
  return true;
}

function writeTraditionalPrefix(
  response: Response,
  includeAnalysis: boolean,
): boolean {
  const events: UnknownRecord[] = [
    { type: "mode", data: { mode: "mock", forced: true } },
    { type: "flow", data: { flow: "traditional" } },
  ];
  if (includeAnalysis) {
    events.push({
      type: "analysis",
      data: { summary: "Feedback fixture analysis" },
    });
  }
  return events.every((event) => writeSse(response, event));
}

function writeFiles(response: Response): boolean {
  return writeSse(response, {
    type: "files",
    data: {
      files: SUCCESS_FILES,
      stats: { totalFiles: Object.keys(SUCCESS_FILES).length },
    },
  });
}

interface ConnectionState {
  closed: boolean;
  completed: boolean;
  timer: NodeJS.Timeout | undefined;
}

function attachCloseLogging(
  request: Request,
  response: Response,
  state: ConnectionState,
  scenario: FixtureScenario,
): () => void {
  const clearTimer = (): void => {
    if (state.timer === undefined) return;
    clearTimeout(state.timer);
    state.timer = undefined;
  };

  const handleClose = (): void => {
    if (state.closed) return;

    state.closed = true;
    clearTimer();
    const reason = state.completed ? "completed" : "client disconnected";
    console.log(`[feedback-fixture] response close (${reason}); timer cleared; scenario=${scenario.kind}`);
  };

  request.once("aborted", handleClose);
  response.once("close", handleClose);

  return (): void => {
    clearTimer();
    request.removeListener("aborted", handleClose);
    response.removeListener("close", handleClose);
  };
}

function finishResponse(
  response: Response,
  state: ConnectionState,
  cleanup: () => void,
): void {
  if (state.closed || response.writableEnded || response.destroyed) {
    cleanup();
    return;
  }

  state.completed = true;
  response.end();
}

function streamChat(
  response: Response,
  state: ConnectionState,
  cleanup: () => void,
): void {
  const deltas = ["这是本地反馈夹具的", "增量回复。"];
  let index = 0;

  const sendNext = (): void => {
    if (state.closed) return;

    if (index >= deltas.length) {
      if (writeSse(response, { type: "done" })) {
        finishResponse(response, state, cleanup);
      }
      return;
    }

    const delta = deltas[index];
    index += 1;
    if (!writeSse(response, { type: "chat", data: { delta } })) return;

    state.timer = setTimeout(sendNext, CHAT_DELTA_MS);
  };

  sendNext();
}
const app = express();
const JSON_BODY_LIMIT_BYTES = 1024 * 1024;
app.disable("x-powered-by");
app.use((request: Request, response: Response, next: NextFunction): void => {
  setCorsHeaders(response);
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});
app.use(express.json({ limit: JSON_BODY_LIMIT_BYTES }));
app.use("/api/template", templateRouter);

app.post("/api/chat", (request: Request, response: Response): void => {
  const prompt = readPrompt(request.body as unknown);
  const scenario = selectScenario(prompt);
  console.log(`[feedback-fixture] scenario=${scenario.kind}`);

  if (scenario.kind === "http429") {
    response.setHeader("Retry-After", "1");
    response.status(429).json({ error: "Feedback fixture forced HTTP 429" });
    return;
  }

  setSseHeaders(response);
  const state: ConnectionState = {
    closed: false,
    completed: false,
    timer: undefined,
  };
  const cleanup = attachCloseLogging(request, response, state, scenario);

  if (scenario.kind === "chat") {
    if (
      writeSse(response, {
        type: "mode",
        data: { mode: "mock", forced: true },
      }) &&
      writeSse(response, { type: "flow", data: { flow: "chat" } })
    ) {
      streamChat(response, state, cleanup);
    }
    return;
  }

  if (!writeTraditionalPrefix(response, scenario.kind !== "failure")) {
    return;
  }

  if (scenario.kind === "failure") {
    writeSse(response, {
      type: "error",
      data: {
        node: scenario.node,
        message: `Feedback fixture failed at ${scenario.node}`,
      },
      message: `Feedback fixture failed at ${scenario.node}`,
    });
    finishResponse(response, state, cleanup);
    return;
  }

  if (scenario.kind === "delay") {
    state.timer = setTimeout(() => {
      if (state.closed || !writeFiles(response)) {
        return;
      }

      if (writeSse(response, { type: "done" })) {
        finishResponse(response, state, cleanup);
      }
    }, DELAY_MS);
    return;
  }

  writeFiles(response);
  if (scenario.kind === "eof") {
    finishResponse(response, state, cleanup);
    return;
  }

  if (writeSse(response, { type: "done" })) {
    finishResponse(response, state, cleanup);
  }
});

const server = createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`[feedback-fixture] listening at http://${HOST}:${PORT}`);
  console.log(
    "[feedback-fixture] template: GET /api/template/react-ts; chat: POST /api/chat",
  );
});

server.on("error", (error: NodeJS.ErrnoException): void => {
  console.error("[feedback-fixture] server error:", error);
  process.exitCode = 1;
});
