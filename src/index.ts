import bodyParser from "body-parser";
import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { HistoryModel, saveHistory } from "./core/data/history";
import {
  getAll,
  getAllWithRoomsPopulated,
} from "./core/services/group.service";

const groupConnectionListeners = new Map<string, boolean>();
const app = express();

app.use(bodyParser.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://192.168.1.33:4200",
  },
});

// when connected to admin (/)
io.on("connection", async (socket) => {
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListeners.has(group.id)) {
      // connect to a group
      io.of(group.id).on("connection", (socket) => {
        // Join a room in a group.
        socket.on("joinRoom", async (room) => {
          // Leave all rooms
          for (let s of socket.rooms) {
            if (socket.id != s) {
              console.log("leaving room: ", s.toString());
              socket.leave(s);
            }
          }

          // then join the new room
          socket.join(room);

          // find existing history and send it over.
          const history = await HistoryModel.find({
            room: new mongoose.Types.ObjectId(room as string),
            group: group._id,
          }).lean();
          socket.emit("history", history);
        });

        // handle new messages
        socket.on("newMessage", async ({ message, username, roomId, time }) => {
          // Save the message
          const newMessage = await saveHistory(
            message,
            group._id,
            new Date(time),
            new mongoose.Types.ObjectId(roomId as string),
            username
          );

          // Send new message to the room
          io.of(group.id).to(roomId).emit("broadcastMessage", newMessage);
        });
      });
      groupConnectionListeners.set(group.id, true);
    }
  });

  const allGroupsWithRoomPopulated = await getAllWithRoomsPopulated();
  io.emit("groupsList", { groups: allGroupsWithRoomPopulated });
});

const mongodbURL =
  "mongodb+srv://lucaschiwang:FyJjKUC5DtLmYqnZ@cluster0.mios5r0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongodbURL).then((res) => {
  httpServer.listen(3000, "0.0.0.0");
});
