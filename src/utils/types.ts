interface VehicleInfo {
  vehicleId: string;
  routeId: string;
  routeName: string;
  routeLongName: string;
  directionId: number;
  headsign: string;
  latitude: number;
  longitude: number;
  bearing: number;
  speed: string;
  timestamp: string;
  stopId: string;
  stopName: string;
  currentStatus: string;
  occupancyStatus: string | null;
  startTime: string;
  vehicleType: string;
}

interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_url: string;
}

interface Stop {
  stop_id: string;
  stop_code: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  zone_id: string;
  stop_url: string;
}

interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: string;
  pickup_type?: string;
  drop_off_type?: string;
}

interface Trip {
  trip_id: string;
  shape_id: string;
  route_id: string;
  trip_headsign: string;
  direction_id: number;
}

interface Shape {
  shape_id: string;
  shape_pt_lat: number;
  shape_pt_lon: number;
  shape_pt_sequence: number;
  shape_dist_traveled: number;
}

interface RouteShape {
  routeId: string;
  directionId: string;
  coordinates: {
    lat: number;
    lon: number;
  };
}

interface Emission {
  route_id: string;
  agency_id: string;
  route_short_name: string;
  Type: string;
  avg_co2_per_vehicle_per_km: number;
  avg_passenger_count: number;
}

type BroadcastMessage =
  | {
      type: "update";
      data: { updated: VehicleInfo[]; added: VehicleInfo[]; removed: string[] };
      timestamp: number;
    }
  | { type: "error"; message: string }
  | { type: "initial"; data?: any; message?: string; timestamp?: number };

interface ClientMessage {
  type: "ping" | "subscribe" | string;
  payload?: any;
}

export {
  VehicleInfo,
  Route,
  Stop,
  StopTime,
  Trip,
  Shape,
  RouteShape,
  Emission,
  BroadcastMessage,
  ClientMessage,
};
