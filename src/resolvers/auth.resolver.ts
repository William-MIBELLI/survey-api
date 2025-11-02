import Cookies from "cookies";
import {
  DeleteResponse,
  GenericResponse,
  MutationResetPasswordArgs,
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
    resetPassword: async (_: any, args: MutationResetPasswordArgs) => {},
    askResetPassword: async (
      _: any,
      { email }: { email: string },
      { services: { authService } }: MyContext,
    ): Promise<GenericResponse> => {
      const response: GenericResponse = {
        success: true,
        message: "If an address email match, an email was emited with resfresh link."
      }
      const resetToken = await authService.askResetPassword(email)
      if (!resetToken) {
        return response
      }
      //ICI JENVERRAI UN EMAIL DEPUIS UN EmailService, AFIN DE BIEN SEPARER LES LOGIQUES ?
      return response
      
    },
  },
};

export default resolver;
