import { QueryUsersArgs, UserConnection } from "generated/graphql";
import { GraphQLError } from "graphql";
import UserService from "services/user.service";

const userService = UserService.getInstance();

export default {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      return await userService.findById(id);
    },
    users: async (_: any, { pagination }: QueryUsersArgs): Promise<UserConnection> => {

      // const{ first } = pagination

      // if (first && first < 0) throw new GraphQLError("First can't be negative.", {});

      const list = await userService.findAll(pagination)
      return list
    },
  },
};
