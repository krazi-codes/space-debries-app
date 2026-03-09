import type { NeoFeedResponse } from '../types/nasa';

const NASA_API_KEY = 'DEMO_KEY';
const BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

export async function fetchNeoFeed(startDate: string, endDate: string): Promise<NeoFeedResponse> {
  const url = new URL(`${BASE_URL}/feed`);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('api_key', NASA_API_KEY);

  const response = await fetch(url.toString());
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error_message || `NASA API error: ${response.status} ${response.statusText}`
    );
  }
  return response.json();
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayAndWeekAgo(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return { start: formatDate(start), end: formatDate(end) };
}
