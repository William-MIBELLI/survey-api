import {
  BooleanFilterInput,
  DateFilterInput,
  IntFilterInput,
  StringFilterInput,
} from "generated/graphql";
import { TFilterInput, TFilterType } from "interfaces/generic.interface";
import GenericRepository from "repositories/generic.repo";
import { EntityTarget, ObjectLiteral, SelectQueryBuilder } from "typeorm";

type TFilterHandler<T extends ObjectLiteral> = (
  qb: SelectQueryBuilder<T>,
  filterValue: TFilterType,
  key: keyof T,
) => void;

export default abstract class GenericQUeryBuilder<T extends ObjectLiteral> {
  protected qb: SelectQueryBuilder<T>;
  protected abstract filterHandlers: Map<string, TFilterHandler<T>>;
  protected tableName: string;

  constructor(entity: EntityTarget<T>) {
    const repo = new GenericRepository<T>().getInstance(entity);
    this.tableName = repo.metadata.tableName;
    this.qb = repo.createQueryBuilder(this.tableName);
    this.initialiseGenericFilters();
  }

  public applyFilters(filters: TFilterInput<T>): this {
    Object.entries(filters).forEach(([key, value]) => {
      if (this.filterHandlers.has(key)) {
        const handler = this.filterHandlers.get(key);
        if (handler && value) {
          handler(this.qb, value, key);
        }
      }
    });
    return this;
  }

  private initialiseGenericFilters() {
    this.filterHandlers.set("createdAt", this.applyDateFilter);
    this.filterHandlers.set("updatedAt", this.applyDateFilter);
  }

  protected applyDateFilter = (
    qb: SelectQueryBuilder<T>,
    filter: DateFilterInput,
    key: keyof T,
  ) => {
    const column = `${this.tableName}.${String(key)}`;

    if (filter.equals) {
      qb.andWhere(`${column} = :date`, { date: filter.equals });
    }
    if (filter.gt) {
      qb.andWhere(`${column} > :date`, { date: filter.gt });
    }
    if (filter.gte) {
      qb.andWhere(`${column} >= :date`, { date: filter.gte });
    }
    if (filter.lt) {
      qb.andWhere(`${column} < :date`, { date: filter.gt });
    }
    if (filter.lte) {
      qb.andWhere(`${column} <= :date`, { date: filter.lte });
    }
  };

  protected applyStringFilter = (
    qb: SelectQueryBuilder<T>,
    filter: StringFilterInput,
    key: keyof T,
  ) => {
    
    const column = `${this.tableName}.${String(key)}`;

    if (filter.contains) {
      qb.andWhere(`${column} LIKE :string`, { string: `%${filter.contains}%`})
    }
    if (filter.endsWith) {
      qb.andWhere(`${column} LIKE :string`, { string: `%${filter.endsWith}`})
    }
    if (filter.equals) {
      qb.andWhere(`${column} = :string`, { string: filter.equals})
    }
    if (filter.in) {
      qb.andWhere(`${column} IN (:string)`,  { string: `${filter.in.join(',')}`})
    }
    if (filter.notIn) {
      qb.andWhere(`${column} NOT IN (:string)`, { string: `${filter.notIn.join(',')}`})
    }
    if (filter.not) {
      qb.andWhere(`${column} NOT (:string)`, { string: filter.not})
    }
    if (filter.startsWith) {
      qb.andWhere(`${column} LIKE :string`, { string: `${filter.startsWith}%`})
    }
  };
}
