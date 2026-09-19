import { Icon } from "./Icon";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export function Toast({ message, onDismiss }: ToastProps) {
  if (message === null) return null;
  return (
    <button className="toast" type="button" onClick={onDismiss} aria-label="关闭提示">
      <Icon name="check" size={16} />
      <span>{message}</span>
    </button>
  );
}
