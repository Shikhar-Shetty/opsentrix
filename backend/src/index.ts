import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/agent.ts";
import { Server } from "socket.io";
import { createServer } from "http";


const app = express();
const PORT = process.env.PORT || 4000;

const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "*" }
})

io.on("connection", (socket) => {
  console.log("Client Connected");
  socket.emit("message", "Welcome to websockets")

  socket.on("chat message", (data) => {
    console.log("Your Message", data);
  })

  setInterval(() => {
    socket.emit("dashboard_update", {
      cpu: Math.floor(Math.random() * 100),
      memory: Math.floor(Math.random() * 100),
    });
  }, 3000);

  socket.on("disconnected", () => {
    console.log("Socket's Disconnected");
  })
})

app.use(cors()); 
app.use(express.json()); 

app.use("/", telemetryRouter);

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
