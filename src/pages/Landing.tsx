import React, { useState } from 'react';
import { Shield, Eye, CheckCircle, ArrowRight, Twitter, Linkedin, Lock, Zap, Globe, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
            <Badge className="bg-accent/10 text-accent border-accent/20 mb-6 text-sm px-4 py-2 animate-bounce-subtle">
              Early Access Available
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-slate-100 mb-6 animate-fade-in">
              <span className="text-accent font-extrabold animate-shimmer">Lightning-Fast</span>{' '}
              Crypto Wallet & Transaction 
              <span className="text-accent block animate-shimmer">Risk Intelligence</span>
            </h1>
            <div className="space-y-4 mb-8 max-w-4xl mx-auto animate-slide-up">
              <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-400 font-medium">
                Built for institutional compliance and investigation teams.
              </p>
              <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400">
                Gain advanced blockchain forensics, comprehensive risk assessment, and behavioral analysis for unparalleled security intelligence.
              </p>
            </div>
            <div className="flex justify-center animate-scale-in">
              <Button 
                onClick={() => setShowEarlyAccess(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 accent-glow hover-lift"
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
                  <div className="w-16 h-16 bg-gradient-to-br from-accent/10 to-accent/20 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform duration-200">
                    <Zap className="w-8 h-8 text-accent" />
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
                <div className="w-12 h-12 bg-gradient-to-br from-accent/10 to-accent/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Globe className="w-6 h-6 text-accent" />
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
              <Shield className="w-6 h-6 text-accent animate-pulse-slow" />
              <span className="text-xl font-bold">Rìan</span>
            </div>
            
            <div className="flex items-center space-x-6 mb-6 md:mb-0">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-slate-400 hover:text-white transition-colors hover-scale">
                    Privacy Policy
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Privacy Policy</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh] pr-4">
                    <div className="space-y-6 text-sm">
                      <p className="text-slate-600 dark:text-slate-400">
                        <em>Last updated: January 11, 2025</em>
                      </p>
                      
                      <p>
                        Welcome to <strong>Rìan</strong>. Your privacy matters to us. This Privacy Policy explains what data we collect, why we collect it, how we use it, and your rights.
                      </p>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">1. Who We Are</h3>
                        <p className="mb-4">
                          Rìan is an AI-driven crypto compliance platform that helps businesses assess wallet risk, trace transactions, and generate compliance reports.
                        </p>
                        <p>Our contact: support@rian.io</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">2. What Data We Collect</h3>
                        <p className="mb-4">We collect only the minimum data needed to provide the service:</p>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse border border-slate-300 dark:border-slate-600">
                            <thead>
                              <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Data Type</th>
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">What We Collect</th>
                                <th className="border border-slate-300 dark:border-slate-600 p-2 text-left">Why We Collect It</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Account Information</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Email address, sign-up date, login history</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To create and manage your account</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Investigation Records</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Wallet addresses, risk scores, case notes</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To provide compliance risk assessments</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-300 dark:border-slate-600 p-2 font-medium">Usage Data</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">Number of investigations, last login</td>
                                <td className="border border-slate-300 dark:border-slate-600 p-2">To monitor service usage and performance</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="mt-4 text-green-600 dark:text-green-400">✅ We <strong>do not</strong> collect sensitive personal data (e.g., name, address, financial account numbers).</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">3. How We Use Your Data</h3>
                        <ul className="list-disc list-inside space-y-2">
                          <li>To provide wallet risk scoring and investigation services.</li>
                          <li>To maintain the security and integrity of the platform.</li>
                          <li>To contact you for support, service updates, or account issues.</li>
                        </ul>
                        <p className="mt-4 font-medium">We <strong>never sell or share your data with third parties</strong> for marketing or unrelated purposes.</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">4. How We Store and Protect Your Data</h3>
                        <ul className="list-disc list-inside space-y-2">
                          <li>All data is stored securely using modern encryption standards.</li>
                          <li>Access is limited to authorized personnel only.</li>
                          <li>We conduct regular reviews to ensure data security.</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">5. Your Rights</h3>
                        <p className="mb-4">Under GDPR (if you are in the EU or UK), you have the right to:</p>
                        <ul className="list-disc list-inside space-y-2">
                          <li>Access the data we hold about you.</li>
                          <li>Correct inaccuracies in your data.</li>
                          <li>Request deletion of your data ("Right to be Forgotten").</li>
                          <li>Withdraw consent where applicable.</li>
                        </ul>
                        <p className="mt-4">To exercise any of these rights, contact us at: support@rian.io</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">6. Data Retention</h3>
                        <p>
                          We retain user accounts and investigation records <strong>only as long as necessary</strong> for compliance, legal obligations, or service delivery.
                        </p>
                        <p className="mt-2">You may request deletion of your account and all related data at any time.</p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">7. Cookies & Tracking</h3>
                        <p>
                          Rìan <strong>does not currently use cookies or third-party tracking</strong> beyond what is strictly necessary for platform functionality.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">8. Changes to This Policy</h3>
                        <p>
                          We may update this Privacy Policy from time to time. We will notify you of any significant changes via email or through the platform.
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-3">9. Contact</h3>
                        <p>
                          If you have any questions or concerns about this Privacy Policy or your data, please contact:
                        </p>
                        <p className="mt-2">📧 <strong>support@rian.io</strong></p>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <a href="#" className="text-slate-400 hover:text-white transition-colors hover-scale">Terms of Service</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <a href="#" className="text-slate-400 hover:text-accent transition-colors hover-scale">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-accent transition-colors hover-scale">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2025 Rìan. All rights reserved.</p>
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
