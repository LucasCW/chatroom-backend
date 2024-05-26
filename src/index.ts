import bodyParser from "body-parser";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { createGroup } from "./core/data/group";

const app = express();

// app.use(cors());
app.use(bodyParser.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
  },
});

io.on("connection", (socket) => {
  console.log(socket.id + " connected");
});

httpServer.listen(3000);

const mongodbURL =
  "mongodb+srv://lucaschiwang:FyJjKUC5DtLmYqnZ@cluster0.mios5r0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongodbURL).then((res) => {
  console.log("MongoDB connected");
});
