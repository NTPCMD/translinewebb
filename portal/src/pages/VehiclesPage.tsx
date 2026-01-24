// Vehicles management page
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Search, Plus, Eye, Wrench, Calendar } from 'lucide-react';
import { format } from 'date-fns';

// Mock data - replace with Supabase query: supabase.from("vehicles").select("*")
const mockVehicles = [
  {
    id: '1',
    plateNumber: 'VAN-001',
    make: 'Ford',
    model: 'Transit',
    assignedDriverId: '1',
    assignedDriverName: 'John Smith',
    status: 'active',
    lastInspectionDate: '2026-01-15',
  },
  {
    id: '2',
    plateNumber: 'TRK-045',
    make: 'Mercedes',
    model: 'Sprinter',
    assignedDriverId: '2',
    assignedDriverName: 'Sarah Johnson',
    status: 'active',
    lastInspectionDate: '2026-01-10',
  },
  {
    id: '3',
    plateNumber: 'VAN-023',
    make: 'Renault',
    model: 'Master',
    assignedDriverId: null,
    assignedDriverName: null,
    status: 'maintenance',
    lastInspectionDate: '2025-12-20',
  },
  {
    id: '4',
    plateNumber: 'TRK-089',
    make: 'Ford',
    model: 'Transit',
    assignedDriverId: '4',
    assignedDriverName: 'Emma Wilson',
    status: 'active',
    lastInspectionDate: '2026-01-18',
  },
  {
    id: '5',
    plateNumber: 'VAN-012',
    make: 'Mercedes',
    model: 'Vito',
    assignedDriverId: null,
    assignedDriverName: null,
    status: 'inactive',
    lastInspectionDate: '2025-11-30',
  },
];

export function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles] = useState(mockVehicles);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-950 text-green-400 border-green-900';
      case 'maintenance':
        return 'bg-yellow-950 text-yellow-400 border-yellow-900';
      case 'inactive':
        return 'bg-gray-800 text-gray-400 border-gray-700';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicles</h1>
          <p className="text-gray-400">Manage your vehicle fleet</p>
        </div>
        <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Vehicles</p>
            <p className="text-3xl font-bold text-white">{vehicles.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-400">
              {vehicles.filter((v) => v.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">In Maintenance</p>
            <p className="text-3xl font-bold text-yellow-400">
              {vehicles.filter((v) => v.status === 'maintenance').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Available</p>
            <p className="text-3xl font-bold text-blue-400">
              {vehicles.filter((v) => !v.assignedDriverId && v.status === 'active').length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Vehicles table */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white">All Vehicles</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage vehicle information
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
                  <TableHead className="text-gray-400">Plate Number</TableHead>
                  <TableHead className="text-gray-400">Make / Model</TableHead>
                  <TableHead className="text-gray-400">Assigned Driver</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Last Inspection</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id} className="border-gray-800">
                    <TableCell className="font-medium text-white">{vehicle.plateNumber}</TableCell>
                    <TableCell className="text-gray-300">
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {vehicle.assignedDriverName || (
                        <span className="text-gray-500">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        {format(new Date(vehicle.lastInspectionDate), 'MMM dd, yyyy')}
                      </div>
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
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
