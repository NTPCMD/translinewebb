// Settings page for admin configuration
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Settings as SettingsIcon, User, Database, Shield, Bell, CheckCircle, XCircle } from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [supabaseConnected] = React.useState(false); // Mock - check actual connection

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage admin settings and configuration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Profile */}
        <Card className="bg-[#161616] border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="w-5 h-5" />
              Admin Profile
            </CardTitle>
            <CardDescription className="text-gray-400">
              Update your admin account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-[#0F0F0F] border-gray-700 text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-white">Role</Label>
              <Input
                id="role"
                value="Administrator"
                disabled
                className="bg-[#0F0F0F] border-gray-700 text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-white">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-white">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-white">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
              />
            </div>

            <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
              Update Password
            </Button>
          </CardContent>
        </Card>

        {/* System Status */}
        <div className="space-y-6">
          <Card className="bg-[#161616] border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Database className="w-5 h-5" />
                System Status
              </CardTitle>
              <CardDescription className="text-gray-400">
                Connection and health status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Supabase</p>
                  <p className="text-xs text-gray-500">Database connection</p>
                </div>
                <Badge
                  className={
                    supabaseConnected
                      ? 'bg-green-950 text-green-400 border-green-900'
                      : 'bg-red-950 text-red-400 border-red-900'
                  }
                >
                  {supabaseConnected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </>
                  )}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">API Server</p>
                  <p className="text-xs text-gray-500">Backend services</p>
                </div>
                <Badge className="bg-green-950 text-green-400 border-green-900">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Operational
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">GPS Tracking</p>
                  <p className="text-xs text-gray-500">Real-time location</p>
                </div>
                <Badge className="bg-yellow-950 text-yellow-400 border-yellow-900">
                  Pending Setup
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#161616] border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Shield className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription className="text-gray-400">
                Security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">Two-Factor Auth</p>
                <Badge className="bg-gray-800 text-gray-400 border-gray-700">
                  Disabled
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm text-white">Session Timeout</p>
                <Badge className="bg-blue-950 text-blue-400 border-blue-900">
                  8 hours
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Notifications Settings */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Bell className="w-5 h-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription className="text-gray-400">
            Configure notification settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white">Email Notifications</h3>
              <div className="space-y-3">
                {[
                  'Vehicle maintenance due',
                  'Driver incident reports',
                  'System alerts',
                  'Daily summary reports',
                ].map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-4 h-4 rounded border-gray-700 bg-[#0F0F0F] text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <span className="text-sm text-gray-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-white">Push Notifications</h3>
              <div className="space-y-3">
                {[
                  'Critical alerts',
                  'New driver logs',
                  'Shift start/end',
                  'Maintenance overdue',
                ].map((item) => (
                  <label key={item} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked={item === 'Critical alerts'}
                      className="w-4 h-4 rounded border-gray-700 bg-[#0F0F0F] text-[#FF6B35] focus:ring-[#FF6B35]"
                    />
                    <span className="text-sm text-gray-300">{item}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
              Save Preferences
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Setup Instructions */}
      {!supabaseConnected && (
        <Card className="bg-[#161616] border-yellow-900/50 border-2">
          <CardHeader>
            <CardTitle className="text-yellow-400">Supabase Setup Required</CardTitle>
            <CardDescription className="text-gray-400">
              Connect your Supabase database to enable full functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-300">
              <p>To connect Supabase:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Create a Supabase project at <a href="https://supabase.com" className="text-[#FF6B35] underline" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                <li>Add your Supabase URL and anon key to environment variables</li>
                <li>Run the provided SQL migrations to create database tables</li>
                <li>Restart the application</li>
              </ol>
              <div className="mt-4 p-4 bg-[#0F0F0F] rounded-lg border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">Environment Variables:</p>
                <code className="text-xs text-green-400 block">
                  VITE_SUPABASE_URL=your-project-url
                  <br />
                  VITE_SUPABASE_ANON_KEY=your-anon-key
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
