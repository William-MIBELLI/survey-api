import User from "entities/user.entity";
import {
  DeleteResponse,
  MutationUpdateMeArgs,
  QueryUsersArgs,
  UserConnection,
} from "generated/graphql";
import {  composeResolvers } from "@graphql-tools/resolvers-composition";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { GraphQLError } from "graphql";
import UserEntity from "entities/user.entity";
import { UtcOffsetResolver } from "graphql-scalars";

const userResolver = {
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
    updateMe: async (
      _: any,
      { args }: MutationUpdateMeArgs,
      { services: { userService }, user }: MyContext,
    ): Promise<User> => {
      // const { id, ...rest } = args;
      return await userService.updateOne(user!,args);
    },
    deleteMe: async (
      _: any,
      __: any,
      { services: { userService }, user }: MyContext,
    ): Promise<DeleteResponse> => {
      const isDeleted = await userService.deleteOne(user!);
      const response: DeleteResponse = {
        success: isDeleted,
        Message: isDeleted ? "User successfully deleted." : "Deletion failed.",
      };
      return response;
    },
  },
};

const isAuthenticated = (): ResolverWrapper => next => (root, args, context, info) => {
  if (!context.user) {
    throw new GraphQLError("Please log in.")
  }
  return next(root, args, context, info)
}

// const isMyAccount= (): ResolverWrapper => next => (root, args, context, info) => {
//   if (args.id !== context?.user?.id) {
//     throw new GraphQLError("Unauthorized.")
//   }
//   return next(root, args, context, info)
// }

const userResolverWrapper = {
  "Mutation.*": [isAuthenticated()],
  "Query.*":[isAuthenticated()]
}

export default composeResolvers(userResolver, userResolverWrapper)
