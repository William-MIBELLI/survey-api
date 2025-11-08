import SurveyEntity from "entities/survey.entity";
import {
  DeleteResponse,
  MutationAssignCandidatesArgs,
  MutationCreateSurveyArgs,
  MutationUpdateSurveyArgs,
  QuerySurveysArgs,
  Survey,
  SurveyConnection,
  UserConnection,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";

const surveyResolver = {
  Query: {
    survey: async (
      _: any,
      { id }: { id: string },
      { services: { surveyService } }: MyContext,
    ): Promise<Survey | null> => {
      return await surveyService.findById(id);
    },
    surveys: async (
      _: any,
      data: QuerySurveysArgs,
      { services: { surveyService } }: MyContext,
    ): Promise<SurveyConnection> => {
      return await surveyService.findAll(data.args);
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
      return await surveyService.createOne({ ...data.args, ownerId: user.id });
    },
    updateSurvey: async (
      _: any,
      data: MutationUpdateSurveyArgs,
      { preload, services: { surveyService } }: MyContext<SurveyEntity>,
    ): Promise<Survey> => {
      if (!preload) {
        throw new GraphQLError("No survey preloaded.");
      }
      return surveyService.updateOne(preload.entity, data.args);
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
        ids: data.args.ids
      });
      return survey;
    },
    revokeCandidates: async () => {},
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
    // candidates: async (parent: SurveyEntity, args: any, ctx: MyContext): Promise<UserConnection> => {
    //   console.log("ARGS DANS CANDIDAT : ", args, parent)
    //   // const candidates = await ctx.services.
    //   return {}  as unknown as UserConnection
    // }
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
