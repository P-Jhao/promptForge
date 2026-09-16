export type RequestIntent = "generate" | "edit" | "chat" | "clarify";

export interface RequestClassification {
  intent: RequestIntent;
  clarification?: string;
}

const EDIT_PATTERNS: RegExp[] = [
  /新增|添加|增加|加入|修改|更改|编辑|修复|解决|删除|移除|重构|优化|调整|替换|更新|完善|补充|实现|支持|重命名|改成|去掉|修正/u,
  /\b(add|modify|edit|fix|delete|remove|refactor|optimi[sz]e|update|change|improve|implement|replace|rename)\b/i,
];

const DELIVERY_PATTERNS: RegExp[] = [
  /做一个|创建|生成|开发|构建|搭建|制作|设计|写一个|需要一个|我要一个|实现一个|请帮我做|新建一个|添加一个|新增一个/u,
  /(?:做|创建|生成|开发|构建|搭建|制作|设计|写|新建|添加|新增|增加|实现)(?:一个|一套|新的?)?(?:页面|应用|网站|后台|看板|界面)/u,
  /\b(create|build|generate|develop|make|implement|design|website|web\s+app|dashboard|landing\s+page)\b/i,
];

const CHAT_PATTERNS: RegExp[] = [
  /解释|说明|介绍|概述|总结|为什么|如何|怎么|请问|问一下|讨论|聊聊|区别|是什么|能否|是否|可以吗|怎么样|告诉我|建议|看看|查看|原理|你好/u,
  /\b(why|what|how|explain|describe|discuss|difference|question|could you|can you tell|hello|hi)\b/i,
];

const QUESTION_PATTERNS: RegExp[] = [
  /^(?:解释|说明|为什么|如何|怎么|请问|问一下|能否|是否|可以吗|告诉我|建议)/u,
  /^(?:what|why|how|explain|describe|could you|can you tell)\b/i,
];

const NON_MUTATING_CHAT_PATTERN = /(?:不要|无需|不必|不用|无须)(?:再)?(?:修改|改动|变更|编辑|生成|创建|删除|重构|优化)/u;

const DIRECT_EDIT_PATTERN = /^(?:请|帮我|请帮我|能否|可以)?\s*(?:把|将|给我|新增|添加|增加|加入|修改|更改|编辑|修复|解决|删除|移除|重构|优化|调整|替换|更新|完善|补充|重命名|改成|去掉|修正)/u;
const CHINESE_NEW_PROJECT_PATTERN = /^(?:请|帮我|我想|我要|能否|可以)?\s*(?:新建|创建|另建|新开|另起|开始|开启|做|生成|打开|切换到)\s*(?:(?:一个|一份|一套)\s*)?(?:(?:全新|新的?|独立的?|另一个)\s*)?(?:项目|工程|工作区|工作台)(?:\s*(?:来|用于|开始|吧)|\s*[，,。！？].*)?$/u;
const CHINESE_NEW_PROJECT_NOUN_PATTERN = /^(?:(?:请|帮我|我想|我想要|我要)\s*)?(?:一个|一份|一套)?\s*(?:全新的?|新的?|独立的?|另一个)\s*(?:项目|工程|工作区|工作台)$/u;
const ENGLISH_NEW_PROJECT_PATTERN = /^(?:please\s+)?(?:create|start|open|begin|make)\s+(?:a\s+)?(?:new|separate|another)\s+(?:project|workspace)(?:\s+(?:for|to|with)\b.*)?$/i;

export function isNewProjectRequest(content: string): boolean {
  const normalized = content.trim().replace(/\s+/gu, " ");
  if (normalized.length === 0) return false;
  return CHINESE_NEW_PROJECT_PATTERN.test(normalized)
    || CHINESE_NEW_PROJECT_NOUN_PATTERN.test(normalized)
    || ENGLISH_NEW_PROJECT_PATTERN.test(normalized);
}

const CLARIFICATION_MESSAGE = "请说明你希望创建一个新页面、调整当前页面，还是先讨论需求；需求不明确时我会先询问，不会修改代码。";

function matchesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

function isQuestionLike(value: string): boolean {
  return value.includes("?") || value.includes("？") || matchesAny(value, QUESTION_PATTERNS);
}

function isDirectEditRequest(value: string): boolean {
  return DIRECT_EDIT_PATTERN.test(value);
}

function isNonMutatingChatRequest(value: string): boolean {
  return NON_MUTATING_CHAT_PATTERN.test(value);
}

export function classifyRequestIntent(content: string, hasFiles: boolean): RequestClassification {
  const normalized = content.trim();
  if (normalized.length === 0) {
    return { intent: "clarify", clarification: CLARIFICATION_MESSAGE };
  }

  const hasEditSignal = matchesAny(normalized, EDIT_PATTERNS);
  const hasDeliverySignal = matchesAny(normalized, DELIVERY_PATTERNS);
  const questionLike = isQuestionLike(normalized);
  const hasChatSignal = questionLike || matchesAny(normalized, CHAT_PATTERNS);
  const directEdit = isDirectEditRequest(normalized);

  if (hasChatSignal && isNonMutatingChatRequest(normalized) && !hasDeliverySignal) {
    return { intent: "chat" };
  }
  if (hasFiles && hasEditSignal && (directEdit || !questionLike)) {
    return { intent: "edit" };
  }
  if (hasChatSignal && !directEdit) {
    return { intent: "chat" };
  }
  if (hasDeliverySignal) {
    return { intent: "generate" };
  }
  if (!hasFiles && hasEditSignal) {
    return { intent: "clarify", clarification: CLARIFICATION_MESSAGE };
  }
  return { intent: "clarify", clarification: CLARIFICATION_MESSAGE };
}
