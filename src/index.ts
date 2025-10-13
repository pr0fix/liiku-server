import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { PORT } from "./utils/constants";

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/ping", (_req: Request, res: Response) => {
  res.send("pong");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
