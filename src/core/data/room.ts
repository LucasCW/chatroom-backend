import { Model, Schema, Types, model } from "mongoose";

export interface IRoom {
  name: string;
}

interface IRoomModel extends Model<IRoom> {}

const IRoomSchema = new Schema<IRoom, IRoomModel>({
  name: {
    type: String,
    required: true,
  },
});

export const RoomModel = model("room", IRoomSchema);

export const createRoom = (name: string, path: string) => {
  const room = new RoomModel({
    name: name,
    path: path,
  });
  return room.save();
};
