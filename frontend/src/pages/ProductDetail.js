import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, storeAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, Star, MapPin, Calendar, Clock, Phone, MessageCircle } from 'lucide-react';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.get(id);
      setProduct(response.data);
      if (response.data.delivery_available) {
        setDeliveryMethod('delivery');
      }
      const storeResponse = await storeAPI.get(response.data.store_id);
      setStore(storeResponse.data);
    } catch (error) {
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    try {
      await orderAPI.create({
        product_id: id,
        quantity,
        delivery_method: deliveryMethod,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      });
      toast.success('Order placed successfully!');
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to place order');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!product) {
    return <div className="flex items-center justify-center min-h-screen">Product not found</div>;
  }

  const totalPrice = (product.price * quantity) + (deliveryMethod === 'delivery' ? 30 : 0);

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="product-detail">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Product Details</h1>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.photos?.[0] ? (
          <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">{product.title}</h2>
          <p className="text-foreground-muted">{product.description}</p>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-primary">₹{product.price}</span>
          <div className="flex gap-2">
            {product.delivery_available && <span className="badge badge-success">Delivery ₹30</span>}
            {product.pickup_available && <span className="badge badge-warning">Pickup</span>}
          </div>
        </div>

        {/* Store Info */}
        {store && (
          <Card className="p-4 cursor-pointer" onClick={() => navigate(`/store/${store.id}`)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{store.store_name}</h3>
                <p className="text-sm text-foreground-muted flex items-center gap-1 mt-1">
                  <MapPin className="w-3 h-3" />
                  {store.address}
                </p>
              </div>
              {store.rating > 0 && (
                <div className="flex items-center gap-1 bg-secondary/10 px-2 py-1 rounded-full">
                  <Star className="w-4 h-4 text-secondary fill-secondary" />
                  <span className="font-semibold">{store.rating}</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Order Form */}
        <Card className="p-4 space-y-4">
          <h3 className="font-semibold text-lg">Place Order</h3>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity</label>
            <Input
              type="number"
              min={product.min_quantity || 1}
              max={product.max_quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              data-testid="quantity-input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Method</label>
            <div className="grid grid-cols-2 gap-2">
              {product.pickup_available && (
                <Button
                  variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('pickup')}
                  className="h-12"
                  data-testid="pickup-btn"
                >
                  Pickup (Free)
                </Button>
              )}
              {product.delivery_available && (
                <Button
                  variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('delivery')}
                  className="h-12"
                  data-testid="delivery-btn"
                >
                  Delivery (₹30)
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date
              </label>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="date-input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Time
              </label>
              <Input
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                data-testid="time-input"
              />
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">₹{totalPrice}</span>
            </div>
          </div>

          <Button
            onClick={handleOrder}
            className="w-full btn-primary h-12 rounded-full text-base"
            data-testid="place-order-btn"
          >
            Place Order
          </Button>
        </Card>

        {/* UPI Payment Info */}
        <Card className="p-4 bg-secondary/10">
          <p className="text-sm text-foreground-muted">
            <strong>Payment:</strong> Direct UPI payment to seller after order confirmation
          </p>
        </Card>
      </div>

      {/* Chat FAB */}
      {store && (
        <button className="floating-action-btn bg-secondary" data-testid="chat-fab">
          <MessageCircle className="w-6 h-6" />
        </button>
      )}
    </div>
  );
};

export default ProductDetail;