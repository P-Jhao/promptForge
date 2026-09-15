export function classifyAssertionFailure(error, environment = false) {
  const message = error instanceof Error ? error.message : "未知错误";
  if (environment || error?.name === "NotVerifiedError") {
    return { status: "not-verified", evidence: `固定任务板尚未验证：${message}` };
  }
  return { status: "fail", evidence: `固定任务板功能断言失败：${message}` };
}
