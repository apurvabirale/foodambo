import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { productAPI, authAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { MapPin, Star, Plus, Search } from 'lucide-react';

const categories = [
  { id: 'fresh_food', label: 'Fresh Food', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', color: '#D9534F' },
  { id: 'pickles', label: 'Pickles & Chutneys', image: 'https://images.unsplash.com/photo-1573051038546-894db2283a05?w=400', color: '#F0AD4E' },
  { id: 'organic_veggies', label: 'Organic Veggies', image: 'https://images.unsplash.com/photo-1691836264082-3d2a35f81ee6?w=400', color: '#5CB85C' },
  { id: 'art_handmade', label: 'Art & Handmade', image: 'https://images.unsplash.com/photo-1651959653830-5c8cb576e134?w=400', color: '#2D2D2D' },
];

const trendingDishes = [
  { name: 'Biryani', image: 'https://images.unsplash.com/photo-1563379091339-03b2cb0d9179?w=300' },
  { name: 'Thali', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300' },
  { name: 'Samosa', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300' },
  { name: 'Dosa', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300' },
];

const Home = () => {
  const navigate = useNavigate();
  const { location, loading: locationLoading } = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(['fresh_food', 'pickles', 'organic_veggies', 'art_handmade']);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    checkStore();
  }, []);

  useEffect(() => {
    if (location) {
      fetchProducts();
    }
  }, [location, selectedCategories]);

  useEffect(() => {
    if (location) {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  const checkStore = async () => {
    try {
      await authAPI.getMe();
      const storeResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stores/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('foodambo_token')}` }
      });
      if (storeResponse.ok) {
        setHasStore(true);
      }
    } catch (error) {
      setHasStore(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const meResponse = await authAPI.getMe();
      const currentUserId = meResponse.data.id;
      
      const response = await productAPI.getAll({
        latitude: location?.latitude,
        longitude: location?.longitude,
        categories: selectedCategories.join(','),
        radius_km: 2,
        exclude_seller_id: currentUserId,
        search: searchQuery,
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="home-page">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10 backdrop-blur-lg bg-white/80">
        <div className="py-4 px-4">
          {/* Logo - Centered and Prominent */}
          <div className="flex flex-col items-center mb-3">
            <img 
              src="https://customer-assets.emergentagent.com/job_fresh-neighborhood/artifacts/vv7vq469_Logo1.png" 
              alt="Foodambo" 
              className="h-12 mb-2"
            />
            {location && (
              <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-primary">
                  Discovering fresh delights within 2 km
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-gradient-to-b from-white to-gray-50">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Search for dishes, pickles, veggies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3.5 pl-12 rounded-full border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm hover:shadow-md transition-shadow"
            data-testid="search-input"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Become a Seller CTA - Only show if user doesn't have a store */}
      {!hasStore && (
        <div className="p-4">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-xl animate-pulse"></div>
            
            <Card 
              className="relative overflow-hidden cursor-pointer border-2 border-primary shadow-2xl hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              onClick={() => navigate('/create-listing')}
              data-testid="become-seller-cta"
            >
            <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/20 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-3 py-1 rounded-full mb-2">
                  <span className="text-xs font-bold">LIMITED TIME</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Start Selling Today!</h3>
                <p className="text-foreground-muted text-sm">Turn your passion into income 💰</p>
              </div>
              <div className="text-5xl">🏪</div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-lg p-3 border border-border">
                <p className="text-xs text-foreground-muted mb-1">One-time Setup</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-primary">₹199</p>
                  <span className="text-xs text-foreground-muted">INR</span>
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 border border-border">
                <p className="text-xs text-foreground-muted mb-1">Monthly Fee</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-bold text-primary">₹499</p>
                  <span className="text-xs text-foreground-muted">INR</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Zero Commission - Keep 100% earnings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Reach customers within 2 km</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Build your permanent brand</span>
              </div>
            </div>
            
            <Button className="w-full btn-primary h-12 rounded-full text-base font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
              🚀 Create Your Store Now
            </Button>
          </div>
          </Card>
          </div>
        </div>
      )}

      {/* Trending Dishes */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-3">Trending Now</h2>
        <div className="trending-scroll">
          {trendingDishes.map((dish, idx) => (
            <div key={idx} className="flex-none w-32">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-md">
                <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium">{dish.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="p-4">
        <h2 className="text-xl font-semibold mb-3">Categories</h2>
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`category-card p-0 overflow-hidden ${
                selectedCategories.includes(cat.id) ? 'ring-2 ring-primary' : ''
              }`}
              data-testid={`category-${cat.id}`}
            >
              <div className="relative aspect-video">
                <img src={cat.image} alt={cat.label} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-3">
                  <p className="text-white font-semibold text-sm">{cat.label}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active Listings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">Nearby Listings</h2>
          <span className="text-sm text-foreground-muted">{products.length} found</span>
        </div>
        
        {loading || locationLoading ? (
          <div className="text-center py-12 text-foreground-muted">Loading...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-muted mb-4">No products found nearby</p>
            <Button onClick={fetchProducts} variant="outline">Refresh</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="product-card cursor-pointer p-0 overflow-hidden"
                onClick={() => navigate(`/product/${product.id}`)}
                data-testid={`product-${product.id}`}
              >
                {/* Product Image with Badges */}
                <div className="relative aspect-[4/3] bg-gray-100">
                  {product.photos?.[0] ? (
                    <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                  )}
                  
                  {/* Veg/Non-Veg Badge - Top Left */}
                  {product.category === 'fresh_food' && (
                    <div className="absolute top-3 left-3 bg-white rounded-md p-1.5 shadow-lg">
                      {product.is_veg ? (
                        <div className="w-6 h-6 border-2 border-green-600 rounded flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-green-600 rounded-full"></div>
                        </div>
                      ) : (
                        <div className="w-6 h-6 border-2 border-red-600 rounded flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-red-600 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Distance Badge - Top Right */}
                  {product.distance !== undefined && (
                    <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {product.distance} km
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="p-4">
                  {/* Product Name + Price + Qty */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground text-lg leading-tight mb-1">{product.title}</h3>
                      {product.min_quantity && (
                        <p className="text-xs text-foreground-muted font-medium">
                          Min Order: {product.min_quantity} {product.category === 'fresh_food' ? 'plate(s)' : 'unit(s)'}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm font-semibold text-primary">₹</span>
                        <p className="text-2xl font-bold text-primary">{product.price}</p>
                        <span className="text-xs text-foreground-muted font-medium">INR</span>
                      </div>
                      {product.details?.weight && (
                        <p className="text-xs text-foreground-muted">{product.details.weight}</p>
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  {product.description && (
                    <p className="text-sm text-foreground-muted line-clamp-2 mb-3 leading-relaxed">
                      {product.description}
                    </p>
                  )}

                  {/* Availability Section */}
                  {product.availability_days && product.availability_days.length > 0 && (
                    <div className="mb-3 bg-gray-50 rounded-lg p-2">
                      <p className="text-xs font-semibold text-foreground mb-1.5">📅 Available Days:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {product.availability_days.map((day) => (
                          <span key={day} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded font-medium">
                            {day}
                          </span>
                        ))}
                      </div>
                      
                      {/* Time Slots */}
                      {product.availability_time_slots && product.availability_time_slots.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-foreground mb-1.5">⏰ Time Slots:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {product.availability_time_slots.map((slot) => (
                              <span key={slot} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded font-semibold">
                                {slot}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Delivery/Pickup Options - HIGHLIGHTED */}
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-foreground">Fulfillment:</p>
                    {product.delivery_available && (
                      <span className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                        🚚 Delivery Available
                      </span>
                    )}
                    {product.pickup_available && (
                      <span className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                        🏪 Pickup Available
                      </span>
                    )}
                  </div>

                  {/* Spice Level */}
                  {product.spice_level && (
                    <div className="mb-2">
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-semibold">
                        🌶️ {product.spice_level.charAt(0).toUpperCase() + product.spice_level.slice(1)} Spice
                      </span>
                    </div>
                  )}

                  {/* Rating */}
                  {product.store_rating > 0 && (
                    <div className="flex items-center gap-1 pt-2 border-t border-border">
                      <Star className="w-4 h-4 text-secondary fill-secondary" />
                      <span className="text-sm font-bold">{product.store_rating}</span>
                      <span className="text-xs text-foreground-muted ml-1">Store Rating</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        className="floating-action-btn"
        onClick={() => navigate('/create-listing')}
        data-testid="create-listing-fab"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
};

export default Home;