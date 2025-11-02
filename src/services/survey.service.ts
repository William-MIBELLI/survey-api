import SurveyEntity from "entities/survey.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import GenericQueryBuilder from "builders/generic.builder";


export default class SurveyService extends GenericService<SurveyEntity> {

  constructor(repo: Repository<SurveyEntity>, fb: GenericQueryBuilder<SurveyEntity>) {
    super(repo, fb)
  }
}