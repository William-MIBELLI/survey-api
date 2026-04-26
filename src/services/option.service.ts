import OptionEntity from "entities/option.entity";
import GenericService from "./generic.service";
import { DeepPartial, Repository } from "typeorm";
import { GraphQLError } from "graphql";
import QuestionEntity from "entities/question.entity";
import { OptionForUpdateQuestionInput, QuestionType } from "generated/graphql";

type TCreateOption = {
  entity: DeepPartial<OptionEntity>;
  question: QuestionEntity;
};

export default class OptionService extends GenericService<OptionEntity> {
  constructor(repo: Repository<OptionEntity>) {
    super(repo);
  }

  public async createOption({ entity, question }: TCreateOption): Promise<OptionEntity> {
    // if (question.type === QuestionType.Open) {
    //   throw new GraphQLError("Can't add option to an Open question.");
    // }
    const optionToSave = { ...entity, questionId: question.id };
    return await super.createOne(optionToSave);
  }

  public async createOne(entity: DeepPartial<OptionEntity>): Promise<OptionEntity> {
    throw new GraphQLError(
      "CreateOne is not available for Option entity. Please call createOption instead.",
    );
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

  public async deleteOptionsByIds(optionsIds: string[]): Promise<void> {
    await this.repo.delete(optionsIds);
  }

  public async manageOptionsFromUpdatedQuestion(
    options: OptionForUpdateQuestionInput[] | undefined,
    deletedIds: string[] | undefined,
    question: QuestionEntity
  ) {
    if (options) {
      Promise.all(options.map(async (option) => {
        if (!option.optionId) {
           return await this.createOption({entity: option, question});
        }
        const existingOption = await this.findById(option.optionId)
        if (existingOption) {
          return await this.updateOne(existingOption, option);
        }
      }))
    }
    if (deletedIds) {
      console.log('DFELETED IDS : ', deletedIds);
      await this.repo.delete(deletedIds);
    }
  }
}
