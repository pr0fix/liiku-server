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

export { VehicleInfo, Route, Stop, Trip, Shape, RouteShape };
