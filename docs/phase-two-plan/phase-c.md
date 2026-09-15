# 阶段 C 交接：当前代码基线与候选隔离

状态：阶段 C 的最小 React 垂直切片已实现，主代理需要完成真实后端、Sandpack 和浏览器现场验收。没有在本阶段启动付费模型，也没有把 Mock、代码可见或外部预览超时写成成功证据。

权威范围见[第二阶段执行计划](../phase-two-spec/plan.md)的“阶段 C”。本记录只描述实现边界和检查证据，不替代计划。

## 已实现

| 需求/计划条目 | 代码证据 | 行为和边界 |
| --- | --- | --- |
| 冻结项目、文件、资源和基线 | [`changeContract.ts`](../../frontend/src/lib/changeContract.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`editContract.ts`](../../backend/routes/editContract.ts) | 提交前复制当前编辑器文件、项目 ID、最近接受版本 ID 和资源引用；基线 hash 覆盖规范化文件 map 及资源摘要。资源内容存在于当前 map 时记录 SHA-256，无法从当前 map 验证时明确记录 `hashStatus=unknown`、`contentHash=null`，不执行远程下载。编辑请求不从最近生成文件重建基线。 |
| 明确区分生成、聊天和编辑 | [`chatValidation.ts`](../../backend/routes/chatValidation.ts)、[`chat.ts`](../../backend/routes/chat.ts)、[`editStream.ts`](../../backend/routes/editStream.ts)、[`ChatPanel.tsx`](../../frontend/src/components/shell/ChatPanel.tsx) | `/api/chat` 缺省行为保持不变；`operation=edit` 必须带 project/base，走独立结构化编辑流，不进入首次生成图；普通 `chat` 只追加文本，不创建项目版本。 |
| 结构化文件变更和服务端合并 | [`editContract.ts`](../../backend/routes/editContract.ts)、[`editGeneration.ts`](../../backend/routes/editGeneration.ts) | 只接受 add/modify/delete；拒绝重复路径、路径遍历、非法内容、不存在文件删除/修改、已存在文件新增和文件/总量超限；候选以冻结 map 合并，未涉及文件保留。 |
| 候选状态和独立预览 | [`candidate.ts`](../../frontend/src/types/candidate.ts)、[`CandidatePanel.tsx`](../../frontend/src/components/shell/CandidatePanel.tsx)、[`SandpackView.tsx`](../../frontend/src/components/preview/SandpackView.tsx) | `files + done` 后才暂存候选；候选预览使用独立 Sandpack 文件副本，bridge 不进入编辑器或导出。面板显示摘要、变更数量、base hash、结构/预览状态，并可展开变更路径列表。 |
| 校验、冲突和确认应用 | [`changeContract.ts`](../../frontend/src/lib/changeContract.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts)、[`chatStore.ts`](../../frontend/src/store/chatStore.ts)、[`usePreviewDiagnostics.ts`](../../frontend/src/components/preview/usePreviewDiagnostics.ts) | 候选事件进入状态前重新核对冻结基线 hash、资源顺序/可用性/hash 状态和文件差异清单；只有结构校验和真实预览 `done(compilatonError=false)+app-mounted` 都通过时才可应用；应用前再次比较当前文件 hash，变化或项目切换进入冲突并保留候选。阶段 D 修复候选将本轮模型基线与原接受基线分开保存。确认后才更新编辑器并创建内存版本，仍需手动保存。 |
| 失败、EOF、取消和重试 | [`api.ts`](../../frontend/src/services/api.ts)、[`useChat.ts`](../../frontend/src/hooks/useChat.ts) | 缺 `done`、错误、取消或异常流不会更新当前文件；取消只停止接收，界面保留既有结果并说明上游调用可能继续；重试沿用原始冻结输入但创建新 run ID。 |

## 检查证据

已执行并通过：

```text
frontend: pnpm exec tsc --noEmit
frontend: pnpm run build
frontend: pnpm exec eslint [阶段 C 变更的相关文件]
backend: pnpm run build
node scripts/checkPhaseC.mjs
git diff --check
```

`checkPhaseC.mjs` 使用固定文件 map 验证前后端一致的文件/资源基线 hash、已知与未知资源标记、项目/资源快照解析、修改与新增合并、未涉及文件保留，以及重复路径、缺失删除、路径遍历、项目身份不匹配、资源 hash 不一致和候选变更清单不一致拒绝。它是协议/合并 fixture，不是模型或真实 Sandpack 通过证据。backend 没有安装可执行的 ESLint，本阶段以 TypeScript build 和前端定向 ESLint 作为可用静态检查，完整后端 lint 仍待依赖补齐。

`backend/app.ts` 的 JSON parser 上限为 1 MiB，超过上限仍由 Express 错误边界返回 413；这是请求体解析边界，不代表真实模型已运行。

## 未验证和明确限制

- 没有调用真实模型；`operation=edit` 在全 Mock 服务端配置下明确返回错误。真实 SSE、供应商结构化输出、模型耗时和费用仍需主代理在不重启现有后端的前提下现场核对。
- 本阶段的文件/协议校验和候选预览证据已接入，但固定功能场景、独立类型检查、导出构建和 L4 验收属于后续验证；任何未收到真实 Sandpack ready 的候选都会保持“待验证”并禁止应用。
- 候选在应用前只更新内存工作副本和版本列表；项目持久化仍由阶段 B 的手动 IndexedDB 保存负责。候选失败、冲突或放弃不会覆盖当前编辑文件。
- 不实现自动合并、编辑候选持久化、Vue、云同步、ZIP 导入或阶段 D 自动修复。外部 Sandpack 网络超时继续按环境阻断记录，不归因于生成代码。

## 主代理现场验收

1. 在已有前端/后端进程中关闭示例体验，分别发送首次生成、普通聊天和“基于当前代码修改”，核对请求 operation、SSE flow 和版本行为；不要运行付费模型脚本。
2. 使用固定或故障夹具制造错误、EOF、取消和生成期间编辑，确认当前文件、未保存编辑和候选不会被迟到结果覆盖；重试应显示新的 run。
3. 在候选预览中确认真实 Sandpack `done`、`compilatonError=false` 和入口 `app-mounted` 后才启用应用；制造运行错误/超时确认应用按钮保持禁用。
4. 修改当前文件后再应用旧候选，确认显示 base 冲突；通过校验后点击应用，确认版本新增、当前文件变化、候选清除，再手动保存并用阶段 B 重开。
