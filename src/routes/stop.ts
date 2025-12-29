import express, { NextFunction, Request, Response } from "express";
import stopService from "../services/stop";

const router = express.Router();

// Get all stops
router.get("/stops", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stops = await stopService.getAllStops();
    res.json(stops);
  } catch (error) {
    next(error);
  }
});

// Get stops within bounds
router.get("/stops/bounds", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { minLat, maxLat, minLon, maxLon } = req.query;
    const stops = await stopService.getStopsInBounds(
      Number(minLat),
      Number(maxLat),
      Number(minLon),
      Number(maxLon)
    );
    res.json(stops);
  } catch (error) {
    next(error);
  }
});

// Get single stop with departures
router.get("/stops/:stopId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { stopId } = req.params;
    const stopInfo = await stopService.getStopWithDepartures(stopId);
    res.json(stopInfo);
  } catch (error) {
    next(error);
  }
});

// Get stops for a route
router.get(
  "/stops/route/:routeId/:directionId",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { routeId, directionId } = req.params;
      const stops = await stopService.getStopsForRoute(routeId, Number(directionId));
      res.json(stops);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
