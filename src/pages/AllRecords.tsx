
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { InvestigationRecordsTable } from '@/components/InvestigationRecordsTable';
import { RecordChartsPanel } from '@/components/charts/RecordChartsPanel';

const AllRecords = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Database className="w-6 h-6 mr-3 text-primary" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  All Records
                </h1>
                <p className="text-sm text-muted-foreground">
                  Complete investigation history
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Charts Panel */}
        <h2 className="text-lg font-semibold mb-4 text-foreground">
          Investigation analytics
        </h2>
        <RecordChartsPanel />

        {/* Investigation Records Table */}
        <h2 className="text-lg font-semibold mt-10 mb-4 text-foreground">
          Investigation records
        </h2>
        <InvestigationRecordsTable />
      </div>
    </div>
  );

};

export default AllRecords;
