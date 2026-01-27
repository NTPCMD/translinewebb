// Drivers management page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Search, UserPlus, Trash2, Loader, Eye, MessageSquare, Ban, MapPin } from 'lucide-react';
import { listDrivers, createDriver, deleteDriver, Driver, countTotalDrivers, countActiveDrivers } from '@/lib/db/drivers';
import { listVehicles, updateVehicle, Vehicle } from '@/lib/db/vehicles';

export function DriversPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [editVehicleDialog, setEditVehicleDialog] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [editVehicleId, setEditVehicleId] = useState('');

  // Fetch drivers on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [driversList, total, active, vehiclesList] = await Promise.all([
          listDrivers(),
          countTotalDrivers(),
          countActiveDrivers(),
          listVehicles(),
        ]);
        setDrivers(driversList);
        setTotalCount(total);
        setActiveCount(active);
        setVehicles(vehiclesList);
        setError(null);
      } catch (err) {
        setError('Failed to load drivers or vehicles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDrivers = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.phone.includes(searchQuery)
  );

  const handleAddDriver = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required');
      return;
    }
    // Check for duplicate email
    if (drivers.some((d) => d.email.toLowerCase() === formData.email.toLowerCase())) {
      setError('A driver with this email already exists');
      return;
    }
    try {
      // Register driver in Supabase Auth
      const { error: signUpError } = await import('@/lib/supabase').then(({ supabase }) =>
        supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: { data: { name: formData.name } },
        })
      );
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // Create driver in DB
      const newDriver = await createDriver({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: 'active',
      });
      setDrivers([...drivers, newDriver]);
      setTotalCount(totalCount + 1);
      setDialogOpen(false);
      setFormData({ name: '', email: '', password: '', phone: '' });
      setError(null);
    } catch (err) {
      setError('Failed to create driver');
      console.error(err);
    }
  };

  const handleDeleteClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDriver) return;

    try {
      await deleteDriver(selectedDriver.id);
      setDrivers(drivers.filter((d) => d.id !== selectedDriver.id));
      setTotalCount(Math.max(0, totalCount - 1));
      setActiveCount(Math.max(0, activeCount - 1));
      setDeleteDialog(false);
      setSelectedDriver(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete driver');
      console.error(err);
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
          <h1 className="text-3xl font-bold text-white mb-2">Drivers</h1>
          <p className="text-gray-400">Manage your driver fleet</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Total Drivers</p>
            <p className="text-3xl font-bold text-white">{loading ? '-' : totalCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Active Drivers</p>
            <p className="text-3xl font-bold text-green-400">{loading ? '-' : activeCount}</p>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <p className="text-sm text-gray-400 mb-1">Offline</p>
            <p className="text-3xl font-bold text-blue-400">
              {loading ? '-' : totalCount - activeCount}
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
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-8 h-8 text-[#FF6B35] animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800 hover:bg-transparent">
                    <TableHead className="text-gray-400">Driver Name</TableHead>
                    <TableHead className="text-gray-400">Email</TableHead>
                    <TableHead className="text-gray-400">Phone</TableHead>
                    <TableHead className="text-gray-400">Vehicle</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrivers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No drivers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDrivers.map((driver) => (
                      <TableRow key={driver.id} className="border-gray-800">
                        <TableCell className="font-medium text-white">{driver.name}</TableCell>
                        <TableCell className="text-gray-300">{driver.email}</TableCell>
                        <TableCell className="text-gray-300">{driver.phone}</TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            const vehicle = vehicles.find((v) => v.assigned_driver_id === driver.id);
                            return vehicle ? vehicle.plate_number : <span className="text-gray-500">Unassigned</span>;
                          })()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-blue-400 h-8 w-8 p-0"
                              onClick={() => {
                                setEditDriver(driver);
                                const vehicle = vehicles.find((v) => v.assigned_driver_id === driver.id);
                                setEditVehicleId(vehicle ? vehicle.id : '');
                                setEditVehicleDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                              onClick={() => handleDeleteClick(driver)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                      {/* Edit Vehicle Assignment Dialog */}
                      <Dialog open={editVehicleDialog} onOpenChange={setEditVehicleDialog}>
                        <DialogContent className="bg-[#161616] border-gray-800">
                          <DialogHeader>
                            <DialogTitle className="text-white">Change Assigned Vehicle</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              Assign a different vehicle to this driver
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label className="text-gray-300">Vehicle</Label>
                              <select
                                value={editVehicleId}
                                onChange={(e) => setEditVehicleId(e.target.value)}
                                className="w-full bg-[#0F0F0F] border border-gray-700 text-white p-2 rounded"
                              >
                                <option value="">-- None --</option>
                                {vehicles.map((vehicle) => (
                                  <option key={vehicle.id} value={vehicle.id}>
                                    {vehicle.plate_number} ({vehicle.make} {vehicle.model})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <Button
                              onClick={async () => {
                                if (!editDriver) return;
                                try {
                                  // Unassign this driver from all vehicles
                                  await Promise.all(
                                    vehicles
                                      .filter((v) => v.assigned_driver_id === editDriver.id)
                                      .map((v) => updateVehicle(v.id, { assigned_driver_id: null }))
                                  );
                                  // Assign to selected vehicle
                                  if (editVehicleId) {
                                    await updateVehicle(editVehicleId, { assigned_driver_id: editDriver.id });
                                  }
                                  // Refresh vehicles state
                                  const updatedVehicles = await listVehicles();
                                  setVehicles(updatedVehicles);
                                  setEditVehicleDialog(false);
                                } catch (err) {
                                  setError('Failed to update vehicle assignment');
                                }
                              }}
                              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
                            >
                              Save
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Driver Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#161616] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Add Driver</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new driver in the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Full Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Password</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Password"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Phone (optional)</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 234-567-8900"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleAddDriver}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
            >
              Create Driver
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-[#161616] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Driver</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete {selectedDriver?.name}? This action cannot be undone.
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
