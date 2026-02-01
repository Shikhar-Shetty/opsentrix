import { Server, Socket } from "socket.io";
import "dotenv/config";
import { checkAndSendAlert } from "./utils/alert.ts";
import prisma from "./prisma/client.ts";
import { metricAgentService, storeProcessMetricsService, GenerateProcessInsightsService } from "./controllers/agentController.ts";

export const agentLatestMetrics: Record<string, any> = {};
export const agentLastHeartbeat: Record<string, number> = {};

export const connectedAgents: Record<string, Socket> = {};

const pendingCleanups: Record<string, {
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}> = {};

const agentTimeout = 45000; 
export const agentLastProcessStore: Record<string, number> = {};
export const agentLastAIAnalysis: Record<string, number> = {};

export function initSocket(io: Server) {
  io.on("connection", (socket) => {
    // console.log(`[Socket] New connection from ${socket.handshake.address}`);

    socket.on("register_agent", async (data) => {
      const agentId = data.id;
      // console.log(`[Agent Register Request] ${agentId}`);

      try {
        const agent = await prisma.agent.findUnique({ where: { id: agentId } });
        if (!agent || agent.token !== data.token) {
          console.log(`[Auth Failed] Agent ${agentId} used invalid token or does not exist.`);
          socket.emit("error", { message: "Authentication failed" });
          socket.disconnect();
          return;
        }

        console.log(`[Agent Authenticated] ${agentId}`);
        connectedAgents[agentId] = socket;
        socket.data.agentId = agentId;
        socket.data.token = data.token;
      } catch (err) {
        console.error(`[Auth Error] ${agentId}:`, err);
        socket.disconnect();
      }
    });

    socket.on("agent_metrics", async (data) => {
      const agentId = data.id;
      if (!socket.data.agentId) return; 

      agentLatestMetrics[agentId] = data;
      agentLastHeartbeat[agentId] = Date.now();

      if (!connectedAgents[agentId]) {
        connectedAgents[agentId] = socket;
      }

      await checkAndSendAlert(agentId);

      // console.log(`[Metrics] ${agentId} | CPU: ${data.CPU.toFixed(1)}% | MEM: ${data.memory.toFixed(1)}%`);

      io.emit("agent_update", {
        id: agentId,
        name: data.name,
        CPU: data.CPU,
        token: data.token,
        memory: data.memory,
        disk: data.disk,
        location: data.location,
        processes: data.processes,
        status: "online",
        lastHeartbeat: new Date().toISOString(),
      });

      if (!socket.data.firstStored) {
        try {
          await metricAgentService(data);
          // await GenerateProcessInsightsService(agentId); // Optional on first connect
          console.log(`[DB] Stored first metrics for ${agentId}`);
          socket.data.firstStored = true;
        } catch (err: any) {
          console.error(`[DB Error] ${agentId}: ${err.message}`);
        }
      }
    });


    socket.on("process_metrics", async (data) => {
      const agentId = data.agentId;
      if (!socket.data.agentId) return;

      console.log(`[Process Metrics] from ${agentId} (${data.processes.length} processes)`);

      const enrichedProcesses = await enrichProcessesWithAI(agentId, data.processes);

      io.emit("process_update", {
        agentId,
        processes: enrichedProcesses
      });

      const now = Date.now();
      const lastStore = agentLastProcessStore[agentId] || 0;
      const STORE_INTERVAL = 120000; // 2 minutes for DB
      const AI_INTERVAL = 1000 * 60 * 60 * 4; // 4 hours for AI (Quota protection)

      if (now - lastStore > STORE_INTERVAL) {
        try {
          await storeProcessMetricsService(agentId, data.processes);
          console.log(`[DB] Stored process metrics for ${agentId}`);
          agentLastProcessStore[agentId] = now;

          const lastAI = agentLastAIAnalysis[agentId] || 0;
          if (now - lastAI > AI_INTERVAL) {
            try {
              await GenerateProcessInsightsService(agentId);
              console.log(`[AI] Generated fresh insights for ${agentId}`);
              agentLastAIAnalysis[agentId] = now;
            } catch (aiErr: any) {
              if (aiErr.message?.includes("429") || aiErr.message?.includes("quota")) {
                console.warn(`[AI Quota] Rate limit hit for ${agentId}. Skipping analysis.`);
              } else {
                console.error(`[AI Error] ${agentId}:`, aiErr.message);
              }
            }
          }
        } catch (err: any) {
          console.error(`[DB Error] ${agentId}: ${err.message}`);
        }
      }
    });

    async function enrichProcessesWithAI(agentId: string, realtimeProcesses: any[]) {
      try {
        const storedProcesses = await prisma.processMetrics.findMany({
          where: {
            agentId,
            aiFlag: { not: "unknown" }
          },
          orderBy: { createdAt: "desc" },
          distinct: ['processName'],
          select: {
            processName: true,
            aiFlag: true,
            aiReason: true,
          }
        });

        if (storedProcesses.length === 0) {
          // console.log(`[Enrich] No AI cache found for ${agentId}, showing as unknown`);
          return realtimeProcesses.map(p => ({
            ...p,
            aiFlag: "unknown",
            aiReason: "Not yet analyzed"
          }));
        }

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

        const enriched = realtimeProcesses.map(p => {
          const key = p.processName?.toLowerCase()?.trim();
          const aiData = key ? aiMap.get(key) : null;

          return {
            ...p,
            aiFlag: aiData?.aiFlag || "unknown",
            aiReason: aiData?.aiReason || "Not yet analyzed"
          };
        });

        return enriched;

      } catch (error: any) {
        console.error("[Enrich Process Error]", error.message);
        return realtimeProcesses.map(p => ({
          ...p,
          aiFlag: "unknown",
          aiReason: "Analysis pending"
        }));
      }
    }

    socket.on("kill_process", (data) => {
      const { agentId, pid } = data;
      const agentSocket = connectedAgents[agentId];
      if (!agentSocket) return console.error(`[Kill] Agent ${agentId} not connected`);

      console.log(`[Kill] Sending kill request for PID ${pid} to ${agentId}`);
      agentSocket.emit("kill_process", { pid });
    });

    socket.on("process_kill_result", (data) => {
      console.log(`[Kill Response] Agent ${socket.data.agentId}:`, data);
      io.emit("process_kill_result", data);
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
        delete agentLatestMetrics[agentId];
        delete agentLastHeartbeat[agentId];

        // Directly update DB - don't rely on in-memory state
        try {
          await prisma.agent.update({
            where: { id: agentId },
            data: { status: "offline" }
          });
          console.log(`[DB] Marked ${agentId} as offline`);
        } catch (err) {
          console.error(`[DB Error] Failed to update ${agentId} status:`, err);
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

        // Directly update DB - don't rely on in-memory state
        try {
          await prisma.agent.update({
            where: { id: agentId },
            data: { status: "offline" }
          });
          console.log(`[DB] Marked ${agentId} as offline (timeout)`);
        } catch (err: any) {
          console.error(`[Timeout DB Error] ${agentId}: ${err.message}`);
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