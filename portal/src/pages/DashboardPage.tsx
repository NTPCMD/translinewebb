// Main dashboard page with widgets and charts
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Users, Truck, Calendar, Wrench, AlertCircle, TrendingUp } from 'lucide-react';

// Mock data - replace with real Supabase data
const stats = [
  { name: 'Total Drivers', value: '48', icon: Users, change: '+4 this month', color: 'bg-blue-500' },
  { name: 'Active Drivers', value: '12', icon: TrendingUp, change: 'Currently online', color: 'bg-green-500' },
  { name: 'Total Vehicles', value: '36', icon: Truck, change: '34 operational', color: 'bg-purple-500' },
  { name: 'Active Shifts', value: '8', icon: Calendar, change: 'Today', color: 'bg-orange-500' },
  { name: 'Due for Service', value: '5', icon: Wrench, change: '2 overdue', color: 'bg-yellow-500' },
  { name: 'Alerts / Issues', value: '3', icon: AlertCircle, change: 'Requires attention', color: 'bg-red-500' },
];

const driverActivityData = [
  { month: 'Jan', active: 8, total: 42 },
  { month: 'Feb', active: 10, total: 43 },
  { month: 'Mar', active: 12, total: 44 },
  { month: 'Apr', active: 9, total: 45 },
  { month: 'May', active: 11, total: 46 },
  { month: 'Jun', active: 14, total: 48 },
];

const vehicleUsageData = [
  { day: 'Mon', usage: 28 },
  { day: 'Tue', usage: 32 },
  { day: 'Wed', usage: 30 },
  { day: 'Thu', usage: 34 },
  { day: 'Fri', usage: 36 },
  { day: 'Sat', usage: 24 },
  { day: 'Sun', usage: 18 },
];

const maintenanceCostData = [
  { month: 'Jan', cost: 12000 },
  { month: 'Feb', cost: 15000 },
  { month: 'Mar', cost: 11000 },
  { month: 'Apr', cost: 18000 },
  { month: 'May', cost: 13000 },
  { month: 'Jun', cost: 16000 },
];

const recentAlerts = [
  { id: 1, vehicle: 'VAN-001', message: 'Oil change overdue', severity: 'high', time: '2 hours ago' },
  { id: 2, vehicle: 'TRK-045', message: 'Inspection due in 3 days', severity: 'medium', time: '5 hours ago' },
  { id: 3, vehicle: 'VAN-023', message: 'Driver reported minor damage', severity: 'medium', time: '1 day ago' },
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">Overview of your fleet operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="bg-[#161616] border-gray-800">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-400 mb-1">{stat.name}</p>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Driver Activity Chart */}
        <Card className="bg-[#161616] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Driver Activity</CardTitle>
            <CardDescription className="text-gray-400">Active vs total drivers over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {driverActivityData.map((entry) => (
                <div
                  key={entry.month}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#0F0F0F] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-gray-400">{entry.month}</p>
                    <p className="text-xs text-gray-500">Total: {entry.total}</p>
                  </div>
                  <p className="text-sm font-semibold text-white">{entry.active} active</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Usage Chart */}
        <Card className="bg-[#161616] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Vehicle Usage</CardTitle>
            <CardDescription className="text-gray-400">Vehicles in use this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehicleUsageData.map((entry) => (
                <div
                  key={entry.day}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#0F0F0F] px-4 py-3"
                >
                  <p className="text-sm text-gray-400">{entry.day}</p>
                  <p className="text-sm font-semibold text-white">{entry.usage} vehicles</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Cost Trend */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Maintenance Cost Trend</CardTitle>
          <CardDescription className="text-gray-400">Monthly maintenance expenses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceCostData.map((entry) => (
              <div
                key={entry.month}
                className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#0F0F0F] px-4 py-3"
              >
                <p className="text-sm text-gray-400">{entry.month}</p>
                <p className="text-sm font-semibold text-white">${entry.cost.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Alerts</CardTitle>
          <CardDescription className="text-gray-400">Issues requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-gray-800"
              >
                <div className="flex items-center gap-4">
                  <AlertCircle
                    className={`w-5 h-5 ${
                      alert.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-white">{alert.vehicle}</p>
                    <p className="text-xs text-gray-400">{alert.message}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={alert.severity === 'high' ? 'destructive' : 'secondary'}
                    className={
                      alert.severity === 'high'
                        ? 'bg-red-950 text-red-400 border-red-900'
                        : 'bg-yellow-950 text-yellow-400 border-yellow-900'
                    }
                  >
                    {alert.severity}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
