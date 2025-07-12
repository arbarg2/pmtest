
import React from 'react';
import { Search, TrendingUp, Shield, FileText, Zap } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DashboardHeroProps {
  walletAddress: string;
  setWalletAddress: (address: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  userName?: string;
  stats?: {
    total_lookups: number;
    pending_review: number;
  };
}

const DashboardHero = ({ 
  walletAddress, 
  setWalletAddress, 
  onAnalyze, 
  isAnalyzing,
  userName,
  stats
}: DashboardHeroProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0l-15 15v-30l15 15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header with personalized welcome */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                {userName ? `Welcome back, ${userName}!` : 'Welcome to Rìan'}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                Dive into Blockchain Forensics: Advanced AI-Powered Intelligence
              </p>
            </div>
            {stats && (
              <div className="hidden md:flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{stats.total_lookups}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Total Analyses</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-accent">{stats.pending_review}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Pending Review</div>
                </div>
              </div>
            )}
          </div>

          {/* Main Analysis Input */}
          <div className="max-w-3xl mx-auto mb-12">
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/20">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Start Your Analysis
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Enter a Bitcoin or Ethereum wallet address below
                </p>
                <Badge variant="outline" className="mt-2 text-xs">
                  BTC or ETH • Network auto-detected
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Input
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa..."
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="text-base py-4 px-6 rounded-xl border-2 focus:border-accent transition-all duration-200 font-mono dark:bg-slate-700 dark:border-slate-600"
                    onKeyDown={(e) => e.key === 'Enter' && onAnalyze()}
                  />
                  <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <Button 
                  onClick={onAnalyze}
                  disabled={isAnalyzing || !walletAddress.trim()}
                  className="bg-accent hover:bg-accent/90 text-white px-8 py-4 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5 mr-2" />
                      Analyze Wallet
                    </>
                  )}
                </Button>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Analyzing 20+ risk factors including sanctions, mixers, and DeFi protocols
                </p>
              </div>
            </div>
          </div>

          {/* Enhanced Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-accent/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <Zap className="w-8 h-8 text-accent animate-pulse" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">
                  Instant Insights
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Get real-time blockchain forensics with comprehensive transaction mapping in seconds
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <TrendingUp className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">
                  Deep Dive Analysis
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Multi-layer risk assessment with entity attribution and behavioral analysis
                </p>
              </CardContent>
            </Card>

            <Card className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500/20 to-purple-400/10 rounded-2xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-200">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-bold text-lg mb-3 text-slate-900 dark:text-slate-100">
                  Compliance Ready
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Generate detailed audit trails and investigation reports for regulatory compliance
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Holly AI Tease */}
          <div className="mt-8 text-center">
            <Badge variant="outline" className="text-accent border-accent/30 animate-pulse">
              🤖 Holly AI is ready to help with your investigation!
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHero;
