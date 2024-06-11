import mongoose, { Types } from "mongoose";
import { Socket } from "socket.io";
import { GroupModel, GroupType, IGroup } from "../data/group";
import { HistoryModel, saveHistory } from "../data/history";
import { RoomModel, RoomType, createPrivateChannel } from "../data/room";
import { IUser } from "../data/user";
import { io } from "../share/wsServer";

const connectedPrivateGroupSocketRegistry = new Map<string, Socket>();

interface Message {
  message: string;
  user: IUser;
  roomId: string;
  time: Date;
}

const sendHistory = async (
  socket: Socket,
  group: Types.ObjectId,
  room: Types.ObjectId
) => {
  const history = await HistoryModel.find({
    room: room._id,
    group: group._id,
  })
    .populate("user")
    .lean();

  socket.emit("history", {
    id: room._id,
    histories: history,
  });
};

const joinRoom = (
  socket: Socket,
  groupId: Types.ObjectId,
  roomId: Types.ObjectId
) => {
  sendHistory(socket, groupId, roomId);
  socket.join(roomId._id.toString());
};

const loginHandler = async (socket: Socket, { userId }: { userId: string }) => {
  connectedPrivateGroupSocketRegistry.set(userId, socket);

  socket.emit("loginSuccess", userId);

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

export const initGroupConnectionListeners = (group: IGroup) => {
  io.of(group._id!.toString()).on("connection", async (socket) => {
    if (group.type == GroupType.Private) {
      socket.on("onPrivateChatCreation", (payload) => {
        onPrivateChatCreationHandler(socket, payload, group._id!.toString());
      });

      socket.on("login", (response) => loginHandler(socket, response));
      socket.on("logout", (response) => logoutHanddler(socket, response));

      socket.on(
        "loadPrivateChannels",
        async ({ userId }: { userId: string }) => {
          const privateGroup = await GroupModel.findOne({
            type: GroupType.Private,
          }).lean();

          const privateChannels = await RoomModel.find({
            roomType: RoomType.Private,
            users: userId,
          })
            .populate("users")
            .lean();
          socket.emit("privateChannelsLoaded", {
            privateGroup,
            privateChannels,
          });
        }
      );
    } else {
      group.rooms.forEach(async (room) =>
        joinRoom(socket, group._id!, room._id)
      );
    }

    groupConnectionListener(socket, group._id!);
  });
};

const logoutHanddler = (socket: Socket, { userId }: { userId: string }) => {
  socket.emit("logoutSuccess");
};

const onPrivateChatCreationHandler = async (
  socket: Socket,
  { creator, user }: { creator: string; user: string },
  groupId: string
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

    io.of(groupId).emit("privateChatChannelCreated", {
      privateChannel: privateChannelCreated,
    });

    socket.join(privateChannelCreated!._id.toString());

    connectedPrivateGroupSocketRegistry
      .get(user)
      ?.join(privateChannelCreated!._id.toString());
  }
};

const groupConnectionListener = (socket: Socket, groupId: Types.ObjectId) => {
  // handle new messages
  socket.on("newMessage", (newMessage: Message) =>
    newMessageListener(groupId, newMessage)
  );
};

const newMessageListener = async (
  groupId: Types.ObjectId,
  { message, user, roomId, time }: Message
) => {
  // Save the message
  const newMessage = await saveHistory(
    message,
    groupId,
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
  io.of(groupId.toString())
    .to(roomId)
    .emit("broadcastMessage", { id: roomId, history: messageSaved });
};
