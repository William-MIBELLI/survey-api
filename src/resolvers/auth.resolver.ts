import { AuthPayload, MutationSigninArgs, MutationSignupArgs } from "generated/graphql";
import { MyContext } from "index";
import AuthService from "services/auth.service";

const resolver = {
  Query: {},
  Mutation: {
    signup: async (
      _: any,
      { args }: MutationSignupArgs,
      { services: { authService } }: MyContext,
    ): Promise<AuthPayload> => {
      const payload = await authService.signup(args);
      return payload;
    },
    signin: async (
      _: any,
      { args }: MutationSigninArgs,
      { services: { authService } }: MyContext,
    ): Promise<AuthPayload> => {
      const payload = await authService.signin(args);
      return payload;
    },
  },
};

export default resolver;
