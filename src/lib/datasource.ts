import OptionEntity from "entities/option.entity";
import QuestionEntity from "entities/question.entity";
import SurveyEntity from "entities/survey.entity";
import TokenEntity from "entities/token.entity";
import UserEntity from "entities/user.entity";
import { DataSource } from "typeorm";

const { POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD } = process.env;

export const appDataSource = new DataSource({
  type: "postgres",
  host: "postgres",
  port: 5432,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  entities: [UserEntity, SurveyEntity, QuestionEntity, TokenEntity, OptionEntity],
  synchronize: true,
  logging: ["error"],
});
