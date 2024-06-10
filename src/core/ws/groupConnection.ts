import mongoose from "mongoose";
import { Socket } from "socket.io";
import { IGroup } from "../data/group";
import { HistoryModel, saveHistory } from "../data/history";
import { IUser } from "../data/user";
import { io } from "../share/wsServer";

interface Message {
  message: string;
  user: IUser;
  roomId: string;
  time: Date;
}

export const initGroupConnectionListeners = (group: IGroup) => {
  io.of(group.id).on("connection", (socket) => {
    console.log("group socket", socket.id);
    group.rooms.forEach(async (room) => {
      socket.join(room._id.toString());

      const history = await HistoryModel.find({
        room: room._id,
        group: group._id,
      })
        .populate("user")
        .lean();

      socket.emit("history", {
        id: room._id.toString(),
        histories: history,
      });
    });
    groupConnectionListener(socket, group);

    socket.on("disconnect", (res) => {
      console.log("socket disconnect", res);
    });
  });
};

const groupConnectionListener = (socket: Socket, group: IGroup) => {
  // handle new messages
  socket.on("newMessage", (newMessage: Message) =>
    newMessageListener(group, newMessage)
  );
};

const newMessageListener = async (
  group: IGroup,
  { message, user, roomId, time }: Message
) => {
  console.log("got new message", message);
  // Save the message
  const newMessage = await saveHistory(
    message,
    group._id!,
    new Date(time),
    new mongoose.Types.ObjectId(roomId),
    user._id!
  );

  const messageSaved = await HistoryModel.findOne({
    _id: newMessage._id,
  })
    .populate("user")
    .lean();

  //   Send new message to the room
  io.of(group.id)
    .to(roomId)
    .emit("broadcastMessage", { id: roomId, history: messageSaved });
};

const joinRoomListener = async (
  socket: Socket,
  roomId: string,
  group: IGroup,
  callback: (result: boolean) => void
) => {
  // Leave all rooms
  //   for (let s of socket.rooms) {
  //     if (socket.id != s) {
  //       socket.leave(s);
  //     }
  //   }

  // then join the new room
  socket.join(roomId);

  // find existing history and send it over.
  const history = await HistoryModel.find({
    room: new mongoose.Types.ObjectId(roomId as string),
    group: group._id,
  })
    .populate("user")
    .lean();

  socket.emit("history", { id: roomId, histories: history });
  callback(true);
};
