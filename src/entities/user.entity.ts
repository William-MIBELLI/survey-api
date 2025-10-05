import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Survey from "./survey.entity";


@Entity()
export default class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  firstname?: string

  @Column({ nullable: true })
  lastname?: string;

  @CreateDateColumn({ type: "timestamp"})
  createdAt: Date

  @UpdateDateColumn({ type: "timestamp"})
  updatedAt: Date

  @OneToMany(() => Survey, (survey) => survey.owner)
  surveys: Survey[]

}