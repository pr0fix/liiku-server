## Liiku Server

Backend API service for the Liiku real-time public transport visualization application. Provides vehicle positions, route shapes and transit data for the Helsinki metropolitan area.

## Overview

Liiku Server processes GTFS static data and real-time vehicle positions from the Digitransit API, exposing endpoints for the Liiku Client application.

## Features

- **Real-time vehicle positions** — Fetches and serves live GTFS-RT vehicle data
- **Route shapes** — Provides polyline geometries for route visualization
- **Emissions data** — Vehicle emissions information
- **Static transit data** — Processes and serves GTFS static data
- **Efficient caching** — Optimized data structures for fast lookups

## Tech Stack

| Category | Technology                 |
| -------- | -------------------------- |
| Runtime  | Node.js                    |
| Language | TypeScript                 |
| Data     | Digitransit GTFS / GTFS-RT |

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn or pnpm

### Installation

1. **Download GTFS static data**

   Download `HSL-gtfs.zip` from the [Digitransit routing data API](https://api.digitransit.fi/routing-data/v3/finland).

2. **Extract GTFS files to the project root**

   ```sh
   mkdir -p gtfs-static
   unzip HSL-gtfs.zip -d gtfs-static/
   ```

3. **Install dependencies**

   ```sh
   npm install
   ```

4. **Start the server**

   ```sh
   # Development
   npm run dev

   # Production
   npm run build
   npm start
   ```

### Scripts

| Command         | Description                              |
| --------------- | ---------------------------------------- |
| `npm run dev`   | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript         |
| `npm start`     | Run production server                    |
| `npm run lint`  | Run ESLint                               |

## API Endpoints

| Endpoint                     | Method | Description                       |
| ---------------------------- | ------ | --------------------------------- |
| `/api/vehicles`              | GET    | Returns current vehicle positions |
| `/api/routes/:routeId/shape` | GET    | Returns route polyline geometry   |
| `/api/emission/:routeId`     | GET    | Returns route emission data       |

## Project Structure

```
src/
├── routes/
│   ├── emission.ts          # Emissions API routes
│   ├── shape.ts             # Route shape API routes
│   └── transit.ts           # Vehicle position API routes
├── services/
│   ├── emission.ts          # Emissions data processing
│   ├── gtfsService.ts       # GTFS static data loader
│   ├── shape.ts             # Route shape processing
│   └── transit.ts           # Real-time vehicle processing
├── utils/
│   ├── constants.ts         # Configuration constants
│   ├── errors.ts            # Error handling utilities
│   ├── helpers.ts           # Helper functions
│   ├── middleware.ts        # Express middleware
│   └── types.ts             # TypeScript type definitions
└── index.ts                 # Application entry point

gtfs-static/                 # GTFS static data files (not tracked in git)
├── agency.txt               # Transit agency information
├── calendar.txt             # Service schedules
├── calendar_dates.txt       # Service exceptions
├── emissions.txt            # Vehicle emissions data
├── fare_attributes.txt      # Fare pricing
├── fare_rules.txt           # Fare rules by route
├── feed_info.txt            # Feed metadata
├── routes.txt               # Route definitions
├── shapes.txt               # Route geometries
├── stop_times.txt           # Arrival/departure times
├── stops.txt                # Stop locations
├── transfers.txt            # Transfer rules
├── translations.txt         # Translated strings
└── trips.txt                # Trip definitions
```

## Data Attribution

Transit data © [Helsinki Regional Transport Authority (HSL)](https://www.hsl.fi/)

Vehicle positions and static GTFS data provided by [Digitransit](https://digitransit.fi/).
