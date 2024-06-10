import { Model, Schema, Types, model } from "mongoose";
import { GroupModel, GroupType } from "./group";

export enum RoomType {
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

export const createRoom = (name: string) => {
  const room = new RoomModel({
    name: name,
  });
  return room.save();
};

export const createPrivateChannel = async (userIds: string[]) => {
  const privateChannel = new RoomModel({
    roomType: RoomType.Private,
    users: userIds.map((id) => new Types.ObjectId(id)),
    name: "Temporary name",
  });

  const privateGroup = await GroupModel.findOne({
    type: GroupType.Private,
  });

  privateGroup?.rooms.push(privateChannel._id);

  await privateGroup!.save();

  return privateChannel.save();
};
