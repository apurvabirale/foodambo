import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { MapPin, Loader2, Navigation, Search } from 'lucide-react';
import { toast } from 'sonner';

const LocationPicker = ({ onLocationSelect, initialLocation = null, showAddress = true }) => {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
        toast.error('Failed to get your location. Please search or enter manually.');
        console.error('Geolocation error:', error);
      }
    );
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a location to search');
      return;
    }

    setSearching(true);
    try {
      // Using Nominatim (OpenStreetMap) for geocoding - it's free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
        toast.success(`Found ${data.length} results`);
      } else {
        toast.error('No results found. Try a different search term.');
        setSearchResults([]);
      }
    } catch (error) {
      toast.error('Search failed. Please try again.');
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const selectSearchResult = (result) => {
    const newLocation = {
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      address: result.display_name
    };
    setLocation(newLocation);
    onLocationSelect(newLocation);
    setSearchResults([]);
    setSearchQuery('');
    toast.success('Location selected');
  };

  const handleManualInput = (field, value) => {
    const newLocation = { ...location, [field]: value };
    setLocation(newLocation);
    
    // Only call onLocationSelect if we have valid coordinates
    if (newLocation.latitude && newLocation.longitude) {
      onLocationSelect(newLocation);
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
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
          <span className="ml-2">Auto-Detect</span>
        </Button>
      </div>

      {/* Search Location */}
      <div className="space-y-2">
        <Label htmlFor="search">Search Location</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search for your city, area, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              className="pl-10"
            />
          </div>
          <Button
            onClick={searchLocation}
            disabled={searching}
            variant="default"
          >
            {searching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Search'
            )}
          </Button>
        </div>
        <p className="text-xs text-foreground-muted">
          Try: "Koregaon Park Pune", "MG Road Bangalore", "Connaught Place Delhi"
        </p>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-2">
          <Label>Select from results:</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {searchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => selectSearchResult(result)}
                className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary transition-all"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {result.name || result.display_name.split(',')[0]}
                    </p>
                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or enter manually</span>
        </div>
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
          <Label htmlFor="address">Address (Optional)</Label>
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
          <p className="text-sm font-semibold text-green-800 mb-1">
            ✅ Location Set Successfully
          </p>
          <p className="text-xs text-green-700">
            📍 {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
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
