// Maintenance tracking and scheduling page
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Search, Plus, Eye, Wrench, AlertTriangle, CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

// Mock data - replace with Supabase queries
const mockMaintenanceStatus = [
  {
    id: '1',
    vehiclePlate: 'VAN-001',
    lastServiceDate: '2025-12-15',
    lastServiceOdometer: 44500,
    nextServiceOdometer: 49500,
    nextServiceDate: '2026-02-15',
    currentOdometer: 45230,
    status: 'ok',
  },
  {
    id: '2',
    vehiclePlate: 'TRK-045',
    lastServiceDate: '2025-11-20',
    lastServiceOdometer: 75000,
    nextServiceOdometer: 80000,
    nextServiceDate: '2026-01-20',
    currentOdometer: 78450,
    status: 'due_soon',
  },
  {
    id: '3',
    vehiclePlate: 'VAN-023',
    lastServiceDate: '2025-10-10',
    lastServiceOdometer: 58000,
    nextServiceOdometer: 63000,
    nextServiceDate: '2025-12-10',
    currentOdometer: 64200,
    status: 'overdue',
  },
  {
    id: '4',
    vehiclePlate: 'TRK-089',
    lastServiceDate: '2026-01-05',
    lastServiceOdometer: 51000,
    nextServiceOdometer: 56000,
    nextServiceDate: '2026-03-05',
    currentOdometer: 52110,
    status: 'ok',
  },
];

const mockMaintenanceLogs = [
  {
    id: '1',
    vehiclePlate: 'VAN-001',
    serviceType: 'Oil Change',
    serviceDate: '2025-12-15',
    odometer: 44500,
    cost: 450,
    provider: 'AutoCare Services',
  },
  {
    id: '2',
    vehiclePlate: 'TRK-045',
    serviceType: 'Brake Inspection',
    serviceDate: '2025-11-20',
    odometer: 75000,
    cost: 850,
    provider: 'Fleet Maintenance Co.',
  },
  {
    id: '3',
    vehiclePlate: 'VAN-023',
    serviceType: 'Full Service',
    serviceDate: '2025-10-10',
    odometer: 58000,
    cost: 1200,
    provider: 'AutoCare Services',
  },
];

export function MaintenancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceStatus] = useState(mockMaintenanceStatus);
  const [maintenanceLogs] = useState(mockMaintenanceLogs);

  const filteredStatus = maintenanceStatus.filter((item) =>
    item.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogs = maintenanceLogs.filter((log) =>
    log.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.serviceType.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return { className: 'bg-green-950 text-green-400 border-green-900', label: 'OK', icon: CheckCircle };
      case 'due_soon':
        return { className: 'bg-yellow-950 text-yellow-400 border-yellow-900', label: 'Due Soon', icon: AlertTriangle };
      case 'overdue':
        return { className: 'bg-red-950 text-red-400 border-red-900', label: 'Overdue', icon: AlertTriangle };
      default:
        return { className: 'bg-gray-800 text-gray-400 border-gray-700', label: 'Unknown', icon: AlertTriangle };
    }
  };

  const totalCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
  const overdueCount = maintenanceStatus.filter((s) => s.status === 'overdue').length;
  const dueSoonCount = maintenanceStatus.filter((s) => s.status === 'due_soon').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance</h1>
          <p className="text-gray-400">Track vehicle maintenance and service schedules</p>
        </div>
        <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Schedule Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-red-950 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Overdue</p>
                <p className="text-3xl font-bold text-red-400">{overdueCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-950 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Due Soon</p>
                <p className="text-3xl font-bold text-yellow-400">{dueSoonCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-950 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Up to Date</p>
                <p className="text-3xl font-bold text-green-400">
                  {maintenanceStatus.filter((s) => s.status === 'ok').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Cost</p>
                <p className="text-3xl font-bold text-blue-400">${(totalCost / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="status" className="space-y-6">
        <TabsList className="bg-[#161616] border border-gray-800">
          <TabsTrigger value="status" className="data-[state=active]:bg-[#FF6B35]">
            Service Status
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-[#FF6B35]">
            Service History
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-[#FF6B35]">
            Upcoming Services
          </TabsTrigger>
        </TabsList>

        {/* Service Status Tab */}
        <TabsContent value="status" className="space-y-4">
          <Card className="bg-[#161616] border-gray-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Vehicle Maintenance Status</CardTitle>
                  <CardDescription className="text-gray-400">
                    Current maintenance status for all vehicles
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Vehicle</TableHead>
                      <TableHead className="text-gray-400">Last Service</TableHead>
                      <TableHead className="text-gray-400">Current Odometer</TableHead>
                      <TableHead className="text-gray-400">Next Service Due</TableHead>
                      <TableHead className="text-gray-400">KM Until Service</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStatus.map((item) => {
                      const statusInfo = getStatusBadge(item.status);
                      const StatusIcon = statusInfo.icon;
                      const kmUntilService = item.nextServiceOdometer - item.currentOdometer;

                      return (
                        <TableRow key={item.id} className="border-gray-800">
                          <TableCell className="font-medium text-white">{item.vehiclePlate}</TableCell>
                          <TableCell className="text-gray-300">
                            <div className="space-y-1">
                              <div>{format(new Date(item.lastServiceDate), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-gray-500">
                                @ {item.lastServiceOdometer.toLocaleString()} km
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {item.currentOdometer.toLocaleString()} km
                          </TableCell>
                          <TableCell className="text-gray-300">
                            <div className="space-y-1">
                              <div>{format(new Date(item.nextServiceDate), 'MMM dd, yyyy')}</div>
                              <div className="text-xs text-gray-500">
                                @ {item.nextServiceOdometer.toLocaleString()} km
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                kmUntilService < 0
                                  ? 'text-red-400'
                                  : kmUntilService < 1000
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }`}
                            >
                              {kmUntilService < 0
                                ? `${Math.abs(kmUntilService)} km overdue`
                                : `${kmUntilService.toLocaleString()} km`}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusInfo.className}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white h-8 w-8 p-0"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-400 hover:text-white h-8 w-8 p-0"
                              >
                                <Wrench className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card className="bg-[#161616] border-gray-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-white">Service History</CardTitle>
                  <CardDescription className="text-gray-400">
                    Past maintenance and service records
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search history..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Vehicle</TableHead>
                      <TableHead className="text-gray-400">Service Type</TableHead>
                      <TableHead className="text-gray-400">Date</TableHead>
                      <TableHead className="text-gray-400">Odometer</TableHead>
                      <TableHead className="text-gray-400">Provider</TableHead>
                      <TableHead className="text-gray-400">Cost</TableHead>
                      <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="border-gray-800">
                        <TableCell className="font-medium text-white">{log.vehiclePlate}</TableCell>
                        <TableCell className="text-gray-300">{log.serviceType}</TableCell>
                        <TableCell className="text-gray-300">
                          {format(new Date(log.serviceDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-gray-300">
                          {log.odometer.toLocaleString()} km
                        </TableCell>
                        <TableCell className="text-gray-300">{log.provider}</TableCell>
                        <TableCell className="text-gray-300 font-medium">
                          ${log.cost.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-white h-8 w-8 p-0"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Services Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="bg-[#161616] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Upcoming Scheduled Services</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage upcoming maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">No upcoming services scheduled</p>
                <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Schedule Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
