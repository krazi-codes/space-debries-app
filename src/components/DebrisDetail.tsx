import type { NearEarthObject } from '../types/nasa';

interface DebrisDetailProps {
  object: NearEarthObject;
  onClose: () => void;
}

function DataRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

export function DebrisDetail({ object, onClose }: DebrisDetailProps) {
  const closest = object.close_approach_data[0];
  const diam = object.estimated_diameter.meters;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Debris detail">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">{object.is_potentially_hazardous_asteroid ? '☠️' : '🪨'}</span>
            <div>
              <h2 className="modal-title">{object.name.replace(/[()]/g, '')}</h2>
              <span className="modal-id">NEO ID: {object.neo_reference_id}</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <h3>⚠️ Hazard Assessment</h3>
            <DataRow
              label="Potentially Hazardous"
              value={object.is_potentially_hazardous_asteroid ? 'YES ☠️' : 'No ✅'}
            />
            <DataRow
              label="Sentry Object"
              value={object.is_sentry_object ? 'YES' : 'No'}
            />
            <DataRow
              label="Absolute Magnitude"
              value={`${object.absolute_magnitude_h.toFixed(2)} H`}
            />
          </div>

          <div className="detail-section">
            <h3>📏 Estimated Diameter</h3>
            <DataRow
              label="Minimum (meters)"
              value={`${diam.estimated_diameter_min.toFixed(2)} m`}
            />
            <DataRow
              label="Maximum (meters)"
              value={`${diam.estimated_diameter_max.toFixed(2)} m`}
            />
            <DataRow
              label="Average (meters)"
              value={`${((diam.estimated_diameter_min + diam.estimated_diameter_max) / 2).toFixed(2)} m`}
            />
          </div>

          {closest && (
            <div className="detail-section">
              <h3>🌍 Closest Approach</h3>
              <DataRow label="Date" value={closest.close_approach_date_full} />
              <DataRow label="Orbiting Body" value={closest.orbiting_body} />
              <DataRow
                label="Velocity (km/s)"
                value={`${Number(closest.relative_velocity.kilometers_per_second).toFixed(2)} km/s`}
              />
              <DataRow
                label="Velocity (km/h)"
                value={`${Number(closest.relative_velocity.kilometers_per_hour).toLocaleString()} km/h`}
              />
              <DataRow
                label="Miss Distance (km)"
                value={`${Number(closest.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`}
              />
              <DataRow
                label="Miss Distance (AU)"
                value={`${Number(closest.miss_distance.astronomical).toFixed(4)} AU`}
              />
              <DataRow
                label="Miss Distance (Lunar)"
                value={`${Number(closest.miss_distance.lunar).toFixed(2)} LD`}
              />
            </div>
          )}

          {object.close_approach_data.length > 1 && (
            <div className="detail-section">
              <h3>📅 All Approaches ({object.close_approach_data.length})</h3>
              <div className="approaches-list">
                {object.close_approach_data.slice(0, 5).map((approach, i) => (
                  <div key={i} className="approach-item">
                    <span className="approach-date">{approach.close_approach_date}</span>
                    <span className="approach-dist">
                      {Number(approach.miss_distance.lunar).toFixed(1)} LD
                    </span>
                    <span className="approach-vel">
                      {Number(approach.relative_velocity.kilometers_per_second).toFixed(1)} km/s
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <a
            href={object.nasa_jpl_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--link"
          >
            🔗 View on NASA JPL
          </a>
          <button className="btn btn--close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
