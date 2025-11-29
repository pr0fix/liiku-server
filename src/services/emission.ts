import { Emission } from "../utils/types";
import gtfsService from "./gtfsService";

const getVehicleEmissions = (routeId: string): Emission | undefined => {
  const emissions = gtfsService.getEmissions(routeId);

  if (!emissions) {
    return undefined;
  }
  return emissions;
};

export default { getVehicleEmissions };
