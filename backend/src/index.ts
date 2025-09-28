import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/agent.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors()); 
app.use(express.json()); 

app.use("/telemetry", telemetryRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
