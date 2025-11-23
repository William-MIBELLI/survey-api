import OptionEntity from "entities/option.entity";
import GenericService from "./generic.service";
import { DeepPartial, Repository } from "typeorm";
import { GraphQLError } from "graphql";
import QuestionEntity from "entities/question.entity";
import { QuestionType } from "generated/graphql";

type TCreateOption = {
  entity: DeepPartial<OptionEntity>;
  question: QuestionEntity;
};

export default class OptionService extends GenericService<OptionEntity> {
  constructor(repo: Repository<OptionEntity>) {
    super(repo);
  }

  public async createOption({ entity, question }: TCreateOption): Promise<OptionEntity> {
    if (question.type === QuestionType.Open) {
      throw new GraphQLError("Can't add option to an Open question.");
    }
    return await super.createOne(entity);
  }

  public async createOne(entity: DeepPartial<OptionEntity>): Promise<OptionEntity> {
      throw new GraphQLError("CreateOne is not available for Option entity. Please call createOption instead.")
  }

  public async checkOptionIsFromUser(
    optionId: string,
    userId: string,
  ): Promise<OptionEntity> {
    const option = await this.repo.findOne({
      where: {
        id: optionId,
        question: {
          survey: {
            ownerId: userId,
          },
        },
      },
    });
    if (!option) {
      throw new GraphQLError("No option available.");
    }
    return option;
  }
}
