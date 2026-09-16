# EVAL-03 状态

当前没有真实固定任务看板的独立功能证据。EVAL-03 保持 `NOT_READY` / `not-verified`，不能用 Mock、协议 fixture 或可选 Playwright 脚本结果替代。

最近一次临时浏览器复验发现：新增任务后进入 `/tasks/task_<timestamp>` 的路由正确，但编辑字段为空，原因是 `useTask` 只从静态 `MOCK_TASKS` 查找。已在 `source/hooks/useTask.ts` 改为读取共用任务 store；修复后的浏览器功能尚未重新验收，因此仍保持上述状态。
