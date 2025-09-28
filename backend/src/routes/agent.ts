import express from "express";
import { metricAgent } from "../controllers/agentController.ts";

const telemetryRouter = express.Router();

telemetryRouter.post("/telemetry", metricAgent);

export default telemetryRouter;