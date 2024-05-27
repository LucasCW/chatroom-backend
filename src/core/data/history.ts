import { Model, Schema, Types, model } from "mongoose";

interface IHistory {
  message: string;
  group: Types.ObjectId;
  time: Date;
  room: Types.ObjectId;
  username: string;
}

interface IHistoryModel extends Model<IHistory> {}

const IHistorySchema = new Schema<IHistory, IHistoryModel>({
  message: {
    type: String,
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "group",
  },
  time: {
    type: Date,
    required: true,
  },
  room: {
    type: Schema.Types.ObjectId,
    ref: "room",
  },
  username: {
    type: String,
    required: true,
  },
});

export const HistoryModel = model("history", IHistorySchema);

export const saveHistory = (
  message: string,
  group: Types.ObjectId,
  time: Date,
  room: Types.ObjectId,
  username: string
) => {
  const history = new HistoryModel({ message, group, time, room, username });
  return history.save();
};
