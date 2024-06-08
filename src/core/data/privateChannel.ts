import { Document, Model, Schema, Types, model } from "mongoose";

export interface IPrivateChannel extends Document<Types.ObjectId> {
  users: Types.ObjectId[];
  name: string;
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
    name: {
      type: String,
    },
  }
);

IPrivateChannelSchema.pre("save", function (next) {
  this.name = this._id.toString();
  next();
});

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
