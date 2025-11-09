import express from "express";
import { WebSocket, WebSocketServer } from "ws";
import cors from "cors";
import "dotenv/config";
import transitRouter from "./routes/transit";
import transitService from "./services/transit";
import { PORT } from "./utils/constants";
import { VehicleInfo } from "./utils/types";

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
}

const app = express();
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const wss = new WebSocketServer({ server });

const clients = new Set<ExtendedWebSocket>();

let previousVehicles: Map<string, VehicleInfo> = new Map();

// Interval to detect dead connections
const HEARTBEAT_INTERVAL = 30000;
const UPDATE_INTERVAL = 10000;

wss.on("connection", function connection(ws: ExtendedWebSocket) {
  console.log("New client connected");
  ws.isAlive = true;
  clients.add(ws);

  sendInitialData(ws);

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());
      handleClientMessage(ws, data);
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
    clients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
    clients.delete(ws);
  });
});

const heartbeatIntervalId = setInterval(() => {
  clients.forEach((ws: ExtendedWebSocket) => {
    if (!ws.isAlive) {
      console.log("Terminating dead connection");
      clients.delete(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, HEARTBEAT_INTERVAL);

const updateIntervalId = setInterval(async () => {
  await fetchAndBroadcastUpdates();
}, UPDATE_INTERVAL);

wss.on("close", () => {
  clearInterval(heartbeatIntervalId);
  clearInterval(updateIntervalId);
});

process.on("SIGTERM", () => {
  clearInterval(heartbeatIntervalId);
  clearInterval(updateIntervalId);
  wss.close();
  server.close();
});

async function sendInitialData(ws: WebSocket) {
  try {
    const vehicles = await transitService.getVehiclePositions();
    ws.send(
      JSON.stringify({ type: "initial", data: vehicles, timestamp: Date.now() })
    );
  } catch (error) {
    console.error("Error sending initial data:", error);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "error",
          message: "Failed to fetch initial vehicle data",
        })
      );
    }
  }
}

async function fetchAndBroadcastUpdates() {
  try {
    const vehicles = await transitService.getVehiclePositions();
    const currentVehicles = new Map(vehicles.map((v) => [v.vehicleId, v]));

    // Calculate diff
    const changes = {
      updated: [] as VehicleInfo[],
      added: [] as VehicleInfo[],
      removed: [] as string[],
    };

    // Find updated and added vehicles
    currentVehicles.forEach((vehicle, id) => {
      const previous = previousVehicles.get(id);
      if (!previous) {
        changes.added.push(vehicle);
      } else if (hasVehicleChanged(previous, vehicle)) {
        changes.updated.push(vehicle);
      }
    });

    // Find removed vehicles
    previousVehicles.forEach((_, id) => {
      if (!currentVehicles.has(id)) {
        changes.removed.push(id);
      }
    });

    // Only broadcast if there are changes
    if (
      changes.updated.length > 0 ||
      changes.added.length > 0 ||
      changes.removed.length > 0
    ) {
      broadcast({ type: "update", data: changes, timestamp: Date.now() });

      console.log(
        `Broadcast: ${changes.updated.length} updated, ${changes.added.length} added, ${changes.removed.length} removed`
      );
    }
    previousVehicles = currentVehicles;
  } catch (error) {
    console.error("Error fetching vehicle updates:", error);
    broadcast({
      type: "error",
      message: "Failed to fetch vehicle updates",
    });
  }
}

function hasVehicleChanged(prev: VehicleInfo, curr: VehicleInfo): boolean {
  return (
    prev.latitude !== curr.latitude ||
    prev.longitude !== curr.longitude ||
    prev.bearing !== curr.bearing ||
    prev.speed !== curr.speed ||
    prev.stopId !== curr.stopId ||
    prev.currentStatus !== curr.currentStatus
  );
}

function broadcast(message: any) {
  const data = JSON.stringify(message);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

function handleClientMessage(ws: WebSocket, data: any) {
  switch (data.type) {
    case "ping":
      ws.send(JSON.stringify({ type: "pong" }));
      break;
    case "subscribe":
      //handle route-specific subscriptions
      break;
    default:
      console.log("Unknown message type:", data.type);
  }
}

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api", transitRouter);
