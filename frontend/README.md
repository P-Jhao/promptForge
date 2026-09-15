# PromptForge 前端

这是 PromptForge 的 Next.js 前端。前端默认通过同源 `/api` 请求后端；本地开发时，Next rewrite 将请求转发到 `http://localhost:7001`。

## 启动

```bash
pnpm install
BACKEND_URL=http://localhost:7001 pnpm dev
```

浏览器访问 <http://localhost:3000>。`BACKEND_URL` 用于配置 `next.config.ts` 的本地代理目标；跨域开发时可以设置 `NEXT_PUBLIC_API_BASE_URL`，例如 `http://localhost:7001/api`。

## 页面

- `/`：首页和预置小说阅读管理案例。
- `/workspace`：真实生成工作台。
- `/workspace?case=novel&scene=library`：书库案例。
- `/workspace?case=novel&scene=notes`：阅读笔记案例。

示例体验直接打开预置案例，不会提交访客输入；关闭示例体验后才会请求真实 `/api/chat`。案例数据和编辑内容目前只保留在当前浏览会话。

## 检查

```bash
pnpm lint
pnpm exec tsc --noEmit
```

第一阶段能力边界、验证结果和待手动验证项见 [../docs/phase-one/README.md](../docs/phase-one/README.md)；第二阶段 A 的实现状态和现场边界见 [../docs/phase-two-plan/phase-a.md](../docs/phase-two-plan/phase-a.md)。
