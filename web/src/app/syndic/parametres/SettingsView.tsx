"use client";
import { useState, useTransition, useEffect, useRef, useCallback } from "react";

import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { saveBuildingSettings, resendCodeByPhone, uploadFileAction } from "@/lib/actions";
import { submitFeedback } from "@/lib/actions";
import { logout } from "@/lib/auth";
import { useLang } from "@/lib/LangProvider";

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
  voisinage_categories?: string[] | null;
  budget_categories?: string[] | null;
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
const sectionDefs = [
  { key: "general", icon: "Building2" },
  { key: "gardien", icon: "ShieldCheck" },
  { key: "categories", icon: "Tags" },
  { key: "codes", icon: "KeyRound" },
  { key: "notifications", icon: "BellRing" },
  { key: "relance", icon: "Bell" },
  { key: "apparence", icon: "Palette" },
  { key: "feedback", icon: "MessageCircle" },
] as const;

type SectionKey = typeof sectionDefs[number]["key"];

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
const DEFAULT_VOISINAGE_CATS = [
  "Annonce", "Événement", "Entraide", "Trouvé", "Général", "Service", "Recommandation",
];
const DEFAULT_BUDGET_CATS = [
  "Personnel", "Maintenance", "Fluides", "Assurance", "Gestion", "Travaux", "Autre",
];

/* ── Notification events ── */
const NOTIF_EVENT_DEFS: { key: string; icon: string; color: string }[] = [
  { key: "incident_new", icon: "TriangleAlert", color: "text-amber-600" },
  { key: "incident_resolved", icon: "CircleCheck", color: "text-emerald-600" },
  { key: "payment_received", icon: "Banknote", color: "text-emerald-600" },
  { key: "charge_due", icon: "CalendarClock", color: "text-red-600" },
  { key: "post_new", icon: "MessageSquare", color: "text-blue-600" },
  { key: "ag_reminder", icon: "Users", color: "text-purple-600" },
  { key: "insurance_expiry", icon: "Shield", color: "text-red-600" },
  { key: "mandate_expiry", icon: "UserCheck", color: "text-amber-600" },
  { key: "budget_alert", icon: "TrendingUp", color: "text-red-600" },
];

const DEFAULT_NOTIF_EVENTS: Record<string, boolean> = Object.fromEntries(NOTIF_EVENT_DEFS.map((e) => [e.key, true]));

export function SettingsView({
  building,
  settings,
  units,
  verifiedPhone,
}: {
  building: { id: string; name: string; address: string; city: string; lots: number; syndic: string };
  settings: BuildingSettings | null;
  units: { id: string; ref: string; floor: number | null; tantiemes: number }[];
  verifiedPhone: string;
}) {
  const { i, isAr } = useLang();
  const T = i.syndic.settings;
  const C = i.syndic.common;

  const sections = sectionDefs.map((s) => ({
    ...s,
    label: T.sections[s.key as keyof typeof T.sections],
  }));

  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState("");
  const [activeSection, setActiveSection] = useState<SectionKey>("general");

  // ── General ──
  const phone = verifiedPhone || settings?.syndic_phone || "";
  const [email, setEmail] = useState(settings?.syndic_email ?? "");
  const [welcome, setWelcome] = useState(settings?.welcome_message ?? "");

  // ── Gardien ──
  const DAYS = T.gardien.days;
  const DAY_KEYS = ["0", "1", "2", "3", "4", "5", "6"];
  const FR_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  const DEFAULT_TACHES = [
    "Nettoyage parties communes", "Sortie poubelles", "Réception courrier",
    "Surveillance entrée", "Arrosage plantes", "Petites réparations",
  ];
  const defaultHoraires: GardienInfo["horaires"] = {};
  for (let idx = 0; idx < 7; idx++) defaultHoraires[String(idx)] = { de: "08:00", a: "18:00", repos: idx === 6 };
  function normalizeHoraires(raw: GardienInfo["horaires"]): GardienInfo["horaires"] {
    const keys = Object.keys(raw);
    if (keys.length === 0) return defaultHoraires;
    if (keys.every((k) => /^\d$/.test(k))) return raw;
    const result: GardienInfo["horaires"] = {};
    for (let idx = 0; idx < FR_DAYS.length; idx++) {
      result[String(idx)] = raw[FR_DAYS[idx]] ?? { de: "08:00", a: "18:00", repos: idx === 6 };
    }
    return result;
  }

  const savedGardien = settings?.gardien;
  const [gardienName, setGardienName] = useState(savedGardien?.name ?? "");
  const [gardienPhone, setGardienPhone] = useState(savedGardien?.phone ?? "");
  const [gardienPhoneError, setGardienPhoneError] = useState(() => {
    const p = savedGardien?.phone ?? "";
    return p && !/^0[567]\d{8}$/.test(p) ? T.gardien.phoneError : "";
  });

  function handleGardienPhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setGardienPhone(digits);
    if (digits && !/^0[567]\d{8}$/.test(digits)) {
      setGardienPhoneError(T.gardien.phoneError);
    } else {
      setGardienPhoneError("");
    }
  }
  const [gardienHoraires, setGardienHoraires] = useState<GardienInfo["horaires"]>(savedGardien?.horaires ? normalizeHoraires(savedGardien.horaires) : defaultHoraires);
  const [gardienTaches, setGardienTaches] = useState<string[]>(savedGardien?.taches ?? DEFAULT_TACHES);
  const [newTache, setNewTache] = useState("");

  function setHoraire(day: string, field: "de" | "a" | "repos", value: string | boolean) {
    setGardienHoraires((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  // ── Categories ──
  const [incidentCats, setIncidentCats] = useState<string[]>(settings?.incident_categories ?? DEFAULT_INCIDENT_CATS);
  const [expenseCats, setExpenseCats] = useState<string[]>(settings?.expense_categories ?? DEFAULT_EXPENSE_CATS);
  const [chargeCats, setChargeCats] = useState<string[]>(settings?.charge_categories ?? DEFAULT_CHARGE_CATS);
  const [voisinageCats, setVoisinageCats] = useState<string[]>(settings?.voisinage_categories ?? DEFAULT_VOISINAGE_CATS);
  const [budgetCats, setBudgetCats] = useState<string[]>(settings?.budget_categories ?? DEFAULT_BUDGET_CATS);
  const [newIncidentCat, setNewIncidentCat] = useState("");
  const [newExpenseCat, setNewExpenseCat] = useState("");
  const [newChargeCat, setNewChargeCat] = useState("");
  const [newVoisinageCat, setNewVoisinageCat] = useState("");
  const [newBudgetCat, setNewBudgetCat] = useState("");

  // ── Access codes ──
  const [codePhone, setCodePhone] = useState("");
  const [codeError, setCodeError] = useState("");
  const [generatingCode, setGeneratingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [showLogout, setShowLogout] = useState(false);

  // ── Feedback ──
  const [feedbackType, setFeedbackType] = useState<"bug" | "suggestion" | "autre">("suggestion");
  const [feedbackMsg, setFeedbackMsg] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSending, setFeedbackSending] = useState(false);
  const [feedbackContact, setFeedbackContact] = useState<"phone" | "email">("phone");
  const [feedbackFile, setFeedbackFile] = useState<File | null>(null);

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

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const doSave = useCallback(() => {
    // Block save if gardien phone is filled but invalid
    if (gardienPhone.trim() && !/^0[567]\d{8}$/.test(gardienPhone.trim())) return;

    startTransition(async () => {
      setSaveStatus("saving");
      await saveBuildingSettings(building.id, {
        syndic_phone: phone || undefined,
        syndic_email: email || undefined,
        welcome_message: welcome || undefined,
        incident_categories: incidentCats,
        expense_categories: expenseCats,
        charge_categories: chargeCats,
        voisinage_categories: voisinageCats,
        budget_categories: budgetCats,
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
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    });
  }, [building.id, email, welcome, incidentCats, expenseCats, chargeCats, voisinageCats, budgetCats, relanceMsg, gardienName, gardienPhone, gardienHoraires, gardienTaches, notifWhatsapp, notifInapp, notifEvents, quietEnabled, quietFrom, quietTo, startTransition]);

  // Auto-save with 1s debounce
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(doSave, 1000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [doSave]);

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
  function handleCodePhone(val: string) {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setCodePhone(digits);
    setCodeError("");
  }

  async function handleSendCode() {
    if (generatingCode || !codePhone.trim()) return;
    setCodeError("");

    // Client-side format validation
    const normalized = codePhone.trim().replace(/\s+/g, "");
    if (!/^0[5-7]\d{8}$/.test(normalized)) {
      setCodeError(T.codes.phoneInvalid);
      return;
    }

    setGeneratingCode(true);
    const result = await resendCodeByPhone(normalized);

    if (result.error === "invalid_format") {
      setCodeError(T.codes.phoneInvalid);
      setGeneratingCode(false);
      return;
    }
    if (result.error === "not_found") {
      setCodeError(T.codes.phoneNotFound);
      setGeneratingCode(false);
      return;
    }

    if (result.code) {
      // Format phone for WhatsApp (leading 0 → +212)
      let phone = normalized;
      if (phone.startsWith("0")) phone = "+212" + phone.slice(1);
      if (!phone.startsWith("+")) phone = "+212" + phone;

      const msg = encodeURIComponent(T.codes.whatsappMsg(building.name, result.code));
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
        title={T.title}
        subtitle={T.subtitle}
        action={
          saveStatus !== "idle" ? (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-ink-soft">
              {saveStatus === "saving" ? (
                <><Icon name="LoaderCircle" className="h-3.5 w-3.5 animate-spin" /> {T.saving}</>
              ) : (
                <><Icon name="Check" className="h-3.5 w-3.5 text-emerald-600" /> {T.saved}</>
              )}
            </span>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* ── Sidebar navigation (desktop) ── */}
        <nav className="hidden w-[200px] shrink-0 lg:block">
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
                {T.logout}
              </button>
            </div>
          </div>
        </nav>

        {/* ── Mobile tabs (grid so all are visible) ── */}
        <div className="grid grid-cols-4 gap-1.5 lg:hidden">
          {sections.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2 text-[10px] font-semibold transition-colors ${
                activeSection === s.key ? "border-palier-600 bg-palier-600 text-white" : "border-black/[0.08] bg-cream-card text-ink"
              }`}
            >
              <Icon name={s.icon} className="h-4 w-4" strokeWidth={1.8} />
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
                  <h2 className="text-[14px] font-semibold text-ink">{T.general.residence}</h2>
                </div>
                <div className="rounded-lg bg-sand/40 p-3.5">
                  <p className="text-[15px] font-semibold text-ink">{building.name}</p>
                  <p className="mt-0.5 text-[12px] text-ink-soft">{building.address} · {building.city}</p>
                  <div className="mt-2 flex gap-4">
                    <span className="text-[12px] text-ink-soft"><span className="font-semibold text-ink" dir="ltr">{building.lots}</span> {T.general.lots}</span>
                    <span className="text-[12px] text-ink-soft">{T.general.syndicLabel} <span className="font-semibold text-ink">{building.syndic || "—"}</span></span>
                  </div>
                </div>
              </Card>

              {/* Contact */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                    <Icon name="Phone" className="h-4 w-4 text-blue-600" />
                  </div>
                  <h2 className="text-[14px] font-semibold text-ink">{T.general.contactTitle}</h2>
                </div>
                <p className="mb-3 text-[12px] text-ink-soft">{T.general.contactDesc}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{T.general.phoneVerified}</label>
                    <div className={`${inputCls} flex items-center justify-between bg-sand/50 text-ink-soft`}>
                      <span dir="ltr">{phone || "—"}</span>
                      <Icon name="ShieldCheck" className="h-4 w-4 text-emerald-500" />
                    </div>
                    <p className="mt-1 text-[11px] text-ink-faint">{T.general.phoneVerifiedNote}</p>
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{T.general.email}</label>
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
                  <h2 className="text-[14px] font-semibold text-ink">{T.general.welcomeTitle}</h2>
                </div>
                <p className="mb-3 text-[12px] text-ink-soft">{T.general.welcomeDesc}</p>
                <textarea
                  value={welcome}
                  onChange={(e) => setWelcome(e.target.value)}
                  placeholder={T.general.welcomePlaceholder}
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
                    <h2 className="text-[14px] font-semibold text-ink">{T.gardien.identityTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.gardien.identityDesc}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{T.gardien.fullName}</label>
                    <input value={gardienName} onChange={(e) => setGardienName(e.target.value)} placeholder="Ex: Mohammed" className={inputCls} />
                  </div>
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{T.gardien.phoneWhatsapp}</label>
                    <input type="tel" inputMode="numeric" value={gardienPhone} onChange={(e) => handleGardienPhone(e.target.value)} placeholder="06 XX XX XX XX" maxLength={10} className={`${inputCls} ${gardienPhoneError ? "border-red-400 focus:border-red-400 focus:ring-red-400" : ""}`} dir="ltr" />
                    {gardienPhoneError && <p className="mt-1 text-[11px] text-red-500">{gardienPhoneError}</p>}
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
                    <h2 className="text-[14px] font-semibold text-ink">{T.gardien.scheduleTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.gardien.scheduleDesc}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {DAY_KEYS.map((key, idx) => {
                    const h = gardienHoraires[key] ?? { de: "08:00", a: "18:00", repos: false };
                    return (
                      <div key={key} className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2 hover:bg-sand/30 sm:flex-nowrap sm:gap-3">
                        <span className="w-[70px] shrink-0 text-[13px] font-medium text-ink sm:w-[80px]">{DAYS[idx]}</span>
                        {h.repos ? (
                          <span className="flex-1 text-[12px] text-ink-faint">{T.gardien.dayOff}</span>
                        ) : (
                          <div className="flex min-w-0 flex-1 items-center gap-1.5">
                            <input
                              type="time"
                              value={h.de}
                              onChange={(e) => setHoraire(key, "de", e.target.value)}
                              className="h-8 min-w-0 flex-1 rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] text-ink outline-none focus:border-palier-400 sm:flex-none"
                            />
                            <span className="text-[11px] text-ink-faint">{C.at}</span>
                            <input
                              type="time"
                              value={h.a}
                              onChange={(e) => setHoraire(key, "a", e.target.value)}
                              className="h-8 min-w-0 flex-1 rounded-lg border border-black/[0.08] bg-white px-2 text-[12px] text-ink outline-none focus:border-palier-400 sm:flex-none"
                            />
                          </div>
                        )}
                        <button
                          onClick={() => setHoraire(key, "repos", !h.repos)}
                          className={`flex h-[22px] w-[40px] shrink-0 items-center rounded-full p-0.5 transition-colors ${h.repos ? "bg-black/10" : "bg-palier-600"}`}
                          title={h.repos ? T.gardien.enableDay : T.gardien.dayOffToggle}
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
                    <h2 className="text-[14px] font-semibold text-ink">{T.gardien.tasksTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.gardien.tasksDesc}</p>
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
                  {gardienTaches.length === 0 && <p className="text-[12px] text-ink-soft">{T.gardien.noTasks}</p>}
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
                    {C.add}
                  </button>
                </div>
              </Card>

              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  {T.gardien.infoNote}
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
                  {T.categories.intro}
                </p>
              </div>

              {/* Incident categories */}
              <CategoryBlock
                title={T.categories.incidents}
                desc={T.categories.incidentsDesc}
                note={T.categories.incidentsNote}
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
                title={T.categories.expenses}
                desc={T.categories.expensesDesc}
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
                title={T.categories.charges}
                desc={T.categories.chargesDesc}
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

              {/* Voisinage categories */}
              <CategoryBlock
                title={T.categories.voisinage}
                desc={T.categories.voisinageDesc}
                icon="MessageSquare"
                iconTint="bg-purple-100"
                iconColor="text-purple-600"
                items={voisinageCats}
                newValue={newVoisinageCat}
                setNewValue={setNewVoisinageCat}
                placeholder="Ex: Vente, Échange…"
                onAdd={() => addCat(voisinageCats, setVoisinageCats, newVoisinageCat, setNewVoisinageCat)}
                onRemove={(i) => removeCat(voisinageCats, setVoisinageCats, i)}
              />

              {/* Budget categories */}
              <CategoryBlock
                title={T.categories.budget}
                desc={T.categories.budgetDesc}
                icon="Calculator"
                iconTint="bg-orange-100"
                iconColor="text-orange-600"
                items={budgetCats}
                newValue={newBudgetCat}
                setNewValue={setNewBudgetCat}
                placeholder="Ex: Jardinage, Ascenseur…"
                onAdd={() => addCat(budgetCats, setBudgetCats, newBudgetCat, setNewBudgetCat)}
                onRemove={(i) => removeCat(budgetCats, setBudgetCats, i)}
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
                  <p className="font-semibold">{T.codes.howTitle}</p>
                  <p className="mt-1">{T.codes.howDesc1}</p>
                  <p className="mt-1">{T.codes.howDesc2}</p>
                </div>
              </div>

              {/* Generate & send */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100">
                    <Icon name="KeyRound" className="h-4 w-4 text-palier-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">{T.codes.resendTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.codes.resendDesc}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-[12px] font-semibold text-ink-soft">{T.codes.phoneLabel}</label>
                    <input
                      type="tel"
                      value={codePhone}
                      onChange={(e) => handleCodePhone(e.target.value)}
                      placeholder="06 XX XX XX XX"
                      className={`${inputCls}${codeError ? " !border-red-400 !ring-red-400" : ""}`}
                      dir="ltr"
                    />
                    {codeError && (
                      <p className="mt-1 text-[11px] text-red-600">{codeError}</p>
                    )}
                  </div>
                  <button
                    onClick={handleSendCode}
                    disabled={generatingCode || !codePhone.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#20bd5a] disabled:opacity-40"
                  >
                    <Icon name="Send" className="h-4 w-4" />
                    {generatingCode ? T.codes.sending : T.codes.sendWhatsApp}
                  </button>
                </div>

                {/* Success */}
                {codeSent && (
                  <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5">
                    <Icon name="CircleCheck" className="h-4 w-4 text-emerald-600" />
                    <p className="text-[12px] font-medium text-emerald-700">{T.codes.success}</p>
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
                  {T.notif.intro}
                </p>
              </div>

              {/* Channels */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-palier-100">
                    <Icon name="Radio" className="h-4 w-4 text-palier-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">{T.notif.channelsTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.notif.channelsDesc}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {/* WhatsApp */}
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.06] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10">
                        <Icon name="MessageCircle" className="h-4.5 w-4.5 text-[#25D366]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">WhatsApp</p>
                        <p className="text-[11px] text-ink-soft">{T.notif.whatsappDesc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifWhatsapp(!notifWhatsapp)}
                      className={`flex h-[24px] w-[44px] shrink-0 items-center rounded-full p-0.5 transition-colors ${notifWhatsapp ? "bg-palier-600" : "bg-black/10"}`}
                    >
                      <div className={`h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${notifWhatsapp ? "translate-x-[20px]" : "translate-x-0"}`} />
                    </button>
                  </div>
                  {/* In-app */}
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.06] px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                        <Icon name="Bell" className="h-4.5 w-4.5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">In-app</p>
                        <p className="text-[11px] text-ink-soft">{T.notif.inappDesc}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotifInapp(!notifInapp)}
                      className={`flex h-[24px] w-[44px] shrink-0 items-center rounded-full p-0.5 transition-colors ${notifInapp ? "bg-palier-600" : "bg-black/10"}`}
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
                    <h2 className="text-[14px] font-semibold text-ink">{T.notif.eventsTitle}</h2>
                    <p className="text-[12px] text-ink-soft">{T.notif.eventsDesc}</p>
                  </div>
                </div>
                <div className="divide-y divide-black/[0.04]">
                  {NOTIF_EVENT_DEFS.map((evt) => (
                    <div key={evt.key} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <Icon name={evt.icon} className={`h-4 w-4 shrink-0 ${evt.color}`} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-ink">{T.notif[evt.key as keyof typeof T.notif] as string}</p>
                          <p className="text-[11px] text-ink-soft">{T.notif[`${evt.key}_desc` as keyof typeof T.notif] as string}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleEvent(evt.key)}
                        className={`flex h-[22px] w-[40px] shrink-0 items-center rounded-full p-0.5 transition-colors ${notifEvents[evt.key] ? "bg-palier-600" : "bg-black/10"}`}
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
                    {T.notif.enableAll}
                  </button>
                  <button
                    onClick={() => setNotifEvents(Object.fromEntries(NOTIF_EVENT_DEFS.map((e) => [e.key, false])))}
                    className="rounded-lg border border-black/[0.08] px-3 py-1.5 text-[12px] font-medium text-ink-soft hover:bg-sand/50"
                  >
                    {T.notif.disableAll}
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
                      <h2 className="text-[14px] font-semibold text-ink">{T.notif.quietTitle}</h2>
                      <p className="text-[12px] text-ink-soft">
                        {quietEnabled
                          ? <><span>{T.notif.active}</span> · <span dir="ltr">{quietFrom} → {quietTo}</span></>
                          : <><span>{T.notif.disabled}</span> · <span dir="ltr">{quietFrom} → {quietTo}</span></>}
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
                  {T.notif.quietDesc}
                </p>

                <div className="flex flex-wrap items-center gap-3 rounded-lg bg-sand/40 px-4 py-3 sm:flex-nowrap">
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">{T.notif.from}</label>
                    <input
                      type="time"
                      value={quietFrom}
                      onChange={(e) => setQuietFrom(e.target.value)}
                      className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-400"
                    />
                  </div>
                  <span className="mt-4 text-[12px] text-ink-faint">{C.at}</span>
                  <div className="min-w-0 flex-1">
                    <label className="mb-1 block text-[11px] font-semibold text-ink-soft">{T.notif.until}</label>
                    <input
                      type="time"
                      value={quietTo}
                      onChange={(e) => setQuietTo(e.target.value)}
                      className="h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none focus:border-palier-400"
                    />
                  </div>
                </div>

                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                  <Icon name="Lightbulb" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <p className="text-[12px] text-amber-800">
                    {T.notif.quietExample(quietFrom, quietTo, quietFrom.replace(":00", ":30"))}
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
                  <h2 className="text-[14px] font-semibold text-ink">{T.relance.title}</h2>
                  <p className="text-[12px] text-ink-soft">{T.relance.desc}</p>
                </div>
              </div>

              <textarea
                value={relanceMsg}
                onChange={(e) => setRelanceMsg(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
              />

              <div className="mt-3 rounded-xl bg-sand/50 p-3.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.relance.previewTitle}</p>
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-coral-100">
                    <Icon name="ReceiptText" className="h-5 w-5 text-coral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-ink">{T.relance.paymentReminder}</p>
                    <p className="text-[12px] text-ink-soft">{relanceMsg || "—"}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-xl border border-palier-200 bg-palier-50/50 p-3.5">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-palier-700">{T.relance.defaultFormat}</p>
                <div className="space-y-1 text-[12px] text-ink-soft">
                  <p className="font-medium text-ink">{T.relance.defaultHello}</p>
                  <p>{T.relance.defaultLine1}</p>
                  <p>• {T.relance.defaultAmountDue}</p>
                  <p>• {T.relance.defaultAmountPaid}</p>
                  <p>• {T.relance.defaultAmountLeft}</p>
                  <p>• {T.relance.defaultDeadline}</p>
                  <p>{T.relance.defaultThanks}</p>
                </div>
              </div>

              <div className="mt-3 flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-3.5 py-2.5">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  {T.relance.infoNote}
                </p>
              </div>
            </Card>
          )}

          {/* ═══ APPARENCE ═══ */}
          {activeSection === "apparence" && (
            <Card>
              <h3 className="mb-1 text-[14px] font-semibold text-ink">{T.apparence.title}</h3>
              <p className="mb-4 text-[12px] text-ink-soft">{T.apparence.desc}</p>
              <ThemeToggle />
            </Card>
          )}

          {/* ═══ RETOURS & SUGGESTIONS ═══ */}
          {activeSection === "feedback" && (
            <>
              <div className="flex items-start gap-2 rounded-xl border border-black/[0.06] bg-cream-card px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-soft" />
                <p className="text-[12px] text-ink-soft">
                  {T.feedback.info}
                </p>
              </div>

              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                    <Icon name="MessageCircle" className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-semibold text-ink">{T.feedback.title}</h2>
                    <p className="text-[12px] text-ink-soft">{T.feedback.desc}</p>
                  </div>
                </div>

                {feedbackSent ? (
                  <div className="flex flex-col items-center py-6">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                      <Icon name="CircleCheck" className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-[14px] font-semibold text-ink">{T.feedback.thankYou}</p>
                    <p className="mt-1 text-[12px] text-ink-soft">{T.feedback.thankYouSub}</p>
                    <button
                      onClick={() => { setFeedbackSent(false); setFeedbackMsg(""); }}
                      className="mt-4 rounded-lg border border-black/[0.08] px-4 py-2 text-[13px] font-medium text-ink hover:bg-sand/50"
                    >
                      {T.feedback.sendAnother}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Type */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.feedback.typeLabel}</label>
                      <div className="flex gap-2">
                        {([
                          { key: "bug" as const, label: T.feedback.typeBug, icon: "Bug" },
                          { key: "suggestion" as const, label: T.feedback.typeSuggestion, icon: "Lightbulb" },
                          { key: "autre" as const, label: T.feedback.typeOther, icon: "MessageSquare" },
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
                        {feedbackType === "bug" ? T.feedback.descBug : feedbackType === "suggestion" ? T.feedback.descSuggestion : T.feedback.descOther}
                      </label>
                      <textarea
                        value={feedbackMsg}
                        onChange={(e) => setFeedbackMsg(e.target.value)}
                        placeholder={
                          feedbackType === "bug"
                            ? T.feedback.placeholderBug
                            : feedbackType === "suggestion"
                            ? T.feedback.placeholderSuggestion
                            : T.feedback.placeholderOther
                        }
                        rows={4}
                        className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2.5 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-palier-400 focus:ring-1 focus:ring-palier-400"
                      />
                    </div>

                    {/* Attachment */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{C.fileAttachment}</label>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-black/[0.12] px-3 py-2.5 text-[13px] text-ink-soft transition-colors hover:bg-sand/30">
                        <Icon name="Paperclip" className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{feedbackFile ? feedbackFile.name : C.selectFile}</span>
                        {feedbackFile && (
                          <button type="button" onClick={(e) => { e.preventDefault(); setFeedbackFile(null); }} className="shrink-0">
                            <Icon name="X" className="h-3.5 w-3.5 text-ink-faint" />
                          </button>
                        )}
                        <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => setFeedbackFile(e.target.files?.[0] ?? null)} />
                      </label>
                    </div>

                    {/* Contact preference */}
                    <div>
                      <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">{T.feedback.contactLabel}</label>
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
                          {T.feedback.phone}
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
                          {T.feedback.email}
                        </button>
                      </div>
                    </div>

                    {/* Transparency note */}
                    <div className="rounded-xl bg-sand/50 p-3">
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">{T.feedback.transparency}</p>
                      <div className="space-y-1 text-[12px] text-ink-soft">
                        <p><span className="font-medium text-ink">Nom :</span> {building.syndic || "—"}</p>
                        <p><span className="font-medium text-ink">Résidence :</span> {building.name}</p>
                        {feedbackContact === "phone" && <p><span className="font-medium text-ink">Téléphone :</span> <span dir="ltr">{phone || "—"}</span></p>}
                        {feedbackContact === "email" && <p><span className="font-medium text-ink">Email :</span> {email || "—"}</p>}
                      </div>
                      <p className="mt-2 text-[11px] text-ink-faint">{T.feedback.transparencyNote}</p>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={async () => {
                        if (!feedbackMsg.trim()) return;
                        setFeedbackSending(true);
                        try {
                          let attachmentUrl: string | null = null;
                          if (feedbackFile) {
                            const fd = new FormData();
                            fd.append("file", feedbackFile);
                            const res = await uploadFileAction(fd);
                            if (res.url) attachmentUrl = res.url;
                          }
                          await submitFeedback({
                            buildingId: building.id,
                            type: feedbackType,
                            message: feedbackMsg.trim(),
                            senderName: building.syndic || "Syndic",
                            senderPhone: feedbackContact === "phone" ? (phone || null) : null,
                            senderEmail: feedbackContact === "email" ? (email || null) : null,
                            contactPreference: feedbackContact,
                            buildingName: building.name,
                            attachmentUrl,
                          });
                          setFeedbackSent(true);
                          setFeedbackFile(null);
                        } catch { /* ignore */ } finally {
                          setFeedbackSending(false);
                        }
                      }}
                      disabled={!feedbackMsg.trim() || feedbackSending}
                      className="w-full rounded-lg bg-palier-600 py-2.5 text-[13px] font-medium text-white hover:bg-palier-700 disabled:opacity-40"
                    >
                      {feedbackSending ? T.feedback.sending : T.feedback.send}
                    </button>
                  </div>
                )}
              </Card>
            </>
          )}

          {/* ── Déconnexion (mobile) ── */}
          <div className="border-t border-black/[0.06] pt-4 lg:hidden">
            <button onClick={() => setShowLogout(true)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
              <Icon name="LogOut" className="h-4 w-4" />
              {T.logout}
            </button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
      {showLogout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30" onClick={() => setShowLogout(false)}>
          <div className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-2xl border border-black/[0.06] bg-cream-card p-5 shadow-card" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100">
                <Icon name="LogOut" className="h-4 w-4 text-red-600" />
              </div>
              <h2 className="text-[15px] font-semibold text-ink">{T.logout}</h2>
            </div>
            <p className="mb-4 text-[13px] text-ink-soft">
              {T.logoutConfirm}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowLogout(false)} className="flex-1 rounded-lg border border-black/[0.08] py-2 text-[13px] font-medium text-ink hover:bg-sand/50">
                {C.cancel}
              </button>
              <button onClick={async () => { localStorage.removeItem("palier_notif_prefs"); localStorage.removeItem("palier_notif_read"); await logout(); window.location.href = "/bienvenue"; }} className="flex flex-1 items-center justify-center rounded-lg bg-red-600 py-2 text-[13px] font-medium text-white hover:bg-red-700">
                {T.logout}
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
  const { i } = useLang();
  const C = i.syndic.common;
  const T = i.syndic.settings;
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
        {items.map((cat, idx) => (
          <span key={cat} className="inline-flex items-center gap-1 rounded-lg border border-black/[0.06] bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink">
            {cat}
            <button onClick={() => onRemove(idx)} className="ml-0.5 rounded p-0.5 text-ink-faint transition-colors hover:bg-red-50 hover:text-red-500">
              <Icon name="X" className="h-3 w-3" />
            </button>
          </span>
        ))}
        {items.length === 0 && (
          <p className="text-[12px] text-ink-soft">{T.categories.noCategory}</p>
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
          {C.add}
        </button>
      </div>
    </Card>
  );
}
