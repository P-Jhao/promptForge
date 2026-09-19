import { Icon } from "./Icon";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return <div className="toast" role="status"><span><Icon name="check" size={16} /></span><p>{message}</p><button type="button" onClick={onClose} aria-label="关闭提示"><Icon name="close" size={15} /></button></div>;
}
