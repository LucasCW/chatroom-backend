import { Model, Schema, Types, model, Document } from "mongoose";
import { createRoom } from "./room";

export enum GroupType {
  Private = "PRIVATE",
  Public = "PUBLIC",
}

export interface IGroup extends Document<Types.ObjectId> {
  name: string;
  rooms: Types.ObjectId[];
  type: GroupType;
}

interface IGroupModel extends Model<IGroup> {}

const IGroupSchema = new Schema<IGroup, IGroupModel>({
  name: {
    type: String,
    required: true,
  },
  rooms: {
    type: [Schema.Types.ObjectId],
    ref: "room",
    required: true,
    default: [],
  },
  type: {
    type: String,
    enum: Object.values(GroupType),
    default: GroupType.Public,
    required: true,
  },
});

export const GroupModel = model("group", IGroupSchema);

export const createGroup = async (groupName: string) => {
  const room1 = await createRoom(groupName + " Room 1");
  const room2 = await createRoom(groupName + " Room 2");

  const group = new GroupModel({
    name: groupName,
    rooms: [room1._id, room2._id],
  });

  group.save().then((res) => console.log("Create Group: ", res));
};
