"use client";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { useData } from "@/lib/DataProvider";
import { timeAgo } from "@/lib/format";

const kindIcon: Record<string, { icon: string; tint: string; color: string }> = {
  incident: { icon: "TriangleAlert", tint: "bg-danger-soft", color: "text-danger" },
  charge: { icon: "ReceiptText", tint: "bg-coral-400/20", color: "text-coral-600" },
  post: { icon: "Megaphone", tint: "bg-palier-100", color: "text-palier-600" },
};

export function NotificationsBell({ dark = false }: { dark?: boolean }) {
  const { notifications } = useData();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`tap relative flex h-10 w-10 items-center justify-center rounded-full ${dark ? "bg-white/15 text-white" : "bg-white text-ink shadow-card"}`}
      >
        <Icon name="Bell" className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-cream">
          {notifications.length}
        </span>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Notifications">
        <div className="space-y-2">
          {notifications.map((n) => {
            const k = kindIcon[n.kind] ?? kindIcon.post;
            return (
              <div key={n.id} className="flex gap-3 rounded-2xl bg-white p-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.tint}`}>
                  <Icon name={k.icon} className={`h-5 w-5 ${k.color}`} strokeWidth={2.2} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink">{n.title}</p>
                  <p className="text-[13px] text-ink-soft">{n.body}</p>
                  <p className="mt-0.5 text-[11px] text-ink-faint">{timeAgo(n.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Sheet>
    </>
  );
}
