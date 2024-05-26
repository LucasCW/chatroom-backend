import { Model, Schema, model } from "mongoose";

interface IRoom {
  name: string;
  path: string;
}

interface IRoomModel extends Model<IRoom> {}

const IRoomSchema = new Schema<IRoom, IRoomModel>({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
    unique: true,
  },
});

interface IGroup {
  name: string;
  path: string;
  rooms: IRoom[];
}

interface IGroupModel extends Model<IGroup> {}

const IGroupSchema = new Schema<IGroup, IGroupModel>({
  name: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
    unique: true,
  },
  rooms: {
    type: [IRoomSchema],
    required: true,
    default: [],
  },
});

export const GroupModel = model("group", IGroupSchema);

export const createGroup = () => {
  const group = new GroupModel({
    name: "Group 2",
    path: "group2",
    rooms: [
      { name: "Room 1", path: "room1" },
      { name: "Room 2", path: "room2" },
    ],
  });

  group.save().then((res) => console.log("Create Group: ", res));
};
