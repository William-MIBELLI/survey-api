import QuestionEntity from "entities/question.entity";
import {
  DeleteResponse,
  MutationCreateQuestionArgs,
  MutationUpdateQuestionArgs,
  QueryQuestionsArgs,
} from "generated/graphql";
import { TConnection } from "interfaces/generic.interface";
import { MyContext } from "interfaces/graphql.interface";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { isSurveyFromUser } from "./survey.resolver";
import SurveyEntity from "entities/survey.entity";
import { GraphQLError } from "graphql";

const questionResolver = {
  Query: {
    question: async (
      _: any,
      { id }: { id: string },
      { services: { questionService } }: MyContext,
    ): Promise<QuestionEntity | null> => {
      return await questionService.findById(id);
    },
    questions: async (
      _: any,
      data: QueryQuestionsArgs,
      { services: { questionService } }: MyContext,
    ): Promise<TConnection<QuestionEntity>> => {
      return await questionService.findAll(data.args);
    },
  },
  Mutation: {
    createQuestion: async (
      _: any,
      data: MutationCreateQuestionArgs,
      { services: { questionService } }: MyContext,
    ): Promise<QuestionEntity> => {
      return await questionService.createOne(data.args);
    },
    updateQuestion: async (
      _: any,
      data: MutationUpdateQuestionArgs,
      { services: { questionService }, preload }: MyContext<QuestionEntity>,
    ): Promise<QuestionEntity> => {
      return await questionService.updateOne(preload?.entity!, data.args);
    },
    deleteQuestion: async (
      _: any,
      { id }: { id: string },
      { services: { questionService }, preload }: MyContext<QuestionEntity>,
    ): Promise<DeleteResponse> => {
      const isDeleted = await questionService.deleteOne(preload?.entity!);
      return {
        success: isDeleted,
        Message: isDeleted
          ? "Question successfully deleted."
          : "Unable to delete the question.",
      };
    },
  },
  Question: {
    survey: async (
      parent: QuestionEntity,
      _: any,
      { services: { surveyService }}: MyContext,
    ): Promise<SurveyEntity> => {
      const survey = await surveyService.findById(parent.surveyId)
      if (!survey) {
        throw new GraphQLError("No survey found for this question.")
      }
      return survey
    },
  },
};

const compositionResolver = {
  "Mutation.*": [isSurveyFromUser()],
};

export default composeResolvers(questionResolver, compositionResolver);
