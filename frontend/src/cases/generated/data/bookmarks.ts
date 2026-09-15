import { Bookmark } from '../types/Bookmark';

/**
 * 模拟书签数据
 * 与小说ID关联，记录用户标记的重要页面位置
 */
export const MOCK_BOOKMARKS: Bookmark[] = [
  {
    id: 'bookmark_001',
    novelId: 'novel_001',
    pageNumber: 42,
    description: '发现神秘行星的关键时刻，林风第一次看到遗迹入口',
    createdAt: '2024-01-11T20:30:00.000Z'
  },
  {
    id: 'bookmark_002',
    novelId: 'novel_001',
    pageNumber: 98,
    description: '古老文明的历史揭秘，关于宇宙起源的重要线索',
    createdAt: '2024-01-13T21:15:00.000Z'
  },
  {
    id: 'bookmark_003',
    novelId: 'novel_001',
    pageNumber: 145,
    description: '与外星智慧生命正式建立联系的历史性时刻',
    createdAt: '2024-01-15T19:45:00.000Z'
  },
  {
    id: 'bookmark_004',
    novelId: 'novel_002',
    pageNumber: 67,
    description: '第一个关键证据出现：神秘字条上的暗号',
    createdAt: '2024-01-07T15:20:00.000Z'
  },
  {
    id: 'bookmark_005',
    novelId: 'novel_002',
    pageNumber: 189,
    description: '真相大白：幕后黑手的真实身份揭露',
    createdAt: '2024-01-09T22:00:00.000Z'
  },
  {
    id: 'bookmark_006',
    novelId: 'novel_003',
    pageNumber: 34,
    description: '获得山海经奇书的关键情节',
    createdAt: '2024-01-03T16:30:00.000Z'
  },
  {
    id: 'bookmark_007',
    novelId: 'novel_003',
    pageNumber: 75,
    description: '首次遭遇山海经神兽，非常精彩的战斗场景',
    createdAt: '2024-01-05T15:00:00.000Z'
  },
  {
    id: 'bookmark_008',
    novelId: 'novel_005',
    pageNumber: 15,
    description: 'AI系统黎明的首次对话，暗示了觉醒迹象',
    createdAt: '2024-01-17T22:30:00.000Z'
  },
  {
    id: 'bookmark_009',
    novelId: 'novel_006',
    pageNumber: 156,
    description: '张小敬与李必的经典对话，关于正义与手段',
    createdAt: '2023-12-22T20:15:00.000Z'
  },
  {
    id: 'bookmark_010',
    novelId: 'novel_006',
    pageNumber: 478,
    description: '最终高潮：长安保卫战的决定性时刻',
    createdAt: '2023-12-28T23:00:00.000Z'
  }
];
