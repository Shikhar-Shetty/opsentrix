import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/agent.ts";
import { Server } from "socket.io";
import { createServer } from "http";
import { emit } from "process";


const app = express();
const PORT = process.env.PORT || 4000;

const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})

io.on("connection", (socket) => {
  console.log("Client Connected");

  socket.on("agent_metrics", (data) => {
    console.log("Agent Metrics", data);
  })
  socket.on("disconnected", () => {
    console.log("Socket's Disconnected");
  })


})

app.use(cors()); 
app.use(express.json()); 

app.use("/", telemetryRouter);

// app.listen(PORT, () => {
//   console.log(`Backend running on port ${PORT}`);
// });

server.listen(PORT, () => {
  console.log(`Backend + Socket.IO running on port ${PORT}`);
});
