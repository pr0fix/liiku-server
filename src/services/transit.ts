import GtfsRealtimeBindings, { transit_realtime } from "gtfs-realtime-bindings";
import axios from "axios";
import { REALTIME_API_URL } from "../utils/constants";
import gtfsService from "./gtfsService";
import { VehicleInfo } from "../utils/types";
import { TransitAPIError } from "../utils/errors";
import { findVehicleType, formatKmh, normalizeRouteId } from "../utils/helpers";

const translateOccupancyStatus = (status: string): string | null => {
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


const fetchRealtimeData = async (): Promise<transit_realtime.FeedMessage> => {
  try {
    const response = await axios({
      method: "get",
      url: REALTIME_API_URL,
      responseType: "arraybuffer",
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new TransitAPIError(`API returned status ${response.status}`, response.status);
    }
    const buffer = response.data;
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(new Uint8Array(buffer));
    return feed;
  } catch (error) {
    console.error("Error fetching realtime data:", error);

    if (error instanceof TransitAPIError) {
      throw error;
    }

    throw new TransitAPIError("Failed to fetch realtime transit data", 503, error as Error);
  }
};

const getVehiclePositions = async (): Promise<VehicleInfo[]> => {
  const feed = await fetchRealtimeData();
  const vehicles: VehicleInfo[] = [];

  feed.entity.forEach((entity) => {
    if (entity.vehicle) {
      const v = entity.vehicle;
      const routeId = normalizeRouteId(v.trip?.routeId) || "";
      const stopId = v.stopId || "";
      const directionId = v.trip?.directionId || 0;
      const speedMs = v.position?.speed || 0;
      const speedKmhFormatted = formatKmh(speedMs);
      const route = gtfsService.getRoute(routeId);
      const stop = gtfsService.getStop(stopId);
      const trip = gtfsService.getTrip(routeId, directionId);
      const vehicleType = findVehicleType(route?.route_type);

      const occupancyStatus = v.occupancyStatus
        ? transit_realtime.VehiclePosition.OccupancyStatus[v.occupancyStatus]
        : "UNKNOWN";

      vehicles.push({
        vehicleId: v.vehicle?.id || entity.id,
        routeId,
        routeName: route?.route_short_name || routeId,
        routeLongName: route?.route_long_name || "",
        directionId: v.trip?.directionId || 0,
        headsign: trip?.trip_headsign || "",
        latitude: v.position?.latitude || 0,
        longitude: v.position?.longitude || 0,
        bearing: v.position?.bearing || 0,
        speed: speedKmhFormatted,
        timestamp: v.timestamp?.toString() || "",
        stopId,
        stopName: stop?.stop_name || "",
        currentStatus: v.currentStatus?.toString() || "",
        occupancyStatus: translateOccupancyStatus(occupancyStatus),
        startTime: v.trip?.startTime?.toString() || "",
        vehicleType,
      });
    }
  });
  return vehicles;
};

export default { fetchRealtimeData, getVehiclePositions };
