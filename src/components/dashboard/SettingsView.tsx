import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { User, Bell, Shield, BellRing, Slack, Globe, Mail, Save, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

export function SettingsView() {
  const [isSaving, setIsSaving] = useState(false);
  const userName = localStorage.getItem('carbontwin_userName') || 'User';
  const userEmail = localStorage.getItem('carbontwin_userEmail') || 'user@example.com';

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground text-sm">Manage your profile, notifications, and enterprise integrations.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-500">
          {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Profile Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              <CardTitle>Profile Information</CardTitle>
            </div>
            <CardDescription>Update your personal details and how others see you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input defaultValue={userName} className="bg-secondary/50" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input defaultValue={userEmail} disabled className="bg-secondary/20 cursor-not-allowed opacity-70" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Integrations Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <CardTitle>Enterprise Integrations</CardTitle>
            </div>
            <CardDescription>Connect CarbonTwin to your company tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#4A154B] rounded-md">
                  <Slack className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Slack Notifications</p>
                  <p className="text-xs text-muted-foreground">Receive daily eco-score updates in Slack.</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Connected</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/10 opacity-60">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-md">
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">ESG Portal Sync</p>
                  <p className="text-xs text-muted-foreground">Auto-sync carbon data to company ESG reports.</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="h-8">Enable</Button>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              <CardTitle>Notification Preferences</CardTitle>
            </div>
            <CardDescription>Choose how you want to be alerted about your sustainability goals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Weekly Progress Report</span>
                </div>
                <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
             </div>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellRing className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Low Eco-Score Alerts</span>
                </div>
                <div className="w-10 h-5 bg-emerald-500 rounded-full relative cursor-pointer">
                  <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Security Section */}
        <Card className="bg-card border-border border-destructive/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-destructive" />
              <CardTitle>Security & Account</CardTitle>
            </div>
            <CardDescription>Manage your authentication and account status.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="text-destructive hover:bg-destructive/10 border-destructive/20 h-9">
              Delete Account
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
