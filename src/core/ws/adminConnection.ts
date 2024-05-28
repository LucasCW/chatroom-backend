import { Socket } from "socket.io";
import { getAll, getAllWithRoomsPopulated } from "../services/group.service";
import { io } from "../share/wsServer";
import { initGroupConnectionListeners } from "./groupConnection";

const groupConnectionListenersRegistry = new Map<string, boolean>();

export const initAdminConnection = () => {
  // when connected to admin (/)
  io.on("connection", (socket) => adminConnectionListener(socket));
};

const adminConnectionListener = async (_: Socket) => {
  const allGroups = await getAll();
  allGroups.forEach((group) => {
    if (!groupConnectionListenersRegistry.has(group.id)) {
      initGroupConnectionListeners(group);
      groupConnectionListenersRegistry.set(group.id, true);
    }
  });

  emitGroupsList();
};

const emitGroupsList = async () => {
  const allGroupsWithRoomPopulated = await getAllWithRoomsPopulated();
  io.emit("groupsList", { groups: allGroupsWithRoomPopulated });
};
