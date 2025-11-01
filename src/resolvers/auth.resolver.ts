import Cookies from "cookies";
import {
  DeleteResponse,
  MutationSigninArgs,
  MutationSignupArgs,
  User,
} from "generated/graphql";
import { MyContext } from "index";

const resolver = {
  Query: {},
  Mutation: {
    signup: async (
      _: any,
      { args }: MutationSignupArgs,
      { services: { authService }, req, res }: MyContext,
    ): Promise<User> => {
      const payload = await authService.signup(args);
      new Cookies(req, res).set("token", payload.token, { httpOnly: true });
      return payload.user;
    },
    signin: async (
      _: any,
      { args }: MutationSigninArgs,
      { services: { authService }, req, res }: MyContext,
    ): Promise<User> => {
      const payload = await authService.signin(args);
      new Cookies(req, res).set("token", payload.token, { httpOnly: true });
      return payload.user;
    },

    signout: async (
      _: any,
      args: any,
      { req, res }: MyContext,
    ): Promise<DeleteResponse> => {
      new Cookies(req, res).set("token", null);
      return {
        Message: "You've been successfully logged out.",
        success: true,
      };
    },
  },
};

export default resolver;
