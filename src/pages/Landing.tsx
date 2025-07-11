
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">Rìan</h1>
            </div>
            <Button 
              onClick={() => navigate('/auth')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
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
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 mb-6 text-sm px-4 py-2">
              Early Access Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
              Lightning-Fast Crypto Wallet & Transaction 
              <span className="text-blue-600 block">Risk Intelligence</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-600 mb-8 max-w-4xl mx-auto">
              Advanced blockchain forensics with comprehensive risk assessment, entity attribution, 
              and behavioral analysis for institutional compliance and investigation teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => setShowEarlyAccess(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Request Early Access
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-slate-200/50 p-8">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Real-Time Analysis</h3>
                  <p className="text-slate-600">Lightning-fast blockchain forensics with comprehensive transaction mapping</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Advanced Risk Intelligence</h3>
                  <p className="text-slate-600">Multi-layer risk assessment with entity attribution and behavioral analysis</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                    <Eye className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Forensic Reporting</h3>
                  <p className="text-slate-600">Detailed investigation reports with audit trails and compliance documentation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              See the Unseen, Streamline Compliance, Built for Trust
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Empower your compliance and investigation teams with institutional-grade blockchain intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>See the Unseen</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Uncover hidden connections, trace complex transaction flows, and identify risk patterns 
                  invisible to traditional analysis methods.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Streamline Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Automate AML screening, sanctions checking, and regulatory reporting with 
                  comprehensive audit trails and investigation documentation.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Built for Trust</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  Enterprise-grade security, multi-tenant architecture, and institutional compliance 
                  standards ensure your data remains secure and private.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-6 md:mb-0">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-xl font-bold">Rìan</span>
            </div>
            
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms of Service</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">
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
