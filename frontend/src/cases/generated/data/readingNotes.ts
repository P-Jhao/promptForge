import { ReadingNote } from '../types/ReadingNote';

/**
 * 模拟阅读笔记数据
 * 与小说数据关联，展示用户在阅读过程中记录的心得和感悟
 */
export const MOCK_READING_NOTES: ReadingNote[] = [
  {
    id: 'note_001',
    novelId: 'novel_001',
    pageNumber: 45,
    content: '主角林风在这一章展现出了非凡的勇气，面对未知星球的危险时毫不退缩。特别是他回忆童年时父亲教导他的片段，为后续的性格发展埋下了伏笔。星际探险家的孤独与责任描写得非常到位。',
    createdAt: '2024-01-12T14:30:00.000Z',
    updatedAt: '2024-01-12T14:30:00.000Z'
  },
  {
    id: 'note_002',
    novelId: 'novel_001',
    pageNumber: 78,
    content: '神秘遗迹中发现的符文暗示了古老文明与地球的联系，这个设定很有深度。作者通过林风的专业分析巧妙地揭示了这一信息，而不是直接叙述。科幻元素与悬疑感结合得恰到好处。',
    createdAt: '2024-01-13T09:15:00.000Z',
    updatedAt: '2024-01-13T10:20:00.000Z'
  },
  {
    id: 'note_003',
    novelId: 'novel_001',
    pageNumber: 120,
    content: '第一次接触外星智慧生命的场景描写震撼人心！作者对于跨物种交流的描写既有科学性又充满想象力。林风面对未知时的理性态度值得学习。',
    createdAt: '2024-01-14T21:45:00.000Z',
    updatedAt: '2024-01-14T21:45:00.000Z'
  },
  {
    id: 'note_004',
    novelId: 'novel_002',
    pageNumber: 23,
    content: '苏文第一次出场的描写很有画面感，民国时期上海滩的氛围营造得非常成功。烟雾缭绕的小巷、昏暗的路灯、神秘的委托人，每个细节都在铺垫悬疑氛围。',
    createdAt: '2024-01-08T16:45:00.000Z',
    updatedAt: '2024-01-08T16:45:00.000Z'
  },
  {
    id: 'note_005',
    novelId: 'novel_002',
    pageNumber: 156,
    content: '案件的第一个转折点！原来失踪的商人与租界的政治势力有关联。苏文的推理过程非常精彩，每一步都有迹可循，但又出人意料。',
    createdAt: '2024-01-09T20:30:00.000Z',
    updatedAt: '2024-01-09T21:15:00.000Z'
  },
  {
    id: 'note_006',
    novelId: 'novel_003',
    pageNumber: 56,
    content: '李寻第一次见到山海经中的生物——毕方鸟，描写非常生动。作者将古老神话与现代都市完美融合，这种都市异闻的风格很独特。期待后续更多神兽出场！',
    createdAt: '2024-01-04T20:10:00.000Z',
    updatedAt: '2024-01-05T08:30:00.000Z'
  },
  {
    id: 'note_007',
    novelId: 'novel_005',
    pageNumber: 28,
    content: 'AI系统黎明的设定很有意思，它的对话方式介于人类和机器之间。张晨与AI的互动暗示了意识觉醒的可能性，这个伏笔埋得很好。',
    createdAt: '2024-01-17T23:00:00.000Z',
    updatedAt: '2024-01-17T23:00:00.000Z'
  },
  {
    id: 'note_008',
    novelId: 'novel_006',
    pageNumber: 89,
    content: '张小敬的人物塑造太成功了！一个曾经的死囚，却是最了解长安地下世界的人。他的复杂性格通过回忆和现实的交织逐渐展现出来。',
    createdAt: '2023-12-20T19:30:00.000Z',
    updatedAt: '2023-12-20T19:30:00.000Z'
  }
];
