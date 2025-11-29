import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { Emission, Route, Shape, Stop, Trip } from "../utils/types";

class GtfsService {
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private trips: Map<string, Trip> = new Map();
  private shapes: Map<string, Shape[]> = new Map();
  private emissions: Map<string, Emission> = new Map();
  private tripsByRouteDirection: Map<string, Trip> = new Map();
  private isLoaded: boolean = false;

  constructor() {
    this.loadData();
  }

  private loadFile<T>(gtfsPath: string, fileName: string): T[] {
    const filePath = path.join(gtfsPath, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`${fileName} not found at ${filePath}`);
    }
    const fileData = fs.readFileSync(filePath, "utf-8");
    return parse(fileData, {
      columns: true,
      skip_empty_lines: true,
    }) as T[];
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
      const routes = this.loadFile<Route>(gtfsPath, "routes.txt");
      routes.forEach((route) => this.routes.set(route.route_id, route));
      console.log(`Loaded ${this.routes.size} routes`);

      // Load stops
      const stops = this.loadFile<Stop>(gtfsPath, "stops.txt");
      stops.forEach((stop) => this.stops.set(stop.stop_id, stop));
      console.log(`Loaded ${this.stops.size} stops`);

      // Load trips
      const trips = this.loadFile<Trip>(gtfsPath, "trips.txt");
      trips.forEach((trip) => {
        this.trips.set(trip.trip_id, trip);
        const compositeKey = `${trip.route_id}:${trip.direction_id}`;
        if (!this.tripsByRouteDirection.has(compositeKey)) {
          this.tripsByRouteDirection.set(compositeKey, trip);
        }
      });
      console.log(`Loaded ${this.trips.size} trips`);

      // Load shapes
      const shapes = this.loadFile<Shape>(gtfsPath, "shapes.txt");
      shapes.forEach((shape) => {
        if (!this.shapes.has(shape.shape_id)) {
          this.shapes.set(shape.shape_id, []);
        }
        this.shapes.get(shape.shape_id)!.push(shape);
      });
      this.shapes.forEach((points) => {
        points.sort((a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence));
      });
      console.log(`Loaded ${this.shapes.size} shapes`);

      // Load emissions
      const emissions = this.loadFile<Emission>(gtfsPath, "emissions.txt");
      emissions.forEach((emission) => this.emissions.set(emission.route_id, emission));
      console.log(`Loaded emissions data for ${this.emissions.size} vehicles.`);

      this.isLoaded = true;
      console.log("GTFS data loaded successfully");
    } catch (error) {
      console.error("\n FATAL ERROR: Failed to load GTFS data");
      console.error("This application requires GTFS static data to function.");
      console.error("\nTo fix this:");
      console.error(
        "1. Download the HSL-gtfs.zip from: https://api.digitransit.fi/routing-data/v3/hsl/HSL-gtfs.zip"
      );
      console.error(
        "2. Create a gtfs-static folder to the root of this project and extract the files to that folder"
      );
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

  getShapeForTrip(routeId: string, directionId: number): Shape[] | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS shapes-data not loaded yet...");
      return undefined;
    }
    const trip = this.getTrip(routeId, directionId);
    if (!trip?.shape_id) {
      return undefined;
    }
    return this.shapes.get(trip.shape_id);
  }

  getEmissions(routeId: string): Emission | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS emissions-data not loaded yet...");
      return undefined;
    }
    return this.emissions.get(routeId);
  }

  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export default new GtfsService();
