import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const AdminStores = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showFssaiPending, setShowFssaiPending] = useState(false);

  useEffect(() => {
    fetchStores();
  }, [page, showFssaiPending]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchStores();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/stores', {
        params: { search, page, limit: 20, fssai_pending: showFssaiPending }
      });
      setStores(response.data.stores);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const verifyFssai = async (storeId) => {
    try {
      await api.put(`/admin/stores/${storeId}/verify-fssai`);
      toast.success('FSSAI certificate verified');
      fetchStores();
    } catch (error) {
      toast.error('Failed to verify FSSAI');
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
              <h1 className="text-2xl font-bold text-foreground">Store Management</h1>
              <p className="text-sm text-foreground-muted">{total} total stores</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setShowFssaiPending(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                !showFssaiPending
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Stores
            </button>
            <button
              onClick={() => setShowFssaiPending(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                showFssaiPending
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AlertCircle className="w-4 h-4" />
              FSSAI Pending
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stores..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="p-4 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
            <p className="text-foreground-muted">Loading stores...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {stores.map((store) => (
                <Card key={store.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Store Photo */}
                    {store.store_photo && (
                      <img
                        src={store.store_photo}
                        alt={store.store_name}
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    
                    {/* Store Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg text-foreground">{store.store_name}</h3>
                        {store.is_pure_veg && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-semibold">
                            Pure Veg
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm mb-3">
                        <p className="text-foreground-muted">📍 {store.address}</p>
                        {store.user && (
                          <p className="text-foreground-muted">
                            Owner: {store.user.name} ({store.user.email || store.user.phone})
                          </p>
                        )}
                        <p className="text-foreground-muted">
                          Rating: ⭐ {store.rating.toFixed(1)} ({store.total_reviews} reviews)
                        </p>
                        {store.user?.subscription_status && (
                          <p className="text-foreground-muted">
                            Subscription: <span className={`font-semibold ${
                              store.user.subscription_status === 'active' ? 'text-green-600' :
                              store.user.subscription_status === 'grace_period' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>{store.user.subscription_status}</span>
                          </p>
                        )}
                      </div>

                      {/* FSSAI Status */}
                      <div className="flex items-center gap-3">
                        {store.fssai_verified ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">FSSAI Verified</span>
                          </div>
                        ) : store.fssai_submitted_at ? (
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-yellow-600">
                              <AlertCircle className="w-5 h-5" />
                              <span className="text-sm font-semibold">FSSAI Pending Verification</span>
                            </div>
                            {store.fssai_certificate_url && (
                              <a
                                href={store.fssai_certificate_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
                              >
                                <FileText className="w-4 h-4" />
                                View Certificate
                              </a>
                            )}
                            <button
                              onClick={() => verifyFssai(store.id)}
                              className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">
                            No FSSAI certificate submitted
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
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

export default AdminStores;