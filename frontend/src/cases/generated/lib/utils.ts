import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 * 使用 clsx 和 tailwind-merge 确保类名正确合并
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化日期为可读字符串
 * @param date - 日期对象或字符串
 * @param options - 格式化选项
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('zh-CN', options).format(dateObj);
}

/**
 * 截断文本并在末尾添加省略号
 * @param text - 要截断的文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * 生成随机ID
 * @returns 随机生成的ID字符串
 */
export function generateId(): string {
  return Math.random().toString(36).slice(2);
}

/**
 * 计算阅读进度百分比
 * @param currentPage - 当前页码
 * @param totalPages - 总页数
 * @returns 进度百分比（0-100）
 */
export function calculateProgressPercentage(
  currentPage: number,
  totalPages: number
): number {
  if (totalPages === 0) return 0;
  return Math.round((currentPage / totalPages) * 100);
}

/**
 * 格式化阅读时间（分钟转换为小时和分钟）
 * @param minutes - 分钟数
 * @returns 格式化后的时间字符串
 */
export function formatReadingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}小时`;
  }
  return `${hours}小时${remainingMinutes}分钟`;
}