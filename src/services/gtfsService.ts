import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { Route, Stop, Trip } from "../utils/types";

class GtfsService {
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripsByRouteDirection: Map<string, Trip> = new Map();
  private isLoaded: boolean = false;

  constructor() {
    this.loadData();
  }

  private loadData() {
    const gtfsPath = path.join(__dirname, "../../gtfs-static");

    try {
      if (!fs.existsSync(gtfsPath)) {
        throw new Error(
          `GTFS data directory not found at ${gtfsPath}\n` +
            `Please download GTFS static data and place it in the gtfs-staci folder.`
        );
      }

      // Load routes
      try {
        const routesPath = path.join(gtfsPath, "routes.txt");
        if (!fs.existsSync(routesPath)) {
          throw new Error(`routes.txt not found at ${routesPath}`);
        }
        const routesData = fs.readFileSync(routesPath, "utf-8");
        const routes = parse(routesData, {
          columns: true,
          skip_empty_lines: true,
        }) as Route[];
        routes.forEach((route) => {
          this.routes.set(route.route_id, route);
        });
        console.log(`Loaded ${this.routes.size} routes`);
      } catch (error) {
        console.error("Failed to load routes.txt:", error);
        throw error;
      }

      // Load stops
      try {
        const stopsPath = path.join(gtfsPath, "stops.txt");
        if (!fs.existsSync(stopsPath)) {
          throw new Error(`stops.txt not found at: ${stopsPath}`);
        }
        const stopsData = fs.readFileSync(stopsPath, "utf-8");
        const stops = parse(stopsData, {
          columns: true,
          skip_empty_lines: true,
        }) as Stop[];
        stops.forEach((stop) => {
          this.stops.set(stop.stop_id, stop);
        });
        console.log(`Loaded ${this.stops.size} stops`);
      } catch (error) {
        console.error("Failed to load stops.txt:", error);
        throw error;
      }

      // load trips
      try {
        const tripsPath = path.join(gtfsPath, "trips.txt");
        if (!fs.existsSync(tripsPath)) {
          throw new Error(`trips.txt not found at: ${tripsPath}`);
        }
        const tripsData = fs.readFileSync(tripsPath, "utf-8");
        const trips = parse(tripsData, {
          columns: true,
          skip_empty_lines: true,
        }) as Trip[];
        trips.forEach((trip) => {
          this.trips.set(trip.trip_id, trip);

          // Create composite key for route + direction lookup for better performance
          const compositeKey = `${trip.route_id}:${trip.direction_id}`;
          // Store the first trip found for this route+direction combination
          if (!this.tripsByRouteDirection.has(compositeKey)) {
            this.tripsByRouteDirection.set(compositeKey, trip);
          }
        });
        console.log(`Loaded ${this.trips.size} trips`);
      } catch (error) {
        console.error("Failed to load trips.txt:", error);
        throw error;
      }

      this.isLoaded = true;
      console.log("GTFS data loaded successfully");
    } catch (error) {
      console.error("\n FATAL ERROR: Failed to load GTFS data");
      console.error("This application requires GTFS static data to function.");
      console.error("\nTo fix this:");
      console.error(
        "1. Download the HSL-gtfs.zip from: https://api.digitransit.fi/routing-data/v3/hsl/HSL-gtfs.zip"
      );
      console.error("2. Create a gtfs-static folder to the root of this project and extract the files to that folder");
      console.error("3. Restart the server\n");

      if (error instanceof Error) {
        console.error("Error details:", error.message);
      }

      process.exit(1);
    }
  }

  getRoute(routeId: string): Route | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS routes-data not loaded yet...");
      return undefined;
    }
    return this.routes.get(routeId);
  }

  getStop(stopId: string): Stop | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS stop-data not loaded yet...");
      return undefined;
    }
    return this.stops.get(stopId);
  }

  getTrip(routeId: string, directionId: number): Trip | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS trips-data not loaded yet...");
      return undefined;
    }
    const compositeKey = `${routeId}:${directionId}`;
    return this.tripsByRouteDirection.get(compositeKey);
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export default new GtfsService();
