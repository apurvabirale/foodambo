import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, productAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const SellerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const ordersRes = await orderAPI.getSeller();
      setOrders(ordersRes.data);
      
      const productIds = [...new Set(ordersRes.data.map(o => o.product_id))];
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

  const handleAccept = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, 'accepted');
      toast.success('Order accepted!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to accept order');
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('Are you sure you want to reject this order?')) return;
    
    try {
      await orderAPI.updateStatus(orderId, 'rejected');
      toast.success('Order rejected');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to reject order');
    }
  };

  const handleComplete = async (orderId) => {
    try {
      await orderAPI.updateStatus(orderId, 'completed');
      toast.success('Order marked as completed!');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    accepted: orders.filter(o => o.status === 'accepted').length,
    completed: orders.filter(o => o.status === 'completed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading orders...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="seller-orders-page">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Seller Orders</h1>
        </div>
      </div>

      {/* Status Filter */}
      <div className="p-4 bg-white border-b border-border">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-foreground'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'pending'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-100 text-orange-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" />
            Pending ({statusCounts.pending})
          </button>
          <button
            onClick={() => setFilter('accepted')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'accepted'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            <Package className="w-4 h-4 inline mr-1" />
            Accepted ({statusCounts.accepted})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" />
            Completed ({statusCounts.completed})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-3" />
            <p className="text-foreground-muted">No {filter !== 'all' ? filter : ''} orders</p>
          </Card>
        ) : (
          filteredOrders.map(order => {
            const product = products[order.product_id];
            return (
              <Card key={order.id} className="p-4">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-base">Order #{order.id.slice(0, 8)}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        order.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted">
                      Placed: {new Date(order.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="font-bold text-primary text-xl">₹{order.total_price}</p>
                </div>

                {/* Product Details */}
                {product && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="flex gap-3">
                      {product.photos?.[0] && (
                        <img 
                          src={product.photos[0]} 
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{product.title}</p>
                        <p className="text-xs text-foreground-muted">Quantity: {order.quantity}</p>
                        <p className="text-xs text-foreground-muted">
                          {order.delivery_method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Info */}
                <div className="border-t border-border pt-3 mb-3">
                  <p className="text-sm font-medium mb-1">Scheduled Delivery:</p>
                  <p className="text-sm text-foreground-muted">
                    📅 {order.scheduled_date} at ⏰ {order.scheduled_time}
                  </p>
                  {order.buyer_address && order.delivery_method === 'delivery' && (
                    <p className="text-sm text-foreground-muted mt-1">
                      📍 {order.buyer_address}
                    </p>
                  )}
                </div>

                {/* Order Expiry Warning for Pending */}
                {order.status === 'pending' && order.expires_at && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-orange-700">
                      Expires: {new Date(order.expires_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {order.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleAccept(order.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                    >
                      ✓ Accept Order
                    </Button>
                    <Button
                      onClick={() => handleReject(order.id)}
                      variant="outline"
                      className="border-red-600 text-red-600 hover:bg-red-50 font-semibold"
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}

                {order.status === 'accepted' && (
                  <Button
                    onClick={() => handleComplete(order.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                )}

                {order.status === 'completed' && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <CheckCircle className="w-6 h-6 mx-auto text-green-600 mb-1" />
                    <p className="text-sm font-medium text-green-700">Order Completed</p>
                    <p className="text-xs text-green-600">
                      {new Date(order.completed_at).toLocaleString()}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SellerOrders;
