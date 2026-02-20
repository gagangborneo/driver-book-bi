'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TripRatingProps {
  bookingId: string;
  token: string;
  onRatingSubmitted?: () => void | Promise<void>;
}

export function TripRating({ bookingId, token, onRatingSubmitted }: TripRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0) {
      toast({
        title: 'Peringatan',
        description: 'Silakan pilih rating terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api(`/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          rating,
          ratingComment: comment.trim() || null
        }),
      }, token);

      console.log('Rating response:', response);

      toast({
        title: 'Berhasil',
        description: 'Rating berhasil diberikan. Terima kasih atas penilaian Anda!',
      });

      if (onRatingSubmitted) {
        await Promise.resolve(onRatingSubmitted());
      }
    } catch (error) {
      console.error('Rating error:', error);
      toast({
        title: 'Gagal',
        description: error instanceof Error ? error.message : 'Terjadi kesalahan saat mengirim rating',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
      <div>
        <h4 className="text-sm font-semibold mb-2">Beri Rating Perjalanan</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Bagaimana pengalaman Anda dengan layanan ini?
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHoveredRating(value)}
            onMouseLeave={() => setHoveredRating(0)}
            className="transition-transform hover:scale-110 focus:outline-none"
          >
            <Star
              className={cn(
                'h-8 w-8 transition-colors',
                (hoveredRating || rating) >= value
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-slate-200 text-slate-300'
              )}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm font-medium text-slate-700">
            {rating === 1 && 'Sangat Buruk'}
            {rating === 2 && 'Buruk'}
            {rating === 3 && 'Cukup'}
            {rating === 4 && 'Baik'}
            {rating === 5 && 'Sangat Baik'}
          </span>
        )}
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Tambahkan komentar (opsional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="min-h-[80px] resize-none text-sm"
      />

      {/* Submit Button */}
      <Button 
        onClick={handleSubmit} 
        disabled={isSubmitting || rating === 0}
        className="w-full"
        size="sm"
      >
        {isSubmitting ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Mengirim...
          </>
        ) : (
          'Kirim Rating'
        )}
      </Button>
    </div>
  );
}

interface TripRatingDisplayProps {
  rating: number;
  comment?: string | null;
}

export function TripRatingDisplay({ rating, comment }: TripRatingDisplayProps) {
  return (
    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-2">
      <h4 className="text-sm font-semibold text-amber-900">Rating Perjalanan</h4>
      
      {/* Star Display */}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={cn(
              'h-5 w-5',
              rating >= value
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-slate-200 text-slate-300'
            )}
          />
        ))}
        <span className="ml-2 text-sm font-medium text-amber-900">
          {rating === 1 && 'Sangat Buruk'}
          {rating === 2 && 'Buruk'}
          {rating === 3 && 'Cukup'}
          {rating === 4 && 'Baik'}
          {rating === 5 && 'Sangat Baik'}
        </span>
      </div>

      {/* Comment */}
      {comment && (
        <div className="pt-2 border-t border-amber-200">
          <p className="text-sm text-amber-900">{comment}</p>
        </div>
      )}
    </div>
  );
}
