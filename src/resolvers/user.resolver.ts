import UserService from "services/user.service"

const userService = UserService.getInstance()

export default {
  Query: {
    user: async (_: any, { id }: { id: string }) => {
      return await userService.findById(id)
    },
    users: async () => {
      console.log("RESOLVER")
      return await userService.findAll()
    }
  },

}