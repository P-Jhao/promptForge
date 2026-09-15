import { generateEditCandidate } from "./editGeneration.js";
import type { ChatRequestData } from "./chatValidation.js";

interface EditStreamContext {
  request: ChatRequestData;
  allNodesUseMock: boolean;
  isStopped: () => boolean;
  writeSse: (payload: unknown) => boolean;
  end: () => void;
}

/** Handle the explicit edit operation without entering the first-generation graph. */
export async function streamEditRequest(context: EditStreamContext): Promise<boolean> {
  if (context.request.operation !== "edit") return false;
  if (context.allNodesUseMock) {
    context.writeSse({
      type: "error",
      data: { node: "edit", message: "编辑流程要求真实模型，当前服务端配置为 Mock。" },
      message: "编辑流程要求真实模型，当前服务端配置为 Mock。",
    });
    context.end();
    return true;
  }

  if (!context.writeSse({ type: "flow", data: { flow: "traditional", operation: "edit" } })) {
    context.end();
    return true;
  }
  if (context.request.base === undefined || context.request.projectId === undefined || context.request.runId === undefined) {
    throw new Error("编辑请求缺少已校验的项目基线或 runId");
  }
  const prompt = [...context.request.messages]
    .reverse()
    .find((message) => message.role === "user");
  if (prompt === undefined || typeof prompt.content !== "string") {
    throw new Error("编辑请求缺少用户修改需求");
  }
  const candidate = await generateEditCandidate(
    context.request.base,
    prompt.content,
    context.request.messages,
    context.request.runId,
  );
  if (context.isStopped()) return true;
  if (!context.writeSse({ type: "candidate", data: candidate })) {
    context.end();
    return true;
  }
  context.writeSse({ type: "done" });
  context.end();
  return true;
}
