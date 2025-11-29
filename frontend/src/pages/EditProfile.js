import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, MapPin } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, fetchUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      if (user.location) {
        setLocation({
          latitude: user.location.latitude,
          longitude: user.location.longitude,
          address: user.location.address || ''
        });
      }
    }
  }, [user]);

  const handleSave = async () => {
    if (!name) {
      toast.error('Name is required');
      return;
    }

    if (!location || !location.latitude || !location.longitude) {
      toast.error('Location is required');
      return;
    }

    setLoading(true);
    try {
      await authAPI.updateProfile({
        name,
        location: {
          latitude: location.latitude,
          longitude: location.longitude,
          address: location.address || ''
        }
      });
      
      await fetchUser();
      toast.success('Profile updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Profile</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              value={phone}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-foreground-muted">Phone number cannot be changed</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-foreground-muted">Email cannot be changed</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Your Location *</label>
            </div>
            <LocationPicker
              onLocationSelect={setLocation}
              initialLocation={location}
              showAddress={true}
            />
            <p className="text-xs text-foreground-muted">
              This is used to show you nearby sellers. Your exact address is optional.
            </p>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;
