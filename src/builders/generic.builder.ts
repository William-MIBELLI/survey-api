import {
  StringFilterInput,
} from "generated/graphql";
import { operatorMap, TFilterInput, TFilterType, TGenericOperator,  } from "interfaces/generic.interface";
import GenericRepository from "repositories/generic.repo";
import { EntityMetadata, EntityTarget, ObjectLiteral, SelectQueryBuilder } from "typeorm";

export type TFilterHandler<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
  filterValue: TFilterType,
  key: keyof T,
) => void;


export default abstract class GenericQUeryBuilder<T extends ObjectLiteral> {
  protected qb: SelectQueryBuilder<T>;
  protected abstract filterHandlers: Map<string, TFilterHandler<T>>;
  protected tableName: string;
  protected metadata: EntityMetadata

  constructor(entity: EntityTarget<T>) {
    const repo = new GenericRepository<T>().getInstance(entity);
    this.tableName = repo.metadata.tableName;
    this.qb = repo.createQueryBuilder(this.tableName);
    this.metadata = repo.metadata
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

  protected abstract initialiseFilters() : void


  protected applyComparisonFilter: TFilterHandler<T> = (
    qb: SelectQueryBuilder<T>,
    filter: TFilterType,
    key: keyof T,
  ) => {

    const column = `${this.tableName}.${String(key)}`;

    Object.entries(filter).forEach(([k, value]) => {

      if (value === undefined || value === null) {
        return
      }

      const paramName = `${String(key)}_${k}`
      const isGenericOperation = Object.hasOwn(operatorMap, k)
      
      if (isGenericOperation) {
        const type = k as TGenericOperator
        const operatorSign = operatorMap[type]
        if (type === "in" || type === "notIn") {
          qb.andWhere(`${column} ${operatorSign} :(${paramName})`, { [paramName]: value})
          
        } else {
          qb.andWhere(`${column} ${operatorSign} :${paramName}`, { [paramName]: value})

        }
      }

    })
  };

  protected applyStringFilter = (
    qb: SelectQueryBuilder<T>,
    filter: TFilterType,
    key: keyof T,
  ) => {
    if (typeof filter !== "object" || filter === null) {
      return
    }

    this.applyComparisonFilter(qb, filter, key)
    
    const column = `${this.tableName}.${String(key)}`;
    const stringFilter = filter as StringFilterInput

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
}
