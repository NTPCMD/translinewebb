// Maintenance tracking and scheduling page
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/app/components/ui/alert-dialog';
import { Search, Plus, Eye, Wrench, AlertTriangle, CheckCircle, Calendar, DollarSign, Trash2, Loader } from 'lucide-react';
import { format } from 'date-fns';
import { listMaintenanceItems, listPendingMaintenanceItems, createMaintenanceItem, MaintenanceItem, countPendingMaintenance } from '@/lib/db/maintenance';

export function MaintenancePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [maintenanceItems, setMaintenanceItems] = useState<MaintenanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MaintenanceItem | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [formData, setFormData] = useState({
    vehicleId: '',
    serviceType: '',
    scheduledDate: '',
  });

  // Fetch maintenance items on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [itemsList, pending] = await Promise.all([
          listMaintenanceItems(),
          countPendingMaintenance(),
        ]);
        setMaintenanceItems(itemsList);
        setPendingCount(pending);
        setError(null);
      } catch (err) {
        setError('Failed to load maintenance data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredItems = maintenanceItems.filter((item) =>
    item.service_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.vehicle_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMaintenance = async () => {
    if (!formData.vehicleId || !formData.serviceType) {
      setError('Required fields are missing');
      return;
    }

    try {
      const newItem = await createMaintenanceItem({
        vehicle_id: formData.vehicleId,
        service_type: formData.serviceType,
        service_date: formData.scheduledDate ? new Date(formData.scheduledDate).toISOString() : undefined,
        status: 'pending',
      });
      setMaintenanceItems([...maintenanceItems, newItem]);
      setPendingCount(pendingCount + 1);
      setDialogOpen(false);
      setFormData({ vehicleId: '', serviceType: '', scheduledDate: '' });
      setError(null);
    } catch (err) {
      setError('Failed to create maintenance item');
      console.error(err);
    }
  };

  const handleDeleteClick = (item: MaintenanceItem) => {
    setSelectedItem(item);
    setDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;

    try {
      // Note: implement delete in maintenance.ts when ready
      setMaintenanceItems(maintenanceItems.filter((i) => i.id !== selectedItem.id));
      if (selectedItem.status === 'pending') {
        setPendingCount(Math.max(0, pendingCount - 1));
      }
      setDeleteDialog(false);
      setSelectedItem(null);
      setError(null);
    } catch (err) {
      setError('Failed to delete maintenance item');
      console.error(err);
    }
  };

  const completedCount = maintenanceItems.filter((i) => i.status === 'completed').length;
  const overdueCount = maintenanceItems.filter((i) => i.status === 'overdue').length;

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
          <h1 className="text-3xl font-bold text-white mb-2">Maintenance</h1>
          <p className="text-gray-400">Track vehicle maintenance and service schedules</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
        >
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
                <p className="text-3xl font-bold text-red-400">{loading ? '-' : overdueCount}</p>
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
                <p className="text-sm text-gray-400 mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">{loading ? '-' : pendingCount}</p>
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
                <p className="text-sm text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-400">{loading ? '-' : completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-950 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-1">Total Items</p>
                <p className="text-3xl font-bold text-blue-400">{loading ? '-' : maintenanceItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance items table */}
      <Card className="bg-[#161616] border-gray-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-white">Maintenance Schedule</CardTitle>
              <CardDescription className="text-gray-400">
                Manage all maintenance items and service records
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search maintenance..."
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
                    <TableHead className="text-gray-400">Service Type</TableHead>
                    <TableHead className="text-gray-400">Vehicle ID</TableHead>
                    <TableHead className="text-gray-400">Scheduled Date</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                        No maintenance items found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.id} className="border-gray-800">
                        <TableCell className="font-medium text-white">{item.service_type}</TableCell>
                        <TableCell className="text-gray-300">{item.vehicle_id}</TableCell>
                        <TableCell className="text-gray-300">
                          {item.scheduled_date
                            ? format(new Date(item.scheduled_date), 'MMM dd, yyyy')
                            : 'Not scheduled'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === 'pending'
                                ? 'bg-yellow-950 text-yellow-400 border-yellow-900'
                                : item.status === 'completed'
                                ? 'bg-green-950 text-green-400 border-green-900'
                                : 'bg-red-950 text-red-400 border-red-900'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                              onClick={() => handleDeleteClick(item)}
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

      {/* Add Maintenance Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#161616] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Schedule Maintenance</DialogTitle>
            <DialogDescription className="text-gray-400">
              Schedule a new maintenance service
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Vehicle ID</Label>
              <Input
                value={formData.vehicleId}
                onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                placeholder="Enter vehicle ID"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Service Type</Label>
              <Input
                value={formData.serviceType}
                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                placeholder="e.g., Oil Change, Brake Service"
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <div>
              <Label className="text-gray-300">Scheduled Date</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="bg-[#0F0F0F] border-gray-700 text-white"
              />
            </div>
            <Button
              onClick={handleAddMaintenance}
              className="w-full bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
            >
              Schedule Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent className="bg-[#161616] border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Maintenance Item</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Are you sure you want to delete this {selectedItem?.service_type} service? This action cannot be undone.
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
