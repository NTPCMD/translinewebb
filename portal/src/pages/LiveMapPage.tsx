// Live map page with driver locations
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { MapPin, Navigation } from 'lucide-react';

// Mock driver locations
const mockLocations = [
  { id: '1', name: 'John Smith', vehicle: 'VAN-001', lat: -37.8136, lng: 144.9631, status: 'moving' },
  { id: '2', name: 'Sarah Johnson', vehicle: 'TRK-045', lat: -37.8200, lng: 144.9700, status: 'stopped' },
  { id: '4', name: 'Emma Wilson', vehicle: 'TRK-089', lat: -37.8100, lng: 144.9600, status: 'moving' },
];

export function LiveMapPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Live Map</h1>
        <p className="text-gray-400">Real-time driver and vehicle tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map placeholder */}
        <Card className="bg-[#161616] border-gray-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Driver Locations</CardTitle>
            <CardDescription className="text-gray-400">
              Live GPS tracking (map integration pending)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[600px] bg-[#0F0F0F] rounded-lg border border-gray-800 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Map integration placeholder</p>
                <p className="text-sm text-gray-500">
                  Replace with MapLibre or Google Maps implementation
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver list */}
        <Card className="bg-[#161616] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Active Drivers</CardTitle>
            <CardDescription className="text-gray-400">
              {mockLocations.length} drivers online
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockLocations.map((location) => (
                <div
                  key={location.id}
                  className="p-4 bg-[#0F0F0F] rounded-lg border border-gray-800 hover:border-[#FF6B35] transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-white">{location.name}</p>
                      <p className="text-xs text-gray-400">{location.vehicle}</p>
                    </div>
                    <Badge
                      className={
                        location.status === 'moving'
                          ? 'bg-green-950 text-green-400 border-green-900'
                          : 'bg-yellow-950 text-yellow-400 border-yellow-900'
                      }
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      {location.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3 h-3 text-[#FF6B35]" />
                    <span>
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
