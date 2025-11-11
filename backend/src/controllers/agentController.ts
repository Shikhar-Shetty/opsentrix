import { GoogleGenAI } from "@google/genai";
import prisma from "../prisma/client.ts";
import type { Request, Response } from "express";
import "dotenv/config";
import { agentLatestMetrics, connectedAgents, sendCleanupCommand } from "../socket.ts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const getDatesInTimezone = (timezone = "Asia/Kolkata") => {
  const now = new Date();

  const todayInTZ = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const yesterdayInTZ = new Date(todayInTZ);
  yesterdayInTZ.setDate(todayInTZ.getDate() - 1);

  const todayStr = todayInTZ.toISOString().split("T")[0];
  const yesterdayStr = yesterdayInTZ.toISOString().split("T")[0];

  return { todayStr, yesterdayStr, todayInTZ, yesterdayInTZ };
};

export const AIInsights = async (req: Request, res: Response) => {
  try {
    const agentId = req.body.id;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID missing" });
    }

    const agent = await prisma.agent.findUnique({ where: { id: agentId } });

    if (!agent) {
      return res.status(404).json({ error: "No Agent Found. Try Again" });
    }

    const { todayStr, yesterdayStr, yesterdayInTZ } = getDatesInTimezone("Asia/Kolkata");

    if (agent.insightDate) {
      const insightDateStr = new Date(
        agent.insightDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      ).toISOString().split("T")[0];

      if (insightDateStr === yesterdayStr) {
        console.log(`Insights for ${yesterdayStr} already exist. Skipping generation.`);
        return res.status(200).json({ message: "Already generated for yesterday." });
      }
    }

    const prompt = `
      You are a professional system analyst. I am providing a summary of CPU, Memory, Disk, and Process metrics with timestamps.

      Your task is to generate a **concise, professional paragraph summarizing insights for the day before this day: ${todayStr} only**, focusing on:
      - Key trends (rises/drops in CPU, memory, disk usage, processes)
      - Status changes (online/offline events)
      - Any anomalies or unusual patterns

      Do NOT include: today's or day before yesterday's insights, explanations about the format, filler words like "yes" or "no", or general commentary.

      Metrics data:
      ${agent.summary}

      Output format:
      ${yesterdayStr}: [Compose a concise, professional paragraph that highlights notable changes and insights in system performance, using numerical data (percentages, quantities, etc.) where relevant. Avoid repeating the date or any framing phrases—focus purely on a clear, analytical summary in natural English.]
      `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const text = response?.text?.trim();

    if (!text) {
      return res.status(400).json({ error: "AI returned no content" });
    }

    const yesterdayDate = new Date(yesterdayStr + "T00:00:00.000Z");

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        dailyinsights: text,
        insightDate: yesterdayDate,
      },
    });

    console.log(`[AI] Generated insights for ${yesterdayStr} → ${agent.id}:`, updatedAgent);
    return res.json(updatedAgent);

  } catch (error) {
    console.error("[AIInsights Error]", error);
    return res.status(500).json({ error: "Failed to generate insights" });
  }
};

export const agentCleanup = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.body;
    console.log(`[Cleanup Request] Agent: ${agentId}`);

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID required" });
    }

    if (!connectedAgents[agentId]) {
      return res.status(404).json({
        error: "Agent not connected",
        details: "Agent must be online to perform cleanup"
      });
    }

    try {
      console.log(`[Cleanup] Initiating cleanup for ${agentId}...`);
      const result = await sendCleanupCommand(agentId);

      console.log(`[Cleanup] Success for ${agentId}:`, result);

      return res.json({
        success: true,
        agentId,
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error(`[Cleanup Error] ${agentId}: ${error.message}`);

      if (error.message.includes("timeout")) {
        return res.status(504).json({
          error: "Cleanup timeout",
          details: "Agent did not respond within 30 seconds"
        });
      }

      return res.status(500).json({
        error: "Cleanup failed",
        details: error.message
      });
    }

  } catch (err: any) {
    console.error("[Cleanup Critical Error]", err);
    return res.status(500).json({
      error: "Internal server error",
      details: err.message
    });
  }
};

export const getAgentStatus = async (req: Request, res: Response) => {
  const status = Object.keys(connectedAgents).map(agentId => ({
    id: agentId,
    connected: true,
    lastMetrics: agentLatestMetrics[agentId] || null,
    socketConnected: connectedAgents[agentId]?.connected || false
  }));

  res.json({
    connectedCount: status.length,
    agents: status
  });
};


export const metricAgent = async (req: Request, res: Response) => {
  const agentData = req.body;

  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentData.id } });

    if (!agent) return res.status(404).json({ error: "No Agent Found. Try Again" });
    if (agent.token !== agentData.token) return res.status(403).json({ error: "Invalid Token" });

    let newSummary: string = `\n${new Date().toISOString()}: Memory: ${agentData.memory}%, Disk: ${agentData.disk}%, CPU: ${agentData.CPU}%, Processes: ${agentData.processes}, Status: ${agentData.status}`;
    let summary: string = (agent.summary ?? '') + newSummary;
    console.log("Summary:", summary);

    const updatedAgent = await prisma.agent.update({
      where: { id: agentData.id },
      data: {
        memory: agentData.memory,
        disk: agentData.disk,
        CPU: agentData.CPU,
        lastHeartbeat: new Date(),
        status: agentData.status,
        location: agentData.location,
        processes: agentData.processes,
        summary: summary
      },
    });

    console.log("Updated agent:", updatedAgent);
    return res.json(updatedAgent);
  } catch (error) {
    console.error("Error while sending metrics:", error);
    return res.status(500).json({ error: "Server error" });
  }
};


export const StoreProcessMetrics = async (req: any, res: any) => {
  try {
    const { agentId, processes } = req.body;

    if (!agentId || !processes || !Array.isArray(processes)) {
      return res.status(400).json({
        error: "Missing agentId or processes array"
      });
    }

    const processData = processes.map(proc => ({
      agentId: agentId,
      processName: proc.processName || "unknown",
      pid: proc.pid,
      cpuUsage: proc.cpuUsage || 0.0,
      memoryUsage: proc.memoryUsage || 0.0,
      status: proc.status || "unknown",
    }));

    const result = await prisma.processMetrics.createMany({
      data: processData,
      skipDuplicates: true
    });

    console.log(`[DB] Stored ${result.count} process metrics for ${agentId}`);

    return res.status(200).json({
      success: true,
      stored: result.count,
    });

  } catch (error: any) {
    console.error("[StoreProcessMetrics Error]", error);
    return res.status(500).json({
      error: "Failed to store process metrics",
      details: error.message
    });
  }
};

export const GenerateProcessInsights = async (req: Request, res: Response) => {
  try {
    const agentId = req.body.id;
    if (!agentId) return res.status(400).json({ error: "Agent ID missing" });

    const processes = await prisma.processMetrics.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: 100,
      distinct: ['processName'],
    });

    if (processes.length === 0)
      return res.status(404).json({ error: "No process data found for this agent" });

    const processSummary = processes
      .map(
        (p) =>
          `${p.processName} (PID: ${p.pid}) — CPU: ${p.cpuUsage}%, MEM: ${p.memoryUsage}%, STATUS: ${p.status}`
      )
      .join("\n");

    const prompt = `
You are a Linux system process analyst. Analyze these processes and determine safety FOR TERMINATION.

CRITICAL RULES FOR SAFE FLAG:
1. Mark as SAFE only if:
  - User-owned applications (browsers, editors, user scripts)
  - Non-critical services that can be restarted
  - Processes using excessive resources that aren't system-critical
  - Duplicate or hung processes

2. Mark as UNSAFE (cannot be killed safely):
  - System daemons (systemd, init, kworker, ksoftirqd, etc.)
  - Kernel threads (anything with [brackets])
  - Critical services (sshd, networkd, dockerd if it's the agent container)
  - The monitoring agent itself
  - Root-owned system processes
  - Any process under PID 1000 (usually system processes)

3. When in doubt, mark as UNSAFE - it's better to prevent killing than to risk system stability

For EACH process, respond EXACTLY in this format:
Process <PID>: <reason in 10 words max>. Flag: <safe|unsafe>

Example responses:
Process 1234: User web browser, safe to terminate. Flag: safe
Process 567: System daemon, critical for OS. Flag: unsafe
Process 8910: Text editor, can be closed. Flag: safe
Process 123: Kernel thread, never terminate. Flag: unsafe

=== PROCESSES TO ANALYZE ===
${processSummary}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response?.text?.trim();
    if (!text) return res.status(400).json({ error: "AI returned no content" });

    let updatedCount = 0;

    for (const p of processes) {
      const regex = new RegExp(`Process\\s*${p.pid}[:\\-]?\\s*(.*?)(?:Flag:\\s*(safe|unsafe))`, "i");
      const match = text.match(regex);

      const reason = match?.[1]?.trim() || "Standard system process";
      const flag = match?.[2]?.trim()?.toLowerCase() || "safe"; // Default to SAFE

      await prisma.processMetrics.updateMany({
        where: {
          agentId,
          processName: p.processName
        },
        data: {
          aiReason: reason,
          aiFlag: flag,
        },
      });

      updatedCount++;
    }

    console.log(`[AI] Generated insights for ${updatedCount} unique processes (${agentId})`);
    return res.json({
      success: true,
      message: "Process insights updated successfully",
      analyzedCount: updatedCount,
      rawInsights: text,
    });

  } catch (error) {
    console.error("[GenerateProcessInsights Error]", error);
    return res.status(500).json({ error: "Failed to generate process insights" });
  }
};

export const GetRecentProcessMetrics = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID missing" });
    }

    const processes = await prisma.$queryRaw`
      SELECT DISTINCT ON (processName) 
        id, processName, pid, cpuUsage, memoryUsage, status, aiFlag, aiReason, createdAt
      FROM "ProcessMetrics"
      WHERE agentId = ${agentId}
        AND aiFlag IS NOT NULL
        AND aiFlag != 'unsafe'
      ORDER BY processName, createdAt DESC
      LIMIT 100
    `;

    return res.json(processes);
  } catch (error) {
    console.error("[GetRecentProcessMetrics Error]", error);
    return res.status(500).json({ error: "Failed to fetch process metrics" });
  }
};

export const GetAICachedProcesses = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({ error: "Agent ID missing" });
    }

    const processes = await prisma.processMetrics.findMany({
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

    console.log(`[AI Cache] Returning ${processes.length} analyzed processes for ${agentId}`);
    return res.json(processes);

  } catch (error) {
    console.error("[GetAICachedProcesses Error]", error);
    return res.status(500).json({ error: "Failed to fetch AI cache" });
  }
};