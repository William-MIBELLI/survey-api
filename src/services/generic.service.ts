import { Cursor, PageInfo, PaginationInput } from "generated/graphql";
import { Edge, TConnection, TEntity, TReturn } from "interfaces/generic.interface";
import { appDataSource } from "lib/datasource";
import GenericRepository from "repositories/generic.repo";
import { DeepPartial, EntityTarget, ObjectLiteral, Repository } from "typeorm";
import { cursorEncoder, decodeCursor } from "utils/pagination.utils";

export default abstract class GenericService<T extends ObjectLiteral> {
  protected repo: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repo = new GenericRepository<T>().getInstance(entity);
  }

  //CREER UNE INSTANCE DE T
  public async createOne(entity: DeepPartial<T>) {
    console.log('CREATE ARGS : ', entity)
    const created = await this.repo.save(this.repo.create(entity));
    //ON RECHERCHE AVEC UN FIND POUR RECUPERER LES RELATIONS EN MEME TEMPS
    const finded = await this.repo.findOne({ where: { id: created.id } });
    if (!finded) {
      throw new Error("Impossible de créer l'entité");
    }

    return finded;
  }

  //RECUPERER TOUTES LES INSTANCES
  public async findAll(pagination: PaginationInput): Promise<TConnection<T>> {
    const { first, after, before, last } = pagination;

    //TESTS DE LA PAGINATION
    if (first && first <= 0) {
      throw new Error("Argument 'first' must be a positive integer.");
    }
    if (last && last <= 0) {
      throw new Error("Argument 'last' must be a positive integer.");
    }
    if (first && last) {
      throw new Error("Cannot use 'first' and 'last' arguments together.");
    }
    if (after && before) {
      throw new Error("Cannot use 'after' and 'before' arguments together.");
    }

    //MISE EN PLACE DES PARAMETRE POUR LA QUERY
    const name = this.repo.metadata.name;
    const colCreated = `${name}.createdAt`;
    const colId = `${name}.id`;
    const order = first ? "ASC" : "DESC";
    const take = first ?? last ?? 10;

    //CREATION DE LA QUERY
    const query = this.repo.createQueryBuilder();
    query.orderBy(colCreated, order);
    query.addOrderBy(colId, order);
    if (after) {
      const { createdAt, id } = decodeCursor(after);
      query.where(`${colCreated} > :createdAt OR ${colCreated} = :createdAt AND ${colId} > :id`, { createdAt, id });
    }
    if (before) {
      const { createdAt, id } = decodeCursor(before);
      query.where(`${colCreated} < :createdAt OR ${colCreated} = :createdAt AND ${colId} < :id`, { createdAt, id });
    }
    query.take(take + 1);

    //RECUPERATION DES DATAS
    const list = await query.getMany();
    const count = await this.repo.count();

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
      hasNextPage = hasMore
      hasPreviousPage = !!after
    }

    //CONSTRUCTION DU EDGES
    const edges: Edge<T>[] = list.map(item => {
      return {
        cursor: cursorEncoder({ createdAt: item.createdAt, id: item.id }),
        node: item
      }
    })


    return {
      edges,
      totalCount: count,
      pageInfo: {
        hasNextPage,
        hasPreviousPage,
        
      }
    };
  }

  //RECUPERER UNE INSTANCE VIA SON ID
  public async findById(id: string) {
    const ad = await this.repo.findOne({
      where: {
        id,
      } as any,
    });

    return ad;
  }

  // //RECUPERER VIA PLUSIEURS PROPRIETES
  // public async findByProperties(
  //   fields: FindOptionsWhere<T>,
  //   pag?: PaginationInput
  // ): Promise<T[]> {
  //   const { created, limit, order } = this.getPagination(pag);
  //   return await this.repo.find({
  //     where: {
  //       ...fields,
  //       createdAt: Raw((alias) => `${alias} >= :created`, { created }),
  //     } as any,
  //     take: limit,
  //     order: {
  //       createdAt: order,
  //     } as any,
  //   });
  // }

  // //RECUPERER ENTRE 2 DATES DE CREATION
  // public async findByCreationSlot(data: ByCreationSlotInput): Promise<T[]> {
  //   const { start, end, name, pagination } = data;

  //   const startDate = pagination?.created || start

  //   const result = await this.repo
  //     .createQueryBuilder(name)
  //     .where(`${name}.createdAt >= :start`, { start: new Date(startDate) })
  //     .andWhere(`${name}.createdAt <= :end`, { end: new Date(end) })
  //     .orderBy(`${name}.createdAt `, pagination?.order || "ASC")
  //     .limit(pagination?.limit || 20)
  //     .getMany();

  //   return result;
  // }

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
