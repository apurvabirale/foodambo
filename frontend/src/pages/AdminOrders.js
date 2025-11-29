import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const statusOptions = [
    { value: '', label: 'All Orders', icon: Package },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'accepted', label: 'Accepted', icon: CheckCircle },
    { value: 'completed', label: 'Completed', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
    { value: 'cancelled', label: 'Cancelled', icon: XCircle }
  ];

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/orders', {
        params: { status, page, limit: 20 }
      });
      setOrders(response.data.orders);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'accepted':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-border sticky top-0 z-10">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Order Monitoring</h1>
              <p className="text-sm text-foreground-muted">{total} total orders</p>
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {statusOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setStatus(opt.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 whitespace-nowrap ${
                    status === opt.value
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-foreground-muted">Loading orders...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {orders.map((order) => (
                <Card key={order.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-foreground mb-1">
                        Order #{order.id.substring(0, 8)}
                      </h3>
                      <p className="text-sm text-foreground-muted">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">Product</p>
                      <p className="font-semibold text-foreground">{order.product_title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">Quantity</p>
                      <p className="font-semibold text-foreground">{order.quantity} units</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">Buyer</p>
                      <p className="font-semibold text-foreground">{order.buyer_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">Seller</p>
                      <p className="font-semibold text-foreground">{order.seller_name || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-foreground-muted">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">₹{order.total_amount}</p>
                    </div>
                    {order.delivery_method && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold">
                        {order.delivery_method === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                      </span>
                    )}
                  </div>

                  {order.delivery_address && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-foreground-muted mb-1">Delivery Address</p>
                      <p className="text-sm text-foreground">{order.delivery_address}</p>
                    </div>
                  )}
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-foreground-muted">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;