import User from "entities/user.entity";
import GenericService from "./generic.service";
import GenericQueryBuilder from "builders/generic.builder";
import UserEntity from "entities/user.entity";
import { DeepPartial, Not, Repository, In, ArrayContainedBy, ArrayContains } from "typeorm";
import { SigninInput, SignupInput } from "generated/graphql";

export default class UserService extends GenericService<UserEntity> {
  // private static userService: UserService | null = null

  public constructor(
    repo: Repository<UserEntity>,
    filterBuilder: GenericQueryBuilder<UserEntity>,
  ) {
    super(repo, filterBuilder);
  }

  public async findUserForSignin(args: SigninInput): Promise<UserEntity | null> {
    const user = await this.repo
      .createQueryBuilder("user")
      .where("user.email = :email", { email: args.email })
      .addSelect("user.password")
      .getOne();

    return user;
  }

  public async createUserForSeeding(users: DeepPartial<UserEntity>[]) {
    await this.repo.save(users, { chunk: 500});
  }

  public async findUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.repo.findOne({ where: {email} })
  }
}
