import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import UserEntity from "./user.entity";

export enum EToken {
  RESET_PASSWORD = "RESET_PASSWORD",
  VERIFY_EMAIL = "VERIFY_EMAIL",
}

@Entity()
export default class TokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: false, type: "uuid" })
  userId: string;

  @Column({ nullable: false, type: "varchar", length: 255 })
  token: string;

  @Column({ nullable: false, type: "enum", enum: EToken })
  type: EToken
  
  @Column({ nullable: false, type: "timestamp", precision: 3 })
  expiration: Date;

  @CreateDateColumn({ type: "timestamp", precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 3 })
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (userEntity) => userEntity.id)
  user: UserEntity
}
