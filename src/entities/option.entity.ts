import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import QuestionEntity from "./question.entity";

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

  @ManyToOne(() => QuestionEntity, (question) => question.options)
  question: QuestionEntity;
}
