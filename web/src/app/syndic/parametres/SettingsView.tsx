"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Card } from "@/components/syndic/ui";
import { Icon } from "@/components/ui/Icon";
import { saveBuildingSettings } from "@/lib/actions";
import { categories } from "@/lib/data";

interface BuildingSettings {
  enabled_categories: string[] | null;
  features: Record<string, boolean> | null;
  syndic_phone: string | null;
  syndic_email: string | null;
  welcome_message: string | null;
}

const featureLabels: Record<string, { label: string; desc: string }> = {
  voisinage: { label: "Voisinage", desc: "Annonces et échanges entre résidents" },
  services: { label: "Services à domicile", desc: "Annuaire de prestataires" },
  signaler: { label: "Signalement", desc: "Signaler des incidents" },
  ag: { label: "Assemblées générales", desc: "Convocation et votes" },
  documents: { label: "Documents", desc: "Coffre-fort partagé" },
  transparence: { label: "Transparence", desc: "Journal de caisse visible" },
};

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

  const allCats = categories.map((c) => c.slug);
  const [enabledCats, setEnabledCats] = useState<string[]>(settings?.enabled_categories ?? allCats);
  const [features, setFeatures] = useState<Record<string, boolean>>(
    settings?.features ?? { voisinage: true, services: true, signaler: true, ag: true, documents: true, transparence: true }
  );
  const [phone, setPhone] = useState(settings?.syndic_phone ?? "");
  const [email, setEmail] = useState(settings?.syndic_email ?? "");
  const [welcome, setWelcome] = useState(settings?.welcome_message ?? "");

  function toggleCat(slug: string) {
    setEnabledCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  function toggleFeature(key: string) {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    startTransition(async () => {
      await saveBuildingSettings(building.id, {
        enabled_categories: enabledCats, features,
        syndic_phone: phone || undefined, syndic_email: email || undefined, welcome_message: welcome || undefined,
      });
      setToast("Configuration sauvegardée");
      setTimeout(() => setToast(""), 3000);
      router.refresh();
    });
  }

  const inputCls = "h-9 w-full rounded-lg border border-black/[0.08] bg-white px-3 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20";

  return (
    <div>
      <PageHeader
        title="Paramètres"
        subtitle="Configuration de la résidence"
        action={
          <button onClick={handleSave} disabled={isPending}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-palier-600 px-3.5 py-2 text-[13px] font-medium text-white hover:bg-palier-700 ${isPending ? "opacity-50" : ""}`}>
            {isPending ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Infos */}
        <Card>
          <h2 className="mb-4 text-[14px] font-semibold text-ink">Informations</h2>
          <div className="space-y-3">
            <div className="rounded-lg bg-sand/50 p-3">
              <p className="text-[13px] font-medium text-ink">{building.name}</p>
              <p className="text-[12px] text-ink-soft">{building.address} · {building.city} · {building.lots} lots</p>
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Téléphone du syndic</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 XX XX XX XX" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="syndic@residence.ma" className={inputCls} />
            </div>
            <div>
              <label className="mb-1.5 block text-[12px] font-semibold text-ink-soft">Message d&apos;accueil</label>
              <textarea value={welcome} onChange={(e) => setWelcome(e.target.value)} placeholder="Bienvenue…" rows={2}
                className="w-full rounded-lg border border-black/[0.08] bg-white px-3 py-2 text-[13px] text-ink outline-none placeholder:text-ink-soft focus:border-palier-600/30 focus:ring-1 focus:ring-palier-600/20" />
            </div>
          </div>
        </Card>

        {/* Fonctionnalités */}
        <Card>
          <h2 className="mb-4 text-[14px] font-semibold text-ink">Modules</h2>
          <p className="mb-3 text-[12px] text-ink-soft">Modules visibles par les résidents.</p>
          <div className="space-y-1.5">
            {Object.entries(featureLabels).map(([key, f]) => (
              <button
                key={key}
                onClick={() => toggleFeature(key)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sand/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-ink">{f.label}</p>
                  <p className="text-[11px] text-ink-soft">{f.desc}</p>
                </div>
                <div className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${features[key] ? "bg-emerald-500" : "bg-sand"}`}>
                  <div className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${features[key] ? "translate-x-4" : "translate-x-0"}`} />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Catégories */}
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-[14px] font-semibold text-ink">Catégories de services</h2>
          <p className="mb-3 text-[12px] text-ink-soft">Sélectionnez les services affichés aux résidents.</p>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = enabledCats.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  onClick={() => toggleCat(c.slug)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
                    on ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-black/[0.06] bg-white text-ink-soft"
                  }`}
                >
                  {c.label}
                  {on && <Icon name="Check" className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
          <div className="mt-2 flex gap-3 text-[12px]">
            <button onClick={() => setEnabledCats(allCats)} className="font-medium text-palier-600">Tout sélectionner</button>
            <button onClick={() => setEnabledCats([])} className="font-medium text-ink-soft">Tout désélectionner</button>
          </div>
        </Card>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-[rise_0.25s_ease] rounded-lg bg-palier-600 px-4 py-2.5 text-[13px] font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
