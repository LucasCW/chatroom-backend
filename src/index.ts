import bodyParser from "body-parser";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createGroup } from "./core/data/group";
import { getAll } from "./core/services/group.service";

const groupConnectionListeners = new Map<string, boolean>();
const app = express();

// app.use(cors());
app.use(bodyParser.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
  },
});

io.on("connection", async (socket) => {
  console.log(socket.id + " connected");
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListeners.has(group.path)) {
      io.of(group.path).on("connection", (socket) => {
        console.log("connected to ", group.path);
        group.rooms.forEach((room) => {
          socket.join(room.path);
        });
      });
      groupConnectionListeners.set(group.path, true);
    }
  });
  io.emit("groupsList", { groups: allGroups });
  io.sockets;
});

httpServer.listen(3000);

app.get("/test", function (req, res) {
  console.log("test triggered");
  io.to("room1").emit("message", "emit directly to room1");

  io.of("group1").to("room1").emit("message", "This is a test group1 message1");
  io.of("group1").to("room2").emit("message", "This is a test group1 message2");

  io.of("group2").to("room1").emit("message", "This is a test group2 message1");
  io.of("group2").to("room2").emit("message", "This is a test group2 message2");
  res.send("test");
});

const mongodbURL =
  "mongodb+srv://lucaschiwang:FyJjKUC5DtLmYqnZ@cluster0.mios5r0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongodbURL).then((res) => {
  console.log("MongoDB connected");
});
