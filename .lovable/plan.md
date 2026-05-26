## Goal
Stop trusting the browser to enforce PRO restrictions. Every PRO action must verify the user's Stripe subscription on the server before returning the resource.

## Scope
Three things are currently gated only in JS and must move server-side:
1. PDF export (standard + Deep Analysis)
2. PPTX export (standard + Deep Analysis)
3. Deep Analysis page data
Plus: server-side enforcement of the "max 2 charts for free plan" rule.

## New Edge Functions

| Function | Purpose |
|---|---|
| `verify-pro` (internal helper, imported) | Verifies JWT, calls Stripe, returns `{ plan: "pro" \| "free" }`. Reused by all gated functions. |
| `export-analysis-pdf` | Verify Pro + ownership → fetch analysis → generate PDF → return binary. |
| `export-analysis-pptx` | Same as above, returns PPTX. |
| `export-deep-pdf` | Verify Pro + ownership → fetch analysis → generate Deep PDF. |
| `export-deep-pptx` | Same, PPTX. |
| `get-deep-analysis` | Verify Pro + ownership → return enriched deep-analysis JSON. Free users get 403. |

All functions:
- Validate JWT via `getClaims()`
- Verify Pro via Stripe (`subscriptions.list({ status: "active" })` on the user's email)
- Verify `analyses.user_id === auth.uid()` before reading/serving
- Log errors server-side; return generic client messages
- Validate `Origin` against allowlist where redirects apply
- CORS headers on every response

Library choice for binary generation in Deno:
- PDF: `npm:jspdf@^2.5` (works in Deno via npm specifier, runs headless).
- PPTX: `npm:pptxgenjs@^3.12` (works in Deno; uses JSZip under the hood).
The existing client export code is mostly pure JS that builds the document — it will be ported almost verbatim into the Edge Function with `doc.output("arraybuffer")` (PDF) and `pres.write({ outputType: "arraybuffer" })` (PPTX).

## Frontend Changes

- New helper `src/lib/serverExports.ts` with `downloadPdf(analysisId)`, `downloadPptx(analysisId)`, `downloadDeepPdf(analysisId)`, `downloadDeepPptx(analysisId)`. Each calls the corresponding edge function with the user's JWT, receives a `Blob`, and triggers a browser download.
- `AnalysisDetailPage.tsx`: replace local `exportAnalysisPdf` / `exportAnalysisPptx` calls with the new helpers. Buttons stay visible to all users; on 403 the toast says "Recurso exclusivo Pro".
- `DeepAnalysisPage.tsx`:
  - On mount call `get-deep-analysis`; if 403, render the upgrade prompt and skip further fetches.
  - Replace local export calls with `downloadDeepPdf` / `downloadDeepPptx`.
- Chart limit: `analyze-data` Edge Function trims `charts_data` to 2 items when the user is not Pro before saving. Client no longer needs to slice.
- Delete `src/lib/exportPdf.ts`, `exportPptx.ts`, `exportDeepAnalysisPdf.ts`, `exportDeepAnalysisPptx.ts` after the new flow works (kept temporarily as reference for the port).

## Security guarantees after change
- A free user cannot get a PDF/PPTX even with DevTools — the Edge Function returns 403.
- A free user cannot read Deep Analysis JSON — `get-deep-analysis` returns 403.
- Free users get max 2 charts because the server saves only 2.
- All gates rely on a Stripe subscription check, not on a client-mutable value.

## Technical notes
- `verify-pro` is a shared module under `supabase/functions/_shared/verifyPro.ts` (import path inside Deno).
- Use `application/pdf` and `application/vnd.openxmlformats-officedocument.presentationml.presentation` content types and `Content-Disposition: attachment; filename="..."`.
- CORS must expose `Content-Disposition` so the browser can read the filename: `Access-Control-Expose-Headers: Content-Disposition`.
- Existing `analyze-data` already verifies ownership; we'll add the plan-based chart trim there.
- After implementation: redeploy all functions, then mark the security finding fixed and update security memory.

## Out of scope
- Server-side rendering of charts to images for embedding in PDFs (current exports render charts as data/text — kept as-is).
- Refactoring `useSubscription` (still useful for UI affordances like badges).
