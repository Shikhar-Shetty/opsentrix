import { GoogleGenAI } from "@google/genai";
import prisma from "../prisma/client.ts";
import type { Request, Response } from "express";
import "dotenv/config";
import axios from "axios";
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
