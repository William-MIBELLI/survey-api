import { BooleanFilterInput, DateFilterInput, IntFilterInput, StringFilterInput } from "generated/graphql";
import { FindOptionsWhere, ObjectLiteral } from "typeorm";

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

export interface TEntity extends ObjectLiteral {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TReturn<T> {
  list: T[];
  count: number;
}

export type TFilterType = StringFilterInput | IntFilterInput | DateFilterInput | BooleanFilterInput;

export type TFilterInput<T> = {
  [k in keyof FindOptionsWhere<T>]: TFilterType;
};

export const operatorMap = {
  equals: '=',
  not: '!=',
  in: 'IN',
  notIn: 'NOT IN',
  lt: '<',
  lte: '<=',
  gt: '>',
  gte: '>=',
} as const;

export type TGenericOperator = keyof typeof operatorMap

export type TGenericFilter<T> = {
  [K in TGenericOperator]?: K extends "in" | "notIn" ? T[] : T
}



