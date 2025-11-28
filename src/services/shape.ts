import gtfsService from "./gtfsService";

const getRouteShape = (routeId: string, directionId: number): { lat: number; lon: number }[] => {
  const shapes = gtfsService.getShapeForTrip(routeId, directionId);

  if (!shapes) {
    return [];
  }

  return shapes.map((point) => ({
    lat: Number(point.shape_pt_lat),
    lon: Number(point.shape_pt_lon),
  }));
};

export default { getRouteShape };
