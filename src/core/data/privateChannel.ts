import { Document, Model, Schema, Types, model } from "mongoose";

export interface IPrivateChannel extends Document<Types.ObjectId> {
  users: Types.ObjectId[];
}

interface IPrivateChannelModel extends Model<IPrivateChannel> {}

const IPrivateChannelSchema = new Schema<IPrivateChannel, IPrivateChannelModel>(
  {
    users: {
      type: [Schema.Types.ObjectId],
      ref: "user",
      required: true,
      default: [],
    },
  }
);

export const PrivateChannelModel = model(
  "privateChannel",
  IPrivateChannelSchema
);

export const createPrivateChannel = (userIds: string[]) => {
  const privateChannel = new PrivateChannelModel({
    users: userIds.map((id) => new Types.ObjectId(id)),
  });

  return privateChannel.save();
};
