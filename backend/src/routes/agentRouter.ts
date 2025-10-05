import express from "express";
import { AIInsights, metricAgent } from "../controllers/agentController.ts";

const telemetryRouter = express.Router();

telemetryRouter.post("/telemetry", metricAgent);
telemetryRouter.post("/telemetry/insights", AIInsights);

export default telemetryRouter;