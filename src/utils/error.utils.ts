import { GraphQLFormattedError } from "graphql";

export type ConstraintDirectiveError = {
  code: string;
  fieldsName: string;
  context: {
    arg: string;
    value: string;
  }[]
}

export const formatError = (error: GraphQLFormattedError) => {
  switch (error.extensions?.code) {
    case "BAD_USER_INPUT":
      return { ...error, message: "Please check your inputs" }
    default:
      return error
      
  }
}

