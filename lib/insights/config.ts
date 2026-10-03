// Limiares do motor de insights. A tela não inventa outro número.
export const LIMITES = {
  arcaParadaDias: 3,
  bandaMin: 15,
  bandaMax: 35,
  bandaCarteiraMin: 4000,
  bandaMesesParaVender: 183,
  derivaPontos: 3,
  gastosAcima: 0.4,
  gastosSemanasMedia: 8,
  gastosSemanasMinimas: 4,
  retiradasJanelaDias: 30,
  retiradasAcimaDe: 1,
  retiradasCaixinhas: ["reserva", "lance", "apto"] as const,
  paceDias: 28,
  reservaCheckinsMinimos: 4,
  reservaMeses: 6,
  semanasNoMes: 4.33,
  marcoPerto: 0.1,
  revisaoDiasAntes: 14,
  revisaoDiasDepois: 7,
  revisaoTrimestral: [1, 4, 7, 10],
  revisaoAnualMes: 3,
  contasJanelaDias: 7,
  aluguelDia: 5,
  consorcioDia: 18,
  // Ipanema não tem dia no plano. Sem dia no mapa, a conta não aparece.
  acordosDia: { zema: 5, recovery: 25 } as Record<string, number>,
  top: 3,
};

export const LETRAS: Record<string, string> = {
  A: "Ações BR",
  R: "Fundos imobiliários",
  C: "Caixa",
  I: "Internacional",
};
