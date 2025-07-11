
import React, { useState } from 'react';
import { Shield, Eye, CheckCircle, ArrowRight, Twitter, Linkedin, Lock, Zap, Globe, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EarlyAccessModal from '@/components/auth/EarlyAccessModal';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const [showEarlyAccess, setShowEarlyAccess] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50 dark:bg-slate-900/90 dark:border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 animate-fade-in">
              <Shield className="w-8 h-8 text-primary animate-pulse-slow" />
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rìan</h1>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground hover-scale"
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 md:py-24">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="bg-teal/10 text-teal border-teal/20 mb-6 text-sm px-4 py-2 animate-bounce-subtle">
              Early Access Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 animate-fade-in">
              Lightning-Fast Crypto Wallet & Transaction 
              <span className="text-teal block animate-shimmer">Risk Intelligence</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-4xl mx-auto animate-slide-up">
              Advanced blockchain forensics with comprehensive risk assessment, entity attribution, 
              and behavioral analysis for institutional compliance and investigation teams.
            </p>
            <div className="flex justify-center animate-scale-in">
              <Button 
                onClick={() => setShowEarlyAccess(true)}
                className="bg-teal hover:bg-teal/90 text-teal-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 teal-glow hover-lift"
              >
                Request Early Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto animate-fade-in">
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 p-8 hover-lift">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-teal/10 to-teal/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                    <Zap className="w-8 h-8 text-teal" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">Real-Time Analysis</h3>
                  <p className="text-slate-600 dark:text-slate-400">Lightning-fast blockchain forensics with comprehensive transaction mapping</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">Advanced Risk Intelligence</h3>
                  <p className="text-slate-600 dark:text-slate-400">Multi-layer risk assessment with entity attribution and behavioral analysis</p>
                </div>
                <div className="text-center group">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                    <Eye className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">Forensic Reporting</h3>
                  <p className="text-slate-600 dark:text-slate-400">Detailed investigation reports with audit trails and compliance documentation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 bg-white/50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              See the Unseen, Streamline Compliance, Built for Trust
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
              Empower your compliance and investigation teams with institutional-grade blockchain intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-teal/10 to-teal/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Globe className="w-6 h-6 text-teal" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">See the Unseen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Uncover hidden connections, trace complex transaction flows, and identify risk patterns 
                  invisible to traditional analysis methods.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <CheckCircle className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Streamline Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Automate AML screening, sanctions checking, and regulatory reporting with 
                  comprehensive audit trails and investigation documentation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover-lift group">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <CardTitle className="text-slate-900 dark:text-slate-100">Built for Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Enterprise-grade security, multi-tenant architecture, and institutional compliance 
                  standards ensure your data remains secure and private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 dark:bg-slate-950 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Shield className="w-6 h-6 text-teal animate-pulse-slow" />
              <span className="text-xl font-bold">Rìan</span>
            </div>
            
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors hover-scale">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors hover-scale">Terms of Service</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-teal transition-colors hover-scale">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-teal transition-colors hover-scale">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Rìan. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <EarlyAccessModal 
        isOpen={showEarlyAccess} 
        onClose={() => setShowEarlyAccess(false)} 
      />
    </div>
  );
};

export default Landing;
