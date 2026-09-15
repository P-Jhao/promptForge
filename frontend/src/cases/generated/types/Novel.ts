/**
 * NovelStatus
 * 小说阅读状态
 */
export type NovelStatus = 'unread' | 'reading' | 'completed' | 'paused';

/**
 * Novel
 * 小说实体，包含小说基本信息和阅读状态
 */
export interface Novel {
  /** 唯一标识 */
  id: string;
  /** 小说标题 */
  title: string;
  /** 作者 */
  author: string;
  /** 封面图片URL */
  coverImage: string;
  /** 小说描述 */
  description: string;
  /** 文件路径 */
  filePath: string;
  /** 总页数 */
  totalPages: number;
  /** 当前阅读页数 */
  currentPage: number;
  /** 最后阅读时间 (ISO Date String) */
  lastReadAt: string;
  /** 创建时间 (ISO Date String) */
  createdAt: string;
  /** 更新时间 (ISO Date String) */
  updatedAt: string;
  /** 阅读状态 */
  status: NovelStatus;
  /** 阅读进度百分比 */
  progressPercentage: number;
}