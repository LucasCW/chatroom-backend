import { Server } from "socket.io";
import { httpServer } from "./expressServer";

export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:4200",
  },
});
