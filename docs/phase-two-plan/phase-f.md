# 阶段 F 交接：项目主会话、项目管理与版本体验

更新时间：2026-09-17

阶段 F 的 F1、F2、F3 已落到代码。对应 fixture、前端 TypeScript、lint 和 build 检查已有通过记录；这些结果证明代码路径和边界检查成立，不等同于完整浏览器验收。F1/F2/F3 的实现没有引入通用 `Session`/thread 表或云同步，项目主会话继续复用 `Project.messages`。

## 实现范围与提交

### F1：项目主会话与普通入口

`591a130`（`实现阶段F1项目主会话入口`）和 `9641797`（`实现聊天中新建项目确认流程`）落地了单一聊天输入、内部 `generate`/`edit`/`chat`/澄清判定、新项目清理、项目消息复用和编辑请求的当前文件快照/hash 语义。`9641797` 进一步识别聊天中的“新项目”请求，提供可访问确认弹窗，支持取消、保存后新建、放弃修改并新建三条路径，并在请求/预览/保存/候选占用时保护当前项目。主要范围包括：

- `frontend/src/components/shell/AppShell.tsx`、`ChatPanel.tsx`、`GenerationStatusPanel.tsx`、`ProjectManager.tsx`；
- `frontend/src/components/landing/LandingPage.tsx`、`frontend/src/components/preview/SandpackView.tsx`；
- `frontend/src/hooks/useChat.ts`、`chatRequestRunner.ts`、`chatStreamUtils.ts`；
- `frontend/src/lib/requestIntent.ts`、`newProjectGuard.ts`；
- `scripts/checkPhaseF1.mjs`。

普通聊天只追加主会话消息，不创建候选或版本；明确的生成/编辑仍遵守已有候选隔离和确认应用边界。新项目清空消息、候选、版本和预览文件，打开项目沿用持久化 hydrate 路径。

`8ef7b44`（`修复普通聊天请求路由与操作类型`）将前端内部判定的普通聊天明确发送为 `operation=chat`，后端校验接受该操作并直接进入既有 chat graph，保留旧客户端缺省 `generate`、显式 `edit` 的兼容路径；`scripts/checkPhaseF1.mjs` 增加了显式 chat 接受、直达 chat graph 和不创建候选的 fixture。

### F2：项目重命名、删除与存量兼容

`52803a3`（`实现项目重命名删除与事务保护`）增加了项目列表重命名/删除入口、dirty/进行中状态保护、IndexedDB readwrite 事务、删除 tombstone 和旧标签页迟到写入拒绝，并保留旧 schema 可读性。主要范围包括：

- `frontend/src/components/shell/ProjectBrowserModal.tsx`、`ProjectManager.tsx`、`ProjectMutationDialogs.tsx`；
- `frontend/src/hooks/useProjectManagerMutations.ts`、`useProjectPersistence.ts`；
- `frontend/src/lib/projectRepository.ts`、`projectRepositoryMutations.ts`、`projectStorage.ts`；
- `frontend/src/types/project.ts`；
- `scripts/checkPhaseF2.mjs`。

### F3：版本栏、恢复与标签元数据

`085af73`（`实现项目版本历史与元数据`）增加了顶部项目/版本/保存状态、自动递增版本、恢复来源、版本卡片和 label/notes 元数据更新；`2a5c140`（`修正版本元数据脏状态提示`）修正了含未保存工作副本时的 clean 基线；`cabdf86`（`支持未保存版本元数据暂存`）支持尚未落盘的新版本在内存中编辑标签/备注；`143e59d`（`修正新项目保存状态显示`）修正了从已保存项目新建空白项目时沿用“已保存”显示的问题。主要范围包括：

- `frontend/src/components/shell/AppShell.tsx`、`ProjectBrowserModal.tsx`、`ProjectManager.tsx`、`VersionCard.tsx`、`ChatPanel.tsx`；
- `frontend/src/hooks/useProjectPersistence.ts`；
- `frontend/src/lib/projectRepository.ts`、`projectRepositoryMutations.ts`、`projectSerialization.ts`、`projectStorageCodec.ts`；
- `frontend/src/store/chatStore.ts`、`frontend/src/types/components.ts`、`project.ts`、`store.ts`；
- `scripts/checkPhaseF3.mjs`。

版本快照、`versionId`、hash 和数字序列保持不可变；已有 v4 时从 v2 恢复生成 v5，并保留 v3/v4。标签/备注只更新元数据；未保存新版本的元数据先在内存暂存并提示保存，不能写入不存在的仓储版本。

### 收尾修正：案例隔离与路由重挂基线

`33e5986`（`修复案例隔离运行摘要与编辑历史边界`）补齐了项目重开时可序列化的运行摘要恢复、编辑请求最近 6 条消息的有界上下文、存储操作保护，并修正候选/修复状态边界。`c94cbab`（`修复案例隔离与路由重挂保存基线`）将案例文件和资源清单放入 Sandpack 的 `previewFiles`/`previewManifest`，不再写入当前项目的 `currentFiles`、`generatedFiles`、消息、版本或运行状态；同时保留项目资源记录，案例外链仍由案例 manifest 负责导出检查。`47347a3`（`修复路由基线竞态并拆分持久化逻辑`）把基线控制器按 `projectId` 分桶，路由重挂时从已保存快照恢复基线，并用每项目请求序号和 effect cleanup 防止旧的只读读取覆盖切换、保存或打开后的成功基线；运行时草稿构造也已拆分，持久化 hook 保持在 300 行以内。

## 可复现检查证据

以下检查已在上述提交及后续修正中运行通过：

| 检查 | 结果 |
| --- | --- |
| `node scripts/checkPhaseF1.mjs` | 通过：请求分类、新项目保护、单一输入和候选边界 fixture |
| `node scripts/checkPhaseF2.mjs` | 通过：重命名 ID 不变、删除范围/回滚保护、迟到写入拒绝、旧 schema 读取 |
| `node scripts/checkPhaseF3.mjs` | 通过：旧字段默认、只改元数据、修订冲突、v4→v5 恢复来源、无 v0 及新项目保存状态静态断言 |
| `node scripts/checkTaskBoardCase.mjs --write-report` | PASS：任务看板来源、manifest、源码、类型检查和构建产物符合 READY 案例契约 |
| `pnpm --dir frontend exec tsc --noEmit` | 通过 |
| `pnpm --dir frontend run lint` | 0 errors；23 个既有 warnings |
| `pnpm --dir frontend run build` | 通过 |
| `node --check scripts/checkPhaseF1.mjs`、`node --check scripts/checkPhaseF3.mjs`、定向 ESLint、`git diff --check` | 通过 |

F1/F2/F3 的 fixture 只验证可重复的代码/存储边界，不模拟模型，也不把 Mock 或 A–E 的 recorder 记录当作 F 阶段浏览器证据。

## 浏览器证据与人工清单

已有的 2026-09-16 Edge 证据包括任务看板入口一次 Sandpack `done(compilatonError=false)` + `app-mounted` 和筛选观察、桌面焦点与表单局部键盘操作；另有 In-app Browser `390x844` 的无横向溢出和加载提示观察。2026-09-17 主代理在 Edge 桌面补充验证了 `/workspace` 空白项目的“尚无已接受版本 · 未保存”、中央 Sandpack 从加载提示到就绪、示例/真实切换，以及真实体验输入“请新建一个项目”后出现 `alertdialog`；取消后原项目和输入保持不变。同日从已保存项目“新项目222”切换真实体验，输入“请新建一个项目”确认后进入独立“新项目”空白上下文（显示“尚无已接受版本 · 未保存”），旧项目仍在打开列表且可重新打开，新项目未带入旧消息、文件或版本。另一次“已保存项目 → 首页 → 任务看板案例”路由复测中，项目仍显示“已保存”；任务板 Sandpack 完成真实 ready/app-mounted 握手，选择优先级“高”显示“共 2 个任务”。首页小说案例观察到 6 个远程封面均 `complete=true`、`naturalWidth=400`，示例/真实切换可见。项目历史入口显示重命名/删除且无 v0，已有项目历史显示当前/历史/恢复来源，版本标签/备注表单可见；首页 hero/CTA、小说书库/阅读笔记案例和远程封面也完成了局部 ready 观察。

同日还对已有项目发起了普通解释请求。旧后端进程首次返回 HTTP 400；重启后同一请求进入“正在回复”，约 4.2 秒显示“回复完成 真实模型”，只追加 assistant 文本，项目仍为 `v4 · 未保存`，没有候选或新版本；直接 `/api/chat` SSE 为 `flow=chat`、`done`。HTTP 400 保留为修复前证据，不计为成功。这些是 F1/F2/F3 的局部目标路径证据，不能证明完整浏览器矩阵或完整真实聊天链路。

随后在已保存项目“新项目222”中发起一次真实编辑请求：“请在当前页面的标题下添加一行简短的说明文字，同时保留现有功能。”约 7.2 秒后得到“候选待应用”，L0 协议、L1 源码、L2 预览均通过；候选含 50 个文件，变更为 `+0/~1/-0`，预览显示新增说明。点击“放弃”后候选消失，项目仍显示 `v4 · 未保存`（此前测试聊天尚未保存），预览恢复原小说页面；刷新并重新打开“新项目222”后恢复为 `v4 · 已保存`，只保留持久化的原始消息和文件。该次证据只覆盖一次真实 edit 候选的预览、放弃和恢复，不替代 EVAL-02 三次功能保留，也不证明完整应用、保存/恢复及失败/取消矩阵。

后续人工验收应覆盖：

1. **局部完成（2026-09-17 Edge 桌面）：** 已核对 `/workspace` 新建空白项目显示“尚无已接受版本 · 未保存”、示例/真实切换、真实体验“请新建一个项目”的确认弹窗，以及取消后原项目和输入不变；从已保存项目“新项目222”确认后进入独立“新项目”空白上下文，旧项目仍在打开列表且可重新打开，新项目未带入旧消息、文件或版本；路由往返后进入任务看板案例仍保持“已保存”，Sandpack ready 后优先级“高”得到 2 个任务。仍需核对背景选择、完整双项目隔离矩阵和打开已保存项目后的完整恢复。
2. 在空项目、已有代码和解释请求中分别核对 `generate`、`edit`、`chat` 及歧义澄清；用真实 `/api/chat` 检查普通聊天不产生候选/版本、编辑使用发送时完整快照/hash。当前已有一次 edit 候选预览/放弃/重开恢复证据，但完整应用、保存/恢复和失败/取消矩阵仍需人工验收。
3. 重命名后核对 `projectId`、消息、文件和版本身份不变；在 dirty、写入/生成/验证/修复、候选和多标签占用时核对删除保护，模拟事务失败并核对列表和工作副本保留，再核对成功删除回到空白入口及旧标签写入拒绝。
4. 核对版本栏、标签/备注、v1 起始序列和 v4 中恢复 v2 产生 v5；确认恢复来源、后续历史、dirty 基线和未保存版本元数据提示。
5. 补做移动端/键盘完整流程、其他浏览器、完整失败/取消/超时/资源矩阵、导出构建、原生 ZIP 和 IndexedDB 第五类故障。

当前仍未验证：完整浏览器状态矩阵、移动端/键盘完整流程、真实聊天完整链路（本次仅有一次普通解释请求的 Edge 局部证据）、背景选择与完整双项目隔离矩阵、ZIP/导出、离线行为、IndexedDB 第五类故障和跨浏览器状态矩阵。Vue 生成、预览、保存和修复继续属于未实现范围。
