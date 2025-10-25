import UserQueryBuilder from "builders/user.builder";
import { BooleanFilterInput, DateFilterInput, IntFilterInput, PaginationInput, StringFilterInput } from "generated/graphql";
import { GraphQLError } from "graphql";
import { Edge, TConnection, TFilterInput } from "interfaces/generic.interface";
import GenericRepository from "repositories/generic.repo";
import { DeepPartial, EntityTarget, FindOptionsWhere, ObjectLiteral, Repository } from "typeorm";
import { cursorEncoder, decodeCursor } from "utils/pagination.utils";

export default abstract class GenericService<T extends ObjectLiteral> {
  protected repo: Repository<T>;

  constructor(entity: EntityTarget<T>) {
    this.repo = new GenericRepository<T>().getInstance(entity);
  }

  //CREER UNE INSTANCE DE T
  public async createOne(entity: DeepPartial<T>) {
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

    const filterBuilder = new UserQueryBuilder()
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

    //OPN BOUCLE SUR LES FILTERS
    Object.entries(filters).forEach(([key, filter]) => {

      //ON RECUPERE LES METADATA DE LA COLONNE CORRESPONDANTE A LA KEY
      const columnMetatada = this.repo.metadata.columns.find((col) => col.propertyName === key);

      //SI PAS DE COLUMN, ON THROW UNE ERROR
      if (!columnMetatada) {
        throw new GraphQLError('NO FIELDS WITH THIS KEY : ' + key, {
          extensions: {
            code: "FIELDS_ERROR",
            fields: key
          }
        })
      }
      //SELON LE TYPE DE LA COLONNE, ON DEFINIT LE TYPE DE FILTER
      const { type } = columnMetatada
      if (type === Number || type === "int" || type === "float") {
        const nbfilter = filter as IntFilterInput
        
      }

      if (type === String || type === "text" || type === "varchar") {
        const stfilter = filter as StringFilterInput
      }

      if (type === Boolean || type === "bool" || type === "boolean") {
        const boolfilter = filter as BooleanFilterInput
      }

      if (type === Date || type === "date") {
        const datefilter = filter as DateFilterInput
      }
      
    });
    console.log(filters);
    return [];
  }

  private createQueryFilter(filters : IntFilterInput) {

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
