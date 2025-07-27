import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart,
  CreditCard,
  Package,
  FileText,
  Settings,
  Folder,
  MessageSquare,
  HelpCircle,
  ListChecks,
  Network,
  Database,
  Lock,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

const Index = () => {
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="max-w-md w-full p-8 bg-white/90 backdrop-blur dark:bg-slate-900/90 shadow-lg border-0">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Authentication Required
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please <a href="/auth" className="text-blue-500 hover:underline">log in</a> to access the dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Dashboard
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Welcome, {user.email}! {formattedTime}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button variant="outline" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Navigation */}
          <Card className="bg-white/90 backdrop-blur dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => navigate('/dashboard')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <BarChart className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate('/record/new')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Wallet Lookup
              </Button>
              <Button
                onClick={() => navigate('/all-records')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <ListChecks className="w-4 h-4 mr-2" />
                All Records
              </Button>
              <Button
                onClick={() => navigate('/bulk-analysis')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <Package className="w-4 h-4 mr-2" />
                Bulk Analysis
              </Button>
              <Button
                onClick={() => navigate('/case-management')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Case Management
              </Button>
              
              <Button 
                onClick={() => navigate('/cases')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <Folder className="w-4 h-4 mr-2" />
                Cases
              </Button>
              
              <Button
                onClick={() => navigate('/audit-logs')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <Database className="w-4 h-4 mr-2" />
                Audit Logs
              </Button>
              <Button
                onClick={() => navigate('/api-docs')}
                className="w-full justify-start bg-primary hover:bg-primary/90 text-white"
              >
                <Lock className="w-4 h-4 mr-2" />
                API Reference
              </Button>
            </CardContent>
          </Card>

          {/* Support & Resources */}
          <Card className="bg-white/90 backdrop-blur dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle>Support & Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => window.open('https://example.com/community', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <Users className="w-4 h-4 mr-2" />
                Community Forum
              </Button>
              <Button
                onClick={() => window.open('https://example.com/discord', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Join our Discord
              </Button>
              <Button
                onClick={() => window.open('https://example.com/help', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Help Center
              </Button>
              <Button
                onClick={() => window.open('https://example.com/status', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                System Status
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="bg-white/90 backdrop-blur dark:bg-slate-900/90">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                onClick={() => window.open('https://example.com/profile', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Profile
              </Button>
              <Button
                onClick={() => window.open('https://example.com/billing', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Billing & Subscription
              </Button>
              <Button
                onClick={() => window.open('https://example.com/preferences', '_blank')}
                variant="secondary"
                className="w-full justify-start"
              >
                <Network className="w-4 h-4 mr-2" />
                Preferences
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
