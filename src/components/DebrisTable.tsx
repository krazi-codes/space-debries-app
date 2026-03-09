import type { NearEarthObject, SortField, SortDirection } from '../types/nasa';

interface DebrisTableProps {
  objects: NearEarthObject[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSelect: (obj: NearEarthObject) => void;
  selectedId: string | null;
}

function getSortIcon(field: SortField, current: SortField, direction: SortDirection) {
  if (field !== current) return '↕';
  return direction === 'asc' ? '↑' : '↓';
}

function getDiameterAvg(obj: NearEarthObject): number {
  const d = obj.estimated_diameter.meters;
  return (d.estimated_diameter_min + d.estimated_diameter_max) / 2;
}

function getThreatLevel(obj: NearEarthObject): { label: string; className: string } {
  if (obj.is_potentially_hazardous_asteroid) {
    const closest = obj.close_approach_data[0];
    const lunarDist = closest ? parseFloat(closest.miss_distance.lunar) : 999;
    if (lunarDist < 5) return { label: 'HIGH', className: 'threat-high' };
    return { label: 'MEDIUM', className: 'threat-medium' };
  }
  return { label: 'LOW', className: 'threat-low' };
}

export function DebrisTable({
  objects,
  sortField,
  sortDirection,
  onSort,
  onSelect,
  selectedId,
}: DebrisTableProps) {
  if (objects.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🔭</span>
        <p>No space debris found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="debris-table">
        <thead>
          <tr>
            <th>Status</th>
            <th
              className="sortable"
              onClick={() => onSort('name')}
              title="Sort by name"
            >
              Name {getSortIcon('name', sortField, sortDirection)}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('diameter')}
              title="Sort by diameter"
            >
              Diameter (m) {getSortIcon('diameter', sortField, sortDirection)}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('velocity')}
              title="Sort by velocity"
            >
              Velocity (km/h) {getSortIcon('velocity', sortField, sortDirection)}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('distance')}
              title="Sort by miss distance"
            >
              Miss Distance (km) {getSortIcon('distance', sortField, sortDirection)}
            </th>
            <th
              className="sortable"
              onClick={() => onSort('magnitude')}
              title="Sort by magnitude"
            >
              Magnitude {getSortIcon('magnitude', sortField, sortDirection)}
            </th>
            <th>Approach Date</th>
            <th>Threat</th>
          </tr>
        </thead>
        <tbody>
          {objects.map((obj) => {
            const closest = obj.close_approach_data[0];
            const diameter = getDiameterAvg(obj);
            const threat = getThreatLevel(obj);
            const isSelected = obj.id === selectedId;

            return (
              <tr
                key={obj.id}
                className={`debris-row ${isSelected ? 'debris-row--selected' : ''} ${obj.is_potentially_hazardous_asteroid ? 'debris-row--hazardous' : ''}`}
                onClick={() => onSelect(obj)}
                title="Click for details"
              >
                <td>
                  <span className={`status-dot ${obj.is_potentially_hazardous_asteroid ? 'status-dot--danger' : 'status-dot--safe'}`} />
                </td>
                <td className="name-cell">
                  <span className="debris-name">{obj.name.replace(/[()]/g, '')}</span>
                  <span className="debris-id">#{obj.neo_reference_id}</span>
                </td>
                <td>{diameter.toFixed(1)}</td>
                <td>
                  {closest
                    ? Number(closest.relative_velocity.kilometers_per_hour).toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : 'N/A'}
                </td>
                <td>
                  {closest
                    ? Number(closest.miss_distance.kilometers).toLocaleString(undefined, { maximumFractionDigits: 0 })
                    : 'N/A'}
                </td>
                <td>{obj.absolute_magnitude_h.toFixed(1)}</td>
                <td>{closest ? closest.close_approach_date : 'N/A'}</td>
                <td>
                  <span className={`threat-badge ${threat.className}`}>{threat.label}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
