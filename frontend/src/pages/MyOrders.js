import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, productAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';

const statusIcons = {
  pending: <Clock className="w-5 h-5 text-secondary" />,
  accepted: <Package className="w-5 h-5 text-accent" />,
  completed: <CheckCircle className="w-5 h-5 text-accent" />,
  cancelled: <XCircle className="w-5 h-5 text-destructive" />,
};

const MyOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderAPI.getMy();
      setOrders(response.data);
      
      const productIds = [...new Set(response.data.map(o => o.product_id))];
      const productData = {};
      await Promise.all(
        productIds.map(async (id) => {
          try {
            const res = await productAPI.get(id);
            productData[id] = res.data;
          } catch (e) {
            console.error(`Failed to fetch product ${id}`);
          }
        })
      );
      setProducts(productData);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-foreground-muted">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="my-orders-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-foreground-muted mb-4">No orders yet</p>
            <Button onClick={() => navigate('/')}>Explore Products</Button>
          </div>
        ) : (
          orders.map((order) => {
            const product = products[order.product_id];
            return (
              <Card key={order.id} className="p-4" data-testid={`order-${order.id}`}>
                <div className="flex gap-4">
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                    {product?.photos?.[0] ? (
                      <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{product?.title || 'Product'}</h3>
                    <p className="text-sm text-foreground-muted mb-2">
                      Qty: {order.quantity} | {order.delivery_method === 'delivery' ? 'Delivery' : 'Pickup'}
                    </p>
                    <div className="flex items-center gap-2 mb-2">
                      {statusIcons[order.status] || statusIcons.pending}
                      <span className="text-sm font-medium capitalize">{order.status}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">₹{order.total_price}</span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/chat/${order.id}`)}
                          data-testid={`chat-btn-${order.id}`}
                        >
                          Chat
                        </Button>
                        {order.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/order/${order.id}/review`)}
                            className="bg-secondary/10 text-secondary border-secondary/30"
                          >
                            Review
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-border text-xs text-foreground-muted">
                  <p>Scheduled: {order.scheduled_date} at {order.scheduled_time}</p>
                  <p>Order ID: {order.id.slice(0, 8)}</p>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyOrders;