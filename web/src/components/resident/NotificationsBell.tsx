"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { timeAgo } from "@/lib/format";
import { requestNotificationPermission, subscribeToPush } from "@/lib/push";

type NotifKind = "incident" | "charge" | "post" | "ag";

const kindIcon: Record<string, { icon: string; tint: string; color: string }> = {
  incident: { icon: "TriangleAlert", tint: "bg-danger-soft", color: "text-danger" },
  charge: { icon: "ReceiptText", tint: "bg-coral-400/20", color: "text-coral-600" },
  post: { icon: "Megaphone", tint: "bg-palier-100", color: "text-palier-600" },
  ag: { icon: "CalendarDays", tint: "bg-amber-100", color: "text-amber-600" },
};

/** Map notification kinds to preference keys from profile settings */
const kindToPref: Record<string, string> = {
  incident: "incidents",
  charge: "charges",
  post: "voisinage",
  ag: "ag",
};

function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("palier_notif_read");
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function getNotifPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
  try {
    const raw = localStorage.getItem("palier_notif_prefs");
    return raw ? JSON.parse(raw) : { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
  } catch { return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true }; }
}

export function NotificationsBell({ dark = false }: { dark?: boolean }) {
  const { notifications: rawNotifs, profileId } = useData();
  const { lang, i } = useLang();
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const pushPrompted = useRef(false);

  useEffect(() => { setReadIds(getReadIds()); }, []);

  // Prompt for push notifications on first bell open
  useEffect(() => {
    if (open && !pushPrompted.current && profileId) {
      pushPrompted.current = true;
      if ("Notification" in window && Notification.permission === "default") {
        requestNotificationPermission().then((perm) => {
          if (perm === "granted") subscribeToPush(profileId);
        });
      }
    }
  }, [open, profileId]);

  // Filter by user preferences
  const prefs = getNotifPrefs();
  const notifications = rawNotifs.filter((n) => {
    const prefKey = kindToPref[n.kind];
    return prefKey ? prefs[prefKey] !== false : true;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = useCallback(() => {
    const allIds = new Set(notifications.map((n) => n.id));
    // Merge with existing read ids
    const merged = new Set([...readIds, ...allIds]);
    setReadIds(merged);
    localStorage.setItem("palier_notif_read", JSON.stringify([...merged]));
  }, [notifications, readIds]);

  function handleOpen() {
    setOpen(true);
    // Mark all as read when opening
    if (unreadCount > 0) {
      markAllRead();
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        className={`tap relative flex h-10 w-10 items-center justify-center rounded-full ${dark ? "bg-white/15 text-white" : "bg-white text-ink shadow-card"}`}
      >
        <Icon name="Bell" className="h-[18px] w-[18px]" strokeWidth={2.2} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white ring-2 ring-cream">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title={i.notifications}>
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map((n) => {
              const k = kindIcon[n.kind] ?? kindIcon.post;
              const isRead = readIds.has(n.id);
              return (
                <div key={n.id} className={`flex gap-3 rounded-2xl p-3 ${isRead ? "bg-white" : "bg-palier-50/60"}`}>
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${k.tint}`}>
                    <Icon name={k.icon} className={`h-5 w-5 ${k.color}`} strokeWidth={2.2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${isRead ? "font-medium text-ink" : "font-bold text-ink"}`}>{n.title}</p>
                      {!isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-palier-600" />}
                    </div>
                    <p className="text-[13px] text-ink-soft">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-ink-faint">{timeAgo(n.created_at, lang)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-palier-50">
              <Icon name="BellOff" className="h-7 w-7 text-palier-600" />
            </span>
            <p className="mt-4 text-[15px] font-bold text-ink">{i.notifVide}</p>
            <p className="mt-1 max-w-[14rem] text-[13px] text-ink-soft">{i.notifVideSub}</p>
          </div>
        )}
      </Sheet>
    </>
  );
}
