import SurveyEntity from "entities/survey.entity";
import {
  MutationCreateSurveyArgs,
  QuerySurveysArgs,
  Survey,
  SurveyConnection,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { MyContext } from "index";

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
            code: "AUTH_ISSUE"
          }
        })
      }
      return await surveyService.createOne({...data.args, ownerId: user.id});
    },
    updateSurvey: async () => {

    },
    deleteSurvey: async (_: any, { id }:{ id: string }, { services: { surveyService }, user }: MyContext) => {
      
    }
  },
  Survey: {
    owner: async (parent: SurveyEntity, _: any, { services: { userService } }: MyContext) => {
      const user = await userService.findById(parent.ownerId);
      if (!user) {
        throw new GraphQLError('Unable to find the owner of this survey.')
      }
      return user
    },
  },
};

export default surveyResolver;
