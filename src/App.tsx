import { useState, useMemo } from 'react';
import { useNeoData } from './hooks/useNeoData';
import { Header } from './components/Header';
import { Filters } from './components/Filters';
import { DebrisTable } from './components/DebrisTable';
import { DebrisDetail } from './components/DebrisDetail';
import { StatsBar } from './components/StatsBar';
import type { FilterState, NearEarthObject, SortField, SortDirection } from './types/nasa';
import './App.css';

const defaultFilters: FilterState = {
  hazardousOnly: false,
  minDiameter: 0,
  maxDiameter: Infinity,
  search: '',
};

function App() {
  const { objects, loading, error, totalCount, startDate, endDate, setDateRange, refresh } =
    useNeoData();

  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [sortField, setSortField] = useState<SortField>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedObject, setSelectedObject] = useState<NearEarthObject | null>(null);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...objects];

    if (filters.hazardousOnly) {
      result = result.filter((o) => o.is_potentially_hazardous_asteroid);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (o) => o.name.toLowerCase().includes(q) || o.neo_reference_id.includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: number;
      let bVal: number;
      switch (sortField) {
        case 'name':
          return sortDirection === 'asc'
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'diameter': {
          const da = a.estimated_diameter.meters;
          const db = b.estimated_diameter.meters;
          aVal = (da.estimated_diameter_min + da.estimated_diameter_max) / 2;
          bVal = (db.estimated_diameter_min + db.estimated_diameter_max) / 2;
          break;
        }
        case 'velocity':
          aVal = parseFloat(a.close_approach_data[0]?.relative_velocity.kilometers_per_hour ?? '0');
          bVal = parseFloat(b.close_approach_data[0]?.relative_velocity.kilometers_per_hour ?? '0');
          break;
        case 'distance':
          aVal = parseFloat(a.close_approach_data[0]?.miss_distance.kilometers ?? '999999999');
          bVal = parseFloat(b.close_approach_data[0]?.miss_distance.kilometers ?? '999999999');
          break;
        case 'magnitude':
          aVal = a.absolute_magnitude_h;
          bVal = b.absolute_magnitude_h;
          break;
        default:
          return 0;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [objects, filters, sortField, sortDirection]);

  const hazardousCount = objects.filter((o) => o.is_potentially_hazardous_asteroid).length;

  return (
    <div className="app">
      <Header totalCount={totalCount} hazardousCount={hazardousCount} loading={loading} />

      <main className="main">
        <Filters
          startDate={startDate}
          endDate={endDate}
          filters={filters}
          onDateRangeChange={setDateRange}
          onFiltersChange={setFilters}
          onRefresh={refresh}
          loading={loading}
        />

        {!loading && <StatsBar objects={objects} />}

        {error && (
          <div className="error-banner">
            ⚠️ {error}
            <button className="btn btn--retry" onClick={refresh}>
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Scanning for space debris...</p>
          </div>
        ) : (
          <div className="results-section">
            <div className="results-header">
              <h2>
                {filteredAndSorted.length} object{filteredAndSorted.length !== 1 ? 's' : ''} found
              </h2>
              <span className="results-hint">Click any row for details</span>
            </div>
            <DebrisTable
              objects={filteredAndSorted}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
              onSelect={setSelectedObject}
              selectedId={selectedObject?.id ?? null}
            />
          </div>
        )}
      </main>

      {selectedObject && (
        <DebrisDetail object={selectedObject} onClose={() => setSelectedObject(null)} />
      )}

      <footer className="footer">
        <p>
          Data provided by{' '}
          <a href="https://api.nasa.gov/" target="_blank" rel="noopener noreferrer">
            NASA NeoWs API
          </a>{' '}
          · LD = Lunar Distance (384,400 km) · AU = Astronomical Unit
        </p>
      </footer>
    </div>
  );
}

export default App;
