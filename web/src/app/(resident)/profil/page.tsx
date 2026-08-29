"use client";
import { useState } from "react";
import { StatusBar } from "@/components/resident/StatusBar";
import { Icon } from "@/components/ui/Icon";
import { FeedbackCard } from "@/components/resident/FeedbackCard";
import { useData } from "@/lib/DataProvider";
import { useLang } from "@/lib/LangProvider";
import { LangToggle } from "@/components/resident/LangToggle";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { whatsappLink } from "@/lib/whatsapp";
import { Sheet, Toast } from "@/components/ui/Sheet";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";
import { deleteAccount, exportMyData } from "@/lib/actions";

type NotifKey = "charges" | "incidents" | "voisinage" | "ag" | "syndic";

export default function ProfilPage() {
  const { currentUser, building, charges, chargesHistory, incidents, posts, profileId } = useData();
  const { i, isAr } = useLang();
  const p = i.profil;
  const router = useRouter();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ icon: string; title: string; body: string } | null>(null);
  const [exporting, setExporting] = useState(false);

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
    { icon: "DoorOpen", label: p.lot, value: currentUser.unit },
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
              className={`tap shrink-0 rounded-xl border px-3 py-1.5 text-[12px] font-semibold transition-colors ${allOn ? "border-palier-200 bg-palier-50 text-palier-700" : "border-black/[0.08] bg-white text-ink-soft"}`}
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

        {/* ═══════ Apparence ═══════ */}
        <div className="card p-4">
          <p className="mb-3 text-[12px] font-bold uppercase tracking-wider text-ink-soft">{p.apparence}</p>
          <ThemeToggle />
        </div>

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
            disabled={exporting}
            onClick={async () => {
              setExporting(true);
              try {
                const d = await exportMyData();
                const fmt = (iso: string) => iso ? new Date(iso).toLocaleDateString(isAr ? "ar-MA" : "fr-MA", { day: "numeric", month: "long", year: "numeric" }) : "—";
                const section = (title: string, content: string) => `<section style="margin-bottom:32px"><h2 style="font-size:17px;font-weight:700;color:#111815;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e5e7eb">${title}</h2>${content}</section>`;
                const row = (label: string, value: string) => `<tr><td style="padding:6px 12px;font-size:13px;color:#6b7280;white-space:nowrap">${label}</td><td style="padding:6px 12px;font-size:13px;color:#111815;font-weight:500">${value}</td></tr>`;
                const table = (headers: string[], rows: string[][]) => {
                  const ths = headers.map(h => `<th style="padding:8px 12px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#6b7280;text-align:${isAr ? "right" : "left"};border-bottom:2px solid #e5e7eb">${h}</th>`).join("");
                  const trs = rows.map(r => `<tr style="border-bottom:1px solid #f3f4f6">${r.map(c => `<td style="padding:8px 12px;font-size:13px;color:#374151">${c}</td>`).join("")}</tr>`).join("");
                  return `<table style="width:100%;border-collapse:collapse">${ths ? `<thead><tr>${ths}</tr></thead>` : ""}<tbody>${trs}</tbody></table>`;
                };
                const statusLabel: Record<string, string> = { due: isAr ? "مستحق" : "À payer", partial: isAr ? "جزئي" : "Partiel", paid: isAr ? "مدفوع" : "Payé", late: isAr ? "متأخر" : "En retard", open: isAr ? "مفتوح" : "Ouvert", in_progress: isAr ? "قيد المعالجة" : "En cours", resolved: isAr ? "تم الحل" : "Résolu" };
                const methodLabel: Record<string, string> = { cash: isAr ? "نقداً" : "Espèces", cheque: isAr ? "شيك" : "Chèque", virement: isAr ? "تحويل" : "Virement", autre: isAr ? "آخر" : "Autre" };
                const choiceLabel: Record<string, string> = { for: isAr ? "مع" : "Pour", against: isAr ? "ضد" : "Contre", abstain: isAr ? "امتناع" : "Abstention" };

                const html = `<!DOCTYPE html><html lang="${isAr ? "ar" : "fr"}" dir="${isAr ? "rtl" : "ltr"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${isAr ? "تصدير بياناتي" : "Export de mes données"} — Palier</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:720px;margin:0 auto;padding:24px 20px 48px;color:#374151;background:#fff}@media print{body{padding:0}}</style></head><body>
<div style="margin-bottom:32px">
  <h1 style="font-size:24px;font-weight:800;color:#111815">${isAr ? "تصدير بياناتي" : "Export de mes données"}</h1>
  <p style="font-size:13px;color:#6b7280;margin-top:4px">${isAr ? "تاريخ التصدير" : "Date d'export"} : ${fmt(d.exportDate)}</p>
</div>

${section(isAr ? "الملف الشخصي" : "Profil", `<table style="width:100%;border-collapse:collapse">${row(isAr ? "الاسم" : "Nom", d.profil.nom)}${row(isAr ? "الهاتف" : "Téléphone", d.profil.telephone || "—")}${row(isAr ? "الشقة" : "Lot", d.profil.lot || "—")}${row(isAr ? "الصفة" : "Rôle", d.profil.role)}${row(isAr ? "الإقامة" : "Résidence", d.profil.residence)}${row(isAr ? "المدينة" : "Ville", d.profil.ville)}</table>`)}

${d.charges.length ? section(isAr ? "المصاريف" : "Charges", table(
  [isAr ? "الوصف" : "Label", isAr ? "المبلغ" : "Montant", isAr ? "مدفوع" : "Payé", isAr ? "الحالة" : "Statut", isAr ? "الاستحقاق" : "Échéance"],
  d.charges.map((c: any) => [c.label, `${c.montant} MAD`, `${c.paye} MAD`, statusLabel[c.statut] || c.statut, c.echeance ? fmt(c.echeance) : "—"])
)) : ""}

${d.paiements.length ? section(isAr ? "المدفوعات" : "Paiements", table(
  [isAr ? "المبلغ" : "Montant", isAr ? "الطريقة" : "Méthode", isAr ? "ملاحظة" : "Note", isAr ? "التاريخ" : "Date"],
  d.paiements.map((p: any) => [`${p.montant} MAD`, methodLabel[p.methode] || p.methode, p.note || "—", fmt(p.date)])
)) : ""}

${d.incidents.length ? section(isAr ? "الحوادث" : "Incidents", table(
  [isAr ? "العنوان" : "Titre", isAr ? "الفئة" : "Catégorie", isAr ? "الأولوية" : "Urgence", isAr ? "الحالة" : "Statut", isAr ? "التاريخ" : "Date"],
  d.incidents.map((inc: any) => [inc.titre, inc.categorie, inc.urgence, statusLabel[inc.statut] || inc.statut, fmt(inc.date)])
)) : ""}

${d.publications.length ? section(isAr ? "المنشورات" : "Publications", table(
  [isAr ? "النوع" : "Type", isAr ? "المحتوى" : "Contenu", isAr ? "التاريخ" : "Date"],
  d.publications.map((p: any) => [p.type, (p.titre ? `<strong>${p.titre}</strong> — ` : "") + (p.contenu?.substring(0, 120) || "—") + (p.contenu?.length > 120 ? "…" : ""), fmt(p.date)])
)) : ""}

${d.votes.length ? section(isAr ? "التصويتات" : "Votes en assemblée", table(
  [isAr ? "القرار" : "Résolution", isAr ? "الاختيار" : "Choix", isAr ? "التاريخ" : "Date"],
  d.votes.map((v: any) => [v.resolution, choiceLabel[v.choix] || v.choix, fmt(v.date)])
)) : ""}

${d.notifications.length ? section(isAr ? "الإشعارات" : `Notifications (${d.notifications.length})`, table(
  [isAr ? "العنوان" : "Titre", isAr ? "المحتوى" : "Contenu", isAr ? "التاريخ" : "Date"],
  d.notifications.slice(0, 50).map((n: any) => [n.titre, n.contenu?.substring(0, 100) || "—", fmt(n.date)])
)) : ""}

${d.likes.length ? section(isAr ? "الإعجابات" : `Likes (${d.likes.length})`, `<p style="font-size:13px;color:#6b7280">${isAr ? `لقد أعجبت بـ ${d.likes.length} منشور(ات)` : `Vous avez aimé ${d.likes.length} publication(s)`}</p>`) : ""}

<footer style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center">
  © ${new Date().getFullYear()} Palier — ${isAr ? "تم إنشاء هذا المستند تلقائياً بناءً على طلب المستخدم (قانون 09-08)" : "Document généré automatiquement à la demande de l'utilisateur (Loi 09-08)"}
</footer>
</body></html>`;

                const blob = new Blob([html], { type: "text/html;charset=utf-8" });
                const url = URL.createObjectURL(blob);
                window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              } catch {
                // error
              } finally {
                setExporting(false);
              }
            }}
            className={`tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-black/[0.08] bg-white py-3 text-[14px] font-semibold text-ink ${exporting ? "opacity-50" : ""}`}
          >
            <Icon name={exporting ? "Loader2" : "Download"} className={`h-4 w-4 ${exporting ? "animate-spin" : ""}`} />
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
            href={whatsappLink(building.syndicPhone || "", errorMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="tap mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-palier-600 py-3 text-[14px] font-semibold text-white"
          >
            <Icon name="MessageCircle" className="h-4 w-4" />
            {p.prevenir}
          </a>
        </div>

        {/* ═══════ Votre avis ═══════ */}
        <FeedbackCard />

        {/* ═══════ CGU & Politique de confidentialité ═══════ */}
        <div className="flex justify-center gap-3 text-[12px] text-ink-soft">
          <Link href="/conditions-utilisation" className="underline">
            {p.conditionsUtilisation}
          </Link>
          <Link href="/politique-confidentialite" className="underline">
            {p.politiqueConfidentialite}
          </Link>
        </div>

        {/* ═══════ Déconnexion ═══════ */}
        <button
          onClick={() => setLogoutOpen(true)}
          className="tap flex w-full items-center justify-center gap-2 rounded-2xl border border-danger/20 bg-white py-3 text-[14px] font-semibold text-danger"
        >
          <Icon name="LogOut" className="h-4 w-4" />
          {p.deconnexion}
        </button>

        {/* ═══════ Supprimer mon compte ═══════ */}
        <button
          onClick={() => setDeleteOpen(true)}
          className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-danger py-3 text-[14px] font-semibold text-white"
        >
          <Icon name="Trash2" className="h-4 w-4" />
          {p.supprimerCompte}
        </button>

        <div className="h-4" />
      </div>

      <Sheet open={logoutOpen} onClose={() => setLogoutOpen(false)} title={p.deconnexion}>
        <p className="text-[14px] text-ink-soft">{p.deconnexionDesc}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setLogoutOpen(false)}
            className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft">
            {p.deconnexionAnnuler}
          </button>
          <button onClick={async () => { localStorage.removeItem("palier_notif_prefs"); localStorage.removeItem("palier_notif_read"); await logout(); window.location.href = "/bienvenue"; }}
            className="tap flex-1 rounded-full bg-danger py-3 text-[13px] font-semibold text-white">
            {p.deconnexionConfirm}
          </button>
        </div>
      </Sheet>

      <Sheet open={deleteOpen} onClose={() => setDeleteOpen(false)} title={p.supprimerCompte}>
        <p className="text-[14px] text-ink-soft">{p.supprimerCompteDesc}</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => setDeleteOpen(false)}
            className="tap flex-1 rounded-full border border-palier-100 bg-white py-3 text-[13px] font-semibold text-ink-soft">
            {p.supprimerAnnuler}
          </button>
          <button
            disabled={deleting}
            onClick={async () => {
              setDeleting(true);
              try {
                await deleteAccount();
                localStorage.removeItem("palier_notif_prefs");
                localStorage.removeItem("palier_notif_read");
                await logout();
                window.location.href = "/bienvenue";
              } catch {
                setDeleting(false);
              }
            }}
            className={`tap flex-1 rounded-full bg-danger py-3 text-[13px] font-semibold text-white ${deleting ? "opacity-50" : ""}`}>
            {p.supprimerConfirm}
          </button>
        </div>
      </Sheet>

      {toast && <Toast open onClose={() => setToast(null)} icon={toast.icon} title={toast.title} body={toast.body} />}
    </div>
  );
}
