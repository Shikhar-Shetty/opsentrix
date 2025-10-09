import express from "express";
import { agentCleanup, AIInsights, metricAgent } from "../controllers/agentController.ts";

const telemetryRouter = express.Router();

telemetryRouter.post("/telemetry", metricAgent);
telemetryRouter.post("/telemetry/insights", AIInsights);
telemetryRouter.post('/telemetry/clean-up', agentCleanup);

export default telemetryRouter;