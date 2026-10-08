"use client";

import { useCallback, useEffect, useState } from "react";

interface BridgeProvider {
  id: "zcode" | "qoder";
  name: string;
  model: string;
  modelId: string;
  details: string;
  active: boolean;
  status: string;
}

interface BridgeStatusResponse {
  providers?: BridgeProvider[];
  checkedAt?: string;
}

function StatusBadge({ active, loading }: { active: boolean; loading: boolean }) {
  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
        <span className="size-1.5 animate-pulse rounded-full bg-[#999]" />
        Checking
      </span>
    );
  }
  if (active) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
        <span className="size-1.5 rounded-full bg-emerald-400" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600">
      <span className="size-1.5 rounded-full bg-red-400" />
      Offline
    </span>
  );
}

export function BridgeProviderCards() {
  const [providers, setProviders] = useState<BridgeProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/providers/bridge-status", { cache: "no-store" });
      if (!response.ok) throw new Error("bridge status unavailable");
      const data = (await response.json()) as BridgeStatusResponse;
      setProviders(Array.isArray(data.providers) ? data.providers : []);
      setCheckedAt(data.checkedAt || null);
    } catch {
      setProviders((current) => current.map((provider) => ({ ...provider, active: false, status: "offline" })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
    const intervalId = window.setInterval(() => { void loadStatus(); }, 15000);
    return () => window.clearInterval(intervalId);
  }, [loadStatus]);

  const displayProviders: BridgeProvider[] = providers.length ? providers : [
    { id: "zcode", name: "ZCode", model: "GLM-5.3-Flash", modelId: "zcode-glm-5.3-flash", details: "Start Plan · HOME-PC → VPS → CLIProxy", active: false, status: "offline" },
    { id: "qoder", name: "Qoder", model: "Qwen3.8-Flash (tested) · 17 models available", modelId: "qoder-qwen3.8-flash", details: "Qoder CLI · HOME-PC → VPS → CLIProxy", active: false, status: "offline" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Local bridge providers</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Bridge health only; subscription quota may be exhausted separately.</p>
        </div>
        {checkedAt && <span className="shrink-0 text-[10px] text-[var(--text-muted)]">checked {new Date(checkedAt).toLocaleTimeString()}</span>}
      </div>
      <div className="divide-y divide-[var(--surface-border)] rounded-md border border-[var(--surface-border)] bg-[var(--surface-base)]">
        {displayProviders.map((provider) => (
          <div key={provider.id} className="p-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{provider.name}</span>
                  <StatusBadge active={provider.active} loading={loading && providers.length === 0} />
                </div>
                <p className="text-xs text-[var(--text-secondary)]">Model: <span className="font-medium text-[var(--text-primary)]">{provider.model}</span></p>
                <p className="truncate text-xs font-mono text-[var(--text-muted)]">{provider.modelId}</p>
                <p className="text-xs text-[var(--text-muted)]">Bridge: {provider.active ? "online" : "offline"} · {provider.details}</p>
              </div>
              <button type="button" onClick={() => { setLoading(true); void loadStatus(); }} className="shrink-0 rounded-md border border-[var(--surface-border)] bg-[var(--surface-muted)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]">
                Refresh
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 pt-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">Cloud evaluation providers</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Decision models use a separate API, not chat completions.</p>
        </div>
        <div className="rounded-md border border-[var(--surface-border)] bg-[var(--surface-base)] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Vercel Jev</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              <span className="size-1.5 rounded-full bg-amber-500" />
              API test pending
            </span>
          </div>
          <div className="mt-1.5 space-y-1">
            <p className="text-xs text-[var(--text-secondary)]">Model: <span className="font-medium text-[var(--text-primary)]">TypeSafe AI · Jev</span></p>
            <p className="text-xs font-mono text-[var(--text-muted)]">typesafe-ai/jev</p>
            <p className="text-xs text-[var(--text-muted)]">Gateway: Vercel AI Gateway · API key saved on VPS</p>
            <p className="text-xs font-mono text-[var(--text-muted)]">POST /v1/evaluate</p>
            <p className="text-xs text-amber-600">Not yet routed through CLIProxy; a successful API test and adapter are required.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
