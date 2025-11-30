import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { isAuthenticated } from "./auth.resolver";
import {
  DeleteResponse,
  MutationCreateAnswerArgs,
  MutationUpdateAnswerArgs,
  QueryAnswerArgs,
  QueryAnswersArgs,
} from "generated/graphql";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import AnswerEntity from "entities/answer.entity";
import { TConnection } from "interfaces/generic.interface";
import { GraphQLError } from "graphql";

const answerResolver = {
  Query: {
    answer: async (
      _: any,
      data: QueryAnswerArgs,
      { services: { answerService }, user }: MyContext,
    ): Promise<AnswerEntity | null> => {
      const res = await answerService.findByIdWithAuth(data.id, user?.id!);
      return res;
    },
    answers: async (
      _: any,
      data: QueryAnswersArgs,
      { services: { answerService }, user }: MyContext,
    ): Promise<TConnection<AnswerEntity>> => {
      return await answerService.findAllWithAuth(data.args, user?.id!);
    },
  },
  Mutation: {
    createAnswer: async (
      _: any,
      data: MutationCreateAnswerArgs,
      { services: { answerService }, user }: MyContext,
    ): Promise<AnswerEntity> => {
      return await answerService.createOne({ ...data.args, user: user ?? undefined });
    },
    updateAnswer: async (
      _: any,
      data: MutationUpdateAnswerArgs,
      { services: { answerService }, preload }: MyContext<AnswerEntity>,
    ): Promise<AnswerEntity> => {
      return await answerService.updateOne(preload?.entity!, data.args);
    },
    deleteAnswer: async (
      _: any,
      { id }: { id: string },
      { services: { answerService }, preload }: MyContext<AnswerEntity>,
    ): Promise<DeleteResponse> => {
      const res = await answerService.deleteOne(preload?.entity!);
      return {
        success: res,
        Message: res ? "Answer successfully deleted." : "Unable to delete answer.",
      };
    },
  },
  Answer: {
    Option: async (
      parent: AnswerEntity,
      data: any,
      { services: { optionService } }: MyContext,
    ) => {
      if (!parent.optionId) {
        return null;
      }
      return await optionService.findById(parent.optionId);
    },
    Question: async (
      parent: AnswerEntity,
      data: any,
      { services: { questionService } }: MyContext,
    ) => {
      return await questionService.findById(parent.questionId);
    },
    User: async (
      parent: AnswerEntity,
      data: any,
      { services: { userService } }: MyContext,
    ) => {
      if (!parent.userId) {
        return null;
      }
      return await userService.findById(parent.userId);
    },
  },
};

const IsAnswerIsAuthorized =
  (): ResolverWrapper<MutationCreateAnswerArgs> =>
  (next) =>
  async (root, data, context, info) => {
    await context.services.surveyService.checkUserCanAnswer(
      data.args.questionId,
      context.user ?? undefined,
    );
    return next(root, data, context, info);
  };

const isUserCanManageAnswer =
  (): ResolverWrapper<MutationUpdateAnswerArgs> =>
  (next) =>
  async (root, data, context, info) => {
    const answer = await context.services.answerService.findByIdWithAuth(
      data.args.id,
      context?.user?.id!,
    );
    if (!answer) {
      throw new GraphQLError("Can't retrieve answer.");
    }
    return next(root, data, { ...context, preload: { entity: answer } }, info);
  };

const compositionResolver = {
  "Mutation.*": [IsAnswerIsAuthorized()],
  "Mutation.{updateAnswer, deleteAnswer}": [isAuthenticated(), isUserCanManageAnswer()],
  "Query.*": [isAuthenticated()],
};

export default composeResolvers(answerResolver, compositionResolver);
