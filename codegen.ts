import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  overwrite: true,
  schema: "src/**/*.gql",
  generates: {
    "src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        inputMaybeValue: "T | undefined",
        resolversNonOptionalTypename: true,
      },
    },
  },
};

export default config;
