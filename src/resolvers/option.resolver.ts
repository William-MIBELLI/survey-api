import { composeResolvers } from "@graphql-tools/resolvers-composition";
import OptionEntity from "entities/option.entity";
import QuestionEntity from "entities/question.entity";
import {
  AnswersFilterInput,
  DeleteResponse,
  MutationCreateOptionArgs,
  MutationUpdateOptionArgs,
  QueryOptionsArgs,
  QuestionType,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { TConnection } from "interfaces/generic.interface";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { appDataSource } from "lib/datasource";
import { isAuthenticated } from "./auth.resolver";
import AnswerEntity from "entities/answer.entity";

const optionResolver = {
  Query: {
    option: async (
      _: any,
      { id }: { id: string },
      { services: { optionService } }: MyContext,
    ): Promise<OptionEntity | null> => {
      return await optionService.findById(id);
    },
    options: async (
      _: any,
      data: QueryOptionsArgs,
      { services: { optionService } }: MyContext,
    ): Promise<TConnection<OptionEntity>> => {
      return await optionService.findAll(data.args);
    },
  },
  Mutation: {
    createOption: async (
      _: any,
      data: MutationCreateOptionArgs,
      { services: { optionService }, preload }: MyContext<QuestionEntity>,
    ): Promise<OptionEntity> => {
      return await optionService.createOption({
        entity: data.args,
        question: preload?.entity!,
      });
    },
    updateOption: async (
      _: any,
      data: MutationUpdateOptionArgs,
      { services: { optionService }, preload }: MyContext<OptionEntity>,
    ): Promise<OptionEntity> => {
      return await optionService.updateOne(preload?.entity!, data.args);
    },
    deleteOption: async (
      _: any,
      { id }: { id: string },
      { services: { optionService }, preload }: MyContext<OptionEntity>,
    ): Promise<DeleteResponse> => {
      const isDeleted = await optionService.deleteOne(preload?.entity!);
      return {
        success: isDeleted,
        Message: isDeleted ? "Option successfully deleted." : "Unable to delete option.",
      };
    },
  },
  Option: {
    question: async (
      parent: OptionEntity,
      _: any,
      { services: { questionService } }: MyContext,
    ) => {
      return await questionService.findById(parent.id);
    },
    answers: async (
      parent: OptionEntity,
      data: AnswersFilterInput,
      { services: { answerService } }: MyContext,
    ): Promise<TConnection<AnswerEntity>> => {
      const query = appDataSource
        .getRepository(AnswerEntity)
        .createQueryBuilder("answer")
        .innerJoin("answer.option", "option", "option.id = :optionId", {
          optionId: parent.id,
        });
      return await answerService.findAll(data, query)
    },
  },
};

const isOptionIsForUserQuestion =
  (): ResolverWrapper<MutationCreateOptionArgs> =>
  (next) =>
  async (source, data, context, info) => {
    const question = await context.services.questionService.checkQuestionIsFromUser(
      data.args.questionId,
      context.user?.id!,
    );
    return next(source, data, { ...context, preload: { entity: question } }, info);
  };

const isOptionFromUser =
  (): ResolverWrapper<MutationUpdateOptionArgs> =>
  (next) =>
  async (root, data, context, info) => {
    const option = context.services.optionService.checkOptionIsFromUser(
      data.args.id,
      context?.user?.id!,
    );
    return next(root, data, { ...context, preload: { entity: option } }, info);
  };

const compositionResolver = {
  "Mutation.!createOption": [isAuthenticated(), isOptionFromUser()],
  "Mutation.createOption": [isAuthenticated(), isOptionIsForUserQuestion()],
};

export default composeResolvers(optionResolver, compositionResolver);
