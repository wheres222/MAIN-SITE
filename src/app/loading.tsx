export default function Loading() {
  return (
    <div className="page-loading-skeleton">
      <div className="skeleton-nav" />
      <div className="skeleton-content">
        <div className="skeleton-block skeleton-block--wide" />
        <div className="skeleton-block skeleton-block--medium" />
        <div className="skeleton-block skeleton-block--narrow" />
      </div>
    </div>
  );
}
