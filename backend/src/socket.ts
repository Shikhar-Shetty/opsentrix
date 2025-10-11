import { Server } from "socket.io";
import axios from "axios";
import "dotenv/config";
import { checkAndSendAlert } from "./utils/alert.ts";

export const agentLatestMetrics: Record<string, any> = {};
export const agentLastHeartbeat: Record<string, number> = {};
const agentTimeout = 10000;
export const connectedAgents: Record<string, { ip: string; socketId: string, port: number }> = {};

export function initSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log("Client Connected");
    socket.data.firstStored = false;

    socket.on("agent_metrics", async (data) => {
      agentLatestMetrics[data.id] = data;
      agentLastHeartbeat[data.id] = Date.now();
      await checkAndSendAlert(data.id)
      socket.data.agentId = data.id;
      connectedAgents[data.id] = {
        ip: socket.handshake.address,
        socketId: socket.id,
        port: data.port
      };
      console.log(`[Agent Connected] ${data.id} | Host: ${data.hostIp}:${data.port} | Socket: ${socket.handshake.address}`);
      io.emit("agent_update", {
        id: data.id,
        name: data.name,
        CPU: data.CPU,
        token: data.token,
        memory: data.memory,
        disk: data.disk,
        processes: data.processes,
        status: data.status,
        lastHeartbeat: new Date().toISOString(),
      });

      if (!socket.data.firstStored) {
        try {
          await axios.post(`${process.env.BASE_URL}/telemetry`, data);
          await axios.post(`${process.env.BASE_URL}/telemetry/insights`, {id: data.id});
          
          console.log(`[Immediate] Stored first metrics for agent ${data.id}`);
          socket.data.firstStored = true;
        } catch (err: any) {
          console.error(`[Immediate] Failed storing first metrics for ${data.id}:`, err.message);
        }
      }
    });

    socket.on("disconnect", async () => {
      console.log("Socket disconnected");
      const agentId = socket.data.agentId;
      for (const id in connectedAgents) {
        if (connectedAgents[id]?.socketId === socket.id) {
          delete connectedAgents[id];
        }
      }
      if (agentId && agentLatestMetrics[agentId]) {
        try {
          await axios.post(`${process.env.BASE_URL}/telemetry`, {
            ...agentLatestMetrics[agentId],
            status: "offline",
            lastHeartbeat: new Date().toISOString(),
          });
          console.log(`[Disconnect] Stored final metrics for agent ${agentId}`);
        } catch (err) {
          console.error(`[Disconnect] Failed to store metrics for ${agentId}:`, err);
        }
      }
    });
  });

  setInterval(async () => {
    const now = Date.now();
    for (const agentId in agentLatestMetrics) {
      if (!agentLastHeartbeat[agentId]) continue;
      const diff = now - agentLastHeartbeat[agentId];
      if (diff > agentTimeout) {
        const lastMetrics = agentLatestMetrics[agentId];
        if (!lastMetrics) continue;
        console.log(`[Timeout] Agent ${agentId} missed heartbeat, storing last metrics`);
        try {
          await axios.post(`${process.env.BASE_URL}/telemetry`, {
            ...lastMetrics,
            status: "offline",
            lastHeartbeat: new Date().toISOString(),
          });
          console.log(`[Timeout] Stored last metrics for ${agentId}`);
        } catch (err: any) {
          console.error(`[Timeout] Failed to store metrics for ${agentId}:`, err.message);
        }
        delete agentLatestMetrics[agentId];
        delete agentLastHeartbeat[agentId];
      }
    }
  }, 5000);
}

