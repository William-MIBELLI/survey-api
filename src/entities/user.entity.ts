import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import Survey from "./survey.entity";
import argon2 from "argon2";

@Entity()
export default class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 255, select: false })
  password: string;

  @Column({ nullable: true, type: "varchar", length: 255 })
  firstname?: string;

  @Column({ nullable: true, type: "varchar", length: 255 })
  lastname?: string;

  @Column({ default: false, type: "boolean" })
  isPremium: boolean;

  @CreateDateColumn({ type: "timestamptz", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", precision: 3 })
  updatedAt: Date;

  @OneToMany(() => Survey, (survey) => survey.owner)
  surveys: Survey[];

  @BeforeInsert()
  async hashPassword() {
    const hash = await argon2.hash(this.password, {
      type: argon2.argon2id,
    });
    this.password = hash;
  }
}
