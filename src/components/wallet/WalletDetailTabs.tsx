
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WalletRiskResponse } from '@/services/api';

interface WalletDetailTabsProps {
  wallet: WalletRiskResponse;
  activeTab: string;
}

export function WalletDetailTabs({ wallet, activeTab }: WalletDetailTabsProps) {
  if (activeTab === 'entityAttribution') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Entity Attribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Name:</strong> {wallet.entity_attribution?.name || 'Unknown'}</p>
          <p><strong>Type:</strong> {wallet.entity_attribution?.type || 'Unknown'}</p>
          <p><strong>Risk Level:</strong> {wallet.entity_attribution?.risk_level || 'Unknown'}</p>
          <p><strong>Confidence:</strong> {((wallet.entity_attribution?.confidence || 0) * 100).toFixed(0)}%</p>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'volumeMetrics') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Lifetime Inbound:</strong> {wallet.volume_metrics?.lifetime_value?.inbound?.toFixed(2) || '0.00'}</p>
          <p><strong>Lifetime Outbound:</strong> {wallet.volume_metrics?.lifetime_value?.outbound?.toFixed(2) || '0.00'}</p>
          <p><strong>Net Value:</strong> {wallet.volume_metrics?.lifetime_value?.net?.toFixed(2) || '0.00'}</p>
          <p><strong>USD Equivalent:</strong> ${wallet.volume_metrics?.lifetime_value?.usd_equivalent?.toFixed(2) || '0.00'}</p>
          <p><strong>Average Transaction Size:</strong> {wallet.volume_metrics?.average_transaction_size?.toFixed(2) || '0.00'}</p>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'geographicRisk') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geographic Risk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>Primary Region:</strong> {wallet.geographic_risk?.primary_region || 'Unknown'}</p>
          <p><strong>Risk Jurisdictions:</strong> {wallet.geographic_risk?.risk_jurisdictions?.join(', ') || 'None'}</p>
          <p><strong>Geo Risk Score:</strong> {wallet.geographic_risk?.geo_risk_score?.toFixed(2) || '0.00'}</p>
        </CardContent>
      </Card>
    );
  }

  if (activeTab === 'temporalPatterns') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Temporal Patterns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p><strong>First Seen:</strong> {wallet.temporal_patterns?.first_seen ? new Date(wallet.temporal_patterns.first_seen).toLocaleString() : 'Unknown'}</p>
          <p><strong>Last Active:</strong> {wallet.temporal_patterns?.last_active ? new Date(wallet.temporal_patterns.last_active).toLocaleString() : 'Unknown'}</p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
