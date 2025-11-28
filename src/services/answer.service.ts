import AnswerEntity from "entities/answer.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";

export default class AnswerService extends GenericService<AnswerEntity> {
  constructor(repo: Repository<AnswerEntity>) {
    super(repo);
  }
}
