'use client';

interface LoadingSkeletonProps {
  count?: number;
  height?: string;
}

export function LoadingSkeleton({ count = 3, height = 'h-20' }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${height} bg-slate-100 rounded-xl animate-pulse`} />
      ))}
    </div>
  );
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
