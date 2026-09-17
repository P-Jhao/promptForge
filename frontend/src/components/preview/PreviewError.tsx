"use client";

interface PreviewErrorProps {
  title: string;
  message: string;
  onRetry: () => void;
}

export function PreviewError({ title, message, onRetry }: PreviewErrorProps) {
  return (
    <div className="preview-error" role="alert">
      <strong>{title}</strong>
      <span>{message}</span>
      <button type="button" onClick={onRetry}>重试预览</button>
    </div>
  );
}
