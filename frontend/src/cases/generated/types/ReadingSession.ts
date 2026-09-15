import { Novel } from "./Novel";

/**
 * ReadingSession
 * 阅读会话记录
 */
export interface ReadingSession {
  /** 唯一标识 */
  id: string;
  /** 关联的小说ID */
  novelId: string;
  /** 开始页码 */
  startPage: number;
  /** 结束页码 */
  endPage: number;
  /** 阅读时长（单位：秒） */
  duration: number;
  /** 创建时间 (ISO Date String) */
  createdAt: string;
}