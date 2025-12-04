import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Survey from "./survey.entity";
import { QuestionType } from "generated/graphql";
import OptionEntity from "./option.entity";
import AnswerEntity from "./answer.entity";

// export enum QuestionType {
//   OPEN,
//   SIMPLE,
//   MULTIPLE
// }

@Entity()
export default class QuestionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, nullable: false})
  label: string;

  @Column({ type: "enum", enum: QuestionType })
  type: QuestionType;

  @Column({ default: true, name: "is_mandatory" })
  isMandatory: boolean;

  @Column({ type: "uuid", nullable: true })
  dependsOn?: string;

  @Column({ type: "uuid", nullable: false})
  surveyId: string;

  @CreateDateColumn({ type: "timestamptz", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", precision: 3 })
  updatedAt: Date;

  @ManyToOne(() => Survey, (survey) => survey.questions, { onDelete: "CASCADE" })
  survey: Survey;

  @OneToMany(() => OptionEntity, (option) => option.question)
  options: OptionEntity[];

  @OneToMany(() => AnswerEntity, answer => answer.question, { nullable: true })
  answers: AnswerEntity[];
}
