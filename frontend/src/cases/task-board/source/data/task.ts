import { type Task } from '../types/task';

export const MOCK_TASKS: Task[] = [
  {
    id: 'task_001',
    title: '完成用户登录模块的接口联调',
    description: '与后端确认 JWT 刷新机制，完成登录、登出与 token 续期三个接口的联调，并补齐异常分支的测试用例。',
    assignee: '张伟',
    dueDate: '2024-07-18T18:00:00Z',
    priority: 'high',
    status: 'doing',
    createdAt: '2024-07-10T09:20:00Z',
    updatedAt: '2024-07-15T14:05:00Z'
  },
  {
    id: 'task_002',
    title: '整理第三季度产品需求文档',
    description: '汇总各业务方反馈，梳理第三季度优先级最高的十个需求点，同时输出竞品对比与排期建议。',
    assignee: '李静',
    dueDate: '2024-07-26T10:00:00Z',
    priority: 'medium',
    status: 'todo',
    createdAt: '2024-07-12T08:00:00Z',
    updatedAt: '2024-07-14T16:30:00Z'
  },
  {
    id: 'task_003',
    title: '优化看板列表滚动性能',
    description: '当前看板在任务超过两百条时滚动明显掉帧，计划引入虚拟列表并对卡片组件做渲染缓存优化。',
    assignee: '王鹏',
    dueDate: '2024-07-30T12:00:00Z',
    priority: 'low',
    status: 'todo',
    createdAt: '2024-07-13T11:15:00Z',
    updatedAt: '2024-07-13T11:15:00Z'
  },
  {
    id: 'task_004',
    title: '修复移动端任务卡片布局错位',
    description: '小屏手机上卡片右侧的优先级标签会换行溢出，已调整 flex 布局并补充响应式断点验证。',
    assignee: '陈晓',
    dueDate: '2024-07-15T09:00:00Z',
    priority: 'high',
    status: 'done',
    createdAt: '2024-07-08T13:40:00Z',
    updatedAt: '2024-07-15T09:12:00Z'
  }
];
