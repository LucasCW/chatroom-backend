import { UserModel } from "../data/user";

export const getAll = async () => {
  const users = await UserModel.find().lean();
  return users;
};
