"use client";
import { useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { FeedbackCard } from "@/components/resident/FeedbackCard";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { LangToggle } from "@/components/resident/LangToggle";
import { whatsappLink } from "@/lib/whatsapp";
import Link from "next/link";

type NotifKey = "charges" | "incidents" | "voisinage" | "ag" | "syndic";

export default function ProfilPage() {
  const { currentUser, building, charges, chargesHistory, incidents, posts } = useData();
  const { i, isAr } = useLang();
  const p = i.profil;

  const roleLabel = currentUser.role === "tenant" ? p.locataire : p.proprietaire;
  const roleCls = currentUser.role === "tenant"
    ? "bg-blue-50 text-blue-700"
    : "bg-emerald-50 text-emerald-700";

  const initials = currentUser.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const errorMsg = p.messageErreur(currentUser.name, building.name);

  const infoRows = [
    { icon: "User", label: p.nom, value: currentUser.name },
    { icon: "Phone", label: p.telephone, value: currentUser.phone || "—" },
    { icon: "Home", label: p.lot, value: currentUser.unit },
    { icon: "Building2", label: p.residence, value: building.name },
  ];

  /* ── Notification preferences (local state, persisted to localStorage) ── */
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>(() => {
    if (typeof window === "undefined") return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
    try {
      const saved = localStorage.getItem("palier_notif_prefs");
      return saved ? JSON.parse(saved) : { charges: true, incidents: true, voisinage: true, ag: true, syndic: true };
    } catch { return { charges: true, incidents: true, voisinage: true, ag: true, syndic: true }; }
  });

  function toggleNotif(key: NotifKey) {
    setNotifs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("palier_notif_prefs", JSON.stringify(next));
      return next;
    });
  }

  function toggleAll(on: boolean) {
    const next: Record<NotifKey, boolean> = { charges: on, incidents: on, voisinage: on, ag: on, syndic: on };
    setNotifs(next);
    localStorage.setItem("palier_notif_prefs", JSON.stringify(next));
  }

  const allOn = Object.values(notifs).every(Boolean);

  const notifRows: { key: NotifKey; icon: string; label: string; desc: string }[] = [
    { key: "charges", icon: "ReceiptText", label: p.notifCharges, desc: p.notifChargesDesc },
    { key: "incidents", icon: "TriangleAlert", label: p.notifIncidents, desc: p.notifIncidentsDesc },
    { key: "voisinage", icon: "Users", label: p.notifVoisinage, desc: p.notifVoisinageDesc },
    { key: "ag", icon: "CalendarDays", label: p.notifAG, desc: p.notifAGDesc },
    { key: "syndic", icon: "Megaphone", label: p.notifSyndic, desc: p.notifSyndicDesc },
  ];

  return (
    <div className="animate-[fade_0.4s_ease]">
      <StatusBar />

      {/* Header */}
      <header className="flex items-center gap-3 px-5 pb-2 pt-3">
        <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-sand/60">
          <Icon name={isAr ? "ChevronRight" : "ChevronLeft"} className="h-4 w-4 text-ink" />
        </Link>
        <h1 className="flex-1 text-[17px] font-bold text-ink">{p.title}</h1>
        <LangToggle />
      </header>

      <div className="space-y-4 px-4">
        {/* ═══════ Avatar + name card ═══════ */}
        <div className="card flex flex-col items-center p-5">
          <span
            className="flex h-16 w-16 items-center justify-center rounded-full text-[22px] font-bold text-white"
            style={{ backgroundColor: currentUser.avatarColor }}
          >
            {initials}
          </span>
          <p className="mt-3 text-[18px] font-bold text-ink">{currentUser.name}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${roleCls}`}>
              {roleLabel}
            </span>
            <span className="text-[12px] text-ink-soft">· {p.lot} {currentUser.unit}</span>
          </div>
        </div>

        {/* ═══════ Mes informations ═══════ */}
        <div className="card divide-y divide-black/5 p-0">
          <div className="px-4 py-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-ink-soft">{p.mesInfos}</p>
          </div>
          {infoRows.map((row) => (
            <div key={row.label} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-palier-50">
                <Icon name={row.icon} className="h-4 w-4 text-palier-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-ink-soft">{row.label}</p>
                <p className="text-[14px] font-semibold text-ink">{row.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ═══════ Notifications ═══════ */}
        <div className="card divide-y divide-black/5 p-0">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-ink-soft">{p.notificationsTitle}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">{p.notificationsDesc}</p>
            </div>
            <button
              onClick={() => toggleAll(!allOn)}
              className={`tap shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${allOn ? "bg-palier-50 text-palier-700" : "bg-sand text-ink-soft"}`}
            >
              {allOn ? p.notifToutDesactiver : p.notifToutActiver}
            </button>
          </div>
          {notifRows.map((row) => (
            <div key={row.key} className="flex items-center gap-3.5 px-4 py-3.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-palier-50">
                <Icon name={row.icon} className="h-4 w-4 text-palier-600" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-ink">{row.label}</p>
                <p className="text-[11px] text-ink-faint">{row.desc}</p>
              </div>
              <button
                onClick={() => toggleNotif(row.key)}
                className={`relative h-7 w-12 rounded-full transition-colors ${notifs[row.key] ? "bg-palier-600" : "bg-black/10"}`}
              >
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${notifs[row.key] ? "start-[22px]" : "start-0.5"}`} />
              </button>
            </div>
          ))}
        </div>

        {/* ═══════ Votre avis ═══════ */}
        <FeedbackCard />

        {/* ═══════ Export des données ═══════ */}
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-palier-50">
              <Icon name="Download" className="h-4 w-4 text-palier-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink">{p.exportTitle}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{p.exportDesc}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-sand/40 p-3">
            <div className="text-center">
              <p className="text-[18px] font-bold text-ink">{chargesHistory.length + charges.length}</p>
              <p className="text-[11px] font-medium text-ink-soft">{p.exportCharges}</p>
            </div>
            <div className="text-center">
              <p className="text-[18px] font-bold text-ink">{incidents.length}</p>
              <p className="text-[11px] font-medium text-ink-soft">{p.exportIncidents}</p>
            </div>
          </div>
          <button
            onClick={() => {
              const data = {
                profil: { nom: currentUser.name, telephone: currentUser.phone, lot: currentUser.unit, role: currentUser.role, residence: building.name },
                charges: [...charges, ...chargesHistory].map((c) => ({ label: c.label, montant: c.amount, statut: c.status, echeance: c.dueDate })),
                incidents: incidents.map((inc) => ({ titre: inc.title, details: inc.details, statut: inc.status, date: inc.createdAt })),
                posts: posts.filter((post) => post.author === currentUser.name).map((post) => ({ contenu: post.body, date: post.createdAt })),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a"); a.href = url; a.download = `palier-export-${currentUser.name.replace(/\s/g, "-").toLowerCase()}.json`; a.click();
              URL.revokeObjectURL(url);
            }}
            className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white py-3 text-[14px] font-semibold text-ink"
          >
            <Icon name="Download" className="h-4 w-4" />
            {p.exportButton}
          </button>
        </div>

        {/* ═══════ Signaler une erreur ═══════ */}
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50">
              <Icon name="CircleAlert" className="h-4 w-4 text-amber-600" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-ink">{p.signalerErreur}</p>
              <p className="mt-0.5 text-[12px] text-ink-soft">{p.signalerDesc}</p>
            </div>
          </div>
          <a
            href={whatsappLink(currentUser.phone || "", errorMsg)}
            target="_blank"
            rel="noopener"
            className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-palier-600 py-3 text-[14px] font-semibold text-white"
          >
            <Icon name="MessageCircle" className="h-4 w-4" />
            {p.prevenir}
          </a>
        </div>

        <div className="h-4" />
      </div>
    </div>
  );
}
