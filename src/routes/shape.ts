import express, { Request, Response } from "express";
import shapeService from "../services/shape";

const router = express.Router();

router.get("/shape/:routeId/:directionId", (req: Request, res: Response): void => {
  const { routeId, directionId } = req.params;
  const direction = parseInt(directionId, 10);

  if (isNaN(direction) || (direction !== 0 && direction !== 1)) {
    res.status(400).json({ error: "Invalid directionId. Must be 0 or 1." });
    return;
  }

  const shape = shapeService.getRouteShape(routeId, direction);

  if (shape.length === 0) {
    res.status(404).json({ error: "Shape not found for this route/direction" });
    return;
  }

  res.json({ routeId, directionId: direction, coordinates: shape });
});

export default router;
