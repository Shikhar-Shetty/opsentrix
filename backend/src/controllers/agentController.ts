import { GoogleGenAI } from "@google/genai";
import prisma from "../prisma/client.ts";
import type { Request, Response } from "express";
import "dotenv/config";

const ai = new GoogleGenAI({apiKey : process.env.GEMINI_API_KEY!});

export const AIInsights = async (summary: string) => {

  const today = new Date().toISOString().split("T")[0];
  const prompt = `
    You are a professional system analyst. I am providing a summary of CPU, Memory, Disk, and Process metrics with timestamps. 
    Your task is to generate a **concise, professional paragraph summarizing insights for ${today} only**, focusing on:

    - Key trends (rises/drops in CPU, memory, disk usage, processes)  
    - Status changes (online/offline events)  
    - Any anomalies or unusual patterns  

    Do NOT include: past days, explanations about the format, filler words like "yes" or "no", or general commentary. Only professional insights.  

    Metrics data:

    ${summary}

    Output format:

    ${today}: [Concise paragraph summarizing insights, highlighting hikes or drops at specific times, and noting status changes]

    Ensure the paragraph is clear, specific, and actionable. Keep it professional and precise.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt
  })

  console.log(response.text)
  return response.text;
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

