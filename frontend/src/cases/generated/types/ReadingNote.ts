import { Novel } from "./Novel";

/**
 * ReadingNote
 * 阅读笔记
 */
export interface ReadingNote {
  /** 唯一标识 */
  id: string;
  /** 关联的小说ID */
  novelId: string;
  /** 页码 */
  pageNumber: number;
  /** 笔记内容 */
  content: string;
  /** 创建时间 (ISO Date String) */
  createdAt: string;
  /** 更新时间 (ISO Date String) */
  updatedAt: string;
}