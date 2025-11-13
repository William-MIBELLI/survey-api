import { composeResolvers } from "@graphql-tools/resolvers-composition";
import OptionEntity from "entities/option.entity";
import QuestionEntity from "entities/question.entity";
import {
  DeleteResponse,
  MutationCreateOptionArgs,
  MutationUpdateOptionArgs,
  QueryOptionsArgs,
} from "generated/graphql";
import { GraphQLError } from "graphql";
import { TConnection } from "interfaces/generic.interface";
import { MyContext, ResolverWrapper } from "interfaces/graphql.interface";
import { appDataSource } from "lib/datasource";

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
      { services: { optionService } }: MyContext,
    ): Promise<OptionEntity> => {
      return await optionService.createOne(data.args);
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
  Option: {},
};

const isOptionFromUser =
  (): ResolverWrapper => (next) => async (root, args, context, info) => {
    const option = await appDataSource
      .getRepository(OptionEntity)
      .createQueryBuilder("option")
      .where("option.id = :id", { id: args.id })
      .leftJoinAndSelect("option.question", "question")
      .leftJoinAndSelect("question.survey", "survey").getOne();
    if (!option || !context.user || option.question.survey.ownerId !== context.user.id) {
      throw new GraphQLError("Forbidden.");
    }
    return next(root, args, { ...context, preload: { entity: option } }, info);
  };

const compositionResolver = {
  "Mutation.!createOption": [isOptionFromUser()]
};

export default composeResolvers(optionResolver, compositionResolver);
