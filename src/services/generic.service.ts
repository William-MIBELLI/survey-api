import GenericQueryBuilder from "builders/generic.builder";
import UserEntity from "entities/user.entity";
import { PaginationInput } from "generated/graphql";
import { Edge, TConnection, TFilterInput, TFindArgs } from "interfaces/generic.interface";
import {
  DeepPartial,
  EntityTarget,
  ObjectLiteral,
  QueryBuilder,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import { cursorEncoder } from "utils/pagination.utils";

export default abstract class GenericService<T extends ObjectLiteral> {
  constructor(
    protected repo: Repository<T>,
  ) {}

  //CREER UNE INSTANCE DE T
  public async createOne(entity: DeepPartial<T>) {
    const created = await this.repo.save(this.repo.create(entity));
    const found = await this.repo.findOne({ where: { id: created.id } });
    if (!found) {
      throw new Error("Impossible de créer l'entité");
    }

    return found;
  }

  //RECUPERER TOUTES LES INSTANCES
  public async findAll(
    data: TFindArgs<T>,
    initialFilter?: SelectQueryBuilder<T>,
  ): Promise<TConnection<T>> {
    const { pagination, ...filters } = data;
    const filterBuilder = new GenericQueryBuilder<T>(this.repo.target, initialFilter)

    if (filters) {
      filterBuilder.applyFilters(filters as TFilterInput<T>);
    }

    if (pagination) {
      filterBuilder.applyPagination(pagination);
    }

    const query = filterBuilder.build();
    const list = await query.getMany();
    const count = await query.getCount();

    const connection = this.buildConnection(list, count, pagination);

    return connection;
  }

  protected buildConnection(
    queryResult: T[],
    count: number,
    pagination?: PaginationInput,
  ): TConnection<T> {
    const { first, after, before, last } = pagination || {};

    const take = first ?? last ?? 10;

    //RECUPERATION DES DATAS
    const hasMore = queryResult.length > take;
    if (hasMore) queryResult.pop();

    //CONSTRUCTION DU PAGEINFO
    let hasNextPage: boolean;
    let hasPreviousPage: boolean;

    if (before) {
      queryResult.reverse();
      hasNextPage = !!before;
      hasPreviousPage = hasMore;
    } else {
      hasNextPage = hasMore;
      hasPreviousPage = !!after;
    }

    //CONSTRUCTION DU EDGES
    const edges: Edge<T>[] = queryResult.map((item) => {
      return {
        cursor: cursorEncoder({ createdAt: item.createdAt, id: item.id }),
        node: item,
      };
    });

    return {
      edges,
      totalCount: count,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
      },
    };
  }

  //RECUPERER UNE INSTANCE VIA SON ID&
  public async findById(id: string) {
    const ad = await this.repo.findOne({
      where: {
        id,
      } as any,
    });

    return ad;
  }

  //RECUPERER VIA PLUSIEURS PROPRIETES
  public async findByProperties(data: TFilterInput<T>): Promise<T[]> {
    const filterBuilder = new GenericQueryBuilder<T>(this.repo.target)
    const query = filterBuilder.applyFilters(data).build();
    const res = await query.getMany();
    return res;
  }

  //DELETE
  public async deleteOne(entityToDelete: T): Promise<boolean> {
    const deleted = await this.repo.remove(entityToDelete);
    if (!deleted) {
      return false;
    }
    return true;
  }

  //UPDATE
  public async updateOne(initialEntity: T, partialEntity: DeepPartial<T>): Promise<T> {
    const merged = this.repo.merge(initialEntity, partialEntity);
    // const updated = await this.repo.save(toSaved, {})
    // if (!updated) {
    //   throw new Error("Nothing affected.");

    // const updatedEntity = await this.findById(id);
    // const res = updated.generatedMaps
    // console.log("RES DANS UPDATE : ", res)

    // if (!updatedEntity) {
    //   throw new Error("Entity not found after update");
    // }
    return this.repo.save(merged);
  }
}
