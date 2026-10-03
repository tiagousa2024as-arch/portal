import { NextResponse } from "next/server";
import { claudeClient, claudeModel } from "@/lib/claude";
import { consumirPergunta } from "@/lib/agent/limite";
import { registrarUso, somarTokens } from "@/lib/agent/uso";
import { db, STATE_ID } from "@/lib/supabase";
import { readLocalState, supabaseConfigured, writeLocalState } from "@/lib/state-store";
import { cronAutorizado } from "@/lib/briefing/cron";
import { encaixarRelatorio, frasesSeguras, hojeUtc, linhasMes, linhasSabado, primeiroSabadoDoMes, ehSabado } from "@/lib/briefing/montar";
import { salvarBriefing } from "@/lib/briefing/store";
import { ymd } from "@/lib/insights/plano";
import type { EstadoBriefing } from "@/lib/briefing/montar";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function frasesDoLastro(linhas: string[]): Promise<string> {
  const client = claudeClient();
  if (!client || !linhas.length) return "";
  const cota = consumirPergunta();
  if (!cota.ok) return "";
  try {
    const msg = await client.messages.create({
      model: claudeModel(),
      max_tokens: 300,
      system:
        "Você é o Lastro. Escreva 2 ou 3 frases curtas em português do Brasil, calmas, sobre o texto recebido. Não invente número, data ou saldo. Não sugira compra nem venda. Elogie o hábito, não o preço. Não diga que salvou algo.",
      messages: [{ role: "user", content: linhas.join("\n") }],
    });
    const texto = msg.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join(" ");
    const acc = { entrada: 0, saida: 0 };
    somarTokens(msg.usage, acc);
    void registrarUso({ dia: ymd(hojeUtc()), origem: "sabado", ferramentas: [], erro: false, entrada: acc.entrada, saida: acc.saida });
    return frasesSeguras(texto, linhas);
  } catch {
    void registrarUso({ dia: ymd(hojeUtc()), origem: "sabado", ferramentas: [], erro: true, entrada: 0, saida: 0 });
    return "";
  }
}

async function lerEstado(): Promise<Record<string, unknown> | null> {
  if (!supabaseConfigured()) {
    const state = await readLocalState();
    return state && typeof state === "object" ? (state as Record<string, unknown>) : null;
  }
  const { data, error } = await db().from("portal_state").select("data").eq("id", STATE_ID).maybeSingle();
  if (error || !data?.data || typeof data.data !== "object") return null;
  return data.data as Record<string, unknown>;
}

async function gravarEstado(estado: Record<string, unknown>): Promise<boolean> {
  if (!supabaseConfigured()) {
    await writeLocalState(estado);
    return true;
  }
  const { error } = await db().from("portal_state").upsert({ id: STATE_ID, data: estado, updated_at: new Date().toISOString() });
  return !error;
}

export async function GET(req: Request) {
  if (!cronAutorizado(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const hoje = hojeUtc();
  if (!ehSabado(hoje)) return NextResponse.json({ ok: true, pulado: true });
  const estado = await lerEstado();
  if (!estado) return NextResponse.json({ ok: false, motivo: "estado" }, { status: 500 });

  const data = ymd(hoje);
  const linhas = linhasSabado(estado as EstadoBriefing, hoje);
  const frases = await frasesDoLastro(linhas);
  const sabado = await salvarBriefing({ data, tipo: "sabado", titulo: "Seu sábado", linhas, frases, na_linha: false });
  if (!sabado.ok) return NextResponse.json({ ok: false, motivo: sabado.motivo }, { status: sabado.motivo === "tabela" ? 200 : 500 });

  if (!primeiroSabadoDoMes(hoje)) return NextResponse.json({ ok: true, sabado: true, mes: false });

  const fato = linhasMes(estado as EstadoBriefing, hoje);
  const reflexao = await frasesDoLastro(fato.linhas);
  const texto = [...fato.linhas, reflexao].filter(Boolean).join("\n\n");
  const linha = encaixarRelatorio(estado.timeline, { id: "mes-" + fato.mes, data, titulo: fato.titulo, texto, foto: "" });
  let naLinha = false;
  if (linha) {
    estado.timeline = linha;
    naLinha = await gravarEstado(estado);
  }
  const mes = await salvarBriefing({ data, tipo: "mes", titulo: fato.titulo, linhas: fato.linhas, frases: reflexao, na_linha: naLinha });
  if (!mes.ok) return NextResponse.json({ ok: false, motivo: mes.motivo }, { status: mes.motivo === "tabela" ? 200 : 500 });
  return NextResponse.json({ ok: true, sabado: true, mes: true });
}
