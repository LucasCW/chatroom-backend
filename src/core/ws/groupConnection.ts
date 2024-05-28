import mongoose from "mongoose";
import { Socket } from "socket.io";
import { IGroup } from "../data/group";
import { HistoryModel, saveHistory } from "../data/history";
import { io } from "../share/wsServer";

interface Message {
  message: string;
  username: string;
  roomId: string;
  time: Date;
}

export const initGroupConnectionListeners = (group: IGroup) => {
  io.of(group.id).on("connection", (socket) =>
    groupConnectionListener(socket, group)
  );
};

const groupConnectionListener = (socket: Socket, group: IGroup) => {
  // Join a room in a group.
  socket.on("joinRoom", (roomId: string, callback) =>
    joinRoomListener(socket, roomId, group, callback)
  );

  // handle new messages
  socket.on("newMessage", (newMessage: Message) =>
    newMessageListener(group, newMessage)
  );
};

const newMessageListener = async (
  group: IGroup,
  { message, username, roomId, time }: Message
) => {
  // Save the message
  const newMessage = await saveHistory(
    message,
    group._id!,
    new Date(time),
    new mongoose.Types.ObjectId(roomId as string),
    username
  );

  // Send new message to the room
  io.of(group.id).to(roomId).emit("broadcastMessage", newMessage);
};

const joinRoomListener = async (
  socket: Socket,
  roomId: string,
  group: IGroup,
  callback: (result: boolean) => void
) => {
  // Leave all rooms
  for (let s of socket.rooms) {
    if (socket.id != s) {
      socket.leave(s);
    }
  }

  // then join the new room
  socket.join(roomId);

  // find existing history and send it over.
  const history = await HistoryModel.find({
    room: new mongoose.Types.ObjectId(roomId as string),
    group: group._id,
  }).lean();
  socket.emit("history", history);
  console.log(callback);
  callback(true);
};
