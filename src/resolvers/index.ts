import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers } from "@graphql-tools/merge";
import { GraphQLError } from "graphql";
import { ResolverWrapper } from "interfaces/graphql.interface";
import path from "path";



const resolvers = loadFilesSync(path.join(__dirname, "."), { recursive: true });

export default mergeResolvers(resolvers);
