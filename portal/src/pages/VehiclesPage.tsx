// Vehicles management page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Search, Plus, Eye, Wrench, Calendar, Trash2, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { listVehicles, createVehicle, deleteVehicle, Vehicle, countTotalVehicles, countActiveVehicles, countVehiclesInMaintenance } from '@/lib/db/vehicles';

export function VehiclesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [maintenanceCount, setMaintenanceCount] = useState(0);
  const [formData, setFormData] = useState({
    plateNumber: '',
    make: '',
    model: '',
    status: 'active',
  });

  // Fetch vehicles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesList, total, active, maintenance] = await Promise.all([
          listVehicles(),
          countTotalVehicles(),
          countActiveVehicles(),
          countVehiclesInMaintenance(),
        ]);
        setVehicles(vehiclesList);
        setTotalCount(total);
        setActiveCount(active);
        setMaintenanceCount(maintenance);
        setError(null);
      } catch (err) {
        setError('Failed to load vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVehicle = async () => {
    if (!formData.plateNumber || !formData.make || !formData.model) {
      setError('All fields are required');
      return;
    }

    try {
      const newVehicle = await createVehicle({
        plateNumber: formData.plateNumber,
        make: formData.make,
        model: formData.model,
        status: formData.status as 'active' | 'maintenance' | 'inactive',
      });
      setVehicles([...vehicles, newVehicle]);
      setTotalCount(totalCount + 1);
      if (formData.status === 'active') setActiveCount(activeCount + 1);
      if (formData.status === 'maintenance') setMaintenanceCount(maintenanceCount + 1);
      setDialogOpen(false);
      setFormData({ plateNumber: '', make: '', model: '', status: 'active' });
      setError(null);
    } catch (err) {
      setError('Failed to create vehicle');
      console.error(err);
    }
  };

  const handleDeleteClick = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedVehicle) return;

    try {
      await deleteVehicle(selectedVehicle.id);
      setVehicles(vehicles.filter((v) => v.id !== selectedVehicle.id));
      setTotalCount(Math.max(0, totalCount - 1));
      if (selectedVehicle.status === 'active') setActiveCount(Math.max(0, activeCount - 1));
      if (selectedVehicle.status === 'maintenance') setMaintenanceCount(Math.max(0, maintenanceCount - 1));
      setDeleteDialog(false);
      setSelectedVehicle(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete vehicle');
      console.error(err);
    }
  };

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
      {/* Error message */}
      {error && (
        <Card className="bg-red-950 border-red-900">
          <CardContent className="p-4 text-red-400">{error}</CardContent>
        </Card>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Vehicles</h1>
          <p className="text-gray-400">Manage your vehicle fleet</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Vehicles</p>
            <p className="text-3xl font-bold text-white">{loading ? '-' : totalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Active</p>
            <p className="text-3xl font-bold text-green-400">{loading ? '-' : activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">In Maintenance</p>
            <p className="text-3xl font-bold text-yellow-400">{loading ? '-' : maintenanceCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Inactive</p>
            <p className="text-3xl font-bold text-blue-400">
              {loading ? '-' : totalCount - activeCount - maintenanceCount}
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
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 text-[#FF6B35] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Plate Number</TableHead>
                    <TableHead className="text-gray-400">Make / Model</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No vehicles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="border-gray-800">
                        <TableCell className="font-medium text-white">{vehicle.plateNumber}</TableCell>
                        <TableCell className="text-gray-300">
                          {vehicle.make} {vehicle.model}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(vehicle.status)}>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                              onClick={() => handleDeleteClick(vehicle)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Vehicle Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#161616] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Vehicle</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new vehicle to the fleet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Plate Number</Label>
              <Input
                value={formData.plateNumber}
                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                placeholder="VAN-001"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Make</Label>
              <Input
                value={formData.make}
                onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                placeholder="Ford"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Model</Label>
              <Input
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Transit"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleAddVehicle}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
            >
              Create Vehicle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-[#161616] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Vehicle</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedVehicle?.plateNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4">
            <AlertDialogCancel className="bg-gray-800 text-gray-300 hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
