import { AuthPayload, SigninInput, SignupInput } from "generated/graphql";
import { GraphQLError } from "graphql";
import UserService from "./user.service";
import jose from "jose";
import argon2 from "argon2";

export default class AuthService {

  public constructor(private userService: UserService) {}


  public async signup(args: SignupInput): Promise<AuthPayload> {
    const { password, confirmPassword } = args;
    if (password !== confirmPassword) {
      throw new GraphQLError("Passwords have to match.", {
        extensions: {
          code: "MISS_PASSWORD",
          field: "confirmPassword",
        },
      });
    }
    const createdUser = await this.userService.createOne(args);
    const jwt = await this.createJWT(createdUser.email, createdUser.isPremium);
    return {
      token: jwt,
      user: createdUser,
    };
  }

  public async signin(args: SigninInput): Promise<AuthPayload> {
    const error = new GraphQLError("Unable to login with this credentials.", {
      extensions: {
        code: "CREDENTIALS_ISSUES",
      },
    });

    const user = await this.userService.findUserForSignin(args)
    
 
    if (!user) {
      throw error;
    }
    const isValidPassword = await argon2.verify(user.password, args.password);

    if (!isValidPassword) {
      throw error;
    }
    const { email, isPremium } = user;
    const jwt = await this.createJWT(email, isPremium);
    return {
      user,
      token: jwt,
    };
  }

  protected async createJWT(email: string, isPremium: boolean): Promise<string> {
    const secret = new TextEncoder().encode(process.env.SECRET_JWT!);
    const token = await new jose.SignJWT({ email, isPremium })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);
    return token;
  }

  public async verifyJWT() {}
}
