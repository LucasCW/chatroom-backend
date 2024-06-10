import bodyParser from "body-parser";
import express from "express";
import { createServer } from "http";

export const app = express();
app.use(bodyParser.json());

export const httpServer = createServer(app);

// app.get("/update", (req, res) => {
//   updateRooms();
//   res.send({ message: "Updated DB" });
// });
