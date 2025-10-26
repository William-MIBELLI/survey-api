import User from "entities/user.entity";
import {
  DeleteResponse,
  MutationCreateUserArgs,
  MutationUpdateUserArgs,
  QueryUserByPropertiesArgs,
  QueryUsersArgs,
  UpdateUserInput,
  UserConnection,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import UserService from "services/user.service";

export default {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      return await UserService.getInstance().findById(id);
    },
    users: async (_: any, { pagination }: QueryUsersArgs): Promise<UserConnection> => {
      return await UserService.getInstance().findAll(pagination);
    },
    userByProperties: async (_: any, { args }: QueryUserByPropertiesArgs): Promise<User[]> => {
      const users = await UserService.getInstance().findByProperties(args);
      return users;
    },
  },
  Mutation: {
    createUser: async (_: any, { args }: MutationCreateUserArgs): Promise<User> => {
      const { password, confirmPassword } = args;
      if (password !== confirmPassword) {
        throw new GraphQLError("Passwords have to match.", {
          extensions: {
            code: "MISS_PASSWORD",
            field: "confirmPassword",
          },
        });
      }
      const user = await UserService.getInstance().createOne(args);
      return user;
    },
    updateUser: async (_: any, { args }: MutationUpdateUserArgs): Promise<User> => {
      const { id, ...rest } = args;
      return await UserService.getInstance().updateOne(id, rest);
    },
    deleteUser: async (_: any, { id }: { id: string }): Promise<DeleteResponse> => {
      const isDeleted = await UserService.getInstance().deleteOne(id);
      const response: DeleteResponse = {
        success: isDeleted,
        Message: isDeleted ? "User successfully deleted." : "Deletion failed.",
      };
      return response;
    },
  },
};
