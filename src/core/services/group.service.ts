import { GroupModel } from "../data/group";

export const getAll = async () => {
  const groups = await GroupModel.find();
  console.log("getting all groups", groups);
  return groups;
};
