import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storeAPI, orderAPI, productAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Star,
  Edit,
  Plus,
  Calendar,
  BarChart3
} from 'lucide-react';

const MyStoreFront = () => {
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('today');

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      const [storeRes, ordersRes, productsRes] = await Promise.all([
        storeAPI.getMy(),
        orderAPI.getSeller(),
        productAPI.getMy()
      ]);
      setStore(storeRes.data);
      setOrders(ordersRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load store data');
      navigate('/create-listing');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      switch (timeFilter) {
        case 'today':
          return orderDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return orderDate >= weekAgo;
        case 'month':
          return orderDate.getMonth() === now.getMonth() && 
                 orderDate.getFullYear() === now.getFullYear();
        case 'all':
        default:
          return true;
      }
    });
  };

  const filteredOrders = getFilteredOrders();
  const totalRevenue = filteredOrders.reduce((sum, order) => 
    order.status === 'completed' ? sum + order.total_price : sum, 0
  );
  const completedOrders = filteredOrders.filter(o => o.status === 'completed').length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'pending').length;
  const activeProducts = products.filter(p => p.active).length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="my-store-front">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-secondary text-white">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold">{store?.store_name}</h1>
                {store?.fssai_verified && (
                  <div className="bg-white/20 px-2 py-1 rounded-full text-xs font-semibold">
                    ✓ FSSAI
                  </div>
                )}
              </div>
              <p className="text-white/80 text-sm">{store?.address}</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="font-semibold">{store?.rating || 0}</span>
                  <span className="text-white/80 text-sm">({store?.total_reviews || 0} reviews)</span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/edit-store')}
              className="text-white hover:bg-white/20"
            >
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white/80 text-xs mb-1">Active Products</p>
              <p className="text-2xl font-bold">{activeProducts}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white/80 text-xs mb-1">Acceptance Rate</p>
              <p className="text-2xl font-bold">{store?.acceptance_rate || 100}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Time Filter */}
      <div className="p-4 bg-white border-b border-border sticky top-0 z-10">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Calendar className="w-5 h-5 text-foreground-muted flex-shrink-0" />
          {[
            { value: 'today', label: 'Today' },
            { value: 'week', label: 'This Week' },
            { value: 'month', label: 'This Month' },
            { value: 'all', label: 'All Time' }
          ].map(filter => (
            <button
              key={filter.value}
              onClick={() => setTimeFilter(filter.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                timeFilter === filter.value
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-foreground hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Performance
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Total Orders */}
          <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{filteredOrders.length}</p>
            <p className="text-sm text-blue-700 font-medium">Total Orders</p>
          </Card>

          {/* Total Revenue */}
          <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-8 h-8 text-green-600" />
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">₹{totalRevenue}</p>
            <p className="text-sm text-green-700 font-medium">Total Revenue</p>
          </Card>

          {/* Completed Orders */}
          <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{completedOrders}</p>
            <p className="text-sm text-purple-700 font-medium">Completed</p>
          </Card>

          {/* Pending Orders */}
          <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">{pendingOrders}</p>
            <p className="text-sm text-orange-700 font-medium">Pending</p>
          </Card>
        </div>

        {/* Average Order Value */}
        {completedOrders > 0 && (
          <Card className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground-muted mb-1">Average Order Value</p>
                <p className="text-2xl font-bold text-primary">
                  ₹{Math.round(totalRevenue / completedOrders)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-foreground-muted mb-1">Success Rate</p>
                <p className="text-2xl font-bold text-accent">
                  {Math.round((completedOrders / filteredOrders.length) * 100)}%
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button
            onClick={() => navigate('/create-listing')}
            className="h-20 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90"
          >
            <Plus className="w-6 h-6" />
            <span className="text-sm font-semibold">Add Product</span>
          </Button>
          <Button
            onClick={() => navigate('/my-listings')}
            variant="outline"
            className="h-20 flex flex-col items-center justify-center gap-2"
          >
            <Package className="w-6 h-6" />
            <span className="text-sm font-semibold">My Products</span>
          </Button>
        </div>

        {/* Recent Orders */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold">Recent Orders</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/seller-orders')}
            >
              View All
            </Button>
          </div>
          {filteredOrders.length === 0 ? (
            <Card className="p-6 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-foreground-muted">No orders yet</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredOrders.slice(0, 5).map(order => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-base">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-foreground-muted mt-1">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                      <p className="text-sm text-foreground-muted mt-1">
                        Scheduled: {order.scheduled_date} at {order.scheduled_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary text-lg">₹{order.total_price}</p>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Buttons for Pending Orders */}
                  {order.status === 'pending' && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        onClick={async () => {
                          try {
                            await orderAPI.updateStatus(order.id, 'accepted');
                            toast.success('Order accepted!');
                            fetchStoreData();
                          } catch (error) {
                            toast.error('Failed to accept order');
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        ✓ Accept
                      </Button>
                      <Button
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to reject this order?')) {
                            try {
                              await orderAPI.updateStatus(order.id, 'rejected');
                              toast.success('Order rejected');
                              fetchStoreData();
                            } catch (error) {
                              toast.error('Failed to reject order');
                            }
                          }
                        }}
                        variant="outline"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        ✗ Reject
                      </Button>
                    </div>
                  )}
                  
                  {/* Status Update Buttons for Accepted Orders */}
                  {order.status === 'accepted' && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <Button
                        onClick={async () => {
                          try {
                            await orderAPI.updateStatus(order.id, 'completed');
                            toast.success('Order marked as completed!');
                            fetchStoreData();
                          } catch (error) {
                            toast.error('Failed to update order');
                          }
                        }}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        Mark as Completed
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyStoreFront;
