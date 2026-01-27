// Live map page with driver locations
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { MapPin, Navigation, Loader, Search, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { listLatestLocationsByDrivers, subscribeToLocationUpdates, LocationLog } from '@/lib/db/locations';
import { listDrivers, Driver } from '@/lib/db/drivers';

export function LiveMapPage() {
  const [locations, setLocations] = useState<LocationLog[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch initial data and subscribe to Realtime updates
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch drivers and locations
        const [driversList, locationsList] = await Promise.all([
          listDrivers(),
          listLatestLocationsByDrivers(),
        ]);
        setDrivers(driversList);
        setLocations(locationsList);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError('Failed to load location data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to Realtime location updates
    const channel = subscribeToLocationUpdates((newLocation) => {
      setLocations((prev) => {
        // Replace or add the location
        const filtered = prev.filter((l) => l.driver_id !== newLocation.driver_id);
        return [newLocation, ...filtered];
      });
      setLastUpdate(new Date());
    });

    // Cleanup subscription on unmount
    return () => {
      if (channel) {
        import('@/lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, []);

  const filteredLocations = locations.filter((loc) => {
    const driverName =
      drivers.find((d) => d.id === loc.driver_id)?.name?.toLowerCase() || '';
    return driverName.includes(searchQuery.toLowerCase());
  });

  const activeDrivers = locations.length;

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const locationsList = await listLatestLocationsByDrivers();
      setLocations(locationsList);
      setLastUpdate(new Date());
    } catch (err) {
      setError('Failed to refresh locations');
      console.error(err);
    } finally {
      setLoading(false);
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Live Map</h1>
          <p className="text-gray-400">Real-time driver and vehicle tracking</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          className="bg-[#FF6B35] hover:bg-[#E55A2B] text-white"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Last update info */}
      {lastUpdate && (
        <Card className="bg-[#161616] border-gray-800">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-gray-400">
                Last updated: {format(lastUpdate, 'MMM dd, HH:mm:ss')}
              </span>
            </div>
            <span className="text-sm font-medium text-green-400">{activeDrivers} Active</span>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Location table */}
        <Card className="bg-[#161616] border-gray-800 lg:col-span-3">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-white">Driver Locations</CardTitle>
                <CardDescription className="text-gray-400">
                  Real-time GPS tracking of active drivers
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
            {loading && locations.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader className="w-8 h-8 text-[#FF6B35] animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Driver Name</TableHead>
                      <TableHead className="text-gray-400">Latitude</TableHead>
                      <TableHead className="text-gray-400">Longitude</TableHead>
                      <TableHead className="text-gray-400">Last Update</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          No active drivers
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLocations.map((location) => {
                        const driver = drivers.find((d) => d.id === location.driver_id);
                        return (
                          <TableRow key={location.id} className="border-gray-800">
                            <TableCell className="font-medium text-white">
                              {driver?.name || 'Unknown Driver'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {location.latitude?.toFixed(6) || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {location.longitude?.toFixed(6) || 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {format(new Date(location.created_at), 'MMM dd, HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-green-950 text-green-400 border-green-900">
                                <Navigation className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Driver list sidebar */}
        <Card className="bg-[#161616] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Active Drivers</CardTitle>
            <CardDescription className="text-gray-400">
              {activeDrivers} drivers online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {loading && locations.length === 0 ? (
                <div className="flex justify-center py-4">
                  <Loader className="w-6 h-6 text-[#FF6B35] animate-spin" />
                </div>
              ) : filteredLocations.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No drivers found</p>
              ) : (
                filteredLocations.map((location) => {
                  const driver = drivers.find((d) => d.id === location.driver_id);
                  return (
                    <div
                      key={location.id}
                      className="p-3 bg-[#0F0F0F] rounded-lg border border-gray-800 hover:border-[#FF6B35] transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-white truncate">
                            {driver?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-gray-400 truncate">{driver?.email}</p>
                        </div>
                        <Badge className="ml-2 flex-shrink-0 bg-green-950 text-green-400 border-green-900 text-xs">
                          <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse" />
                          Online
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3 text-[#FF6B35] flex-shrink-0" />
                        <span>
                          {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
