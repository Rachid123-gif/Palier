"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/ui/Icon";
import { listRegistrationRequests, approveSyndicRequest, rejectSyndicRequest } from "@/lib/auth";

interface Request {
  id: string;
  fullName: string;
  phone: string;
  buildingName: string;
  city: string;
  lotsCount: number;
  syndicUnit: string | null;
  status: string;
  betaCode: string | null;
  accessCode: string | null;
  createdAt: string;
}

export default function DemandesPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [approvedCodes, setApprovedCodes] = useState<{ betaCode: string; accessCode: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRegistrationRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleApprove(id: string) {
    setProcessingId(id);
    try {
      const result = await approveSyndicRequest(id);
      if ("ok" in result && result.ok) {
        setApprovedCodes({ betaCode: result.betaCode, accessCode: result.accessCode });
        setFlash("Demande approuvée — SMS envoyé");
        await load();
        setTimeout(() => setFlash(""), 4000);
      }
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    setProcessingId(id);
    try {
      await rejectSyndicRequest(id);
      setFlash("Demande rejetée");
      await load();
      setTimeout(() => setFlash(""), 3000);
    } finally {
      setProcessingId(null);
    }
  }

  const filtered = filter === "pending"
    ? requests.filter((r) => r.status === "pending")
    : requests;

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-MA", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const statusBadge = (status: string) => {
    if (status === "pending") return <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-500">En attente</span>;
    if (status === "approved") return <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400">Codes envoyés</span>;
    if (status === "completed") return <span className="rounded-full bg-[var(--a-tag)] px-2.5 py-1 text-[11px] font-medium text-[var(--a-text-3)]">Activée</span>;
    return <span className="rounded-full bg-[var(--a-tag)] px-2.5 py-1 text-[11px] font-medium text-[var(--a-text-5)]">Rejetée</span>;
  };

  return (
    <div className="mx-auto max-w-[900px] space-y-8">
      <div>
        <h1 className="text-[24px] font-bold text-[var(--a-text)]">Demandes d&apos;inscription</h1>
        <p className="mt-1 text-[13px] text-[var(--a-text-4)]">
          Syndics en attente d&apos;approbation
          {pendingCount > 0 && <span className="ml-2 rounded-full bg-amber-500/10 px-2 py-0.5 text-amber-500">{pendingCount}</span>}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter("pending")}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${filter === "pending" ? "bg-[var(--a-tag)] text-[var(--a-text)]" : "text-[var(--a-text-4)] hover:text-[var(--a-text-3)]"}`}
        >
          En attente ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${filter === "all" ? "bg-[var(--a-tag)] text-[var(--a-text)]" : "text-[var(--a-text-4)] hover:text-[var(--a-text-3)]"}`}
        >
          Toutes ({requests.length})
        </button>
      </div>

      {/* Flash */}
      {flash && (
        <div className="flex items-center gap-2 rounded-xl bg-[var(--a-tag)] px-4 py-3 text-[13px] font-medium text-[var(--a-text)]">
          <Icon name="Check" className="h-4 w-4 text-[var(--a-text-3)]" />
          {flash}
        </div>
      )}

      {/* Approved codes display */}
      {approvedCodes && (
        <div className="rounded-2xl border border-emerald-500/20 p-5 space-y-3" style={{ background: "var(--a-card)" }}>
          <p className="text-[13px] font-semibold text-[var(--a-text)]">Codes envoyés par SMS :</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--a-tag)] p-3">
              <p className="text-[11px] text-[var(--a-text-4)]">Code beta</p>
              <p className="mt-1 font-mono text-[14px] font-bold text-[var(--a-text)]">{approvedCodes.betaCode}</p>
            </div>
            <div className="rounded-xl bg-[var(--a-tag)] p-3">
              <p className="text-[11px] text-[var(--a-text-4)]">Code d&apos;accès</p>
              <p className="mt-1 font-mono text-[14px] font-bold text-[var(--a-text)]">{approvedCodes.accessCode}</p>
            </div>
          </div>
          <button
            onClick={() => setApprovedCodes(null)}
            className="text-[12px] text-[var(--a-text-4)] hover:text-[var(--a-text-3)]"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Requests list */}
      <div className="rounded-2xl border border-[var(--a-border)]" style={{ background: "var(--a-card)" }}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--a-border)] border-t-[var(--a-text-3)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[var(--a-text-5)]">
            {filter === "pending" ? "Aucune demande en attente" : "Aucune demande"}
          </div>
        ) : (
          <div className="divide-y divide-[var(--a-border-2)]">
            {filtered.map((req) => (
              <div key={req.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-[var(--a-text)]">{req.fullName}</p>
                      {statusBadge(req.status)}
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[12px]">
                      <div className="flex items-center gap-1.5 text-[var(--a-text-4)]">
                        <Icon name="Phone" className="h-3.5 w-3.5" />
                        <span dir="ltr">{req.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--a-text-4)]">
                        <Icon name="Building2" className="h-3.5 w-3.5" />
                        {req.buildingName}
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--a-text-4)]">
                        <Icon name="MapPin" className="h-3.5 w-3.5" />
                        {req.city}
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--a-text-4)]">
                        <Icon name="Home" className="h-3.5 w-3.5" />
                        {req.lotsCount} lots
                      </div>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[var(--a-text-5)]">{fmtDate(req.createdAt)}</p>
                    {req.betaCode && req.accessCode && (
                      <div className="mt-2 flex gap-3">
                        <span className="font-mono text-[11px] text-[var(--a-text-4)]">Beta: {req.betaCode}</span>
                        <span className="font-mono text-[11px] text-[var(--a-text-4)]">Accès: {req.accessCode}</span>
                      </div>
                    )}
                  </div>

                  {req.status === "pending" && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        onClick={() => handleApprove(req.id)}
                        disabled={!!processingId}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[12px] font-semibold text-white transition-opacity disabled:opacity-50"
                      >
                        {processingId === req.id ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                          <Icon name="Check" className="h-3.5 w-3.5" />
                        )}
                        Approuver
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        disabled={!!processingId}
                        className="flex items-center gap-1.5 rounded-lg bg-[var(--a-tag)] px-3 py-1.5 text-[12px] font-medium text-[var(--a-text-4)] transition-opacity hover:text-[var(--a-text-3)] disabled:opacity-50"
                      >
                        <Icon name="X" className="h-3.5 w-3.5" />
                        Rejeter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
