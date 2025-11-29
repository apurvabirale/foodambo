import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react';
import api from '../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Admin access required');
        navigate('/');
      } else {
        toast.error('Failed to load analytics');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-foreground-muted">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const stats = [
    {
      title: 'Total Users',
      value: analytics.total_users,
      icon: Users,
      color: 'bg-blue-500',
      change: `+${analytics.new_users_this_week} this week`
    },
    {
      title: 'Active Sellers',
      value: analytics.active_sellers,
      icon: Store,
      color: 'bg-green-500',
      change: 'Stores registered'
    },
    {
      title: 'Active Listings',
      value: analytics.active_listings,
      icon: Package,
      color: 'bg-purple-500',
      change: 'Products available'
    },
    {
      title: 'Total Orders',
      value: analytics.total_orders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      change: `${analytics.completed_orders} completed`
    },
    {
      title: 'Pending Orders',
      value: analytics.pending_orders,
      icon: Clock,
      color: 'bg-yellow-500',
      change: 'Awaiting action'
    },
    {
      title: 'Total Revenue',
      value: `₹${analytics.total_revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      change: 'From subscriptions'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-foreground-muted">Welcome back, manage your platform</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin/users')}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90"
              >
                Manage Users
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-foreground-muted mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-foreground mb-1">{stat.value}</h3>
                    <p className="text-xs text-foreground-muted">{stat.change}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Subscription Stats */}
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Subscription Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-700">{analytics.subscription_stats.active}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
              <Clock className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Grace Period</p>
                <p className="text-2xl font-bold text-yellow-700">{analytics.subscription_stats.grace_period}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-700">{analytics.subscription_stats.expired}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Stores */}
        {analytics.top_stores.length > 0 && (
          <Card className="p-6 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-4">Top Rated Stores</h3>
            <div className="space-y-3">
              {analytics.top_stores.map((store, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{store.store_name}</p>
                      <p className="text-sm text-foreground-muted">{store.total_reviews} reviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{store.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors text-left"
          >
            <Users className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-1">User Management</h4>
            <p className="text-sm text-foreground-muted">View and manage all users</p>
          </button>
          
          <button
            onClick={() => navigate('/admin/stores')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors text-left"
          >
            <Store className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-1">Store Management</h4>
            <p className="text-sm text-foreground-muted">Manage stores & FSSAI</p>
          </button>
          
          <button
            onClick={() => navigate('/admin/products')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors text-left"
          >
            <Package className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-1">Product Management</h4>
            <p className="text-sm text-foreground-muted">View and moderate listings</p>
          </button>
          
          <button
            onClick={() => navigate('/admin/orders')}
            className="p-6 bg-white rounded-lg border-2 border-gray-200 hover:border-primary transition-colors text-left"
          >
            <ShoppingCart className="w-8 h-8 text-primary mb-3" />
            <h4 className="font-semibold text-foreground mb-1">Order Monitoring</h4>
            <p className="text-sm text-foreground-muted">Track all orders</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;