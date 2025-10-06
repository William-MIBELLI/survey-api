import "reflect-metadata"
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import resolvers from 'resolvers';
import typeDefs from 'schemas'
import { appDataSource } from "lib/datasource";

interface MyContext {
  token?: string;
}
const app = express();

const httpServer = http.createServer(app);

const server = new ApolloServer<MyContext>({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

const main = async () => {

  await server.start();
  
  app.use(
    '/',
    cors<cors.CorsRequest>(),
    express.json(),
  
    expressMiddleware(server, {
      context: async ({ req }) => ({ token: req.headers.token }),
    }),
  );
  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT }, resolve),
  );
  
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}/`)

  try {
    await appDataSource.initialize()
  } catch (error: any) {
    console.log('ERROR IN DB INITIALISATION : ', error)
  }
}

main()