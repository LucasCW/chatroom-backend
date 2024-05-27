import { GroupModel, IGroup } from "../data/group";

export const getAll = async () => {
  const groups = await GroupModel.find();
  return groups;
};

export const getAllWithRoomsPopulated = async () => {
  const groups = await GroupModel.find().populate("rooms");
  return groups;
};
