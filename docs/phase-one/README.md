# PromptForge 第一阶段记录

更新时间：2026-09-15

本文记录当前第一阶段实现的能力边界、案例来源、验证结果和后续建议。案例数据与生成状态仍属于当前浏览会话，不代表已经接入持久化项目管理。

## 能力矩阵

| 能力 | 当前交付 | 证据位置 | 状态 |
| --- | --- | --- | --- |
| 首页展示 | 首屏使用唯一的真实案例 iframe；案例下方展示需求摘要和人工修正说明 | `frontend/src/components/landing/`、`frontend/src/components/cases/` | 已实现 |
| 预置案例 | 小说阅读管理包含书库管理、阅读笔记两个场景；两者来自同一份 48 文件成果 | `frontend/src/cases/`、`scripts/assembleNovelCase.mjs` | 已实现 |
| 案例交互 | 书名/作者搜索、状态筛选、新增书籍、新增阅读笔记和阅读页书签在会话内写入 | `frontend/src/cases/generated/` | 已实现 |
| 示例体验 | 直接打开预存案例链接，不提交访客输入，也不伪造一次新的生成请求 | `frontend/src/components/shell/ChatPanel.tsx` | 已实现 |
| 真实生成 | 关闭示例体验后才提交 `/api/chat`，页面明确标注真实模型模式；继续修改目前只会带历史文本重新生成 | `frontend/src/hooks/useChat.ts`、`frontend/src/services/api.ts` | 已实现，完整真实链路待手动验证 |
| 生成流状态 | 需求分析到代码生成已接通；文件只在收到 `done` 后写入预览和版本；失败、取消、EOF 保留此前完整结果；诊断折叠展示客户端接收间隔 | `frontend/src/hooks/useChat.ts`、`frontend/src/components/shell/GenerationStatusPanel.tsx` | 主流程已实现，固定评测与运行修复未实现 |
| 预览与源码 | Sandpack 可切换预览/代码，导出当前编辑器文件；案例切换会重新载入对应成果 | `frontend/src/components/preview/`、`frontend/src/store/sandpackStore.ts` | 已实现，运行与导出待手动验证 |
| 移动端工作台 | 移动端可切换对话/预览面板，并在预览面板内切换预览/代码；案例内部筛选横向滚动 | `frontend/src/components/shell/PreviewPanel.tsx`、`scripts/assembleNovelCase.mjs` | 主代理已复验核心入口与切换 |
| 反馈夹具 | 已提供 success、fail、EOF、chat、429 等后端调试入口和错误诊断 | `backend/test/feedbackFixture.ts`、`backend/routes/chatDiagnostics.ts` | 已实现 |

## 案例来源与修正

预置案例由 `backend/mock` 的类型、数据、服务、Hooks、组件、页面、布局和样式结果，经 `scripts/assembleNovelCase.mjs` 组装到 `frontend/src/cases/generated/`，再由 `frontend/src/cases/generatedFiles.ts` 提供给首页 iframe 和工作台。书库和阅读笔记标签只是同一份文件成果的两个初始路由场景，不是两个独立项目。

组装脚本对原始 Mock 结果做了明确的可操作性修正：补充会话内新增书籍、阅读笔记和书签写入；用本地占位封面替代远程图片；接通表格详情、笔记入口和阅读页书签；为书库搜索补充 `query` 依赖；为移动端收紧顶部布局并让筛选按钮保持完整文字、可横向滚动；为模板案例入口补充明确的 ErrorBoundary props/state、`unknown` 错误类型和 `root` 空值检查；在阅读正文中标注示意内容。首页的“需求摘要”是对这些结果的归纳，不能当作原始完整 prompt。

## 已知限制

- 案例数据、编辑器修改、生成版本和重试请求上下文都只保留在当前浏览会话；保存、重新打开和恢复尚未实现，内存中的 version 也没有接通 rollback。
- 下一次真实生成会重新请求模型，当前编辑器修改不会自动合并进新的生成请求；导出按钮读取 Sandpack 当前文件。
- 尚未验证真实 LLM 的完整 traditional 链路。当前已验证的是后端反馈夹具和前端状态处理。
- Sandpack 依赖外部预览运行时；本机验证曾出现 `TIME_OUT`，内置英文错误可以显示。联网运行、编辑后重新预览和 ZIP 解压安装构建仍需手动确认。
- 预置布局顶部的搜索框来自原始 Mock 结果，目前只在桌面显示且不是书库筛选入口；书库页面自己的书名/作者搜索已接通。
- 当前没有运行时功能校验、自动修复、保留编辑后继续生成、认证和服务端持久化；AST 分析和请求重试只处理生成/协议问题，不等于运行时修复。
- 运行统计目前只有客户端事件接收间隔，尚未建立固定需求评测、成功标准、总耗时和修复次数记录。

## 第一阶段验证

本轮静态组装通过：

```text
pnpm --dir frontend exec node ../scripts/assembleNovelCase.mjs
Assembled 48 novel case files from backend/mock
```

主代理已完成的检查包括：前端 TypeScript 检查无错误、前端 `pnpm build` 和后端 `pnpm build` 均通过；本轮对 `SandpackView.tsx` 和 `LandingPage.tsx` 的定向 ESLint 通过，前端 `pnpm exec tsc --noEmit` 通过；浏览器已检查工作台直达、模式开关、真实输入可提交；反馈夹具的 success/fail/EOF/chat/429 均已检查；失败重试会发起第二次请求，延迟夹具显示阶段接收间隔，取消后服务端记录 client disconnected 且清理计时器；书库状态筛选、新增 1 本后总数 7 本、笔记新增显示和搜索结果已检查；390px 工作台外层没有横向溢出；手机案例从首页进入工作台、顶部/筛选文字可读，以及预览/代码切换和案例源码可见已检查。成功夹具完成后重新打开代码面板，内容已从案例源码切换为 Feedback fixture，确认完整生成结果不会被 `initialFiles` 遮挡。生产构建运行版在后端不可用时显示“React模板加载失败 HTTP500”，点击“重试模板”会再次请求并失败，期间保留输入内容和真实生成模式且不刷新整页；这只验证模板 API 失败反馈，不代表外部 Sandpack 运行成功。

全量 `pnpm lint` 曾因长时间无输出按授权中断，不能视为通过。外部 Sandpack 运行时超时也不能视为预览成功。

## 第二阶段建议

先建立一个可重复的保留性验收：对现有书库提出“增加筛选”，确认新增书籍和用户编辑仍被保留，再把结果固化为自动化检查。接着用小范围 IndexedDB 保存项目、版本快照、当前文件和导出状态，补上重新打开/恢复及版本回滚。

对较大改动，提交当前 file map 和 base hash，由后端生成 patch 暂存；前端展示冲突检测结果，只有校验成功才替换当前结果，失败则回退并限制自动修复次数。最后选定 3 个固定需求重复运行，记录成功标准、总耗时、失败步骤和修复次数，形成可以比较的评测基线。

## 待手动验证

1. 在手机工作台打开“预览与代码”，编辑一个文件后切回预览，确认修改可见；再导出并检查 ZIP 中是当前编辑内容。
2. 在可用网络下确认 Sandpack 外部运行时能启动，预览错误重试不会刷新页面或丢失已有文件。
3. 关闭示例体验后，用真实模型完成一次传统流程，确认 `done` 前不会替换旧结果、成功后才保存版本。
4. 解压导出包后执行依赖安装和构建，并确认本地封面等案例资源包含在包内。
5. 刷新或重新打开工作台，确认用户能理解当前没有持久化恢复；失败后重新加载页面时重试按钮应保持禁用。

## 第二阶段规格索引

第二阶段目前只有待讨论的规格文档，未开始执行，也没有在本轮生成新案例或调用模型。规格入口见 [docs/phase-two-spec/README.md](../phase-two-spec/README.md)。章节编号只是阅读顺序，不是执行计划或排期。

### 针对图片与预览加载反馈的基线补充

- `frontend/public/book-cover.svg` 确实存在，案例数据和宿主继续引用 `/book-cover.svg`；阶段 A 已将 Sandpack 文件映射修正为 `/public/book-cover.svg`，导出 ZIP 条目为 `public/book-cover.svg`。`checkPhaseA.mjs` 已覆盖映射、缺失资源拒绝和 ZIP 条目；真实 Sandpack 资源请求与导出后的 Vite 构建仍待现场验证，不能把它写成已通过。
- `SandpackView.tsx` 在 `sandpack.status` 为 `initial` 或 `running` 时显示等待文案；当前没有以真实运行 ready 事件确认预览已经启动。代码已经渲染而状态仍为 `running` 时可能持续等待，外部 Sandpack 运行还曾出现 `TIME_OUT`，所以该反馈仍属于待修正、待验证状态。
