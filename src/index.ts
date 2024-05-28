import mongoose from "mongoose";
import { httpServer } from "./core/share/expressServer";
import { initAdminConnection } from "./core/ws/adminConnection";

initAdminConnection();

const mongodbURL =
  "mongodb+srv://lucaschiwang:FyJjKUC5DtLmYqnZ@cluster0.mios5r0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(mongodbURL).then((_) => {
  httpServer.listen(3000, "0.0.0.0");
});
