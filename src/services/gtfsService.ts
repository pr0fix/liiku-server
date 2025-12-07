import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import Database from "better-sqlite3";
import {
  Calendar,
  CalendarDate,
  Emission,
  Route,
  Shape,
  Stop,
  StopTime,
  Trip,
} from "../utils/types";
import csvParser from "csv-parser";

class GtfsService {
  private routes: Map<string, Route> = new Map();
  private stops: Map<string, Stop> = new Map();
  private trips: Map<string, Trip> = new Map();
  private shapes: Map<string, Shape[]> = new Map();
  private emissions: Map<string, Emission> = new Map();
  private calendars: Map<string, Calendar> = new Map();
  private calendarDates: Map<string, CalendarDate[]> = new Map();
  private tripsByRouteDirection: Map<string, Trip> = new Map();
  private db: Database.Database;
  private gtfsPath: string = path.join(__dirname, "../../gtfs-static");
  private dbPath: string = path.join(__dirname, "../../gtfs.db");
  private isLoaded: boolean = false;

  constructor() {
    this.db = new Database(this.dbPath);
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

  // Initialize database for getting stop_times with faster performance
  private async initDatabase(): Promise<void> {
    // Create stop_times table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stop_times (
        trip_id TEXT,
        arrival_time TEXT,
        departure_time TEXT,
        stop_id TEXT,
        stop_sequence INTEGER,
        pickup_type INTEGER,
        drop_off_type INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_stop_times_trip ON stop_times(trip_id);
      CREATE INDEX IF NOT EXISTS idx_stop_times_stop ON stop_times(stop_id);
    `);

    // Check if data already loaded
    const count = this.db
      .prepare("SELECT COUNT(*) as count FROM stop_times")
      .get() as { count: number };

    if (count.count > 0) {
      console.log("stop_times already loaded in database");
      return;
    }

    console.log("Loading stop_times into database...");

    return new Promise((resolve, reject) => {
      const filePath = path.join(this.gtfsPath, "stop_times.txt");

      const insert = this.db.prepare(`
        INSERT INTO stop_times (trip_id, arrival_time, departure_time, stop_id, stop_sequence, pickup_type, drop_off_type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let count = 0;
      const batchSize = 10000;
      let batch: StopTime[] = [];

      const insertBatch = this.db.transaction((rows: StopTime[]) => {
        for (const row of rows) {
          insert.run(
            row.trip_id,
            row.arrival_time,
            row.departure_time,
            row.stop_id,
            row.stop_sequence,
            row.pickup_type || null,
            row.drop_off_type || null
          );
        }
      });

      fs.createReadStream(filePath)
        .pipe(csvParser({ mapHeaders: ({ header }) => header.trim() }))
        .on("data", (row) => {
          batch.push(row);
          count++;

          if (batch.length >= batchSize) {
            insertBatch(batch);
            batch = [];
            if (count % 100000 === 0) {
              console.log(`Loaded ${count} stop_times...`);
            }
          }
        })
        .on("end", () => {
          if (batch.length > 0) {
            insertBatch(batch);
          }
          console.log(`Loaded ${count} stop_times into database`);
          resolve();
        })
        .on("error", reject);
    });
  }

  // Load data from gtfs-files
  private async loadData() {
    try {
      if (!fs.existsSync(this.gtfsPath)) {
        throw new Error(
          `GTFS data directory not found at ${this.gtfsPath}\n` +
            `Please download GTFS static data and place it in the gtfs-static folder.`
        );
      }

      // Load routes
      const routes = this.loadFile<Route>(this.gtfsPath, "routes.txt");
      routes.forEach((route) => this.routes.set(route.route_id, route));
      console.log(`Loaded ${this.routes.size} routes`);

      // Load stops
      const stops = this.loadFile<Stop>(this.gtfsPath, "stops.txt");
      stops.forEach((stop) => this.stops.set(stop.stop_id, stop));
      console.log(`Loaded ${this.stops.size} stops`);

      // Load trips
      const trips = this.loadFile<Trip>(this.gtfsPath, "trips.txt");
      trips.forEach((trip) => {
        this.trips.set(trip.trip_id, trip);
        const compositeKey = `${trip.route_id}:${trip.direction_id}`;
        if (!this.tripsByRouteDirection.has(compositeKey)) {
          this.tripsByRouteDirection.set(compositeKey, trip);
        }
      });
      console.log(`Loaded ${this.trips.size} trips`);

      // Load shapes
      const shapes = this.loadFile<Shape>(this.gtfsPath, "shapes.txt");
      shapes.forEach((shape) => {
        if (!this.shapes.has(shape.shape_id)) {
          this.shapes.set(shape.shape_id, []);
        }
        this.shapes.get(shape.shape_id)!.push(shape);
      });
      this.shapes.forEach((points) => {
        points.sort(
          (a, b) => Number(a.shape_pt_sequence) - Number(b.shape_pt_sequence)
        );
      });
      console.log(`Loaded ${this.shapes.size} shapes`);

      // Load emissions
      const emissions = this.loadFile<Emission>(this.gtfsPath, "emissions.txt");
      emissions.forEach((emission) =>
        this.emissions.set(emission.route_id, emission)
      );
      console.log(`Loaded emissions data for ${this.emissions.size} vehicles.`);

      // Load calendars
      const calendars = this.loadFile<Calendar>(this.gtfsPath, "calendar.txt");
      calendars.forEach((cal) => this.calendars.set(cal.service_id, cal));

      // Load calendar dates
      const calendarDates = this.loadFile<CalendarDate>(
        this.gtfsPath,
        "calendar_dates.txt"
      );
      calendarDates.forEach((cd) => {
        if (!this.calendarDates.has(cd.service_id)) {
          this.calendarDates.set(cd.service_id, []);
        }
        this.calendarDates.get(cd.service_id)!.push(cd);
      });

      // Initialize database for stop_times (streaming)
      await this.initDatabase();

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

  private isServiceActiveToday(serviceId: string): boolean {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD

    // Check calendar_dates exceptions first
    const exceptions = this.calendarDates.get(serviceId);
    if (exceptions) {
      const todayException = exceptions.find((ex) => ex.date === dateStr);
      if (todayException) {
        return todayException.exception_type === "1"; // 1 = service added
      }
    }

    // Check regular calendar
    const calendar = this.calendars.get(serviceId);
    if (!calendar) return false;

    // Check date range
    if (dateStr < calendar.start_date || dateStr > calendar.end_date) {
      return false;
    }

    // Check day of week
    const days = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayField = days[dayOfWeek] as keyof Calendar;
    return calendar[dayField] === "1";
  }

  // Get route by id
  getRoute(routeId: string): Route | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS routes-data not loaded yet...");
      return undefined;
    }
    return this.routes.get(routeId);
  }

  // Get all stops
  getAllStops(): Stop[] {
    return Array.from(this.stops.values());
  }

  // Get stop by id
  getStop(stopId: string): Stop | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS stop-data not loaded yet...");
      return undefined;
    }
    return this.stops.get(stopId);
  }

  // Get all stops for specific trip
  getStopsForTrip(tripId: string):
    | Array<
        Stop & {
          arrival_time: string;
          departure_time: string;
          stop_sequence: number;
        }
      >
    | undefined {
    const stopTimes = this.db
      .prepare(
        "SELECT * FROM stop_times WHERE trip_id = ? ORDER BY stop_sequence"
      )
      .all(tripId) as StopTime[];

    if (!stopTimes || stopTimes.length === 0) return undefined;

    return stopTimes.map((st) => {
      const stop = this.stops.get(st.stop_id);
      return {
        ...stop!,
        arrival_time: st.arrival_time,
        departure_time: st.departure_time,
        stop_sequence: Number(st.stop_sequence),
      };
    });
  }

  // Get all stops for specific route and route direction
  getStopsForRoute(
    routeId: string,
    directionId: number
  ): Array<Stop & { arrival_time: string; stop_sequence: number }> | undefined {
    const trip = this.getTrip(routeId, directionId);
    if (!trip) return undefined;
    return this.getStopsForTrip(trip.trip_id);
  }

  // Get all departures from specific stop
  getDeparturesForStop(stopId: string): Array<{
    route_id: string;
    route_name: string;
    headsign: string;
    departure_time: string;
  }> {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

    const stopTimes = this.db
      .prepare(
        `SELECT * FROM stop_times 
        WHERE stop_id = ? 
        AND departure_time >= ? 
        ORDER BY departure_time
      `
      )
      .all(stopId, currentTime) as StopTime[];

    return stopTimes
      .filter((st) => {
        const trip = this.trips.get(st.trip_id);
        if (!trip) return false;
        return this.isServiceActiveToday(trip.service_id);
      })
      .map((st) => {
        const trip = this.trips.get(st.trip_id);
        const route = trip ? this.routes.get(trip.route_id) : undefined;
        return {
          route_id: trip?.route_id || "",
          route_name: route?.route_short_name || "",
          headsign: trip?.trip_headsign || "",
          departure_time: st.departure_time,
        };
      });
  }

  // Get specific route by direction
  getTrip(routeId: string, directionId: number): Trip | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS trips-data not loaded yet...");
      return undefined;
    }
    const compositeKey = `${routeId}:${directionId}`;
    return this.tripsByRouteDirection.get(compositeKey);
  }

  // Get shape for trip for drawing a polyline on map
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

  // Get route emissions
  getEmissions(routeId: string): Emission | undefined {
    if (!this.isLoaded) {
      console.warn("GTFS emissions-data not loaded yet...");
      return undefined;
    }
    return this.emissions.get(routeId);
  }

  // Check if data is loaded
  isDataLoaded(): boolean {
    return this.isLoaded;
  }
}

export default new GtfsService();
