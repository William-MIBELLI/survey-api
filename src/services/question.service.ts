import QuestionEntity from "entities/question.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import { GraphQLError } from "graphql";
import { UpdateQuestionInput } from "generated/graphql";

export default class QuestionService extends GenericService<QuestionEntity> {
  constructor(repo: Repository<QuestionEntity>) {
    super(repo);
  }

  public async updateQuestion(args: UpdateQuestionInput): Promise<QuestionEntity> {
    const question = await this.findById(args.id);
    if (!question) {
      throw new GraphQLError("No question found.");
    }
    const { options, ...rest } = args;

    //UPDATE DE LA QUESTION
    const updatedQuestion = this.updateOne(question, rest);

    //GESTION DES OPTIONS
    if (args.options) {
    }
    return updatedQuestion;
  }

  public async checkQuestionIsFromUser(
    questionId: string,
    userId: string,
  ): Promise<QuestionEntity> {
    const question = await this.repo.findOne({
      where: {
        id: questionId,
        survey: {
          ownerId: userId,
        },
      },
    });
    if (!question) {
      throw new GraphQLError("No question found.");
    }
    return question;
  }
}
