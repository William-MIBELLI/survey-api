import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import OptionEntity from "./option.entity";
import QuestionEntity from "./question.entity";
import UserEntity from "./user.entity";

@Entity()
export default class AnswerEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  value?: string;

  @Column({ type: "uuid", nullable: true })
  optionId?: string

  @ManyToOne(() => OptionEntity, (option) => option.answers, { nullable: true })
  option: OptionEntity;

  @Column({ type: "uuid" })
  questionId: string;

  @ManyToOne(() => QuestionEntity, (question) => question.answers)
  question: QuestionEntity;

  @Column({ type: "uuid", nullable: true })
  userId?: string

  @ManyToOne(() => UserEntity, (user) => user.answers, { nullable: true })
  user: UserEntity;
}
