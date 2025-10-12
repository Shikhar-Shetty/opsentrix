import { Server, Socket } from "socket.io";
import axios from "axios";
import "dotenv/config";
import { checkAndSendAlert } from "./utils/alert.ts";

export const agentLatestMetrics: Record<string, any> = {};
export const agentLastHeartbeat: Record<string, number> = {};

export const connectedAgents: Record<string, Socket> = {};

const pendingCleanups: Record<string, {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}> = {};

const agentTimeout = 10000;

export function initSocket(io: Server) {
  io.on("connection", (socket) => {
    console.log(`[Socket] New connection from ${socket.handshake.address}`);
    
    socket.on("register_agent", (data) => {
      const agentId = data.id;
      console.log(`[Agent Registered] ${agentId}`);
      
      connectedAgents[agentId] = socket;
      socket.data.agentId = agentId;
      socket.data.token = data.token;
    });
    
    socket.on("agent_metrics", async (data) => {
      const agentId = data.id;
      
      agentLatestMetrics[agentId] = data;
      agentLastHeartbeat[agentId] = Date.now();
      
      if (!connectedAgents[agentId]) {
        connectedAgents[agentId] = socket;
        socket.data.agentId = agentId;
      }
      
      await checkAndSendAlert(agentId);
      
      console.log(`[Metrics] ${agentId} | CPU: ${data.CPU.toFixed(1)}% | MEM: ${data.memory.toFixed(1)}%`);
      
      io.emit("agent_update", {
        id: agentId,
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
          await axios.post(`${process.env.BASE_URL}/telemetry/insights`, { id: agentId });
          console.log(`[DB] Stored first metrics for ${agentId}`);
          socket.data.firstStored = true;
        } catch (err: any) {
          console.error(`[DB Error] ${agentId}: ${err.message}`);
        }
      }
    });
    
    socket.on("cleanup_response", (data) => {
      const { requestId, result, agentId } = data;
      console.log(`[Cleanup Response] Agent ${agentId}, Request ${requestId}`);
      
      if (pendingCleanups[requestId]) {
        clearTimeout(pendingCleanups[requestId].timeout);
        pendingCleanups[requestId].resolve(result);
        delete pendingCleanups[requestId];
      }
    });
    
    socket.on("disconnect", async () => {
      const agentId = socket.data.agentId;
      console.log(`[Disconnect] Agent ${agentId || 'unknown'}`);
      
      if (agentId) {
        delete connectedAgents[agentId];
        
        if (agentLatestMetrics[agentId]) {
          try {
            await axios.post(`${process.env.BASE_URL}/telemetry`, {
              ...agentLatestMetrics[agentId],
              status: "offline",
              lastHeartbeat: new Date().toISOString(),
            });
            console.log(`[DB] Marked ${agentId} as offline`);
          } catch (err) {
            console.error(`[DB Error] Failed to update ${agentId} status:`, err);
          }
        }
      }
    });
  });
  
  setInterval(async () => {
    const now = Date.now();
    
    for (const agentId in agentLastHeartbeat) {
      const lastBeat = agentLastHeartbeat[agentId];
      const diff = now - (lastBeat || 0);
      
      if (diff > agentTimeout) {
        console.log(`[Timeout] Agent ${agentId} (last seen ${Math.round(diff/1000)}s ago)`);
        
        if (agentLatestMetrics[agentId]) {
          try {
            await axios.post(`${process.env.BASE_URL}/telemetry`, {
              ...agentLatestMetrics[agentId],
              status: "offline",
              lastHeartbeat: new Date().toISOString(),
            });
          } catch (err: any) {
            console.error(`[Timeout DB Error] ${agentId}: ${err.message}`);
          }
        }
        delete agentLatestMetrics[agentId];
        delete agentLastHeartbeat[agentId];
        delete connectedAgents[agentId];
      }
    }
  }, 5000);
}


export function sendCleanupCommand(agentId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const agentSocket = connectedAgents[agentId];
    
    if (!agentSocket || !agentSocket.connected) {
      reject(new Error("Agent not connected"));
      return;
    }
    
    const requestId = `cleanup_${agentId}_${Date.now()}`;
    
    const timeout = setTimeout(() => {
      delete pendingCleanups[requestId];
      reject(new Error("Cleanup timeout - agent did not respond"));
    }, 30000);
    
    pendingCleanups[requestId] = { resolve, reject, timeout };
    
    console.log(`[Cleanup] Sending command to ${agentId} (request: ${requestId})`);
    agentSocket.emit("cleanup_command", { 
      requestId,
      timestamp: new Date().toISOString()
    });
  });
}