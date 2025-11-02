import { ResetPasswordInput, SigninInput, SignupInput, User } from "generated/graphql";
import { GraphQLError } from "graphql";
import UserService from "./user.service";
import jose from "jose";
import argon2 from "argon2";
import crypto from "crypto";
import { Repository } from "typeorm";
import TokenEntity, { EToken } from "entities/token.entity";
import MailService from "./mail.service";

type AuthPayload = {
  token: string;
  user: User;
};

export default class AuthService {
  public constructor(
    private userService: UserService,
    private tokenRepo: Repository<TokenEntity>,
    private mailService: MailService,
  ) {}

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
    const jwt = await this.createJWT(createdUser.id);
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

    const user = await this.userService.findUserForSignin(args);

    if (!user) {
      throw error;
    }
    const isValidPassword = await argon2.verify(user.password, args.password);

    if (!isValidPassword) {
      throw error;
    }
    const { id } = user;
    const jwt = await this.createJWT(id);
    return {
      user,
      token: jwt,
    };
  }

  protected async createJWT(id: string): Promise<string> {
    const secret = new TextEncoder().encode(process.env.SECRET_JWT!);
    const token = await new jose.SignJWT({ id })
      .setProtectedHeader({ alg: "HS256", typ: "jwt" })
      .setExpirationTime("1d")
      .sign(secret);
    return token;
  }

  public async verifyJWTValidity(token: string): Promise<User | null> {
    const secret = new TextEncoder().encode(process.env.SECRET_JWT!);
    try {
      const verify = await jose.jwtVerify<{ id: string }>(token, secret, {});
      const user = await this.userService.findById(verify.payload.id);
      return user;
    } catch (error: any) {
      console.log("ERROR WHILE DECODING JWT : ", error?.message);
      return null;
    }
  }

  public async askResetPassword(email: string): Promise<boolean> {
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      return false;
    }
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiration = Date.now() + 15 * 60 * 1000;
    const hashedResetToken = await argon2.hash(resetToken, { type: argon2.argon2id });

    const entity = new TokenEntity();
    entity.token = hashedResetToken;
    entity.type = EToken.RESET_PASSWORD;
    entity.userId = user.id;
    entity.expiration = new Date(expiration);

    const created = await this.tokenRepo.save(entity);

    if (!created) {
      return false;
    }

    try {
      await this.mailService.sendResetPasswordEmail({
        email: user.email,
        token: resetToken,
      });
    } catch (error) {
      await this.tokenRepo.delete({ id: created.id });
      throw error;
    }

    return true;
  }

  public async resetPassword(args: ResetPasswordInput): Promise<AuthPayload> {
    const error: Error = new Error("Unable to reset password.");

    if (args.newPassword !== args.confirmNewPassword) {
      throw new Error("Password have to match.");
    }

    const entityToken = await this.tokenRepo.findOne({
      where: {
        user: {
          email: args.email,
        },
        type: EToken.RESET_PASSWORD,
      },
      relations: {
        user: true,
      },
    });
    if (!entityToken) {
      throw error;
    }
    if (Date.now() > entityToken.expiration.getTime()) {
      await this.tokenRepo.delete({ id: entityToken.id });

      throw error;
    }

    const isValid = await argon2.verify(entityToken.token, args.token);
    if (!isValid) {
      throw error;
    }

    const hashedPassword = await argon2.hash(args.newPassword, {
      type: argon2.argon2id,
    });
    await this.userService.updateOne(entityToken.userId, { password: hashedPassword });

    await this.tokenRepo.delete({ id: entityToken.id });

    const payload = await this.signin({ email: args.email, password: args.newPassword });

    return payload;
  }
}
