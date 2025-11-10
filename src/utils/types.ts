import { WebSocket } from "ws";

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
  route_id: string;
  trip_headsign: string;
  direction_id: number;
}

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
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

interface ErrorResponse {
  error: string;
  message: string;
}

interface SuccessResponse {
  success: boolean;
  count: number;
  data: VehicleInfo[];
}

export {
  VehicleInfo,
  Route,
  Stop,
  Trip,
  ExtendedWebSocket,
  BroadcastMessage,
  ClientMessage,
  ErrorResponse,
  SuccessResponse,
};
