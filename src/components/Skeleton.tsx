interface SkeletonTextProps {
  width?: string | number;
  height?: number;
}

export function SkeletonText({ width = "100%", height = 12 }: SkeletonTextProps) {
  return <div className="skeleton skeleton-text" style={{ width, height }} />;
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="row-between">
        <SkeletonText width={70} height={20} />
        <SkeletonText width={60} height={18} />
      </div>
      <SkeletonText width="80%" height={16} />
      <SkeletonText width="100%" />
      <SkeletonText width="60%" />
      <div style={{ marginTop: 6 }}>
        <SkeletonText width="100%" height={7} />
      </div>
      <SkeletonText width="100%" height={34} />
    </div>
  );
}

export function SkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="topic-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonStatRow({ count = 4 }: { count?: number }) {
  return (
    <div className="stat-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i} style={{ padding: "18px 20px" }}>
          <SkeletonText width={34} height={34} />
          <SkeletonText width="50%" height={22} />
          <SkeletonText width="70%" />
        </div>
      ))}
    </div>
  );
}
