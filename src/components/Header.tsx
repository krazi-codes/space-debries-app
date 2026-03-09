interface HeaderProps {
  totalCount: number;
  hazardousCount: number;
  loading: boolean;
}

export function Header({ totalCount, hazardousCount, loading }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <span className="header-icon">🛸</span>
          <div>
            <h1>Space Debris Tracker</h1>
            <p className="header-subtitle">Near-Earth Object Monitoring System</p>
          </div>
        </div>
        <div className="header-stats">
          {loading ? (
            <span className="loading-badge">⏳ Loading...</span>
          ) : (
            <>
              <div className="stat-badge">
                <span className="stat-number">{totalCount}</span>
                <span className="stat-label">Objects Tracked</span>
              </div>
              <div className="stat-badge stat-badge--danger">
                <span className="stat-number">{hazardousCount}</span>
                <span className="stat-label">Hazardous</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
