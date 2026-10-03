export type Severidade = "info" | "atencao" | "importante";

export type AcaoInsight = {
  rotulo: string;
  destino?: string;
  confirmar?: { chave: "reservaMeta"; valor: number };
};

export type Insight = {
  id: string;
  type: string;
  severity: Severidade;
  title: string;
  detail: string;
  em: string;
  action?: AcaoInsight;
};

export type Aporte = {
  recebido?: number;
  consorcio?: number;
  acordos?: number;
  lance?: number;
  reserva?: number;
  arca?: number;
};

export type EstadoInsights = {
  cfg?: {
    entrada?: number;
    consorcio?: number;
    lanceMensal?: number;
    lanceMeta?: number;
    reservaMeta?: number;
    pctReserva?: number;
    taxa?: number;
    aptoMeta?: number;
  };
  acordos?: { nome?: string; valor?: number; inicio?: string; n?: number }[];
  saldos?: Record<string, number | undefined>;
  aportes?: Record<string, Aporte | undefined>;
  checkins?: Record<string, { gastos?: string | number } | undefined>;
  caixinhasMov?: {
    caixinha?: string;
    tipo?: string;
    valor?: number;
    data?: string;
    origem?: string;
  }[];
  bandaFora?: Record<string, string | undefined>;
  patrimonio?: number;
};
