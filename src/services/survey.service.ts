import SurveyEntity from "entities/survey.entity";
import GenericService from "./generic.service";
import { Repository } from "typeorm";
import GenericQueryBuilder from "builders/generic.builder";
import { UpdateCandidatesInput, UserConnection } from "generated/graphql";
import UserEntity from "entities/user.entity";

type TAssignment = {
  survey: SurveyEntity
  users: UserConnection
}

export default class SurveyService extends GenericService<SurveyEntity> {
  constructor(repo: Repository<SurveyEntity>, fb: GenericQueryBuilder<SurveyEntity>) {
    super(repo, fb);
  }

  public async assignCandidates(args: TAssignment) {
    const mappedUsers = args.users.edges.map(edge => {
      return edge.node
    }) as UserEntity[]
    args.survey.candidates.push(...mappedUsers)
    return await this.repo.save(args.survey)
  }

  public async revokeCandidates(args: UpdateCandidatesInput) {}
}
