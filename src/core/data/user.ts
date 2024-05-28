import { Document, Model, Schema, Types, model } from "mongoose";

export interface IUser extends Document<Types.ObjectId> {
  username: string;
}

interface IUserModel extends Model<IUser> {}

const IUserSchema = new Schema<IUser, IUserModel>({
  username: {
    type: String,
    required: true,
  },
});

export const UserModel = model("user", IUserSchema);

export const createUser = async (username: string) => {
  const user = new UserModel({
    username: username,
  });

  user.save().then((res) => console.log("Create Group: ", res));
};
