interface SubpageSkeletonProps {
  rows?: number;
}

export function SubpageSkeleton({ rows = 4 }: SubpageSkeletonProps) {
  return (
    <section className="subpage-skeleton" aria-hidden="true">
      <div className="skeleton-line skeleton-line-title" />
      <div className="skeleton-line skeleton-line-subtitle" />
      <div className="skeleton-grid">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="skeleton-card" />
        ))}
      </div>
    </section>
  );
}
