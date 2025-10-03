import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/agent.ts";
import { Server } from "socket.io";
import { createServer } from "http";
import cron from "node-cron";
import axios from "axios";
import { initSocket, agentLatestMetrics } from "./socket.ts";

const app = express();
const PORT = process.env.PORT || 4000;

const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

initSocket(io);

app.use(cors());
app.use(express.json());
app.use("/", telemetryRouter);

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
});

server.listen(PORT, () => {
  console.log(`Backend + Socket.IO running on port ${PORT}`);
});
