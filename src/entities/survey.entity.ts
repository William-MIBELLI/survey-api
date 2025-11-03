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
import User from "./user.entity";
import Question from "./question.entity";

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

  @ManyToOne(() => User, (user) => user.surveys, { onDelete: "CASCADE", nullable: false })
  owner: User;

  @ManyToMany(() => User)
  @JoinTable({ name: "user_authorizations" })
  users: User[];

  @OneToMany(() => Question, (question) => question.survey)
  questions: Question[];
}
