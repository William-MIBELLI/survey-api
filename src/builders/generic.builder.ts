import { PaginationInput, StringFilterInput } from "generated/graphql";
import { GraphQLError } from "graphql";
import {
  operatorMap,
  TFilterInput,
  TFilterType,
  TGenericOperator,
} from "interfaces/generic.interface";
import GenericRepository from "repositories/generic.repo";
import { EntityMetadata, EntityTarget, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { decodeCursor } from "utils/pagination.utils";

export type TFilterHandler<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
  filterValue: TFilterType,
  key: keyof T,
) => void;

export default abstract class GenericQueryBuilder<T extends ObjectLiteral> {
  protected qb: SelectQueryBuilder<T>;
  protected abstract filterHandlers: Map<string, TFilterHandler<T>>;
  protected tableName: string;
  protected metadata: EntityMetadata;

  constructor(entity: EntityTarget<T>) {
    const repo = new GenericRepository<T>().getInstance(entity);
    this.tableName = repo.metadata.tableName;
    this.qb = repo.createQueryBuilder(this.tableName);
    this.metadata = repo.metadata;
  }

  public applyFilters(filters: TFilterInput<T>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (this.filterHandlers.has(key)) {
        const handler = this.filterHandlers.get(key);
        if (handler && value !== null && value !== undefined) {
          handler(this.qb, value, key);
        }
      }
    });
    return this;
  }

  protected abstract initialiseFilters(): void;

  public build(): SelectQueryBuilder<T> {
    return this.qb;
  }

  protected applyComparisonFilter: TFilterHandler<T> = (
    qb: SelectQueryBuilder<T>,
    filter: TFilterType,
    key: keyof T,
  ) => {
    const column = `${this.tableName}.${String(key)}`;

    Object.entries(filter).forEach(([k, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      const paramName = `${String(key)}_${k}`;
      const isGenericOperation = Object.hasOwn(operatorMap, k);

      if (isGenericOperation) {
        const type = k as TGenericOperator;
        const operatorSign = operatorMap[type];
        if (type === "in" || type === "notIn") {
          qb.andWhere(`${column} ${operatorSign} :(${paramName})`, { [paramName]: value });
          return;
        }
        qb.andWhere(`${column} ${operatorSign} :${paramName}`, { [paramName]: value });
      }
    });
  };

  protected applyStringFilter = (qb: SelectQueryBuilder<T>, filter: TFilterType, key: keyof T) => {
    if (typeof filter !== "object" || filter === null) {
      return;
    }

    this.applyComparisonFilter(qb, filter, key);

    const column = `${this.tableName}.${String(key)}`;
    const stringFilter = filter as StringFilterInput;

    if (stringFilter.contains) {
      qb.andWhere(`${column} LIKE :contains`, { contains: `%${stringFilter.contains}%` });
    }
    if (stringFilter.endsWith) {
      qb.andWhere(`${column} LIKE :endsWith`, { endsWith: `%${stringFilter.endsWith}` });
    }
    if (stringFilter.startsWith) {
      qb.andWhere(`${column} LIKE :startsWith`, { startsWith: `${stringFilter.startsWith}%` });
    }
  };

  public applyPagination(args: PaginationInput): this {
    const { first, after, before, last } = args;

    //TESTS DE LA PAGINATION
    if (first && first <= 0) {
      throw new GraphQLError("Argument 'first' must be a positive integer.", {
        extensions: {
          type: "PAGINATION_ERROR",
        },
      });
    }
    if (last && last <= 0) {
      throw new GraphQLError("Argument 'last' must be a positive integer.", {
        extensions: {
          type: "PAGINATION_ERROR",
        },
      });
    }
    if (first && last) {
      throw new GraphQLError("Cannot use 'first' and 'last' arguments together.", {
        extensions: {
          type: "PAGINATION_ERROR",
        },
      });
    }
    if (after && before) {
      throw new GraphQLError("Cannot use 'after' and 'before' arguments together.", {
        extensions: {
          type: "PAGINATION_ERROR",
        },
      });
    }

    //MISE EN PLACE DES PARAMETRES POUR LA QUERY
    const { tableName } = this.metadata;
    const colCreated = `${tableName}.createdAt`;
    const colId = `${tableName}.id`;
    const isPaginationBackwards = !!last || !!before

    const order = isPaginationBackwards ? "DESC" : "ASC"
    const operator = isPaginationBackwards ? "<" : ">";
    const cursor = isPaginationBackwards ? before : after;
    
    const take = first ?? last ?? 10;

    this.qb.orderBy(colCreated, order);
    this.qb.addOrderBy(colId, order);

    if (cursor) {

      const { createdAt, id } = decodeCursor(cursor);

      this.qb.andWhere(
        `(${colCreated} ${operator} :pag_createdAt::timestamptz OR (${colCreated} = :pag_createdAt::timestamptz AND ${colId} ${operator} :pag_id::uuid))`,
        { pag_createdAt: createdAt, pag_id: id },
      );
    }

    this.qb.take(take + 1);

    return this;
  }
}
