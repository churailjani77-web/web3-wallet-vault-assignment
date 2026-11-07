import { useEffect } from "react";
import { AlertCircle, CheckCircle2, X } from "lucide-react";

function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(onClose, 4500);
    return () => window.clearTimeout(timeout);
  }, [toast, onClose]);

  if (!toast) return null;
  const isError = toast.type === "error";
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div className={`toast ${isError ? "toast-error" : "toast-success"}`} role={isError ? "alert" : "status"}>
      <Icon size={18} />
      <p>{toast.message}</p>
      <button type="button" aria-label="Dismiss notification" onClick={onClose}><X size={15} /></button>
    </div>
  );
}

export default Toast;
