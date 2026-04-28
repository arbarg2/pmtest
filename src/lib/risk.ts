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
  stroke: string;
  fill: string;
}

// Static map so Tailwind JIT picks up the classes
const MAP: Record<RiskTier, RiskClasses> = {
  low: {
    text: 'text-risk-low',
    bg: 'bg-risk-low',
    bgSoft: 'bg-risk-low/10',
    border: 'border-risk-low/40',
    ring: 'ring-risk-low/50',
    stroke: 'hsl(var(--risk-low))',
    fill: 'hsl(var(--risk-low))',
  },
  medium: {
    text: 'text-risk-medium',
    bg: 'bg-risk-medium',
    bgSoft: 'bg-risk-medium/10',
    border: 'border-risk-medium/40',
    ring: 'ring-risk-medium/50',
    stroke: 'hsl(var(--risk-medium))',
    fill: 'hsl(var(--risk-medium))',
  },
  high: {
    text: 'text-risk-high',
    bg: 'bg-risk-high',
    bgSoft: 'bg-risk-high/10',
    border: 'border-risk-high/40',
    ring: 'ring-risk-high/50',
    stroke: 'hsl(var(--risk-high))',
    fill: 'hsl(var(--risk-high))',
  },
  critical: {
    text: 'text-risk-critical',
    bg: 'bg-risk-critical',
    bgSoft: 'bg-risk-critical/10',
    border: 'border-risk-critical/40',
    ring: 'ring-risk-critical/50',
    stroke: 'hsl(var(--risk-critical))',
    fill: 'hsl(var(--risk-critical))',
  },
};

export const riskClasses = (tier: RiskTier): RiskClasses => MAP[tier];

export const riskTierFromLevel = (level?: string): RiskTier => {
  const l = (level || '').toLowerCase();
  if (l.includes('critical')) return 'critical';
  if (l.includes('high')) return 'high';
  if (l.includes('medium') || l.includes('moderate')) return 'medium';
  return 'low';
};
