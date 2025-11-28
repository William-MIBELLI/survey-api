import { composeResolvers } from "@graphql-tools/resolvers-composition";
import { isAuthenticated } from "./auth.resolver";
import {
  DeleteResponse,
  MutationCreateAnswerArgs,
  MutationUpdateAnswerArgs,
  QueryAnswerArgs,
  QueryAnswersArgs,
} from "generated/graphql";
import { MyContext } from "interfaces/graphql.interface";
import AnswerEntity from "entities/answer.entity";
import { TConnection } from "interfaces/generic.interface";

const answerResolver = {
  Query: {
    answer: async (
      _: any,
      data: QueryAnswerArgs,
      { services: { answerService } }: MyContext,
    ): Promise<AnswerEntity | null> => {
      return await answerService.findById(data.id);
    },
    answers: async (
      _: any,
      data: QueryAnswersArgs,
      { services: { answerService } }: MyContext,
    ): Promise<TConnection<AnswerEntity>> => {
      return await answerService.findAll(data.args);
    },
  },
  Mutation: {
    createAnswer: async (
      _: any,
      data: MutationCreateAnswerArgs,
      { services: { answerService }, user }: MyContext,
    ): Promise<AnswerEntity> => {
      return await answerService.createOne({ ...data.args, user: user! });
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
      const res = await answerService.deleteOne(preload?.entity!)
      return {
        success: res,
        Message: res ? "Answer successfully deleted." : "Unable to delete answer." 
      }
    },
  },
};

const compositionResolver = {
  "Mutation.*": [isAuthenticated()],
};

export default composeResolvers(answerResolver, compositionResolver);
