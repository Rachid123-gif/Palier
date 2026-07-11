"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { saveBuildingSettings, generateAccessCode } from "@/lib/actions";
import { submitFeedback } from "@/lib/actions";
import { logout } from "@/lib/auth";

interface NotificationSettings {
  whatsapp_enabled: boolean;
  inapp_enabled: boolean;
  events: Record<string, boolean>;
  quiet_hours: { enabled: boolean; from: string; to: string };
}

interface BuildingSettings {
  enabled_categories: string[] | null;
  features: Record<string, boolean> | null;
  syndic_phone: string | null;
  syndic_email: string | null;
  welcome_message: string | null;
  incident_categories?: string[] | null;
  expense_categories?: string[] | null;
  charge_categories?: string[] | null;
  relance_message?: string | null;
  gardien?: GardienInfo | null;
  notifications?: NotificationSettings | null;
}

interface GardienInfo {
  name: string;
  phone: string;
  horaires: Record<string, { de: string; a: string; repos: boolean }>;
  taches: string[];
}

/* ── Section navigation ── */
const sections = [
  { key: "general", label: "Général", icon: "Building2" },
  { key: "gardien", label: "Gardien", icon: "ShieldCheck" },
  { key: "categories", label: "Catégories", icon: "Tags" },
  { key: "codes", label: "Codes d'accès", icon: "KeyRound" },
  { key: "notifications", label: "Notifications", icon: "BellRing" },
  { key: "relance", label: "Relances", icon: "Bell" },
  { key: "apparence", label: "Apparence", icon: "Palette" },
  { key: "feedback", label: "Retours", icon: "MessageCircle" },
] as const;

type SectionKey = typeof sections[number]["key"];

/* ── Default categories ── */
const DEFAULT_INCIDENT_CATS = [
  "Ascenseur", "Fuite d'eau", "Électricité", "Sécurité", "Propreté",
  "Nuisibles", "Nuisance sonore", "Parking", "Parties communes", "Jardin",
];
const DEFAULT_EXPENSE_CATS = [
  "Maintenance", "Personnel", "Fluides", "Fournitures", "Travaux",
  "Charges", "Assurance",
];
const DEFAULT_CHARGE_CATS = [
  "Charges courantes", "Travaux", "Fonds de réserve",
];

/* ── Notification events ── */
const NOTIF_EVENTS: { key: string; label: string; desc: string; icon: string; color: string }[] = [
  { key: "incident_new", label: "Nouvel incident", desc: "Un résident signale un problème", icon: "TriangleAlert", color: "text-amber-600" },
  { key: "incident_resolved", label: "Incident résolu", desc: "Un incident est marqué comme résolu", icon: "CircleCheck", color: "text-emerald-600" },
  { key: "payment_received", label: "Paiement reçu", desc: "Un résident effectue un paiement", icon: "Banknote", color: "text-emerald-600" },
  { key: "charge_due", label: "Échéance charge", desc: "Un appel de fonds arrive à échéance", icon: "CalendarClock", color: "text-red-600" },
  { key: "post_new", label: "Nouveau post voisinage", desc: "Un résident publie dans le fil voisinage", icon: "MessageSquare", color: "text-blue-600" },
  { key: "ag_reminder", label: "Rappel AG", desc: "Rappel avant une assemblée générale", icon: "Users", color: "text-purple-600" },
  { key: "insurance_expiry", label: "Expiration assurance", desc: "Une police d'assurance arrive à échéance", icon: "Shield", color: "text-red-600" },
  { key: "mandate_expiry", label: "Expiration mandat", desc: "Le mandat du syndic arrive à terme", icon: "UserCheck", color: "text-amber-600" },
  { key: "budget_alert", label: "Dépassement budget", desc: "Une catégorie dépasse le budget prévu", icon: "TrendingUp", color: "text-red-600" },
];

const DEFAULT_NOTIF_EVENTS: Record<string, boolean> = Object.fromEntries(NOTIF_EVENTS.map((e) => [e.key, true]));

export function SettingsView({
  building,
  settings,
}: {
  building: { id: string; name: string; address: string; city: string; lots: number; syndic: string };
  settings: BuildingSettings | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("general");

  // ── General ──
  const [phone, setPhone] = useState(settings?.syndic_phone ?? "");
  const [email, setEmail] = useState(settings?.syndic_email ?? "");
  const [welcome, setWelcome] = useState(settings?.welcome_message ?? "");

  // ── Gardien ──
  const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const DEFAULT_TACHES = [
    "Nettoyage parties communes", "Sortie poubelles", "Réception courrier",
    "Surveillance entrée", "Arrosage plantes", "Petites réparations",
  ];
  const defaultHoraires: GardienInfo["horaires"] = {};
  for (const d of DAYS) defaultHoraires[d] = { de: "08:00", a: "18:00", repos: d === "Dimanche" };

  const savedGardien = settings?.gardien;
  const [gardienName, setGardienName] = useState(savedGardien?.name ?? "");
  const [gardienPhone, setGardienPhone] = useState(savedGardien?.phone ?? "");
  const [gardienHoraires, setGardienHoraires] = useState<GardienInfo["horaires"]>(savedGardien?.horaires ?? defaultHoraires);
  const [gardienTaches, setGardienTaches] = useState<string[]>(savedGardien?.taches ?? DEFAULT_TACHES);
  const [newTache, setNewTache] = useState("");

  function setHoraire(day: string, field: "de" | "a" | "repos", value: string | boolean) {
    setGardienHoraires((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  // ── Categories ──
  const [incidentCats, setIncidentCats] = useState<string[]>(settings?.incident_categories ?? DEFAULT_INCIDENT_CATS);
  const [expenseCats, setExpenseCats] = useState<string[]>(settings?.expense_categories ?? DEFAULT_EXPENSE_CATS);
  const [chargeCats, setChargeCats] = useState<string[]>(settings?.charge_categories ?? DEFAULT_CHARGE_CATS);
  const [newIncidentCat, setNewIncidentCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newChargeCat, setNewChargeCat] = useState("");

  // ── Access codes ──
  const [codePhone, setCodePhone] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // ── Feedback ──
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | "autre">("suggestion");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackContact, setFeedbackContact] = useState<"phone" | "email">("phone");

  // ── Relance ──
  const [relanceMsg, setRelanceMsg] = useState(
    settings?.relance_message ??
    "Bonjour, nous vous rappelons que votre cotisation est en attente de paiement. Merci de régulariser votre situation via l'application Palier."
  );

  // ── Notifications ──
  const savedNotif = settings?.notifications;
  const [notifWhatsapp, setNotifWhatsapp] = useState(savedNotif?.whatsapp_enabled ?? true);
  const [notifInapp, setNotifInapp] = useState(savedNotif?.inapp_enabled ?? true);
  const [notifEvents, setNotifEvents] = useState<Record<string, boolean>>(savedNotif?.events ?? DEFAULT_NOTIF_EVENTS);
  const [quietEnabled, setQuietEnabled] = useState(savedNotif?.quiet_hours?.enabled ?? false);
  const [quietFrom, setQuietFrom] = useState(savedNotif?.quiet_hours?.from ?? "22:00");
  const [quietTo, setQuietTo] = useState(savedNotif?.quiet_hours?.to ?? "07:00");

  function toggleEvent(key: string) {
    setNotifEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function flash(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  function handleSave() {
    startTransition(async () => {
      await saveBuildingSettings(building.id, {
        syndic_phone: phone || undefined,
        syndic_email: email || undefined,
        welcome_message: welcome || undefined,
        incident_categories: incidentCats,
        expense_categories: expenseCats,
        charge_categories: chargeCats,
        relance_message: relanceMsg || undefined,
        gardien: gardienName.trim() ? {
          name: gardienName.trim(),
          phone: gardienPhone.trim(),
          horaires: gardienHoraires,
          taches: gardienTaches,
        } : null,
        notifications: {
          whatsapp_enabled: notifWhatsapp,
          inapp_enabled: notifInapp,
          events: notifEvents,
          quiet_hours: { enabled: quietEnabled, from: quietFrom, to: quietTo },
        },
      } as Record<string, unknown>);
      flash("Configuration sauvegardée");
      router.refresh();
    });
  }

  // ── Category helpers ──
  function addCat(list: string[], setList: (v: string[]) => void, value: string, setInput: (v: string) => void) {
    const v = value.trim();
    if (!v || list.includes(v)) return;
    setList([...list, v]);
    setInput("");
  }
  function removeCat(list: string[], setList: (v: string[]) => void, index: number) {
    setList(list.filter((_, i) => i !== index));
  }

  // ── Access codes ──
  async function handleSendCode() {
    if (generatingCode || !codePhone.trim()) return;
    setGeneratingCode(true);
    const result = await generateAccessCode({
      buildingId: building.id,
      phone: codePhone.trim(),
    });
    if (result.code) {
      // Format phone for WhatsApp (remove spaces, leading 0 → +212)
      let phone = codePhone.trim().replace(/\s+/g, "");
      if (phone.startsWith("0")) phone = "+212" + phone.slice(1);
      if (!phone.startsWith("+")) phone = "+212" + phone;

      const msg = encodeURIComponent(
        `Bienvenue sur Palier ! Voici votre code d'accès pour rejoindre la résidence ${building.name} :\n\n${result.code}\n\nTéléchargez l'application et saisissez ce code pour commencer.`
      );
      window.open(`https://wa.me/${phone.replace("+", "")}?text=${msg}`, "_blank");

      setCodePhone("");
      setCodeSent(true);
      setTimeout(() => setCodeSent(false), 5000);
    }
    setGeneratingCode(false);
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400";

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration de la résidence"
        action={
          <button
            onClick={handleSave}
            disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700 ${isPending ? "opacity-50" : ""}`}
          >
            <Icon name="Save" className="h-3.5 w-3.5" />
            {isPending ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        }
      />

      <div className="flex flex-col gap-6 md:flex-row">
        {/* ── Sidebar navigation (desktop) ── */}
        <nav className="hidden w-[200px] shrink-0 md:block">
          <div className="sticky top-8 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                  activeSection === s.key
                    ? "bg-palier-600 text-white"
                    : "text-ink-soft hover:bg-sand/50 hover:text-ink"
                }`}
              >
                <Icon name={s.icon} className="h-4 w-4" strokeWidth={1.8} />
                {s.label}
              </button>
            ))}

            <div className="mt-4 border-t border-black/[0.06] pt-3">
              <button onClick={() => setShowLogout(true)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
                <Icon name="LogOut" className="h-4 w-4" strokeWidth={1.8} />
                Se déconnecter
              </button>
            </div>
          </div>
        </nav>

        {/* ── Mobile tabs ── */}
        <div className="flex gap-1 overflow-x-auto md:hidden">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                activeSection === s.key ? "bg-palier-600 text-white" : "bg-sand/50 text-ink-soft"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="min-w-0 flex-1 space-y-5">

          {/* ═══ GÉNÉRAL ═══ */}
          {activeSection === "general" && (
            <>
              {/* Building info */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100">
                    <Icon name="Building2" className="h-4 w-4 text-palier-600" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-ink">Résidence</h2>
                </div>
                <div className="rounded-lg bg-sand/40 p-3.5">
                  <p className="text-[15px] font-semibold text-ink">{building.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">{building.address} · {building.city}</p>
                  <div className="mt-2 flex gap-4">
                    <span className="text-[12px] text-ink-soft"><span className="font-semibold text-ink">{building.lots}</span> lots</span>
                    <span className="text-[12px] text-ink-soft">Syndic : <span className="font-semibold text-ink">{building.syndic || "—"}</span></span>
                  </div>
                </div>
              </Card>

              {/* Contact */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Icon name="Phone" className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-ink">Coordonnées du syndic</h2>
                </div>
                <p className="mb-3 text-[12px] text-ink-soft">Ces informations sont visibles par les résidents dans leur application.</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">Téléphone</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 XX XX XX XX" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">Email</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="syndic@residence.ma" className={inputCls} />
                  </div>
                </div>
              </Card>

              {/* Welcome message */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <Icon name="MessageSquare" className="h-4 w-4 text-amber-600" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-ink">Message d&apos;accueil</h2>
                </div>
                <p className="mb-3 text-[12px] text-ink-soft">Affiché aux résidents sur leur page d&apos;accueil.</p>
                <textarea
                  value={welcome}
                  onChange={(e) => setWelcome(e.target.value)}
                  placeholder="Bienvenue dans votre résidence…"
                  rows={3}
                  className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
                />
              </Card>
            </>
          )}

          {/* ═══ GARDIEN ═══ */}
          {activeSection === "gardien" && (
            <>
              {/* Identity */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                    <Icon name="User" className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Identité du gardien</h2>
                    <p className="text-[12px] text-ink-soft">Informations visibles par les résidents pour le contacter.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">Nom complet</label>
                    <input value={gardienName} onChange={(e) => setGardienName(e.target.value)} placeholder="Ex: Mohammed" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">Téléphone / WhatsApp</label>
                    <input type="tel" value={gardienPhone} onChange={(e) => setGardienPhone(e.target.value)} placeholder="06 XX XX XX XX" className={inputCls} />
                  </div>
                </div>
              </Card>

              {/* Horaires */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Icon name="Clock" className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Horaires de travail</h2>
                    <p className="text-[12px] text-ink-soft">Les résidents verront quand le gardien est disponible.</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {DAYS.map((day) => {
                    const h = gardienHoraires[day];
                    return (
                      <div key={day} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-sand/30">
                        <span className="w-[80px] text-[13px] font-medium text-ink">{day}</span>
                        {h.repos ? (
                          <span className="flex-1 text-[12px] text-ink-faint">Repos</span>
                        ) : (
                          <div className="flex flex-1 items-center gap-1.5">
                            <input
                              type="time"
                              value={h.de}
                              onChange={(e) => setHoraire(day, "de", e.target.value)}
                              className="h-8 rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] text-ink outline-none focus:border-palier-400"
                            />
                            <span className="text-[11px] text-ink-faint">à</span>
                            <input
                              type="time"
                              value={h.a}
                              onChange={(e) => setHoraire(day, "a", e.target.value)}
                              className="h-8 rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] text-ink outline-none focus:border-palier-400"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => setHoraire(day, "repos", !h.repos)}
                          className={`flex h-[22px] w-[40px] items-center rounded-full p-0.5 transition-colors ${h.repos ? "bg-black/10" : "bg-palier-600"}`}
                          title={h.repos ? "Activer" : "Jour de repos"}
                        >
                          <div className={`h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${h.repos ? "translate-x-0" : "translate-x-[18px]"}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Tâches */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <Icon name="ClipboardList" className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Responsabilités</h2>
                    <p className="text-[12px] text-ink-soft">Les tâches dont le gardien est responsable, visibles par les résidents.</p>
                  </div>
                </div>

                <div className="mb-3 flex flex-wrap gap-1.5">
                  {gardienTaches.map((t, i) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-lg border border-black/[0.06] bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink">
                      {t}
                      <button onClick={() => setGardienTaches((prev) => prev.filter((_, j) => j !== i))} className="ml-0.5 rounded p-0.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500">
                        <Icon name="X" className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {gardienTaches.length === 0 && <p className="text-[12px] text-ink-soft">Aucune tâche définie</p>}
                </div>

                <div className="flex gap-2">
                  <input
                    value={newTache}
                    onChange={(e) => setNewTache(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = newTache.trim();
                        if (v && !gardienTaches.includes(v)) { setGardienTaches((prev) => [...prev, v]); setNewTache(""); }
                      }
                    }}
                    placeholder="Ex: Distribution courrier…"
                    className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
                  />
                  <button
                    onClick={() => {
                      const v = newTache.trim();
                      if (v && !gardienTaches.includes(v)) { setGardienTaches((prev) => [...prev, v]); setNewTache(""); }
                    }}
                    disabled={!newTache.trim()}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
                  >
                    <Icon name="Plus" className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                </div>
              </Card>

              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  Ces informations apparaîtront dans l&apos;application des résidents. Ils pourront voir les horaires du gardien et le contacter directement par téléphone ou WhatsApp.
                </p>
              </div>
            </>
          )}

          {/* ═══ CATÉGORIES ═══ */}
          {activeSection === "categories" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  Personnalisez les catégories utilisées dans les filtres et formulaires de votre résidence. Chaque résidence peut avoir ses propres catégories.
                </p>
              </div>

              {/* Incident categories */}
              <CategoryBlock
                title="Catégories d'incidents"
                desc="Utilisées lors du signalement d'un incident par les résidents."
                note="Les résidents peuvent aussi signaler un incident avec une catégorie personnalisée via « Autre ». Ces nouvelles catégories apparaîtront automatiquement ici."
                icon="TriangleAlert"
                iconTint="bg-amber-100"
                iconColor="text-amber-600"
                items={incidentCats}
                newValue={newIncidentCat}
                setNewValue={setNewIncidentCat}
                placeholder="Ex: Interphone, Ascenseur…"
                onAdd={() => addCat(incidentCats, setIncidentCats, newIncidentCat, setNewIncidentCat)}
                onRemove={(i) => removeCat(incidentCats, setIncidentCats, i)}
              />

              {/* Expense categories */}
              <CategoryBlock
                title="Catégories de dépenses"
                desc="Utilisées dans le journal de caisse (Transparence)."
                icon="BookOpen"
                iconTint="bg-emerald-100"
                iconColor="text-emerald-600"
                items={expenseCats}
                newValue={newExpenseCat}
                setNewValue={setNewExpenseCat}
                placeholder="Ex: Jardinage, Ascenseur…"
                onAdd={() => addCat(expenseCats, setExpenseCats, newExpenseCat, setNewExpenseCat)}
                onRemove={(i) => removeCat(expenseCats, setExpenseCats, i)}
              />

              {/* Charge categories */}
              <CategoryBlock
                title="Catégories de charges"
                desc="Utilisées lors de l'émission d'un appel de fonds."
                icon="ReceiptText"
                iconTint="bg-blue-100"
                iconColor="text-blue-600"
                items={chargeCats}
                newValue={newChargeCat}
                setNewValue={setNewChargeCat}
                placeholder="Ex: Syndic professionnel…"
                onAdd={() => addCat(chargeCats, setChargeCats, newChargeCat, setNewChargeCat)}
                onRemove={(i) => removeCat(chargeCats, setChargeCats, i)}
              />
            </>
          )}

          {/* ═══ CODES D'ACCÈS ═══ */}
          {activeSection === "codes" && (
            <>
              {/* Explanation */}
              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <div className="text-[12px] text-ink-soft">
                  <p className="font-semibold">Comment ça fonctionne ?</p>
                  <p className="mt-1">Lorsque vous ajoutez un résident depuis « Résidents & lots », un code d&apos;accès unique est automatiquement généré et envoyé par WhatsApp.</p>
                  <p className="mt-1">Si le résident n&apos;a pas reçu son code, utilisez ce formulaire pour en régénérer un et le renvoyer par WhatsApp.</p>
                </div>
              </div>

              {/* Generate & send */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100">
                    <Icon name="KeyRound" className="h-4 w-4 text-palier-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Renvoyer un code d&apos;accès</h2>
                    <p className="text-[12px] text-ink-soft">Le code sera envoyé directement par WhatsApp au résident.</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">Numéro WhatsApp du résident</label>
                    <input
                      type="tel"
                      value={codePhone}
                      onChange={(e) => setCodePhone(e.target.value)}
                      placeholder="06 XX XX XX XX"
                      className={inputCls}
                    />
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={generatingCode || !codePhone.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#20bd5a] disabled:opacity-40"
                  >
                    <Icon name="Send" className="h-4 w-4" />
                    {generatingCode ? "Envoi en cours…" : "Envoyer par WhatsApp"}
                  </button>
                </div>

                {/* Success */}
                {codeSent && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5">
                    <Icon name="CircleCheck" className="h-4 w-4 text-emerald-600" />
                    <p className="text-[12px] font-medium text-emerald-700">Code généré et envoyé par WhatsApp avec succès.</p>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ═══ NOTIFICATIONS ═══ */}
          {activeSection === "notifications" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  Configurez les notifications envoyées par l&apos;application. Choisissez les canaux et les événements qui déclenchent une notification.
                </p>
              </div>

              {/* Channels */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100">
                    <Icon name="Radio" className="h-4 w-4 text-palier-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Canaux de notification</h2>
                    <p className="text-[12px] text-ink-soft">Activez ou désactivez les canaux de communication.</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* WhatsApp */}
                  <div className="flex items-center justify-between rounded-lg border border-black/[0.06] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#25D366]/10">
                        <Icon name="MessageCircle" className="h-4.5 w-4.5 text-[#25D366]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">WhatsApp</p>
                        <p className="text-[11px] text-ink-soft">Notifications envoyées via WhatsApp</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                      className={`flex h-[24px] w-[44px] items-center rounded-full p-0.5 transition-colors ${notifWhatsapp ? "bg-palier-600" : "bg-black/10"}`}
                    >
                      <div className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${notifWhatsapp ? "translate-x-[20px]" : "translate-x-0"}`} />
                    </button>
                  </div>
                  {/* In-app */}
                  <div className="flex items-center justify-between rounded-lg border border-black/[0.06] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
                        <Icon name="Bell" className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink">In-app</p>
                        <p className="text-[11px] text-ink-soft">Notifications dans l&apos;application résidents</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifInapp(!notifInapp)}
                      className={`flex h-[24px] w-[44px] items-center rounded-full p-0.5 transition-colors ${notifInapp ? "bg-palier-600" : "bg-black/10"}`}
                    >
                      <div className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${notifInapp ? "translate-x-[20px]" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>
              </Card>

              {/* Events */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <Icon name="Zap" className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Événements</h2>
                    <p className="text-[12px] text-ink-soft">Choisissez quels événements déclenchent une notification.</p>
                  </div>
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {NOTIF_EVENTS.map((evt) => (
                    <div key={evt.key} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-3">
                        <Icon name={evt.icon} className={`h-4 w-4 ${evt.color}`} />
                        <div>
                          <p className="text-[13px] font-medium text-ink">{evt.label}</p>
                          <p className="text-[11px] text-ink-soft">{evt.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEvent(evt.key)}
                        className={`flex h-[22px] w-[40px] items-center rounded-full p-0.5 transition-colors ${notifEvents[evt.key] ? "bg-palier-600" : "bg-black/10"}`}
                      >
                        <div className={`h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform ${notifEvents[evt.key] ? "translate-x-[18px]" : "translate-x-0"}`} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => setNotifEvents(DEFAULT_NOTIF_EVENTS)}
                    className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-sand/50"
                  >
                    Tout activer
                  </button>
                  <button
                    onClick={() => setNotifEvents(Object.fromEntries(NOTIF_EVENTS.map((e) => [e.key, false])))}
                    className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-sand/50"
                  >
                    Tout désactiver
                  </button>
                </div>
              </Card>

              {/* Quiet hours */}
              <Card>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                      <Icon name="Moon" className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-semibold text-ink">Heures calmes</h2>
                      <p className="text-[12px] text-ink-soft">
                        {quietEnabled
                          ? `Actif · ${quietFrom} → ${quietTo}`
                          : `Désactivé · ${quietFrom} → ${quietTo}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQuietEnabled(!quietEnabled)}
                    className={`flex h-[24px] w-[44px] items-center rounded-full p-0.5 transition-colors ${quietEnabled ? "bg-palier-600" : "bg-black/10"}`}
                  >
                    <div className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${quietEnabled ? "translate-x-[20px]" : "translate-x-0"}`} />
                  </button>
                </div>

                <p className="mb-3 text-[12px] text-ink-soft">
                  Aucune notification WhatsApp (relances, alertes, rappels) ne sera envoyée pendant cette plage. Les notifications in-app restent actives mais silencieuses — le résident les verra à sa prochaine connexion.
                </p>

                <div className="flex items-center gap-3 rounded-lg bg-sand/40 px-4 py-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">De</label>
                    <input
                      type="time"
                      value={quietFrom}
                      onChange={(e) => setQuietFrom(e.target.value)}
                      className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-400"
                    />
                  </div>
                  <span className="mt-4 text-[12px] text-ink-faint">à</span>
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">Jusqu&apos;à</label>
                    <input
                      type="time"
                      value={quietTo}
                      onChange={(e) => setQuietTo(e.target.value)}
                      className="h-9 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-400"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <Icon name="Lightbulb" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[12px] text-amber-800">
                    Exemple : de {quietFrom} à {quietTo}, un rappel de paiement prévu à {quietFrom.replace(":00", ":30")} sera reporté au lendemain à {quietTo}.
                  </p>
                </div>
              </Card>
            </>
          )}

          {/* ═══ RELANCES ═══ */}
          {activeSection === "relance" && (
            <Card>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-coral-100">
                  <Icon name="Bell" className="h-4 w-4 text-coral-600" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold text-ink">Message de relance</h2>
                  <p className="text-[12px] text-ink-soft">Message par défaut envoyé lors d&apos;un rappel de paiement.</p>
                </div>
              </div>

              <textarea
                value={relanceMsg}
                onChange={(e) => setRelanceMsg(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
              />

              <div className="mt-3 rounded-xl bg-sand/50 p-3.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Aperçu de la notification</p>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-100">
                    <Icon name="ReceiptText" className="h-5 w-5 text-coral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">Rappel de paiement</p>
                    <p className="text-[12px] text-ink-soft">{relanceMsg || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-palier-200 bg-palier-50/50 p-3.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-palier-700">Format par défaut (si le champ est vide)</p>
                <div className="space-y-1 text-[12px] text-ink-soft">
                  <p className="font-medium text-ink">Bonjour [Prénom],</p>
                  <p>Votre cotisation pour [Immeuble] (Lot [Réf]) reste en attente.</p>
                  <p>• Montant dû : [Montant] MAD</p>
                  <p>• Déjà payé : [Payé] MAD</p>
                  <p>• Reste à régler : [Restant] MAD</p>
                  <p>• Échéance : [Date]</p>
                  <p>Merci de régulariser votre situation.</p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-3.5 py-2.5">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  Ce message est envoyé comme notification dans l&apos;application du résident lorsque vous cliquez sur « Relancer » depuis la page Recouvrement. Si vous personnalisez le message ci-dessus, il remplacera le format par défaut (les informations détaillées du lot, montant et échéance ne seront pas incluses automatiquement).
                </p>
              </div>
            </Card>
          )}

          {/* ═══ APPARENCE ═══ */}
          {activeSection === "apparence" && (
            <Card>
              <h3 className="mb-1 text-[14px] font-semibold text-ink">Mode d&apos;affichage</h3>
              <p className="mb-4 text-[12px] text-ink-soft">Choisissez le thème visuel de l&apos;interface.</p>
              <ThemeToggle />
            </Card>
          )}

          {/* ═══ RETOURS & SUGGESTIONS ═══ */}
          {activeSection === "feedback" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  Aidez-nous à améliorer Palier ! Signalez un problème ou proposez une fonctionnalité. Chaque retour est lu par notre équipe.
                </p>
              </div>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <Icon name="MessageCircle" className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">Envoyer un retour</h2>
                    <p className="text-[12px] text-ink-soft">Votre avis compte pour améliorer l&apos;application.</p>
                  </div>
                </div>

                {feedbackSent ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Icon name="CircleCheck" className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-[14px] font-semibold text-ink">Merci pour votre retour !</p>
                    <p className="mt-1 text-[12px] text-ink-soft">Notre équipe va l&apos;examiner rapidement.</p>
                    <button
                      onClick={() => { setFeedbackSent(false); setFeedbackMsg(""); }}
                      className="mt-4 rounded-lg border border-black/[0.08] px-4 py-2 text-[13px] font-medium text-ink hover:bg-sand/50"
                    >
                      Envoyer un autre retour
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Type */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Type de retour</label>
                      <div className="flex gap-2">
                        {([
                          { key: "bug" as const, label: "Problème", icon: "Bug" },
                          { key: "suggestion" as const, label: "Suggestion", icon: "Lightbulb" },
                          { key: "autre" as const, label: "Autre", icon: "MessageSquare" },
                        ]).map((t) => (
                          <button
                            key={t.key}
                            onClick={() => setFeedbackType(t.key)}
                            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors ${
                              feedbackType === t.key
                                ? "border-palier-300 bg-palier-50 text-palier-700"
                                : "border-black/[0.06] bg-white text-ink-soft hover:bg-sand/50"
                            }`}
                          >
                            <Icon name={t.icon} className="h-3.5 w-3.5" />
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">
                        {feedbackType === "bug" ? "Décrivez le problème" : feedbackType === "suggestion" ? "Décrivez votre idée" : "Votre message"}
                      </label>
                      <textarea
                        value={feedbackMsg}
                        onChange={(e) => setFeedbackMsg(e.target.value)}
                        placeholder={
                          feedbackType === "bug"
                            ? "Que s'est-il passé ? Quand et où dans l'application ?"
                            : feedbackType === "suggestion"
                            ? "Quelle fonctionnalité aimeriez-vous voir ?"
                            : "Votre message…"
                        }
                        rows={4}
                        className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
                      />
                    </div>

                    {/* Contact preference */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Comment souhaitez-vous être recontacté ?</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setFeedbackContact("phone")}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors ${
                            feedbackContact === "phone"
                              ? "border-palier-300 bg-palier-50 text-palier-700"
                              : "border-black/[0.06] bg-white text-ink-soft hover:bg-sand/50"
                          }`}
                        >
                          <Icon name="Phone" className="h-3.5 w-3.5" />
                          Téléphone
                        </button>
                        <button
                          onClick={() => setFeedbackContact("email")}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[12px] font-medium transition-colors ${
                            feedbackContact === "email"
                              ? "border-palier-300 bg-palier-50 text-palier-700"
                              : "border-black/[0.06] bg-white text-ink-soft hover:bg-sand/50"
                          }`}
                        >
                          <Icon name="Mail" className="h-3.5 w-3.5" />
                          Email
                        </button>
                      </div>
                    </div>

                    {/* Transparency note */}
                    <div className="rounded-xl bg-sand/50 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Informations partagées avec l&apos;équipe Palier</p>
                      <div className="space-y-1 text-[12px] text-ink-soft">
                        <p><span className="font-medium text-ink">Nom :</span> {building.syndic || "—"}</p>
                        <p><span className="font-medium text-ink">Résidence :</span> {building.name}</p>
                        {feedbackContact === "phone" && <p><span className="font-medium text-ink">Téléphone :</span> {phone || "—"}</p>}
                        {feedbackContact === "email" && <p><span className="font-medium text-ink">Email :</span> {email || "—"}</p>}
                      </div>
                      <p className="mt-2 text-[11px] text-ink-faint">Seul le moyen de contact choisi est partagé.</p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={async () => {
                        if (!feedbackMsg.trim()) return;
                        setFeedbackSending(true);
                        await submitFeedback({
                          buildingId: building.id,
                          type: feedbackType,
                          message: feedbackMsg.trim(),
                          senderName: building.syndic || "Syndic",
                          senderPhone: feedbackContact === "phone" ? (phone || null) : null,
                          senderEmail: feedbackContact === "email" ? (email || null) : null,
                          contactPreference: feedbackContact,
                          buildingName: building.name,
                        });
                        setFeedbackSending(false);
                        setFeedbackSent(true);
                      }}
                      disabled={!feedbackMsg.trim() || feedbackSending}
                      className="w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
                    >
                      {feedbackSending ? "Envoi…" : "Envoyer"}
                    </button>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ── Déconnexion (mobile) ── */}
          <div className="border-t border-black/[0.06] pt-4 md:hidden">
            <button onClick={() => setShowLogout(true)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
              <Icon name="LogOut" className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="LogOut" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">Se déconnecter</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              Êtes-vous sûr de vouloir vous déconnecter de l&apos;espace syndic ?
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogout(false)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                Annuler
              </button>
              <button onClick={async () => { await logout(); window.location.href = "/bienvenue"; }} className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                Se déconnecter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Category Block — composant réutilisable pour chaque type
   ═══════════════════════════════════════════════════════════ */

function CategoryBlock({
  title, desc, note, icon, iconTint, iconColor, items, newValue, setNewValue, placeholder, onAdd, onRemove,
}: {
  title: string; desc: string; note?: string; icon: string; iconTint: string; iconColor: string;
  items: string[]; newValue: string; setNewValue: (v: string) => void; placeholder: string;
  onAdd: () => void; onRemove: (i: number) => void;
}) {
  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconTint}`}>
          <Icon name={icon} className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-[14px] font-semibold text-ink">{title}</h2>
          <p className="text-[12px] text-ink-soft">{desc}</p>
        </div>
      </div>

      {note && (
        <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <Icon name="Lightbulb" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <p className="text-[12px] text-amber-800">{note}</p>
        </div>
      )}

      {/* Tags */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {items.map((cat, i) => (
          <span key={cat} className="inline-flex items-center gap-1 rounded-lg border border-black/[0.06] bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink">
            {cat}
            <button onClick={() => onRemove(i)} className="ml-0.5 rounded p-0.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500">
              <Icon name="X" className="h-3 w-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <p className="text-[12px] text-ink-soft">Aucune catégorie</p>
        )}
      </div>

      {/* Add new */}
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={placeholder}
          className="h-9 flex-1 rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-palier-600 px-3 py-2 text-[12px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
        >
          <Icon name="Plus" className="h-3.5 w-3.5" />
          Ajouter
        </button>
      </div>
    </Card>
  );
}
