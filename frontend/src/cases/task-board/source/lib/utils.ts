import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type TaskPriority } from "../types/task";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return new Intl.DateTimeFormat("en-US", { ...defaultOptions, ...options }).format(date);
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function normalizePriority(value?: string): TaskPriority {
  const v = String(value ?? "").trim().toLowerCase();
  if (v === "high" || v === "高" || v === "高优先级") return "high";
  if (v === "low" || v === "低" || v === "低优先级") return "low";
  return "medium";
}