export type RiskTier = 'low' | 'medium' | 'high' | 'critical';

export const riskTier = (score: number): RiskTier => {
  if (score >= 75) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 25) return 'medium';
  return 'low';
};

export const riskLabel = (tier: RiskTier): string => {
  switch (tier) {
    case 'critical': return 'CRITICAL RISK';
    case 'high': return 'HIGH RISK';
    case 'medium': return 'MEDIUM RISK';
    case 'low': return 'LOW RISK';
  }
};

export interface RiskClasses {
  text: string;
  bg: string;
  bgSoft: string;
  border: string;
  ring: string;
  stroke: string; // raw hsl var reference for SVG
  fill: string;
}

export const riskClasses = (tier: RiskTier): RiskClasses => {
  return {
    text: `text-risk-${tier}`,
    bg: `bg-risk-${tier}`,
    bgSoft: `bg-risk-${tier}/10`,
    border: `border-risk-${tier}/40`,
    ring: `ring-risk-${tier}/50`,
    stroke: `hsl(var(--risk-${tier}))`,
    fill: `hsl(var(--risk-${tier}))`,
  };
};
