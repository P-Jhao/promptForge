# 阶段 B 交接：本地项目保存、打开与历史恢复

状态：阶段 B 的 React 垂直切片已实现，主代理需要完成浏览器现场验收。IndexedDB 适配器已用可控的内存 IndexedDB fixture 检查；真实浏览器配额、损坏数据和双标签页场景仍待现场执行。390px 头部已收缩为图标品牌并为项目管理控件保留可用空间，需由主代理在移动端复核无裁切。阶段 C 的候选修改链路没有在本阶段实现。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 B”。本记录只描述当前实现和证据，不替代计划。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 可序列化项目 schema | [`project.ts`](../../frontend/src/types/project.ts)、[`projectSerialization.ts`](../../frontend/src/lib/projectSerialization.ts) | 明确定义 Project、Workspace、不可变 Version、Run 摘要和 Resource 记录；保存只复制消息、文件和版本的纯数据字段，不持久化包含 ReactNode 的 `ThoughtItem`。文件路径、ID、时间和 SHA-256 hash 在进入仓储前校验。 |
| IndexedDB 原子仓储 | [`projectRepository.ts`](../../frontend/src/lib/projectRepository.ts)、[`projectStorage.ts`](../../frontend/src/lib/projectStorage.ts)、[`projectStorageCodec.ts`](../../frontend/src/lib/projectStorageCodec.ts) | 数据库 schema version=1，分开保存 projects/workspaces/versions/runs/resources；项目、工作副本、新版本、运行摘要和资源索引在同一 readwrite transaction 中写入。版本 ID 已存在且内容变化时拒绝修改。 |
| 保存和修订冲突 | [`useProjectPersistence.ts`](../../frontend/src/hooks/useProjectPersistence.ts) | 保存携带页面已知 revision；事务内再次读取并比较，其他标签页先保存时阻止覆盖并显示冲突。配额、schema、不支持 IndexedDB、写入和损坏错误均保留内存文件并返回明确错误。 |
| 工作台项目操作 | [`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx)、[`AppShell.tsx`](../../frontend/src/components/shell/AppShell.tsx) | 顶部提供保存当前工作副本、打开本地项目、另存为和项目名称编辑；项目列表显示版本/修订，未保存状态明确标为“未保存”。空列表说明可能是首次访问、浏览器变化或站点数据已被清除，不声称存在服务端备份。 |
| dirty 保护和恢复 | [`ProjectManager.tsx`](../../frontend/src/components/shell/ProjectManager.tsx)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts) | 打开项目或恢复版本前，dirty 状态提供保存并继续、另存为并继续、放弃当前修改和取消。恢复旧版本只创建新的 `restore` 版本/工作副本记录，保留被恢复版本及其之后历史；没有文件快照的版本不能恢复。 |

## 检查证据

已执行并通过：

```text
frontend: pnpm exec tsc --noEmit
frontend: pnpm exec eslint [阶段 B 变更的相关文件]
node scripts/checkPhaseB.mjs
git diff --check
```

`checkPhaseB.mjs` 提供最小 IndexedDB API fixture，覆盖首次保存、读回文件/消息/版本、带资源和 run 摘要的保存→读回指纹相等、revision 冲突、不可变版本拒绝和损坏工作副本拒绝。dirty 指纹只比较可以从快照恢复的持久化字段，打开后不会因为未恢复的瞬时 generation 状态误报未保存。fixture 验证仓储协议和错误边界，不替代真实浏览器的配额、双标签页调度或页面刷新验收。

阶段 B 相关文件的 ESLint 已通过。完整 `frontend/pnpm lint` 仍被一期 `src/app/case-preview/[scene]/page.tsx` 的 `react-hooks/set-state-in-effect` 错误阻断，生成案例文件还有已有未使用导入/`<img>` 警告；本阶段没有修改这些无关文件。

`docs/phase-two-spec/debug.log` 已确认是调试残留并删除。阶段 A 的资源、预览和 Sandpack 限制仍以 [`phase-a.md`](./phase-a.md) 为准。

## 主代理需继续现场验收

1. 在 `/workspace` 和小说案例中编辑文件/项目名称，点击“保存”，刷新后通过“打开”恢复名称、当前文件、消息和版本列表；确认预览编辑状态不丢。
2. 手改文件后分别测试打开另一个项目、恢复旧版本的保存/另存为/放弃/取消四个分支；恢复后确认新恢复记录出现，旧版本及之后版本仍在列表中。
3. 打开两个标签页，用一个标签页先保存，再从另一个标签页保存同一项目；确认 revision 冲突阻止后写入且内存改动仍在。
4. 在开发者工具中模拟 quota、损坏记录和更高 schema version，确认界面显示错误、保留当前内存内容，不静默清空或重置项目。
5. 保存失败、项目不存在和站点数据不可见时，确认文案不声称数据已被清除或存在服务端备份；导出仍由阶段 A 的资源校验独立负责。
6. 在 390px 宽度复核头部：品牌文字可收缩，项目名称、保存、打开和另存为控件仍可访问且不被裁切；桌面头部布局应保持原有排列。
