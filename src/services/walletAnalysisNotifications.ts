
import { WalletRiskResponse } from '@/services/api';

export const getAnalysisToastMessages = (result: WalletRiskResponse) => {
  const isRealData = result.explanation?.includes('REAL-TIME ANALYSIS');
  const hasSanctionsData = result.explanation?.includes('SANCTIONS:');
  
  const title = isRealData ? "✅ Real-Time Analysis Complete" : "⚠️ Analysis Complete (Limited Data)";
  
  const description = `${result.entity_attribution?.name || 'Unknown Entity'} • ${result.risk_level} risk • Processing: ${result.processing_time_ms}ms${isRealData ? ' • Live blockchain data' : ' • Please configure API keys for real-time data'}${hasSanctionsData ? ' • Sanctions screened' : ''}`;
  
  return { title, description };
};

export const getErrorToastMessages = (error: Error) => {
  let errorTitle = "Analysis Failed";
  let errorMessage = "Unknown error occurred. Please try again.";
  
  if (error.message.includes('API key')) {
    errorTitle = "API Configuration Required";
    errorMessage = error.message + " Please configure your API keys in settings.";
  } else if (error.message.includes('Network error')) {
    errorTitle = "Network Error";
    errorMessage = error.message;
  } else if (error.message.includes('Invalid')) {
    errorTitle = "Invalid Address";
    errorMessage = error.message;
  } else {
    errorMessage = error.message;
  }
  
  return { errorTitle, errorMessage };
};
