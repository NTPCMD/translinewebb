// Drivers management page
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Search, UserPlus, Eye, Ban, MessageSquare, MapPin } from 'lucide-react';

// Mock data - replace with Supabase query: supabase.from("drivers").select("*")
const mockDrivers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@transline.com',
    phone: '+1 234-567-8901',
    status: 'online',
    lastGpsLat: -37.8136,
    lastGpsLng: 144.9631,
    currentShiftId: 'shift-1',
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@transline.com',
    phone: '+1 234-567-8902',
    status: 'online',
    lastGpsLat: -37.8200,
    lastGpsLng: 144.9700,
    currentShiftId: 'shift-2',
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'm.brown@transline.com',
    phone: '+1 234-567-8903',
    status: 'offline',
    lastGpsLat: null,
    lastGpsLng: null,
    currentShiftId: null,
  },
  {
    id: '4',
    name: 'Emma Wilson',
    email: 'emma.w@transline.com',
    phone: '+1 234-567-8904',
    status: 'online',
    lastGpsLat: -37.8100,
    lastGpsLng: 144.9600,
    currentShiftId: 'shift-3',
  },
  {
    id: '5',
    name: 'James Davis',
    email: 'james.d@transline.com',
    phone: '+1 234-567-8905',
    status: 'offline',
    lastGpsLat: null,
    lastGpsLng: null,
    currentShiftId: null,
  },
];

export function DriversPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers] = useState(mockDrivers);

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Drivers</h1>
          <p className="text-gray-400">Manage your driver fleet</p>
        </div>
        <Button className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Drivers</p>
            <p className="text-3xl font-bold text-white">{drivers.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Online Now</p>
            <p className="text-3xl font-bold text-green-400">
              {drivers.filter((d) => d.status === 'online').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">On Active Shift</p>
            <p className="text-3xl font-bold text-blue-400">
              {drivers.filter((d) => d.currentShiftId).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Drivers table */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white">All Drivers</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage driver information
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search drivers..."
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
                  <TableHead className="text-gray-400">Driver Name</TableHead>
                  <TableHead className="text-gray-400">Email</TableHead>
                  <TableHead className="text-gray-400">Phone</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Location</TableHead>
                  <TableHead className="text-gray-400">Shift</TableHead>
                  <TableHead className="text-gray-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id} className="border-gray-800">
                    <TableCell className="font-medium text-white">{driver.name}</TableCell>
                    <TableCell className="text-gray-300">{driver.email}</TableCell>
                    <TableCell className="text-gray-300">{driver.phone}</TableCell>
                    <TableCell>
                      <Badge
                        variant={driver.status === 'online' ? 'default' : 'secondary'}
                        className={
                          driver.status === 'online'
                            ? 'bg-green-950 text-green-400 border-green-900'
                            : 'bg-gray-800 text-gray-400 border-gray-700'
                        }
                      >
                        {driver.status === 'online' && (
                          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
                        )}
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {driver.lastGpsLat && driver.lastGpsLng ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4 text-[#FF6B35]" />
                          <span className="text-xs">
                            {driver.lastGpsLat.toFixed(4)}, {driver.lastGpsLng.toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {driver.currentShiftId ? (
                        <Badge className="bg-blue-950 text-blue-400 border-blue-900">
                          Active
                        </Badge>
                      ) : (
                        <span className="text-gray-500">Off duty</span>
                      )}
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
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <Ban className="w-4 h-4" />
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
