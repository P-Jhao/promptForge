import type { ChatMessage } from "@/types/message";

/** 编辑请求只携带最近的项目消息，完整记录仍由项目持久化保留。 */
export const MAX_EDIT_HISTORY = 6;

export function limitEditHistory(messages: readonly ChatMessage[]): ChatMessage[] {
  return [...messages.slice(-MAX_EDIT_HISTORY)];
}
