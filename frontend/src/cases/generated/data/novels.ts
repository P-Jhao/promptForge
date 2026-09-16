import { Novel } from '../types/Novel';

/**
 * 模拟小说数据
 * 包含多种状态和分类的小说，用于展示完整的阅读管理功能
 */
export const MOCK_NOVELS: Novel[] = [
  {
    id: 'novel_001',
    title: '星辰之上',
    author: '陈墨',
    coverImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=560&fit=crop',
    description: '在遥远的未来，人类已经踏足银河系的每一个角落。主角林风作为一名星际探险家，意外发现了一颗隐藏着古老文明遗迹的神秘行星。随着探索的深入，他逐渐揭开了一个关于宇宙起源的惊人秘密...',
    filePath: '/novels/stars_above.epub',
    totalPages: 320,
    currentPage: 156,
    lastReadAt: '2024-01-15T20:30:00.000Z',
    createdAt: '2023-11-10T09:00:00.000Z',
    updatedAt: '2024-01-15T20:30:00.000Z',
    status: 'reading',
    progressPercentage: 48.75
  },
  {
    id: 'novel_002',
    title: '迷雾侦探',
    author: '陆明',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=560&fit=crop',
    description: '民国时期的上海滩，私家侦探苏文在调查一桩离奇的失踪案时，意外卷入了一场涉及多方势力的阴谋。在迷雾重重的都市中，他必须依靠智慧和勇气，揭开隐藏在繁华背后的真相。',
    filePath: '/novels/fog_detective.epub',
    totalPages: 280,
    currentPage: 280,
    lastReadAt: '2024-01-10T18:45:00.000Z',
    createdAt: '2023-10-05T14:20:00.000Z',
    updatedAt: '2024-01-10T18:45:00.000Z',
    status: 'completed',
    progressPercentage: 100
  },
  {
    id: 'novel_003',
    title: '山海异闻录',
    author: '白羽',
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=560&fit=crop',
    description: '现代青年李寻意外获得一本记载着上古神话的奇书，从此能够看见常人无法察觉的异界生物。在都市与山海经世界的交汇处，他开始了寻找失落的华夏神祇的冒险之旅。',
    filePath: '/novels/myth_records.epub',
    totalPages: 350,
    currentPage: 89,
    lastReadAt: '2024-01-05T15:20:00.000Z',
    createdAt: '2023-12-01T11:30:00.000Z',
    updatedAt: '2024-01-05T15:20:00.000Z',
    status: 'paused',
    progressPercentage: 25.43
  },
  {
    id: 'novel_004',
    title: '时光旅人的日记',
    author: '时光',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=560&fit=crop',
    description: '一位能够穿越时空的旅人，在不同的历史时期留下了自己的足迹。从古埃及的金字塔到文艺复兴的佛罗伦萨，从二战时期的伦敦到未来的火星殖民地，每一段旅程都是一次心灵的洗礼。',
    filePath: '/novels/time_traveler_diary.epub',
    totalPages: 420,
    currentPage: 0,
    lastReadAt: '2023-12-20T10:00:00.000Z',
    createdAt: '2023-12-15T16:45:00.000Z',
    updatedAt: '2023-12-20T10:00:00.000Z',
    status: 'unread',
    progressPercentage: 0
  },
  {
    id: 'novel_005',
    title: '代码黎明',
    author: '程序员老王',
    coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400&h=560&fit=crop',
    description: '2045年，人工智能已经渗透到生活的方方面面。天才程序员张晨在调试一个神秘的AI系统时，发现了隐藏在代码深处的惊天阴谋。当虚拟与现实的边界开始模糊，他必须做出艰难的选择...',
    filePath: '/novels/code_dawn.epub',
    totalPages: 380,
    currentPage: 45,
    lastReadAt: '2024-01-18T22:15:00.000Z',
    createdAt: '2024-01-10T08:30:00.000Z',
    updatedAt: '2024-01-18T22:15:00.000Z',
    status: 'reading',
    progressPercentage: 11.84
  },
  {
    id: 'novel_006',
    title: '长安十二时辰',
    author: '马伯庸',
    coverImage: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=400&h=560&fit=crop',
    description: '唐天宝三载，元宵节前夕。长安城陷入危机，主人公张小敬必须在十二个时辰内拯救长安。一场与时间赛跑的冒险，揭开盛唐繁华背后的暗流涌动。',
    filePath: '/novels/changan_12hours.epub',
    totalPages: 520,
    currentPage: 520,
    lastReadAt: '2023-12-28T23:30:00.000Z',
    createdAt: '2023-09-15T10:00:00.000Z',
    updatedAt: '2023-12-28T23:30:00.000Z',
    status: 'completed',
    progressPercentage: 100
  }
];
