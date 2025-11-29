import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import { productAPI, storeAPI } from '../utils/api';
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

const timeSlots = ['9 AM', '1 PM', '5 PM', '8 PM'];

const CreateListing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location } = useLocation();
  const [loading, setLoading] = useState(false);
  const [hasStore, setHasStore] = useState(false);
  const [showStoreSetup, setShowStoreSetup] = useState(false);
  
  // Store setup
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [storeCategories, setStoreCategories] = useState([]);
  
  // Product form
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [photos, setPhotos] = useState([]);
  const [productType, setProductType] = useState('fresh_food');
  const [isVeg, setIsVeg] = useState(true);
  const [spiceLevel, setSpiceLevel] = useState('');
  const [availabilityDays, setAvailabilityDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [timeSlots, setTimeSlots] = useState(['9 AM', '1 PM', '5 PM', '8 PM']);
  const [minQuantity, setMinQuantity] = useState('1');
  const [qtyPerUnit, setQtyPerUnit] = useState('');
  const [deliveryAvailable, setDeliveryAvailable] = useState(false);
  const [pickupAvailable, setPickupAvailable] = useState(true);

  useEffect(() => {
    checkStore();
  }, []);

  const checkStore = async () => {
    try {
      await storeAPI.getMy();
      setHasStore(true);
    } catch (error) {
      setHasStore(false);
      setShowStoreSetup(true);
    }
  };

  const handleCreateStore = async () => {
    if (!storeName || !storeAddress || !location) {
      toast.error('Please fill all store details');
      return;
    }

    setLoading(true);
    try {
      await storeAPI.create({
        store_name: storeName,
        address: storeAddress,
        latitude: location.latitude,
        longitude: location.longitude,
        categories: storeCategories,
      });
      toast.success('Store created successfully!');
      setHasStore(true);
      setShowStoreSetup(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!category || !title || !price) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      await productAPI.create({
        category,
        title,
        description,
        price: parseFloat(price),
        photos,
        product_type: productType,
        is_veg: isVeg,
        spice_level: spiceLevel,
        details: {},
        availability_days: availabilityDays,
        availability_time_slots: timeSlots,
        min_quantity: parseInt(minQuantity),
        qty_per_unit: qtyPerUnit,
        delivery_available: deliveryAvailable,
        pickup_available: pickupAvailable,
      });
      toast.success('Product listed successfully!');
      navigate('/my-listings');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
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

  if (showStoreSetup) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
          <div className="p-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Setup Your Store</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <Card className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Store Name *</label>
              <Input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Enter your store name"
                data-testid="store-name-input"
              />
              <p className="text-xs text-foreground-muted">This name is permanent and cannot be changed later</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Address *</label>
              <Textarea
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                placeholder="Enter your store address"
                rows={3}
                data-testid="store-address-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Categories</label>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label key={cat.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={storeCategories.includes(cat.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setStoreCategories([...storeCategories, cat.value]);
                        } else {
                          setStoreCategories(storeCategories.filter(c => c !== cat.value));
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
              onClick={handleCreateStore}
              disabled={loading}
              className="w-full btn-primary h-12 rounded-full"
              data-testid="create-store-btn"
            >
              {loading ? 'Creating...' : 'Create Store (₹199 activation)'}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="create-listing-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Add New Listing</h1>
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
                    data-testid="photo-upload"
                  />
                </label>
              )}
            </div>
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

          <div className="space-y-2">
            <label className="text-sm font-medium">Time Slots</label>
            <div className="grid grid-cols-2 gap-2">
              {['9 AM', '1 PM', '5 PM', '8 PM'].map((slot) => (
                <label key={slot} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={timeSlots.includes(slot)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTimeSlots([...timeSlots, slot]);
                      } else {
                        setTimeSlots(timeSlots.filter(s => s !== slot));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm font-medium">{slot}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Minimum Quantity</label>
            <Input
              type="number"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              min="1"
              data-testid="min-quantity-input"
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
            onClick={handleCreateProduct}
            disabled={loading}
            className="w-full btn-primary h-12 rounded-full"
            data-testid="create-product-btn"
          >
            {loading ? 'Creating...' : 'Create Listing'}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default CreateListing;