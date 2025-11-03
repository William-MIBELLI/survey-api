import { User } from "generated/graphql";
import { GraphQLFieldResolver } from "graphql";
import AuthService from "services/auth.service";
import SurveyService from "services/survey.service";
import UserService from "services/user.service";
import { ObjectLiteral } from "typeorm";
import { Request, Response } from "express";
import UserEntity from "entities/user.entity";

export type ResolverWrapper<TSource = any, TArgs = { id: string }, TResult = any> = (
  next: GraphQLFieldResolver<TSource, MyContext, TArgs, TResult>,
) => GraphQLFieldResolver<TSource, MyContext, TArgs, TResult>;

export interface MyContext<T extends ObjectLiteral = {}> {
  req: Request
  res: Response
  user?: UserEntity | null;
  services: {
    userService: UserService;
    authService: AuthService;
    surveyService: SurveyService
  };
  preload?: {
    entity: T
  }
}