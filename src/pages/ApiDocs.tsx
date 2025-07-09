
import React from 'react';
import { Code, Key, Send, CheckCircle, Copy, ArrowRight, Shield, Zap, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ApiDocs = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b border-slate-200/50 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  Rian API Documentation
                </h1>
                <p className="text-sm text-slate-500">RESTful API for crypto wallet risk analysis</p>
              </div>
            </div>
            <nav className="flex items-center space-x-4">
              <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                ← Back to Dashboard
              </Button>
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                Get API Key
              </Button>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Quick Start */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-full text-sm font-medium mb-6 border border-blue-200/50">
              <Zap className="w-4 h-4" />
              <span>Production Ready • RESTful • Rate Limited</span>
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-4">
              API Documentation
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Integrate Rian's wallet risk analysis into your applications with our simple, fast API.
            </p>
          </div>

          {/* API Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Clock, title: "< 1 Second Response", desc: "Real-time analysis results" },
              { icon: Shield, title: "Enterprise Security", desc: "API key authentication & HTTPS" },
              { icon: Code, title: "RESTful Design", desc: "Simple HTTP requests & JSON responses" }
            ].map((feature, index) => (
              <Card key={index} className="bg-white/90 backdrop-blur-sm border-slate-200/50">
                <CardContent className="p-6 text-center">
                  <feature.icon className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section className="mb-16">
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader>
              <CardTitle className="flex items-center text-2xl">
                <Key className="w-6 h-6 mr-3 text-blue-600" />
                Authentication
              </CardTitle>
              <p className="text-slate-600">All API requests require authentication using API keys.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">API Key Header</h3>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm relative">
                  <div className="flex items-center justify-between">
                    <span>Authorization: Bearer YOUR_API_KEY</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard('Authorization: Bearer YOUR_API_KEY')}
                      className="text-slate-400 hover:text-white"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>Getting Started:</strong> Sign up for a free account to get your API key. 
                  Free tier includes 100 requests per month.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Endpoints */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">API Endpoints</h2>
          
          {/* Analyze Wallet Endpoint */}
          <Card className="shadow-lg border-0 bg-white/95 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Send className="w-5 h-5 mr-2 text-green-600" />
                  Analyze Wallet
                </CardTitle>
                <Badge className="bg-green-100 text-green-800">POST</Badge>
              </div>
              <p className="text-slate-600">Analyze a crypto wallet for risk factors and compliance issues.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Endpoint</h4>
                <div className="bg-slate-900 text-white p-3 rounded-lg font-mono text-sm">
                  POST https://api.rian.dev/v1/wallets/analyze
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm relative">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard('{\n  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",\n  "network": "bitcoin"\n}')}
                    className="absolute top-2 right-2 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <pre>{`{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "network": "bitcoin"
}`}</pre>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="bg-slate-900 text-blue-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                  <pre>{`{
  "status": "success",
  "data": {
    "wallet_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "network": "bitcoin",
    "risk_score": 2.5,
    "risk_level": "Low",
    "risk_factors": [
      {
        "category": "transaction_pattern",
        "severity": "low",
        "description": "Historical wallet with minimal activity"
      }
    ],
    "compliance_summary": {
      "sanctions_match": false,
      "fraud_indicators": false,
      "mixer_exposure": false,
      "darknet_exposure": false
    },
    "transaction_analysis": {
      "total_inbound": 50.0,
      "total_outbound": 0.0,
      "transaction_count": 1,
      "recent_activity": []
    },
    "analysis_timestamp": "2024-07-09T10:30:00Z"
  }
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generate Report Endpoint */}
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Code className="w-5 h-5 mr-2 text-purple-600" />
                  Generate Report
                </CardTitle>
                <Badge className="bg-purple-100 text-purple-800">POST</Badge>
              </div>
              <p className="text-slate-600">Generate a detailed compliance report for a wallet analysis.</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">Endpoint</h4>
                <div className="bg-slate-900 text-white p-3 rounded-lg font-mono text-sm">
                  POST https://api.rian.dev/v1/wallets/report
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request Body</h4>
                <div className="bg-slate-900 text-green-400 p-4 rounded-lg font-mono text-sm">
                  <pre>{`{
  "address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
  "format": "pdf"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Rate Limits */}
        <section className="mb-16">
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader>
              <CardTitle className="text-2xl">Rate Limits & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { plan: "Free", limit: "100 requests/month", price: "$0", features: ["Basic analysis", "JSON responses"] },
                  { plan: "Pro", limit: "10,000 requests/month", price: "$99", features: ["Advanced analysis", "PDF reports", "Priority support"] },
                  { plan: "Enterprise", limit: "Unlimited", price: "Custom", features: ["Custom endpoints", "SLA", "Dedicated support"] }
                ].map((tier, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <h3 className="font-bold text-lg mb-2">{tier.plan}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">{tier.price}</p>
                    <p className="text-sm text-slate-600 mb-4">{tier.limit}</p>
                    <ul className="space-y-1">
                      {tier.features.map((feature, fIndex) => (
                        <li key={fIndex} className="flex items-center text-sm">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* SDKs */}
        <section>
          <Card className="shadow-lg border-0 bg-white/95">
            <CardHeader>
              <CardTitle className="text-2xl">SDKs & Libraries</CardTitle>
              <p className="text-slate-600">Official SDKs for popular programming languages.</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  { lang: "JavaScript/Node.js", code: "npm install rian-api", status: "Available" },
                  { lang: "Python", code: "pip install rian-api", status: "Available" },
                  { lang: "Go", code: "go get github.com/rian/go-sdk", status: "Coming Soon" },
                  { lang: "PHP", code: "composer require rian/php-sdk", status: "Coming Soon" }
                ].map((sdk, index) => (
                  <div key={index} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{sdk.lang}</h3>
                      <Badge className={sdk.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {sdk.status}
                      </Badge>
                    </div>
                    <div className="bg-slate-900 text-green-400 p-3 rounded font-mono text-sm">
                      {sdk.code}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default ApiDocs;
