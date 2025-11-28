import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '../context/LocationContext';
import { productAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { MapPin, Star, Plus } from 'lucide-react';

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

  useEffect(() => {
    if (location) {
      fetchProducts();
    }
  }, [location, selectedCategories]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await productAPI.getAll({
        latitude: location?.latitude,
        longitude: location?.longitude,
        categories: selectedCategories.join(','),
        radius_km: 2,
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
            <h1 className="text-2xl font-bold text-foreground">Foodambo</h1>
            <Button variant="ghost" size="icon" data-testid="location-btn">
              <MapPin className="w-5 h-5 text-primary" />
            </Button>
          </div>
          {location && (
            <p className="text-sm text-foreground-muted">Finding delights within 2 km</p>
          )}
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
                <div className="flex gap-4 p-4">
                  <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {product.photos?.[0] ? (
                      <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground line-clamp-1 mb-1">{product.title}</h3>
                    <p className="text-sm text-foreground-muted line-clamp-2 mb-2">{product.description}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-primary">₹{product.price}</span>
                      {product.distance !== undefined && (
                        <span className="text-xs text-foreground-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {product.distance} km
                        </span>
                      )}
                      {product.store_rating > 0 && (
                        <span className="text-xs text-secondary flex items-center gap-1">
                          <Star className="w-3 h-3 fill-secondary" />
                          {product.store_rating}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      {product.delivery_available && (
                        <span className="badge badge-success text-xs">Delivery</span>
                      )}
                      {product.pickup_available && (
                        <span className="badge badge-warning text-xs">Pickup</span>
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