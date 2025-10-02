import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/agent.ts";
import { Server } from "socket.io";
import { createServer } from "http";
import cron from 'node-cron';
import axios from "axios";

const app = express();
const PORT = process.env.PORT || 4000;

const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})

const agentLatestMetrics: Record<string, any> = {};
const firstStored: Record<string, boolean> = {};

io.on("connection", (socket) => {
  console.log("Client Connected");

  socket.on("agent_metrics", async (data) => {
    console.log("Agent Metrics:", data);

    agentLatestMetrics[data.id] = data;

    io.emit("agent_update", {
      id: data.id,
      name: data.name,
      CPU: data.cpu,
      token: data.token,
      memory: data.memory,
      disk: data.disk,
      processes: data.processes,
      status: data.status,
      lastHeartbeat: new Date().toISOString(),
    });

    if (!firstStored[data.id]) {
      try {
        await axios.post("http://localhost:4000/telemetry", data);
        console.log(`[Immediate] Stored first metrics for agent ${data.id}`);
        firstStored[data.id] = true; 
      } catch (err: any) {
        console.error(
          `[Immediate] Failed storing first metrics for ${data.id}:`,
          err.message
        );
      }
    }
  });

  socket.on("disconnected", () => {
    console.log("Socket's Disconnected");
  })
})

app.use(cors());
app.use(express.json());

app.use("/", telemetryRouter);

// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT}`);
// });

cron.schedule("0 */2 * * *", async () => {
  console.log("[Cron] Storing latest agent metrics to DB...");
  for (const agentId in agentLatestMetrics) {
    const metrics = agentLatestMetrics[agentId];

    try {
      await axios.post("http://localhost:4000/telemetry", metrics);

      console.log(`[Cron] Stored metrics for agent: ${agentId}`);
    } catch (err) {
      console.error(`[Cron] Failed to store metrics for ${agentId}:`, err);
    }
  }
})

server.listen(PORT, () => {
  console.log(`Backend + Socket.IO running on port ${PORT}`);
});
