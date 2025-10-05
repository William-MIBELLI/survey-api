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

  @Column()
  withArgs: boolean

  @Column({ default: true })
  isMandatory: boolean

  @Column({ type: "uuid", nullable: true })
  dependsOn?: string

  @ManyToOne(() => Survey, (survey) => survey.questions)
  survey: Survey
}