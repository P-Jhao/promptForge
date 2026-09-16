# 独立任务看板案例

`caseId=task-board-real-eval` 是从真实模型产物整理出的独立案例，当前状态为 `READY`。它已通过首页链接和 `/workspace?case=task-board-real-eval` 静态入口加载已保存成果；`READY` 只表示真实来源、构建检查和临时 Vite 人工 EVAL-03 已满足固化门槛，不代表 Sandpack、离线使用或原生 ZIP 已验证。

主来源是 EVAL-01 的 `task-board-eval-01-003` 和 EVAL-02 的 `task-board-case-edit-20260916`，均为 21 个文件。`task-board-real-probe-20260916` 与 `task-board-real-edit-probe-20260916-r2` 只作对照，没有直接复制其负责人对象/字符串不一致和 `any` 问题。原始 run 目录不改写。

整理保留了任务标题、待办/进行中/已完成三列、新增和编辑任务、状态切换、关键词筛选、优先级字段及 EVAL-02 的优先级筛选。人工修正已在 `provenance.json` 列明：补充 `React` 运行时导入；修正大小写敏感的类型路径；把中文优先级字面量规范化为声明的联合类型；将入口错误边界从 `@ts-nocheck` 改为明确类型；补齐 `/tasks`、`/tasks/new` 路由和编辑按钮；将平铺任务列表整理为三列状态看板；补齐 Tailwind/PostCSS 配置和入口指令；把看板工具栏标题改为“任务看板”；让编辑页从看板共用的任务 store 按 ID 读取新增和更新后的任务。它不是未经修改的模型原样输出。

源码目录自带 `package.json`、`pnpm-lock.yaml` 和严格 `tsconfig.json`，并包含 Tailwind/PostCSS 配置。构建检查使用临时的固定 `index.html` 夹具，因为真实产物由 Sandpack/宿主提供入口文件；该夹具不写入案例源码，也不代表导出或离线可用。可复现命令：

```text
node scripts/checkTaskBoardCase.mjs
```

该命令检查 descriptor、manifest、provenance、来源 run、路径、`any`/`@ts-nocheck`、必要功能标记和 Tailwind/PostCSS 管线，然后在临时副本执行 `pnpm install --frozen-lockfile --ignore-workspace --ignore-scripts`、`pnpm exec tsc --noEmit --project tsconfig.json` 和 `pnpm run build`。source 自带严格 `tsconfig.json`，主 frontend 的类型检查会同时覆盖其中可兼容的源码。

EVAL-03 的人工证据来自主代理 Edge 临时 Vite 页 `http://127.0.0.1:4176/#/`，已覆盖三列、标题、新增、编辑、状态切换、关键词筛选和优先级筛选。案例现在可从 `/workspace?case=task-board-real-eval` 直接加载静态成果，示例体验不会发送 `/api/chat`；该入口已完成代码接入检查，但 Sandpack 运行、原生 ZIP 和离线使用仍未验证。

`generatedFiles.ts` 由 `node scripts/assembleTaskBoardCase.mjs` 从本目录的 `source/` 生成；客户端只导入静态 map，不读取文件系统。运行 `node scripts/assembleTaskBoardCase.mjs --check` 可确认生成物与已提交源文件一致。
