import express, { Request, Response } from "express";
import transitService from "../services/transit";

const router = express.Router();

router.get("/transit-data", async (req: Request, res: Response) => {
  try {
    const data = await transitService.fetchRealtimeData();
    res.json(data)
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch realtime data" });
  }
});

export default router;
