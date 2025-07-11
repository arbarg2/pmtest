
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TransactionGraphProps {
  address: string;
}

export const TransactionGraph: React.FC<TransactionGraphProps> = ({ address }) => {
  return (
    <div className="space-y-4">
      <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
        <p className="text-gray-500 mb-2">Transaction Graph Visualization</p>
        <p className="text-sm text-gray-400">Address: {address.slice(0, 10)}...</p>
        <p className="text-sm text-gray-400 mt-2">Graph visualization coming soon</p>
      </div>
    </div>
  );
};
