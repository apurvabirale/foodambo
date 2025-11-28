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

  useEffect(() => {
    if (location) {
      fetchProducts();
    }
  }, [location, selectedCategories, searchQuery]);

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
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <img 
              src="https://customer-assets.emergentagent.com/job_fresh-neighborhood/artifacts/vv7vq469_Logo1.png" 
              alt="Foodambo" 
              className="h-8"
            />
            <Button variant="ghost" size="icon" data-testid="location-btn">
              <MapPin className="w-5 h-5 text-primary" />
            </Button>
          </div>
          {location && (
            <p className="text-sm text-foreground-muted">Finding delights within 2 km</p>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white border-b border-border">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for dishes, pickles, veggies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 rounded-full border border-border focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="search-input"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

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
                className="product-card cursor-pointer p-0"
                onClick={() => navigate(`/product/${product.id}`)}
                data-testid={`product-${product.id}`}
              >
                <div className="p-4">
                  {/* Product Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100 mb-3">
                    {product.photos?.[0] ? (
                      <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                    {/* Veg/Non-Veg Badge */}
                    {product.category === 'fresh_food' && (
                      <div className="absolute top-2 left-2 bg-white rounded-full p-1 shadow-md">
                        {product.is_veg ? (
                          <div className="w-5 h-5 border-2 border-green-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          </div>
                        ) : (
                          <div className="w-5 h-5 border-2 border-red-600 rounded flex items-center justify-center">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Distance Badge */}
                    {product.distance !== undefined && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {product.distance} km
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    {/* Title + Price */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-foreground text-base line-clamp-1">{product.title}</h3>
                        {product.min_quantity && (
                          <p className="text-xs text-foreground-muted">Min Qty: {product.min_quantity}</p>
                        )}
                      </div>
                      <span className="text-xl font-bold text-primary">₹{product.price}</span>
                    </div>

                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-foreground-muted line-clamp-2 mb-2">{product.description}</p>
                    )}

                    {/* Spice Level */}
                    {product.spice_level && (
                      <div className="mb-2">
                        <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                          🌶️ {product.spice_level.charAt(0).toUpperCase() + product.spice_level.slice(1)} Spice
                        </span>
                      </div>
                    )}

                    {/* Availability Days */}
                    {product.availability_days && product.availability_days.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-foreground-muted mb-1">Available:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.availability_days.map((day) => (
                            <span key={day} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Time Slots */}
                    {product.availability_time_slots && product.availability_time_slots.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-foreground-muted mb-1">Time Slots:</p>
                        <div className="flex flex-wrap gap-1">
                          {product.availability_time_slots.map((slot) => (
                            <span key={slot} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              ⏰ {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery/Pickup + Rating */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex gap-2">
                        {product.delivery_available && (
                          <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded font-medium">🚚 Delivery</span>
                        )}
                        {product.pickup_available && (
                          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded font-medium">🏪 Pickup</span>
                        )}
                      </div>
                      {product.store_rating > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-secondary fill-secondary" />
                          <span className="text-sm font-semibold">{product.store_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
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