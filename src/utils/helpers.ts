import { VehicleInfo } from "./types";

// translates occupancy_status to human readable form
export const translateOccupancyStatus = (status: string): string | null => {
  const occupancyMap: Record<string, string | null> = {
    EMPTY: "Empty",
    MANY_SEATS_AVAILABLE: "Many seats available",
    FEW_SEATS_AVAILABLE: "Few seats available",
    STANDING_ROOM_ONLY: "Standing room only",
    CRUSHED_STANDING_ROOM_ONLY: "Crushed standing room only",
    FULL: "Full",
    NOT_ACCEPTING_PASSENGERS: "Not accepting passengers",
    NO_DATA_AVAILABLE: null,
    NOT_BOARDABLE: "Not boardable",
    UNKNOWN: null,
  };
  return occupancyMap[status] !== undefined ? occupancyMap[status] : null;
};

// compares numerical values assigned to route_type from routes.txt 
// and transforms them into string values
export const findVehicleType = (routeType?: number | string): string => {
  if (routeType == null) return "unknown";
  const rt = typeof routeType === "string" ? Number(routeType) : routeType;
  if (Number.isNaN(rt)) return "unknown";
  if (rt === 900) return "lightrail";
  if (rt >= 700 && rt < 800) return "bus";
  if (rt >= 100 && rt < 200) return "rail";
  if (rt === 0) return "tram";
  if (rt === 1) return "metro";
  if (rt === 4) return "ferry";

  return "other";
};

// transform ms to kmh
export const msToKmh = (ms?: number | null): number => {
  if (ms == null || Number.isNaN(ms)) return 0;
  return ms * 3.6;
};

// format kmh
export const formatKmh = (ms?: number | null): string => {
  const kmh = msToKmh(ms);
  return `${kmh.toFixed(0)} km/h`;
};

// check if vehicle position has changed significantly
export const hasVehicleChanged = (prev: VehicleInfo, curr: VehicleInfo): boolean => {
  return (
    prev.latitude !== curr.latitude ||
    prev.longitude !== curr.longitude ||
    prev.bearing !== curr.bearing ||
    prev.speed !== curr.speed ||
    prev.stopId !== curr.stopId ||
    prev.currentStatus !== curr.currentStatus
  );
};
