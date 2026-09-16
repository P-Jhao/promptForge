import { type Board } from '../types/board';

export const MOCK_BOARDS: Board[] = [
  {
    id: 'board_001',
    title: '产品开发看板',
    description: '管理产品从需求收集到上线的全流程任务，包括需求评审、设计、开发、测试等阶段。',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'board_002',
    title: '市场推广看板',
    description: '跟踪市场活动策划、内容创作、渠道投放及效果分析等任务。',
    createdAt: '2024-02-20T10:30:00Z'
  },
  {
    id: 'board_003',
    title: '客户支持看板',
    description: '处理客户反馈、技术支持请求及常见问题解答，确保及时响应。',
    createdAt: '2024-03-05T14:15:00Z'
  }
];
