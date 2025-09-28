import express from "express";
import { metricAgent } from "../controllers/agentController.js";

const telemetryRouter = express.Router();

telemetryRouter.post("/telemetry", metricAgent);

export default telemetryRouter;