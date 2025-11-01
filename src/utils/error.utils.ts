import { GraphQLFormattedError } from "graphql";


export const formatError = (error: GraphQLFormattedError) => {
  switch (error.extensions?.code) {
    case "BAD_USER_INPUT":
      return { ...error, message: "PLEASE CHECK YOUR INPUTS : " + error?.message }
    default:
      return error
      
  }
}

