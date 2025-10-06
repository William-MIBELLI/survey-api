import User from "entities/user.entity";
import GenericService from "./generic.service";


export default class UserService extends GenericService<User> {

  private static userService: UserService | null = null

  private constructor() {
    super(User)
  }

  public static getInstance() {
    if (!this.userService) {
      this.userService = new UserService()
    }
    return this.userService
  }

}