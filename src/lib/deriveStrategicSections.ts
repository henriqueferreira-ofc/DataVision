/**
 * Shared fallback logic to derive strategic sections (Executive Score, SWOT,
 * Correlations, Data Quality) from basic analysis data when the AI engine
 * hasn't produced structured fields.
 *
 * Used by both the Deep Analysis page and the PDF/PPTX export functions.
 */

export const clampScore = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

export function parseMetricValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  let normalized = value.replace(/[^\d,.-]/g, "").trim();
  if (!normalized) return 0;

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatCurrency(value: number, pt: boolean) {
  return new Intl.NumberFormat(pt ? "pt-BR" : "en-US", {
    style: "currency",
    currency: pt ? "BRL" : "USD",
  }).format(value);
}

export interface DerivedStrategicSections {
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  executiveScore: {
    overall: number;
    categories: { name: string; score: number; maxScore: number }[];
    verdict: string;
  };
  correlations: {
    factor1: string;
    factor2: string;
    relationship: string;
    strength: string;
    description: string;
  }[];
  dataQuality: {
    score: number;
    completeness: number;
    consistency: number;
    observations: string[];
  };
}

export function deriveStrategicSections({
  diagnosis,
  insights,
  kpis,
  charts,
  recommendations,
  pt,
}: {
  diagnosis: any;
  insights: any;
  kpis: any[];
  charts: any[];
  recommendations: string[];
  pt: boolean;
}): DerivedStrategicSections {
  const findMetric = (matcher: (name: string) => boolean) => {
    const match = kpis.find((item) => matcher(String(item?.name || "").toLowerCase()));
    return parseMetricValue(match?.value);
  };

  const pendingValue = findMetric((n) => n.includes("valor") && n.includes("pendente"));
  const paidValue = findMetric((n) => n.includes("valor") && n.includes("pago"));
  const pendingPercentage =
    findMetric((n) => n.includes("percentual") && n.includes("pendente")) ||
    (pendingValue + paidValue > 0 ? (pendingValue / (pendingValue + paidValue)) * 100 : 0);
  const pendingCount = findMetric((n) => n.includes("número") && n.includes("pendente"));
  const paidCount = findMetric((n) => n.includes("número") && n.includes("paga"));

  const findings = Array.isArray(diagnosis?.findings) ? diagnosis.findings : [];
  const bottlenecks = Array.isArray(diagnosis?.bottlenecks) ? diagnosis.bottlenecks : [];
  const opportunities = Array.isArray(insights?.opportunities) ? insights.opportunities : [];
  const risks = Array.isArray(insights?.risks) ? insights.risks : [];
  const patterns = Array.isArray(insights?.patterns) ? insights.patterns : [];
  const validCharts = charts.filter((c) => Array.isArray(c?.data) && c.data.length > 1);
  const collectionRatio = pendingValue + paidValue > 0 ? (paidValue / (pendingValue + paidValue)) * 100 : 0;

  const performance = clampScore((collectionRatio + (100 - pendingPercentage)) / 2);
  const growth = clampScore(52 + opportunities.length * 8 + patterns.length * 4);
  const efficiency = clampScore(72 - pendingCount * 3 + paidCount * 4);
  const risk = clampScore(100 - pendingPercentage);
  const overall = clampScore((performance + growth + efficiency + risk) / 4);

  const fallbackSwot = {
    strengths: [
      paidValue > 0
        ? `${pt ? "A operação já converteu" : "The operation has already converted"} ${formatCurrency(paidValue, pt)} ${pt ? "em pagamentos confirmados." : "into confirmed payments."}`
        : null,
      validCharts.length >= 4
        ? (pt ? "A análise já possui visão visual de distribuição, volume, tendência temporal e comparação mensal." : "The analysis already provides visual coverage for distribution, volume, temporal trend, and monthly comparison.")
        : null,
      patterns[0] || findings[0] || (pt ? "Há volume suficiente para priorização estratégica da cobrança." : "There is enough volume to prioritize collections strategically."),
    ].filter(Boolean) as string[],
    weaknesses: [
      ...bottlenecks.slice(0, 2),
      pendingValue > paidValue
        ? `${pt ? "O valor pendente de" : "The outstanding amount of"} ${formatCurrency(pendingValue, pt)} ${pt ? "supera o valor já recebido." : "exceeds the amount already collected."}`
        : null,
    ].filter(Boolean) as string[],
    opportunities: ((opportunities.length ? opportunities : recommendations) as string[]).slice(0, 3),
    threats: [
      ...risks.slice(0, 2),
      pendingPercentage >= 60
        ? (pt ? "Alta concentração de faturas pendentes aumenta a pressão sobre o fluxo de caixa." : "High concentration of overdue invoices increases pressure on cash flow.")
        : null,
    ].filter(Boolean) as string[],
  };

  const fallbackCorrelations = [
    {
      factor1: pt ? "Volume pendente" : "Outstanding volume",
      factor2: pt ? "Risco de caixa" : "Cash-flow risk",
      relationship: "positive",
      strength: pendingPercentage >= 60 ? "strong" : "moderate",
      description: pt
        ? `Quanto maior a participação do saldo pendente (${pendingPercentage.toFixed(1)}%), maior a pressão financeira sobre a operação.`
        : `The higher the share of outstanding balance (${pendingPercentage.toFixed(1)}%), the greater the financial pressure on the operation.`,
    },
    {
      factor1: pt ? "Quantidade de faturas pendentes" : "Outstanding invoice count",
      factor2: pt ? "Carga operacional de cobrança" : "Collections workload",
      relationship: "positive",
      strength: pendingCount >= 5 ? "strong" : "moderate",
      description: pt
        ? `O volume de ${pendingCount || 0} faturas pendentes tende a aumentar o esforço manual da equipe de cobrança.`
        : `${pendingCount || 0} outstanding invoices tend to increase the manual workload for the collections team.`,
    },
    {
      factor1: pt ? "Recebimentos pagos" : "Paid collections",
      factor2: pt ? "Pressão de inadimplência" : "Delinquency pressure",
      relationship: "negative",
      strength: paidValue > 0 ? "moderate" : "weak",
      description: pt
        ? `O montante já pago de ${formatCurrency(paidValue, pt)} ajuda a compensar parte da exposição causada pelas pendências.`
        : `The paid amount of ${formatCurrency(paidValue, pt)} helps offset part of the exposure created by outstanding invoices.`,
    },
  ];

  const completeness = clampScore(60 + Math.min(kpis.length * 4 + validCharts.length * 6, 28));
  const consistency = clampScore(62 + Math.min(findings.length * 4 + patterns.length * 5, 24) - Math.min(bottlenecks.length * 3, 12));
  const score = clampScore((completeness + consistency) / 2);

  return {
    swot: fallbackSwot,
    executiveScore: {
      overall,
      categories: [
        { name: pt ? "Performance" : "Performance", score: performance, maxScore: 100 },
        { name: pt ? "Crescimento" : "Growth", score: growth, maxScore: 100 },
        { name: pt ? "Eficiência" : "Efficiency", score: efficiency, maxScore: 100 },
        { name: pt ? "Risco" : "Risk", score: risk, maxScore: 100 },
      ],
      verdict: pt
        ? "O cenário atual exige ação imediata em cobrança e priorização financeira. O volume pendente ainda reduz a saúde operacional, mas já existe base analítica suficiente para reverter esse quadro."
        : "The current scenario requires immediate action in collections and financial prioritization. Outstanding volume still weakens operational health, but there is already enough analytical basis to reverse this picture.",
    },
    correlations: fallbackCorrelations,
    dataQuality: {
      score,
      completeness,
      consistency,
      observations: [
        validCharts.length >= 4
          ? (pt ? "A base permite leitura por distribuição, contagem, tendência temporal e comparação mensal." : "The dataset supports distribution, volume, temporal trend, and monthly comparison views.")
          : (pt ? "A cobertura visual ainda pode ser ampliada com mais recortes analíticos." : "Visual coverage can still be expanded with more analytical cuts."),
        kpis.length >= 4
          ? (pt ? "Os principais indicadores operacionais já estão presentes e mensuráveis." : "Key operational indicators are already present and measurable.")
          : (pt ? "Há poucos indicadores consolidados para uma leitura executiva completa." : "There are too few consolidated indicators for a complete executive readout."),
        bottlenecks.length > 0
          ? (pt ? "Existem gargalos identificados, o que indica consistência suficiente para diagnóstico acionável." : "Detected bottlenecks indicate enough consistency for an actionable diagnosis.")
          : (pt ? "A ausência de gargalos explícitos reduz a profundidade do diagnóstico causal." : "The absence of explicit bottlenecks reduces causal diagnostic depth."),
      ],
    },
  };
}
