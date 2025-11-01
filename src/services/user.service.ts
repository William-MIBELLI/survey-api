import User from "entities/user.entity";
import GenericService from "./generic.service";
import GenericQueryBuilder from "builders/generic.builder";
import UserEntity from "entities/user.entity";
import { Repository } from "typeorm";
import { SigninInput, SignupInput } from "generated/graphql";

export default class UserService extends GenericService<UserEntity> {
  // private static userService: UserService | null = null

  public constructor(
    repo: Repository<UserEntity>,
    filterBuilder: GenericQueryBuilder<UserEntity>,
  ) {
    super(repo, filterBuilder);
  }

  public async findUserForSignin(args: SigninInput): Promise<User | null> {
    const user = await this.repo
      .createQueryBuilder("user")
      .where("user.email = :email", { email: args.email })
      .addSelect("user.password")
      .getOne();

    return user;
  }

  public async createUserForSeeding(users: SignupInput[]) {
    await this.repo.save(users, { chunk: 500});
  }
}
