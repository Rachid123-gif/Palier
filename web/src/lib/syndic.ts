import { supabaseAdmin } from "./supabase-server";
import type { Resolution, Budget, BudgetLine, InsurancePolicy, SyndicMandate, UrgentWork, CoproprieteRule } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface RecouvrementRow {
  unitId: string;
  profileId: string | null;
  ref: string;
  floor: number | null;
  tantiemes: number;
  ownerName: string;
  avatarColor: string;
  role: string;
  phone: string;
  amount: number;
  paid: number;
  status: "due" | "partial" | "paid" | "late";
  lastDunnedAt: string | null;
  dueDate: string | null;
  /** ID de la charge pour enregistrement de paiement */
  chargeId: string | null;
  /** Jours depuis l'échéance (pour alerte prescription 5 ans) */
  daysSinceDue: number | null;
}

export interface ChargeCall {
  label: string;
  category: string;
  amount: number;
  dueDate: string;
  createdAt: string;
  lots: number;
  paid: number;
  total: number;
}

export interface AssemblyRow {
  id: string;
  date: string;
  time: string;
  place: string;
  type: "ordinaire" | "extraordinaire";
  status: "draft" | "convoquee" | "tenue" | "pv_distribue";
  agenda: { n: number; t: string; d: string }[];
  votes: { id?: string; q: string; options?: string[]; closesAt?: string; pour: number; contre: number; abst: number }[];
  resolutions: Resolution[];
  quorum: number;
  summary: string;
  pvUrl: string;
  convocationSentAt: string | null;
  pvSentAt: string | null;
  pvDistributed: boolean;
}

export interface BuildingSettings {
  incident_categories?: string[] | null;
  expense_categories?: string[] | null;
  charge_categories?: string[] | null;
  relance_message?: string | null;
}

export interface SyndicData {
  building: { id: string; name: string; address: string; city: string; lots: number; balance: number; syndic: string; annualBudget: number; accountingTier: string };
  kpis: {
    lots: number; residents: number; collected: number; expected: number; rate: number;
    outstanding: number; balance: number; openIncidents: number; lateCount: number; partialCount: number;
    totalTantiemes: number;
    prescriptionAlerts: number;
  };
  units: { id: string; ref: string; floor: number | null; tantiemes: number }[];
  recouvrement: RecouvrementRow[];
  chargeCalls: ChargeCall[];
  incidents: any[];
  posts: any[];
  residents: { id: string; name: string; avatarColor: string; phone: string; unit: string; unitId: string; role: string; status: string; deactivatedAt: string | null; tantiemes: number }[];
  ledger: any[];
  documents: { id: string; title: string; type: string; date: string; size: string; url: string }[];
  assemblies: AssemblyRow[];
  budgets: Budget[];
  insurancePolicies: InsurancePolicy[];
  mandate: SyndicMandate | null;
  urgentWorks: UrgentWork[];
  coproprieteRule: CoproprieteRule | null;
  settings: BuildingSettings | null;
}

export async function fetchSyndicData(buildingId: string): Promise<SyndicData> {
  const [bRes, uRes, mRes, pRes, chRes, dRes, incRes, ledRes, docRes, agRes, setRes, postRes,
    budgetRes, insRes, mandateRes, uwRes, ruleRes, resolutionRes] = await Promise.all([
    supabaseAdmin.from("buildings").select("*").eq("id", buildingId).single(),
    supabaseAdmin.from("units").select("*").eq("building_id", buildingId),
    supabaseAdmin.from("memberships").select("*").eq("building_id", buildingId),
    supabaseAdmin.from("memberships").select("profile_id").eq("building_id", buildingId).then(async (mRes) => {
      const pids = (mRes.data ?? []).map((m: any) => m.profile_id).filter(Boolean);
      if (!pids.length) return { data: [] };
      return supabaseAdmin.from("profiles").select("*").in("id", pids);
    }),
    supabaseAdmin.from("charges").select("*").eq("building_id", buildingId),
    supabaseAdmin.from("dunning_logs").select("unit_id, sent_at").eq("building_id", buildingId).order("sent_at", { ascending: false }),
    supabaseAdmin.from("incidents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("ledger_entries").select("*").eq("building_id", buildingId).order("entry_date", { ascending: false }),
    supabaseAdmin.from("documents").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("assemblies").select("*").eq("building_id", buildingId).order("date", { ascending: false }),
    supabaseAdmin.from("building_settings").select("*").eq("building_id", buildingId).single(),
    supabaseAdmin.from("posts").select("*").eq("building_id", buildingId).order("created_at", { ascending: false }),
    supabaseAdmin.from("budgets").select("*").eq("building_id", buildingId).order("fiscal_year", { ascending: false }),
    supabaseAdmin.from("insurance_policies").select("*").eq("building_id", buildingId).order("end_date", { ascending: false }),
    supabaseAdmin.from("syndic_mandates").select("*").eq("building_id", buildingId).order("elected_at", { ascending: false }).limit(1).single(),
    supabaseAdmin.from("urgent_works").select("*").eq("building_id", buildingId).order("declared_at", { ascending: false }),
    supabaseAdmin.from("copropriete_rules").select("*").eq("building_id", buildingId).single(),
    supabaseAdmin.from("assemblies").select("id").eq("building_id", buildingId).then(async (aRes) => {
      const aids = (aRes.data ?? []).map((a: any) => a.id);
      if (!aids.length) return { data: [] };
      return supabaseAdmin.from("assembly_resolutions").select("*").in("assembly_id", aids).order("number", { ascending: true });
    }),
  ]);

  const b = bRes.data;
  const units = uRes.data ?? [];
  const memberships = mRes.data ?? [];
  const profiles = pRes.data ?? [];
  const charges = chRes.data ?? [];
  const dunning = dRes.data ?? [];
  const allResolutions = resolutionRes.data ?? [];
  const profileById = new Map(profiles.map((p: any) => [p.id, p]));
  const lastDunnedByUnit = new Map<string, string>();
  for (const d of dunning) if (!lastDunnedByUnit.has(d.unit_id)) lastDunnedByUnit.set(d.unit_id, d.sent_at);

  const now = new Date();
  const PRESCRIPTION_DAYS = 5 * 365; // 5 ans

  const recouvrement: RecouvrementRow[] = units
    .map((u: any) => {
      const mem = memberships.find((m: any) => m.unit_id === u.id && m.is_primary) ?? memberships.find((m: any) => m.unit_id === u.id);
      const prof: any = mem ? profileById.get(mem.profile_id) : null;
      const ch = charges.find((c: any) => c.unit_id === u.id);
      const dueDate = ch?.due_date ?? null;
      const daysSinceDue = dueDate ? Math.floor((now.getTime() - new Date(dueDate).getTime()) / 86400000) : null;
      return {
        unitId: u.id, profileId: mem?.profile_id ?? null, ref: u.ref, floor: u.floor,
        tantiemes: u.tantiemes ?? 0,
        ownerName: prof?.full_name ?? "—",
        avatarColor: prof?.avatar_color ?? "#8a9893",
        role: mem?.role ?? "owner",
        phone: prof?.phone ?? "",
        chargeId: ch?.id ?? null,
        amount: ch ? Number(ch.amount) : 0,
        paid: ch ? Number(ch.paid) : 0,
        status: (ch?.status ?? "due") as RecouvrementRow["status"],
        lastDunnedAt: lastDunnedByUnit.get(u.id) ?? null,
        dueDate,
        daysSinceDue,
      };
    })
    .sort((a, b) => {
      const order = { late: 0, partial: 1, due: 2, paid: 3 };
      return order[a.status] - order[b.status] || a.ref.localeCompare(b.ref);
    });

  const prescriptionAlerts = recouvrement.filter((r) => r.daysSinceDue !== null && r.daysSinceDue > PRESCRIPTION_DAYS - 180 && r.status !== "paid").length;

  const expected = charges.reduce((s: number, c: any) => s + Number(c.amount), 0);
  const collected = charges.reduce((s: number, c: any) => s + Number(c.paid), 0);
  const incidents = incRes.data ?? [];
  const totalTantiemes = units.reduce((s: number, u: any) => s + (u.tantiemes ?? 0), 0);

  // Group charges by label+dueDate to build charge calls history
  const callsMap = new Map<string, ChargeCall>();
  for (const c of charges) {
    const key = `${c.label}||${c.due_date}`;
    const existing = callsMap.get(key);
    if (existing) {
      existing.lots += 1;
      existing.paid += c.status === "paid" ? 1 : 0;
      existing.total += Number(c.amount);
    } else {
      callsMap.set(key, {
        label: c.label ?? "Appel de fonds",
        category: c.category ?? "courantes",
        amount: Number(c.amount),
        dueDate: c.due_date ?? "",
        createdAt: c.created_at ?? "",
        lots: 1,
        paid: c.status === "paid" ? 1 : 0,
        total: Number(c.amount),
      });
    }
  }
  const chargeCalls = [...callsMap.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const residents = memberships
    .map((m: any) => {
      const p: any = profileById.get(m.profile_id);
      const u: any = units.find((x: any) => x.id === m.unit_id);
      return p ? { id: p.id, name: p.full_name, avatarColor: p.avatar_color, phone: p.phone, unit: u?.ref ?? "—", unitId: u?.id ?? "", role: m.role, status: m.status ?? "active", deactivatedAt: m.deactivated_at ?? null, tantiemes: u?.tantiemes ?? 0 } : null;
    })
    .filter(Boolean) as SyndicData["residents"];

  // Map budgets with lines (single query instead of N+1)
  const budgetsRaw = budgetRes.data ?? [];
  const budgetIds = budgetsRaw.map((b: any) => b.id);
  const { data: allBudgetLines } = budgetIds.length > 0
    ? await supabaseAdmin.from("budget_lines").select("*").in("budget_id", budgetIds).order("created_at", { ascending: true })
    : { data: [] };
  const linesByBudget = new Map<string, BudgetLine[]>();
  for (const l of (allBudgetLines ?? []) as any[]) {
    const list = linesByBudget.get(l.budget_id) ?? [];
    list.push({
      id: l.id, accountCode: l.account_code ?? undefined, label: l.label,
      category: l.category, amountBudgeted: Number(l.amount_budgeted),
      amountActual: Number(l.amount_actual), notes: l.notes ?? undefined,
    });
    linesByBudget.set(l.budget_id, list);
  }
  const budgets: Budget[] = budgetsRaw.map((bg: any) => ({
    id: bg.id, buildingId: bg.building_id, fiscalYear: bg.fiscal_year,
    status: bg.status, totalAmount: Number(bg.total_amount),
    reserveFundAmount: Number(bg.reserve_fund_amount),
    approvedAt: bg.approved_at ?? undefined,
    lines: linesByBudget.get(bg.id) ?? [],
  }));

  // Map resolutions by assembly
  const resolutionsByAssembly = new Map<string, Resolution[]>();
  for (const r of allResolutions) {
    const list = resolutionsByAssembly.get(r.assembly_id) ?? [];
    list.push({
      id: r.id, assemblyId: r.assembly_id, number: r.number,
      title: r.title, description: r.description ?? undefined,
      majorityType: r.majority_type, result: r.result ?? undefined,
      pourTantiemes: r.pour_tantiemes ?? 0, contreTantiemes: r.contre_tantiemes ?? 0,
      abstentionTantiemes: r.abstention_tantiemes ?? 0,
      pourCount: r.pour_count ?? 0, contreCount: r.contre_count ?? 0,
      abstentionCount: r.abstention_count ?? 0,
    });
    resolutionsByAssembly.set(r.assembly_id, list);
  }

  return {
    building: {
      id: b?.id, name: b?.name ?? "", address: b?.address ?? "", city: b?.city ?? "",
      lots: units.length, balance: Number(b?.balance ?? 0), syndic: b?.syndic_name ?? "",
      annualBudget: Number(b?.annual_budget ?? 0),
      accountingTier: b?.accounting_tier ?? "tier1",
    },
    kpis: {
      lots: units.length,
      residents: residents.length,
      collected, expected,
      rate: expected ? Math.round((collected / expected) * 100) : 0,
      outstanding: expected - collected,
      balance: Number(b?.balance ?? 0),
      openIncidents: incidents.filter((i: any) => i.status !== "resolved").length,
      lateCount: charges.filter((c: any) => c.status === "late").length,
      partialCount: charges.filter((c: any) => c.status === "partial").length,
      totalTantiemes,
      prescriptionAlerts,
    },
    units: units.map((u: any) => ({ id: u.id, ref: u.ref, floor: u.floor, tantiemes: u.tantiemes ?? 0 })),
    recouvrement,
    chargeCalls,
    incidents,
    posts: postRes.data ?? [],
    residents,
    ledger: ledRes.data ?? [],
    documents: (docRes.data ?? []).map((d: any) => ({
      id: d.id, title: d.title, type: d.doc_type ?? d.type ?? "", date: d.doc_date ?? d.created_at,
      size: d.size ?? "", url: d.url ?? "",
    })),
    assemblies: (agRes.data ?? []).map((ag: any) => ({
      id: ag.id,
      date: ag.date,
      time: ag.time ?? "18:00",
      place: ag.place ?? "",
      type: ag.type ?? "ordinaire",
      status: ag.status ?? "draft",
      agenda: ag.agenda ?? [],
      votes: ag.votes ?? [],
      resolutions: resolutionsByAssembly.get(ag.id) ?? [],
      quorum: ag.quorum ?? 0,
      summary: ag.summary ?? "",
      pvUrl: ag.pv_url ?? "",
      convocationSentAt: ag.convocation_sent_at ?? null,
      pvSentAt: ag.pv_sent_at ?? null,
      pvDistributed: ag.pv_distributed ?? false,
    })),
    budgets,
    insurancePolicies: (insRes.data ?? []).map((p: any) => ({
      id: p.id, policyNumber: p.policy_number ?? undefined, insurer: p.insurer,
      coverageType: p.coverage_type ?? "multirisque", premiumAmount: Number(p.premium_amount ?? 0),
      startDate: p.start_date, endDate: p.end_date, renewalAlertDays: p.renewal_alert_days ?? 30,
      fileUrl: p.file_url ?? undefined, notes: p.notes ?? undefined,
    })),
    mandate: mandateRes.data ? {
      id: mandateRes.data.id, syndicName: mandateRes.data.syndic_name,
      syndicType: mandateRes.data.syndic_type ?? "benevole",
      deputyName: mandateRes.data.deputy_name ?? undefined,
      electedAt: mandateRes.data.elected_at, mandateEnd: mandateRes.data.mandate_end,
      remuneration: mandateRes.data.remuneration ? Number(mandateRes.data.remuneration) : undefined,
      contractUrl: mandateRes.data.contract_url ?? undefined,
    } : null,
    urgentWorks: (uwRes.data ?? []).map((w: any) => ({
      id: w.id, incidentId: w.incident_id ?? undefined, title: w.title,
      description: w.description ?? undefined,
      estimatedCost: w.estimated_cost ? Number(w.estimated_cost) : undefined,
      actualCost: w.actual_cost ? Number(w.actual_cost) : undefined,
      status: w.status, declaredAt: w.declared_at, completedAt: w.completed_at ?? undefined,
      justification: w.justification, supplier: w.supplier ?? undefined,
      invoiceUrl: w.invoice_url ?? undefined,
    })),
    coproprieteRule: ruleRes.data ? {
      id: ruleRes.data.id, title: ruleRes.data.title,
      fileUrl: ruleRes.data.file_url ?? undefined,
      annexes: ruleRes.data.annexes ?? [],
      adoptedAt: ruleRes.data.adopted_at ?? undefined,
      notes: ruleRes.data.notes ?? undefined,
    } : null,
    settings: setRes.data ? {
      incident_categories: setRes.data.incident_categories ?? null,
      expense_categories: setRes.data.expense_categories ?? null,
      charge_categories: setRes.data.charge_categories ?? null,
      relance_message: setRes.data.relance_message ?? null,
    } : null,
  };
}
