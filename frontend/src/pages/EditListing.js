import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, Upload, X } from 'lucide-react';

const categories = [
  { value: 'fresh_food', label: 'Fresh Food' },
  { value: 'pickles', label: 'Pickles & Chutneys' },
  { value: 'organic_veggies', label: 'Organic Vegetables' },
  { value: 'art_handmade', label: 'Art & Handmade' },
];

const spiceLevels = [
  { value: 'mild', label: 'Mild' },
  { value: 'medium', label: 'Medium' },
  { value: 'hot', label: 'Hot' },
  { value: 'extra_hot', label: 'Extra Hot' },
];

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState([]);
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState('');
  const [availabilityDays, setAvailabilityDays] = useState([]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('21:00');
  const [minQuantity, setMinQuantity] = useState('1');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.get(id);
      const product = response.data;
      setCategory(product.category);
      setTitle(product.title);
      setDescription(product.description);
      setPrice(product.price.toString());
      setPhotos(product.photos || []);
      setIsVeg(product.is_veg ?? true);
      setSpiceLevel(product.spice_level || '');
      setAvailabilityDays(product.availability_days || []);
      setStartTime(product.availability_times?.start || '09:00');
      setEndTime(product.availability_times?.end || '21:00');
      setMinQuantity(product.min_quantity?.toString() || '1');
      setDeliveryAvailable(product.delivery_available);
      setPickupAvailable(product.pickup_available);
    } catch (error) {
      toast.error('Failed to load product');
      navigate('/my-listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!category || !title || !price) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    try {
      await productAPI.update(id, {
        category,
        title,
        description,
        price: parseFloat(price),
        photos,
        product_type: category,
        is_veg: isVeg,
        spice_level: spiceLevel,
        details: {},
        availability_days: availabilityDays,
        availability_times: { start: startTime, end: endTime },
        min_quantity: parseInt(minQuantity),
        delivery_available: deliveryAvailable,
        pickup_available: pickupAvailable,
      });
      toast.success('Product updated successfully!');
      navigate('/my-listings');
    } catch (error) {
      toast.error('Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos([...photos, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="edit-listing-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Edit Listing</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Category *</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger data-testid="category-select">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Product Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Homemade Biryani"
              data-testid="title-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your product..."
              rows={4}
              data-testid="description-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Price (₹) *</label>
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="100"
              data-testid="price-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Food Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={isVeg}
                  onChange={() => setIsVeg(true)}
                  className="rounded-full"
                />
                <span className="text-sm">🟢 Veg</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={!isVeg}
                  onChange={() => setIsVeg(false)}
                  className="rounded-full"
                />
                <span className="text-sm">🔴 Non-Veg</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Spice Level</label>
            <Select value={spiceLevel} onValueChange={setSpiceLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select spice level" />
              </SelectTrigger>
              <SelectContent>
                {spiceLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Availability Days</label>
            <div className="grid grid-cols-4 gap-2">
              {daysOfWeek.map((day) => (
                <label key={day} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={availabilityDays.includes(day)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setAvailabilityDays([...availabilityDays, day]);
                      } else {
                        setAvailabilityDays(availabilityDays.filter(d => d !== day));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Start Time</label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">End Time</label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photos</label>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img src={photo} alt="Product" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-gray-50">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Quantity</label>
            <Input
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={pickupAvailable}
                  onChange={(e) => setPickupAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Pickup Available (Free)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={deliveryAvailable}
                  onChange={(e) => setDeliveryAvailable(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Delivery Available (₹30)</span>
              </label>
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

export default EditListing;