import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Survey from "./survey.entity";
import { QuestionType } from "generated/graphql";

// export enum QuestionType {
//   OPEN,
//   SIMPLE,
//   MULTIPLE
// }

@Entity()
export default class QuestionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  label: string

  @Column({ type: "enum", enum: QuestionType })
  type: QuestionType

  @Column({ default: true, name: "is_mandatory" })
  isMandatory: boolean

  @Column({ type: "uuid", nullable: true })
  dependsOn?: string

  @Column()
  surveyId: string

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: "CASCADE"})
  survey: Survey
}