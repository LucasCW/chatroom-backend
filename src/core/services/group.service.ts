import { GroupModel, GroupType } from "../data/group";

export const getAll = async () => {
  const groups = await GroupModel.find();
  return groups;
};

export const getAllWithRoomsPopulated = async () => {
  return await GroupModel.find({ type: GroupType.Public }).populate("rooms");
};

export const getEmptyPrivateGroup = async () => {
  const privateGroup = await getPrivateGroup();
  privateGroup!.rooms = [];
  return privateGroup;
};

export const getPrivateGroup = async () => {
  const privateGroup = await GroupModel.findOne({ type: GroupType.Private });
  return privateGroup;
};
