import AnswerEntity from "entities/answer.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import { GraphQLError } from "graphql";
import { TConnection, TFilterInput, TFindArgs } from "interfaces/generic.interface";

export default class AnswerService extends GenericService<AnswerEntity> {
  constructor(repo: Repository<AnswerEntity>) {
    super(repo);
  }

  public async findByIdWithAuth(
    id: string,
    userId: string,
  ): Promise<AnswerEntity | null> {
    const answer = await this.repo.findOne({
      where: {
        id,
      },
      relations: {
        user: true,
        question: {
          survey: true,
        },
      },
    });

    if (!answer) return null;

    if (answer.user.id === userId || answer.question.survey.ownerId === userId) {
      return answer;
    }

    throw new GraphQLError("Forbidden.");
  }

  public async findAllWithAuth(
    data: TFindArgs<AnswerEntity>,
    userId: string,
  ): Promise<TConnection<AnswerEntity>> {
    const initialQuery = this.repo.createQueryBuilder("answer")
    initialQuery
      .leftJoinAndSelect("answer.user", "user")
      .innerJoinAndSelect("answer.question", "question")
      .innerJoinAndSelect("question.survey", "survey")
      .where("(user.id = :userId OR survey.ownerId = :userId)", { userId });
    const res = await super.findAll(data, initialQuery);
    
    return res;
  }

 
}
