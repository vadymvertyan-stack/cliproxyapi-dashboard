import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth/session";

type BridgeDefinition = {
  id: "zcode" | "qoder";
  name: string;
  model: string;
  modelId: string;
  details: string;
  healthUrl: string;
};

const BRIDGES: BridgeDefinition[] = [
  {
    id: "zcode",
    name: "ZCode",
    model: "GLM-5.3-Flash",
    modelId: "zcode-glm-5.3-flash",
    details: "Start Plan · HOME-PC → VPS → CLIProxy",
    healthUrl: process.env.ZCODE_BRIDGE_HEALTH_URL || "http://172.21.0.1:8331/health",
  },
  {
    id: "qoder",
    name: "Qoder",
    model: "Qwen3.8-Flash (tested) · 17 models available",
    modelId: "qoder-qwen3.8-flash",
    details: "Qoder CLI · HOME-PC → VPS → CLIProxy",
    healthUrl: process.env.QODER_BRIDGE_HEALTH_URL || "http://172.21.0.1:8329/health",
  },
];

async function probeBridge(bridge: BridgeDefinition) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);
  try {
    const response = await fetch(bridge.healthUrl, {
      cache: "no-store",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    try { await response.body?.cancel(); } catch {}
    return {
      id: bridge.id,
      name: bridge.name,
      model: bridge.model,
      modelId: bridge.modelId,
      details: bridge.details,
      active: response.ok,
      status: response.ok ? "active" : "offline",
    };
  } catch {
    return {
      id: bridge.id,
      name: bridge.name,
      model: bridge.model,
      modelId: bridge.modelId,
      details: bridge.details,
      active: false,
      status: "offline",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET() {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const providers = await Promise.all(BRIDGES.map(probeBridge));
  return NextResponse.json(
    { providers, checkedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
