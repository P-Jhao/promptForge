import { Novel } from "./Novel";

/**
 * Bookmark
 * 书签
 */
export interface Bookmark {
  /** 唯一标识 */
  id: string;
  /** 关联的小说ID */
  novelId: string;
  /** 页码 */
  pageNumber: number;
  /** 描述 */
  description: string;
  /** 创建时间 (ISO Date String) */
  createdAt: string;
}