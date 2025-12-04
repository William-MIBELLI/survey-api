import { fakerFR as faker } from "@faker-js/faker";
import UserService from "services/user.service";
import { appDataSource } from "lib/datasource";
import { SignupInput } from "generated/graphql";
import UserEntity from "entities/user.entity";
import UserQueryBuilder from "builders/user.builder";
import argon2 from "argon2"
import { DeepPartial } from "typeorm";

const seedUser = async () => {
  const hash = await argon2.hash('jambon', {
        type: argon2.argon2id,
      });
  const createRandomUser = () => {
    const user: DeepPartial<UserEntity> = {
      email: faker.internet.email(),
      isPremium: Math.random() > 0.5,
      password: hash,
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
    };
    return user;
  };
  const users =  faker.helpers.multiple(createRandomUser, { count: 500 });

  const admin = {
    email:"william.mibelli@gmail.com",
    firstname: "William",
    lastname : "MIBELLI",
    password : hash,
    isPremium : true
  }
  users.push(admin)

  await new UserService(
    appDataSource.getRepository(UserEntity),
  ).createUserForSeeding(users);
  
 
};

const seedDB = async () => {
  console.log("🚀 --> START SEEDING...");
  console.log("👜 --> CONNECTION DB...");
  try {
    await appDataSource.initialize();
    await appDataSource.query("TRUNCATE user_entity CASCADE");
    console.log("🧜 --> SEEDING USERS...");
    await seedUser();
    console.log("🥳 --> SEEDING OK");
  } catch (error: any) {
    console.error("ERROR : ", error?.message);
    console.log("😢 --> SEEDING FAILED...");
  }
};

seedDB();