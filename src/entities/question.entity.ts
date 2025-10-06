import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import Survey from "./survey.entity";

export enum QuestionType {
  OPEN,
  SIMPLE,
  MULTIPLE
}

@Entity()
export default class Question {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  label: string

  @Column({ type: "enum", enum: QuestionType })
  type: QuestionType

  @Column({ name: "with_args"})
  withArgs: boolean

  @Column({ default: true, name: "is_mandatory" })
  isMandatory: boolean

  @Column({ type: "uuid", nullable: true })
  dependsOn?: string

  @Column()
  surveyId: string

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: "CASCADE"})
  survey: Survey
}