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
export const agentLastProcessStore: Record<string, number> = {};

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
        status: "online",
        lastHeartbeat: new Date().toISOString(),
      });

      if (!socket.data.firstStored) {
        try {
          await axios.post(`${process.env.BASE_URL}/telemetry`, data);
          await axios.post(`${process.env.BASE_URL}/telemetry/insights`, { id: agentId });
          await axios.post(`${process.env.BASE_URL}/telemetry/process/insights`, { id: agentId });
          console.log(`[DB] Stored first metrics for ${agentId}`);
          socket.data.firstStored = true;
        } catch (err: any) {
          console.error(`[DB Error] ${agentId}: ${err.message}`);
        }
      }
    });


    // Update the process_metrics handler
    socket.on("process_metrics", async (data) => {
      const agentId = data.agentId;
      console.log(`[Process Metrics] from ${agentId} (${data.processes.length} processes)`);

      // Enrich real-time data with AI insights from database
      const enrichedProcesses = await enrichProcessesWithAI(agentId, data.processes);

      // Forward ENRICHED data to dashboard frontend (live updates)
      io.emit("process_update", {
        agentId,
        processes: enrichedProcesses
      });

      // Store in database periodically (every 2 minutes)
      const now = Date.now();
      const lastStore = agentLastProcessStore[agentId] || 0;
      const STORE_INTERVAL = 120000; // 2 minutes

      if (now - lastStore > STORE_INTERVAL) {
        try {
          await axios.post(`${process.env.BASE_URL}/telemetry/process`, data);
          console.log(`[DB] Stored process metrics for ${agentId}`);
          agentLastProcessStore[agentId] = now;

          // Generate AI insights after storing
          await axios.post(`${process.env.BASE_URL}/telemetry/process/insights`, { id: agentId });
          console.log(`[AI] Triggered insights generation for ${agentId}`);
        } catch (err: any) {
          console.error(`[DB Error] ${agentId}: ${err.message}`);
        }
      }
    });

    // Add this helper function at the bottom of socket.ts
    async function enrichProcessesWithAI(agentId: string, realtimeProcesses: any[]) {
      try {
        // Fetch AI-analyzed processes from database
        const response = await axios.get(
          `${process.env.BASE_URL}/telemetry/process/ai-cache/${agentId}`,
          { timeout: 3000 }
        );

        const storedProcesses = response.data || [];

        if (storedProcesses.length === 0) {
          console.log(`[Enrich] No AI cache found for ${agentId}, showing as unknown`);
          return realtimeProcesses.map(p => ({
            ...p,
            aiFlag: "unknown",
            aiReason: "Not yet analyzed"
          }));
        }

        // Create a map: processName -> AI insights
        const aiMap = new Map<string, { aiFlag: string; aiReason: string | null }>();

        storedProcesses.forEach((stored: any) => {
          const key = stored.processName?.toLowerCase()?.trim();
          if (key) {
            aiMap.set(key, {
              aiFlag: stored.aiFlag || "unknown",
              aiReason: stored.aiReason || null
            });
          }
        });

        console.log(`[Enrich] Mapped ${aiMap.size} processes for ${agentId}`);

        // Enrich real-time processes
        const enriched = realtimeProcesses.map(p => {
          const key = p.processName?.toLowerCase()?.trim();
          const aiData = key ? aiMap.get(key) : null;

          return {
            ...p,
            aiFlag: aiData?.aiFlag || "unknown",
            aiReason: aiData?.aiReason || "Not yet analyzed"
          };
        });

        const matchedCount = enriched.filter(p => p.aiFlag !== "unknown").length;
        console.log(`[Enrich] Matched ${matchedCount}/${enriched.length} processes with AI data`);

        return enriched;

      } catch (error: any) {
        console.error("[Enrich Process Error]", error.message);
        // Return with unknown if enrichment fails
        return realtimeProcesses.map(p => ({
          ...p,
          aiFlag: "unknown",
          aiReason: "Analysis pending"
        }));
      }
    }

    // For killing a Process
    socket.on("kill_process", (data) => {
      const { agentId, pid } = data;
      const agentSocket = connectedAgents[agentId];
      if (!agentSocket) return console.error(`[Kill] Agent ${agentId} not connected`);

      console.log(`[Kill] Sending kill request for PID ${pid} to ${agentId}`);
      agentSocket.emit("kill_process", { pid });
    });

    // Kill Response
    socket.on("process_kill_response", (data) => {
      console.log(`[Kill Response] Agent ${socket.data.agentId}:`, data);
      io.emit("process_kill_result", data);
    });

    // Cache cleanup
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
        console.log(`[Timeout] Agent ${agentId} (last seen ${Math.round(diff / 1000)}s ago)`);

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