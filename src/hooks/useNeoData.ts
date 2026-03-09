import { useState, useEffect, useReducer } from 'react';
import { fetchNeoFeed, getTodayAndWeekAgo } from '../services/nasaApi';
import type { NearEarthObject, NeoFeedResponse } from '../types/nasa';

export interface UseNeoDataReturn {
  objects: NearEarthObject[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  startDate: string;
  endDate: string;
  setDateRange: (start: string, end: string) => void;
  refresh: () => void;
}

interface FetchState {
  data: NeoFeedResponse | null;
  loading: boolean;
  error: string | null;
}

type FetchAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: NeoFeedResponse }
  | { type: 'FETCH_ERROR'; payload: string };

function fetchReducer(state: FetchState, action: FetchAction): FetchState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return { data: action.payload, loading: false, error: null };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    default:
      return state;
  }
}

export function useNeoData(): UseNeoDataReturn {
  const defaultRange = getTodayAndWeekAgo();
  const [startDate, setStartDate] = useState(defaultRange.start);
  const [endDate, setEndDate] = useState(defaultRange.end);
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, dispatch] = useReducer(fetchReducer, {
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    dispatch({ type: 'FETCH_START' });
    fetchNeoFeed(startDate, endDate)
      .then((result) => {
        if (!cancelled) dispatch({ type: 'FETCH_SUCCESS', payload: result });
      })
      .catch((err) => {
        if (!cancelled)
          dispatch({
            type: 'FETCH_ERROR',
            payload: err instanceof Error ? err.message : 'Failed to fetch data',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [startDate, endDate, refreshKey]);

  const objects: NearEarthObject[] = state.data
    ? Object.values(state.data.near_earth_objects).flat()
    : [];

  const setDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  const refresh = () => setRefreshKey((k) => k + 1);

  return {
    objects,
    loading: state.loading,
    error: state.error,
    totalCount: state.data?.element_count ?? 0,
    startDate,
    endDate,
    setDateRange,
    refresh,
  };
}
