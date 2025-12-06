import gtfsService from "./gtfsService";

const getAllStops = async () => {
  return gtfsService.getAllStops().map((stop) => ({
    stopId: stop.stop_id,
    name: stop.stop_name,
    lat: Number(stop.stop_lat),
    lon: Number(stop.stop_lon),
  }));
};

const getStopsInBounds = async (
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number
) => {
  return gtfsService
    .getAllStops()
    .filter((stop) => {
      const lat = Number(stop.stop_lat);
      const lon = Number(stop.stop_lon);
      return lat >= minLat && lat <= maxLat && lon >= minLon && lon <= maxLon;
    })
    .map((stop) => ({
      stopId: stop.stop_id,
      name: stop.stop_name,
      lat: Number(stop.stop_lat),
      lon: Number(stop.stop_lon),
    }));
};

const getStopWithDepartures = async (stopId: string) => {
  const stop = gtfsService.getStop(stopId);
  if (!stop) return null;

  const departures = gtfsService.getDeparturesForStop(stopId);

  return {
    stopId: stop.stop_id,
    name: stop.stop_name,
    lat: Number(stop.stop_lat),
    lon: Number(stop.stop_lon),
    departures,
  };
};

const getStopsForRoute = async (routeId: string, directionId: number) => {
  const stops = gtfsService.getStopsForRoute(routeId, directionId);
  if (!stops) return [];

  return stops?.map((stop) => ({
    stopId: stop.stop_id,
    name: stop.stop_name,
    lat: Number(stop.stop_lat),
    lon: Number(stop.stop_lon),
    arrivalTime: stop.arrival_time,
    sequence: stop.stop_sequence,
  }));
};

export default {
  getAllStops,
  getStopsInBounds,
  getStopWithDepartures,
  getStopsForRoute,
};
