import { Server } from "socket.io";
import { httpServer } from "./expressServer";

export const io = new Server(httpServer, {
  cors: {
    origin: "http://192.168.1.33:4200",
  },
});
