import { fakerFR as faker } from "@faker-js/faker";
import UserService from "services/user.service";
import { appDataSource } from "lib/datasource";
import { SignupInput } from "generated/graphql";
import UserEntity from "entities/user.entity";
import UserQueryBuilder from "builders/user.builder";

const seedUser = async () => {
  const createRandomUser = () => {
    const user: SignupInput = {
      email: faker.internet.email(),
      isPremium: Math.random() > 0.5,
      password: "jambon",
      confirmPassword: "jambon",
      firstname: faker.person.firstName(),
      lastname: faker.person.lastName(),
    };
    return user;
  };
  const users = faker.helpers.multiple(createRandomUser, { count: 500 });
  // await UserService.getInstance().repo.insert(users)
  // await Promise.all(users.map(user => {
  //   userService.createOne(user)
  // }))
  await new UserService(
    appDataSource.getRepository(UserEntity),
    new UserQueryBuilder(),
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
