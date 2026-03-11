import QuestionEntity from "entities/question.entity";
import {
  AnswersFilterInput,
  DeleteResponse,
  MutationCreateQuestionArgs,
  MutationDeleteQuestionArgs,
  MutationUpdateQuestionArgs,
  QueryQuestionsArgs,
} from "generated/graphql";
import { TConnection } from "interfaces/generic.interface";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { composeResolvers } from "@graphql-tools/resolvers-composition";
import SurveyEntity from "entities/survey.entity";
import { GraphQLError } from "graphql";
import { isAuthenticated } from "./auth.resolver";
import OptionEntity from "entities/option.entity";
import AnswerEntity from "entities/answer.entity";
import { appDataSource } from "lib/datasource";

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
      { services: { questionService, optionService } }: MyContext,
    ): Promise<QuestionEntity> => {
      const { options, ...rest } = data.args
      const createdQuestion = await questionService.createOne(rest);
      if (options) {
        const createdOptions = await Promise.all(options.map(o => {
          return optionService.createOption({ entity: o, question: createdQuestion})
        }))
        return {...createdQuestion, options: createdOptions}
      }
      return createdQuestion
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
      args: MutationDeleteQuestionArgs,
      { services: { questionService }, preload }: MyContext<QuestionEntity>,
    ): Promise<DeleteResponse> => {
      console.log('ID DANS LE RESOLVER : ', args)
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
      { services: { surveyService } }: MyContext,
    ): Promise<SurveyEntity> => {
      const survey = await surveyService.findById(parent.surveyId);
      if (!survey) {
        throw new GraphQLError("No survey found for this question.");
      }
      return survey;
    },
    options: async (
      parent: QuestionEntity,
      _: any,
      { services: { optionService } }: MyContext,
    ): Promise<OptionEntity[]> => {
      const options = await optionService.findByProperties({
        questionId: {
          equals: parent.id,
        },
      });
      return options;
    },
    answers: async (
      parent: QuestionEntity,
      data: AnswersFilterInput,
      { services: { answerService } }: MyContext,
    ): Promise<TConnection<AnswerEntity>> => {
      const query = appDataSource
        .getRepository(AnswerEntity)
        .createQueryBuilder("answer")
        .innerJoin("answer.question", "question", "question.id = :questionId", {
          questionId: parent.id,
        });
      return await answerService.findAll(data, query);
    },
  },
};

const isQuestionForUserSurvey =
  (): ResolverWrapper<MutationCreateQuestionArgs> =>
  (next) =>
  async (source, args, context, info) => {
    await context.services.surveyService.checkSurveyIsFromUser(
      args.args.surveyId,
      context?.user?.id!,
    );
    return next(source, args, context, info);
  };

const isQuestionFromUser =
  (): ResolverWrapper<MutationUpdateQuestionArgs | MutationDeleteQuestionArgs> =>
  (next) =>
    async (root, args, context, info) => {
      console.log("ARGS DANS LE MIDDLEWARE : ", args)

    const question = await context.services.questionService.checkQuestionIsFromUser(
      args.args.id,
      context?.user?.id!,
    );
    console.log('QUESTION DANS LE MIDDLEWARE : ', question)

    return next(root, args, { ...context, preload: { entity: question } }, info);
  };

const compositionResolver = {
  "Mutation.!createQuestion": [isAuthenticated(), isQuestionFromUser()],
  "Mutation.createQuestion": [isAuthenticated(), isQuestionForUserSurvey()],
};

export default composeResolvers(questionResolver, compositionResolver);
