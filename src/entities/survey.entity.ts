import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import User from "./user.entity";
import Question from "./question.entity";

@Entity()
export default class Survey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column()
  description: string

  @Column({ default: true })
  isPublic: boolean

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date

  @ManyToOne(() => User, (user) => user.surveys)
  owner: User

  @ManyToMany(() => User)
  @JoinTable({ name: "user_authorizations"})
  users: User[]

  @OneToMany(() => Question, (question) => question.survey)
  questions: Question[]
}