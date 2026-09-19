import { Icon } from "./Icon";

export function FeedbackToast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="feedback-toast" role="status">
      <span className="feedback-toast-icon"><Icon name="check" size={14} /></span>
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="关闭提示"><Icon name="close" size={14} /></button>
    </div>
  );
}
