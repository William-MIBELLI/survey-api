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
    protected userService: UserService,
  ) {
    super(repo);
  }

  public async assignCandidates({ survey, ids }: TAssignment) {
    if (ids.length === 0) {
      return survey;
    }
    const existingCandidatesQuery = this.repo
      .createQueryBuilder("survey")
      .leftJoin("survey.candidates", "candidate")
      .where("survey.id = :surveyId", { surveyId: survey.id })
      .andWhere("candidate.id IN (:...ids)", { ids })
      .select("candidate.id", "id");

    const existingCandidates = await existingCandidatesQuery.getRawMany();
    const existingCandidateIds = existingCandidates.map((c) => c.id);
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

  public async revokeCandidates({ survey, ids }: TAssignment): Promise<SurveyEntity> {
    try {
      await this.repo
        .createQueryBuilder()
        .relation("candidates")
        .of(survey.id)
        .remove(ids);
    } catch (error: any) {
      console.error("Failed to revoke candidates from survey:", error?.message);
      throw new Error("Could not revoke candidates.");
    }
    return survey;
  }
}
