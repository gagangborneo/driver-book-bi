'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { TravelDetailCard } from '@/components/shared/travel-detail-card';
import { TripRating } from '@/components/shared/trip-rating';

interface TravelDetailModalProps {
  booking: Record<string, unknown> | null;
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onRatingSubmitted?: () => void;
  showDriver?: boolean;
}

export function TravelDetailModal({ 
  booking, 
  isOpen, 
  onClose, 
  token,
  onRatingSubmitted,
  showDriver = true 
}: TravelDetailModalProps) {
  const [isRatingProcessing, setIsRatingProcessing] = useState(false);

  if (!booking) return null;

  const handleRatingSubmitted = async () => {
    setIsRatingProcessing(true);
    try {
      if (onRatingSubmitted) {
        await onRatingSubmitted();
      }
      // Wait a moment for data to be refreshed
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsRatingProcessing(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="sr-only">Detail Perjalanan</DialogTitle>
        <div className="space-y-3">
          <TravelDetailCard 
            booking={booking}
            showDriver={showDriver}
            token={token}
          />

          {/* Rating Form for Completed Trip */}
          {(booking.status as string) === 'COMPLETED' && !booking.rating && (
            <TripRating 
              bookingId={booking.id as string}
              token={token}
              onRatingSubmitted={handleRatingSubmitted}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
