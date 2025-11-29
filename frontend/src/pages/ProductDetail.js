import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI, orderAPI, storeAPI, reviewAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { ArrowLeft, Star, MapPin, Calendar, Clock, Phone, MessageCircle, X, AlertCircle } from 'lucide-react';
import ShareButton from '../components/ShareButton';

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
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [selectedPartyPackage, setSelectedPartyPackage] = useState('');

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productAPI.get(id);
      setProduct(response.data);
      // Set default quantity to minimum
      setQuantity(response.data.min_quantity || 1);
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

  const handleOrderClick = () => {
    // For party orders, validate package selection
    if (product.is_party_order && !selectedPartyPackage) {
      toast.error('Please select a party package');
      return;
    }

    // For regular orders, validate minimum quantity
    if (!product.is_party_order && quantity < (product.min_quantity || 1)) {
      toast.error(`Minimum order quantity is ${product.min_quantity || 1}`);
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      toast.error('Please select date and time');
      return;
    }

    // If delivery, check address and phone
    if (deliveryMethod === 'delivery' && (!buyerAddress || !buyerPhone)) {
      toast.error('Please enter your delivery address and contact number');
      return;
    }

    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const handleConfirmOrder = async () => {
    try {
      const orderData = {
        product_id: id,
        quantity: product.is_party_order ? 1 : quantity,
        delivery_method: deliveryMethod,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
      };

      if (deliveryMethod === 'delivery') {
        orderData.buyer_address = buyerAddress;
        orderData.buyer_phone = buyerPhone;
      }

      if (product.is_party_order) {
        orderData.party_package = selectedPartyPackage;
      }

      await orderAPI.create(orderData);
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

  // Calculate total price based on party order or regular order
  let totalPrice = 0;
  if (product.is_party_order && selectedPartyPackage) {
    totalPrice = (product.party_packages?.[selectedPartyPackage] || 0) + (deliveryMethod === 'delivery' ? 50 : 0);
  } else {
    totalPrice = (product.price * quantity) + (deliveryMethod === 'delivery' ? 50 : 0);
  }
  
  const selectedDateObj = scheduledDate ? new Date(scheduledDate) : null;
  const dayName = selectedDateObj ? selectedDateObj.toLocaleDateString('en-IN', { weekday: 'long' }) : '';

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="product-detail">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} data-testid="back-btn">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">Product Details</h1>
          </div>
          <ShareButton 
            title={product?.title}
            text={`Check out ${product?.title} on Foodambo - Authentic homemade food!`}
            type="product"
          />
        </div>
      </div>

      {/* Product Image */}
      <div className="relative aspect-square bg-gray-100">
        {product.photos?.[0] ? (
          <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
        )}
        {/* Veg/Non-Veg Badge */}
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
            {product.delivery_available && <span className="badge badge-success">Delivery ₹50</span>}
            {product.pickup_available && <span className="badge badge-warning">Pickup (Free)</span>}
          </div>
        </div>

        {/* Availability Info */}
        {product.availability_days && product.availability_days.length > 0 && (
          <Card className="p-3 bg-blue-50">
            <p className="text-xs font-semibold text-foreground mb-2">📅 Available on:</p>
            <div className="flex flex-wrap gap-1.5">
              {product.availability_days.map((day) => (
                <span key={day} className="text-xs bg-white border border-gray-200 px-2 py-1 rounded font-medium">
                  {day}
                </span>
              ))}
            </div>
            {product.availability_time_slots && product.availability_time_slots.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-foreground mb-1.5">⏰ Time Slots:</p>
                <div className="flex flex-wrap gap-1.5">
                  {product.availability_time_slots.map((slot) => (
                    <span key={slot} className="text-xs bg-blue-100 text-blue-700 border border-blue-200 px-2 py-1 rounded font-semibold">
                      {slot}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

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
          <h3 className="font-semibold text-lg">{product.is_party_order ? '🎉 Book Party Package' : 'Place Order'}</h3>
          
          {product.is_party_order ? (
            /* Party Package Selection */
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Package Size *</label>
              <div className="grid grid-cols-1 gap-3">
                {product.party_packages && Object.entries(product.party_packages).map(([people, price]) => (
                  <button
                    key={people}
                    onClick={() => setSelectedPartyPackage(people)}
                    className={`p-4 border-2 rounded-lg text-left transition-all ${
                      selectedPartyPackage === people
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-lg">{people} People</p>
                        <p className="text-sm text-foreground-muted">Perfect for {people === '25' ? 'small' : people === '50' ? 'medium' : 'large'} gatherings</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">₹{price}</p>
                        <p className="text-xs text-foreground-muted">₹{Math.round(price / parseInt(people))}/person</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 All party packages include full setup and service
              </p>
            </div>
          ) : (
            /* Regular Quantity Selection */
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                min={product.min_quantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                data-testid="quantity-input"
              />
              {product.min_quantity > 1 && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Minimum order: {product.min_quantity} {product.category === 'fresh_food' ? 'plate(s)' : 'unit(s)'}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Delivery Method *</label>
            <div className="grid grid-cols-2 gap-2">
              {product.pickup_available && (
                <Button
                  variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('pickup')}
                  className="h-12"
                  data-testid="pickup-btn"
                >
                  🏪 Pickup (Free)
                </Button>
              )}
              {product.delivery_available && (
                <Button
                  variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                  onClick={() => setDeliveryMethod('delivery')}
                  className="h-12"
                  data-testid="delivery-btn"
                >
                  🚚 Delivery (₹50)
                </Button>
              )}
            </div>
          </div>

          {/* Delivery Address Section */}
          {deliveryMethod === 'delivery' && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Contact Number *</label>
                <Input
                  type="tel"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  data-testid="phone-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Address *</label>
                <Textarea
                  value={buyerAddress}
                  onChange={(e) => setBuyerAddress(e.target.value)}
                  placeholder="Enter your complete delivery address"
                  rows={3}
                  data-testid="address-input"
                />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date *
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
                Time *
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
              <span className="text-primary">₹{totalPrice} INR</span>
            </div>
          </div>

          <Button
            onClick={handleOrderClick}
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

      {/* Order Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold">Confirm Your Order</h3>
              <button onClick={() => setShowConfirmDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <img src={product.photos?.[0] || '/placeholder.png'} alt={product.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <h4 className="font-semibold">{product.title}</h4>
                  <p className="text-sm text-foreground-muted">Quantity: {quantity}</p>
                  <p className="text-sm font-semibold text-primary">₹{totalPrice} INR</p>
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">📅 Date:</span>
                  <span className="font-semibold">{scheduledDate} ({dayName})</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">⏰ Time:</span>
                  <span className="font-semibold">{scheduledTime}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground-muted">Delivery:</span>
                  <span className="font-semibold">{deliveryMethod === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}</span>
                </div>
                {deliveryMethod === 'delivery' && (
                  <>
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-foreground-muted">📞 Phone:</span>
                      <span className="font-semibold text-right">{buyerPhone}</span>
                    </div>
                    <div className="flex items-start justify-between text-sm">
                      <span className="text-foreground-muted">📍 Address:</span>
                      <span className="font-semibold text-right max-w-[200px]">{buyerAddress}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  ⚠️ Please confirm your order details. The seller will accept/reject within 1 hour.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                className="h-11"
              >
                Edit Order
              </Button>
              <Button
                onClick={handleConfirmOrder}
                className="btn-primary h-11"
              >
                Confirm Order
              </Button>
            </div>
          </Card>
        </div>
      )}

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
