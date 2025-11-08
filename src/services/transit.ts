import GtfsRealtimeBindings, { transit_realtime } from "gtfs-realtime-bindings";
import axios from "axios";
import { REALTIME_API_URL } from "../utils/constants";
import gtfsService from "./gtfsService";
import { VehicleInfo } from "../utils/types";
import { TransitAPIError } from "../utils/errors";

const fetchRealtimeData = async (): Promise<transit_realtime.FeedMessage> => {
  try {
    const response = await axios({
      method: "get",
      url: REALTIME_API_URL,
      responseType: "arraybuffer",
      timeout: 10000,
    });

    if (response.status !== 200) {
      throw new TransitAPIError(
        `API returned status ${response.status}`,
        response.status
      );
    }
    const buffer = response.data;
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(
      new Uint8Array(buffer)
    );
    return feed;
  } catch (error) {
    console.error("Error fetching realtime data:", error);

    if (error instanceof TransitAPIError) {
      throw error;
    }

    throw new TransitAPIError(
      "Failed to fetch realtime transit data",
      503,
      error as Error
    );
  }
};

const getVehiclePositions = async (): Promise<VehicleInfo[]> => {
  const feed = await fetchRealtimeData();
  const vehicles: VehicleInfo[] = [];

  feed.entity.forEach((entity) => {
    if (entity.vehicle) {
      const v = entity.vehicle;
      const routeId = v.trip?.routeId || "";
      const stopId = v.stopId || "";
      const directionId = v.trip?.directionId || 0;

      const route = gtfsService.getRoute(routeId);
      const stop = gtfsService.getStop(stopId);
      const trip = gtfsService.getTrip(routeId, directionId);

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
        speed: v.position?.speed || 0,
        timestamp: v.timestamp?.toString() || "",
        stopId,
        stopName: stop?.stop_name || "",
        currentStatus: v.currentStatus?.toString() || "",
        occupancyStatus: v.occupancyStatus?.toString() || "UNKNOWN",
        startTime: v.trip?.startTime?.toString() || "",
      });
    }
  });
  return vehicles;
};

export default { fetchRealtimeData, getVehiclePositions };
