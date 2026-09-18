import React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalProps = {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (typeof document === "undefined") return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 layer-modal flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/30 backdrop-blur-[8px]"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div
        className="relative z-10 w-full sm:w-[90vw] max-w-[520px] max-h-[min(90vh,100dvh)] overflow-y-auto rounded-t-[20px] sm:rounded-[20px] border border-black/[0.06] bg-[#F6F5F1] shadow-dock flex flex-col p-6 pb-[max(2rem,env(safe-area-inset-bottom))]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 pb-3 border-b border-black/[0.06]">
          <h2 className="text-[11px] font-medium tracking-[0.18em] uppercase text-[#999991]">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-11 w-11 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[#6F6F69] hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="text-foreground leading-relaxed pt-4">{children}</div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
