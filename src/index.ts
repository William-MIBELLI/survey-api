import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@as-integrations/express5';
import express from 'express';
import http from 'http';
import cors from 'cors';
import resolvers from './resolvers/index';
import typeDefs from './schemas/index'

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
  console.log(`🚀 Server ready at http://localhostzgeg:${process.env.PORT}/`)
}

main()