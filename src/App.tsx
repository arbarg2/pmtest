
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import Index from './pages/Index';
import WalletTransactionFlow from './pages/WalletTransactionFlow';
import AllRecords from './pages/AllRecords';
import BulkAnalysis from './pages/BulkAnalysis';
import AuditLogs from './pages/AuditLogs';
import ApiDocs from './pages/ApiDocs';
import NotFound from './pages/NotFound';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CaseManagementPage from './pages/CaseManagement';
import CasesPage from './pages/Cases';
import CaseViewPage from './pages/CaseView';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Index />} />
              <Route path="/cases" element={<CasesPage />} />
              <Route path="/case/:caseId" element={<CaseViewPage />} />
              <Route path="/case-management" element={<CaseManagementPage />} />
              <Route path="/record/:recordId" element={<WalletTransactionFlow />} />
              <Route path="/all-records" element={<AllRecords />} />
              <Route path="/bulk-analysis" element={<BulkAnalysis />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/api-docs" element={<ApiDocs />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
