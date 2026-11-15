import { cx } from '../lib/format';

/** Shimmer placeholders — matches the card rhythm while data loads */
export default function Skeleton({ className }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />;
}

export function KpiSkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[7.25rem]" />)}
    </div>
  );
}

export function CardSkeleton({ className }) {
  return <Skeleton className={cx('h-80', className)} />;
}
