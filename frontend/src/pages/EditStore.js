import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const categories = [
  { value: 'fresh_food', label: 'Fresh Food' },
  { value: 'pickles', label: 'Pickles & Chutneys' },
  { value: 'organic_veggies', label: 'Organic Vegetables' },
  { value: 'art_handmade', label: 'Art & Handmade' },
];

const EditStore = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState(null);
  const [address, setAddress] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const response = await storeAPI.getMy();
      setStore(response.data);
      setAddress(response.data.address);
      setSelectedCategories(response.data.categories || []);
    } catch (error) {
      toast.error('Failed to load store');
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await storeAPI.update({
        address,
        categories: selectedCategories,
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