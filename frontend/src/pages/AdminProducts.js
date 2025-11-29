import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Search, ChevronLeft, ChevronRight, Trash2, ExternalLink } from 'lucide-react';
import api from '../utils/api';

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'fresh_food', label: 'Fresh Food' },
    { value: 'pickles', label: 'Pickles & Chutneys' },
    { value: 'vegetables', label: 'Vegetables & Farm' },
    { value: 'art_handmade', label: 'Art & Handmade' },
    { value: 'party_package', label: 'Party Package' }
  ];

  useEffect(() => {
    fetchProducts();
  }, [page, category]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (page === 1) {
        fetchProducts();
      } else {
        setPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/products', {
        params: { search, category, page, limit: 20 }
      });
      setProducts(response.data.products);
      setTotal(response.data.total);
      setTotalPages(response.data.pages);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId, productTitle) => {
    if (!window.confirm(`Are you sure you want to deactivate "${productTitle}"?`)) {
      return;
    }

    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Product deactivated');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to deactivate product');
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
              <h1 className="text-2xl font-bold text-foreground">Product Management</h1>
              <p className="text-sm text-foreground-muted">{total} total products</p>
            </div>
          </div>

          {/* Category Filter */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mb-3 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
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
            <p className="text-foreground-muted">Loading products...</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {products.map((product) => (
                <Card key={product.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Product Photo */}
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {product.photos && product.photos[0] ? (
                        <img
                          src={product.photos[0]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-foreground mb-1">{product.title}</h3>
                          <p className="text-sm text-foreground-muted mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-primary">₹{product.price}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                          {product.category.replace('_', ' ')}
                        </span>
                        {product.store_name && (
                          <span className="text-foreground-muted">
                            🏪 {product.store_name}
                          </span>
                        )}
                        {product.is_veg !== undefined && (
                          <span className={`px-2 py-1 rounded-full font-semibold ${
                            product.is_veg
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {product.is_veg ? '🌿 Veg' : '🍗 Non-Veg'}
                          </span>
                        )}
                        {product.is_party_order && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold">
                            🎉 Party Order
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 flex items-center gap-1"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View
                        </button>
                        {product.active && (
                          <button
                            onClick={() => deleteProduct(product.id, product.title)}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deactivate
                          </button>
                        )}
                        {!product.active && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            Inactive
                          </span>
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

export default AdminProducts;