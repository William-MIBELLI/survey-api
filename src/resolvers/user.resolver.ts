import User from "entities/user.entity";
import {
  DeleteResponse,
  MutationUpdateUserArgs,
  QueryUsersArgs,
  UserConnection,
} from "generated/graphql";
import { MyContext } from "index";

export default {
  Query: {
    user: async (
      _: any,
      { id }: { id: string },
      { services: { userService } }: MyContext,
    ) => {
      return await userService.findById(id);
    },
    users: async (
      _: any,
      { args }: QueryUsersArgs,
      { services: { userService } }: MyContext,
    ): Promise<UserConnection> => {
      const { filters, pagination } = args;
      return await userService.findAll({ ...filters, pagination });
    },
  },
  Mutation: {
    updateUser: async (
      _: any,
      { args }: MutationUpdateUserArgs,
      { services: { userService } }: MyContext,
    ): Promise<User> => {
      const { id, ...rest } = args;
      return await userService.updateOne(id, rest);
    },
    deleteUser: async (
      _: any,
      { id }: { id: string },
      { services: { userService } }: MyContext,
    ): Promise<DeleteResponse> => {
      const isDeleted = await userService.deleteOne(id);
      const response: DeleteResponse = {
        success: isDeleted,
        Message: isDeleted ? "User successfully deleted." : "Deletion failed.",
      };
      return response;
    },
  },
};
