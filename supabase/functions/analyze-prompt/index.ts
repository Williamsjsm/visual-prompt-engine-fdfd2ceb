// ---------------------------------------------------------------------------
// Reference scaffold for a Supabase Edge Function variant of the analyzer.
//
// The live backend for this app is the TanStack server function at
// src/lib/ai/analyze-prompt.functions.ts (it ships with the same runtime
// the rest of the app uses and has zero deploy steps).
//
// This file is kept as a portable reference so the same contract can be
// served from Supabase Edge Functions if the project ever migrates. It is
// NOT auto-deployed and is safe to ignore until Lovable Cloud is enabled
// and `supabase functions deploy analyze-prompt` is run.
//
// Run locally with: `supabase functions serve analyze-prompt`
// ---------------------------------------------------------------------------

// @ts-nocheck — Deno runtime, not type-checked by the Vite/TS build.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type AnalyzeRequest = {
  fileUrl?: string;
  fileDataUrl?: string;
  fileName?: string;
  mime?: string;
  kind: "image" | "video";
  mode: "max" | "bal" | "cre" | "short";
  model: "gpt" | "gem" | "cla";
  language?: string;
  targetFormat?: string;
};

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.fileUrl && !body.fileDataUrl) {
    return json({ error: "fileUrl or fileDataUrl is required" }, 400);
  }

  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const openAiKey = Deno.env.get("OPENAI_API_KEY");
  const geminiKey = Deno.env.get("GEMINI_API_KEY");

  // No provider configured → tell the client to use its local mock.
  if (!lovableKey && !openAiKey && !geminiKey) {
    return json({ source: "mock" }, 200);
  }

  // --------------------------------------------------------------------
  // REAL CALL — placeholder. Wire the AI Gateway here when ready, e.g.:
  //
  //   const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       "Lovable-API-Key": lovableKey!,
  //     },
  //     body: JSON.stringify({
  //       model: body.model === "gpt" ? "openai/gpt-4o-mini" : "google/gemini-3-flash-preview",
  //       response_format: { type: "json_object" },
  //       messages: [
  //         { role: "system", content: ANALYZER_SYSTEM_PROMPT },
  //         { role: "user", content: [
  //           { type: "text", text: `Analyze and return JSON. Language: ${body.language ?? "es"}. Target format: ${body.targetFormat ?? "16:9"}.` },
  //           { type: "image_url", image_url: { url: body.fileUrl ?? body.fileDataUrl! } },
  //         ]},
  //       ],
  //     }),
  //   });
  //   const data = await res.json();
  //   const parsed = JSON.parse(data.choices[0].message.content);
  //   return json({ source: "gemini", analysis: parsed.analysis, prompts: parsed.prompts });
  // --------------------------------------------------------------------

  return json({ source: "mock" }, 200);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
