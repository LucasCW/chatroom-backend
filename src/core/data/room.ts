import { Model, Schema, Types, model } from "mongoose";

enum RoomType {
  Private = "PRIVATE",
  Public = "PUBLIC",
}
export interface IRoom {
  users: Types.ObjectId[];
  name: string;
  roomType: string;
}

interface IRoomModel extends Model<IRoom> {}

const IRoomSchema = new Schema<IRoom, IRoomModel>({
  users: {
    type: [Schema.Types.ObjectId],
    ref: "user",
    required: true,
    default: [],
  },
  name: {
    type: String,
    required: true,
  },
  roomType: {
    type: String,
    enum: Object.values(RoomType),
    default: RoomType.Public,
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
