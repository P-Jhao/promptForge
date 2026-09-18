# PromptForge 案例 Fork 工作流

状态：已实现，桌面完整验收与真实 AI 链路仍按验收项补证。

更新时间：2026-09-19

## 产品边界

案例是只读的浏览与体验入口，不是一个需要在“示例模式 / 真实模式”之间切换的项目。用户可以先查看右侧生成页面；顶部「开始一个新的项目」回到无参数的案例选择页，左侧「基于此案例开始」或第一条 Prompt 才会基于当前案例进入真实工作区。

## 三种工作区状态

| 状态 | URL 入口 | 左侧内容 | 顶部动作 | 文件语义 |
| --- | --- | --- | --- | --- |
| `chooser` | `/workspace` | 案例列表与空白 Prompt 输入 | 案例选择身份、打开项目 | 不加载旧项目预览，不创建 AI 请求 |
| `example` | `/workspace?case=<id>` | 案例说明、功能清单、次级案例入口和 Prompt 输入 | 「开始一个新的项目」（回到 chooser）、分享、更多 | 使用 `previewFiles`，只读 |
| `project` | Fork 后的 `/workspace` | PromptForge Agent、消息、ThoughtChain、候选与版本历史 | 项目名、保存状态、分享、导出、更多 | 使用复制后的工作副本 |

`frontend/src/types/workspace.ts` 是状态边界，`WorkspaceSessionContext` 将 Fork 行为提供给顶部、左栏和输入框；普通 UI 不显示运行协议里的 `mockConfig` 或内部模式字段。

## Fork 转移

```text
只读案例
  ├─ 左侧 CTA ────────────┐
  └─ 首条 Prompt ----------┴─> 复制当前案例文件
                              -> IndexedDB 创建同名独立项目
                              -> 首次自动保存
                              -> 移除 case URL 状态
                              -> 进入 PromptForge Agent
                              -> 若有首条 Prompt，再发送同一条 /api/chat 请求
```

Fork 失败时保留示例状态并且不发送 AI 请求。Fork 成功后案例文件和原案例入口不变；后续生成、编辑和文件变化继续使用原有候选隔离与显式保存语义。首次 Fork 之后，工作副本出现变化时显示「未保存」，用户可在真实项目的「更多」菜单中保存。

## 分享与导出

分享只调用浏览器原生分享或复制当前 URL；本地项目不会被伪装成跨设备云项目。示例分享的是案例 URL，真实项目分享的是当前本地工作区 URL。导出在示例状态使用案例文件，在真实项目状态使用当前工作副本。

## 视觉验收记录

- 1280×720 In-app Browser 已确认客户管理后台示例的顶部层级、轻量「示例项目」Badge、左侧案例信息区、主 CTA、Prompt 输入框和右侧「预览 / 代码 / 刷新 / 全屏」工具栏可见。
- 已确认示例页面没有用户可见的模式 Toggle、设备类型、Viewport 或缩放控件。
- 已确认示例顶部「开始一个新的项目」只移除 `?case=...` 并回到 chooser；左侧 Fork CTA 才负责复制案例、切换真实项目并显示「✓ 已自动保存」。
- `/workspace` 无参数时已显示轻量案例选择页，并列出客户管理后台、数据分析看板和青山博客入口；任务管理已从用户可达案例注册表移除。
- 当前浏览环境的 Sandpack runtime 返回 `ERROR: TIME_OUT`，因此右侧 CRM iframe 的实际挂载和案例内部交互保持未验证；宿主工作台仍显示运行失败/重试状态。

## 代码检查

交付前执行并记录：

- `pnpm --dir frontend exec tsc --noEmit`
- `pnpm --dir frontend run lint`
- `pnpm --dir frontend run build`
- `git diff --check`

这些检查不能替代 1440px / 1280px 桌面视口、真实请求、IndexedDB 故障和 Sandpack 案例内部交互验收。
