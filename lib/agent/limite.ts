const porDia = new Map<string, number>();

export function limiteDiario(): number {
  const n = Number(process.env.AI_DAILY_LIMIT ?? 40);
  return Number.isFinite(n) && n >= 0 ? n : 40;
}

export function resetLimite(): void {
  porDia.clear();
}

export function consumirPergunta(agora = new Date()): { ok: boolean; usadas: number; limite: number } {
  const limite = limiteDiario();
  const dia = agora.toISOString().slice(0, 10);
  for (const k of porDia.keys()) if (k !== dia) porDia.delete(k);
  const usadas = (porDia.get(dia) || 0) + 1;
  porDia.set(dia, usadas);
  if (limite === 0) return { ok: true, usadas, limite };
  return { ok: usadas <= limite, usadas, limite };
}
