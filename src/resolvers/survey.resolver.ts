import SurveyEntity from "entities/survey.entity";
import {
  DeleteResponse,
  MutationAssignCandidatesArgs,
  MutationCreateSurveyArgs,
  MutationRevokeCandidatesArgs,
  MutationUpdateSurveyArgs,
  QuerySurveysArgs,
  Survey,
  SurveyConnection,
  UserConnection,
  UserFilter,
  UserFilterInput,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { QueryBuilder } from "typeorm";
import UserEntity from "entities/user.entity";
import { appDataSource } from "lib/datasource";

const surveyResolver = {
  Query: {
    survey: async (
      _: any,
      { id }: { id: string },
      { services: { surveyService } }: MyContext,
    ): Promise<Survey | null> => {
      return (await surveyService.findById(id)) as unknown as Survey;
    },
    surveys: async (
      _: any,
      data: QuerySurveysArgs,
      { services: { surveyService } }: MyContext,
    ): Promise<SurveyConnection> => {
      return (await surveyService.findAll(data.args)) as unknown as SurveyConnection;
    },
  },
  Mutation: {
    createSurvey: async (
      _: any,
      data: MutationCreateSurveyArgs,
      { services: { surveyService }, user }: MyContext,
    ): Promise<Survey> => {
      if (!user) {
        throw new GraphQLError("You need to be logged in for create a survey.", {
          extensions: {
            code: "AUTH_ISSUE",
          },
        });
      }
      return (await surveyService.createOne({
        ...data.args,
        ownerId: user.id,
      })) as unknown as Survey;
    },
    updateSurvey: async (
      _: any,
      data: MutationUpdateSurveyArgs,
      { preload, services: { surveyService } }: MyContext<SurveyEntity>,
    ): Promise<Survey> => {
      if (!preload) {
        throw new GraphQLError("No survey preloaded.");
      }
      return surveyService.updateOne(preload.entity, data.args) as unknown as Survey;
    },
    deleteSurvey: async (
      _: any,
      { id }: { id: string },
      { services: { surveyService }, preload }: MyContext<SurveyEntity>,
    ): Promise<DeleteResponse> => {
      if (!preload) {
        throw new GraphQLError("Unable to delete survey.");
      }
      const isDeleted = await surveyService.deleteOne(preload.entity);
      return {
        success: isDeleted,
        Message: isDeleted ? "Successfully deleted." : "Impossible to delete.",
      };
    },
    assignCandidates: async (
      _: any,
      data: MutationAssignCandidatesArgs,
      { services: { surveyService, userService }, preload }: MyContext<SurveyEntity>,
    ) => {
      if (!preload) {
        throw new GraphQLError("No survey preloaded.");
      }

      const survey = await surveyService.assignCandidates({
        survey: preload.entity,
        ids: data.args.ids,
      });
      return survey;
    },
    revokeCandidates: async (
      _: any,
      data: MutationRevokeCandidatesArgs,
      { services: { surveyService }, preload }: MyContext<SurveyEntity>,
    ) => {
      const survey = await surveyService.revokeCandidates({
        survey: preload?.entity!,
        ids: data.args.ids,
      });
      return survey;
    },
  },
  Survey: {
    owner: async (
      parent: SurveyEntity,
      _: any,
      { services: { userService } }: MyContext,
    ) => {
      const user = await userService.findById(parent.ownerId);
      if (!user) {
        throw new GraphQLError("Unable to find the owner of this survey.");
      }
      return user;
    },
    candidates: async (
      parent: SurveyEntity,
      args: UserFilterInput,
      { services: { userService } }: MyContext,
    ): Promise<UserConnection> => {
      const query = appDataSource
        .getRepository(UserEntity)
        .createQueryBuilder("user")
        .innerJoin("user.assignedSurveys", "survey", "survey.id = :surveyId", {
          surveyId: parent.id,
        });
      const candidates = await userService.findAll(args, query);
      return candidates;
    },
  },
};

const isSurveyFromUser =
  (): ResolverWrapper => (next) => async (root, args, context, info) => {
    const survey = await context.services.surveyService.findById(args.id);
    if (!survey || !context.user || survey.ownerId !== context.user.id) {
      throw new GraphQLError("Forbidden.");
    }
    return next(root, args, { ...context, preload: { entity: survey } }, info);
  };

const compositionResolver = {
  "Mutation.!createSurvey": [isSurveyFromUser()],
};

export default composeResolvers(surveyResolver, compositionResolver);
