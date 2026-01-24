// Shifts management page
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Search, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

// Mock data - replace with Supabase query: supabase.from("shifts").select("*")
const mockShifts = [
  {
    id: '1',
    driverName: 'John Smith',
    vehiclePlate: 'VAN-001',
    startTime: '2026-01-23T06:00:00',
    endTime: null,
    status: 'active',
    startOdometer: 45230,
    endOdometer: null,
    cleanAtStart: true,
    rubbishRemoved: null,
  },
  {
    id: '2',
    driverName: 'Sarah Johnson',
    vehiclePlate: 'TRK-045',
    startTime: '2026-01-23T07:30:00',
    endTime: null,
    status: 'active',
    startOdometer: 78450,
    endOdometer: null,
    cleanAtStart: true,
    rubbishRemoved: null,
  },
  {
    id: '3',
    driverName: 'Emma Wilson',
    vehiclePlate: 'TRK-089',
    startTime: '2026-01-23T08:00:00',
    endTime: null,
    status: 'active',
    startOdometer: 52110,
    endOdometer: null,
    cleanAtStart: false,
    rubbishRemoved: null,
  },
  {
    id: '4',
    driverName: 'Michael Brown',
    vehiclePlate: 'VAN-012',
    startTime: '2026-01-22T06:00:00',
    endTime: '2026-01-22T18:30:00',
    status: 'completed',
    startOdometer: 34200,
    endOdometer: 34387,
    cleanAtStart: true,
    rubbishRemoved: true,
  },
  {
    id: '5',
    driverName: 'James Davis',
    vehiclePlate: 'VAN-023',
    startTime: '2026-01-22T07:00:00',
    endTime: '2026-01-22T17:00:00',
    status: 'completed',
    startOdometer: 61050,
    endOdometer: 61245,
    cleanAtStart: true,
    rubbishRemoved: true,
  },
];

export function ShiftsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [shifts] = useState(mockShifts);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

  const filteredShifts = shifts.filter((shift) => {
    const matchesSearch =
      shift.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shift.vehiclePlate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' || shift.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const activeShifts = shifts.filter((s) => s.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Shifts</h1>
          <p className="text-gray-400">Track driver shifts and checklists</p>
        </div>
        <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Start New Shift
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Active Shifts</p>
            <p className="text-3xl font-bold text-green-400">{activeShifts}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Today's Shifts</p>
            <p className="text-3xl font-bold text-white">
              {shifts.filter((s) => s.startTime.startsWith('2026-01-23')).length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Avg. Duration</p>
            <p className="text-3xl font-bold text-blue-400">10.5h</p>
          </CardContent>
        </Card>
      </div>

      {/* Shifts table */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-white">All Shifts</CardTitle>
                <CardDescription className="text-gray-400">
                  View shift history and current shifts
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search shifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-[#0F0F0F] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={
                  filterStatus === 'all'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'active' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('active')}
                className={
                  filterStatus === 'active'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Active
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('completed')}
                className={
                  filterStatus === 'completed'
                    ? 'bg-[#FF6B35] hover:bg-[#E55A2B] text-white'
                    : 'border-gray-700 text-gray-400 hover:text-white'
                }
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-800 hover:bg-transparent">
                  <TableHead className="text-gray-400">Driver</TableHead>
                  <TableHead className="text-gray-400">Vehicle</TableHead>
                  <TableHead className="text-gray-400">Start Time</TableHead>
                  <TableHead className="text-gray-400">End Time</TableHead>
                  <TableHead className="text-gray-400">Odometer</TableHead>
                  <TableHead className="text-gray-400">Clean</TableHead>
                  <TableHead className="text-gray-400">Rubbish</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.map((shift) => (
                  <TableRow key={shift.id} className="border-gray-800">
                    <TableCell className="font-medium text-white">{shift.driverName}</TableCell>
                    <TableCell className="text-gray-300">{shift.vehiclePlate}</TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        {format(new Date(shift.startTime), 'MMM dd, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {shift.endTime ? (
                        format(new Date(shift.endTime), 'MMM dd, HH:mm')
                      ) : (
                        <span className="text-yellow-400">In progress</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {shift.startOdometer.toLocaleString()}
                      {shift.endOdometer && ` - ${shift.endOdometer.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      {shift.cleanAtStart ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      {shift.rubbishRemoved === null ? (
                        <span className="text-gray-500">N/A</span>
                      ) : shift.rubbishRemoved ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          shift.status === 'active'
                            ? 'bg-green-950 text-green-400 border-green-900'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }
                      >
                        {shift.status}
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
