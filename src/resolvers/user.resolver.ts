import User from "entities/user.entity";
import {
  AnswersFilterInput,
  DeleteResponse,
  MutationUpdateMeArgs,
  QueryUsersArgs,
  SurveyFilterInput,
  UserConnection,
} from "generated/graphql";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { GraphQLError } from "graphql";
import UserEntity from "entities/user.entity";
import { UtcOffsetResolver } from "graphql-scalars";
import { appDataSource } from "lib/datasource";
import SurveyEntity from "entities/survey.entity";
import AnswerEntity from "entities/answer.entity";
import { TConnection } from "interfaces/generic.interface";

const userResolver = {
  Query: {
    user: async (
      _: any,
      { id }: { id: string },
      { services: { userService } }: MyContext,
    ) => {
      return await userService.findById(id);
    },
    users: async (
      _: any,
      { args }: QueryUsersArgs,
      { services: { userService } }: MyContext,
    ): Promise<TConnection<User>> => {
      const { filters, pagination } = args;
      return await userService.findAll({ ...filters, pagination });
    },
  },
  Mutation: {
    updateMe: async (
      _: any,
      { args }: MutationUpdateMeArgs,
      { services: { userService }, user }: MyContext,
    ): Promise<User> => {
      // const { id, ...rest } = args;
      return await userService.updateOne(user!, args);
    },
    deleteMe: async (
      _: any,
      __: any,
      { services: { userService }, user }: MyContext,
    ): Promise<DeleteResponse> => {
      const isDeleted = await userService.deleteOne(user!);
      const response: DeleteResponse = {
        success: isDeleted,
        Message: isDeleted ? "User successfully deleted." : "Deletion failed.",
      };
      return response;
    },
  },
  User: {
    surveys: async (
      parent: UserEntity,
      data: SurveyFilterInput,
      { services: { surveyService } }: MyContext,
    ) => {
      const query = appDataSource
        .getRepository(SurveyEntity)
        .createQueryBuilder("survey")
        .innerJoin("user.surveys", "survey", "survey.ownerId = :userId", {
          userId: parent.id,
        });
      return await surveyService.findAll(data, query);
    },
    assignedSurveys: async (
      parent: UserEntity,
      data: SurveyFilterInput,
      { services: { surveyService } }: MyContext,
    ) => {
      const query = appDataSource
        .getRepository(SurveyEntity)
        .createQueryBuilder("survey")
        .innerJoin("user.assignedSurveys", "survey", "survey.candidates = :candidateId", {
          candidateId: parent.id,
        });
      return await surveyService.findAll(data, query);
    },
    answers: async (
      parent: UserEntity,
      data: AnswersFilterInput,
      { services: { answerService } }: MyContext,
    ) => {
      const query = appDataSource
        .getRepository(AnswerEntity)
        .createQueryBuilder("answer")
        .innerJoin("user.answers", "answer", "answer.userId :userId", {
          userId: parent.id,
        });
      return await answerService.findAll(data, query)
    },
  },
};

const isAuthenticated = (): ResolverWrapper => (next) => (root, args, context, info) => {
  if (!context.user) {
    throw new GraphQLError("Please log in.");
  }
  return next(root, args, context, info);
};

// const isMyAccount= (): ResolverWrapper => next => (root, args, context, info) => {
//   if (args.id !== context?.user?.id) {
//     throw new GraphQLError("Unauthorized.")
//   }
//   return next(root, args, context, info)
// }

const userResolverWrapper = {
  "Mutation.*": [isAuthenticated()],
  "Query.*": [isAuthenticated()],
};

export default composeResolvers(userResolver, userResolverWrapper);
