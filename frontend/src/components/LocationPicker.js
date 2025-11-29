import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const LocationPicker = ({ onLocationSelect, initialLocation = null, showAddress = true }) => {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(initialLocation || {
    latitude: null,
    longitude: null,
    address: ''
  });

  useEffect(() => {
    if (initialLocation) {
      setLocation(initialLocation);
    }
  }, [initialLocation]);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: location.address
        };
        
        // Try to get address from coordinates using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          if (data.display_name) {
            newLocation.address = data.display_name;
          }
        } catch (error) {
          console.error('Failed to get address:', error);
        }
        
        setLocation(newLocation);
        onLocationSelect(newLocation);
        setLoading(false);
        toast.success('Location detected successfully');
      },
      (error) => {
        setLoading(false);
        toast.error('Failed to get your location. Please enter manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const handleManualInput = (field, value) => {
    const newLocation = { ...location, [field]: value };
    setLocation(newLocation);
    
    // Only call onLocationSelect if we have valid coordinates
    if (newLocation.latitude && newLocation.longitude) {
      onLocationSelect(newLocation);
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-lg">Set Your Location</h3>
        </div>
        <Button
          onClick={getCurrentLocation}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          <span className="ml-2">Use Current Location</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="latitude">Latitude *</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            placeholder="e.g., 18.5204"
            value={location.latitude || ''}
            onChange={(e) => handleManualInput('latitude', parseFloat(e.target.value))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="longitude">Longitude *</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            placeholder="e.g., 73.8567"
            value={location.longitude || ''}
            onChange={(e) => handleManualInput('longitude', parseFloat(e.target.value))}
          />
        </div>
      </div>

      {showAddress && (
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Enter your address"
            value={location.address || ''}
            onChange={(e) => handleManualInput('address', e.target.value)}
          />
        </div>
      )}

      {location.latitude && location.longitude && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-800">
            📍 Location set: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </p>
          {location.address && (
            <p className="text-xs text-green-700 mt-1">{location.address}</p>
          )}
        </div>
      )}
    </Card>
  );
};

export default LocationPicker;
