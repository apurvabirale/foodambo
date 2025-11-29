import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, MapPin } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

const categories = [
  { value: 'fresh_food', label: 'Fresh Food' },
  { value: 'pickles', label: 'Pickles & Chutneys' },
  { value: 'vegetables', label: 'Vegetables & Farm Products' },
  { value: 'art_handmade', label: 'Art & Handmade' },
  { value: 'party_package', label: 'Party Package' },
];

const EditStore = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [storeLocation, setStoreLocation] = useState(null);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await storeAPI.getMy();
      setStore(response.data);
      setAddress(response.data.address);
      setSelectedCategories(response.data.categories || []);
      if (response.data.location) {
        setStoreLocation({
          latitude: response.data.location.latitude,
          longitude: response.data.location.longitude,
          address: response.data.address || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load store');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!storeLocation || !storeLocation.latitude || !storeLocation.longitude) {
      toast.error('Store location is required');
      return;
    }

    setSaving(true);
    try {
      await storeAPI.update({
        address,
        categories: selectedCategories,
        latitude: storeLocation.latitude,
        longitude: storeLocation.longitude,
      });
      toast.success('Store updated successfully');
      navigate('/profile');
    } catch (error) {
      toast.error('Failed to update store');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="edit-store-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Store</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Store Name</label>
            <Input value={store?.store_name} disabled className="bg-gray-100" />
            <p className="text-xs text-foreground-muted">Store name cannot be changed</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              data-testid="address-input"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-primary" />
              <label className="text-sm font-medium">Store Location *</label>
            </div>
            <LocationPicker
              onLocationSelect={setStoreLocation}
              initialLocation={storeLocation}
              showAddress={false}
            />
            <p className="text-xs text-foreground-muted">
              Precise location helps buyers find you. Address is entered above.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Categories</label>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat.value]);
                      } else {
                        setSelectedCategories(selectedCategories.filter(c => c !== cat.value));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary h-12 rounded-full"
            data-testid="save-btn"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default EditStore;