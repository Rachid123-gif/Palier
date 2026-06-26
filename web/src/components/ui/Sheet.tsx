"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

/** Monte un portal sur <body> (évite tout ancêtre transformé qui casserait le `fixed`). */
function usePortal(open: boolean) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);
  return mounted;
}

export function Sheet({
  open, onClose, title, children, className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const mounted = usePortal(open);
  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 animate-[fade_0.25s_ease] bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        className={cn(
          "relative mx-auto max-h-[88%] w-full max-w-[460px] overflow-y-auto rounded-t-[28px] bg-cream-card p-5 pb-8 shadow-[0_-12px_40px_-12px_rgba(0,0,0,0.35)] animate-[sheet_0.32s_cubic-bezier(0.22,1,0.36,1)]",
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-sand" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <button onClick={onClose} className="press rounded-full bg-sand p-1.5 text-ink-soft">
              <Icon name="X" className="h-4 w-4" />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Toast de confirmation centré (portal + fixed). */
export function Toast({
  open, onClose, icon = "Check", title, body, action = "OK",
}: {
  open: boolean;
  onClose: () => void;
  icon?: string;
  title: string;
  body: string;
  action?: string;
}) {
  const mounted = usePortal(open);
  if (!open || !mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <button onClick={onClose} className="absolute inset-0 animate-[fade_0.25s_ease] bg-ink/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-xs animate-[pop_0.3s_cubic-bezier(0.34,1.56,0.64,1)] rounded-3xl bg-cream-card p-6 text-center shadow-float">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-success-soft">
          <Icon name={icon} className="h-7 w-7 text-success" strokeWidth={2.5} />
        </div>
        <h3 className="text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm text-ink-soft">{body}</p>
        <button
          onClick={onClose}
          className="press mt-5 w-full rounded-full bg-palier-600 py-3 text-sm font-semibold text-white"
        >
          {action}
        </button>
      </div>
    </div>,
    document.body,
  );
}
