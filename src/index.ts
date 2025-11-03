import "reflect-metadata";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { expressMiddleware } from "@as-integrations/express5";
import express from "express";
import http from "http";
import cors from "cors";
import resolvers from "resolvers";
import typeDefs from "schemas";
import { appDataSource } from "lib/datasource";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { constraintDirective } from "graphql-constraint-directive";
import { formatError } from "utils/error.utils";
import UserEntity from "entities/user.entity";
import UserService from "services/user.service";
import AuthService from "services/auth.service";
import GenericQueryBuilder from "builders/generic.builder";
import { User } from "generated/graphql";
import Cookies from "cookies"
import TokenEntity from "entities/token.entity";
import MailService from "services/mail.service";
import { buildTransporter } from "lib/nodemailer";
import SurveyEntity from "entities/survey.entity";
import SurveyService from "services/survey.service";
import { MyContext } from "interfaces/graphql.interface";

const app = express();

const httpServer = http.createServer(app);

const schema = constraintDirective()(
  makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
);

const server = new ApolloServer<MyContext>({
  schema,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  includeStacktraceInErrorResponses: false,
  formatError,
});

const main = async () => {
  try {
    await appDataSource.initialize();
    console.log("💪 DB Initialized.");
  } catch (error: any) {
    console.log("ERROR IN DB INITIALISATION : ", error);
  }

  await server.start();

  //REPOSITORIES
  const userRepository = appDataSource.getRepository(UserEntity);
  const tokenRepository = appDataSource.getRepository(TokenEntity)
  const surveyRepository = appDataSource.getRepository(SurveyEntity)


  //FILTER BUILDERS
  const userFilterBuilder = new GenericQueryBuilder(UserEntity);
  const surveyFilterBuilder = new GenericQueryBuilder(SurveyEntity)


  //SERVICES
  const userService = new UserService(userRepository, userFilterBuilder);
  const mailService = new MailService(buildTransporter())
  const authService = new AuthService(userService, tokenRepository, mailService);
  const surveyService = new SurveyService(surveyRepository, surveyFilterBuilder)

  app.use(
    "/",
    cors<cors.CorsRequest>(),
    express.json(),

    expressMiddleware(server, {
      context: async ({ req, res }): Promise<MyContext> => {
        let user: UserEntity | null = null
        const cookie = new Cookies(req, res)
        const token = cookie.get("token")
        if (token) {
          user = await authService.verifyJWTValidity(token)
        }
        return {
          req, res,
          user,
          services: { userService, authService, surveyService },
        }
      },
    }),
  );
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 3000 }, resolve),
  );

  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/`);
};

main();
