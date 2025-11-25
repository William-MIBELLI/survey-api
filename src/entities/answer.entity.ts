import { Check, Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import OptionEntity from "./option.entity";
import QuestionEntity from "./question.entity";
import UserEntity from "./user.entity";

@Entity()
export default class AnswerEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  value?: string;

  @ManyToOne(() => OptionEntity, (option) => option.answers, { nullable: true })
  option: OptionEntity;

  @ManyToOne(() => QuestionEntity, (question) => question.answers, { nullable: true })
  question: QuestionEntity;

  @ManyToOne(() => UserEntity, (user) => user.answers)
  user: UserEntity;
}
