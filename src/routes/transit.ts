import express, { Request, Response } from "express";
import transitService from "../services/transit";

const router = express.Router();

router.get(
  "/transit-data",
  async (_req: Request, res: Response): Promise<Response> => {
    try {
      const data = await transitService.fetchRealtimeData();
      return res.json(data);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Failed to fetch realtime data" });
    }
  }
);

export default router;
