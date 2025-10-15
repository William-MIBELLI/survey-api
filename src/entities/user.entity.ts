import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Survey from "./survey.entity";
import bcrypt from "bcrypt"

@Entity()
export default class UserEntity {
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

  @Column({ default: false })
  isPremium: boolean

  @CreateDateColumn({ type: "timestamp"})
  createdAt: Date

  @UpdateDateColumn({ type: "timestamp"})
  updatedAt: Date

  @OneToMany(() => Survey, (survey) => survey.owner)
  surveys: Survey[]

  @BeforeInsert()
  async hashPassword() {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash
  }

}