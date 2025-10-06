import { loadFilesSync } from "@graphql-tools/load-files";
import { mergeResolvers } from "@graphql-tools/merge";
import path from "path";

const resolvers = loadFilesSync(path.join(__dirname, '.'), { recursive: true })

export default mergeResolvers(resolvers)