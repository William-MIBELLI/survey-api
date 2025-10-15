import User from "entities/user.entity";
import { CreateUserInput, DeleteResponse, MutationCreateUserArgs, MutationUpdateUserArgs, QueryUsersArgs, UpdateUserInput, UserConnection } from "generated/graphql";
import { GraphQLError } from "graphql";
import UserService from "services/user.service";

const userService = UserService.getInstance();

export default {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      return await userService.findById(id);
    },
    users: async (_: any, { pagination }: QueryUsersArgs): Promise<UserConnection> => {
      return await userService.findAll(pagination);
    },
  },
  Mutation: {
    createUser: async (_: any, { args }: MutationCreateUserArgs): Promise<User> => {
      const user = await userService.createOne(args)
      return user
    },
    updateUser: async (_: any, { args }: MutationUpdateUserArgs): Promise<User> => {
      const {id, ...rest } = args
      return await userService.updateOne(id, rest)
    },
    deleteUser: async (_: any, { id }: { id: string }): Promise<DeleteResponse> => {
      const isDeleted = await userService.deleteOne(id)
      const response: DeleteResponse = {
        success: isDeleted,
        Message: isDeleted ? "User successfully deleted." : "Deletion failed."
      }
      return response
    }
  }
};
