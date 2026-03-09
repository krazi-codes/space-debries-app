import type { FilterState } from '../types/nasa';

interface FiltersProps {
  startDate: string;
  endDate: string;
  filters: FilterState;
  onDateRangeChange: (start: string, end: string) => void;
  onFiltersChange: (filters: FilterState) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function Filters({
  startDate,
  endDate,
  filters,
  onDateRangeChange,
  onFiltersChange,
  onRefresh,
  loading,
}: FiltersProps) {
  const handleStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange(e.target.value, endDate);
  };

  const handleEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    onDateRangeChange(startDate, e.target.value);
  };

  const maxDate = new Date().toISOString().split('T')[0];

  return (
    <div className="filters">
      <div className="filters-row">
        <div className="filter-group">
          <label htmlFor="start-date">Start Date</label>
          <input
            id="start-date"
            type="date"
            value={startDate}
            max={endDate || maxDate}
            onChange={handleStartDate}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="end-date">End Date</label>
          <input
            id="end-date"
            type="date"
            value={endDate}
            min={startDate}
            max={maxDate}
            onChange={handleEndDate}
          />
        </div>
        <div className="filter-group filter-group--search">
          <label htmlFor="search">Search</label>
          <input
            id="search"
            type="text"
            placeholder="Search by name or ID..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>
        <div className="filter-group filter-group--checkbox">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={filters.hazardousOnly}
              onChange={(e) => onFiltersChange({ ...filters, hazardousOnly: e.target.checked })}
            />
            <span>Hazardous Only ☠️</span>
          </label>
        </div>
        <button
          className="btn btn--refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh data"
        >
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>
    </div>
  );
}
