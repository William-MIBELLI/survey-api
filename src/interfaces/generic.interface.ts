import { DateFilterInput, IntFilterInput, StringFilterInput } from "generated/graphql";
import { FindOptionsWhere, ObjectLiteral } from "typeorm";

export interface Edge<T extends ObjectLiteral> {
  cursor: string;
  node: T;
}


export interface TConnection<T extends ObjectLiteral> {
  totalCount: number;
  edges: Edge<T>[]
  pageInfo: {
    startCursor?: string;
    endCursor?: string;
    hasNextPage: boolean
    hasPreviousPage: boolean
  };
}

export interface TEntity extends ObjectLiteral {
  id: string
  createdAt: Date
  updatedAt: Date
}

export interface TReturn<T> {
  list: T[]
  count: number
}

export type TFilterInput<T> = {
  [k in keyof FindOptionsWhere<T>]: StringFilterInput | IntFilterInput | DateFilterInput;
};
