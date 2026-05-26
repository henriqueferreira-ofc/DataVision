import { supabase } from "@/integrations/supabase/client";

type ExportKind = "pdf" | "pptx";

async function callExport(kind: ExportKind, analysisId: string, language: string, deep: boolean): Promise<{ blob: Blob; filename: string }> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-${kind}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ analysisId, language, deep }),
  });

  if (!res.ok) {
    if (res.status === 403) throw new Error("PRO_REQUIRED");
    let msg = `Export failed (${res.status})`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new Error(msg);
  }

  const blob = await res.blob();
  const disp = res.headers.get("Content-Disposition") || "";
  const match = disp.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] || `DataVision.${kind}`;
  return { blob, filename };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadPdf(analysisId: string, language: string, deep = false) {
  const { blob, filename } = await callExport("pdf", analysisId, language, deep);
  triggerDownload(blob, filename);
}

export async function downloadPptx(analysisId: string, language: string, deep = false) {
  const { blob, filename } = await callExport("pptx", analysisId, language, deep);
  triggerDownload(blob, filename);
}

/** Server-gated fetch of the full analysis for Deep Analysis page. Throws "PRO_REQUIRED" if not pro. */
export async function fetchDeepAnalysis(analysisId: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke("get-deep-analysis", { body: { analysisId } });
  if (error) {
    const status = (error as any).context?.status ?? (error as any).status;
    if (status === 403) throw new Error("PRO_REQUIRED");
    throw new Error(error.message || "Failed to load deep analysis");
  }
  return data?.analysis;
}
