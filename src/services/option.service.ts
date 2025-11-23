import OptionEntity from "entities/option.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import { GraphQLError } from "graphql";

export default class OptionService extends GenericService<OptionEntity> {
  constructor(repo: Repository<OptionEntity>) {
    super(repo);
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
