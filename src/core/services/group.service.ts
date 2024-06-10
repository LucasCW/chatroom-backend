import { GroupModel, GroupType } from "../data/group";

export const getAll = async () => {
  const groups = await GroupModel.find();
  return groups;
};

export const getAllWithRoomsPopulated = async () => {
  return await GroupModel.find({ type: GroupType.Public }).populate("rooms");
};
