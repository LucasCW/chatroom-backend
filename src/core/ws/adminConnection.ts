import mongoose, { Types } from "mongoose";
import { Socket } from "socket.io";
import { HistoryModel, saveHistory } from "../data/history";
import { RoomModel, RoomType, createPrivateChannel } from "../data/room";
import { IUser, UserModel } from "../data/user";
import { getAll, getAllWithRoomsPopulated } from "../services/group.service";
import * as UserService from "../services/user.service";
import { io } from "../share/wsServer";
import { initGroupConnectionListeners } from "./groupConnection";

interface Message {
  message: string;
  user: IUser;
  roomId: string;
  time: Date;
}

const groupConnectionListenersRegistry = new Map<string, boolean>();
const adminConnectionListenersRegistry = new Map<string, boolean>();
const connectedAdminSocketRegistry = new Map<string, Socket>();

export const initAdminConnection = () => {
  // when connected to admin (/)
  io.on("connection", (socket) => adminConnectionListener(socket));
};

export const initGroupConnection = async () => {
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListenersRegistry.has(group.id)) {
      console.log("initiating group connection listener");
      initGroupConnectionListeners(group);
      groupConnectionListenersRegistry.set(group.id, true);
    }
  });
};

const adminConnectionListener = async (socket: Socket) => {
  console.log("admin socket", socket.id);

  if (!adminConnectionListenersRegistry.has(socket.id)) {
    socket.on("findUser", (response) => findUserListener(socket, response));
    socket.on("login", (response) => loginHanddler(socket, response));
    socket.on("logout", (response) => logoutHanddler(socket, response));
    socket.on("disconnect", (disconnectReason) => {
      console.log(
        "number of sockets connected to admin",
        adminConnectionListenersRegistry.size
      );
      adminConnectionListenersRegistry.delete(socket.id);
    });

    socket.on("onPrivateChatCreation", (payload) => {
      console.log("payload", payload);
      onPrivateChatCreationHandler(socket, payload);
    });

    // handle new messages
    socket.on("newMessage", (newMessage: Message) =>
      newMessageListener(newMessage)
    );

    socket.on("loadPrivateChannels", async ({ userId }: { userId: string }) => {
      const privateChannels = await RoomModel.find({
        roomType: RoomType.Private,
        users: userId,
      })
        .populate("users")
        .lean();
      socket.emit("privateChannelsLoaded", { privateChannels });
    });
    adminConnectionListenersRegistry.set(socket.id, true);
  }

  emitGroupsList();
};

const newMessageListener = async ({
  message,
  user: user,
  roomId: privateChannelId,
  time,
}: Message) => {
  console.log("new Message Handdler called");
  // Save the message
  const newMessage = await saveHistory(
    message,
    null,
    new Date(time),
    new mongoose.Types.ObjectId(privateChannelId),
    user._id!
  );

  const messageSaved = await HistoryModel.findOne({
    _id: newMessage._id,
  })
    .populate("user")
    .lean();

  console.log("new message sent back", messageSaved);
  //   Send new message to the room
  io.to(privateChannelId).emit("broadcastMessage", {
    id: privateChannelId,
    history: messageSaved,
  });
};

const loginHanddler = async (
  socket: Socket,
  { userId }: { userId: string }
) => {
  connectedAdminSocketRegistry.set(userId, socket);
  socket.emit("loginSuccess");

  const privateChannels = await RoomModel.find({
    roomType: RoomType.Private,
    users: userId,
  }).lean();

  privateChannels.forEach(async (privateChannel) => {
    const history = await HistoryModel.find({
      room: privateChannel._id,
    })
      .populate("user")
      .lean();

    socket.join(privateChannel._id.toString());
    socket.emit("history", {
      id: privateChannel._id.toString(),
      histories: history,
    });
  });
};

const logoutHanddler = (socket: Socket, { userId }: { userId: string }) => {
  connectedAdminSocketRegistry.delete(userId);
  socket.emit("logoutSuccess");
};

const onPrivateChatCreationHandler = async (
  socket: Socket,
  { creator, user }: { creator: string; user: string }
) => {
  const users = [creator, user].map((id) => new Types.ObjectId(id));
  const hasPrivateChannel = await RoomModel.exists({
    roomType: RoomType.Private,
  })
    .where("users")
    .all(users)
    .size(users.length);

  if (!hasPrivateChannel) {
    const newPrivateChannel = await createPrivateChannel([creator, user]);

    const privateChannelCreated = await RoomModel.findOne({
      _id: newPrivateChannel._id,
    })
      .populate("users")
      .lean();

    io.emit("privateChatChannelCreated", {
      privateChannel: privateChannelCreated,
    });

    socket.join(privateChannelCreated!._id.toString());
    connectedAdminSocketRegistry
      .get(user)
      ?.join(privateChannelCreated!._id.toString());
  }
};

const findUserListener = async (
  socket: Socket,
  { username }: { username: string }
) => {
  const user = await UserModel.findOne({ username: username }).lean();
  socket.emit("findUserResponse", { user: user });
};

const emitGroupsList = async () => {
  const allGroupsWithRoomPopulated = await getAllWithRoomsPopulated();
  const allUsers = await UserService.getAll();
  io.emit("groupsList", {
    groups: allGroupsWithRoomPopulated,
    users: allUsers,
  });
};
