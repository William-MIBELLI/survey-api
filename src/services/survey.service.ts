import SurveyEntity from "entities/survey.entity";
import GenericService from "./generic.service";
import { In, Not, Repository } from "typeorm";
import GenericQueryBuilder from "builders/generic.builder";
import { UpdateCandidatesInput, UserConnection } from "generated/graphql";
import UserEntity from "entities/user.entity";
import UserService from "./user.service";

type TAssignment = {
  survey: SurveyEntity;
  ids: string[];
};

export default class SurveyService extends GenericService<SurveyEntity> {
  constructor(
    repo: Repository<SurveyEntity>,
    filterBuilder: GenericQueryBuilder<SurveyEntity>,
    protected userService: UserService,
  ) {
    super(repo, filterBuilder);
  }

  public async assignCandidates({ survey, ids }: TAssignment) {
    if (ids.length === 0) {
      return survey;
    }

    const res = await this.repo.findOne({
      where: {
        id: survey.id,
        candidates: {
          id: In(ids)
        }
      },
      relations: {
        candidates: true
      },
      select: {
        candidates: {
          id:true
        },
        id: true
      }
    })

    const existingCandidateIds = res?.candidates.map((c) => c.id) || [];

    const idsToAdd = ids.filter((id) => !existingCandidateIds.includes(id));

    if (idsToAdd.length === 0) {
      return survey;
    }

    try {
      await this.repo
        .createQueryBuilder()
        .relation("candidates")
        .of(survey.id)
        .add(idsToAdd);
    } catch (error: any) {
      console.error("Failed to add candidates to survey:", error?.message);
      throw new Error("Could not assign candidates.");
    }
    return survey;
  }

  public async revokeCandidates(args: TAssignment) {}
}
