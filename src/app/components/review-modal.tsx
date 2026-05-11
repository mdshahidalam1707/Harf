import { useState } from 'react';
import { supabase, submitReview } from '@/lib/supabase';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { Star, Loader2 } from 'lucide-react';

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewedUserId: string;
  reviewedUserName: string;
  onReviewSubmitted?: () => void;
}

export function ReviewModal({ open, onOpenChange, reviewedUserId, reviewedUserName, onReviewSubmitted }: ReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating < 1 || rating > 5) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReview(reviewedUserId, rating, review.trim());
      
      if (result) {
        alert('Review submitted successfully!');
        setRating(5);
        setReview('');
        onOpenChange(false);
        if (onReviewSubmitted) onReviewSubmitted();
      } else {
        alert('Failed to submit review. You may have already reviewed this user.');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-8 h-8 ${
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-gray-200 text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {reviewedUserName}</DialogTitle>
          <DialogDescription>
            Share your experience working with this user
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex justify-center">
              {renderStars()}
            </div>
            <p className="text-center text-sm text-gray-500">
              {rating === 5 && 'Excellent'}
              {rating === 4 && 'Very Good'}
              {rating === 3 && 'Good'}
              {rating === 2 && 'Fair'}
              {rating === 1 && 'Poor'}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-2">
            <Label htmlFor="review">Review (optional)</Label>
            <Textarea
              id="review"
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}