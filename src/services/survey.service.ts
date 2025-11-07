import SurveyEntity from "entities/survey.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import GenericQueryBuilder from "builders/generic.builder";
import { UpdateCandidatesInput, UserConnection } from "generated/graphql";
import UserEntity from "entities/user.entity";

type TAssignment = {
  survey: SurveyEntity;
  users: UserEntity[];
};

export default class SurveyService extends GenericService<SurveyEntity> {
  constructor(repo: Repository<SurveyEntity>, fb: GenericQueryBuilder<SurveyEntity>) {
    super(repo, fb);
  }

  public async assignCandidates(args: TAssignment) {
    try {
      this.repo
        .createQueryBuilder()
        .relation("candidates")
        .of(args.survey.id)
        .add(args.users)
 
        // if (!args.survey.candidates) {
        //   args.survey.candidates = [];
        // }
    
        // args.survey.candidates.push(...args.users);
    
        // return await this.repo.save(args.survey);
    } catch (error: any) {
      console.log("ERROR RELATION : ", error?.message)
    }
    return args.survey
  }

  public async revokeCandidates(args: UpdateCandidatesInput) {}
}
