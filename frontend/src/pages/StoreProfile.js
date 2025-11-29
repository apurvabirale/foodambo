import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storeAPI, reviewAPI, productAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Star, MapPin, CheckCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';

const StoreProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStore();
  }, [id]);

  const fetchStore = async () => {
    try {
      const [storeRes, reviewsRes, productsRes] = await Promise.all([
        storeAPI.get(id),
        reviewAPI.getStore(id),
        productAPI.getAll({})
      ]);
      setStore(storeRes.data);
      setReviews(reviewsRes.data);
      setProducts(productsRes.data.filter(p => p.store_id === id));
    } catch (error) {
      toast.error('Failed to load store');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !store) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="store-profile">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Store Profile</h1>
          </div>
          <ShareButton 
            title={store?.store_name}
            text={`Check out ${store?.store_name} on Foodambo - Authentic homemade food!`}
            type="store"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-3xl font-bold text-primary">
              {store.store_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="text-2xl font-bold">{store.store_name}</h2>
                {store.is_pure_veg && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                    🟢 Pure Veg
                  </span>
                )}
                {store.fssai_verified && (
                  <CheckCircle className="w-5 h-5 text-accent" />
                )}
              </div>
              <p className="text-foreground-muted flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {store.address}
              </p>
            </div>
          </div>

          {store.rating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 bg-secondary/10 px-3 py-1 rounded-full">
                <Star className="w-5 h-5 text-secondary fill-secondary" />
                <span className="font-bold text-lg">{store.rating}</span>
              </div>
              <span className="text-sm text-foreground-muted">
                ({store.total_reviews} reviews)
              </span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {store.categories.map((cat) => (
              <span key={cat} className="badge badge-primary text-xs capitalize">
                {cat.replace('_', ' ')}
              </span>
            ))}
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold mb-3">Products</h3>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="aspect-square rounded-t-xl overflow-hidden bg-gray-100">
                  {product.photos?.[0] && (
                    <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm line-clamp-1">{product.title}</h4>
                  <p className="text-primary font-bold mt-1">₹{product.price}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-center text-foreground-muted py-8">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <Card key={review.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < review.rating ? 'text-secondary fill-secondary' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-foreground-muted">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm">{review.comment}</p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreProfile;