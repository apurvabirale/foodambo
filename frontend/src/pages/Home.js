import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { productAPI, authAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { MapPin, Star, Plus, Search, X } from 'lucide-react';

const categories = [
  { id: 'fresh_food', label: 'Fresh Food', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', color: '#D9534F' },
  { id: 'pickles', label: 'Pickles & Chutneys', image: 'https://images.unsplash.com/photo-1573051038546-894db2283a05?w=400', color: '#F0AD4E' },
  { id: 'vegetables', label: 'Vegetables & Farm Products', image: 'https://images.unsplash.com/photo-1691836264082-3d2a35f81ee6?w=400', color: '#5CB85C' },
  { id: 'art_handmade', label: 'Art & Handmade', image: 'https://images.unsplash.com/photo-1651959653830-5c8cb576e134?w=400', color: '#2D2D2D' },
  { id: 'party_package', label: 'Party Package', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400', color: '#E91E63' },
];

const trendingDishes = [
  { name: 'Biryani', image: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=300&q=80' },
  { name: 'Thali', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=300&q=80' },
  { name: 'Samosa', image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300&q=80' },
  { name: 'Dosa', image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=300&q=80' },
];

const Home = () => {
  const navigate = useNavigate();
  const { location, loading: locationLoading, error: locationError } = useLocation();
  const [products, setProducts] = useState([]);
  const [partyOrders, setPartyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partyLoading, setPartyLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState(['fresh_food', 'pickles', 'vegetables', 'art_handmade', 'party_package']);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasStore, setHasStore] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [viewMode, setViewMode] = useState('products');
  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  useEffect(() => {
    checkStore();
  }, []);

  useEffect(() => {
    // If location is available, fetch products
    if (location) {
      if (viewMode === 'products') {
        fetchProducts();
        fetchPartyOrders();
      } else {
        fetchStores();
      }
    } else if (!locationLoading && locationError) {
      // Location failed - still fetch products but without location filtering
      setLoading(false);
      setFetchError('Location access denied. Please enable location or enter manually.');
    }
  }, [location, selectedCategories, locationLoading, viewMode]);

  useEffect(() => {
    if (location || (!locationLoading && locationError)) {
      const timeoutId = setTimeout(() => {
        if (viewMode === 'products') {
          fetchProducts();
        } else {
          fetchStores();
        }
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, viewMode]);

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
    setFetchError(null);
    try {
      const params = {
        categories: selectedCategories.join(','),
        search: searchQuery,
        party_orders_only: false,
      };
      
      // Only add location params if available
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius_km = 2;
      }
      
      const response = await productAPI.getAll(params);
      setProducts(response.data);
      
      if (response.data.length === 0 && !location) {
        setFetchError('Enable location to find products near you');
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setFetchError('Failed to load products. Please try again.');
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartyOrders = async () => {
    setPartyLoading(true);
    try {
      const params = {
        party_orders_only: true,
      };
      
      // Only add location params if available
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius_km = 2;
      }
      
      const response = await productAPI.getAll(params);
      setPartyOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch party orders:', error);
    } finally {
      setPartyLoading(false);
    }
  };

  const fetchStores = async () => {
    setStoresLoading(true);
    try {
      const params = {
        search: searchQuery,
      };
      
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
        params.radius_km = 2;
      }
      
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/stores/search?${new URLSearchParams(params)}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('foodambo_token')}` }
      });
      const data = await response.json();
      setStores(data);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setStoresLoading(false);
    }
  };

  const handleRetryLocation = () => {
    window.location.reload();
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

      {/* Become a Seller CTA - Compact Button */}
      {!hasStore && (
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowSellerModal(true)}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            data-testid="become-seller-cta"
          >
            <span className="text-lg">🏪</span>
            Start Selling Today - Zero Commission!
            <span className="text-lg">→</span>
          </button>
        </div>
      )}

      {/* Seller Info Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSellerModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-bold text-foreground mb-1">Start Selling on Foodambo!</h3>
                <p className="text-foreground-muted text-sm">Turn your passion into income 💰</p>
              </div>
              <button onClick={() => setShowSellerModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4 border-2 border-orange-200 mb-4">
              <div className="text-center">
                <p className="text-sm text-foreground-muted mb-1">Monthly Subscription</p>
                <p className="text-4xl font-bold text-primary">₹299</p>
                <p className="text-xs text-green-700 font-semibold mt-1">✨ No activation fee!</p>
                <p className="text-xs text-foreground-muted mt-2">Payment due at end of every month</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Zero Commission - Keep 100% earnings</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Reach customers within 2 km</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Build your permanent brand</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="font-medium">Direct UPI payments from buyers</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs font-semibold text-blue-800 mb-1">Payment to Foodambo:</p>
              <p className="text-sm text-blue-700">Pay subscription via UPI to: <span className="font-bold">foodambo@upi</span></p>
            </div>
            
            <Button 
              onClick={() => navigate('/create-listing')}
              className="w-full btn-primary h-12 rounded-full text-base font-bold"
            >
              🚀 Create Your Store Now
            </Button>
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

      {/* Party Orders Section */}
      {partyOrders.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                🎉 Party Packages
                <span className="text-xs bg-secondary text-white px-2 py-1 rounded-full">NEW</span>
              </h2>
              <p className="text-sm text-foreground-muted mt-1">Perfect for celebrations & gatherings</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {partyOrders.map((partyOrder) => (
              <Card
                key={partyOrder.id}
                className="party-order-card cursor-pointer overflow-hidden border-2 border-orange-200 hover:border-orange-400 transition-all hover:shadow-lg"
                onClick={() => navigate(`/product/${partyOrder.id}`)}
              >
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {partyOrder.photos?.[0] ? (
                      <img src={partyOrder.photos[0]} alt={partyOrder.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-4xl">🎊</div>
                    )}
                    <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      PARTY
                    </div>
                  </div>
                  
                  {/* Details */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{partyOrder.title}</h3>
                    <p className="text-sm text-foreground-muted mb-3 line-clamp-2">{partyOrder.description}</p>
                    
                    {/* Package Prices */}
                    <div className="flex flex-wrap gap-2">
                      {partyOrder.party_packages && Object.entries(partyOrder.party_packages).map(([people, price]) => (
                        <div key={people} className="bg-white border border-orange-300 rounded-lg px-3 py-1.5">
                          <p className="text-xs text-orange-700 font-semibold">{people} People</p>
                          <p className="text-sm font-bold text-primary">₹{price}</p>
                        </div>
                      ))}
                    </div>
                    
                    {/* Store Info */}
                    {partyOrder.store_name && (
                      <p className="text-xs text-foreground-muted mt-2">
                        🏪 {partyOrder.store_name}
                        {partyOrder.distance && <span className="ml-2">• {partyOrder.distance} km</span>}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Categories - Compact Design */}
      <div className="p-4">
        <h2 className="text-base font-semibold mb-2">Categories</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => toggleCategory(cat.id)}
              className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                selectedCategories.includes(cat.id) 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid={`category-${cat.id}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* View Toggle */}
      <div className="p-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('products')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'products'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🍽️ Products
          </button>
          <button
            onClick={() => setViewMode('stores')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === 'stores'
                ? 'bg-primary text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🏪 Stores
          </button>
        </div>
      </div>

      {/* Active Listings */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold">{viewMode === 'products' ? 'Nearby Listings' : 'Nearby Stores'}</h2>
          <span className="text-sm text-foreground-muted">{viewMode === 'products' ? products.length : stores.length} found</span>
        </div>
        
        {/* Show location error message if any */}
        {locationError && !location && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 mb-3">
              📍 Location access denied. Please enable location to see nearby {viewMode}.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleRetryLocation} variant="outline" size="sm">
                Try Again
              </Button>
              <Button onClick={() => navigate('/location-setup')} variant="outline" size="sm">
                Enter Manually
              </Button>
            </div>
          </div>
        )}
        
        {/* Show fetch error message if any */}
        {fetchError && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">{fetchError}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-foreground-muted">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-muted mb-4">
              {location ? 'No products found nearby' : 'Enable location to discover products near you'}
            </p>
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
                      {product.store_name && (
                        <p className="text-xs text-orange-600 font-semibold flex items-center gap-1 mb-1">
                          <span>🏪</span>
                          {product.store_name}
                        </p>
                      )}
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

        {/* Stores View */}
        {viewMode === 'stores' && (
          storesLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
              <p className="text-foreground-muted">Loading stores...</p>
            </div>
          ) : stores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-foreground-muted mb-4">
                {location ? 'No stores found nearby' : 'Enable location to discover stores near you'}
              </p>
              <Button onClick={fetchStores} variant="outline">Refresh</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {stores.map((store) => (
                <Card
                  key={store.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/store/${store.id}`)}
                >
                  <div className="flex gap-4">
                    {store.store_photo && (
                      <img
                        src={store.store_photo}
                        alt={store.store_name}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{store.store_name}</h3>
                        {store.is_pure_veg && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                            🌿 Pure Veg
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground-muted mb-2">📍 {store.address}</p>
                      <div className="flex items-center gap-4 text-sm">
                        {store.distance !== undefined && (
                          <span className="text-foreground-muted">📍 {store.distance} km away</span>
                        )}
                        {store.rating > 0 && (
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold">{store.rating.toFixed(1)}</span>
                            <span className="text-foreground-muted">({store.total_reviews})</span>
                          </span>
                        )}
                        {store.product_count !== undefined && (
                          <span className="text-foreground-muted">{store.product_count} products</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )
        )}
      </div>

    </div>
  );
};

export default Home;