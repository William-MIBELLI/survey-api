import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import QuestionEntity from "./question.entity";
import AnswerEntity from "./answer.entity";

@Entity()
export default class OptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false })
  position: number;

  @Column({ nullable: false, type: "varchar", length: 255 })
  label: string;

  @Column({ type: "boolean", default: false })
  withArgs: boolean;

  @Column({ type: "uuid", nullable: false })
  questionId: string;

  @CreateDateColumn({ type: "timestamptz", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", precision: 3 })
  updatedAt: Date;

  @ManyToOne(() => QuestionEntity, (question) => question.options, { onDelete: "CASCADE"})
  question: QuestionEntity;

  @OneToMany(() => AnswerEntity, (answer) => answer.option, { nullable: true })
  answers: AnswerEntity[];
}
