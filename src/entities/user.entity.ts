import { BeforeInsert, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import Survey from "./survey.entity";
import bcrypt from "bcrypt"

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
    const hashedPassword = await bcrypt.hash(this.password, 12)
    this.password = hashedPassword
  }

}