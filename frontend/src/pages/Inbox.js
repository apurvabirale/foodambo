import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Package, MessageSquare } from 'lucide-react';

const Inbox = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [sellerOrders, setSellerOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const [myOrders, sellerOrdersData] = await Promise.all([
        orderAPI.getMy(),
        orderAPI.getSeller().catch(() => ({ data: [] }))
      ]);
      setOrders(myOrders.data.filter(o => o.status !== 'completed'));
      setSellerOrders(sellerOrdersData.data.filter(o => o.status !== 'completed'));
    } catch (error) {
      console.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  const allOrders = [...orders, ...sellerOrders];

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="inbox-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {allOrders.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-foreground-muted">No active conversations</p>
          </div>
        ) : (
          allOrders.map((order) => (
            <Card
              key={order.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/my-orders`)}
              data-testid={`inbox-order-${order.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Order #{order.id.slice(0, 8)}</h3>
                  <p className="text-sm text-foreground-muted">Status: {order.status}</p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary"></div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Inbox;