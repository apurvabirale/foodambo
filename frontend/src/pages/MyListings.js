import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../utils/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';

const MyListings = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getMy();
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    
    try {
      await productAPI.delete(id);
      toast.success('Listing deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete listing');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="my-listings-page">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">My Listings</h1>
          <Button
            onClick={() => navigate('/create-listing')}
            size="sm"
            className="btn-primary"
            data-testid="add-listing-btn"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-foreground-muted mb-4">No listings yet</p>
            <Button onClick={() => navigate('/create-listing')}>Create First Listing</Button>
          </div>
        ) : (
          products.map((product) => (
            <Card key={product.id} className="p-4" data-testid={`listing-${product.id}`}>
              <div className="flex gap-4">
                <div className="w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                  {product.photos?.[0] ? (
                    <img src={product.photos[0]} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{product.title}</h3>
                  <p className="text-sm text-foreground-muted line-clamp-2 mb-2">{product.description}</p>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-bold text-primary">₹{product.price}</span>
                    {!product.active && (
                      <span className="badge" style={{ background: '#ccc', color: '#666' }}>Inactive</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(product.id)}
                      className="text-destructive"
                      data-testid={`delete-${product.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MyListings;