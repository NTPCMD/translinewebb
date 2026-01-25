// TEMPLATE: Use this exact pattern for remaining pages
// This example is for VehiclesPage but applies to Shifts, Maintenance, etc.

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Search, Plus, Trash2, Loader } from 'lucide-react';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle, Vehicle, countTotalVehicles, countActiveVehicles } from '@/lib/db/vehicles';

export function VehiclesPage() {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    plate_number: '',
    make: '',
    model: '',
    status: 'active' as const,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Fetch vehicles from database
  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const [vehiclesList, total, active] = await Promise.all([
        listVehicles(),
        countTotalVehicles(),
        countActiveVehicles(),
      ]);
      setVehicles(vehiclesList);
      setTotalCount(total);
      setActiveCount(active);
    } catch (err) {
      console.error('Failed to fetch vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  // Handle create vehicle
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.plate_number || !formData.make || !formData.model) return;

    try {
      setSubmitting(true);
      await createVehicle(formData);
      setFormData({ plate_number: '', make: '', model: '', status: 'active' });
      setShowAddDialog(false);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to create vehicle:', err);
      setError('Failed to create vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      await deleteVehicle(id);
      await fetchVehicles();
    } catch (err) {
      console.error('Failed to delete vehicle:', err);
      setError('Failed to delete vehicle');
    }
  };

  // Filter vehicles by search
  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-2">
          <Loader className="w-8 h-8 text-[#FF6B35] animate-spin" />
          <p className="text-gray-400">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicles</h1>
          <p className="text-gray-400">Manage your vehicle fleet</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <Card className="bg-red-950 border-red-900">
          <CardContent className="p-4">
            <p className="text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Vehicles</p>
            <p className="text-3xl font-bold text-white">{totalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-400">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Maintenance</p>
            <p className="text-3xl font-bold text-yellow-400">
              {vehicles.filter(v => v.status === 'maintenance').length}
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
              <CardDescription className="text-gray-400">View and manage vehicle information</CardDescription>
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
          {filteredVehicles.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No vehicles found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Plate</TableHead>
                    <TableHead className="text-gray-400">Make/Model</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Last Inspection</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id} className="border-gray-800">
                      <TableCell className="font-medium text-white">{vehicle.plate_number}</TableCell>
                      <TableCell className="text-gray-300">{vehicle.make} {vehicle.model}</TableCell>
                      <TableCell>
                        <Badge
                          variant={vehicle.status === 'active' ? 'default' : 'secondary'}
                          className={
                            vehicle.status === 'active'
                              ? 'bg-green-950 text-green-400 border-green-900'
                              : vehicle.status === 'maintenance'
                              ? 'bg-yellow-950 text-yellow-400 border-yellow-900'
                              : 'bg-gray-800 text-gray-400 border-gray-700'
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 text-sm">
                        {vehicle.last_inspection_date
                          ? new Date(vehicle.last_inspection_date).toLocaleDateString()
                          : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            onClick={() => handleDeleteVehicle(vehicle.id)}
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#161616] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Vehicle</DialogTitle>
            <DialogDescription className="text-gray-400">Enter vehicle details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddVehicle} className="space-y-4">
            <div>
              <Label htmlFor="plate" className="text-gray-300">Plate Number</Label>
              <Input
                id="plate"
                value={formData.plate_number}
                onChange={(e) => setFormData({...formData, plate_number: e.target.value})}
                className="bg-[#0F0F0F] border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="make" className="text-gray-300">Make</Label>
              <Input
                id="make"
                value={formData.make}
                onChange={(e) => setFormData({...formData, make: e.target.value})}
                className="bg-[#0F0F0F] border-gray-700 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="model" className="text-gray-300">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData({...formData, model: e.target.value})}
                className="bg-[#0F0F0F] border-gray-700 text-white"
                required
              />
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)} className="border-gray-700">
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#FF6B35] hover:bg-[#E55A2B]">
                {submitting ? 'Creating...' : 'Create Vehicle'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
