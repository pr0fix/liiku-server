import { H_TRAM_ROUTES } from "./constants";

export const msToKmh = (ms?: number | null): number => {
  if (ms == null || Number.isNaN(ms)) return 0;
  return ms * 3.6;
};

export const formatKmh = (ms?: number | null): string => {
  const kmh = msToKmh(ms);
  return `${kmh.toFixed(0)} km/h`;
};

export const findVehicleType = (routeType?: number | string): string => {
  if (routeType == null) return "unknown";
  const rt = typeof routeType === "string" ? Number(routeType) : routeType;
  if (Number.isNaN(rt)) return "unknown";
  if (rt === 702) return "trunk";
  if (rt >= 700 && rt < 800) return "bus";
  if (rt >= 100 && rt < 200) return "rail";
  if (rt === 0) return "tram";
  if (rt === 1) return "metro";
  if (rt === 4) return "ferry";

  return "other";
};

export const normalizeRouteId = (routeId: string | null | undefined): string => {
  if (!routeId) return "";

  if (H_TRAM_ROUTES.includes(routeId)) {
    return "H";
  }

  return routeId;
};
