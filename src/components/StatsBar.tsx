import type { NearEarthObject } from '../types/nasa';

interface StatsBarProps {
  objects: NearEarthObject[];
}

export function StatsBar({ objects }: StatsBarProps) {
  const hazardous = objects.filter((o) => o.is_potentially_hazardous_asteroid).length;
  const avgDiam =
    objects.length > 0
      ? objects.reduce((sum, o) => {
          const d = o.estimated_diameter.meters;
          return sum + (d.estimated_diameter_min + d.estimated_diameter_max) / 2;
        }, 0) / objects.length
      : 0;

  const fastestObj = objects.reduce<NearEarthObject | null>((fastest, o) => {
    if (!o.close_approach_data[0]) return fastest;
    if (!fastest || !fastest.close_approach_data[0]) return o;
    return parseFloat(o.close_approach_data[0].relative_velocity.kilometers_per_hour) >
      parseFloat(fastest.close_approach_data[0].relative_velocity.kilometers_per_hour)
      ? o
      : fastest;
  }, null);

  const closestObj = objects.reduce<NearEarthObject | null>((closest, o) => {
    if (!o.close_approach_data[0]) return closest;
    if (!closest || !closest.close_approach_data[0]) return o;
    return parseFloat(o.close_approach_data[0].miss_distance.kilometers) <
      parseFloat(closest.close_approach_data[0].miss_distance.kilometers)
      ? o
      : closest;
  }, null);

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-card-icon">🪨</span>
        <div>
          <div className="stat-card-value">{objects.length}</div>
          <div className="stat-card-label">Total Objects</div>
        </div>
      </div>
      <div className="stat-card stat-card--danger">
        <span className="stat-card-icon">☠️</span>
        <div>
          <div className="stat-card-value">{hazardous}</div>
          <div className="stat-card-label">Potentially Hazardous</div>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-card-icon">📏</span>
        <div>
          <div className="stat-card-value">{avgDiam.toFixed(1)} m</div>
          <div className="stat-card-label">Avg Diameter</div>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-card-icon">⚡</span>
        <div>
          <div className="stat-card-value">
            {fastestObj?.close_approach_data[0]
              ? `${(parseFloat(fastestObj.close_approach_data[0].relative_velocity.kilometers_per_hour) / 1000).toFixed(0)}k km/h`
              : 'N/A'}
          </div>
          <div className="stat-card-label">Fastest Object</div>
        </div>
      </div>
      <div className="stat-card">
        <span className="stat-card-icon">🎯</span>
        <div>
          <div className="stat-card-value">
            {closestObj?.close_approach_data[0]
              ? `${Number(closestObj.close_approach_data[0].miss_distance.lunar).toFixed(1)} LD`
              : 'N/A'}
          </div>
          <div className="stat-card-label">Closest Approach</div>
        </div>
      </div>
    </div>
  );
}
