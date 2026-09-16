# 独立任务看板案例准备

`caseId=task-board-real-eval` 是从真实模型产物整理出的独立案例，当前状态为 `NOT_READY`。它没有加入首页案例入口，现有 `/workspace` 和小说案例链接保持不变；在 EVAL-03 获得独立人工或单元/集成功能证据前，不应把任务看板显示为已验证案例。

主来源是 EVAL-01 的 `task-board-eval-01-003` 和 EVAL-02 的 `task-board-case-edit-20260916`，均为 21 个文件。`task-board-real-probe-20260916` 与 `task-board-real-edit-probe-20260916-r2` 只作对照，没有直接复制其负责人对象/字符串不一致和 `any` 问题。原始 run 目录不改写。

整理保留了任务标题、待办/进行中/已完成三列、新增和编辑任务、状态切换、关键词筛选、优先级字段及 EVAL-02 的优先级筛选。人工修正已在 `provenance.json` 列明：补充 `React` 运行时导入；修正大小写敏感的类型路径；把中文优先级字面量规范化为声明的联合类型；将入口错误边界从 `@ts-nocheck` 改为明确类型；补齐 `/tasks`、`/tasks/new` 路由和编辑按钮；将平铺任务列表整理为三列状态看板。它不是未经修改的模型原样输出。

源码目录自带 `package.json` 和锁文件。构建检查使用临时的固定 `index.html` 夹具，因为真实产物由 Sandpack/宿主提供入口文件；该夹具不写入案例源码，也不代表导出或离线可用。可复现命令：

```text
node scripts/checkTaskBoardCase.mjs
```

该命令检查 descriptor、manifest、provenance、来源 run、路径、`any`/`@ts-nocheck`、必要功能标记，然后在临时副本执行 `pnpm install --frozen-lockfile --ignore-workspace --ignore-scripts`、`pnpm exec tsc --noEmit --project tsconfig.json` 和 `pnpm run build`。source 自带严格 `tsconfig.json`，主 frontend 的类型检查会同时覆盖其中可兼容的源码。

主代理后续需在独立临时预览页中打开任务看板，确认三列、标题、新增、编辑、状态切换、关键词筛选和优先级筛选；至少用真实页面记录 EVAL-03 的功能证据后再考虑接入入口。当前没有提交独立运行 URL，不能用 `/workspace` 或小说案例 URL 宣称任务看板已可用。
