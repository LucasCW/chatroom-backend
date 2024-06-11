import { Socket } from "socket.io";
import { UserModel } from "../data/user";
import {
  getAll,
  getAllWithRoomsPopulated as getAllWithPublicRoomsPopulated,
  getEmptyPrivateGroup,
} from "../services/group.service";
import * as UserService from "../services/user.service";
import { io } from "../share/wsServer";
import { initGroupConnectionListeners } from "./groupConnection";

const groupConnectionListenersRegistry = new Map<string, boolean>();
const adminConnectionListenersRegistry = new Map<string, boolean>();

const socketRegistry = new Map<
  string,
  { privateGroup: Socket; publicGroups: Socket[] }
>();

const getPrivateGroupSocket = (userId: string) => {
  return socketRegistry.get(userId)?.privateGroup;
};

const setPrivateGroupSocket = (userId: string, socket: Socket) => {
  socketRegistry.get(userId) &&
    (socketRegistry.get(userId)!.privateGroup = socket);
};

const setPublicGroupSocket = (userId: string, socket: Socket) => {
  socketRegistry.get(userId) &&
    socketRegistry.get(userId)!.publicGroups.push(socket);
};

const hasPublicGroupSocket = (userId: string, socket: Socket) => {
  return (
    socketRegistry.get(userId) &&
    socketRegistry
      .get(userId)!
      .publicGroups.some(
        (publicGroupSocket) => publicGroupSocket.id == socket.id
      )
  );
};

export const initAdminConnection = () => {
  // when connected to admin (/)
  io.on("connection", (socket) => adminConnectionListener(socket));
};

export const initGroupConnection = async () => {
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListenersRegistry.has(group.id)) {
      initGroupConnectionListeners(group);
      groupConnectionListenersRegistry.set(group.id, true);
    }
  });
};

const adminConnectionListener = async (socket: Socket) => {
  if (!adminConnectionListenersRegistry.has(socket.id)) {
    socket.on("findUser", (response) => findUserListener(socket, response));
    socket.on("disconnect", (disconnectReason) =>
      adminConnectionListenersRegistry.delete(socket.id)
    );

    adminConnectionListenersRegistry.set(socket.id, true);
  }

  emitGroupsList(socket);
};

const findUserListener = async (
  socket: Socket,
  { username }: { username: string }
) => {
  const user = await UserModel.findOne({ username: username }).lean();
  socket.emit("findUserResponse", { user: user });
};

const emitGroupsList = async (socket: Socket) => {
  const allGroupsWithRoomPopulated = await getAllWithPublicRoomsPopulated();
  const emptyPrivateGroup = await getEmptyPrivateGroup();

  const allUsers = await UserService.getAll();

  socket.emit("groupsList", {
    groups: [...allGroupsWithRoomPopulated, emptyPrivateGroup],
    users: allUsers,
  });
};
