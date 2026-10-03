export function cronAutorizado(header: string | null): boolean {
  const secret = process.env.CRON_SECRET || "";
  if (!secret) return false;
  const recebido = header || "";
  const esperado = "Bearer " + secret;
  if (recebido.length !== esperado.length) return false;
  let diff = 0;
  for (let i = 0; i < recebido.length; i++) diff |= recebido.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0;
}
