import User from "entities/user.entity";
import GenericService from "./generic.service";
import GenericQueryBuilder from "builders/generic.builder";
import UserEntity from "entities/user.entity";
import UserQueryBuilder from "builders/user.builder";


export default class UserService extends GenericService<User> {

  private static userService: UserService | null = null
  protected filterBuilder: GenericQueryBuilder<UserEntity>

  private constructor() {
    super(User)
    this.filterBuilder = new UserQueryBuilder()
  }

  public static getInstance() {
    if (!this.userService) {
      this.userService = new UserService()
    }
    return this.userService
  }

}