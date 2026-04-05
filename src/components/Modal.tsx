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

  // In non-browser environments, don't attempt to render the modal
  if (typeof document === "undefined") return null;
  const modalRoot = document.getElementById("modal-root") ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 layer-modal flex items-center justify-center p-4 sm:p-6 bg-[rgba(0,0,0,0.55)] backdrop-blur-[12px]"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop - click to close */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container: content-sized, centered; responsive width */}
      <div
        className="relative z-10 w-[90vw] max-w-[520px] h-auto max-h-[85vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#050505] shadow-[0_24px_80px_rgba(0,0,0,0.9)] flex flex-col p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 pb-3 border-b border-white/5">
          <h2 className="text-xs sm:text-sm font-medium tracking-[0.18em] uppercase text-zinc-500">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-zinc-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="text-zinc-300 leading-relaxed pt-4">
          {children}
        </div>
      </div>
    </div>,
    modalRoot
  );
};

export default Modal;
