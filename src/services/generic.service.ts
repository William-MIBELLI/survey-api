import GenericQueryBuilder from "builders/generic.builder";
import UserQueryBuilder from "builders/user.builder";
import UserEntity from "entities/user.entity";
import { BooleanFilterInput, DateFilterInput, IntFilterInput, PaginationInput, StringFilterInput } from "generated/graphql";
import { GraphQLError } from "graphql";
import { Edge, TConnection, TFilterInput } from "interfaces/generic.interface";
import GenericRepository from "repositories/generic.repo";
import { DeepPartial, EntityTarget, FindOptionsWhere, ObjectLiteral, Repository, SelectQueryBuilder } from "typeorm";
import { cursorEncoder, decodeCursor } from "utils/pagination.utils";

export default abstract class GenericService<T extends ObjectLiteral> {

  protected repo: Repository<T>;
  protected abstract filterBuilder: GenericQueryBuilder<T>

  constructor(entity: EntityTarget<T>) {
    this.repo = new GenericRepository<T>().getInstance(entity);
  }

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
  public async findAll(pagination: PaginationInput): Promise<TConnection<T>> {

    const { first, after, before, last } = pagination;

    // //TESTS DE LA PAGINATION
    // if (first && first <= 0) {
    //   throw new Error("Argument 'first' must be a positive integer.");
    // }
    // if (last && last <= 0) {
    //   throw new Error("Argument 'last' must be a positive integer.");
    // }
    // if (first && last) {
    //   throw new Error("Cannot use 'first' and 'last' arguments together.");
    // }
    // if (after && before) {
    //   throw new Error("Cannot use 'after' and 'before' arguments together.");
    // }

    // //MISE EN PLACE DES PARAMETRE POUR LA QUERY
    // const name = this.repo.metadata.name;
    // const colCreated = `${name}.createdAt`;
    // const colId = `${name}.id`;
    // const order = first ? "ASC" : "DESC";
    const take = first ?? last ?? 10;

    // //CREATION DE LA QUERY
    // const query = this.repo.createQueryBuilder();
    // query.orderBy(colCreated, order);
    // query.addOrderBy(colId, order);
    // if (after) {
    //   const { createdAt, id } = decodeCursor(after);
    //   query.where(`${colCreated} > :createdAt OR ${colCreated} = :createdAt AND ${colId} > :id`, { createdAt, id });
    // }
    // if (before) {
    //   const { createdAt, id } = decodeCursor(before);
    //   query.where(`${colCreated} < :createdAt OR ${colCreated} = :createdAt AND ${colId} < :id`, { createdAt, id });
    // }
    // query.take(take + 1);
    const query = new UserQueryBuilder().applyPagination(pagination).build() as unknown as SelectQueryBuilder<T>
    //RECUPERATION DES DATAS
    const list = await query.getMany();
    const count = await query.getCount();
    console.log("COUNT : ", count)
    const hasMore = list.length > take;
    if (hasMore) list.pop();

    //CONSTRUCTION DU PAGEINFO
    let hasNextPage: boolean;
    let hasPreviousPage: boolean;

    if (before) {
      list.reverse();
      hasNextPage = !!before;
      hasPreviousPage = hasMore;
    } else {
      hasNextPage = hasMore;
      hasPreviousPage = !!after;
    }

    //CONSTRUCTION DU EDGES
    const edges: Edge<T>[] = list.map((item) => {
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
  public async findByProperties(filters: TFilterInput<T>): Promise<T[]> {
    const qbfilters = new UserQueryBuilder().applyFilters(filters).build()
    const users = await qbfilters.getMany() as unknown as T[]
    return users
  }

  //DELETE
  public async deleteOne(id: string): Promise<boolean> {
    const deleted = await this.repo.delete({ id: id as any });
    if (!deleted.affected || deleted.affected === 0) {
      return false;
    }
    return true;
  }

  //UPDATE
  public async updateOne(id: string, entity: Partial<T>): Promise<T> {
    const updated = await this.repo.update(id, entity);
    if (!updated) {
      throw new Error("Nothing affected.");
    }
    const updatedEntity = await this.findById(id);

    if (!updatedEntity) {
      throw new Error("Entity not found after update");
    }
    return updatedEntity;
  }
}
