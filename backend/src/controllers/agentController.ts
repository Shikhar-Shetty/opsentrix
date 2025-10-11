import { GoogleGenAI } from "@google/genai";
import prisma from "../prisma/client.ts";
import type { Request, Response } from "express";
import "dotenv/config";
import axios from "axios";
import { agentLatestMetrics, connectedAgents } from "../socket.ts";

const ai = new GoogleGenAI({apiKey : process.env.GEMINI_API_KEY!});

export const AIInsights = async (req: Request, res: Response) => {
  try {
    const agentId = req.body.id;
    if (!agentId) return res.status(400).json({ error: "Agent ID missing" });
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });

    if (!agent) return res.status(404).json({ error: "No Agent Found. Try Again" });

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = today.toISOString().split("T")[0];
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (agent.insightDate && agent.insightDate.toISOString().split("T")[0] === yesterdayStr) {
      console.log(`Insights for ${yesterdayStr} already exist. Skipping generation.`);
      return res.status(200).json({ message: "Already generated for yesterday." });
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
    if (!text) return res.status(400).json({ error: "AI returned no content" });

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        dailyinsights: text,
        insightDate: new Date(yesterdayStr as string),
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
    console.log(`[Cleanup Request] Agent ID: ${agentId}`);
    
    if (!agentId || !connectedAgents[agentId]) {
      return res.status(404).json({ error: "Agent not found or offline" });
    }
    
    const agent = connectedAgents[agentId];
    const metrics = agentLatestMetrics[agentId];
    
    if (!metrics?.hostIp || !agent?.port) {
      console.error(`[Cleanup Error] Missing data - hostIp: ${metrics?.hostIp}, port: ${agent?.port}`);
      return res.status(404).json({ error: "Agent IP or port missing" });
    }
    
    // SMART DETECTION: Check if agent is connecting from localhost
    const isLocalAgent = agent.ip.includes("127.0.0.1") || 
                         agent.ip.includes("::1") || 
                         agent.ip.includes("::ffff:127.0.0.1") ||
                         agent.ip === "::1";
    
    // Use localhost if agent is local, otherwise use the reported hostIp
    const targetIp = isLocalAgent ? "localhost" : metrics.hostIp;
    const agentUrl = `http://${targetIp}:${agent.port}`;
    
    console.log(`[Cleanup] Agent is ${isLocalAgent ? 'LOCAL' : 'REMOTE'}`);
    console.log(`[Cleanup] Connecting to agent at: ${agentUrl}/cleanup`);
    
    const response = await axios.post(`${agentUrl}/cleanup`, null, {
      timeout: 15000,
      validateStatus: (status) => status < 500
    });
    
    console.log(`[Cleanup] Success:`, response.data);
    res.json(response.data);
    
  } catch (err: any) {
    console.error(`[Cleanup Error] ${err.message}`);
    
    if (err.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: "Cannot connect to agent. Agent may be offline or port not accessible.",
        details: err.message
      });
    }
    
    if (err.code === 'ETIMEDOUT') {
      return res.status(504).json({
        error: "Connection to agent timed out.",
        details: err.message
      });
    }
    
    res.status(500).json({
      error: "Cleanup operation failed",
      details: err.message
    });
  }
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
