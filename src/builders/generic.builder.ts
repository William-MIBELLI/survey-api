import { PaginationInput, StringFilterInput } from "generated/graphql";
import { GraphQLError } from "graphql";
import {
  operatorMap,
  TFilterInput,
  TFilterType,
  TGenericOperator,
} from "interfaces/generic.interface";
import { EntityMetadata, EntityTarget, ObjectLiteral, SelectQueryBuilder } from "typeorm";
import { decodeCursor } from "utils/pagination.utils";
import { appDataSource } from "lib/datasource";

export type TFilterHandler<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
  filterValue: TFilterType | Record<string, any>,
  key: keyof T,
  alias?: string
) => void;

export default class GenericQueryBuilder<T extends ObjectLiteral> {
  protected qb: SelectQueryBuilder<T>;
  protected filterHandlers: Map<string, TFilterHandler<T>> = new Map();
  protected tableName: string;
  protected metadata: EntityMetadata;

  constructor(entity: EntityTarget<T>, initialQuery?: SelectQueryBuilder<T>) {
    const repo = appDataSource.getRepository(entity);
    this.tableName = repo.metadata.tableName;
    if (initialQuery) {
      this.qb = initialQuery
    } else {
      this.qb = repo.createQueryBuilder(this.tableName);
    }
    this.metadata = repo.metadata;
    this.initialiseFilters();
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

  protected applyRelations: TFilterHandler<T> = (qb, filter, key, parentAlias = this.tableName) => {

    const relationName = String(key)
    const alias = relationName
    const isAlreadyJoined = qb.expressionMap.aliases.some(a => a.name === relationName)
    if (!isAlreadyJoined) {
      qb.leftJoinAndSelect(`${parentAlias}.${relationName}`, relationName)
    }
    const relation = this.metadata.relations.find(r => r.propertyName === relationName)
    if (!relation) return
    
    const relationMetadata = relation.inverseEntityMetadata

    Object.entries(filter).forEach(([subKey, subValue]) => {

      const column = relationMetadata.columns.find(c => c.propertyName === subKey)
       if (column) {
        if (column.type === String || column.type === "varchar" || column.type === "text") {
          this.applyStringFilter(qb, subValue as any, subKey as any, alias);
        } else {
          this.applyComparisonFilter(qb, subValue as any, subKey as any, alias);
        }
      }
    })
  }

  protected initialiseFilters() {
    this.metadata.columns.forEach((column) => {
      if (column.type === String || column.type === "varchar" || column.type === "text") {
        this.filterHandlers.set(column.propertyName, this.applyStringFilter);
      } else {
        this.filterHandlers.set(column.propertyName, this.applyComparisonFilter);
      }
    });
    this.metadata.relations.forEach(rel => {
      this.filterHandlers.set(rel.propertyName, this.applyRelations)
    })

  }

  public build(): SelectQueryBuilder<T> {
    return this.qb;
  }

  protected applyComparisonFilter: TFilterHandler<T> = (
    qb: SelectQueryBuilder<T>,
    filter: TFilterType,
    key: keyof T,
    alias = this.tableName
  ) => {
    const column = `${alias}.${String(key)}`;

    Object.entries(filter).forEach(([k, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      const paramName = `${alias}_${String(key)}_${k}`;

      const isGenericOperation = Object.hasOwn(operatorMap, k);

      if (isGenericOperation) {
        const type = k as TGenericOperator;
        const operatorSign = operatorMap[type];
        if ( type === "notIn") {
          qb.andWhere(`${column} != ALL(:${paramName})`, {
            [paramName]: value,
          });
          return;
        }
        if (type === "in") {
          qb.andWhere(`${column} = ANY(:${paramName})`, {
            [paramName]: value,
          });
          return;
        }
        qb.andWhere(`${column} ${operatorSign} :${paramName}`, { [paramName]: value });
      }
    });
  };

  protected applyStringFilter = (
    qb: SelectQueryBuilder<T>,
    filter: TFilterType,
    key: keyof T,
    alias = this.tableName
  ) => {
    if (typeof filter !== "object" || filter === null) {
      return;
    }

    this.applyComparisonFilter(qb, filter, key, alias);

    const column = `${alias}.${String(key)}`;
    const stringFilter = filter as StringFilterInput;
    const paramBase = `${alias}_${String(key)}`

    if (stringFilter.contains) {
      qb.andWhere(`${column} LIKE :${paramBase}_contains`, { [`${paramBase}_contains`]: `%${stringFilter.contains}%` });
    }
    if (stringFilter.endsWith) {
      qb.andWhere(`${column} LIKE :${paramBase}_endsWith`, { [`${paramBase}_endsWith`]: `%${stringFilter.endsWith}` });
    }
    if (stringFilter.startsWith) {
      qb.andWhere(`${column} LIKE :${paramBase}_startsWith`, {
        [`${paramBase}_startsWith`]: `${stringFilter.startsWith}%`,
      });
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
    const isPaginationBackwards = !!last || !!before;

    const order = isPaginationBackwards ? "DESC" : "ASC";
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
