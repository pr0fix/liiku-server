import express, { Request, Response } from "express";
import emissionService from "../services/emission";

const router = express.Router();

router.get("/emission/:routeId", (req: Request, res: Response): void => {
  const { routeId } = req.params;

  const emission = emissionService.getVehicleEmissions(routeId);
  if (!emission) {
    res.status(404).json({ error: "Emissions not found for this route" });
    return;
  }
  res.json({ emission });
});

export default router;
