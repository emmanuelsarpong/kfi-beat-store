import React from "react";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-[min(92vw,900px)] max-h-[85vh] rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/80 border-b border-white/5 px-5 py-3">
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="overflow-y-auto px-5 md:px-7 py-5 md:py-6 text-zinc-300 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
