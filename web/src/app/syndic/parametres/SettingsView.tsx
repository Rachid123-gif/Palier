"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { saveBuildingSettings, generateAccessCode } from "@/lib/actions";

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
}

/* ── Section navigation ── */
const sections = [
  { key: "general", label: "Général", icon: "Building2" },
  { key: "categories", label: "Catégories", icon: "Tags" },
  { key: "codes", label: "Codes d'accès", icon: "KeyRound" },
  { key: "relance", label: "Relances", icon: "Bell" },
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

  // ── Relance ──
  const [relanceMsg, setRelanceMsg] = useState(
    settings?.relance_message ??
    "Bonjour, nous vous rappelons que votre cotisation est en attente de paiement. Merci de régulariser votre situation via l'application Palier."
  );

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
              <a href="/" className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
                <Icon name="LogOut" className="h-4 w-4" strokeWidth={1.8} />
                Se déconnecter
              </a>
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

          {/* ═══ CATÉGORIES ═══ */}
          {activeSection === "categories" && (
            <>
              <div className="flex items-start gap-2 rounded-xl bg-palier-50 px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palier-600" />
                <p className="text-[12px] text-palier-700">
                  Personnalisez les catégories utilisées dans les filtres et formulaires de votre résidence. Chaque résidence peut avoir ses propres catégories.
                </p>
              </div>

              {/* Incident categories */}
              <CategoryBlock
                title="Catégories d'incidents"
                desc="Utilisées lors du signalement d'un incident par les résidents."
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
              <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                <div className="text-[12px] text-amber-800">
                  <p className="font-semibold">Comment ça fonctionne ?</p>
                  <p className="mt-1">Lorsque vous ajoutez un résident depuis « Résidents & lots », un code d&apos;accès unique est automatiquement généré et envoyé par WhatsApp.</p>
                  <p className="mt-1">Si le résident n&apos;a pas reçu son code, utilisez ce formulaire pour en régénérer un et le renvoyer par WhatsApp.</p>
                </div>
              </div>

              {/* Generate & send */}
              <Card>
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                    <Icon name="KeyRound" className="h-4 w-4 text-amber-600" />
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

              <div className="mt-3 flex items-start gap-2 rounded-xl bg-palier-50 px-3.5 py-2.5">
                <Icon name="Info" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-palier-600" />
                <p className="text-[12px] text-palier-700">
                  Ce message est envoyé comme notification dans l&apos;application du résident lorsque vous cliquez sur « Relancer » depuis la page Recouvrement.
                </p>
              </div>
            </Card>
          )}

          {/* ── Déconnexion (mobile) ── */}
          <div className="border-t border-black/[0.06] pt-4 md:hidden">
            <a href="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-ink-soft transition-colors hover:bg-red-50 hover:text-red-600">
              <Icon name="LogOut" className="h-4 w-4" />
              Se déconnecter
            </a>
          </div>
        </div>
      </div>

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
  title, desc, icon, iconTint, iconColor, items, newValue, setNewValue, placeholder, onAdd, onRemove,
}: {
  title: string; desc: string; icon: string; iconTint: string; iconColor: string;
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
