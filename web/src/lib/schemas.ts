/**
 * Zod validation schemas for all server actions.
 * Prevents injection, malformed data, and type mismatches.
 */
import { z } from "zod";

/* ─── Shared primitives ─── */
const uuid = z.string().uuid();
const safeString = z.string().min(1).max(2000).trim();
const shortString = z.string().min(1).max(200).trim();
const phone = z.string().regex(/^(\+?\d{9,15}|0\d{9})$/, "Numéro invalide").or(z.literal(""));
const amount = z.number().min(0).max(100_000_000);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/* ─── Incidents ─── */
export const createIncidentSchema = z.object({
  buildingId: uuid,
  unitId: uuid,
  category: shortString,
  title: shortString,
  details: safeString,
  urgency: z.enum(["low", "normal", "urgent"]),
  reporter: shortString,
  imageUrl: z.string().url().optional(),
});

/* ─── Posts (Voisinage) ─── */
export const createPostSchema = z.object({
  buildingId: uuid,
  author: shortString,
  avatarColor: z.string().max(20),
  body: safeString,
  type: z.enum(["announcement", "event", "help", "found", "general", "service", "recommendation"]).optional(),
  title: shortString.optional(),
  category: shortString.optional(),
  providerName: shortString.optional(),
  providerPhone: phone.optional(),
  imageUrl: z.string().url().optional(),
});

/* ─── Bookings ─── */
export const createBookingSchema = z.object({
  providerId: uuid,
  profileId: uuid,
  buildingId: uuid,
  categorySlug: shortString,
  whenType: z.enum(["now", "today", "scheduled"]),
  priceEstimate: amount,
});

/* ─── Service Requests ─── */
export const createServiceRequestSchema = z.object({
  profileId: uuid,
  categorySlug: shortString,
  citySlug: shortString,
  details: safeString.optional(),
});

/* ─── Ledger ─── */
export const createLedgerEntrySchema = z.object({
  buildingId: uuid,
  type: z.enum(["in", "out"]),
  label: shortString,
  amount: amount.positive(),
  category: shortString,
  date: isoDate,
});

export const updateLedgerEntrySchema = z.object({
  type: z.enum(["in", "out"]),
  label: shortString,
  amount: amount.positive(),
  category: shortString,
  date: isoDate,
});

/* ─── Dunning ─── */
export const sendRelanceSchema = z.object({
  buildingId: uuid,
  unitId: uuid,
  profileId: uuid,
  title: shortString,
  body: safeString,
});

/* ─── Comments ─── */
export const createCommentSchema = z.object({
  postId: uuid,
  author: shortString,
  avatarColor: z.string().max(20),
  body: safeString,
});

export const createIncidentCommentSchema = z.object({
  incidentId: uuid,
  author: shortString,
  avatarColor: z.string().max(20),
  body: safeString,
  role: z.enum(["resident", "syndic"]),
});

/* ─── Residents ─── */
export const addResidentSchema = z.object({
  buildingId: uuid,
  name: shortString,
  phone: phone,
  unit: shortString,
  role: z.enum(["owner", "tenant"]),
});

export const updateResidentSchema = z.object({
  profileId: uuid,
  name: shortString,
  phone: phone,
  role: z.enum(["owner", "tenant"]),
  buildingId: uuid,
});

/* ─── Charges ─── */
export const emitChargesSchema = z.object({
  buildingId: uuid,
  label: shortString,
  detail: safeString,
  amount: amount.positive(),
  category: shortString,
  dueDate: isoDate,
  distribution: z.enum(["flat", "tantiemes"]).optional(),
});

/* ─── Assemblies ─── */
export const createAssemblySchema = z.object({
  buildingId: uuid,
  date: isoDate,
  time: z.string().max(10),
  place: shortString,
  agenda: z.array(z.object({
    n: z.number().int().positive(),
    t: shortString,
    d: safeString,
  })).min(1),
});

export const updateAssemblySchema = z.object({
  assemblyId: uuid,
  quorum: z.number().min(0).max(10000),
  votes: z.array(z.object({
    q: safeString,
    pour: z.number().min(0),
    contre: z.number().min(0),
    abst: z.number().min(0),
  })),
  summary: safeString.optional(),
  pvUrl: z.string().url().optional(),
});

/* ─── Resolutions ─── */
export const createResolutionSchema = z.object({
  assemblyId: uuid,
  number: z.number().int().positive(),
  title: shortString,
  description: safeString.optional(),
  majorityType: z.enum(["simple", "trois_quarts", "unanimite"]),
});

export const updateResolutionResultSchema = z.object({
  result: z.enum(["adoptee", "rejetee", "reportee"]),
  pourTantiemes: z.number().min(0),
  contreTantiemes: z.number().min(0),
  abstentionTantiemes: z.number().min(0),
  pourCount: z.number().int().min(0),
  contreCount: z.number().int().min(0),
  abstentionCount: z.number().int().min(0),
});

/* ─── Budget ─── */
export const createBudgetSchema = z.object({
  buildingId: uuid,
  fiscalYear: z.number().int().min(2020).max(2100),
  lines: z.array(z.object({
    label: shortString,
    category: shortString,
    amountBudgeted: amount,
    accountCode: z.string().max(10).optional(),
  })).min(1),
  reserveFundAmount: amount.optional(),
});

export const addBudgetLineSchema = z.object({
  label: shortString,
  category: shortString,
  amountBudgeted: amount,
  accountCode: z.string().max(10).optional(),
});

/* ─── Insurance ─── */
export const createInsurancePolicySchema = z.object({
  buildingId: uuid,
  insurer: shortString,
  policyNumber: shortString.optional(),
  coverageType: shortString.optional(),
  premiumAmount: amount,
  startDate: isoDate,
  endDate: isoDate,
  renewalAlertDays: z.number().int().min(1).max(365).optional(),
  fileUrl: z.string().url().optional(),
  notes: safeString.optional(),
});

/* ─── Mandate ─── */
export const createMandateSchema = z.object({
  buildingId: uuid,
  syndicName: shortString,
  syndicType: z.enum(["benevole", "professionnel"]),
  deputyName: shortString.optional(),
  electedAt: isoDate,
  mandateEnd: isoDate,
  remuneration: amount.optional(),
  contractUrl: z.string().url().optional(),
  assemblyId: uuid.optional(),
});

/* ─── Urgent Works ─── */
export const createUrgentWorkSchema = z.object({
  buildingId: uuid,
  title: shortString,
  description: safeString.optional(),
  estimatedCost: amount.optional(),
  justification: safeString,
  supplier: shortString.optional(),
  incidentId: uuid.optional(),
});

/* ─── Copropriete Rule ─── */
export const upsertCoproprieteRuleSchema = z.object({
  buildingId: uuid,
  title: shortString.optional(),
  fileUrl: z.string().url().optional(),
  annexes: z.array(z.object({
    title: shortString,
    url: z.string().url(),
    type: shortString,
  })).optional(),
  adoptedAt: isoDate.optional(),
  notes: safeString.optional(),
});

/* ─── Settings ─── */
export const saveBuildingSettingsSchema = z.object({
  incident_categories: z.array(shortString).optional(),
  expense_categories: z.array(shortString).optional(),
  charge_categories: z.array(shortString).optional(),
  relance_message: safeString.optional(),
  gardien_name: shortString.optional(),
  gardien_phone: phone.optional(),
  gardien_hours: shortString.optional(),
}).strict();

/* ─── Update Insurance ─── */
export const updateInsurancePolicySchema = z.object({
  insurer: shortString.optional(),
  policyNumber: shortString.optional(),
  coverageType: shortString.optional(),
  premiumAmount: amount.optional(),
  startDate: isoDate.optional(),
  endDate: isoDate.optional(),
  renewalAlertDays: z.number().int().min(1).max(365).optional(),
  fileUrl: z.string().url().optional(),
  notes: safeString.optional(),
}).strict();

/* ─── Update Mandate ─── */
export const updateMandateSchema = z.object({
  syndicName: shortString.optional(),
  syndicType: z.enum(["benevole", "professionnel"]).optional(),
  deputyName: shortString.optional(),
  electedAt: isoDate.optional(),
  mandateEnd: isoDate.optional(),
  remuneration: amount.optional(),
  contractUrl: z.string().url().optional(),
  assemblyId: uuid.optional(),
}).strict();

/* ─── Update Budget Line ─── */
export const updateBudgetLineSchema = z.object({
  label: shortString.optional(),
  category: shortString.optional(),
  amountBudgeted: amount.optional(),
  amountActual: amount.optional(),
  accountCode: z.string().max(10).optional(),
}).strict();

/* ─── Votes ─── */
export const castVoteSchema = z.object({
  assemblyId: uuid,
  voteId: z.string().min(1),
  profileId: uuid,
  choice: shortString,
});

/* ─── Tantiemes ─── */
export const updateTantiemesSchema = z.object({
  updates: z.array(z.object({
    unitId: uuid,
    tantiemes: z.number().int().min(0).max(10000),
  })).min(1),
});
