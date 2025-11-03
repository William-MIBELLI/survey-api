import Cookies from "cookies";
import {
  DeleteResponse,
  GenericResponse,
  MutationResetPasswordArgs,
  MutationSigninArgs,
  MutationSignupArgs,
  User,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { MyContext } from "interfaces/graphql.interface";


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
    resetPassword: async (
      _: any,
      data: MutationResetPasswordArgs,
      { services: { authService }, req, res }: MyContext,
    ): Promise<User> => {
      try {
        const payload = await authService.resetPassword(data.args);
        new Cookies(req, res).set("token", payload.token, { httpOnly: true });

        return payload.user;
      } catch (error: any) {
        throw new GraphQLError(error?.message);
      }
    },
    askResetPassword: async (
      _: any,
      { email }: { email: string },
      { services: { authService } }: MyContext,
    ): Promise<GenericResponse> => {
      try {
        const res = await authService.askResetPassword(email);

        if (!res) {
          console.error("Asking reset password process failed.");
        }
      } catch (error: any) {
        console.error("Error during reset token password creation : ", error?.message);
      }

      return {
        success: true,
        message: "If an address email match, an email was emited with resfresh link.",
      };
    },
  },
};

export default resolver;
