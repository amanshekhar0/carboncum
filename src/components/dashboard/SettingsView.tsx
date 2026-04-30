import { useEffect, useState } from 'react';
import { User, Shield, Save, Fingerprint, Lock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { api, ApiError, clearAuth } from '../../services/api';
import { useDashboard } from '../../services/DashboardContext';

export function SettingsView() {
  const { user, applyUserPatch, refresh } = useDashboard();

  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const handleProfileSave = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }
    if (name.trim() === user?.name) {
      toast('No changes to save');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await api.auth.updateProfile({ name: name.trim() });
      applyUserPatch(updated);
      localStorage.setItem('carbontwin_userName', updated.name);
      toast.success('Profile updated');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update profile';
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Both passwords are required');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSavingPassword(true);
    try {
      await api.auth.changePassword(currentPassword, newPassword);
      toast.success('Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not change password';
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeleting(true);
    try {
      await api.auth.deleteAccount();
      clearAuth();
      toast.success('Account deleted');
      window.location.href = '/';
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not delete account';
      toast.error(message);
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm">
          Manage your profile, password and account.
        </p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your display name on leaderboards and reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50"
                disabled={savingProfile || !user}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={user?.email || ''}
                disabled
                className="bg-secondary/20 cursor-not-allowed opacity-70"
              />
            </div>
          </div>
          <Button
            onClick={handleProfileSave}
            disabled={savingProfile || !user}
            className="bg-emerald-600 hover:bg-emerald-500"
          >
            {savingProfile ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Save profile
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            <CardTitle>Password</CardTitle>
          </div>
          <CardDescription>Change the password used to sign in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Current password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="bg-secondary/50"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">New password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-secondary/50"
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirm new password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-secondary/50"
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button onClick={handlePasswordSave} disabled={savingPassword} variant="outline">
            {savingPassword ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" /> Change password
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-destructive/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5 text-destructive" />
            <CardTitle>Danger zone</CardTitle>
          </div>
          <CardDescription>
            Permanently delete your account, activity log and AI suggestions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
            <div className="space-y-2 flex-1 w-full">
              <label className="text-sm font-medium">
                Type <span className="font-mono text-destructive">DELETE</span> to confirm
              </label>
              <Input
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="bg-secondary/50"
              />
            </div>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={handleDeleteAccount}
              disabled={deleting || deleteConfirmation !== 'DELETE'}
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…
                </>
              ) : (
                'Delete account'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        variant="ghost"
        size="sm"
        className="text-xs text-muted-foreground"
        onClick={() => refresh()}
      >
        Refresh data
      </Button>
    </div>
  );
}
