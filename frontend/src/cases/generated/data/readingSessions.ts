import { ReadingSession } from '../types/ReadingSession';

/**
 * 模拟阅读会话数据
 * 记录用户每次阅读的起止页码和持续时间，用于统计阅读习惯
 */
export const MOCK_READING_SESSIONS: ReadingSession[] = [
  {
    id: 'session_001',
    novelId: 'novel_001',
    startPage: 1,
    endPage: 35,
    duration: 2700,
    createdAt: '2024-01-10T19:30:00.000Z'
  },
  {
    id: 'session_002',
    novelId: 'novel_001',
    startPage: 36,
    endPage: 78,
    duration: 3120,
    createdAt: '2024-01-11T20:15:00.000Z'
  },
  {
    id: 'session_003',
    novelId: 'novel_001',
    startPage: 79,
    endPage: 120,
    duration: 2580,
    createdAt: '2024-01-12T21:00:00.000Z'
  },
  {
    id: 'session_004',
    novelId: 'novel_001',
    startPage: 121,
    endPage: 156,
    duration: 2100,
    createdAt: '2024-01-15T20:00:00.000Z'
  },
  {
    id: 'session_005',
    novelId: 'novel_002',
    startPage: 1,
    endPage: 45,
    duration: 4080,
    createdAt: '2024-01-06T14:45:00.000Z'
  },
  {
    id: 'session_006',
    novelId: 'novel_002',
    startPage: 46,
    endPage: 120,
    duration: 5400,
    createdAt: '2024-01-07T19:30:00.000Z'
  },
  {
    id: 'session_007',
    novelId: 'novel_002',
    startPage: 121,
    endPage: 200,
    duration: 4800,
    createdAt: '2024-01-08T20:00:00.000Z'
  },
  {
    id: 'session_008',
    novelId: 'novel_002',
    startPage: 201,
    endPage: 280,
    duration: 5100,
    createdAt: '2024-01-10T18:00:00.000Z'
  },
  {
    id: 'session_009',
    novelId: 'novel_003',
    startPage: 1,
    endPage: 40,
    duration: 2400,
    createdAt: '2024-01-02T21:00:00.000Z'
  },
  {
    id: 'session_010',
    novelId: 'novel_003',
    startPage: 41,
    endPage: 89,
    duration: 2940,
    createdAt: '2024-01-05T14:30:00.000Z'
  },
  {
    id: 'session_011',
    novelId: 'novel_005',
    startPage: 1,
    endPage: 45,
    duration: 3300,
    createdAt: '2024-01-18T21:30:00.000Z'
  },
  {
    id: 'session_012',
    novelId: 'novel_006',
    startPage: 450,
    endPage: 520,
    duration: 4200,
    createdAt: '2023-12-28T22:00:00.000Z'
  }
];
