import Question from "entities/question.entity";
import Survey from "entities/survey.entity";
import User from "entities/user.entity";
import { DataSource } from "typeorm";

const { POSTGRES_USER, POSTGRES_DB, POSTGRES_PASSWORD } = process.env;

export const appDataSource = new DataSource({
  type: "postgres",
  host: "postgres",
  port: 5432,
  username: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  database: POSTGRES_DB,
  entities: [User, Survey, Question],
  synchronize: true,
  logging: ["error"],
});
