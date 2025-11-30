import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Upload, MapPin } from 'lucide-react';
import LocationPicker from '../components/LocationPicker';

const EditStore = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [storePhoto, setStorePhoto] = useState('');
  const [categories, setCategories] = useState([]);
  const [isPureVeg, setIsPureVeg] = useState(false);
  const [storeActive, setStoreActive] = useState(true);
  const [location, setLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const categoryOptions = [
    { value: 'fresh_food', label: 'Fresh Food' },
    { value: 'pickles', label: 'Pickles & Chutneys' },
    { value: 'vegetables', label: 'Vegetables & Farm Products' },
    { value: 'art_handmade', label: 'Art & Handmade' },
    { value: 'party_package', label: 'Party Packages' }
  ];

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await storeAPI.getMy();
      const storeData = response.data;
      setStore(storeData);
      setStoreName(storeData.store_name || '');
      setAddress(storeData.address || '');
      setStorePhoto(storeData.store_photo || '');
      setCategories(storeData.categories || []);
      setIsPureVeg(storeData.is_pure_veg || false);
      setStoreActive(storeData.store_active !== undefined ? storeData.store_active : true);
      setLocation(storeData.location || null);
    } catch (error) {
      toast.error('Failed to load store details');
      navigate('/create-listing');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (categoryValue) => {
    setCategories(prev =>
      prev.includes(categoryValue)
        ? prev.filter(c => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const handleLocationSelected = (coords) => {
    setLocation({
      latitude: coords.lat,
      longitude: coords.lng
    });
    setShowLocationPicker(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await storeAPI.update({
        store_name: storeName,
        address,
        store_photo: storePhoto,
        categories,
        is_pure_veg: isPureVeg,
        store_active: storeActive,
        location
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
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-foreground-muted">Loading store details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Edit Store</h1>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Store Active Toggle */}
          <Card className="p-4 bg-blue-50 border-2 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Store Status</h3>
                <p className="text-sm text-blue-700">
                  {storeActive ? 'Your store is active and visible to customers' : 'Your store is offline - products are hidden'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStoreActive(!storeActive)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  storeActive ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    storeActive ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          <div>
            <label className="block text-sm font-medium mb-2">Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Store Photo URL</label>
            <input
              type="url"
              value={storePhoto}
              onChange={(e) => setStorePhoto(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="space-y-2">
              {categoryOptions.map(cat => (
                <label key={cat.value} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={categories.includes(cat.value)}
                    onChange={() => handleCategoryToggle(cat.value)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="text-sm">{cat.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPureVeg}
                onChange={(e) => setIsPureVeg(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm font-medium">🌿 Pure Veg Store</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Location</label>
            {location ? (
              <Card className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">Current Location</p>
                    <p className="text-sm font-mono">Lat: {location.latitude}, Lng: {location.longitude}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowLocationPicker(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Change
                  </Button>
                </div>
              </Card>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowLocationPicker(true)}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Set Location
              </Button>
            )}
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </div>

      {showLocationPicker && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">Select Store Location</h3>
              <button
                onClick={() => setShowLocationPicker(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <LocationPicker
                onLocationSelected={handleLocationSelected}
                initialLocation={location ? { lat: location.latitude, lng: location.longitude } : null}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditStore;