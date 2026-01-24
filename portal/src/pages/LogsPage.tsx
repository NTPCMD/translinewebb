// Driver logs and incident reports page
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Search, Eye, AlertCircle, Wrench, AlertTriangle, FileText } from 'lucide-react';
import { format } from 'date-fns';

// Mock data - replace with Supabase query: supabase.from("driver_logs").select("*")
const mockLogs = [
  {
    id: '1',
    driverName: 'John Smith',
    vehiclePlate: 'VAN-001',
    logType: 'incident',
    description: 'Minor scrape on left side mirror while parking',
    createdAt: '2026-01-23T10:30:00',
    severity: 'low',
  },
  {
    id: '2',
    driverName: 'Sarah Johnson',
    vehiclePlate: 'TRK-045',
    logType: 'maintenance_issue',
    description: 'Strange noise from engine when accelerating',
    createdAt: '2026-01-23T08:15:00',
    severity: 'medium',
  },
  {
    id: '3',
    driverName: 'Michael Brown',
    vehiclePlate: 'VAN-012',
    logType: 'general',
    description: 'Completed delivery route without issues',
    createdAt: '2026-01-22T17:00:00',
    severity: 'low',
  },
  {
    id: '4',
    driverName: 'Emma Wilson',
    vehiclePlate: 'TRK-089',
    logType: 'accident',
    description: 'Minor collision with parked vehicle - police report filed',
    createdAt: '2026-01-22T14:30:00',
    severity: 'high',
  },
  {
    id: '5',
    driverName: 'James Davis',
    vehiclePlate: 'VAN-023',
    logType: 'maintenance_issue',
    description: 'Brake pedal feels soft, needs inspection',
    createdAt: '2026-01-22T09:00:00',
    severity: 'high',
  },
];

export function LogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'incident' | 'maintenance_issue' | 'accident' | 'general'>('all');
  const [logs] = useState(mockLogs);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || log.logType === filterType;

    return matchesSearch && matchesType;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'incident':
        return AlertCircle;
      case 'maintenance_issue':
        return Wrench;
      case 'accident':
        return AlertTriangle;
      default:
        return FileText;
    }
  };

  const getLogTypeBadge = (type: string) => {
    switch (type) {
      case 'incident':
        return 'bg-orange-950 text-orange-400 border-orange-900';
      case 'maintenance_issue':
        return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      case 'accident':
        return 'bg-red-950 text-red-400 border-red-900';
      default:
        return 'bg-blue-950 text-blue-400 border-blue-900';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-950 text-red-400 border-red-900';
      case 'medium':
        return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Logs</h1>
        <p className="text-gray-400">Driver logs, incidents, and reports</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Logs</p>
            <p className="text-3xl font-bold text-white">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Incidents</p>
            <p className="text-3xl font-bold text-orange-400">
              {logs.filter((l) => l.logType === 'incident').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Maintenance Issues</p>
            <p className="text-3xl font-bold text-yellow-400">
              {logs.filter((l) => l.logType === 'maintenance_issue').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Accidents</p>
            <p className="text-3xl font-bold text-red-400">
              {logs.filter((l) => l.logType === 'accident').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Logs table */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-white">All Logs</CardTitle>
                <CardDescription className="text-gray-400">
                  View driver-submitted logs and reports
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterType('all')}
                className={
                  filterType === 'all'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                All
              </Button>
              <Button
                variant={filterType === 'incident' ? 'default' : 'outline'}
                onClick={() => setFilterType('incident')}
                className={
                  filterType === 'incident'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Incidents
              </Button>
              <Button
                variant={filterType === 'maintenance_issue' ? 'default' : 'outline'}
                onClick={() => setFilterType('maintenance_issue')}
                className={
                  filterType === 'maintenance_issue'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Maintenance
              </Button>
              <Button
                variant={filterType === 'accident' ? 'default' : 'outline'}
                onClick={() => setFilterType('accident')}
                className={
                  filterType === 'accident'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Accidents
              </Button>
              <Button
                variant={filterType === 'general' ? 'default' : 'outline'}
                onClick={() => setFilterType('general')}
                className={
                  filterType === 'general'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                General
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Type</TableHead>
                  <TableHead className="text-gray-400">Driver</TableHead>
                  <TableHead className="text-gray-400">Vehicle</TableHead>
                  <TableHead className="text-gray-400">Description</TableHead>
                  <TableHead className="text-gray-400">Date/Time</TableHead>
                  <TableHead className="text-gray-400">Severity</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => {
                  const Icon = getLogIcon(log.logType);
                  return (
                    <TableRow key={log.id} className="border-gray-800">
                      <TableCell>
                        <Badge className={getLogTypeBadge(log.logType)}>
                          <Icon className="w-3 h-3 mr-1" />
                          {log.logType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-white">{log.driverName}</TableCell>
                      <TableCell className="text-gray-300">{log.vehiclePlate}</TableCell>
                      <TableCell className="text-gray-300 max-w-xs truncate">
                        {log.description}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {format(new Date(log.createdAt), 'MMM dd, HH:mm')}
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityBadge(log.severity)}>
                          {log.severity}
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
    </div>
  );
}
