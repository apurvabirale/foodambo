import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, reviewAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Star } from 'lucide-react';

const LeaveReview = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getMy();
      const currentOrder = response.data.find(o => o.id === orderId);
      if (!currentOrder) {
        toast.error('Order not found');
        navigate('/my-orders');
        return;
      }
      if (currentOrder.status !== 'completed') {
        toast.error('You can only review completed orders');
        navigate('/my-orders');
        return;
      }
      setOrder(currentOrder);
    } catch (error) {
      toast.error('Failed to load order');
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await reviewAPI.create({
        order_id: orderId,
        rating,
        comment: comment.trim()
      });
      toast.success('Review submitted successfully!');
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-lg border-b border-border">
        <div className="p-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Leave a Review</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card className="p-6 space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">How was your experience?</h2>
            <p className="text-sm text-foreground-muted">
              Your feedback helps other buyers make informed decisions
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <label className="text-sm font-medium block text-center">Rating *</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        star <= (hoverRating || rating)
                          ? 'text-secondary fill-secondary'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-center text-sm text-foreground-muted">
                {rating === 0 && 'Tap to rate'}
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </p>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review (Optional)</label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the food quality, taste, packaging, or service..."
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-foreground-muted text-right">
                {comment.length}/500 characters
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || rating === 0}
              className="w-full bg-primary hover:bg-primary/90 h-12"
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        </Card>

        {/* Tips */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm font-medium text-blue-900 mb-2">💡 Review Tips:</p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Be honest and constructive</li>
            <li>• Mention specific aspects (taste, quality, packaging)</li>
            <li>• Help other buyers make informed choices</li>
            <li>• Your review will appear on the store profile</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default LeaveReview;
