import express, { Request, Response } from "express";
import emissionService from "../services/emission";

const router = express.Router();
interface EmissionResponse {
  routeId: string;
  avgCo2: number;
  vehicleType: string;
  avgPassengers: number;
  co2PerPassengerKm: number | null;
}

router.get("/emission/:routeId", (req: Request, res: Response): void => {
  const { routeId } = req.params;

  const emission = emissionService.getVehicleEmissions(routeId);
  if (!emission) {
    res.status(404).json({ error: "Emissions not found for this route" });
    return;
  }

  const avgCo2 = emission.avg_co2_per_vehicle_per_km;
  const avgPassengers = emission.avg_passenger_count;

  const co2PerPassengerKm =
    avgPassengers > 0 ? Math.round((avgCo2 / avgPassengers) * 100) / 100 : null;

  const response: EmissionResponse = {
    routeId: emission.route_id,
    avgCo2,
    vehicleType: emission.Type, // why is Type in uppercase in the data? :D
    avgPassengers,
    co2PerPassengerKm,
  };

  res.json(response);
});

export default router;
