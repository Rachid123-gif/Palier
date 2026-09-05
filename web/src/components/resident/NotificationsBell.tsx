"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Icon } from "@/components/ui/Icon";
import { useDataSafe } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { timeAgo } from "@/lib/format";
import { requestNotificationPermission, subscribeToPush } from "@/lib/push";
import { markNotificationsRead, fetchNotifications } from "@/lib/actions";
import { NOTIF_KIND_TO_PREF } from "@/lib/types";

type Notif = { id: string; title: string; body: string; created_at: string; kind: string; read: boolean };

const kindIcon: Record<string, { icon: string; tint: string; color: string }> = {
  incident: { icon: "TriangleAlert", tint: "bg-danger-soft", color: "text-danger" },
  charge: { icon: "ReceiptText", tint: "bg-coral-400/20", color: "text-coral-600" },
  post: { icon: "Megaphone", tint: "bg-palier-100", color: "text-palier-600" },
  ag: { icon: "CalendarDays", tint: "bg-amber-100", color: "text-amber-600" },
  document: { icon: "FileText", tint: "bg-blue-100", color: "text-blue-600" },
};

function getNotifPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
  try {
    const raw = localStorage.getItem("palier_notif_prefs");
    return raw ? JSON.parse(raw) : { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
  } catch { return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true }; }
}

const POLL_INTERVAL = 30_000; // 30 seconds

export function NotificationsBell({ dark = false, profileId: profileIdProp }: { dark?: boolean; profileId?: string }) {
  const data = useDataSafe();
  const profileId = profileIdProp ?? data?.profileId ?? "";
  const { lang, i } = useLang();
  const [open, setOpen] = useState(false);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const [polledNotifs, setPolledNotifs] = useState<Notif[] | null>(null);
  const pushPrompted = useRef(false);

  const initialNotifs: Notif[] = data?.notifications?.map((n: any) => ({ ...n, read: !!n.read })) ?? [];
  const rawNotifs: Notif[] = polledNotifs ?? initialNotifs;

  // Fetch immediately if no initial data (syndic context without DataProvider)
  useEffect(() => {
    if (!data) {
      fetchNotifications().then(setPolledNotifs).catch(() => {});
    }
  }, [data]);

  // Sync server notification prefs to localStorage on mount (once)
  const prefsSynced = useRef(false);
  useEffect(() => {
    if (prefsSynced.current) return;
    const serverPrefs = data?.currentUser?.notificationPrefs;
    if (serverPrefs && typeof window !== "undefined") {
      prefsSynced.current = true;
      localStorage.setItem("palier_notif_prefs", JSON.stringify(serverPrefs));
    }
  }, [data]);

  // Poll for new notifications every 30s
  useEffect(() => {
    const poll = () => {
      fetchNotifications().then(setPolledNotifs).catch(() => {});
    };
    const id = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(id);
  }, []);

  // Also refresh on window focus
  useEffect(() => {
    const onFocus = () => {
      fetchNotifications().then(setPolledNotifs).catch(() => {});
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const readIds = new Set([
    ...rawNotifs.filter((n) => n.read).map((n) => n.id),
    ...localReadIds,
  ]);

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
    const prefKey = NOTIF_KIND_TO_PREF[n.kind];
    return prefKey ? prefs[prefKey] !== false : true;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  const markAllRead = useCallback(() => {
    const unreadIds = notifications.filter((n) => !readIds.has(n.id)).map((n) => n.id);
    if (!unreadIds.length) return;
    setLocalReadIds((prev) => new Set([...prev, ...unreadIds]));
    markNotificationsRead(unreadIds);
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
