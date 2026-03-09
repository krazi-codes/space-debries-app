# 🛸 Space Debris Tracker

A real-time near-Earth object (NEO) tracking application powered by the [NASA NeoWs API](https://api.nasa.gov/).

## Features

- **Real-time data** – Fetches asteroid and debris data directly from NASA's Near Earth Object Web Service
- **Date range selection** – Browse near-Earth objects for any 7-day window
- **Filtering** – Show only potentially hazardous asteroids; search by name or ID
- **Sortable table** – Sort by diameter, velocity, miss distance, magnitude, or name
- **Detail view** – Click any object for full orbital and approach data
- **Stats dashboard** – Overview of total objects, hazardous count, fastest object, and closest approach
- **Dark space theme** – Immersive UI with a space aesthetic

## Getting Started

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Build

```bash
npm run build
```

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for fast development and builds
- **NASA NeoWs API** (DEMO_KEY, no registration required)

## Data Notes

- **LD** = Lunar Distance (1 LD ≈ 384,400 km)
- **AU** = Astronomical Unit (1 AU ≈ 149,597,871 km)
- **Potentially Hazardous Asteroid (PHA)** = NEO with a minimum orbit intersection distance ≤ 0.05 AU and absolute magnitude ≤ 22
- The DEMO_KEY allows 30 requests/hour; replace with a free NASA API key for higher limits
