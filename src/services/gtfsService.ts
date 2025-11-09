import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { Route, Stop, Trip } from "../utils/types";

class GtfsService {
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private trips: Map<string, Trip> = new Map();
  private tripsByRouteDirection: Map<string, Trip> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData() {
    const gtfsPath = path.join(__dirname, "../../gtfs-static");

    // load routes
    const routesData = fs.readFileSync(
      path.join(gtfsPath, "routes.txt"),
      "utf-8"
    );
    const routes = parse(routesData, {
      columns: true,
      skip_empty_lines: true,
    }) as Route[];
    routes.forEach((route) => {
      this.routes.set(route.route_id, route);
    });

    // load stops
    const stopsData = fs.readFileSync(
      path.join(gtfsPath, "stops.txt"),
      "utf-8"
    );
    const stops = parse(stopsData, {
      columns: true,
      skip_empty_lines: true,
    }) as Stop[];
    stops.forEach((stop) => {
      this.stops.set(stop.stop_id, stop);
    });

    // load trips
    const tripsData = fs.readFileSync(
      path.join(gtfsPath, "trips.txt"),
      "utf-8"
    );
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

    console.log(
      `Loaded ${this.routes.size} routes, ${this.stops.size} stops, ${this.trips.size} trips`
    );
  }

  getRoute(routeId: string): Route | undefined {
    return this.routes.get(routeId);
  }

  getStop(stopId: string): Stop | undefined {
    return this.stops.get(stopId);
  }

  getTrip(routeId: string, directionId: number): Trip | undefined {
    const compositeKey = `${routeId}:${directionId}`;
    return this.tripsByRouteDirection.get(compositeKey);
  }
}

export default new GtfsService();
