import { NextResponse } from "next/server";
import { claudeClient, claudeModel } from "@/lib/claude";
import { registrarUso, somarTokens } from "@/lib/agent/uso";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function texto(v: unknown) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  return t.slice(0, 500);
}

function numero(v: unknown) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  let s = v.trim();
  if (!s) return null;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function mexeu(v: unknown) {
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase();
  if (t === "sim") return "sim";
  if (t === "não" || t === "nao") return "não";
  return null;
}

function validar(raw: unknown) {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    mexeu: mexeu(o.mexeu),
    motivo: texto(o.motivo),
    gastos: numero(o.gastos),
    foraNormal: texto(o.foraNormal),
    negocios: texto(o.negocios),
    extra: numero(o.extra),
    extraOrigem: texto(o.extraOrigem),
    vitoria: texto(o.vitoria),
    escorreguei: texto(o.escorreguei),
  };
}

function lerJson(text: string) {
  const limpo = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(limpo);
  } catch {
    const m = limpo.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try {
      return JSON.parse(m[0]);
    } catch {
      return null;
    }
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const relato = body && typeof body.texto === "string" ? body.texto.trim() : "";
  if (!relato || relato.length > 8000) {
    return NextResponse.json({ error: "O relato está vazio ou longo demais." }, { status: 400 });
  }
  const client = claudeClient();
  if (!client) {
    return NextResponse.json(
      { error: "A chave do assistente ainda não está no servidor. Escreva o check-in nos campos." },
      { status: 200 }
    );
  }

  const prompt = `Extraia um check-in semanal de um relato falado em português do Brasil.
Devolva somente um objeto JSON, sem markdown, com exatamente estas chaves:
mexeu, motivo, gastos, foraNormal, negocios, extra, extraOrigem, vitoria, escorreguei.

Regras:
- mexeu é "sim" ou "não" somente se a pessoa disser se mexeu em caixinha, reserva, investimento ou poupança. Se não disser, null.
- motivo, foraNormal, negocios, extraOrigem, vitoria, escorreguei: frase curta com o que foi dito, ou null se não foi dito.
- gastos e extra: número em reais, ou null se o valor não foi dito. Não estime e não use 0 no lugar de ausência.
- Não invente nada. O que não estiver no relato fica null.

Relato:
${relato}`;

  try {
    const msg = await client.messages.create({
      model: claudeModel(),
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });
    const pedaco = msg.content.find((b) => b.type === "text");
    const bruto = pedaco && pedaco.type === "text" ? pedaco.text : "";
    const acc = { entrada: 0, saida: 0 };
    somarTokens(msg.usage, acc);
    const json = lerJson(bruto);
    if (!json) {
      void registrarUso({ dia: new Date().toISOString().slice(0, 10), origem: "checkin", ferramentas: [], erro: true, entrada: acc.entrada, saida: acc.saida });
      return NextResponse.json({ error: "Não consegui organizar o relato. Tente de novo." }, { status: 422 });
    }
    void registrarUso({ dia: new Date().toISOString().slice(0, 10), origem: "checkin", ferramentas: [], erro: false, entrada: acc.entrada, saida: acc.saida });
    return NextResponse.json(validar(json));
  } catch {
    void registrarUso({ dia: new Date().toISOString().slice(0, 10), origem: "checkin", ferramentas: [], erro: true, entrada: 0, saida: 0 });
    return NextResponse.json({ error: "Não consegui organizar o relato agora." }, { status: 502 });
  }
}
