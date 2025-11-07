import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import UserEntity from "./user.entity";
import QuestionEntity from "./question.entity";

@Entity()
export default class SurveyEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false, type: "varchar", length: 255 })
  name: string;

  @Column({ nullable: false, type: "text" })
  description: string;

  @Column({ default: true })
  isPublic: boolean;

  @Column({ nullable: true, type: "timestamp", precision: 3 })
  startDate: Date;

  @Column({ nullable: true, type: "timestamp", precision: 3 })
  endDate: Date;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @Column({ nullable: false, type: "uuid" })
  ownerId: string;

  @ManyToOne(() => UserEntity, (user) => user.surveys, { onDelete: "CASCADE", nullable: false })
  owner: UserEntity;

  @ManyToMany(() => UserEntity, (user) => user.assignedSurveys)
  @JoinTable({ name: "candidate_table" })
  candidates: UserEntity[];

  @OneToMany(() => QuestionEntity, (question) => question.survey)
  questions: QuestionEntity[];
}
