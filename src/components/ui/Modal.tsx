import type { ReactNode } from "react";
import { useEffect } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "destructive";
  loading?: boolean;
}

export function Modal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
}: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/20 p-4 backdrop-blur-md">
      <div 
        className="absolute inset-0" 
        onClick={() => !loading && onClose()} 
        aria-hidden="true" 
      />
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] bg-white p-6 shadow-[0_30px_60px_rgba(45,52,53,0.12)] border border-[rgba(173,179,180,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="absolute right-4 top-4">
          <button
            type="button"
            className="rounded-full p-2 text-[var(--color-muted)] hover:bg-[var(--color-surface-low)] hover:text-[var(--color-on-surface)] transition"
            onClick={onClose}
            aria-label="Close modal"
            disabled={loading}
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mb-6 mt-2">
          {variant === "destructive" ? (
             <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(159,64,61,0.1)] text-[var(--color-error)]">
               <Icon name="trash" className="h-6 w-6" />
             </div>
          ) : (
             <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-low)] text-[var(--color-primary)]">
               <Icon name="bell" className="h-6 w-6" />
             </div>
          )}
          <h2 id="modal-title" className="font-['Manrope'] text-2xl font-bold tracking-[-0.04em] text-[var(--color-on-surface)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button 
            variant="secondary" 
            onClick={onClose} 
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button 
            variant={variant} 
            onClick={onConfirm} 
            disabled={loading}
          >
            {loading ? "Working..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
