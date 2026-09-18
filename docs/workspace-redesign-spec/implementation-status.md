# 工作台重设计实施记录

更新时间：2026-09-19

## 2026-09-18 Fork 重构

- 工作区上下文现在明确区分 `chooser`、`example` 和 `project`；`/workspace` 无 `case` 参数进入案例选择页，`/workspace?case=...` 进入只读案例。
- 删除用户可见的示例/真实模式 Toggle。示例顶部“开始一个新的项目”返回无参数 chooser；左栏 Fork CTA 和示例状态的第一条 Prompt 会复制案例并完成一次真实项目创建，再发送同一条 Prompt。
- Fork 复用现有 IndexedDB 项目仓储，不新增后端 API 或持久化 schema；复制案例文件后首次自动保存一次，后续修改仍使用显式保存和 dirty 保护。
- 真实状态顶部切换为项目名、保存状态、分享、导出和更多菜单；左栏切换为 PromptForge Agent，同时保留现有消息、ThoughtChain、候选和版本历史。
- 预览工具栏固定为预览/代码、刷新、全屏，移除设备类型、Viewport、缩放和 Sandpack 内置重复刷新按钮。

## 2026-09-19 初始工作台入口与案例导航修正

- 示例顶部“开始一个新的项目”统一回到 `/workspace` chooser；进入 chooser 时清理案例预览、旧消息和临时工作副本，避免与无参数初始页语义不一致。
- 案例选择页在“查看案例介绍”下方承载三条 Prompt 起始示例；真实项目继续只显示 PromptForge Agent 对话，不重复展示首页起始卡片。
- “更多示例”通过统一 registry 动态筛选当前案例之外的全部用户可选案例；历史 task-board 源码保持不注册、不展示。
- 案例图标继续使用现有 Lucide 业务图标，但统一 SVG block/flex 居中、固定尺寸、描边和蓝紫对比度，覆盖选择页、示例主卡片与更多示例行。

## 已实施

- 工作台外壳改为顶部项目栏、桌面约 360px 左侧对话栏和右侧预览/代码区；外壳样式集中在 `frontend/src/components/shell/AppShell.module.css`，保留窄屏对话/预览切换。
- 项目切换、保存、另存为、版本历史、重命名、删除继续复用现有 persistence 和 mutation hooks。顶部导出入口通过 `resolveDownloadSource` 显示“当前案例”或“当前工作副本”；候选预览不会改变普通项目导出对象。
- 顶部项目动作、菜单与导出逻辑已拆到 `ProjectManagerTopActions.tsx`；另存为和未保存切换提示独立为对话组件，`ProjectManager.tsx` 保持在 300 行以内且不复制 persistence 业务逻辑。
- 右侧工具栏集中提供预览/代码、刷新和全屏。刷新只触发现有 Sandpack `runSandpack`，不创建模型运行记录。
- 示例案例通过 `frontend/src/cases/caseRegistry.ts` 按选中 case 动态加载。小说、阅读笔记和三个 workspace demo 保留；历史任务看板源文件不再注册为用户可选案例，旧任务看板 URL 不再作为有效案例入口。
- 默认案例选择页（`CaseChooserPanel.tsx`）和首页案例展示包含客户管理后台、数据分析看板、青山博客；青山博客对应 `personal-blog-demo`。三个案例仍明确标为“待浏览器验收”，不暗示目标工作台交互已通过。
- 案例选择页的 Prompt 起始示例位于“查看案例介绍”下方；示例项目不再重复显示这组三张起始卡片，真实项目仍由 PromptForge Agent 承接消息与状态。
- 根目录 `AGENTS.md` 已同步记录案例只读、首次 Fork 自动保存一次和后续显式保存语义，因为本轮改变了核心产品边界。

## 三个案例来源

三个案例均先通过现有真实 `/api/chat` SSE 链路生成，并记录了 `mode={real, forced=false}`、传统流程事件、`files` 和 `done`。每个案例目录还包含 `validation-report.json`，当前诚实标为 `PENDING_BROWSER`：

| case ID | 真实运行记录 | 固化源 | 人工修正记录 |
| --- | --- | --- | --- |
| `customer-management-demo` | `artifacts/real-runs/workspace-demos/customer-management-demo-20260917/record.json` | `frontend/src/cases/customer-management/source/` | 同一 run 目录 `manual-corrections.json`；案例目录 `validation-report.json` |
| `analytics-dashboard-demo` | `artifacts/real-runs/workspace-demos/analytics-dashboard-demo-20260917/record.json` | `frontend/src/cases/analytics-dashboard/source/` | 同一 run 目录 `manual-corrections.json`；案例目录 `validation-report.json` |
| `personal-blog-demo` | `artifacts/real-runs/workspace-demos/personal-blog-demo-20260917/record.json` | `frontend/src/cases/personal-blog/source/` | 同一 run 目录 `manual-corrections.json`；案例目录 `validation-report.json` |

原始 `files.json` 和 `raw-sse.txt` 保留在各自 run 目录。Luna 的修正将生成结果收敛为目标交互所需的无后端、无远程资源静态演示；修正没有覆盖原始 run。三个案例的数据为合成或虚构内容，新增/编辑仅在当前预览内存中保留。

## 检查结果

已执行：

- `pnpm --dir frontend exec tsc --noEmit`：通过。
- 受影响前端文件 ESLint：通过。
- `node scripts/assembleWorkspaceDemoCase.mjs --case=customer-management --check`：通过。
- `node scripts/assembleWorkspaceDemoCase.mjs --case=analytics-dashboard --check`：通过。
- `node scripts/assembleWorkspaceDemoCase.mjs --case=personal-blog --check`：通过。
- `node scripts/checkWorkspaceDemoCases.mjs`：通过，三个 descriptor、manifest、provenance、真实 run 和固化源文件一致。
- 三个固化案例 `source/App.tsx` 分别用前端 TypeScript JSX 检查：通过。
- `pnpm --dir frontend run lint`：通过，仓库既有生成案例有 23 条 warning，无 error。
- `pnpm --dir frontend run build`：通过。
- `git diff --check`：通过；仅提示既有 `docs/phase-two-spec/plan.md` 的 CRLF 转换警告。

## 主代理浏览器已验证

以下证据来自 Codex In-app Browser 的 `localhost:3000` 窄屏视口（约 369px）：

- 首页主按钮、首页案例区和工作台示例空态默认指向三个新案例；旧案例 URL 仍可直接访问，首页浏览未因此启动新的生成请求。
- 顶部项目菜单可以展开和关闭；按 Escape 关闭后焦点回到“更多”按钮。
- 本地项目浏览器中的重命名、删除入口可见；案例导出标签可见；预览中央 loading 状态可见。
- 客户管理后台、数据分析看板、个人博客三个静态案例均可在 Sandpack 挂载；预览/代码切换和全屏/退出全屏可用。
- 窄屏页面无横向溢出；代码编辑器自身滚动不计入页面溢出。

本轮 Fork 重构新增的浏览器记录见 [`../workspace-fork-flow/README.md`](../workspace-fork-flow/README.md)。当前记录覆盖 1280×720 宿主视觉、案例选择页、示例顶部返回 chooser 和左栏 Fork 语义；Sandpack runtime 超时使 CRM iframe 内部交互仍保持未验证。

## 未验证项

- Edge 桌面通道的 AX/截图请求超时，1440px/1280px 布局、桌面完整焦点顺序和遮挡情况仍未验证。
- 当前工具无法安全点击 Sandpack 跨 iframe 的 fractional 坐标；三个案例的搜索/筛选/新增必填校验/编辑/详情抽屉、日期无数据联动、博客详情返回和明暗主题尚未交互验证。
- 真实生成请求、候选预览/应用/放弃、项目保存/恢复保护、原生 ZIP 下载、解压后运行、远程资源失败和离线行为仍未验证；新案例没有远程资源。
- 三个 descriptor 仍为 `PENDING_BROWSER`，不可标记 `READY`；目标案例交互和桌面现场证据完成前，不升级默认可用状态。真实来源、静态一致性和代码检查已完成，但不能替代上述现场证据。
