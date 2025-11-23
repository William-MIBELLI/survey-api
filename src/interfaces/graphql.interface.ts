import { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import AuthService from "services/auth.service";
import SurveyService from "services/survey.service";
import UserService from "services/user.service";
import { ObjectLiteral } from "typeorm";
import { Request, Response } from "express";
import UserEntity from "entities/user.entity";
import QuestionService from "services/question.service";
import OptionService from "services/option.service";

export type ResolverFn<TArgs = {}> = (
  source: any,
  args: TArgs,
  context: MyContext,
  info: GraphQLResolveInfo,
) => any;


export type ResolverWrapper<TArgs = {}> = (
  next: ResolverFn<TArgs>,
) => ResolverFn<TArgs>;



export interface MyContext<T extends ObjectLiteral = {}> {
  req: Request;
  res: Response;
  user?: UserEntity | null;
  services: {
    userService: UserService;
    authService: AuthService;
    surveyService: SurveyService;
    questionService: QuestionService;
    optionService: OptionService;
  };
  preload?: {
    entity: T;
  };
}

