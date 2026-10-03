import { NextResponse } from "next/server";
import { claudeClient } from "@/lib/claude";
import { consumirPergunta } from "@/lib/agent/limite";
import { registrarUso } from "@/lib/agent/uso";
import { extrairMemoria } from "@/lib/memoria/extrair";
import { listarMemoria } from "@/lib/memoria/store";

export const dynamic = "force-dynamic";

function diaLog(hoje: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(hoje) ? hoje : new Date().toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const pergunta = typeof body?.pergunta === "string" ? body.pergunta.trim().slice(0, 4000) : "";
  const resposta = typeof body?.resposta === "string" ? body.resposta.trim().slice(0, 8000) : "";
  const hoje = typeof body?.hoje === "string" ? body.hoje : "";
  if (!pergunta || !resposta) return NextResponse.json({ itens: [] });

  const client = claudeClient();
  if (!client) return NextResponse.json({ itens: [] });
  const cota = consumirPergunta();
  if (!cota.ok) return NextResponse.json({ itens: [] });

  const atual = await listarMemoria();
  const ja = atual.ok ? atual.itens.map((m) => m.text) : [];
  const extraido = await extrairMemoria(client, pergunta, resposta, ja);
  void registrarUso({
    dia: diaLog(hoje),
    origem: "memoria",
    ferramentas: ["propor_memoria"],
    erro: extraido.erro,
    entrada: extraido.entrada,
    saida: extraido.saida,
  });
  return NextResponse.json({ itens: extraido.itens });
}
