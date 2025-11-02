import express from "express";
import { agentCleanup, AIInsights, GenerateProcessInsights, GetAICachedProcesses, GetRecentProcessMetrics, metricAgent, StoreProcessMetrics } from "../controllers/agentController.ts";

const telemetryRouter = express.Router();

telemetryRouter.post("/telemetry", metricAgent);
telemetryRouter.post("/telemetry/insights", AIInsights);
telemetryRouter.post('/telemetry/clean-up', agentCleanup);
telemetryRouter.post('/telemetry/process', StoreProcessMetrics);
telemetryRouter.post('/telemetry/process/insights', GenerateProcessInsights)
telemetryRouter.get("/telemetry/process/recent/:agentId", GetRecentProcessMetrics);
telemetryRouter.get("/telemetry/process/ai-cache/:agentId", GetAICachedProcesses);

export default telemetryRouter;