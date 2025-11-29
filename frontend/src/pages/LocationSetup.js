import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import LocationPicker from '../components/LocationPicker';
import { authAPI } from '../utils/api';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';

const LocationSetup = () => {
  const navigate = useNavigate();
  const { fetchUser } = useAuth();
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleLocationSelect = (loc) => {
    setLocation(loc);
  };

  const handleSave = async () => {
    if (!location || !location.latitude || !location.longitude) {
      toast.error('Please set your location to continue');
      return;
    }

    setSaving(true);
    try {
      await authAPI.updateProfile({
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || ''
        }
      });
      
      // Refresh user data
      await fetchUser();
      
      toast.success('Location saved successfully!');
      navigate('/home');
    } catch (error) {
      console.error('Failed to save location:', error);
      toast.error('Failed to save location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Foodambo! 🎉</h1>
          <p className="text-gray-600">
            To provide you with the best hyperlocal experience, we need your location.
            This helps us show you nearby sellers and authentic homemade food in your area.
          </p>
        </div>

        <LocationPicker
          onLocationSelect={handleLocationSelect}
          showAddress={true}
        />

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Why we need your location:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Show nearby sellers within 2 km radius</li>
            <li>✓ Discover authentic homemade food in your neighborhood</li>
            <li>✓ Support local home-based sellers</li>
            <li>✓ Get accurate delivery estimates</li>
          </ul>
        </div>

        <Button
          onClick={handleSave}
          disabled={!location || !location.latitude || !location.longitude || saving}
          className="w-full bg-orange-600 hover:bg-orange-700"
          size="lg"
        >
          {saving ? 'Saving...' : 'Continue to Foodambo'}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Your location is only used to show nearby sellers and will not be shared publicly.
          You can update it anytime from your profile settings.
        </p>
      </div>
    </div>
  );
};

export default LocationSetup;
