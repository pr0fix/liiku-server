import express, { Request, Response } from "express";
import transitService from "../services/transit";
import { VehicleInfo } from "../utils/types";
import { TransitAPIError } from "../utils/errors";

const router = express.Router();

interface ErrorResponse {
  error: string;
  message: string;
}

interface SuccessResponse {
  success: boolean;
  count: number;
  data: VehicleInfo[];
}

router.get("/health", (_req: Request, res: Response): Response => {
  return res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

router.get("/test", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await transitService.fetchRealtimeData();
    res.json(data);
  } catch (error) {
    console.error("Error fetching vehicle positions:", error);

    if (error instanceof TransitAPIError) {
      res.status(error.statusCode).json({
        error: error.name,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      error: "Internal server error",
      message: "Failed to fetch realtime data",
    });
  }
});

router.get(
  "/transit",
  async (_req: Request, res: Response<SuccessResponse | ErrorResponse>): Promise<void> => {
    try {
      const data = await transitService.getVehiclePositions();

      if (!data || data.length === 0) {
        res.status(404).json({
          error: "No vehicle data available",
          message: "No active vehicles found at this time",
        });
        return;
      }

      res.json({ success: true, count: data.length, data: data });
    } catch (error) {
      console.error("Error fetching vehicle positions:", error);

      if (error instanceof TransitAPIError) {
        res.status(error.statusCode).json({
          error: error.name,
          message: error.message,
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message.includes("ECONNREFUSED") || error.message.includes("ETIMEDOUT")) {
          res.status(503).json({
            error: "Service unavailable",
            message: "Unable to connect to realtime data service",
          });
          return;
        }

        if (error.message.includes("404")) {
          res.status(404).json({
            error: "Data not found",
            message: "Realtime data endpoint not available",
          });
          return;
        }
      }
      res.status(500).json({
        error: "Internal server error",
        message: "Failed to fetch realtime data",
      });
    }
  }
);

export default router;
