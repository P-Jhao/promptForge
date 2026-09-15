import { Category } from '../types/Category';

/**
 * 模拟分类数据
 * 覆盖常见的小说分类类型，每个分类包含独特的颜色标识
 */
export const MOCK_CATEGORIES: Category[] = [
  {
    id: 'cat_001',
    name: '科幻未来',
    color: '#3B82F6',
    description: '探索宇宙奥秘、未来科技、人工智能、星际旅行等主题的小说。包含硬科幻与软科幻作品。'
  },
  {
    id: 'cat_002',
    name: '玄幻仙侠',
    color: '#8B5CF6',
    description: '以东方神话、修真体系、仙侠世界为背景的幻想小说。包含修仙、武侠、神话传说等元素。'
  },
  {
    id: 'cat_003',
    name: '都市言情',
    color: '#EC4899',
    description: '现代都市背景下的爱情故事，聚焦人物情感发展、职场生活、家庭关系等现实题材。'
  },
  {
    id: 'cat_004',
    name: '悬疑推理',
    color: '#10B981',
    description: '以案件侦破、谜题解谜、心理悬疑为核心的小说类型，强调逻辑推理和情节反转。'
  },
  {
    id: 'cat_005',
    name: '历史军事',
    color: '#F59E0B',
    description: '基于真实历史背景或军事题材的小说，包含战争描写、历史人物、战略战术等元素。'
  },
  {
    id: 'cat_006',
    name: '轻小说',
    color: '#EF4444',
    description: '源自日本的轻松阅读小说类型，通常包含校园、日常、恋爱等元素，风格轻松幽默。'
  }
];
