// Drivers management page
import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Search, UserPlus, Trash2, Loader, Eye, Key } from 'lucide-react';
import { deleteDriver } from '@/lib/db/drivers';
import { listVehicles, assignDriverToVehicle, Vehicle } from '@/lib/db/vehicles';
import { supabase } from '@/lib/supabase';
import { fetchDriversFull, isDriverRow } from '@/lib/drivers';
import { createClient } from '@supabase/supabase-js';
import { getEnv } from '@/lib/env';

export function DriversPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers, setDrivers] = useState<any[]>([]); // profiles
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
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordDriver, setPasswordDriver] = useState<Driver | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const findVehicleForDriver = (driver: Driver) =>
    vehicles.find(
      (vehicle) =>
        vehicle.assigned_driver_id === driver.driver_id ||
        vehicle.assigned_driver_id === driver.auth_user_id
    );
  const adminClient = useMemo(() => {
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) return null;
    return createClient(getEnv('VITE_SUPABASE_URL'), serviceRoleKey);
  }, []);

  // Fetch drivers (from profiles) and vehicles on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesList, driversFull] = await Promise.all([
          listVehicles(),
          fetchDriversFull(),
        ]);
        // Filter to only drivers, using a robust helper that falls back if `role` is missing
        const onlyDrivers = (driversFull ?? []).filter(isDriverRow);
        setDrivers(onlyDrivers);
        console.log('DriversPage: loaded drivers count=', onlyDrivers.length);
        setTotalCount(onlyDrivers.length ?? 0);
        setActiveCount(onlyDrivers.filter((d: any) => d.status === 'active').length);
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
      (driver.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        driver.phone?.includes(searchQuery))
  );

  // Add driver via Supabase Auth (creates profile automatically)
  const handleAddDriver = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, email, and password are required');
      return;
    }
    // Check for duplicate email
    if (drivers.some((d) => d.email?.toLowerCase() === formData.email.toLowerCase())) {
      setError('A driver with this email already exists');
      return;
    }
    try {
      // Register driver in Supabase Auth (creates profile)
      const { error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: { data: { full_name: formData.name, phone: formData.phone, status: 'active' } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // Refetch drivers list from drivers_full
      const driversFull = await fetchDriversFull();
      const onlyDrivers = (driversFull ?? []).filter((d: any) => d.role === 'driver');
      setDrivers(onlyDrivers);
      setTotalCount(onlyDrivers.length);
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
      // Soft delete the associated profile by using auth_user_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'inactive' })
        .eq('id', selectedDriver.auth_user_id);
      if (updateError) throw updateError;
      setDrivers(drivers.map((d) => d.driver_id === selectedDriver.driver_id ? { ...d, status: 'inactive' } : d));
      setActiveCount(Math.max(0, activeCount - 1));
      setDeleteDialog(false);
      setSelectedDriver(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete driver');
      console.error(err);
    }
  };

  const handlePasswordReset = async () => {
    if (!passwordDriver) return;
    if (!newPassword || !confirmPassword) {
      setError('Please enter and confirm the new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const authUserId = passwordDriver.auth_user_id;
    const email = passwordDriver.profile_email ?? passwordDriver.email;
    if (!authUserId && !email) {
      setError('Selected driver is missing auth user details.');
      return;
    }
    try {
      setPasswordSaving(true);
      if (!adminClient) {
        if (!email) {
          setError('Driver email is required to send a reset link.');
          return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
        if (resetError) throw resetError;
        setError('Service role key missing. Sent a reset link to the driver instead.');
        setPasswordDialogOpen(false);
        setNewPassword('');
        setConfirmPassword('');
        return;
      }
      if (!authUserId) {
        setError('Driver auth user id is required to set a password.');
        return;
      }
      const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: newPassword,
      });
      if (updateError) throw updateError;
      setPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
    } catch (err: any) {
      setError(err?.message ? `Failed to set password: ${err.message}` : 'Failed to set password.');
    } finally {
      setPasswordSaving(false);
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
                    <>
                      {filteredDrivers.map((driver) => (
                      <TableRow key={driver.driver_id} className="border-gray-800">
                        <TableCell className="font-medium text-white">{driver.full_name ?? driver.profile_email ?? driver.email ?? driver.driver_id}</TableCell>
                        <TableCell className="text-gray-300">{driver.profile_email ?? driver.email}</TableCell>
                        <TableCell className="text-gray-300">{driver.phone}</TableCell>
                        <TableCell className="text-gray-300">
                          {(() => {
                            const vehicle = findVehicleForDriver(driver);
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
                                const vehicle = findVehicleForDriver(driver);
                                setEditVehicleId(vehicle ? vehicle.id : '');
                                setEditVehicleDialog(true);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-[#FF6B35] h-8 w-8 p-0"
                              onClick={() => {
                                setPasswordDriver(driver);
                                setNewPassword('');
                                setConfirmPassword('');
                                setPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="w-4 h-4" />
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
                      ))}
                    </>
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
                                  // Assign to selected vehicle via RPC to avoid unique constraint conflicts
                                  if (editVehicleId) {
                                    console.log("Assigning vehicle id:", editVehicleId, "to driver id:", editDriver.driver_id);
                                    const assigned = await assignDriverToVehicle(editDriver.driver_id, editVehicleId);
                                    if (!assigned) throw new Error('Assignment RPC returned no data');
                                  }
                                  // Refresh vehicles state
                                  const updatedVehicles = await listVehicles();
                                  setVehicles(updatedVehicles);
                                  setEditVehicleDialog(false);
                                } catch (err: any) {
                                  console.error('Failed to update vehicle assignment:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
                                  const code = err?.code || err?.status;
                                  const msg = err?.message || err?.error || JSON.stringify(err);
                                  if (msg.includes('one_active_vehicle_per_driver') || msg.includes('duplicate key') || code === '23505' || code === 409) {
                                    setError('Driver already has an active vehicle. Unassign their current vehicle first.');
                                  } else {
                                    setError('Failed to update vehicle assignment: ' + (msg || 'unknown error'));
                                  }
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

      {/* Set Driver Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="bg-[#161616] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Set Driver Password</DialogTitle>
            <DialogDescription className="text-gray-400">
              {adminClient
                ? 'Set a new password for the selected driver.'
                : 'Set the VITE_SUPABASE_SERVICE_ROLE_KEY to update passwords directly. Otherwise, a reset link will be emailed.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Driver</Label>
              <div className="text-sm text-gray-200">
                {passwordDriver?.full_name ?? passwordDriver?.profile_email ?? passwordDriver?.email ?? 'Selected driver'}
              </div>
            </div>
            <div>
              <Label className="text-gray-300">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Confirm Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handlePasswordReset}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
              disabled={passwordSaving}
            >
              {passwordSaving ? 'Saving...' : adminClient ? 'Set Password' : 'Send Reset Link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
              Are you sure you want to delete {selectedDriver?.full_name ?? selectedDriver?.profile_email ?? selectedDriver?.driver_id}? This action cannot be undone.
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
