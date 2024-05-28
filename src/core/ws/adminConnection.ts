import { Socket } from "socket.io";
import { getAll, getAllWithRoomsPopulated } from "../services/group.service";
import { io } from "../share/wsServer";
import { initGroupConnectionListeners } from "./groupConnection";
import { UserModel } from "../data/user";

const groupConnectionListenersRegistry = new Map<string, boolean>();
const adminConnectionListenersRegistry = new Map<string, boolean>();

export const initAdminConnection = () => {
  // when connected to admin (/)
  io.on("connection", (socket) => adminConnectionListener(socket));
};

const adminConnectionListener = async (socket: Socket) => {
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListenersRegistry.has(group.id)) {
      initGroupConnectionListeners(group);
      groupConnectionListenersRegistry.set(group.id, true);
    }
  });
  if (!adminConnectionListenersRegistry.has(socket.id)) {
    socket.on("findUser", (response) => findUserListener(socket, response));
    adminConnectionListenersRegistry.set(socket.id, true);
  }

  emitGroupsList();
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
  io.emit("groupsList", { groups: allGroupsWithRoomPopulated });
};
