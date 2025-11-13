import QuestionEntity from "entities/question.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";


export default class QuestionService extends GenericService<QuestionEntity> {

  constructor(repo: Repository<QuestionEntity>) {
    super(repo)
  }
}