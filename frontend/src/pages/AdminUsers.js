import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, UserCheck, UserX } from 'lucide-react';
import api from '../utils/api';

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchUsers();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', {
        params: { search, page, limit: 20 }
      });
      setUsers(response.data.users);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserActive = async (userId, currentStatus) => {
    try {
      const response = await api.put(`/admin/users/${userId}/toggle-active`);
      toast.success(`User ${response.data.seller_active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
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
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-sm text-foreground-muted">{total} total users</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
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
            <p className="text-foreground-muted">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-foreground">{user.name}</h3>
                        {user.is_admin && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-semibold">
                            ADMIN
                          </span>
                        )}
                        {user.is_seller && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold">
                            SELLER
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        {user.email && (
                          <p className="text-foreground-muted">📧 {user.email}</p>
                        )}
                        {user.phone && (
                          <p className="text-foreground-muted">📱 {user.phone}</p>
                        )}
                        <p className="text-foreground-muted">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                        {user.subscription_status && (
                          <p className="text-foreground-muted">
                            Subscription: <span className={`font-semibold ${
                              user.subscription_status === 'active' ? 'text-green-600' :
                              user.subscription_status === 'grace_period' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>{user.subscription_status}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {user.is_seller && !user.is_admin && (
                      <button
                        onClick={() => toggleUserActive(user.id, user.seller_active)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                          user.seller_active
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {user.seller_active ? (
                          <>
                            <UserX className="w-4 h-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Activate
                          </>
                        )}
                      </button>
                    )}
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

export default AdminUsers;