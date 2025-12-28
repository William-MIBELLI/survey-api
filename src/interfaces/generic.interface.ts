import {
  BooleanFilterInput,
  DateFilterInput,
  IntFilterInput,
  PaginationInput,
  StringFilterInput,
} from "generated/graphql";
import { FindOptionsRelations, FindOptionsWhere, ObjectLiteral } from "typeorm";

export interface Edge<T extends ObjectLiteral> {
  cursor: string;
  node: T;
}

export interface TConnection<T extends ObjectLiteral> {
  totalCount: number;
  edges: Edge<T>[];
  pageInfo: {
    startCursor?: string;
    endCursor?: string;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export type TFilterType =
  | StringFilterInput
  | IntFilterInput
  | DateFilterInput
  | BooleanFilterInput;

export type TFilterInput<T> = {
  [K in keyof FindOptionsWhere<T>]: T[K & keyof T] extends (infer U)[]
    ? TFilterInput<U>
    : T[K & keyof T] extends Date
    ? TFilterType
    : T[K & keyof T] extends ObjectLiteral
    ? TFilterInput<T[K & keyof T]>
    : TFilterType;
};

export const operatorMap = {
  equals: "=",
  not: "!=",
  in: "IN",
  notIn: "NOT IN",
  lt: "<",
  lte: "<=",
  gt: ">",
  gte: ">=",
} as const;

export type TGenericOperator = keyof typeof operatorMap;

export type TGenericFilter<T> = {
  [K in TGenericOperator]?: K extends "in" | "notIn" ? T[] : T;
};

export type TFindArgs<T> = {
  pagination?: PaginationInput;
  filters?: TFilterInput<T>;
  relations?: FindOptionsRelations<T>;
};

export interface TFindArgsWithRelations<T> extends TFindArgs<T> {
  relations?: FindOptionsRelations<T>;
}

